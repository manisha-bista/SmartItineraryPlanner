from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, text
from database import engine, get_db
import models, schemas
from passlib.context import CryptContext
from datetime import datetime, timedelta
import logging
import json
import os
import httpx
import re
import random
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from dotenv import load_dotenv
from google import genai as google_genai
from google.genai import types

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

GOOGLE_PLACES_BASE = "https://maps.googleapis.com/maps/api/place"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Error creating database tables: {e}")

app = FastAPI(
    title="Smart Itinerary API",
    description="Comprehensive API for Nepal Adventure Smart Itinerary Planner",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def generate_username(db):
    """Generate a unique username: 5 random letters + 3 random digits."""
    import string
    for _ in range(50):
        letters = ''.join(random.choices(string.ascii_lowercase, k=5))
        digits = ''.join(random.choices(string.digits, k=3))
        username = letters + digits
        existing = db.query(models.User).filter(models.User.username == username).first()
        if not existing:
            return username
    return 'user' + str(random.randint(10000, 99999))

AVATAR_LIST = [
    {'id': 1, 'emoji': '🏔️', 'color': '#33CCCC'}, {'id': 2, 'emoji': '🌄', 'color': '#FF7043'},
    {'id': 3, 'emoji': '🏕️', 'color': '#66BB6A'}, {'id': 4, 'emoji': '🧗', 'color': '#AB47BC'},
    {'id': 5, 'emoji': '🚶', 'color': '#42A5F5'}, {'id': 6, 'emoji': '🌿', 'color': '#26A69A'},
    {'id': 7, 'emoji': '🦅', 'color': '#8D6E63'}, {'id': 8, 'emoji': '🌺', 'color': '#EC407A'},
    {'id': 9, 'emoji': '🏯', 'color': '#FFB74D'}, {'id': 10, 'emoji': '🛶', 'color': '#5C6BC0'},
    {'id': 11, 'emoji': '🌙', 'color': '#78909C'}, {'id': 12, 'emoji': '☀️', 'color': '#FDD835'},
    {'id': 13, 'emoji': '🦋', 'color': '#29B6F6'}, {'id': 14, 'emoji': '🐾', 'color': '#A1887F'},
    {'id': 15, 'emoji': '🎒', 'color': '#EF5350'}, {'id': 16, 'emoji': '🗻', 'color': '#7E57C2'},
    {'id': 17, 'emoji': '🌊', 'color': '#0097A7'}, {'id': 18, 'emoji': '🔥', 'color': '#FF5722'},
    {'id': 19, 'emoji': '❄️', 'color': '#90CAF9'}, {'id': 20, 'emoji': '🌈', 'color': '#9CCC65'},
]

def require_admin(user_id: int, db: Session):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def send_content_removal_email(recipient_email: str, user_name: str, content_type: str, post_title: str, report_reason: str):
    """Send a professional content-removal notification email."""
    if not EMAIL_SENDER or not EMAIL_PASSWORD:
        logger.warning("Email credentials not configured — skipping removal notification.")
        return

    is_comment = content_type == "comment"
    subject = f"Your {'comment' if is_comment else 'post'} has been removed — Smart Itinerary Planner"

    if is_comment:
        headline = "Your comment has been removed"
        blurb    = f'Your comment on the post <strong style="color:#D0D2EB;">"{post_title}"</strong> was reviewed by our moderation team and has been permanently removed from the community.'
    else:
        headline = "Your post has been removed"
        blurb    = f'Your post titled <strong style="color:#D0D2EB;">"{post_title}"</strong> was reviewed by our moderation team and has been permanently removed from the community.'

    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0F1120;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F1120;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#141627;border-radius:16px;border:1px solid #252845;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1f3a 0%,#141627 100%);padding:28px 36px 20px;border-bottom:1px solid #252845;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:20px;font-weight:800;color:#33CCCC;letter-spacing:-0.3px;">Smart Itinerary Planner</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#7B809A;letter-spacing:0.5px;text-transform:uppercase;">Community Standards Notice</p>
                </td>
                <td align="right">
                  <div style="width:36px;height:36px;background:rgba(255,107,107,0.12);border:1px solid rgba(255,107,107,0.3);border-radius:50%;text-align:center;line-height:36px;font-size:18px;">&#9888;</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#EAECF8;">{headline}</p>
            <p style="margin:0 0 24px;font-size:13px;color:#7B809A;">Hi {user_name},</p>

            <p style="margin:0 0 20px;font-size:14px;color:#A8AABD;line-height:1.7;">
              {blurb}
            </p>

            <!-- Reason box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background:#1E2240;border-left:3px solid #FF6B6B;border-radius:0 8px 8px 0;padding:16px 20px;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#FF6B6B;text-transform:uppercase;letter-spacing:0.8px;">Reason for removal</p>
                  <p style="margin:0;font-size:14px;color:#D0D2EB;line-height:1.6;">{report_reason}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:14px;color:#A8AABD;line-height:1.7;">
              We take community safety seriously and apply our
              <span style="color:#33CCCC;">Community Guidelines</span> to all content. This action was taken to
              maintain a respectful and trustworthy environment for all travellers.
            </p>

            <p style="margin:0 0 28px;font-size:14px;color:#A8AABD;line-height:1.7;">
              If you believe this was a mistake, please reply to this email or reach out to our support team. We are happy to review the decision.
            </p>

            <!-- Divider -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr><td style="height:1px;background:#252845;"></td></tr>
            </table>

            <p style="margin:0;font-size:13px;color:#7B809A;line-height:1.7;">
              Thank you for being part of the Smart Itinerary Planner community. We hope you continue to share your Nepal travel experiences with us.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0F1120;padding:20px 36px;border-top:1px solid #252845;">
            <p style="margin:0;font-size:11px;color:#4A4D6A;text-align:center;">
              &copy; {datetime.utcnow().year} Smart Itinerary Planner &nbsp;&middot;&nbsp; This is an automated message, please do not reply directly.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"Smart Itinerary Planner <{EMAIL_SENDER}>"
    msg["To"]      = recipient_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_SENDER, recipient_email, msg.as_string())
        logger.info(f"Content removal email sent to {recipient_email}")
    except Exception as e:
        logger.error(f"Failed to send removal email to {recipient_email}: {e}")


def send_otp_email(recipient_email: str, otp: str, user_name: str):
    """Send OTP email via Gmail SMTP SSL."""
    if not EMAIL_SENDER or not EMAIL_PASSWORD:
        raise Exception("Email credentials not configured. Set EMAIL_SENDER and EMAIL_PASSWORD in .env")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Smart Itinerary Password Reset OTP"
    msg["From"] = EMAIL_SENDER
    msg["To"] = recipient_email

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #141627; padding: 32px; border-radius: 12px;">
        <h2 style="color: #33CCCC; margin: 0 0 8px 0;">Smart Itinerary Planner</h2>
        <p style="color: #D0D2EB; margin: 0 0 8px 0;">Hi {user_name},</p>
        <p style="color: #D0D2EB; margin: 0 0 24px 0;">You requested a password reset. Use the OTP below to continue:</p>
        <div style="background: #252845; border: 2px solid #33CCCC; border-radius: 10px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
            <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #33CCCC; font-family: monospace;">{otp}</span>
        </div>
        <p style="color: #7B809A; font-size: 13px; margin: 0 0 8px 0;">
            This OTP expires in <strong style="color: #D0D2EB;">10 minutes</strong>.
        </p>
        <p style="color: #7B809A; font-size: 13px; margin: 0;">
            If you did not request this, you can safely ignore this email.
        </p>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_SENDER, recipient_email, msg.as_string())


# ============================================
# ROOT & HEALTH
# ============================================
@app.get("/")
def read_root():
    return {
        "message": "Welcome to Smart Itinerary API",
        "version": "3.0.0",
        "features": [
            "User Management",
            "Nested Itineraries",
            "Activities with Google Places Integration",
            "Accommodations",
            "Transportation",
            "Weather Integration",
            "Community Updates",
            "Comments & Tags"
        ],
        "status": "running",
        "documentation": "/docs"
    }

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Service unavailable")


