"""
routers/communication.py
Chat messages and notifications.
"""
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

import models, schemas
from database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Communication"])


# ── Messages ───────────────────────────────────────────────────────────────────
@router.post("/messages", response_model=schemas.MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    msg: schemas.MessageCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    # must be friends
    friendship = db.query(models.Friendship).filter(
        or_(
            (models.Friendship.requester_id == user_id) & (models.Friendship.receiver_id == msg.receiver_id),
            (models.Friendship.requester_id == msg.receiver_id) & (models.Friendship.receiver_id == user_id),
        ),
        models.Friendship.status == "accepted",
    ).first()
    if not friendship:
        raise HTTPException(403, "You can only message friends")

    new_msg = models.Message(
        sender_id=user_id,
        receiver_id=msg.receiver_id,
        content=msg.content,
        shared_itinerary_id=msg.shared_itinerary_id,
    )
    db.add(new_msg)

    sender = db.query(models.User).filter(models.User.id == user_id).first()
    db.add(models.Notification(
        user_id=msg.receiver_id,
        type="message",
        message=f"{sender.username}: {msg.content[:50]}",
        from_user_id=user_id,
    ))
    db.commit()
    db.refresh(new_msg)

    result = schemas.MessageOut.from_orm(new_msg)
    result.sender_username = sender.username if sender else None
    result.sender_avatar_id = sender.avatar_id if sender else 1
    return result


@router.get("/messages/{user_id}/unread-count")
def get_unread_count(user_id: int, db: Session = Depends(get_db)):
    count = db.query(models.Message).filter(
        models.Message.receiver_id == user_id,
        models.Message.is_read == False,
    ).count()
    return {"count": count}


# NOTE: /conversations must be defined before /{user_id}/{friend_id}
@router.get("/messages/{user_id}/conversations")
def get_conversations(user_id: int, db: Session = Depends(get_db)):
    convos = []
    friendships = db.query(models.Friendship).filter(
        or_(
            models.Friendship.requester_id == user_id,
            models.Friendship.receiver_id  == user_id,
        ),
        models.Friendship.status == "accepted",
    ).all()

    for f in friendships:
        friend_id = f.receiver_id if f.requester_id == user_id else f.requester_id
        friend = db.query(models.User).filter(models.User.id == friend_id).first()
        if not friend:
            continue

        last_msg = db.query(models.Message).filter(
            or_(
                (models.Message.sender_id == user_id)   & (models.Message.receiver_id == friend_id),
                (models.Message.sender_id == friend_id) & (models.Message.receiver_id == user_id),
            )
        ).order_by(models.Message.created_at.desc()).first()

        unread = db.query(models.Message).filter(
            models.Message.sender_id   == friend_id,
            models.Message.receiver_id == user_id,
            models.Message.is_read     == False,
        ).count()

        convos.append({
            "friend_id":         friend.id,
            "username":          friend.username,
            "avatar_id":         friend.avatar_id,
            "last_message":      last_msg.content[:60] if last_msg else None,
            "last_message_time": last_msg.created_at.isoformat() if last_msg else None,
            "unread_count":      unread,
        })

    convos.sort(key=lambda c: c["last_message_time"] or "", reverse=True)
    return {"conversations": convos}


@router.get("/messages/{user_id}/{friend_id}")
def get_conversation(
    user_id: int,
    friend_id: int,
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
):
    messages = db.query(models.Message).filter(
        or_(
            (models.Message.sender_id == user_id)   & (models.Message.receiver_id == friend_id),
            (models.Message.sender_id == friend_id) & (models.Message.receiver_id == user_id),
        )
    ).order_by(models.Message.created_at.desc()).limit(limit).all()

    # mark incoming as read
    for m in messages:
        if m.receiver_id == user_id and not m.is_read:
            m.is_read = True
    db.commit()

    results = []
    for m in reversed(messages):
        sender = db.query(models.User).filter(models.User.id == m.sender_id).first()
        d = schemas.MessageOut.from_orm(m).dict()
        d["sender_username"]  = sender.username  if sender else None
        d["sender_avatar_id"] = sender.avatar_id if sender else 1
        results.append(d)
    return {"messages": results}


# ── Notifications ──────────────────────────────────────────────────────────────
@router.get("/notifications/{user_id}", response_model=List[schemas.NotificationOut])
def get_notifications(
    user_id: int,
    unread_only: bool  = Query(False),
    limit: int         = Query(20, le=50),
    db: Session = Depends(get_db),
):
    try:
        q = db.query(models.Notification).filter(models.Notification.user_id == user_id)
        if unread_only:
            q = q.filter(models.Notification.is_read == False)
        return q.order_by(models.Notification.created_at.desc()).limit(limit).all()
    except Exception as e:
        logger.error(f"Get notifications error: {e}")
        raise HTTPException(500, "Failed to fetch notifications")


@router.patch("/notifications/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(models.Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(404, "Notification not found")
    notif.is_read = True
    db.commit()
    return {"status": "read"}


@router.patch("/notifications/{user_id}/read-all")
def mark_all_read(user_id: int, db: Session = Depends(get_db)):
    db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"status": "all_read"}


@router.get("/notifications/{user_id}/unread-count")
def get_notification_unread_count(user_id: int, db: Session = Depends(get_db)):
    count = db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.is_read == False,
    ).count()
    return {"count": count}