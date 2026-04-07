"""
routers/auth.py
Registration, login, Google OAuth, and OTP password reset.
"""
import random
import secrets
import string
import logging
from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

import models, schemas
from database import get_db
from services.email_utils import send_otp_email

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Shared helpers (imported by other routers that need them) ──────────────────
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def generate_username(db: Session) -> str:
    """5 random lowercase letters + 3 random digits, guaranteed unique."""
    for _ in range(50):
        username = (
            "".join(random.choices(string.ascii_lowercase, k=5))
            + "".join(random.choices(string.digits, k=3))
        )
        if not db.query(models.User).filter(models.User.username == username).first():
            return username
    return "user" + str(random.randint(10000, 99999))


# ── Registration ───────────────────────────────────────────────────────────────
@router.post(
    "/register",
    response_model=schemas.UserOut,
    status_code=status.HTTP_201_CREATED,
)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if not user.name or len(user.name.strip()) < 2:
        raise HTTPException(400, "Name must be at least 2 characters")
    if not user.password or len(user.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    email = user.email.strip().lower()
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(400, "Email already registered")
    try:
        new_user = models.User(
            name=user.name.strip(),
            email=email,
            hashed_password=get_password_hash(user.password),
            username=generate_username(db),
            avatar_id=random.randint(1, 20),
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logger.info(f"New user registered: {new_user.email}")
        return new_user
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Registration error: {e}")
        raise HTTPException(500, "Registration failed")


# ── Login ──────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=schemas.UserOut)
def login_user(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    email = credentials.email.strip().lower()
    user  = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")
    try:
        user.last_login = datetime.utcnow()
        db.commit()
        return user
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(500, "Login failed")


# ── Google OAuth ───────────────────────────────────────────────────────────────
@router.post("/auth/google")
async def google_auth(payload: dict, db: Session = Depends(get_db)):
    access_token = payload.get("token")
    if not access_token:
        raise HTTPException(400, "Google access token is required")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10.0,
        )
    if resp.status_code != 200:
        raise HTTPException(401, "Invalid or expired Google token")

    guser = resp.json()
    email = guser.get("email", "").strip().lower()
    if not email:
        raise HTTPException(400, "Could not retrieve email from Google account")

    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            # Update picture if changed
            if guser.get("picture") and user.profile_picture_url != guser["picture"]:
                user.profile_picture_url = guser["picture"]
            # Backfill username/avatar if missing (for old Google accounts)
            if not user.username:
                user.username = generate_username(db)
            if not user.avatar_id:
                user.avatar_id = random.randint(1, 20)
            user.last_login = datetime.utcnow()
        else:
            # New user via Google — assign username and avatar just like email signup
            user = models.User(
                name=guser.get("name") or email.split("@")[0],
                email=email,
                hashed_password=get_password_hash(secrets.token_hex(32)),
                profile_picture_url=guser.get("picture") or None,
                username=generate_username(db),
                avatar_id=random.randint(1, 20),
                role="user",
            )
            db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Google auth: {email}")
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "username": user.username,
            "avatar_id": user.avatar_id,
            "profile_picture_url": user.profile_picture_url,
            "bio": user.bio,
            "location": user.location,
            "created_at": user.created_at.isoformat(),
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Google auth error: {e}")
        raise HTTPException(500, "Google authentication failed")


# ── OTP Password Reset ─────────────────────────────────────────────────────────
@router.post("/auth/forgot-password")
def forgot_password(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(400, "Email is required")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(404, "No account found with this email address")

    # invalidate existing OTPs
    db.query(models.PasswordResetOTP).filter(
        models.PasswordResetOTP.user_id == user.id,
        models.PasswordResetOTP.is_used == False,
    ).delete()
    db.commit()

    otp_code = str(random.randint(100000, 999999))
    db.add(models.PasswordResetOTP(
        user_id=user.id,
        otp_code=otp_code,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    ))
    db.commit()

    try:
        send_otp_email(user.email, otp_code, user.name)
    except Exception as e:
        logger.error(f"OTP email failed for {user.email}: {e}")
        raise HTTPException(500, "Failed to send OTP email. Check EMAIL_SENDER / EMAIL_PASSWORD in .env")

    return {"message": "OTP sent to your email", "user_id": user.id}


@router.post("/auth/verify-otp")
def verify_otp(payload: dict, db: Session = Depends(get_db)):
    user_id  = payload.get("user_id")
    otp_code = payload.get("otp_code", "").strip()
    if not user_id or not otp_code:
        raise HTTPException(400, "user_id and otp_code are required")

    record = db.query(models.PasswordResetOTP).filter(
        models.PasswordResetOTP.user_id   == user_id,
        models.PasswordResetOTP.otp_code  == otp_code,
        models.PasswordResetOTP.is_used   == False,
    ).first()
    if not record:
        raise HTTPException(400, "Invalid OTP. Please check and try again.")
    if datetime.utcnow() > record.expires_at:
        raise HTTPException(400, "OTP has expired. Please request a new one.")

    record.is_used = True
    db.commit()
    return {"message": "OTP verified", "user_id": user_id}


@router.post("/auth/reset-password")
def reset_password(payload: dict, db: Session = Depends(get_db)):
    user_id          = payload.get("user_id")
    new_password     = payload.get("new_password", "")
    confirm_password = payload.get("confirm_password", "")

    if not user_id:
        raise HTTPException(400, "user_id is required")
    if not new_password or len(new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    if new_password != confirm_password:
        raise HTTPException(400, "Passwords do not match")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    try:
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        return {"message": "Password reset successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Password reset error: {e}")
        raise HTTPException(500, "Failed to reset password")