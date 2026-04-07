"""
routers/community.py
Posts, comments, reactions, voting, saving, reporting, and community updates.
"""
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import models, schemas
from database import get_db

# Known major cities for place normalisation
_KNOWN_CITIES = [
    'Kathmandu', 'Pokhara', 'Bhaktapur', 'Lalitpur', 'Patan',
    'Chitwan', 'Lumbini', 'Mustang', 'Nagarkot', 'Boudha', 'Thamel',
]

def _normalise_place(place_str: str, db) -> str:
    """
    Ensure the place field always includes the parent city name.
    Strategy:
      1. If a known city is already in the string → return as-is
      2. Look up each comma-separated location in the Places cache → use its city
      3. Check formatted_address of matched places for a city name
      4. If nothing found → return original
    """
    if not place_str or place_str == 'All':
        return place_str

    lower = place_str.lower()

    # Already contains a known city?
    for city in _KNOWN_CITIES:
        if city.lower() in lower:
            return place_str

    # Try to find city from Places cache
    location_names = [p.strip() for p in place_str.split(',') if p.strip()]
    detected_cities = []

    for loc_name in location_names:
        place = db.query(models.Place).filter(
            models.Place.name.ilike(f"%{loc_name}%")
        ).first()
        if place:
            if place.city and place.city not in detected_cities:
                detected_cities.append(place.city)
            elif place.address:
                for city in _KNOWN_CITIES:
                    if city.lower() in place.address.lower() and city not in detected_cities:
                        detected_cities.append(city)

    if detected_cities:
        # Append detected cities to the place string
        cities_to_add = [c for c in detected_cities if c.lower() not in lower]
        if cities_to_add:
            return f"{place_str}, {', '.join(cities_to_add)}"

    return place_str

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/community", tags=["Community"])

# Separate routers without the /community prefix — match original URL structure
updates_router   = APIRouter(tags=["Community"])   # /community-updates
complaints_router = APIRouter(tags=["Community"])  # /complaints


# ── Helper ─────────────────────────────────────────────────────────────────────
def _build_reaction_summary(comment, current_user_id):
    counts: dict = {}
    for r in (comment.reactions or []):
        counts[r.emoji] = counts.get(r.emoji, 0) + 1
    user_emoji = next(
        (r.emoji for r in (comment.reactions or []) if r.user_id == current_user_id), None
    )
    return [
        schemas.ReactionSummary(emoji=e, count=c, user_reacted=(e == user_emoji))
        for e, c in sorted(counts.items(), key=lambda x: -x[1])
    ]