# ============================================
# USER ENDPOINTS
# ============================================
@app.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        if not user.name or len(user.name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Name must be at least 2 characters long")
        if not user.password or len(user.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
        email_lower = user.email.strip().lower()
        existing_user = db.query(models.User).filter(models.User.email == email_lower).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        new_user = models.User(
            name=user.name.strip(),
            email=email_lower,
            hashed_password=get_password_hash(user.password),
            username=generate_username(db),
            avatar_id=random.randint(1, 30),
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
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/login", response_model=schemas.UserOut)
def login_user(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    try:
        email_lower = user_credentials.email.strip().lower()
        user = db.query(models.User).filter(models.User.email == email_lower).first()
        if not user or not verify_password(user_credentials.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        user.last_login = datetime.utcnow()
        db.commit()
        logger.info(f"User logged in: {user.email}")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/users/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
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
        raise HTTPException(status_code=500, detail="Failed to update user")

@app.get("/users/", response_model=List[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    try:
        return db.query(models.User).order_by(models.User.created_at.desc()).all()
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(status_code=500, detail="Failed to list users")

@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.delete(user)
        db.commit()
        logger.info(f"User deleted: {user_id}")
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete user")

@app.patch("/users/{user_id}/credentials")
def update_credentials(user_id: int, payload: dict, db: Session = Depends(get_db)):
    """Admin-only: update email and/or password."""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can use this endpoint")
        new_email = payload.get("email", "").strip().lower()
        current_password = payload.get("current_password", "")
        new_password = payload.get("new_password", "")
        if new_email and new_email != user.email:
            existing = db.query(models.User).filter(models.User.email == new_email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already in use")
            user.email = new_email
        if new_password:
            if not current_password:
                raise HTTPException(status_code=400, detail="Current password is required to set a new password")
            if not verify_password(current_password, user.hashed_password):
                raise HTTPException(status_code=401, detail="Current password is incorrect")
            if len(new_password) < 6:
                raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
            user.hashed_password = get_password_hash(new_password)
        db.commit()
        db.refresh(user)
        return {"message": "Credentials updated successfully", "email": user.email}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating credentials: {e}")
        raise HTTPException(status_code=500, detail="Failed to update credentials")

@app.patch("/users/{user_id}/role", response_model=schemas.UserOut)
def update_user_role(user_id: int, role: str = Query(..., pattern="^(user|admin)$"), db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.role = role
        db.commit()
        db.refresh(user)
        logger.info(f"User {user_id} role updated to: {role}")
        return user
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating user role: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user role")


# ============================================
# AUTH — GOOGLE + PASSWORD RESET WITH OTP
# ============================================
@app.post("/auth/google")
async def google_auth(payload: dict, db: Session = Depends(get_db)):
    """Receive Google OAuth access token, find or create user, return user record."""
    access_token = payload.get("token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Google access token is required")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10.0
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired Google token")

    google_user = resp.json()
    email = google_user.get("email", "").strip().lower()
    name = google_user.get("name", "")
    picture = google_user.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google account")

    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            if picture and user.profile_picture_url != picture:
                user.profile_picture_url = picture
            user.last_login = datetime.utcnow()
            db.commit()
            db.refresh(user)
            logger.info(f"Google login: existing user {email}")
        else:
            user = models.User(
                name=name or email.split("@")[0],
                email=email,
                hashed_password=get_password_hash(secrets.token_hex(32)),
                profile_picture_url=picture or None,
                role="user",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Google login: new user created {email}")

        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
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
        raise HTTPException(status_code=500, detail="Google authentication failed")


@app.post("/auth/forgot-password")
def forgot_password(payload: dict, db: Session = Depends(get_db)):
    """
    Step 1: Verify email exists, generate 6-digit OTP,
    send it to the user's email, return user_id.
    """
    email = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address")

    # delete any existing unused OTPs for this user
    db.query(models.PasswordResetOTP).filter(
        models.PasswordResetOTP.user_id == user.id,
        models.PasswordResetOTP.is_used == False
    ).delete()
    db.commit()

    # generate and save OTP
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    otp_record = models.PasswordResetOTP(
        user_id=user.id,
        otp_code=otp_code,
        expires_at=expires_at,
    )
    db.add(otp_record)
    db.commit()

    # send email
    try:
        send_otp_email(user.email, otp_code, user.name)
        logger.info(f"OTP sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send OTP email to {user.email}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send OTP email. Please check your email configuration in .env (EMAIL_SENDER, EMAIL_PASSWORD)."
        )

    return {"message": "OTP sent to your email", "user_id": user.id}


@app.post("/auth/verify-otp")
def verify_otp(payload: dict, db: Session = Depends(get_db)):
    """
    Step 2: Verify the 6-digit OTP.
    Marks the OTP as used so it can't be reused.
    """
    user_id = payload.get("user_id")
    otp_code = payload.get("otp_code", "").strip()

    if not user_id or not otp_code:
        raise HTTPException(status_code=400, detail="User ID and OTP are required")

    otp_record = db.query(models.PasswordResetOTP).filter(
        models.PasswordResetOTP.user_id == user_id,
        models.PasswordResetOTP.otp_code == otp_code,
        models.PasswordResetOTP.is_used == False,
    ).first()

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please check and try again.")

    if datetime.utcnow() > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    otp_record.is_used = True
    db.commit()

    return {"message": "OTP verified", "user_id": user_id}


@app.post("/auth/reset-password")
def reset_password(payload: dict, db: Session = Depends(get_db)):
    """
    Step 3: Set new password after OTP has been verified.
    """
    user_id = payload.get("user_id")
    new_password = payload.get("new_password", "")
    confirm_password = payload.get("confirm_password", "")

    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    if not new_password:
        raise HTTPException(status_code=400, detail="New password is required")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if new_password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        logger.info(f"Password reset for user {user.email}")
        return {"message": "Password reset successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Password reset error: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset password")


# ============================================
# ITINERARY ENDPOINTS
# ============================================
@app.post("/itineraries", response_model=schemas.ItineraryOut, status_code=status.HTTP_201_CREATED)
def create_itinerary(itinerary: schemas.ItineraryCreate, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.id == itinerary.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        new_itinerary = models.Itinerary(**itinerary.dict())
        db.add(new_itinerary)
        db.commit()
        db.refresh(new_itinerary)
        logger.info(f"Itinerary created: {new_itinerary.title} by user {user.email}")
        return new_itinerary
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating itinerary: {e}")
        raise HTTPException(status_code=500, detail="Failed to create itinerary")

@app.post("/itineraries/complete", response_model=schemas.ItineraryDetailOut, status_code=status.HTTP_201_CREATED)
def create_complete_itinerary(itinerary: schemas.ItineraryCreateWithDays, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.id == itinerary.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        itinerary_data = itinerary.dict(exclude={'days', 'accommodations', 'transportation', 'tags'})
        new_itinerary = models.Itinerary(**itinerary_data)
        db.add(new_itinerary)
        db.flush()
        for day_data in itinerary.days:
            day_dict = day_data.dict(exclude={'activities'}) if hasattr(day_data, 'dict') else day_data
            new_day = models.ItineraryDay(**day_dict, itinerary_id=new_itinerary.id)
            db.add(new_day)
        for acc_data in itinerary.accommodations:
            acc_dict = acc_data.dict() if hasattr(acc_data, 'dict') else acc_data
            db.add(models.Accommodation(**acc_dict, itinerary_id=new_itinerary.id))
        for trans_data in itinerary.transportation:
            trans_dict = trans_data.dict() if hasattr(trans_data, 'dict') else trans_data
            db.add(models.Transportation(**trans_dict, itinerary_id=new_itinerary.id))
        for tag_str in itinerary.tags:
            db.add(models.ItineraryTag(tag=tag_str, itinerary_id=new_itinerary.id))
        db.commit()
        db.refresh(new_itinerary)
        logger.info(f"Complete itinerary created: {new_itinerary.title}")
        return new_itinerary
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating complete itinerary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/itineraries/user/{user_id}")
def get_user_itineraries(user_id: int, status_filter: Optional[str] = Query(None), db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        query = db.query(models.Itinerary).filter(models.Itinerary.user_id == user_id)
        if status_filter:
            query = query.filter(models.Itinerary.status == status_filter)
        itineraries = query.order_by(models.Itinerary.start_date.desc()).all()

        # auto-update status based on dates
        from datetime import date as date_type
        today = date_type.today()
        changed = False
        for itin in itineraries:
            old_status = itin.status
            if old_status in ('cancelled', 'draft'):
                continue
            if itin.end_date and itin.end_date < today:
                itin.status = 'completed'
            elif itin.start_date and itin.start_date <= today and itin.end_date and itin.end_date >= today:
                itin.status = 'ongoing'
            elif itin.start_date and itin.start_date > today and old_status not in ('draft',):
                if old_status == 'completed' or old_status == 'ongoing':
                    itin.status = 'planning'
            if itin.status != old_status:
                changed = True
        if changed:
            db.commit()

        # build response with cover photo from first mapped activity
        results = []
        for itin in itineraries:
            data = schemas.ItineraryOut.from_orm(itin).dict()
            # find first activity with a photo_reference
            cover_photo = None
            for day in itin.days:
                for act in day.activities:
                    if act.photo_reference:
                        cover_photo = act.photo_reference
                        break
                    # fallback: check places cache by place_id
                    if act.place_id and not cover_photo:
                        place = db.query(models.Place).filter(models.Place.google_place_id == act.place_id).first()
                        if place and place.photo_reference:
                            cover_photo = place.photo_reference
                            break
                if cover_photo:
                    break
            data['cover_photo'] = cover_photo
            # pass through the most recent weather_fetched_at from any day
            wfa = None
            for day in itin.days:
                if day.weather_fetched_at:
                    if wfa is None or day.weather_fetched_at > wfa:
                        wfa = day.weather_fetched_at
            data['weather_fetched_at'] = wfa
            results.append(data)
        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching itineraries: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch itineraries")

@app.get("/itineraries/public", response_model=List[schemas.ItinerarySummary])
def get_public_itineraries(destination: Optional[str] = Query(None), limit: int = Query(20, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    try:
        query = db.query(models.Itinerary).filter(models.Itinerary.is_public == True)
        if destination:
            query = query.filter(models.Itinerary.destination.ilike(f"%{destination}%"))
        itineraries = query.order_by(models.Itinerary.view_count.desc()).offset(offset).limit(limit).all()
        result = []
        for itin in itineraries:
            itin_dict = schemas.ItinerarySummary.from_orm(itin).dict()
            itin_dict['total_days'] = len(itin.days)
            itin_dict['total_activities'] = sum(len(day.activities) for day in itin.days)
            result.append(schemas.ItinerarySummary(**itin_dict))
        return result
    except Exception as e:
        logger.error(f"Error fetching public itineraries: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch public itineraries")

@app.get("/itineraries/{itinerary_id}", response_model=schemas.ItineraryDetailOut)
def get_itinerary_detail(itinerary_id: int, db: Session = Depends(get_db)):
    try:
        itinerary = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
        if not itinerary:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        itinerary.view_count += 1
        db.commit()
        return itinerary
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching itinerary detail: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch itinerary")

@app.put("/itineraries/{itinerary_id}", response_model=schemas.ItineraryOut)
def update_itinerary(itinerary_id: int, itinerary_update: schemas.ItineraryUpdate, user_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    try:
        itinerary = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
        if not itinerary:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        # If user_id provided, check owner or accepted collaborator
        if user_id is not None:
            is_owner = itinerary.user_id == user_id
            is_collaborator = db.query(models.ItineraryCollaborator).filter(
                models.ItineraryCollaborator.itinerary_id == itinerary_id,
                models.ItineraryCollaborator.user_id == user_id,
                models.ItineraryCollaborator.status == 'accepted',
            ).first() is not None
            if not is_owner and not is_collaborator:
                raise HTTPException(status_code=403, detail="Not authorized to update this itinerary")
        for field, value in itinerary_update.dict(exclude_unset=True).items():
            setattr(itinerary, field, value)
        db.commit()
        db.refresh(itinerary)
        return itinerary
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating itinerary: {e}")
        raise HTTPException(status_code=500, detail="Failed to update itinerary")

@app.delete("/itineraries/{itinerary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_itinerary(itinerary_id: int, db: Session = Depends(get_db)):
    try:
        itinerary = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
        if not itinerary:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        db.delete(itinerary)
        db.commit()
        logger.info(f"Itinerary deleted: {itinerary_id}")
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting itinerary: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete itinerary")


# ============================================
# ITINERARY COLLABORATION ENDPOINTS
# ============================================

@app.get("/itineraries/user/{user_id}/collaborations")
def get_user_collaborations(user_id: int, db: Session = Depends(get_db)):
    """Get itineraries where user is an accepted collaborator (not the owner)"""
    try:
        collab_records = db.query(models.ItineraryCollaborator).filter(
            models.ItineraryCollaborator.user_id == user_id,
            models.ItineraryCollaborator.status == 'accepted',
        ).all()
        result = []
        for c in collab_records:
            itin = db.query(models.Itinerary).filter(models.Itinerary.id == c.itinerary_id).first()
            if itin:
                result.append({
                    "id": itin.id,
                    "title": itin.title,
                    "destination": itin.destination,
                    "cover_image_url": itin.cover_image_url,
                    "start_date": itin.start_date.isoformat(),
                    "end_date": itin.end_date.isoformat(),
                    "status": itin.status,
                    "estimated_budget": itin.estimated_budget,
                    "currency": itin.currency,
                    "is_public": itin.is_public,
                    "view_count": itin.view_count,
                    "like_count": itin.like_count,
                    "total_days": len(itin.days),
                    "total_activities": sum(len(d.activities) for d in itin.days),
                    "created_at": itin.created_at.isoformat(),
                    "owner_username": itin.owner.username if itin.owner else None,
                    "my_role": c.role,
                })
        return result
    except Exception as e:
        logger.error(f"Error fetching collaborations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch collaborations")


@app.get("/itineraries/user/{user_id}/pending-collabs")
def get_pending_collaboration_invites(user_id: int, db: Session = Depends(get_db)):
    """Get pending collaboration invites for a user."""
    collabs = db.query(models.ItineraryCollaborator).filter(
        models.ItineraryCollaborator.user_id == user_id,
        models.ItineraryCollaborator.status == 'pending',
    ).all()
    result = []
    for c in collabs:
        itin = db.query(models.Itinerary).filter(models.Itinerary.id == c.itinerary_id).first()
        inviter = db.query(models.User).filter(models.User.id == c.invited_by).first()
        if itin:
            result.append({
                "collab_id": c.id,
                "itinerary_id": c.itinerary_id,
                "itinerary_title": itin.title,
                "itinerary_destination": itin.destination,
                "invited_by_username": inviter.username if inviter else "Unknown",
                "invited_by_avatar_id": inviter.avatar_id if inviter else 1,
                "created_at": c.created_at.isoformat(),
            })
    return result


@app.post("/itineraries/{itinerary_id}/fork")
def fork_itinerary(itinerary_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    """Create a copy of an itinerary in the requesting user's account."""
    original = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    if original.user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot fork your own itinerary")
    # Check if already forked
    existing = db.query(models.Itinerary).filter(
        models.Itinerary.user_id == user_id,
        models.Itinerary.forked_from == itinerary_id,
    ).first()
    if existing:
        return {"id": existing.id, "forked": False, "message": "Already forked"}
    try:
        fork = models.Itinerary(
            user_id=user_id,
            title=f"{original.title} (copy)",
            destination=original.destination,
            description=original.description,
            start_date=original.start_date,
            end_date=original.end_date,
            estimated_budget=original.estimated_budget,
            currency=original.currency,
            status="planning",
            is_public=False,
            forked_from=original.id,
        )
        db.add(fork)
        db.flush()
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
                new_act = models.Activity(
                    day_id=new_day.id,
                    title=act.title,
                    description=act.description,
                    location=act.location,
                    latitude=act.latitude,
                    longitude=act.longitude,
                    place_id=act.place_id,
                    formatted_address=act.formatted_address,
                    place_types=act.place_types,
                    rating=act.rating,
                    start_time=act.start_time,
                    end_time=act.end_time,
                    duration_minutes=act.duration_minutes,
                    activity_type=act.activity_type,
                    cost=act.cost,
                    priority=act.priority,
                    display_order=act.display_order,
                    notes=act.notes,
                )
                db.add(new_act)
        db.commit()
        db.refresh(fork)
        return {"id": fork.id, "forked": True, "message": "Itinerary forked successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error forking itinerary: {e}")
        raise HTTPException(status_code=500, detail="Failed to fork itinerary")


@app.post("/itineraries/{itinerary_id}/collaborators")
def invite_collaborator(itinerary_id: int, invite: schemas.CollaboratorInvite, user_id: int = Query(...), db: Session = Depends(get_db)):
    """Invite a user (by username) to collaborate on an itinerary."""
    itinerary = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    if itinerary.user_id != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can invite collaborators")
    target = db.query(models.User).filter(models.User.username == invite.username).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot invite yourself")
    existing = db.query(models.ItineraryCollaborator).filter(
        models.ItineraryCollaborator.itinerary_id == itinerary_id,
        models.ItineraryCollaborator.user_id == target.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already invited or a collaborator")
    try:
        collab = models.ItineraryCollaborator(
            itinerary_id=itinerary_id,
            user_id=target.id,
            invited_by=user_id,
            role="editor",
            status="pending",
        )
        db.add(collab)
        inviter = db.query(models.User).filter(models.User.id == user_id).first()
        notif = models.Notification(
            user_id=target.id,
            type="collab_invite",
            message=f"{inviter.username if inviter else 'Someone'} invited you to collaborate on '{itinerary.title}'",
            from_user_id=user_id,
        )
        db.add(notif)
        db.commit()
        return {"status": "invited", "username": target.username}
    except Exception as e:
        db.rollback()
        logger.error(f"Error inviting collaborator: {e}")
        raise HTTPException(status_code=500, detail="Failed to invite collaborator")


@app.get("/itineraries/{itinerary_id}/collaborators")
def get_collaborators(itinerary_id: int, db: Session = Depends(get_db)):
    """List all collaborators for an itinerary."""
    collabs = db.query(models.ItineraryCollaborator).filter(
        models.ItineraryCollaborator.itinerary_id == itinerary_id,
    ).all()
    result = []
    for c in collabs:
        user = db.query(models.User).filter(models.User.id == c.user_id).first()
        if user:
            result.append({
                "id": c.id,
                "user_id": c.user_id,
                "username": user.username,
                "avatar_id": user.avatar_id,
                "role": c.role,
                "status": c.status,
                "invited_by": c.invited_by,
                "created_at": c.created_at.isoformat(),
                "accepted_at": c.accepted_at.isoformat() if c.accepted_at else None,
            })
    return result


@app.patch("/itineraries/{itinerary_id}/collaborators/accept")
def accept_collaboration(itinerary_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    """Accept a collaboration invite."""
    from datetime import datetime as dt
    collab = db.query(models.ItineraryCollaborator).filter(
        models.ItineraryCollaborator.itinerary_id == itinerary_id,
        models.ItineraryCollaborator.user_id == user_id,
    ).first()
    if not collab:
        raise HTTPException(status_code=404, detail="Collaboration invite not found")
    collab.status = "accepted"
    collab.accepted_at = dt.utcnow()
    db.commit()
    return {"status": "accepted"}


@app.patch("/itineraries/{itinerary_id}/collaborators/reject")
def reject_collaboration(itinerary_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    """Reject a collaboration invite."""
    collab = db.query(models.ItineraryCollaborator).filter(
        models.ItineraryCollaborator.itinerary_id == itinerary_id,
        models.ItineraryCollaborator.user_id == user_id,
    ).first()
    if not collab:
        raise HTTPException(status_code=404, detail="Collaboration invite not found")
    db.delete(collab)
    db.commit()
    return {"status": "rejected"}


@app.delete("/itineraries/{itinerary_id}/collaborators/{collab_user_id}")
def remove_collaborator(itinerary_id: int, collab_user_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    """Remove a collaborator (owner can remove anyone; collaborator can remove themselves)."""
    itinerary = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    collab = db.query(models.ItineraryCollaborator).filter(
        models.ItineraryCollaborator.itinerary_id == itinerary_id,
        models.ItineraryCollaborator.user_id == collab_user_id,
    ).first()
    if not collab:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    if itinerary.user_id != user_id and collab_user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(collab)
    db.commit()
    return {"status": "removed"}


# ============================================
# DAY & ACTIVITY ENDPOINTS
# ============================================
@app.post("/itinerary-days", response_model=schemas.ItineraryDayOut, status_code=status.HTTP_201_CREATED)
def create_itinerary_day(day: schemas.ItineraryDayCreate, db: Session = Depends(get_db)):
    try:
        day_data = day.dict(exclude={'activities'})
        new_day = models.ItineraryDay(**day_data)
        db.add(new_day)
        db.flush()
        for activity_data in day.activities:
            activity_dict = activity_data.dict() if hasattr(activity_data, 'dict') else activity_data
            db.add(models.Activity(**activity_dict, day_id=new_day.id))
        db.commit()
        db.refresh(new_day)
        return new_day
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating day: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/itinerary-days/{day_id}", response_model=schemas.ItineraryDayOut)
def update_itinerary_day(day_id: int, day_update: schemas.ItineraryDayUpdate, db: Session = Depends(get_db)):
    try:
        day = db.query(models.ItineraryDay).filter(models.ItineraryDay.id == day_id).first()
        if not day:
            raise HTTPException(status_code=404, detail="Day not found")
        for field, value in day_update.dict(exclude_unset=True).items():
            setattr(day, field, value)
        db.commit()
        db.refresh(day)
        return day
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating day: {e}")
        raise HTTPException(status_code=500, detail="Failed to update day")

@app.delete("/itinerary-days/{day_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_itinerary_day(day_id: int, db: Session = Depends(get_db)):
    try:
        day = db.query(models.ItineraryDay).filter(models.ItineraryDay.id == day_id).first()
        if not day:
            raise HTTPException(status_code=404, detail="Day not found")
        db.delete(day)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting day: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete day")

@app.post("/activities", response_model=schemas.ActivityOut, status_code=status.HTTP_201_CREATED)
def create_activity(activity: schemas.ActivityCreate, db: Session = Depends(get_db)):
    try:
        new_activity = models.Activity(**activity.dict())
        db.add(new_activity)
        db.commit()
        db.refresh(new_activity)
        return new_activity
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating activity: {e}")
        raise HTTPException(status_code=500, detail="Failed to create activity")

@app.get("/itinerary-days/{day_id}/activities", response_model=List[schemas.ActivityOut])
def get_day_activities(day_id: int, db: Session = Depends(get_db)):
    try:
        return db.query(models.Activity).filter(models.Activity.day_id == day_id).order_by(models.Activity.start_time).all()
    except Exception as e:
        logger.error(f"Error fetching activities: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch activities")

@app.put("/activities/{activity_id}", response_model=schemas.ActivityOut)
def update_activity(activity_id: int, activity_update: schemas.ActivityUpdate, db: Session = Depends(get_db)):
    try:
        activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        for field, value in activity_update.dict(exclude_unset=True).items():
            setattr(activity, field, value)
        db.commit()
        db.refresh(activity)
        return activity
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating activity: {e}")
        raise HTTPException(status_code=500, detail="Failed to update activity")

@app.delete("/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    try:
        activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        db.delete(activity)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting activity: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete activity")


# ============================================
# ACCOMMODATION ENDPOINTS
# ============================================
@app.post("/accommodations", response_model=schemas.AccommodationOut, status_code=status.HTTP_201_CREATED)
def create_accommodation(accommodation: schemas.AccommodationCreate, db: Session = Depends(get_db)):
    try:
        new_acc = models.Accommodation(**accommodation.dict())
        db.add(new_acc)
        db.commit()
        db.refresh(new_acc)
        return new_acc
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating accommodation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create accommodation")

@app.get("/itineraries/{itinerary_id}/accommodations", response_model=List[schemas.AccommodationOut])
def get_itinerary_accommodations(itinerary_id: int, db: Session = Depends(get_db)):
    try:
        return db.query(models.Accommodation).filter(models.Accommodation.itinerary_id == itinerary_id).all()
    except Exception as e:
        logger.error(f"Error fetching accommodations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch accommodations")

@app.put("/accommodations/{accommodation_id}", response_model=schemas.AccommodationOut)
def update_accommodation(accommodation_id: int, accommodation_update: schemas.AccommodationUpdate, db: Session = Depends(get_db)):
    try:
        accommodation = db.query(models.Accommodation).filter(models.Accommodation.id == accommodation_id).first()
        if not accommodation:
            raise HTTPException(status_code=404, detail="Accommodation not found")
        for field, value in accommodation_update.dict(exclude_unset=True).items():
            setattr(accommodation, field, value)
        db.commit()
        db.refresh(accommodation)
        return accommodation
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating accommodation: {e}")
        raise HTTPException(status_code=500, detail="Failed to update accommodation")

@app.delete("/accommodations/{accommodation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_accommodation(accommodation_id: int, db: Session = Depends(get_db)):
    try:
        accommodation = db.query(models.Accommodation).filter(models.Accommodation.id == accommodation_id).first()
        if not accommodation:
            raise HTTPException(status_code=404, detail="Accommodation not found")
        db.delete(accommodation)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting accommodation: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete accommodation")


# ============================================
# TRANSPORTATION ENDPOINTS
# ============================================
@app.post("/transportation", response_model=schemas.TransportationOut, status_code=status.HTTP_201_CREATED)
def create_transportation(transportation: schemas.TransportationCreate, db: Session = Depends(get_db)):
    try:
        new_trans = models.Transportation(**transportation.dict())
        db.add(new_trans)
        db.commit()
        db.refresh(new_trans)
        return new_trans
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating transportation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create transportation")

@app.get("/itineraries/{itinerary_id}/transportation", response_model=List[schemas.TransportationOut])
def get_itinerary_transportation(itinerary_id: int, db: Session = Depends(get_db)):
    try:
        return db.query(models.Transportation).filter(models.Transportation.itinerary_id == itinerary_id).order_by(models.Transportation.departure_datetime).all()
    except Exception as e:
        logger.error(f"Error fetching transportation: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch transportation")

@app.put("/transportation/{transportation_id}", response_model=schemas.TransportationOut)
def update_transportation(transportation_id: int, transportation_update: schemas.TransportationUpdate, db: Session = Depends(get_db)):
    try:
        transportation = db.query(models.Transportation).filter(models.Transportation.id == transportation_id).first()
        if not transportation:
            raise HTTPException(status_code=404, detail="Transportation not found")
        for field, value in transportation_update.dict(exclude_unset=True).items():
            setattr(transportation, field, value)
        db.commit()
        db.refresh(transportation)
        return transportation
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating transportation: {e}")
        raise HTTPException(status_code=500, detail="Failed to update transportation")

@app.delete("/transportation/{transportation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transportation(transportation_id: int, db: Session = Depends(get_db)):
    try:
        transportation = db.query(models.Transportation).filter(models.Transportation.id == transportation_id).first()
        if not transportation:
            raise HTTPException(status_code=404, detail="Transportation not found")
        db.delete(transportation)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting transportation: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete transportation")


# ============================================
# TRIP NOTES ENDPOINTS
# ============================================
@app.post("/trip-notes", response_model=schemas.TripNoteOut, status_code=status.HTTP_201_CREATED)
def create_trip_note(note: schemas.TripNoteCreate, db: Session = Depends(get_db)):
    try:
        new_note = models.TripNote(**note.dict())
        db.add(new_note)
        db.commit()
        db.refresh(new_note)
        return new_note
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating note: {e}")
        raise HTTPException(status_code=500, detail="Failed to create note")

@app.get("/itineraries/{itinerary_id}/notes", response_model=List[schemas.TripNoteOut])
def get_itinerary_notes(itinerary_id: int, db: Session = Depends(get_db)):
    try:
        return db.query(models.TripNote).filter(models.TripNote.itinerary_id == itinerary_id).order_by(models.TripNote.created_at.desc()).all()
    except Exception as e:
        logger.error(f"Error fetching notes: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notes")

@app.put("/trip-notes/{note_id}", response_model=schemas.TripNoteOut)
def update_trip_note(note_id: int, note_update: schemas.TripNoteUpdate, db: Session = Depends(get_db)):
    try:
        note = db.query(models.TripNote).filter(models.TripNote.id == note_id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        for field, value in note_update.dict(exclude_unset=True).items():
            setattr(note, field, value)
        db.commit()
        db.refresh(note)
        return note
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating note: {e}")
        raise HTTPException(status_code=500, detail="Failed to update note")

@app.delete("/trip-notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip_note(note_id: int, db: Session = Depends(get_db)):
    try:
        note = db.query(models.TripNote).filter(models.TripNote.id == note_id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        db.delete(note)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting note: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete note")


# ============================================
# COMMENTS ENDPOINTS
# ============================================
@app.post("/comments", response_model=schemas.CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(comment: schemas.CommentCreate, user_id: int, db: Session = Depends(get_db)):
    try:
        new_comment = models.ItineraryComment(**comment.dict(), user_id=user_id)
        db.add(new_comment)
        db.commit()
        db.refresh(new_comment)
        return new_comment
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating comment: {e}")
        raise HTTPException(status_code=500, detail="Failed to create comment")

@app.get("/itineraries/{itinerary_id}/comments", response_model=List[schemas.CommentOut])
def get_itinerary_comments(itinerary_id: int, db: Session = Depends(get_db)):
    try:
        return db.query(models.ItineraryComment).filter(models.ItineraryComment.itinerary_id == itinerary_id).order_by(models.ItineraryComment.created_at.desc()).all()
    except Exception as e:
        logger.error(f"Error fetching comments: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch comments")


# ============================================
# COMMUNITY UPDATES ENDPOINTS
# ============================================
@app.post("/community-updates", response_model=schemas.CommunityUpdateOut, status_code=status.HTTP_201_CREATED)
def create_community_update(update: schemas.CommunityUpdateCreate, user_id: int, db: Session = Depends(get_db)):
    try:
        new_update = models.CommunityUpdate(**update.dict(), user_id=user_id)
        db.add(new_update)
        db.commit()
        db.refresh(new_update)
        return new_update
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating community update: {e}")
        raise HTTPException(status_code=500, detail="Failed to create update")

@app.get("/community-updates", response_model=List[schemas.CommunityUpdateOut])
def get_community_updates(location: Optional[str] = Query(None), update_type: Optional[str] = Query(None), active_only: bool = Query(True), limit: int = Query(50, le=100), db: Session = Depends(get_db)):
    try:
        query = db.query(models.CommunityUpdate)
        if active_only:
            query = query.filter(models.CommunityUpdate.is_active == True)
        if location:
            query = query.filter(models.CommunityUpdate.location.ilike(f"%{location}%"))
        if update_type:
            query = query.filter(models.CommunityUpdate.update_type == update_type)
        return query.order_by(models.CommunityUpdate.created_at.desc()).limit(limit).all()
    except Exception as e:
        logger.error(f"Error fetching community updates: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch updates")


# ============================================
# COMMUNITY POSTS ENDPOINTS
# ============================================
@app.post("/community/posts", response_model=schemas.CommunityPostOut, status_code=status.HTTP_201_CREATED)
def create_community_post(post: schemas.CommunityPostCreate, user_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        new_post = models.CommunityPost(**post.dict(), user_id=user_id)
        db.add(new_post)
        db.commit()
        db.refresh(new_post)
        result = schemas.CommunityPostOut.from_orm(new_post)
        result.author_name = user.username
        result.author_initial = user.username[0].upper()
        result.author_avatar_id = user.avatar_id or 1
        result.user_vote = None
        return result
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating post: {e}")
        raise HTTPException(status_code=500, detail="Failed to create post")

@app.get("/community/posts", response_model=List[schemas.CommunityPostOut])
def get_community_posts(tag: Optional[str] = Query(None), place: Optional[str] = Query(None), sort: str = Query("new"), user_id: Optional[int] = Query(None), limit: int = Query(50, le=100), db: Session = Depends(get_db)):
    try:
        query = db.query(models.CommunityPost)
        if tag:
            query = query.filter(models.CommunityPost.tag == tag)
        if place and place != "All":
            query = query.filter(models.CommunityPost.place.ilike(f"%{place}%"))
        if sort == "popular":
            query = query.order_by((models.CommunityPost.upvotes - models.CommunityPost.downvotes).desc())
        elif sort == "top":
            query = query.order_by(models.CommunityPost.upvotes.desc())
        else:
            query = query.order_by(models.CommunityPost.created_at.desc())
        posts = query.limit(limit).all()
        results = []
        for p in posts:
            out = schemas.CommunityPostOut.from_orm(p)
            out.author_name = p.author.username if p.author else "Unknown"
            out.author_initial = p.author.username[0].upper() if p.author else "U"
            out.author_avatar_id = p.author.avatar_id if p.author else 1
            if user_id:
                vote = db.query(models.PostVote).filter(models.PostVote.post_id == p.id, models.PostVote.user_id == user_id).first()
                out.user_vote = vote.direction if vote else None
                saved = db.query(models.SavedPost).filter(models.SavedPost.post_id == p.id, models.SavedPost.user_id == user_id).first()
                out.saved = bool(saved)
            else:
                out.user_vote = None
                out.saved = False
            results.append(out)
        return results
    except Exception as e:
        logger.error(f"Error fetching posts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch posts")

@app.post("/community/posts/{post_id}/save")
def toggle_save_post(post_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        existing = db.query(models.SavedPost).filter(models.SavedPost.post_id == post_id, models.SavedPost.user_id == user_id).first()
        if existing:
            db.delete(existing)
            db.commit()
            return {"saved": False}
        else:
            db.add(models.SavedPost(user_id=user_id, post_id=post_id))
            db.commit()
            return {"saved": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error toggling save: {e}")
        raise HTTPException(status_code=500, detail="Failed to save post")

@app.get("/community/saved", response_model=List[schemas.CommunityPostOut])
def get_saved_posts(user_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        saved = db.query(models.SavedPost).filter(models.SavedPost.user_id == user_id).order_by(models.SavedPost.created_at.desc()).all()
        results = []
        for s in saved:
            p = s.post if hasattr(s, 'post') else db.query(models.CommunityPost).filter(models.CommunityPost.id == s.post_id).first()
            if not p:
                continue
            out = schemas.CommunityPostOut.from_orm(p)
            out.author_name = p.author.username if p.author else "Unknown"
            out.author_initial = p.author.username[0].upper() if p.author else "U"
            out.author_avatar_id = p.author.avatar_id if p.author else 1
            vote = db.query(models.PostVote).filter(models.PostVote.post_id == p.id, models.PostVote.user_id == user_id).first()
            out.user_vote = vote.direction if vote else None
            out.saved = True
            results.append(out)
        return results
    except Exception as e:
        logger.error(f"Error fetching saved posts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch saved posts")

@app.post("/community/posts/{post_id}/vote")
def vote_on_post(post_id: int, vote: schemas.PostVoteRequest, user_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        existing = db.query(models.PostVote).filter(models.PostVote.post_id == post_id, models.PostVote.user_id == user_id).first()
        if existing:
            if existing.direction == vote.direction:
                if existing.direction == 'up':
                    post.upvotes = max(0, post.upvotes - 1)
                else:
                    post.downvotes = max(0, post.downvotes - 1)
                db.delete(existing)
                db.commit()
                return {"status": "removed", "upvotes": post.upvotes, "downvotes": post.downvotes}
            else:
                if existing.direction == 'up':
                    post.upvotes = max(0, post.upvotes - 1)
                    post.downvotes += 1
                else:
                    post.downvotes = max(0, post.downvotes - 1)
                    post.upvotes += 1
                existing.direction = vote.direction
                db.commit()
                return {"status": "switched", "upvotes": post.upvotes, "downvotes": post.downvotes}
        else:
            new_vote = models.PostVote(user_id=user_id, post_id=post_id, direction=vote.direction)
            if vote.direction == 'up':
                post.upvotes += 1
                # notify post owner of upvote (not for own posts, not for downvotes)
                if post.user_id != user_id:
                    voter = db.query(models.User).filter(models.User.id == user_id).first()
                    voter_name = voter.name if voter else "Someone"
                    notif = models.Notification(
                        user_id=post.user_id, type='upvote',
                        message=f'{voter_name} upvoted your post "{post.title[:40]}"',
                        post_id=post_id, from_user_id=user_id,
                    )
                    db.add(notif)
            else:
                post.downvotes += 1
            db.add(new_vote)
            db.commit()
            return {"status": "voted", "upvotes": post.upvotes, "downvotes": post.downvotes}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error voting: {e}")
        raise HTTPException(status_code=500, detail="Failed to vote")

@app.delete("/community/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_community_post(post_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        # admins can delete any post, regular users only their own
        user = db.query(models.User).filter(models.User.id == user_id).first()
        is_admin = user and user.role == "admin"
        if not is_admin and post.user_id != user_id:
            raise HTTPException(status_code=403, detail="You can only delete your own posts")
        db.delete(post)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting post: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete post")


# ============================================
# POST COMMENTS ENDPOINTS
# ============================================
@app.post("/community/posts/{post_id}/comments", response_model=schemas.PostCommentOut, status_code=status.HTTP_201_CREATED)
def create_post_comment(post_id: int, comment: schemas.PostCommentCreate, user_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        new_comment = models.PostComment(
            content=comment.content,
            post_id=post_id,
            user_id=user_id,
            parent_comment_id=comment.parent_comment_id,
        )
        db.add(new_comment)
        post.comment_count += 1
        db.commit()
        db.refresh(new_comment)

        result = schemas.PostCommentOut(
            id=new_comment.id,
            content=new_comment.content,
            post_id=new_comment.post_id,
            user_id=new_comment.user_id,
            parent_comment_id=new_comment.parent_comment_id,
            created_at=new_comment.created_at,
            author_name=user.username,
            author_initial=user.username[0].upper(),
            author_avatar_id=user.avatar_id or 1,
            reactions=[],
        )

        # notify post owner if someone else commented
        if post.user_id != user_id:
            notif = models.Notification(
                user_id=post.user_id,
                type='comment',
                message=f'{user.username} commented on your post "{post.title[:40]}"',
                post_id=post_id,
                from_user_id=user_id,
            )
            db.add(notif)
            db.commit()

        return result
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating comment: {e}")
        raise HTTPException(status_code=500, detail="Failed to create comment")

def _build_reaction_summary(comment, current_user_id):
    counts = {}
    for r in (comment.reactions or []):
        counts[r.emoji] = counts.get(r.emoji, 0) + 1
    user_emoji = next((r.emoji for r in (comment.reactions or []) if r.user_id == current_user_id), None)
    return [
        schemas.ReactionSummary(emoji=e, count=c, user_reacted=(e == user_emoji))
        for e, c in sorted(counts.items(), key=lambda x: -x[1])
    ]

@app.get("/community/posts/{post_id}/comments", response_model=List[schemas.PostCommentOut])
def get_post_comments(post_id: int, user_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    try:
        comments = db.query(models.PostComment).filter(
            models.PostComment.post_id == post_id
        ).order_by(models.PostComment.created_at.asc()).all()

        results = []
        for c in comments:
            out = schemas.PostCommentOut(
                id=c.id,
                content=c.content,
                post_id=c.post_id,
                user_id=c.user_id,
                parent_comment_id=c.parent_comment_id,
                created_at=c.created_at,
                author_name=c.user.username if c.user else "Unknown",
                author_initial=c.user.username[0].upper() if c.user else "U",
                author_avatar_id=c.user.avatar_id if c.user else 1,
                reactions=_build_reaction_summary(c, user_id),
            )
            results.append(out)
        return results
    except Exception as e:
        logger.error(f"Error fetching comments: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch comments")

@app.delete("/community/posts/{post_id}/comments/{comment_id}")
def delete_post_comment(post_id: int, comment_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        comment = db.query(models.PostComment).filter(
            models.PostComment.id == comment_id,
            models.PostComment.post_id == post_id,
        ).first()
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
        is_comment_author = comment.user_id == user_id
        is_post_author = post and post.user_id == user_id

        if not is_comment_author and not is_post_author:
            raise HTTPException(status_code=403, detail="Not allowed to delete this comment")

        db.delete(comment)
        if post and post.comment_count and post.comment_count > 0:
            post.comment_count -= 1
        db.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting comment: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete comment")

@app.post("/community/posts/{post_id}/comments/{comment_id}/react")
def react_to_comment(post_id: int, comment_id: int, user_id: int = Query(...), emoji: str = Query(...), db: Session = Depends(get_db)):
    try:
        comment = db.query(models.PostComment).filter(models.PostComment.id == comment_id).first()
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        existing = db.query(models.PostCommentReaction).filter(
            models.PostCommentReaction.comment_id == comment_id,
            models.PostCommentReaction.user_id == user_id,
        ).first()

        if existing:
            if existing.emoji == emoji:
                # toggle off
                db.delete(existing)
            else:
                # switch emoji
                existing.emoji = emoji
        else:
            db.add(models.PostCommentReaction(comment_id=comment_id, user_id=user_id, emoji=emoji))

        db.commit()
        db.refresh(comment)
        return {"reactions": _build_reaction_summary(comment, user_id)}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error reacting to comment: {e}")
        raise HTTPException(status_code=500, detail="Failed to react")


# ============================================
# REPORT ENDPOINTS
# ============================================
@app.post("/community/posts/{post_id}/report", status_code=status.HTTP_201_CREATED)
def report_post(post_id: int, report: schemas.PostReportCreate, user_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        new_report = models.PostReport(reporter_id=user_id, post_id=post_id, reason=report.reason)
        db.add(new_report)
        db.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error reporting post: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit report")

@app.post("/community/posts/{post_id}/comments/{comment_id}/report", status_code=status.HTTP_201_CREATED)
def report_comment(post_id: int, comment_id: int, report: schemas.PostReportCreate, user_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        comment = db.query(models.PostComment).filter(models.PostComment.id == comment_id).first()
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        new_report = models.PostReport(reporter_id=user_id, post_id=post_id, comment_id=comment_id, reason=report.reason)
        db.add(new_report)
        db.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error reporting comment: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit report")

@app.get("/admin/reports")
def admin_list_reports(admin_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    reports = db.query(models.PostReport).order_by(models.PostReport.created_at.desc()).all()
    result = []
    for r in reports:
        result.append({
            "id": r.id,
            "reporter_id": r.reporter_id,
            "reporter_username": r.reporter.username if r.reporter else f"User #{r.reporter_id}",
            "post_id": r.post_id,
            "post_title": r.post.title if r.post else None,
            "comment_id": r.comment_id,
            "comment_content": r.comment.content[:100] if r.comment else None,
            "reason": r.reason,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return result

@app.patch("/admin/reports/{report_id}")
def admin_update_report(report_id: int, admin_id: int = Query(...), new_status: str = Query(...), db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    report = db.query(models.PostReport).filter(models.PostReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.status = new_status
    db.commit()
    return {"ok": True}

@app.delete("/admin/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_report(report_id: int, admin_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    report = db.query(models.PostReport).filter(models.PostReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(report)
    db.commit()

@app.delete("/admin/reports/{report_id}/content", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_reported_content(report_id: int, admin_id: int = Query(...), db: Session = Depends(get_db)):
    """Delete the reported post or comment, then dismiss the report and email the author."""
    require_admin(admin_id, db)
    report = db.query(models.PostReport).filter(models.PostReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Collect info needed for the notification email before deleting
    notify_email    = None
    notify_username = None
    content_type    = None
    post_title      = None
    report_reason   = report.reason or "Violation of community guidelines"

    if report.comment_id:
        comment = db.query(models.PostComment).filter(models.PostComment.id == report.comment_id).first()
        if comment:
            author = db.query(models.User).filter(models.User.id == comment.user_id).first()
            parent_post = db.query(models.CommunityPost).filter(models.CommunityPost.id == comment.post_id).first()
            notify_email    = author.email    if author      else None
            notify_username = author.username if author      else None
            post_title      = parent_post.title if parent_post else "a community post"
            content_type    = "comment"
            if parent_post and parent_post.comment_count and parent_post.comment_count > 0:
                parent_post.comment_count -= 1
            db.delete(comment)
    elif report.post_id:
        post = db.query(models.CommunityPost).filter(models.CommunityPost.id == report.post_id).first()
        if post:
            author = db.query(models.User).filter(models.User.id == post.user_id).first()
            notify_email    = author.email    if author else None
            notify_username = author.username if author else None
            post_title      = post.title
            content_type    = "post"
            db.delete(post)

    report.status = "reviewed"
    db.commit()

    # Send email notification after committing (non-blocking — failure won't roll back)
    if notify_email and content_type and post_title:
        send_content_removal_email(
            recipient_email=notify_email,
            user_name=notify_username or "Community Member",
            content_type=content_type,
            post_title=post_title,
            report_reason=report_reason,
        )


# ============================================
# NOTIFICATIONS ENDPOINTS
# ============================================
@app.get("/notifications/{user_id}", response_model=List[schemas.NotificationOut])
def get_notifications(user_id: int, unread_only: bool = Query(False), limit: int = Query(20, le=50), db: Session = Depends(get_db)):
    try:
        query = db.query(models.Notification).filter(models.Notification.user_id == user_id)
        if unread_only:
            query = query.filter(models.Notification.is_read == False)
        return query.order_by(models.Notification.created_at.desc()).limit(limit).all()
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")

@app.patch("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(models.Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"status": "read"}

@app.patch("/notifications/{user_id}/read-all")
def mark_all_read(user_id: int, db: Session = Depends(get_db)):
    db.query(models.Notification).filter(
        models.Notification.user_id == user_id, models.Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "all_read"}

@app.get("/notifications/{user_id}/unread-count")
def get_unread_count(user_id: int, db: Session = Depends(get_db)):
    count = db.query(models.Notification).filter(
        models.Notification.user_id == user_id, models.Notification.is_read == False
    ).count()
    return {"count": count}


# ============================================
# COMPLAINTS ENDPOINTS
# ============================================
@app.post("/complaints", response_model=schemas.ComplaintOut, status_code=status.HTTP_201_CREATED)
def create_complaint(complaint: schemas.ComplaintCreate, user_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        new_complaint = models.Complaint(**complaint.dict(), user_id=user_id)
        db.add(new_complaint)
        db.commit()
        db.refresh(new_complaint)
        return new_complaint
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating complaint: {e}")
        raise HTTPException(status_code=500, detail="Failed to create complaint")

@app.get("/complaints/")
def list_complaints(status_filter: Optional[str] = Query(None), db: Session = Depends(get_db)):
    try:
        query = db.query(models.Complaint)
        if status_filter:
            query = query.filter(models.Complaint.status == status_filter)
        complaints = query.order_by(models.Complaint.created_at.desc()).all()
        result = []
        for c in complaints:
            user = db.query(models.User).filter(models.User.id == c.user_id).first()
            result.append({
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "category": c.category,
                "status": c.status,
                "user_id": c.user_id,
                "user_name": user.username if user else f"User #{c.user_id}",
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            })
        return result
    except Exception as e:
        logger.error(f"Error listing complaints: {e}")
        raise HTTPException(status_code=500, detail="Failed to list complaints")

@app.patch("/complaints/{complaint_id}", response_model=schemas.ComplaintOut)
def update_complaint(complaint_id: int, complaint_update: schemas.ComplaintUpdate, db: Session = Depends(get_db)):
    try:
        complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        for field, value in complaint_update.dict(exclude_unset=True).items():
            setattr(complaint, field, value)
        db.commit()
        db.refresh(complaint)
        return complaint
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating complaint: {e}")
        raise HTTPException(status_code=500, detail="Failed to update complaint")

@app.delete("/complaints/{complaint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_complaint(complaint_id: int, db: Session = Depends(get_db)):
    try:
        complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        db.delete(complaint)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting complaint: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete complaint")


# ============================================
# DEBUG ENDPOINTS
# ============================================
@app.get("/debug/users")
def get_all_users_debug(db: Session = Depends(get_db)):
    try:
        users = db.query(models.User).all()
        return {"count": len(users), "users": [{"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in users]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/debug/seed-admin")
def seed_admin(db: Session = Depends(get_db)):
    try:
        existing_admin = db.query(models.User).filter(models.User.role == "admin").first()
        if existing_admin:
            return {"message": f"Admin already exists: {existing_admin.email}", "id": existing_admin.id}
        first_user = db.query(models.User).order_by(models.User.id).first()
        if first_user:
            first_user.role = "admin"
            db.commit()
            return {"message": f"Promoted '{first_user.name}' ({first_user.email}) to admin", "id": first_user.id}
        admin = models.User(name="Admin", email="admin@smartitinerary.com", hashed_password=get_password_hash("admin123"), role="admin")
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return {"message": "Admin user created", "id": admin.id, "email": admin.email, "password": "admin123"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug/itineraries")
def get_all_itineraries(db: Session = Depends(get_db)):
    try:
        from datetime import date as date_type
        today = date_type.today()
        itineraries = db.query(models.Itinerary).all()

        # auto-update statuses
        changed = False
        for i in itineraries:
            old = i.status
            if old in ('cancelled', 'draft'):
                continue
            if i.end_date and i.end_date < today:
                i.status = 'completed'
            elif i.start_date and i.start_date <= today and i.end_date and i.end_date >= today:
                i.status = 'ongoing'
            if i.status != old:
                changed = True
        if changed:
            db.commit()

        return {
            "count": len(itineraries),
            "itineraries": [{
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
                "activities_count": sum(len(day.activities) for day in i.days),
                "mapped_count": sum(1 for day in i.days for act in day.activities if act.place_id),
            } for i in itineraries]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# admin: list all community posts
@app.get("/admin/posts")
def admin_list_posts(admin_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    posts = db.query(models.CommunityPost).order_by(models.CommunityPost.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "body": p.body,
            "tag": p.tag,
            "place": p.place,
            "upvotes": p.upvotes,
            "downvotes": p.downvotes,
            "user_id": p.user_id,
            "author_name": p.author.username if p.author else "Unknown",
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in posts
    ]


# admin: delete any itinerary
@app.delete("/admin/itineraries/{itinerary_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_itinerary(itinerary_id: int, admin_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    itinerary = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    db.delete(itinerary)
    db.commit()


# admin: delete any community post
@app.delete("/admin/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_post(post_id: int, admin_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()


@app.delete("/admin/places/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_place(place_id: int, admin_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    place = db.query(models.Place).filter(models.Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    db.delete(place)
    db.commit()


# admin: view all cached places with their search aliases
@app.get("/admin/places")
def admin_list_places(admin_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    places = db.query(models.Place).order_by(models.Place.name).all()
    result = []
    for p in places:
        d = _place_to_dict(p)
        # fetch aliases for this place
        aliases = db.query(models.PlaceSearchAlias).filter(
            models.PlaceSearchAlias.place_id == p.id
        ).order_by(models.PlaceSearchAlias.hit_count.desc()).all()
        d["aliases"] = [a.query_text for a in aliases]
        d["alias_count"] = len(aliases)
        d["total_hits"] = sum(a.hit_count for a in aliases)
        result.append(d)
    return {
        "count": len(result),
        "places": result,
    }


# admin: get full user profile — info + itineraries + posts
@app.get("/admin/users/{user_id}/profile")
def admin_user_profile(user_id: int, admin_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(admin_id, db)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    itins = db.query(models.Itinerary).filter(models.Itinerary.user_id == user_id).order_by(models.Itinerary.created_at.desc()).all()
    posts = db.query(models.CommunityPost).filter(models.CommunityPost.user_id == user_id).order_by(models.CommunityPost.created_at.desc()).all()

    return {
        "user": {
            "id": user.id, "name": user.name, "username": user.username, "email": user.email, "role": user.role,
            "bio": user.bio, "location": user.location,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
        },
        "itineraries": [{
            "id": i.id, "title": i.title, "destination": i.destination,
            "start_date": i.start_date.isoformat() if i.start_date else None,
            "end_date": i.end_date.isoformat() if i.end_date else None,
            "status": i.status, "estimated_budget": i.estimated_budget, "currency": i.currency,
            "days_count": len(i.days),
            "activities_count": sum(len(d.activities) for d in i.days),
        } for i in itins],
        "posts": [{
            "id": p.id, "title": p.title, "body": p.body, "tag": p.tag, "place": p.place,
            "upvotes": p.upvotes, "downvotes": p.downvotes, "comment_count": p.comment_count,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        } for p in posts],
        "stats": {
            "total_itineraries": len(itins),
            "total_posts": len(posts),
            "total_upvotes": sum(p.upvotes for p in posts),
        },
    }


@app.get("/debug/places-test")
async def debug_places_test():
    if not GOOGLE_PLACES_API_KEY:
        return {"error": "key not set"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://maps.googleapis.com/maps/api/place/textsearch/json",
            params={"query": "Boudhanath Kathmandu", "key": GOOGLE_PLACES_API_KEY},
            timeout=10.0
        )
    data = resp.json()
    return {"status": data.get("status"), "error_message": data.get("error_message", "none"), "key_preview": GOOGLE_PLACES_API_KEY[:8] + "..." if GOOGLE_PLACES_API_KEY else "missing"}


# ============================================
# GOOGLE PLACES ENDPOINTS
# Cache-first: DB checked before every API call.
# ============================================
def _place_to_dict(p: models.Place) -> dict:
    return {
        "id": p.id,
        "google_place_id": p.google_place_id,
        "name": p.name,
        "address": p.address,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "place_types": p.place_types.split(",") if p.place_types else [],
        "rating": p.rating,
        "photo_reference": p.photo_reference,
        "city": p.city,
    }

def _extract_city(address: str) -> Optional[str]:
    known = ["Kathmandu", "Pokhara", "Bhaktapur", "Lalitpur", "Chitwan", "Lumbini"]
    for city in known:
        if city.lower() in address.lower():
            return city
    return None

@app.get("/places/search")
async def search_places(query: str = Query(..., min_length=2), city: Optional[str] = Query(None), db: Session = Depends(get_db)):
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=500, detail="Google Places API key not configured")

    clean_query = query.strip().lower()

    # --- layer 1: alias lookup (learned from past Google searches) ---
    if len(clean_query) >= 3:
        alias_hits = (
            db.query(models.Place)
            .join(models.PlaceSearchAlias, models.PlaceSearchAlias.place_id == models.Place.id)
            .filter(models.PlaceSearchAlias.query_text == clean_query)
        )
        if city:
            alias_hits = alias_hits.filter(models.Place.city.ilike(city))
        alias_results = alias_hits.limit(5).all()

        if alias_results:
            # bump hit_count so we know which aliases are popular
            for p in alias_results:
                alias_row = db.query(models.PlaceSearchAlias).filter(
                    models.PlaceSearchAlias.query_text == clean_query,
                    models.PlaceSearchAlias.place_id == p.id,
                ).first()
                if alias_row:
                    alias_row.hit_count += 1
            db.commit()
            return {"source": "alias", "results": [_place_to_dict(p) for p in alias_results]}

    # --- layer 2: exact substring match on name/address ---
    cache_q = db.query(models.Place)
    if city:
        cache_q = cache_q.filter(models.Place.city.ilike(city))
    exact_cache = cache_q.filter(
        or_(
            models.Place.name.ilike(f"%{query}%"),
            models.Place.address.ilike(f"%{query}%"),
        )
    ).limit(5).all()

    if exact_cache:
        # store as alias so next time it's even faster
        _save_aliases(db, clean_query, exact_cache)
        return {"source": "cache", "results": [_place_to_dict(p) for p in exact_cache]}

    # --- layer 3: word-level matching ---
    words = [w.strip() for w in query.split() if len(w.strip()) >= 2]
    if words:
        word_q = db.query(models.Place)
        if city:
            word_q = word_q.filter(models.Place.city.ilike(city))
        for word in words:
            word_q = word_q.filter(
                or_(
                    models.Place.name.ilike(f"%{word}%"),
                    models.Place.address.ilike(f"%{word}%"),
                )
            )
        word_cache = word_q.limit(5).all()
        if word_cache:
            _save_aliases(db, clean_query, word_cache)
            return {"source": "cache", "results": [_place_to_dict(p) for p in word_cache]}

    # --- layer 4: Google Places API (last resort) ---
    search_query = f"{query} {city}" if city else query
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GOOGLE_PLACES_BASE}/textsearch/json",
            params={"query": search_query, "key": GOOGLE_PLACES_API_KEY, "region": "np"},
            timeout=10.0
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Google Places request failed")
    data = resp.json()
    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        raise HTTPException(status_code=502, detail=f"Google Places error: {data.get('status')}")

    results = []
    new_places = []
    for item in data.get("results", [])[:5]:
        place_id = item.get("place_id")
        if not place_id:
            continue
        existing = db.query(models.Place).filter(models.Place.google_place_id == place_id).first()
        if existing:
            results.append(existing)
            continue
        geo = item.get("geometry", {}).get("location", {})
        photos = item.get("photos", [])
        photo_ref = photos[0].get("photo_reference") if photos else None
        place = models.Place(
            google_place_id=place_id,
            name=item.get("name", ""),
            address=item.get("formatted_address", ""),
            latitude=geo.get("lat"),
            longitude=geo.get("lng"),
            place_types=",".join(item.get("types", [])[:5]),
            rating=item.get("rating"),
            photo_reference=photo_ref,
            city=city or _extract_city(item.get("formatted_address", "")),
        )
        db.add(place)
        db.commit()
        db.refresh(place)
        results.append(place)
        new_places.append(place)

    # save aliases for the original query → all returned places
    _save_aliases(db, clean_query, results)

    return {"source": "google", "results": [_place_to_dict(p) for p in results]}


def _save_aliases(db: Session, query_text: str, places: list):
    """Store query → place mappings. Only for queries 5+ chars to avoid noise."""
    if len(query_text) < 5 or not places:
        return
    for place in places:
        existing = db.query(models.PlaceSearchAlias).filter(
            models.PlaceSearchAlias.query_text == query_text,
            models.PlaceSearchAlias.place_id == place.id,
        ).first()
        if not existing:
            db.add(models.PlaceSearchAlias(query_text=query_text, place_id=place.id))
    try:
        db.commit()
    except Exception:
        db.rollback()

@app.get("/places/photo")
async def get_place_photo(photo_reference: str = Query(...), max_width: int = Query(400)):
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=500, detail="Google Places API key not configured")
    from fastapi.responses import RedirectResponse
    url = f"{GOOGLE_PLACES_BASE}/photo?maxwidth={max_width}&photo_reference={photo_reference}&key={GOOGLE_PLACES_API_KEY}"
    return RedirectResponse(url)

@app.get("/places/cached")
def get_cached_places(city: Optional[str] = Query(None), db: Session = Depends(get_db)):
    q = db.query(models.Place)
    if city:
        q = q.filter(models.Place.city.ilike(city))
    return {"results": [_place_to_dict(p) for p in q.order_by(models.Place.name).all()]}


# ============================================
# AI ITINERARY GENERATION
# ============================================
SYSTEM_PROMPT = """
You are a Nepal travel itinerary planner AI.
You MUST return ONLY a valid JSON object with NO extra text, no markdown, no explanation, no ```json fences — just raw JSON.

The JSON must follow this EXACT structure:
{
  "title": "string - creative trip title",
  "destination": "string - main destination name, derived from the user's description",
  "description": "string - 2 sentence trip summary",
  "days": [
    {
      "day_number": 1,
      "title": "string - theme for the day",
      "estimated_cost": 0,
      "activities": [
        {
          "title": "string - activity name",
          "location": "string - specific venue or landmark name, NOT just the city/village name",
          "description": "string - 1-2 sentence description",
          "start_time": "HH:MM",
          "activity_type": "one of exactly: trekking, sightseeing, dining, cultural, adventure, transport, shopping, wellness, health",
          "cost": 0,
          "priority": "one of exactly: low, medium, high, must-do"
        }
      ]
    }
  ]
}

Rules you MUST follow:
- Read the user's description carefully and base the itinerary on what they mention
- Do NOT default to generic Kathmandu locations unless the user specifically mentions Kathmandu
- cost and estimated_cost are numbers in NPR, never strings, never include currency symbols
- start_time is always 24hr format like "09:00" or "14:30"
- Generate exactly 3-4 activities per day
- activity_type must be one value from the allowed list only
- priority must be one value from the allowed list only

CRITICAL RULES FOR location FIELD:
- NEVER repeat the same location name for multiple activities. Each activity MUST have a DIFFERENT, SPECIFIC location.
- location must be a SPECIFIC venue, landmark, temple, restaurant, hotel, viewpoint, or trail — NOT just a city or village name.
- BAD: "Ghandruk" for 3 activities. GOOD: "Ghandruk Village Center", "Gurung Museum Ghandruk", "Himalayan Lodge Ghandruk"
- BAD: "Pokhara" repeated. GOOD: "Phewa Lake Pokhara", "Sarangkot Viewpoint", "Lakeside Restaurants Pokhara"
- For dining activities, use specific restaurant names or food streets (e.g. "Thamel Marg food street", "OR2K Restaurant Pokhara")
- For accommodation/rest activities, suggest specific hotels or lodges (e.g. "Hotel Moonlight Ghandruk", "Fishtail Lodge Pokhara")
- For trekking, name the specific trail segment (e.g. "Ghandruk to Tadapani Trail", "Poon Hill Sunrise Trek")
- If a place is too remote for a specific venue name, describe it with context (e.g. "Local Tea House near Chhomrong", "Community Homestay Landruk")
- All fields must be present, never null or missing
"""

@app.post("/ai/generate-itinerary")
async def generate_itinerary(request: dict):
    try:
        destination = request.get("destination", "")
        days = request.get("days", 3)
        budget = request.get("budget", 0)
        style = request.get("style", "general")
        if not destination:
            raise HTTPException(status_code=400, detail="Destination is required")
        client = google_genai.Client(api_key=GEMINI_API_KEY)
        user_prompt = f"""
The user has described their ideal trip as follows:
"{destination}"

Using the above description, generate a {days}-day travel itinerary in Nepal.
- Travel style: {style}
- Total budget: NPR {budget if budget > 0 else "flexible"}
- Number of days: {days}

Important instructions:
- Extract the specific places, landmarks, and activities mentioned in the description and use them as the basis for the itinerary.
- If the description mentions specific locations (e.g. Boudhanath, Pokhara, Chitwan), prioritize those. Do NOT default to Kathmandu unless it is mentioned.
- Spread activities logically across the {days} days.
- Use real, accurate place names in Nepal.
- Make the itinerary feel personalized to what the user described.
"""
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT, temperature=0.7),
            contents=user_prompt
        )
        raw_text = response.text.strip()

        def extract_json(text: str) -> str:
            fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
            if fenced:
                return fenced.group(1).strip()
            first = text.find('{')
            last = text.rfind('}')
            if first != -1 and last != -1 and last > first:
                return text[first:last + 1]
            return text

        clean = extract_json(raw_text)
        try:
            itinerary_data = json.loads(clean)
        except json.JSONDecodeError:
            logger.error(f"Gemini raw response could not be parsed:\n{raw_text[:500]}")
            raise HTTPException(status_code=500, detail="AI returned invalid JSON. Please try again.")

        for day in itinerary_data.get("days", []):
            day.setdefault("estimated_cost", 0)
            for act in day.get("activities", []):
                act.setdefault("cost", 0)
                act.setdefault("priority", "medium")
                act.setdefault("start_time", "09:00")
                act.setdefault("activity_type", "sightseeing")
                act.setdefault("description", "")
        return itinerary_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@app.get("/ai/list-models")
async def list_models():
    try:
        client = google_genai.Client(api_key=GEMINI_API_KEY)
        models_list = client.models.list()
        return {"models": [m.name for m in models_list]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# WEATHER ENDPOINT
# ============================================
@app.post("/itineraries/{itinerary_id}/fetch-weather")
async def fetch_itinerary_weather(itinerary_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    """Fetch weather for each day of the itinerary using OpenWeather API."""
    if not OPENWEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenWeather API key not configured")

    itin = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
    if not itin:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    if itin.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your itinerary")

    updated_days = []
    async with httpx.AsyncClient() as client:
        for day in itin.days:
            # prefer day's own coordinates, fall back to activity coords, then geocode main_location
            lat, lon, loc_name = None, None, None

            if day.main_latitude and day.main_longitude:
                lat, lon = day.main_latitude, day.main_longitude
                loc_name = day.main_location or itin.destination
            else:
                for act in day.activities:
                    if act.latitude and act.longitude:
                        lat, lon = act.latitude, act.longitude
                        loc_name = act.location or act.name
                        break

            # fall back to geocoding the day's main_location or itinerary destination
            if not lat or not lon:
                place_name = day.main_location or itin.destination
                if place_name:
                    loc_name = place_name
                    try:
                        geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={place_name},Nepal&limit=1&appid={OPENWEATHER_API_KEY}"
                        geo_res = await client.get(geo_url)
                        geo_data = geo_res.json()
                        if geo_data:
                            lat, lon = geo_data[0]['lat'], geo_data[0]['lon']
                    except:
                        continue

            if not lat or not lon:
                continue

            try:
                # use forecast API for future/today, current weather for today
                from datetime import date as date_type
                today = date_type.today()

                if day.date and day.date > today:
                    # forecast — use 5-day/3-hour forecast
                    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid={OPENWEATHER_API_KEY}"
                    res = await client.get(url)
                    data = res.json()
                    if data.get('list'):
                        # find the forecast closest to noon on the day
                        target = f"{day.date} 12:00:00"
                        closest = min(data['list'], key=lambda f: abs(
                            datetime.strptime(f['dt_txt'], '%Y-%m-%d %H:%M:%S') - datetime.strptime(target, '%Y-%m-%d %H:%M:%S')
                        ))
                        day.weather_temp_min = closest['main'].get('temp_min')
                        day.weather_temp_max = closest['main'].get('temp_max')
                        day.weather_condition = closest['weather'][0].get('main') if closest.get('weather') else None
                        day.weather_description = closest['weather'][0].get('description') if closest.get('weather') else None
                        day.weather_icon = closest['weather'][0].get('icon') if closest.get('weather') else None
                        day.weather_humidity = closest['main'].get('humidity')
                        day.weather_wind_speed = closest['wind'].get('speed')
                else:
                    # current weather
                    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={OPENWEATHER_API_KEY}"
                    res = await client.get(url)
                    data = res.json()
                    if data.get('main'):
                        day.weather_temp_min = data['main'].get('temp_min')
                        day.weather_temp_max = data['main'].get('temp_max')
                        day.weather_condition = data['weather'][0].get('main') if data.get('weather') else None
                        day.weather_description = data['weather'][0].get('description') if data.get('weather') else None
                        day.weather_icon = data['weather'][0].get('icon') if data.get('weather') else None
                        day.weather_humidity = data['main'].get('humidity')
                        day.weather_wind_speed = data['wind'].get('speed') if data.get('wind') else None

                day.weather_fetched_at = datetime.utcnow()
                updated_days.append({"day_number": day.day_number, "location": loc_name, "condition": day.weather_condition, "temp": f"{day.weather_temp_min}°-{day.weather_temp_max}°C"})
            except Exception as e:
                logger.error(f"Weather fetch error for day {day.day_number}: {e}")
                continue

    # ---- per-activity weather by time slot ----
    async with httpx.AsyncClient() as client:
        for day in itin.days:
            day_date = day.date
            today = date_type.today()
            if not day_date:
                continue

            # build forecast list for this day if it's in range
            for act in day.activities:
                if not act.latitude or not act.longitude:
                    continue
                try:
                    if day_date >= today:
                        # use forecast API — pick slot closest to activity start_time
                        url = f"https://api.openweathermap.org/data/2.5/forecast?lat={act.latitude}&lon={act.longitude}&units=metric&appid={OPENWEATHER_API_KEY}"
                        res = await client.get(url)
                        data = res.json()
                        if data.get('list'):
                            # pick forecast slot closest to activity time (or noon if no time)
                            hour = 12
                            if act.start_time:
                                hour = act.start_time.hour
                            target_str = f"{day_date} {str(hour).zfill(2)}:00:00"
                            closest = min(data['list'], key=lambda f: abs(
                                datetime.strptime(f['dt_txt'], '%Y-%m-%d %H:%M:%S') -
                                datetime.strptime(target_str, '%Y-%m-%d %H:%M:%S')
                            ))
                            act.weather_temp      = closest['main'].get('temp')
                            act.weather_condition = closest['weather'][0].get('main') if closest.get('weather') else None
                            act.weather_description = closest['weather'][0].get('description') if closest.get('weather') else None
                            act.weather_icon      = closest['weather'][0].get('icon') if closest.get('weather') else None
                            act.weather_humidity  = closest['main'].get('humidity')
                            act.weather_wind_speed = closest['wind'].get('speed') if closest.get('wind') else None
                    else:
                        # past — use current weather as best effort
                        url = f"https://api.openweathermap.org/data/2.5/weather?lat={act.latitude}&lon={act.longitude}&units=metric&appid={OPENWEATHER_API_KEY}"
                        res = await client.get(url)
                        data = res.json()
                        if data.get('main'):
                            act.weather_temp      = data['main'].get('temp')
                            act.weather_condition = data['weather'][0].get('main') if data.get('weather') else None
                            act.weather_description = data['weather'][0].get('description') if data.get('weather') else None
                            act.weather_icon      = data['weather'][0].get('icon') if data.get('weather') else None
                            act.weather_humidity  = data['main'].get('humidity')
                            act.weather_wind_speed = data['wind'].get('speed') if data.get('wind') else None
                except Exception as e:
                    logger.error(f"Activity weather fetch error act {act.id}: {e}")
                    continue

    db.commit()
    return {"updated": len(updated_days), "days": updated_days}


# ============================================
# AVATARS ENDPOINT
# ============================================
@app.get("/avatars")
def get_avatars():
    return {"avatars": AVATAR_LIST}


# ============================================
# PUBLIC PROFILE (privacy: no real name or email)
# ============================================
@app.get("/users/{user_id}/public", response_model=schemas.UserPublicProfile)
def get_public_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/users/by-username/{username}", response_model=schemas.UserPublicProfile)
def get_user_by_username(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ============================================
# BACKFILL USERNAMES (run once, delete after)
# ============================================

# ============================================
# FRIENDSHIP ENDPOINTS
# ============================================
@app.post("/friends/request")
def send_friend_request(request: schemas.FriendRequestCreate, user_id: int = Query(...), db: Session = Depends(get_db)):
    receiver = db.query(models.User).filter(models.User.username == request.receiver_username).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")
    if receiver.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")

    existing = db.query(models.Friendship).filter(
        or_(
            (models.Friendship.requester_id == user_id) & (models.Friendship.receiver_id == receiver.id),
            (models.Friendship.requester_id == receiver.id) & (models.Friendship.receiver_id == user_id),
        )
    ).first()
    if existing:
        if existing.status == 'accepted':
            raise HTTPException(status_code=400, detail="Already friends")
        if existing.status == 'pending':
            raise HTTPException(status_code=400, detail="Friend request already pending")

    friendship = models.Friendship(requester_id=user_id, receiver_id=receiver.id, status='pending')
    db.add(friendship)

    sender = db.query(models.User).filter(models.User.id == user_id).first()
    notif = models.Notification(
        user_id=receiver.id, type='friend_request',
        message=f'{sender.username} sent you a friend request',
        from_user_id=user_id,
    )
    db.add(notif)
    db.commit()
    return {"status": "sent", "friendship_id": friendship.id}

@app.patch("/friends/{friendship_id}/accept")
def accept_friend_request(friendship_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    friendship = db.query(models.Friendship).filter(models.Friendship.id == friendship_id).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")
    if friendship.receiver_id != user_id:
        raise HTTPException(status_code=403, detail="Not your request to accept")
    friendship.status = 'accepted'
    friendship.accepted_at = datetime.utcnow()

    receiver = db.query(models.User).filter(models.User.id == user_id).first()
    notif = models.Notification(
        user_id=friendship.requester_id, type='friend_accepted',
        message=f'{receiver.username} accepted your friend request',
        from_user_id=user_id,
    )
    db.add(notif)
    db.commit()
    return {"status": "accepted"}

@app.patch("/friends/{friendship_id}/reject")
def reject_friend_request(friendship_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    friendship = db.query(models.Friendship).filter(models.Friendship.id == friendship_id).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")
    if friendship.receiver_id != user_id:
        raise HTTPException(status_code=403, detail="Not your request to reject")
    db.delete(friendship)
    db.commit()
    return {"status": "rejected"}

# static path must come before parametric /friends/{user_id}
@app.get("/friends/status/{other_user_id}")
def check_friendship(other_user_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    friendship = db.query(models.Friendship).filter(
        or_(
            (models.Friendship.requester_id == user_id) & (models.Friendship.receiver_id == other_user_id),
            (models.Friendship.requester_id == other_user_id) & (models.Friendship.receiver_id == user_id),
        )
    ).first()
    if not friendship:
        return {"status": "none", "friendship_id": None}
    return {"status": friendship.status, "friendship_id": friendship.id, "is_requester": friendship.requester_id == user_id}

@app.get("/friends/{user_id}")
def get_friends(user_id: int, db: Session = Depends(get_db)):
    friendships = db.query(models.Friendship).filter(
        or_(
            models.Friendship.requester_id == user_id,
            models.Friendship.receiver_id == user_id,
        ),
        models.Friendship.status == 'accepted'
    ).all()

    friends = []
    for f in friendships:
        friend_id = f.receiver_id if f.requester_id == user_id else f.requester_id
        friend = db.query(models.User).filter(models.User.id == friend_id).first()
        if friend:
            friends.append({
                "friendship_id": f.id,
                "user_id": friend.id,
                "username": friend.username,
                "avatar_id": friend.avatar_id,
                "bio": friend.bio,
                "since": f.accepted_at.isoformat() if f.accepted_at else None,
            })
    return {"friends": friends, "count": len(friends)}

@app.get("/friends/{user_id}/pending")
def get_pending_requests(user_id: int, db: Session = Depends(get_db)):
    incoming = db.query(models.Friendship).filter(
        models.Friendship.receiver_id == user_id,
        models.Friendship.status == 'pending'
    ).all()

    requests = []
    for f in incoming:
        requester = db.query(models.User).filter(models.User.id == f.requester_id).first()
        if requester:
            requests.append({
                "friendship_id": f.id,
                "user_id": requester.id,
                "username": requester.username,
                "avatar_id": requester.avatar_id,
                "created_at": f.created_at.isoformat() if f.created_at else None,
            })
    return {"requests": requests, "count": len(requests)}

@app.delete("/friends/{friendship_id}")
def remove_friend(friendship_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    friendship = db.query(models.Friendship).filter(models.Friendship.id == friendship_id).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")
    if friendship.requester_id != user_id and friendship.receiver_id != user_id:
        raise HTTPException(status_code=403, detail="Not your friendship")
    db.delete(friendship)
    db.commit()
    return {"status": "removed"}


# ============================================
# MESSAGE ENDPOINTS
# ============================================
@app.post("/messages", response_model=schemas.MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(msg: schemas.MessageCreate, user_id: int = Query(...), db: Session = Depends(get_db)):
    # verify they are friends
    friendship = db.query(models.Friendship).filter(
        or_(
            (models.Friendship.requester_id == user_id) & (models.Friendship.receiver_id == msg.receiver_id),
            (models.Friendship.requester_id == msg.receiver_id) & (models.Friendship.receiver_id == user_id),
        ),
        models.Friendship.status == 'accepted'
    ).first()
    if not friendship:
        raise HTTPException(status_code=403, detail="You can only message friends")

    new_msg = models.Message(
        sender_id=user_id, receiver_id=msg.receiver_id,
        content=msg.content, shared_itinerary_id=msg.shared_itinerary_id,
    )
    db.add(new_msg)

    # notify receiver
    sender = db.query(models.User).filter(models.User.id == user_id).first()
    notif = models.Notification(
        user_id=msg.receiver_id, type='message',
        message=f'{sender.username}: {msg.content[:50]}',
        from_user_id=user_id,
    )
    db.add(notif)
    db.commit()
    db.refresh(new_msg)

    result = schemas.MessageOut.from_orm(new_msg)
    result.sender_username = sender.username if sender else None
    result.sender_avatar_id = sender.avatar_id if sender else 1
    return result

@app.get("/messages/{user_id}/unread-count")
def get_message_unread_count(user_id: int, db: Session = Depends(get_db)):
    count = db.query(models.Message).filter(
        models.Message.receiver_id == user_id,
        models.Message.is_read == False,
    ).count()
    return {"count": count}

# get list of conversations (latest message per friend)
# MUST be defined before /messages/{user_id}/{friend_id} to avoid route conflict
@app.get("/messages/{user_id}/conversations")
def get_conversations(user_id: int, db: Session = Depends(get_db)):

    convos = []
    for f in db.query(models.Friendship).filter(
        or_(models.Friendship.requester_id == user_id, models.Friendship.receiver_id == user_id),
        models.Friendship.status == 'accepted'
    ).all():
        friend_id = f.receiver_id if f.requester_id == user_id else f.requester_id
        friend = db.query(models.User).filter(models.User.id == friend_id).first()
        if not friend:
            continue
        last_msg = db.query(models.Message).filter(
            or_(
                (models.Message.sender_id == user_id) & (models.Message.receiver_id == friend_id),
                (models.Message.sender_id == friend_id) & (models.Message.receiver_id == user_id),
            )
        ).order_by(models.Message.created_at.desc()).first()
        unread = db.query(models.Message).filter(
            models.Message.sender_id == friend_id,
            models.Message.receiver_id == user_id,
            models.Message.is_read == False,
        ).count()
        convos.append({
            "friend_id": friend.id,
            "username": friend.username,
            "avatar_id": friend.avatar_id,
            "last_message": last_msg.content[:60] if last_msg else None,
            "last_message_time": last_msg.created_at.isoformat() if last_msg else None,
            "unread_count": unread,
        })
    convos.sort(key=lambda c: c['last_message_time'] or '', reverse=True)
    return {"conversations": convos}

@app.get("/messages/{user_id}/{friend_id}")
def get_conversation(user_id: int, friend_id: int, limit: int = Query(50, le=100), db: Session = Depends(get_db)):
    messages = db.query(models.Message).filter(
        or_(
            (models.Message.sender_id == user_id) & (models.Message.receiver_id == friend_id),
            (models.Message.sender_id == friend_id) & (models.Message.receiver_id == user_id),
        )
    ).order_by(models.Message.created_at.desc()).limit(limit).all()

    # mark received messages as read
    for m in messages:
        if m.receiver_id == user_id and not m.is_read:
            m.is_read = True
    db.commit()

    results = []
    for m in reversed(messages):
        sender = db.query(models.User).filter(models.User.id == m.sender_id).first()
        d = schemas.MessageOut.from_orm(m).dict()
        d['sender_username'] = sender.username if sender else None
        d['sender_avatar_id'] = sender.avatar_id if sender else 1
        results.append(d)
    return {"messages": results}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)