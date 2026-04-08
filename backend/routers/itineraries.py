"""
routers/itineraries.py
Core itinerary CRUD, forking, collaboration, days, activities,
accommodations, and transportation.
"""
import logging
from datetime import date as date_type
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import models, schemas
from database import get_db

logger = logging.getLogger(__name__)

def _pick_cover_photo(db, itinerary) -> Optional[str]:
    """
    Choose the best cover photo for an itinerary, strongly preferring
    tourist attractions and scenic places over hotels and restaurants.

    Place type priority tiers:
      Tier 0 (best)  — tourist_attraction, natural_feature, park, place_of_worship,
                       point_of_interest, landmark, museum, stadium
      Tier 1         — any other place with a photo (lake, mountain, trail…)
      Tier 2         — lodging/restaurant/food — used only as last resort

    Within each tier, highest rating wins.
    """
    # Place type keywords that indicate a scenic / attraction place
    ATTRACTION_TYPES = {
        "tourist_attraction", "natural_feature", "park",
        "place_of_worship", "point_of_interest", "museum",
        "hindu_temple", "church", "mosque", "stadium",
        "amusement_park", "aquarium", "zoo", "campground",
        "rv_park", "route", "premise",
    }
    # Types to avoid as cover photos
    AVOID_TYPES = {
        "lodging", "restaurant", "food", "cafe", "bar",
        "grocery_or_supermarket", "shopping_mall", "store",
        "gas_station", "bank", "atm", "pharmacy",
    }

    def _tier(place) -> int:
        types_str = (place.place_types or "").lower()
        types = {t.strip() for t in types_str.split(",")}
        if types & ATTRACTION_TYPES:
            return 0
        if types & AVOID_TYPES:
            return 2
        return 1

    def _best_from(places_query):
        """Return best photo_reference from a query, ranked by tier then rating."""
        candidates = places_query.filter(
            models.Place.photo_reference.isnot(None)
        ).all()
        if not candidates:
            return None
        # Sort: tier ASC (0 = best), then rating DESC
        candidates.sort(key=lambda p: (_tier(p), -(p.rating or 0)))
        return candidates[0].photo_reference

    # Parse destination into individual cities
    cities = [c.strip() for c in (itinerary.destination or "").split(",") if c.strip()]

    # Collect this itinerary's activity place_ids
    activity_place_ids = [
        act.place_id
        for day in itinerary.days
        for act in day.activities
        if act.place_id
    ]

    # Strategy 1 (BEST): Places actually visited in this itinerary, attraction-tiered.
    # Each itinerary gets a photo from its own stops — no more shared city photos.
    if activity_place_ids:
        result = _best_from(
            db.query(models.Place).filter(
                models.Place.google_place_id.in_(activity_place_ids),
            )
        )
        if result:
            return result

    # Strategy 2: Raw photo on sightseeing/cultural activities in this itinerary
    SIGHTSEEING_TYPES = {"sightseeing", "destination", "adventure", "cultural", "leisure"}
    good_acts = sorted(
        [a for day in itinerary.days for a in day.activities
         if a.photo_reference and (a.activity_type or "") in SIGHTSEEING_TYPES],
        key=lambda a: -(a.rating or 0),
    )
    if good_acts:
        return good_acts[0].photo_reference

    # Strategy 3: City pool fallback — exclude food/lodging types explicitly
    if cities:
        city_q = (
            db.query(models.Place)
            .filter(
                models.Place.city.in_(cities),
                models.Place.photo_reference.isnot(None),
            )
            .all()
        )
        # Filter out obvious non-attraction types in Python (avoids complex SQL negation)
        avoid = {"lodging", "restaurant", "food", "cafe", "bar", "store", "bank", "atm"}
        attraction_pool = [
            p for p in city_q
            if not any(
                t.strip() in avoid
                for t in (p.place_types or "").lower().split(",")
            )
        ]
        if attraction_pool:
            attraction_pool.sort(key=lambda p: (_tier(p), -(p.rating or 0)))
            return attraction_pool[0].photo_reference

    # Strategy 4: any activity photo as absolute last resort
    any_act = next(
        (a for day in itinerary.days for a in day.activities if a.photo_reference), None
    )
    return any_act.photo_reference if any_act else None

