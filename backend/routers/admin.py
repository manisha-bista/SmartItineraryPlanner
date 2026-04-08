"""
routers/admin.py
All admin-restricted management endpoints.
Caller must pass ?admin_id=<id> — require_admin() verifies the role.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import models
from database import get_db
from services.email_utils import send_content_removal_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Guard ──────────────────────────────────────────────────────────────────────
def require_admin(admin_id: int, db: Session) -> models.User:
    user = db.query(models.User).filter(models.User.id == admin_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.role != "admin":
        raise HTTPException(403, "Admin access required")
    return user


# ── Users ──────────────────────────────────────────────────────────────────────
@router.get("/users/{user_id}/profile")
def admin_user_profile(user_id: int, admin_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    itins = db.query(models.Itinerary).filter(
        models.Itinerary.user_id == user_id
    ).order_by(models.Itinerary.created_at.desc()).all()

    posts = db.query(models.CommunityPost).filter(
        models.CommunityPost.user_id == user_id
    ).order_by(models.CommunityPost.created_at.desc()).all()

    return {
        "user": {
            "id": user.id, "name": user.name, "username": user.username,
            "email": user.email, "role": user.role,
            "bio": user.bio, "location": user.location,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login":  user.last_login.isoformat()  if user.last_login  else None,
        },
        "itineraries": [
            {
                "id": i.id, "title": i.title, "destination": i.destination,
                "start_date": i.start_date.isoformat() if i.start_date else None,
                "end_date":   i.end_date.isoformat()   if i.end_date   else None,
                "status": i.status, "estimated_budget": i.estimated_budget,
                "currency": i.currency,
                "days_count":       len(i.days),
                "activities_count": sum(len(d.activities) for d in i.days),
            }
            for i in itins
        ],
        "posts": [
            {
                "id": p.id, "title": p.title, "body": p.body, "tag": p.tag, "place": p.place,
                "upvotes": p.upvotes, "downvotes": p.downvotes, "comment_count": p.comment_count,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in posts
        ],
        "stats": {
            "total_itineraries": len(itins),
            "total_posts":       len(posts),
            "total_upvotes":     sum(p.upvotes for p in posts),
        },
    }


# ── Itineraries ────────────────────────────────────────────────────────────────
@router.delete("/itineraries/{itinerary_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_itinerary(
    itinerary_id: int, admin_id: int = Query(...), db: Session = Depends(get_db)
):
    require_admin(admin_id, db)
    i = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
    if not i:
        raise HTTPException(404, "Itinerary not found")
    db.delete(i)
    db.commit()


# ── Community posts ────────────────────────────────────────────────────────────
@router.get("/posts")
def admin_list_posts(admin_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    posts = db.query(models.CommunityPost).order_by(models.CommunityPost.created_at.desc()).all()
    return [
        {
            "id": p.id, "title": p.title, "body": p.body,
            "tag": p.tag, "place": p.place,
            "upvotes": p.upvotes, "downvotes": p.downvotes,
            "user_id": p.user_id,
            "author_name": p.author.username if p.author else "Unknown",
            "created_at":  p.created_at.isoformat() if p.created_at else None,
        }
        for p in posts
    ]


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_post(
    post_id: int, admin_id: int = Query(...), db: Session = Depends(get_db)
):
    require_admin(admin_id, db)
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    db.delete(post)
    db.commit()


# ── Reports ────────────────────────────────────────────────────────────────────
@router.get("/reports")
def admin_list_reports(admin_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    reports = db.query(models.PostReport).order_by(models.PostReport.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "reporter_id":       r.reporter_id,
            "reporter_username": r.reporter.username if r.reporter else f"User #{r.reporter_id}",
            "post_id":           r.post_id,
            "post_title":        r.post.title    if r.post    else None,
            "comment_id":        r.comment_id,
            "comment_content":   r.comment.content[:100] if r.comment else None,
            "reason":            r.reason,
            "status":            r.status,
            "created_at":        r.created_at.isoformat() if r.created_at else None,
        }
        for r in reports
    ]


@router.patch("/reports/{report_id}")
def admin_update_report(
    report_id: int,
    admin_id:  int = Query(...),
    new_status: str = Query(...),
    db: Session = Depends(get_db),
):
    require_admin(admin_id, db)
    report = db.query(models.PostReport).filter(models.PostReport.id == report_id).first()
    if not report:
        raise HTTPException(404, "Report not found")
    report.status = new_status
    db.commit()
    return {"ok": True}


@router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_report(
    report_id: int, admin_id: int = Query(...), db: Session = Depends(get_db)
):
    require_admin(admin_id, db)
    report = db.query(models.PostReport).filter(models.PostReport.id == report_id).first()
    if not report:
        raise HTTPException(404, "Report not found")
    db.delete(report)
    db.commit()


@router.delete("/reports/{report_id}/content", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_reported_content(
    report_id: int, admin_id: int = Query(...), db: Session = Depends(get_db)
):
    """Delete the actual post or comment, mark report reviewed, and email the author."""
    require_admin(admin_id, db)
    report = db.query(models.PostReport).filter(models.PostReport.id == report_id).first()
    if not report:
        raise HTTPException(404, "Report not found")

    notify_email    = None
    notify_username = None
    content_type    = None
    post_title      = None
    reason          = report.reason or "Violation of community guidelines"

    if report.comment_id:
        comment = db.query(models.PostComment).filter(
            models.PostComment.id == report.comment_id
        ).first()
        if comment:
            author     = db.query(models.User).filter(models.User.id == comment.user_id).first()
            parent_post= db.query(models.CommunityPost).filter(
                models.CommunityPost.id == comment.post_id
            ).first()
            notify_email    = author.email    if author else None
            notify_username = author.username if author else None
            post_title      = parent_post.title if parent_post else "a community post"
            content_type    = "comment"
            if parent_post and parent_post.comment_count and parent_post.comment_count > 0:
                parent_post.comment_count -= 1
            db.delete(comment)
    elif report.post_id:
        post = db.query(models.CommunityPost).filter(
            models.CommunityPost.id == report.post_id
        ).first()
        if post:
            author          = db.query(models.User).filter(models.User.id == post.user_id).first()
            notify_email    = author.email    if author else None
            notify_username = author.username if author else None
            post_title      = post.title
            content_type    = "post"
            db.delete(post)

    report.status = "reviewed"
    db.commit()

    # send notification email — failure is non-fatal
    if notify_email and content_type and post_title:
        send_content_removal_email(
            recipient_email=notify_email,
            user_name=notify_username or "Community Member",
            content_type=content_type,
            post_title=post_title,
            report_reason=reason,
        )


# ── Places cache ───────────────────────────────────────────────────────────────
@router.get("/places")
def admin_list_places(admin_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    places = db.query(models.Place).order_by(models.Place.name).all()
    result = []
    for p in places:
        aliases = db.query(models.PlaceSearchAlias).filter(
            models.PlaceSearchAlias.place_id == p.id
        ).order_by(models.PlaceSearchAlias.hit_count.desc()).all()
        result.append({
            "id": p.id, "google_place_id": p.google_place_id,
            "name": p.name, "address": p.address,
            "latitude": p.latitude, "longitude": p.longitude,
            "place_types": p.place_types.split(",") if p.place_types else [],
            "rating": p.rating, "city": p.city,
            "aliases":      [a.query_text for a in aliases],
            "alias_count":  len(aliases),
            "total_hits":   sum(a.hit_count for a in aliases),
        })
    return {"count": len(result), "places": result}


@router.delete("/places/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_place(
    place_id: int, admin_id: int = Query(...), db: Session = Depends(get_db)
):
    require_admin(admin_id, db)
    place = db.query(models.Place).filter(models.Place.id == place_id).first()
    if not place:
        raise HTTPException(404, "Place not found")
    db.delete(place)
    db.commit()


# ── All itineraries (replaces removed /debug/itineraries) ─────────────────────
@router.get("/itineraries")
def admin_list_itineraries(admin_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    from datetime import date as date_type
    today = date_type.today()
    itineraries = db.query(models.Itinerary).order_by(models.Itinerary.created_at.desc()).all()

    changed = False
    for i in itineraries:
        old = i.status
        if old in ("cancelled", "draft"):
            continue
        if i.end_date and i.end_date < today:
            i.status = "completed"
        elif i.start_date and i.start_date <= today and i.end_date and i.end_date >= today:
            i.status = "ongoing"
        if i.status != old:
            changed = True
    if changed:
        db.commit()

    return {
        "count": len(itineraries),
        "itineraries": [
            {
                "id": i.id,
                "title": i.title,
                "destination": i.destination,
                "user_id": i.user_id,
                "start_date": i.start_date.isoformat() if i.start_date else None,
                "end_date": i.end_date.isoformat() if i.end_date else None,
                "estimated_budget": i.estimated_budget,
                "currency": i.currency,
                "status": i.status or "planning",
                "is_public": i.is_public,
                "view_count": i.view_count,
                "created_at": i.created_at.isoformat() if i.created_at else None,
                "days_count": len(i.days),
                "activities_count": sum(len(d.activities) for d in i.days),
                "mapped_count": sum(
                    1 for d in i.days for a in d.activities if a.place_id
                ),
            }
            for i in itineraries
        ],
    }