# ── Community Updates (at /community-updates, NOT /community/...) ──────────────
@updates_router.post(
    "/community-updates",
    response_model=schemas.CommunityUpdateOut,
    status_code=status.HTTP_201_CREATED,
)
def create_community_update(
    update: schemas.CommunityUpdateCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    try:
        new_update = models.CommunityUpdate(**update.dict(), user_id=user_id)
        db.add(new_update)
        db.commit()
        db.refresh(new_update)
        return new_update
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating community update: {e}")
        raise HTTPException(500, "Failed to create update")


@updates_router.get("/community-updates", response_model=List[schemas.CommunityUpdateOut])
def get_community_updates(
    location: Optional[str]     = Query(None),
    update_type: Optional[str]  = Query(None),
    active_only: bool           = Query(True),
    limit: int                  = Query(50, le=100),
    db: Session = Depends(get_db),
):
    try:
        q = db.query(models.CommunityUpdate)
        if active_only:
            q = q.filter(models.CommunityUpdate.is_active == True)
        if location:
            q = q.filter(models.CommunityUpdate.location.ilike(f"%{location}%"))
        if update_type:
            q = q.filter(models.CommunityUpdate.update_type == update_type)
        return q.order_by(models.CommunityUpdate.created_at.desc()).limit(limit).all()
    except Exception as e:
        logger.error(f"Error fetching community updates: {e}")
        raise HTTPException(500, "Failed to fetch updates")


# ── Posts ──────────────────────────────────────────────────────────────────────
@router.post("/posts", response_model=schemas.CommunityPostOut, status_code=status.HTTP_201_CREATED)
def create_post(
    post: schemas.CommunityPostCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    try:
        post_data = post.dict()
        post_data['place'] = _normalise_place(post_data.get('place', 'All'), db)
        new = models.CommunityPost(**post_data, user_id=user_id)
        db.add(new)
        db.commit()
        db.refresh(new)
        result = schemas.CommunityPostOut.from_orm(new)
        result.author_name      = user.username
        result.author_initial   = user.username[0].upper()
        result.author_avatar_id = user.avatar_id or 1
        result.user_vote        = None
        return result
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Create post error: {e}")
        raise HTTPException(500, "Failed to create post")


@router.get("/posts", response_model=List[schemas.CommunityPostOut])
def get_posts(
    tag: Optional[str]     = Query(None),
    place: Optional[str]   = Query(None),
    sort: str              = Query("new"),
    user_id: Optional[int] = Query(None),
    limit: int             = Query(50, le=100),
    db: Session = Depends(get_db),
):
    try:
        q = db.query(models.CommunityPost)
        if tag:
            q = q.filter(models.CommunityPost.tag == tag)
        if place and place != "All":
            # Base match: place field contains the search term
            from sqlalchemy import or_
            place_conditions = [models.CommunityPost.place.ilike(f"%{place}%")]

            # If the search term is a known city, also match posts about
            # specific sub-locations in that city (from Places cache)
            is_city = any(place.lower() == c.lower() for c in _KNOWN_CITIES)
            if is_city:
                city_places = db.query(models.Place).filter(
                    models.Place.city.ilike(place)
                ).limit(100).all()
                for cp in city_places:
                    if cp.name:
                        place_conditions.append(
                            models.CommunityPost.place.ilike(f"%{cp.name}%")
                        )

            q = q.filter(or_(*place_conditions))
        if sort == "popular":
            q = q.order_by((models.CommunityPost.upvotes - models.CommunityPost.downvotes).desc())
        elif sort == "top":
            q = q.order_by(models.CommunityPost.upvotes.desc())
        else:
            q = q.order_by(models.CommunityPost.created_at.desc())

        results = []
        for p in q.limit(limit).all():
            out = schemas.CommunityPostOut.from_orm(p)
            out.author_name      = p.author.username if p.author else "Unknown"
            out.author_initial   = p.author.username[0].upper() if p.author else "U"
            out.author_avatar_id = p.author.avatar_id if p.author else 1
            if user_id:
                vote  = db.query(models.PostVote).filter(
                    models.PostVote.post_id == p.id, models.PostVote.user_id == user_id
                ).first()
                saved = db.query(models.SavedPost).filter(
                    models.SavedPost.post_id == p.id, models.SavedPost.user_id == user_id
                ).first()
                out.user_vote = vote.direction if vote else None
                out.saved     = bool(saved)
            else:
                out.user_vote = None
                out.saved     = False
            results.append(out)
        return results
    except Exception as e:
        logger.error(f"Get posts error: {e}")
        raise HTTPException(500, "Failed to fetch posts")


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    user     = db.query(models.User).filter(models.User.id == user_id).first()
    is_admin = user and user.role == "admin"
    if not is_admin and post.user_id != user_id:
        raise HTTPException(403, "You can only delete your own posts")
    try:
        db.delete(post)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Delete post error: {e}")
        raise HTTPException(500, "Failed to delete post")


# ── Saved posts ────────────────────────────────────────────────────────────────
@router.post("/posts/{post_id}/save")
def toggle_save(post_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    if not db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first():
        raise HTTPException(404, "Post not found")
    try:
        existing = db.query(models.SavedPost).filter(
            models.SavedPost.post_id == post_id, models.SavedPost.user_id == user_id
        ).first()
        if existing:
            db.delete(existing)
            db.commit()
            return {"saved": False}
        db.add(models.SavedPost(user_id=user_id, post_id=post_id))
        db.commit()
        return {"saved": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Toggle save error: {e}")
        raise HTTPException(500, "Failed to save post")


@router.get("/saved", response_model=List[schemas.CommunityPostOut])
def get_saved(user_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        saved_rows = db.query(models.SavedPost).filter(
            models.SavedPost.user_id == user_id
        ).order_by(models.SavedPost.created_at.desc()).all()
        results = []
        for s in saved_rows:
            p = db.query(models.CommunityPost).filter(models.CommunityPost.id == s.post_id).first()
            if not p:
                continue
            out = schemas.CommunityPostOut.from_orm(p)
            out.author_name      = p.author.username if p.author else "Unknown"
            out.author_initial   = p.author.username[0].upper() if p.author else "U"
            out.author_avatar_id = p.author.avatar_id if p.author else 1
            vote = db.query(models.PostVote).filter(
                models.PostVote.post_id == p.id, models.PostVote.user_id == user_id
            ).first()
            out.user_vote = vote.direction if vote else None
            out.saved     = True
            results.append(out)
        return results
    except Exception as e:
        logger.error(f"Get saved error: {e}")
        raise HTTPException(500, "Failed to fetch saved posts")


# ── Voting ─────────────────────────────────────────────────────────────────────
@router.post("/posts/{post_id}/vote")
def vote_on_post(
    post_id: int,
    vote: schemas.PostVoteRequest,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    try:
        existing = db.query(models.PostVote).filter(
            models.PostVote.post_id == post_id, models.PostVote.user_id == user_id
        ).first()
        if existing:
            if existing.direction == vote.direction:
                if existing.direction == "up":
                    post.upvotes = max(0, post.upvotes - 1)
                else:
                    post.downvotes = max(0, post.downvotes - 1)
                db.delete(existing)
                db.commit()
                return {"status": "removed", "upvotes": post.upvotes, "downvotes": post.downvotes}
            else:
                if existing.direction == "up":
                    post.upvotes   = max(0, post.upvotes - 1)
                    post.downvotes += 1
                else:
                    post.downvotes = max(0, post.downvotes - 1)
                    post.upvotes   += 1
                existing.direction = vote.direction
                db.commit()
                return {"status": "switched", "upvotes": post.upvotes, "downvotes": post.downvotes}
        else:
            db.add(models.PostVote(user_id=user_id, post_id=post_id, direction=vote.direction))
            if vote.direction == "up":
                post.upvotes += 1
                if post.user_id != user_id:
                    voter = db.query(models.User).filter(models.User.id == user_id).first()
                    db.add(models.Notification(
                        user_id=post.user_id, type="upvote",
                        message=f'{voter.name if voter else "Someone"} upvoted your post "{post.title[:40]}"',
                        post_id=post_id, from_user_id=user_id,
                    ))
            else:
                post.downvotes += 1
            db.commit()
            return {"status": "voted", "upvotes": post.upvotes, "downvotes": post.downvotes}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Vote error: {e}")
        raise HTTPException(500, "Failed to vote")


# ── Comments ───────────────────────────────────────────────────────────────────
@router.post("/posts/{post_id}/comments", response_model=schemas.PostCommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    comment: schemas.PostCommentCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    try:
        c = models.PostComment(
            content=comment.content, post_id=post_id,
            user_id=user_id, parent_comment_id=comment.parent_comment_id,
        )
        db.add(c)
        post.comment_count += 1
        db.commit()
        db.refresh(c)
        if post.user_id != user_id:
            db.add(models.Notification(
                user_id=post.user_id, type="comment",
                message=f'{user.username} commented on your post "{post.title[:40]}"',
                post_id=post_id, from_user_id=user_id,
            ))
            db.commit()
        return schemas.PostCommentOut(
            id=c.id, content=c.content, post_id=c.post_id, user_id=c.user_id,
            parent_comment_id=c.parent_comment_id, created_at=c.created_at,
            author_name=user.username, author_initial=user.username[0].upper(),
            author_avatar_id=user.avatar_id or 1, reactions=[],
        )
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Create comment error: {e}")
        raise HTTPException(500, "Failed to create comment")


@router.get("/posts/{post_id}/comments", response_model=List[schemas.PostCommentOut])
def get_comments(
    post_id: int, user_id: Optional[int] = Query(None), db: Session = Depends(get_db)
):
    try:
        comments = db.query(models.PostComment).filter(
            models.PostComment.post_id == post_id
        ).order_by(models.PostComment.created_at.asc()).all()
        return [
            schemas.PostCommentOut(
                id=c.id, content=c.content, post_id=c.post_id, user_id=c.user_id,
                parent_comment_id=c.parent_comment_id, created_at=c.created_at,
                author_name=c.user.username if c.user else "Unknown",
                author_initial=c.user.username[0].upper() if c.user else "U",
                author_avatar_id=c.user.avatar_id if c.user else 1,
                reactions=_build_reaction_summary(c, user_id),
            )
            for c in comments
        ]
    except Exception as e:
        logger.error(f"Get comments error: {e}")
        raise HTTPException(500, "Failed to fetch comments")


@router.delete("/posts/{post_id}/comments/{comment_id}")
def delete_comment(
    post_id: int, comment_id: int, user_id: int = Query(...), db: Session = Depends(get_db)
):
    c = db.query(models.PostComment).filter(
        models.PostComment.id == comment_id, models.PostComment.post_id == post_id
    ).first()
    if not c:
        raise HTTPException(404, "Comment not found")
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if c.user_id != user_id and (not post or post.user_id != user_id):
        raise HTTPException(403, "Not allowed to delete this comment")
    try:
        db.delete(c)
        if post and post.comment_count and post.comment_count > 0:
            post.comment_count -= 1
        db.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Delete comment error: {e}")
        raise HTTPException(500, "Failed to delete comment")


@router.post("/posts/{post_id}/comments/{comment_id}/react")
def react_to_comment(
    post_id: int, comment_id: int,
    user_id: int = Query(...), emoji: str = Query(...),
    db: Session = Depends(get_db),
):
    c = db.query(models.PostComment).filter(models.PostComment.id == comment_id).first()
    if not c:
        raise HTTPException(404, "Comment not found")
    try:
        existing = db.query(models.PostCommentReaction).filter(
            models.PostCommentReaction.comment_id == comment_id,
            models.PostCommentReaction.user_id    == user_id,
        ).first()
        if existing:
            if existing.emoji == emoji:
                db.delete(existing)
            else:
                existing.emoji = emoji
        else:
            db.add(models.PostCommentReaction(comment_id=comment_id, user_id=user_id, emoji=emoji))
        db.commit()
        db.refresh(c)
        return {"reactions": _build_reaction_summary(c, user_id)}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"React error: {e}")
        raise HTTPException(500, "Failed to react")


# ── Reports ────────────────────────────────────────────────────────────────────
@router.post("/posts/{post_id}/report", status_code=status.HTTP_201_CREATED)
def report_post(
    post_id: int, report: schemas.PostReportCreate,
    user_id: int = Query(...), db: Session = Depends(get_db),
):
    if not db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first():
        raise HTTPException(404, "Post not found")
    try:
        db.add(models.PostReport(reporter_id=user_id, post_id=post_id, reason=report.reason))
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Report post error: {e}")
        raise HTTPException(500, "Failed to submit report")


@router.post("/posts/{post_id}/comments/{comment_id}/report", status_code=status.HTTP_201_CREATED)
def report_comment(
    post_id: int, comment_id: int, report: schemas.PostReportCreate,
    user_id: int = Query(...), db: Session = Depends(get_db),
):
    if not db.query(models.PostComment).filter(models.PostComment.id == comment_id).first():
        raise HTTPException(404, "Comment not found")
    try:
        db.add(models.PostReport(
            reporter_id=user_id, post_id=post_id, comment_id=comment_id, reason=report.reason
        ))
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Report comment error: {e}")
        raise HTTPException(500, "Failed to submit report")


# ── Complaints ─────────────────────────────────────────────────────────────────
@complaints_router.post("/complaints", response_model=schemas.ComplaintOut, status_code=status.HTTP_201_CREATED)
def create_complaint(
    complaint: schemas.ComplaintCreate, user_id: int = Query(...), db: Session = Depends(get_db)
):
    if not db.query(models.User).filter(models.User.id == user_id).first():
        raise HTTPException(404, "User not found")
    try:
        new = models.Complaint(**complaint.dict(), user_id=user_id)
        db.add(new)
        db.commit()
        db.refresh(new)
        return new
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Create complaint error: {e}")
        raise HTTPException(500, "Failed to create complaint")


@complaints_router.get("/complaints/")
def list_complaints(status_filter: Optional[str] = Query(None), db: Session = Depends(get_db)):
    try:
        q = db.query(models.Complaint)
        if status_filter:
            q = q.filter(models.Complaint.status == status_filter)
        complaints = q.order_by(models.Complaint.created_at.desc()).all()
        results = []
        for c in complaints:
            u = db.query(models.User).filter(models.User.id == c.user_id).first()
            results.append({
                "id": c.id, "title": c.title, "description": c.description,
                "category": c.category, "status": c.status, "user_id": c.user_id,
                "user_name": u.username if u else f"User #{c.user_id}",
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            })
        return results
    except Exception as e:
        logger.error(f"List complaints error: {e}")
        raise HTTPException(500, "Failed to list complaints")


@complaints_router.patch("/complaints/{complaint_id}", response_model=schemas.ComplaintOut)
def update_complaint(
    complaint_id: int, update: schemas.ComplaintUpdate, db: Session = Depends(get_db)
):
    c = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(404, "Complaint not found")
    try:
        for f, v in update.dict(exclude_unset=True).items():
            setattr(c, f, v)
        db.commit()
        db.refresh(c)
        return c
    except Exception as e:
        db.rollback()
        raise HTTPException(500, "Failed to update complaint")


@complaints_router.delete("/complaints/{complaint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_complaint(complaint_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(404, "Complaint not found")
    try:
        db.delete(c)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(500, "Failed to delete complaint")