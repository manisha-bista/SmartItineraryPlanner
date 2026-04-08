"""
routers/users.py
User CRUD, public profiles, avatars, and credentials management.
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import models, schemas
from database import get_db
from routers.auth import get_password_hash, verify_password

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["Users"])

# ── User CRUD ──────────────────────────────────────────────────────────────────
@router.get("/", response_model=List[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    try:
        return db.query(models.User).order_by(models.User.created_at.desc()).all()
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(500, "Failed to list users")


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    try:
        for field, value in user_update.dict(exclude_unset=True).items():
            setattr(user, field, value)
        db.commit()
        db.refresh(user)
        return user
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating user: {e}")
        raise HTTPException(500, "Failed to update user")


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    try:
        db.delete(user)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(500, "Failed to delete user")


@router.patch("/{user_id}/credentials")
def update_credentials(user_id: int, payload: dict, db: Session = Depends(get_db)):
    """Admin-only: update email and/or password for a user."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.role != "admin":
        raise HTTPException(403, "Only admins can use this endpoint")

    new_email        = payload.get("email", "").strip().lower()
    current_password = payload.get("current_password", "")
    new_password     = payload.get("new_password", "")

    if new_email and new_email != user.email:
        if db.query(models.User).filter(models.User.email == new_email).first():
            raise HTTPException(400, "Email already in use")
        user.email = new_email

    if new_password:
        if not current_password:
            raise HTTPException(400, "Current password is required")
        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(401, "Current password is incorrect")
        if len(new_password) < 6:
            raise HTTPException(400, "New password must be at least 6 characters")
        user.hashed_password = get_password_hash(new_password)

    try:
        db.commit()
        db.refresh(user)
        return {"message": "Credentials updated", "email": user.email}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Credentials update error: {e}")
        raise HTTPException(500, "Failed to update credentials")


@router.patch("/{user_id}/role", response_model=schemas.UserOut)
def update_user_role(
    user_id: int,
    role: str = Query(..., pattern="^(user|admin)$"),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    try:
        user.role = role
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        logger.error(f"Role update error: {e}")
        raise HTTPException(500, "Failed to update role")


# ── Public profile ─────────────────────────────────────────────────────────────
@router.get("/{user_id}/public", response_model=schemas.UserPublicProfile)
def get_public_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.get("/by-username/{username}", response_model=schemas.UserPublicProfile)
def get_user_by_username(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user


# ── Friends ────────────────────────────────────────────────────────────────────
friends_router = APIRouter(prefix="/friends", tags=["Friends"])

from sqlalchemy import or_


@friends_router.post("/request")
def send_friend_request(
    request: schemas.FriendRequestCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    clean_username = request.receiver_username.lstrip('@').strip()
    receiver = db.query(models.User).filter(
        models.User.username == clean_username
    ).first()
    if not receiver:
        raise HTTPException(404, "User not found")
    if receiver.id == user_id:
        raise HTTPException(400, "Cannot send a friend request to yourself")

    existing = db.query(models.Friendship).filter(
        or_(
            (models.Friendship.requester_id == user_id) & (models.Friendship.receiver_id == receiver.id),
            (models.Friendship.requester_id == receiver.id) & (models.Friendship.receiver_id == user_id),
        )
    ).first()
    if existing:
        if existing.status == "accepted":
            raise HTTPException(400, "Already friends")
        raise HTTPException(400, "Friend request already pending")

    friendship = models.Friendship(requester_id=user_id, receiver_id=receiver.id, status="pending")
    db.add(friendship)
    sender = db.query(models.User).filter(models.User.id == user_id).first()
    db.add(models.Notification(
        user_id=receiver.id, type="friend_request",
        message=f"{sender.username} sent you a friend request",
        from_user_id=user_id,
    ))
    db.commit()
    return {"status": "sent", "friendship_id": friendship.id}


@friends_router.patch("/{friendship_id}/accept")
def accept_friend_request(
    friendship_id: int, user_id: int = Query(...), db: Session = Depends(get_db)
):
    f = db.query(models.Friendship).filter(models.Friendship.id == friendship_id).first()
    if not f:
        raise HTTPException(404, "Friend request not found")
    if f.receiver_id != user_id:
        raise HTTPException(403, "Not your request to accept")
    f.status = "accepted"
    from datetime import datetime
    f.accepted_at = datetime.utcnow()
    receiver = db.query(models.User).filter(models.User.id == user_id).first()
    db.add(models.Notification(
        user_id=f.requester_id, type="friend_accepted",
        message=f"{receiver.username} accepted your friend request",
        from_user_id=user_id,
    ))
    db.commit()
    return {"status": "accepted"}


@friends_router.patch("/{friendship_id}/reject")
def reject_friend_request(
    friendship_id: int, user_id: int = Query(...), db: Session = Depends(get_db)
):
    f = db.query(models.Friendship).filter(models.Friendship.id == friendship_id).first()
    if not f:
        raise HTTPException(404, "Friend request not found")
    if f.receiver_id != user_id:
        raise HTTPException(403, "Not your request to reject")
    db.delete(f)
    db.commit()
    return {"status": "rejected"}


@friends_router.get("/status/{other_user_id}")
def check_friendship(
    other_user_id: int, user_id: int = Query(...), db: Session = Depends(get_db)
):
    f = db.query(models.Friendship).filter(
        or_(
            (models.Friendship.requester_id == user_id) & (models.Friendship.receiver_id == other_user_id),
            (models.Friendship.requester_id == other_user_id) & (models.Friendship.receiver_id == user_id),
        )
    ).first()
    if not f:
        return {"status": "none", "friendship_id": None}
    return {"status": f.status, "friendship_id": f.id, "is_requester": f.requester_id == user_id}


@friends_router.get("/{user_id}/pending")
def get_pending_requests(user_id: int, db: Session = Depends(get_db)):
    incoming = db.query(models.Friendship).filter(
        models.Friendship.receiver_id == user_id,
        models.Friendship.status == "pending",
    ).all()
    requests = []
    for f in incoming:
        requester = db.query(models.User).filter(models.User.id == f.requester_id).first()
        if requester:
            requests.append({
                "friendship_id": f.id, "user_id": requester.id,
                "username": requester.username, "avatar_id": requester.avatar_id,
                "created_at": f.created_at.isoformat() if f.created_at else None,
            })
    return {"requests": requests, "count": len(requests)}


@friends_router.get("/{user_id}")
def get_friends(user_id: int, db: Session = Depends(get_db)):
    friendships = db.query(models.Friendship).filter(
        or_(models.Friendship.requester_id == user_id, models.Friendship.receiver_id == user_id),
        models.Friendship.status == "accepted",
    ).all()
    friends = []
    for f in friendships:
        fid = f.receiver_id if f.requester_id == user_id else f.requester_id
        friend = db.query(models.User).filter(models.User.id == fid).first()
        if friend:
            friends.append({
                "friendship_id": f.id, "user_id": friend.id,
                "username": friend.username, "avatar_id": friend.avatar_id,
                "bio": friend.bio,
                "since": f.accepted_at.isoformat() if f.accepted_at else None,
            })
    return {"friends": friends, "count": len(friends)}


@friends_router.delete("/{friendship_id}")
def remove_friend(friendship_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    f = db.query(models.Friendship).filter(models.Friendship.id == friendship_id).first()
    if not f:
        raise HTTPException(404, "Friendship not found")
    if f.requester_id != user_id and f.receiver_id != user_id:
        raise HTTPException(403, "Not your friendship")
    db.delete(f)
    db.commit()
    return {"status": "removed"}