router = APIRouter(tags=["Itineraries"])


# ── Itinerary CRUD ─────────────────────────────────────────────────────────────
@router.post("/itineraries", response_model=schemas.ItineraryOut, status_code=status.HTTP_201_CREATED)
def create_itinerary(itinerary: schemas.ItineraryCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == itinerary.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    try:
        new = models.Itinerary(**itinerary.dict())
        db.add(new)
        db.commit()
        db.refresh(new)
        return new
    except Exception as e:
        db.rollback()
        logger.error(f"Create itinerary error: {e}")
        raise HTTPException(500, "Failed to create itinerary")


@router.post(
    "/itineraries/complete",
    response_model=schemas.ItineraryDetailOut,
    status_code=status.HTTP_201_CREATED,
)
def create_complete_itinerary(
    itinerary: schemas.ItineraryCreateWithDays, db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == itinerary.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    try:
        data = itinerary.dict(exclude={"days", "accommodations", "transportation", "tags"})
        # normalise destination: strip whitespace, remove blank segments
        if data.get("destination"):
            data["destination"] = ", ".join(
                p.strip() for p in data["destination"].split(",") if p.strip()
            )
        new = models.Itinerary(**data)
        db.add(new)
        db.flush()

        for day_data in itinerary.days:
            day_dict = day_data.dict(exclude={"activities"}) if hasattr(day_data, "dict") else day_data
            db.add(models.ItineraryDay(**day_dict, itinerary_id=new.id))

        for acc in itinerary.accommodations:
            db.add(models.Accommodation(**(acc.dict() if hasattr(acc, "dict") else acc), itinerary_id=new.id))

        for trans in itinerary.transportation:
            db.add(models.Transportation(**(trans.dict() if hasattr(trans, "dict") else trans), itinerary_id=new.id))

        for tag in itinerary.tags:
            db.add(models.ItineraryTag(tag=tag, itinerary_id=new.id))

        db.commit()
        db.refresh(new)
        logger.info(f"Complete itinerary created: {new.title}")
        return new
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Complete create error: {e}")
        raise HTTPException(500, str(e))


@router.get("/itineraries/user/{user_id}")
def get_user_itineraries(
    user_id: int,
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    if not db.query(models.User).filter(models.User.id == user_id).first():
        raise HTTPException(404, "User not found")
    try:
        query = db.query(models.Itinerary).filter(models.Itinerary.user_id == user_id)
        if status_filter:
            query = query.filter(models.Itinerary.status == status_filter)
        itineraries = query.order_by(models.Itinerary.start_date.desc()).all()

        today = date_type.today()
        changed = False
        for i in itineraries:
            old = i.status
            if old in ("cancelled", "draft"):
                continue
            if i.end_date and i.end_date < today:
                i.status = "completed"
            elif i.start_date and i.start_date <= today and i.end_date and i.end_date >= today:
                i.status = "ongoing"
            elif i.start_date and i.start_date > today and old in ("completed", "ongoing"):
                i.status = "planning"
            if i.status != old:
                changed = True
        if changed:
            db.commit()

        results = []
        for i in itineraries:
            d = schemas.ItineraryOut.from_orm(i).dict()
            d["cover_photo"] = _pick_cover_photo(db, i)
            wfa = None
            for day in i.days:
                if day.weather_fetched_at and (wfa is None or day.weather_fetched_at > wfa):
                    wfa = day.weather_fetched_at
            d["weather_fetched_at"] = wfa
            results.append(d)
        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user itineraries error: {e}")
        raise HTTPException(500, "Failed to fetch itineraries")


@router.get("/itineraries/public", response_model=List[schemas.ItinerarySummary])
def get_public_itineraries(
    destination: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    try:
        q = db.query(models.Itinerary).filter(models.Itinerary.is_public == True)
        if destination:
            q = q.filter(models.Itinerary.destination.ilike(f"%{destination}%"))
        itineraries = q.order_by(models.Itinerary.view_count.desc()).offset(offset).limit(limit).all()
        result = []
        for i in itineraries:
            d = schemas.ItinerarySummary.from_orm(i).dict()
            d["total_days"]       = len(i.days)
            d["total_activities"] = sum(len(day.activities) for day in i.days)
            result.append(schemas.ItinerarySummary(**d))
        return result
    except Exception as e:
        logger.error(f"Public itineraries error: {e}")
        raise HTTPException(500, "Failed to fetch public itineraries")


@router.get("/itineraries/{itinerary_id}", response_model=schemas.ItineraryDetailOut)
def get_itinerary_detail(itinerary_id: int, db: Session = Depends(get_db)):
    i = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
    if not i:
        raise HTTPException(404, "Itinerary not found")
    i.view_count += 1
    db.commit()
    return i


@router.put("/itineraries/{itinerary_id}", response_model=schemas.ItineraryOut)
def update_itinerary(
    itinerary_id: int,
    itinerary_update: schemas.ItineraryUpdate,
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    i = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
    if not i:
        raise HTTPException(404, "Itinerary not found")
    if user_id is not None:
        is_owner = i.user_id == user_id
        is_collab = db.query(models.ItineraryCollaborator).filter(
            models.ItineraryCollaborator.itinerary_id == itinerary_id,
            models.ItineraryCollaborator.user_id == user_id,
            models.ItineraryCollaborator.status == "accepted",
        ).first() is not None
        if not is_owner and not is_collab:
            raise HTTPException(403, "Not authorized")
    try:
        for f, v in itinerary_update.dict(exclude_unset=True).items():
            setattr(i, f, v)
        db.commit()
        db.refresh(i)
        return i
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Update itinerary error: {e}")
        raise HTTPException(500, "Failed to update itinerary")


@router.delete("/itineraries/{itinerary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_itinerary(itinerary_id: int, db: Session = Depends(get_db)):
    i = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
    if not i:
        raise HTTPException(404, "Itinerary not found")
    try:
        db.delete(i)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Delete itinerary error: {e}")
        raise HTTPException(500, "Failed to delete itinerary")


# ── Fork ───────────────────────────────────────────────────────────────────────
@router.post("/itineraries/{itinerary_id}/fork")
def fork_itinerary(itinerary_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    original = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
    if not original:
        raise HTTPException(404, "Itinerary not found")
    if not original.is_public:
        raise HTTPException(403, "Cannot fork a private itinerary")
    try:
        fork = models.Itinerary(
            title=f"{original.title} (Fork)",
            destination=original.destination,
            description=original.description,
            start_date=original.start_date,
            end_date=original.end_date,
            estimated_budget=original.estimated_budget,
            currency=original.currency,
            status="planning",
            is_public=False,
            user_id=user_id,
            forked_from=original.id,
        )
        db.add(fork)
        db.flush()
        for tag in original.tags:
            db.add(models.ItineraryTag(tag=tag.tag, itinerary_id=fork.id))
        for day in original.days:
            new_day = models.ItineraryDay(
                itinerary_id=fork.id,
                day_number=day.day_number,
                date=day.date,
                title=day.title,
                description=day.description,
                estimated_cost=day.estimated_cost,
                main_location=day.main_location,
                main_latitude=day.main_latitude,
                main_longitude=day.main_longitude,
            )
            db.add(new_day)
            db.flush()
            for act in day.activities:
                db.add(models.Activity(
                    day_id=new_day.id, title=act.title, description=act.description,
                    location=act.location, latitude=act.latitude, longitude=act.longitude,
                    place_id=act.place_id, formatted_address=act.formatted_address,
                    place_types=act.place_types, rating=act.rating, start_time=act.start_time,
                    end_time=act.end_time, duration_minutes=act.duration_minutes,
                    activity_type=act.activity_type, cost=act.cost,
                    priority=act.priority, display_order=act.display_order, notes=act.notes,
                ))
        db.commit()
        db.refresh(fork)
        return {"id": fork.id, "forked": True, "message": "Itinerary forked successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Fork error: {e}")
        raise HTTPException(500, "Failed to fork itinerary")


# ── Collaborators ──────────────────────────────────────────────────────────────
@router.post("/itineraries/{itinerary_id}/collaborators")
def invite_collaborator(
    itinerary_id: int,
    invite: schemas.CollaboratorInvite,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    i = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
    if not i:
        raise HTTPException(404, "Itinerary not found")
    if i.user_id != user_id:
        raise HTTPException(403, "Only the owner can invite collaborators")
    target = db.query(models.User).filter(models.User.username == invite.username).first()
    if not target:
        raise HTTPException(404, "User not found")
    if target.id == user_id:
        raise HTTPException(400, "Cannot invite yourself")
    if db.query(models.ItineraryCollaborator).filter(
        models.ItineraryCollaborator.itinerary_id == itinerary_id,
        models.ItineraryCollaborator.user_id == target.id,
    ).first():
        raise HTTPException(400, "User is already invited or a collaborator")
    try:
        db.add(models.ItineraryCollaborator(
            itinerary_id=itinerary_id, user_id=target.id,
            invited_by=user_id, role="editor", status="pending",
        ))
        inviter = db.query(models.User).filter(models.User.id == user_id).first()
        db.add(models.Notification(
            user_id=target.id, type="collab_invite",
            message=f"{inviter.username if inviter else 'Someone'} invited you to collaborate on '{i.title}'",
            from_user_id=user_id,
        ))
        db.commit()
        return {"status": "invited", "username": target.username}
    except Exception as e:
        db.rollback()
        logger.error(f"Invite error: {e}")
        raise HTTPException(500, "Failed to invite collaborator")


@router.get("/itineraries/{itinerary_id}/collaborators")
def get_collaborators(itinerary_id: int, db: Session = Depends(get_db)):
    collabs = db.query(models.ItineraryCollaborator).filter(
        models.ItineraryCollaborator.itinerary_id == itinerary_id
    ).all()
    result = []
    for c in collabs:
        u = db.query(models.User).filter(models.User.id == c.user_id).first()
        if u:
            result.append({
                "id": c.id, "user_id": c.user_id, "username": u.username,
                "avatar_id": u.avatar_id, "role": c.role, "status": c.status,
                "invited_by": c.invited_by,
                "created_at": c.created_at.isoformat(),
                "accepted_at": c.accepted_at.isoformat() if c.accepted_at else None,
            })
    return result


@router.patch("/itineraries/{itinerary_id}/collaborators/accept")
def accept_collaboration(itinerary_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    from datetime import datetime
    c = db.query(models.ItineraryCollaborator).filter(
        models.ItineraryCollaborator.itinerary_id == itinerary_id,
        models.ItineraryCollaborator.user_id == user_id,
    ).first()
    if not c:
        raise HTTPException(404, "Collaboration invite not found")
    c.status = "accepted"
    c.accepted_at = datetime.utcnow()
    db.commit()
    return {"status": "accepted"}


@router.patch("/itineraries/{itinerary_id}/collaborators/reject")
def reject_collaboration(itinerary_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    c = db.query(models.ItineraryCollaborator).filter(
        models.ItineraryCollaborator.itinerary_id == itinerary_id,
        models.ItineraryCollaborator.user_id == user_id,
    ).first()
    if not c:
        raise HTTPException(404, "Collaboration invite not found")
    db.delete(c)
    db.commit()
    return {"status": "rejected"}


@router.delete("/itineraries/{itinerary_id}/collaborators/{collab_user_id}")
def remove_collaborator(
    itinerary_id: int, collab_user_id: int,
    user_id: int = Query(...), db: Session = Depends(get_db),
):
    i = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
    if not i:
        raise HTTPException(404, "Itinerary not found")
    c = db.query(models.ItineraryCollaborator).filter(
        models.ItineraryCollaborator.itinerary_id == itinerary_id,
        models.ItineraryCollaborator.user_id == collab_user_id,
    ).first()
    if not c:
        raise HTTPException(404, "Collaborator not found")
    if i.user_id != user_id and collab_user_id != user_id:
        raise HTTPException(403, "Not authorized")
    db.delete(c)
    db.commit()
    return {"status": "removed"}


@router.get("/itineraries/user/{user_id}/pending-collabs")
def get_pending_collabs(user_id: int, db: Session = Depends(get_db)):
    """Return all itineraries where the user has a pending collaboration invite."""
    pending = db.query(models.ItineraryCollaborator).filter(
        models.ItineraryCollaborator.user_id == user_id,
        models.ItineraryCollaborator.status == "pending",
    ).all()
    result = []
    for c in pending:
        itin = db.query(models.Itinerary).filter(models.Itinerary.id == c.itinerary_id).first()
        if not itin:
            continue
        inviter = db.query(models.User).filter(models.User.id == c.invited_by).first()
        result.append({
            "collab_id": c.id,
            "itinerary_id": itin.id,
            "itinerary_title": itin.title,
            "itinerary_destination": itin.destination,
            "invited_by": c.invited_by,
            "invited_by_username": inviter.username if inviter else None,
            "invited_by_avatar_id": inviter.avatar_id if inviter else 1,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })
    return result

@router.get("/itineraries/user/{user_id}/collaborations")
def get_user_collaborations(user_id: int, db: Session = Depends(get_db)):
    """Return all itineraries where the user is an accepted collaborator (not the owner)."""
    accepted = db.query(models.ItineraryCollaborator).filter(
        models.ItineraryCollaborator.user_id == user_id,
        models.ItineraryCollaborator.status == "accepted",
    ).all()
    result = []
    for c in accepted:
        itin = db.query(models.Itinerary).filter(models.Itinerary.id == c.itinerary_id).first()
        if not itin:
            continue
        owner = db.query(models.User).filter(models.User.id == itin.user_id).first()
        cover_photo = _pick_cover_photo(db, itin)
        result.append({
            "id":               itin.id,
            "title":            itin.title,
            "destination":      itin.destination,
            "start_date":       itin.start_date.isoformat() if itin.start_date else None,
            "end_date":         itin.end_date.isoformat()   if itin.end_date   else None,
            "status":           itin.status,
            "estimated_budget": itin.estimated_budget,
            "currency":         itin.currency,
            "cover_photo":      cover_photo,
            "is_public":        itin.is_public,
            "owner_username":   owner.username   if owner else None,
            "owner_avatar_id":  owner.avatar_id  if owner else 1,
            "weather_fetched_at": None,
        })
    return result

# ── Days ───────────────────────────────────────────────────────────────────────
@router.post("/itinerary-days", response_model=schemas.ItineraryDayOut, status_code=status.HTTP_201_CREATED)
def create_day(day: schemas.ItineraryDayCreate, db: Session = Depends(get_db)):
    try:
        new_day = models.ItineraryDay(**day.dict(exclude={"activities"}))
        db.add(new_day)
        db.flush()
        for act in day.activities:
            db.add(models.Activity(**(act.dict() if hasattr(act, "dict") else act), day_id=new_day.id))
        db.commit()
        db.refresh(new_day)
        return new_day
    except Exception as e:
        db.rollback()
        logger.error(f"Create day error: {e}")
        raise HTTPException(500, str(e))


@router.put("/itinerary-days/{day_id}", response_model=schemas.ItineraryDayOut)
def update_day(day_id: int, day_update: schemas.ItineraryDayUpdate, db: Session = Depends(get_db)):
    day = db.query(models.ItineraryDay).filter(models.ItineraryDay.id == day_id).first()
    if not day:
        raise HTTPException(404, "Day not found")
    try:
        for f, v in day_update.dict(exclude_unset=True).items():
            setattr(day, f, v)
        db.commit()
        db.refresh(day)
        return day
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Update day error: {e}")
        raise HTTPException(500, "Failed to update day")


@router.delete("/itinerary-days/{day_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_day(day_id: int, db: Session = Depends(get_db)):
    day = db.query(models.ItineraryDay).filter(models.ItineraryDay.id == day_id).first()
    if not day:
        raise HTTPException(404, "Day not found")
    try:
        db.delete(day)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Delete day error: {e}")
        raise HTTPException(500, "Failed to delete day")


# ── Activities ─────────────────────────────────────────────────────────────────
@router.post("/activities", response_model=schemas.ActivityOut, status_code=status.HTTP_201_CREATED)
def create_activity(activity: schemas.ActivityCreate, db: Session = Depends(get_db)):
    try:
        new = models.Activity(**activity.dict())
        db.add(new)
        db.commit()
        db.refresh(new)
        return new
    except Exception as e:
        db.rollback()
        logger.error(f"Create activity error: {e}")
        raise HTTPException(500, "Failed to create activity")


@router.get("/itinerary-days/{day_id}/activities", response_model=List[schemas.ActivityOut])
def get_day_activities(day_id: int, db: Session = Depends(get_db)):
    return db.query(models.Activity).filter(
        models.Activity.day_id == day_id
    ).order_by(models.Activity.start_time).all()


@router.put("/activities/{activity_id}", response_model=schemas.ActivityOut)
def update_activity(
    activity_id: int, activity_update: schemas.ActivityUpdate, db: Session = Depends(get_db)
):
    act = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not act:
        raise HTTPException(404, "Activity not found")
    try:
        for f, v in activity_update.dict(exclude_unset=True).items():
            setattr(act, f, v)
        db.commit()
        db.refresh(act)
        return act
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Update activity error: {e}")
        raise HTTPException(500, "Failed to update activity")


@router.delete("/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    act = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not act:
        raise HTTPException(404, "Activity not found")
    try:
        db.delete(act)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Delete activity error: {e}")
        raise HTTPException(500, "Failed to delete activity")


# ── Accommodations ─────────────────────────────────────────────────────────────
@router.post("/accommodations", response_model=schemas.AccommodationOut, status_code=status.HTTP_201_CREATED)
def create_accommodation(acc: schemas.AccommodationCreate, db: Session = Depends(get_db)):
    try:
        new = models.Accommodation(**acc.dict())
        db.add(new)
        db.commit()
        db.refresh(new)
        return new
    except Exception as e:
        db.rollback()
        raise HTTPException(500, "Failed to create accommodation")


@router.get("/itineraries/{itinerary_id}/accommodations", response_model=List[schemas.AccommodationOut])
def get_accommodations(itinerary_id: int, db: Session = Depends(get_db)):
    return db.query(models.Accommodation).filter(
        models.Accommodation.itinerary_id == itinerary_id
    ).all()


@router.put("/accommodations/{acc_id}", response_model=schemas.AccommodationOut)
def update_accommodation(acc_id: int, update: schemas.AccommodationUpdate, db: Session = Depends(get_db)):
    acc = db.query(models.Accommodation).filter(models.Accommodation.id == acc_id).first()
    if not acc:
        raise HTTPException(404, "Accommodation not found")
    try:
        for f, v in update.dict(exclude_unset=True).items():
            setattr(acc, f, v)
        db.commit()
        db.refresh(acc)
        return acc
    except Exception as e:
        db.rollback()
        raise HTTPException(500, "Failed to update accommodation")


@router.delete("/accommodations/{acc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_accommodation(acc_id: int, db: Session = Depends(get_db)):
    acc = db.query(models.Accommodation).filter(models.Accommodation.id == acc_id).first()
    if not acc:
        raise HTTPException(404, "Accommodation not found")
    db.delete(acc)
    db.commit()


# ── Transportation ─────────────────────────────────────────────────────────────
@router.post("/transportation", response_model=schemas.TransportationOut, status_code=status.HTTP_201_CREATED)
def create_transportation(trans: schemas.TransportationCreate, db: Session = Depends(get_db)):
    try:
        new = models.Transportation(**trans.dict())
        db.add(new)
        db.commit()
        db.refresh(new)
        return new
    except Exception as e:
        db.rollback()
        raise HTTPException(500, "Failed to create transportation")


@router.get("/itineraries/{itinerary_id}/transportation", response_model=List[schemas.TransportationOut])
def get_transportation(itinerary_id: int, db: Session = Depends(get_db)):
    return db.query(models.Transportation).filter(
        models.Transportation.itinerary_id == itinerary_id
    ).all()


@router.put("/transportation/{trans_id}", response_model=schemas.TransportationOut)
def update_transportation(trans_id: int, update: schemas.TransportationUpdate, db: Session = Depends(get_db)):
    trans = db.query(models.Transportation).filter(models.Transportation.id == trans_id).first()
    if not trans:
        raise HTTPException(404, "Transportation not found")
    try:
        for f, v in update.dict(exclude_unset=True).items():
            setattr(trans, f, v)
        db.commit()
        db.refresh(trans)
        return trans
    except Exception as e:
        db.rollback()
        raise HTTPException(500, "Failed to update transportation")


@router.delete("/transportation/{trans_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transportation(trans_id: int, db: Session = Depends(get_db)):
    trans = db.query(models.Transportation).filter(models.Transportation.id == trans_id).first()
    if not trans:
        raise HTTPException(404, "Transportation not found")
    db.delete(trans)
    db.commit()