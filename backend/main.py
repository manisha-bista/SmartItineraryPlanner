from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from database import engine, get_db
import models, schemas
from passlib.context import CryptContext
from datetime import datetime
import logging
import json
import os
from typing import List, Optional
from dotenv import load_dotenv
from google import genai as google_genai
from google.genai import types

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create all database tables
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

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def require_admin(user_id: int, db: Session):
    """Helper to verify a user has admin role. Call from any admin-only endpoint."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ============================================
# ROOT & HEALTH ENDPOINTS
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
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unavailable"
        )


# ============================================
# USER ENDPOINTS
# ============================================
@app.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        # Validation
        if not user.name or len(user.name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Name must be at least 2 characters long")
        if not user.password or len(user.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

        email_lower = user.email.strip().lower()
        
        # Check if user exists
        existing_user = db.query(models.User).filter(models.User.email == email_lower).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        hashed_password = get_password_hash(user.password)
        new_user = models.User(
            name=user.name.strip(),
            email=email_lower,
            hashed_password=hashed_password
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
    """Login user"""
    try:
        email_lower = user_credentials.email.strip().lower()
        user = db.query(models.User).filter(models.User.email == email_lower).first()
        
        if not user or not verify_password(user_credentials.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Update last login
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
    """Get user by ID"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    """Update user profile"""
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
    """List all users (for admin dashboard)"""
    try:
        users = db.query(models.User).order_by(models.User.created_at.desc()).all()
        return users
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(status_code=500, detail="Failed to list users")

@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete a user"""
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


# ============================================
# ITINERARY ENDPOINTS
# ============================================
@app.post("/itineraries", response_model=schemas.ItineraryOut, status_code=status.HTTP_201_CREATED)
def create_itinerary(itinerary: schemas.ItineraryCreate, db: Session = Depends(get_db)):
    """Create a new itinerary (simple version)"""
    try:
        # Verify user exists
        user = db.query(models.User).filter(models.User.id == itinerary.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create itinerary
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
    """Create itinerary with nested days, activities, accommodations, and transportation"""
    try:
        # Verify user
        user = db.query(models.User).filter(models.User.id == itinerary.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create main itinerary
        itinerary_data = itinerary.dict(exclude={'days', 'accommodations', 'transportation', 'tags'})
        new_itinerary = models.Itinerary(**itinerary_data)
        db.add(new_itinerary)
        db.flush()
        
        # Add days
        for day_data in itinerary.days:
            day_dict = day_data.dict(exclude={'activities'}) if hasattr(day_data, 'dict') else day_data
            new_day = models.ItineraryDay(**day_dict, itinerary_id=new_itinerary.id)
            db.add(new_day)
        
        # Add accommodations
        for acc_data in itinerary.accommodations:
            acc_dict = acc_data.dict() if hasattr(acc_data, 'dict') else acc_data
            new_acc = models.Accommodation(**acc_dict, itinerary_id=new_itinerary.id)
            db.add(new_acc)
        
        # Add transportation
        for trans_data in itinerary.transportation:
            trans_dict = trans_data.dict() if hasattr(trans_data, 'dict') else trans_data
            new_trans = models.Transportation(**trans_dict, itinerary_id=new_itinerary.id)
            db.add(new_trans)
        
        # Add tags
        for tag_str in itinerary.tags:
            new_tag = models.ItineraryTag(tag=tag_str, itinerary_id=new_itinerary.id)
            db.add(new_tag)
        
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

@app.get("/itineraries/user/{user_id}", response_model=List[schemas.ItineraryOut])
def get_user_itineraries(
    user_id: int,
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all itineraries for a user with optional status filter"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        query = db.query(models.Itinerary).filter(models.Itinerary.user_id == user_id)
        
        if status_filter:
            query = query.filter(models.Itinerary.status == status_filter)
        
        itineraries = query.order_by(models.Itinerary.start_date.desc()).all()
        return itineraries
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching itineraries: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch itineraries")

@app.get("/itineraries/public", response_model=List[schemas.ItinerarySummary])
def get_public_itineraries(
    destination: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get public itineraries with optional filters"""
    try:
        query = db.query(models.Itinerary).filter(models.Itinerary.is_public == True)
        
        if destination:
            query = query.filter(models.Itinerary.destination.ilike(f"%{destination}%"))
        
        itineraries = query.order_by(
            models.Itinerary.view_count.desc()
        ).offset(offset).limit(limit).all()
        
        # Add computed fields
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
    """Get complete itinerary with all nested data"""
    try:
        itinerary = db.query(models.Itinerary).filter(
            models.Itinerary.id == itinerary_id
        ).first()
        
        if not itinerary:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        
        # Increment view count
        itinerary.view_count += 1
        db.commit()
        
        return itinerary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching itinerary detail: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch itinerary")

@app.put("/itineraries/{itinerary_id}", response_model=schemas.ItineraryOut)
def update_itinerary(
    itinerary_id: int,
    itinerary_update: schemas.ItineraryUpdate,
    db: Session = Depends(get_db)
):
    """Update an itinerary"""
    try:
        itinerary = db.query(models.Itinerary).filter(
            models.Itinerary.id == itinerary_id
        ).first()
        
        if not itinerary:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        
        # Update fields
        update_data = itinerary_update.dict(exclude_unset=True)
        for field, value in update_data.items():
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
    """Delete an itinerary and all its nested data"""
    try:
        itinerary = db.query(models.Itinerary).filter(
            models.Itinerary.id == itinerary_id
        ).first()
        
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
# DAY & ACTIVITY ENDPOINTS
# ============================================
@app.post("/itinerary-days", response_model=schemas.ItineraryDayOut, status_code=status.HTTP_201_CREATED)
def create_itinerary_day(day: schemas.ItineraryDayCreate, db: Session = Depends(get_db)):
    """Add a day to an itinerary"""
    try:
        day_data = day.dict(exclude={'activities'})
        new_day = models.ItineraryDay(**day_data)
        db.add(new_day)
        db.flush()
        
        # Add activities if provided
        for activity_data in day.activities:
            activity_dict = activity_data.dict() if hasattr(activity_data, 'dict') else activity_data
            new_activity = models.Activity(**activity_dict, day_id=new_day.id)
            db.add(new_activity)
        
        db.commit()
        db.refresh(new_day)
        return new_day
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating day: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/itinerary-days/{day_id}", response_model=schemas.ItineraryDayOut)
def update_itinerary_day(
    day_id: int,
    day_update: schemas.ItineraryDayUpdate,
    db: Session = Depends(get_db)
):
    """Update an itinerary day"""
    try:
        day = db.query(models.ItineraryDay).filter(models.ItineraryDay.id == day_id).first()
        if not day:
            raise HTTPException(status_code=404, detail="Day not found")
        
        update_data = day_update.dict(exclude_unset=True)
        for field, value in update_data.items():
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
    """Delete an itinerary day"""
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
    """Add an activity to a day"""
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
    """Get all activities for a specific day"""
    try:
        activities = db.query(models.Activity).filter(
            models.Activity.day_id == day_id
        ).order_by(models.Activity.start_time).all()
        return activities
        
    except Exception as e:
        logger.error(f"Error fetching activities: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch activities")

@app.put("/activities/{activity_id}", response_model=schemas.ActivityOut)
def update_activity(
    activity_id: int,
    activity_update: schemas.ActivityUpdate,
    db: Session = Depends(get_db)
):
    """Update an activity"""
    try:
        activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        update_data = activity_update.dict(exclude_unset=True)
        for field, value in update_data.items():
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
    """Delete an activity"""
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
    """Add accommodation to an itinerary"""
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
    """Get all accommodations for an itinerary"""
    try:
        accommodations = db.query(models.Accommodation).filter(
            models.Accommodation.itinerary_id == itinerary_id
        ).all()
        return accommodations
        
    except Exception as e:
        logger.error(f"Error fetching accommodations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch accommodations")

@app.put("/accommodations/{accommodation_id}", response_model=schemas.AccommodationOut)
def update_accommodation(
    accommodation_id: int,
    accommodation_update: schemas.AccommodationUpdate,
    db: Session = Depends(get_db)
):
    """Update an accommodation"""
    try:
        accommodation = db.query(models.Accommodation).filter(
            models.Accommodation.id == accommodation_id
        ).first()
        
        if not accommodation:
            raise HTTPException(status_code=404, detail="Accommodation not found")
        
        update_data = accommodation_update.dict(exclude_unset=True)
        for field, value in update_data.items():
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
    """Delete an accommodation"""
    try:
        accommodation = db.query(models.Accommodation).filter(
            models.Accommodation.id == accommodation_id
        ).first()
        
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
    """Add transportation to an itinerary"""
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
    """Get all transportation for an itinerary"""
    try:
        transportation = db.query(models.Transportation).filter(
            models.Transportation.itinerary_id == itinerary_id
        ).order_by(models.Transportation.departure_datetime).all()
        return transportation
        
    except Exception as e:
        logger.error(f"Error fetching transportation: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch transportation")

@app.put("/transportation/{transportation_id}", response_model=schemas.TransportationOut)
def update_transportation(
    transportation_id: int,
    transportation_update: schemas.TransportationUpdate,
    db: Session = Depends(get_db)
):
    """Update transportation"""
    try:
        transportation = db.query(models.Transportation).filter(
            models.Transportation.id == transportation_id
        ).first()
        
        if not transportation:
            raise HTTPException(status_code=404, detail="Transportation not found")
        
        update_data = transportation_update.dict(exclude_unset=True)
        for field, value in update_data.items():
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
    """Delete transportation"""
    try:
        transportation = db.query(models.Transportation).filter(
            models.Transportation.id == transportation_id
        ).first()
        
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
    """Add a note to an itinerary"""
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
    """Get all notes for an itinerary"""
    try:
        notes = db.query(models.TripNote).filter(
            models.TripNote.itinerary_id == itinerary_id
        ).order_by(models.TripNote.created_at.desc()).all()
        return notes
        
    except Exception as e:
        logger.error(f"Error fetching notes: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notes")

@app.put("/trip-notes/{note_id}", response_model=schemas.TripNoteOut)
def update_trip_note(
    note_id: int,
    note_update: schemas.TripNoteUpdate,
    db: Session = Depends(get_db)
):
    """Update a trip note"""
    try:
        note = db.query(models.TripNote).filter(models.TripNote.id == note_id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        
        update_data = note_update.dict(exclude_unset=True)
        for field, value in update_data.items():
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
    """Delete a trip note"""
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
    """Add a comment to an itinerary"""
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
    """Get all comments for an itinerary"""
    try:
        comments = db.query(models.ItineraryComment).filter(
            models.ItineraryComment.itinerary_id == itinerary_id
        ).order_by(models.ItineraryComment.created_at.desc()).all()
        return comments
        
    except Exception as e:
        logger.error(f"Error fetching comments: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch comments")


# ============================================
# COMMUNITY UPDATES ENDPOINTS
# ============================================
@app.post("/community-updates", response_model=schemas.CommunityUpdateOut, status_code=status.HTTP_201_CREATED)
def create_community_update(update: schemas.CommunityUpdateCreate, user_id: int, db: Session = Depends(get_db)):
    """Create a community update"""
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
def get_community_updates(
    location: Optional[str] = Query(None),
    update_type: Optional[str] = Query(None),
    active_only: bool = Query(True),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db)
):
    """Get community updates with filters"""
    try:
        query = db.query(models.CommunityUpdate)
        
        if active_only:
            query = query.filter(models.CommunityUpdate.is_active == True)
        
        if location:
            query = query.filter(models.CommunityUpdate.location.ilike(f"%{location}%"))
        
        if update_type:
            query = query.filter(models.CommunityUpdate.update_type == update_type)
        
        updates = query.order_by(
            models.CommunityUpdate.created_at.desc()
        ).limit(limit).all()
        
        return updates
        
    except Exception as e:
        logger.error(f"Error fetching community updates: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch updates")


# ============================================
# COMMUNITY POSTS ENDPOINTS
# ============================================
@app.post("/community/posts", response_model=schemas.CommunityPostOut, status_code=status.HTTP_201_CREATED)
def create_community_post(post: schemas.CommunityPostCreate, user_id: int = Query(...), db: Session = Depends(get_db)):
    """Create a community post"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        new_post = models.CommunityPost(**post.dict(), user_id=user_id)
        db.add(new_post)
        db.commit()
        db.refresh(new_post)
        
        result = schemas.CommunityPostOut.from_orm(new_post)
        result.author_name = user.name
        result.author_initial = user.name[0].upper() if user.name else 'U'
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
def get_community_posts(
    tag: Optional[str] = Query(None),
    place: Optional[str] = Query(None),
    sort: str = Query("new"),  # new, popular, top
    user_id: Optional[int] = Query(None),  # for tracking current user's votes
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db)
):
    """Get community posts with filtering and sorting"""
    try:
        query = db.query(models.CommunityPost)
        
        if tag:
            query = query.filter(models.CommunityPost.tag == tag)
        
        if place and place != "All":
            query = query.filter(models.CommunityPost.place.ilike(f"%{place}%"))
        
        # sorting
        if sort == "popular":
            query = query.order_by((models.CommunityPost.upvotes - models.CommunityPost.downvotes).desc())
        elif sort == "top":
            query = query.order_by(models.CommunityPost.upvotes.desc())
        else:
            query = query.order_by(models.CommunityPost.created_at.desc())
        
        posts = query.limit(limit).all()
        
        # build response with author info and user vote status
        results = []
        for p in posts:
            out = schemas.CommunityPostOut.from_orm(p)
            out.author_name = p.author.name if p.author else "Unknown"
            out.author_initial = p.author.name[0].upper() if p.author and p.author.name else "U"
            
            # check if current user has voted on this post
            if user_id:
                vote = db.query(models.PostVote).filter(
                    models.PostVote.post_id == p.id,
                    models.PostVote.user_id == user_id
                ).first()
                out.user_vote = vote.direction if vote else None
            else:
                out.user_vote = None
            
            results.append(out)
        
        return results
    except Exception as e:
        logger.error(f"Error fetching posts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch posts")

@app.post("/community/posts/{post_id}/vote")
def vote_on_post(post_id: int, vote: schemas.PostVoteRequest, user_id: int = Query(...), db: Session = Depends(get_db)):
    """Vote on a post — toggles if same direction, switches if different"""
    try:
        post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        existing = db.query(models.PostVote).filter(
            models.PostVote.post_id == post_id,
            models.PostVote.user_id == user_id
        ).first()
        
        if existing:
            if existing.direction == vote.direction:
                # same vote again = remove vote
                if existing.direction == 'up':
                    post.upvotes = max(0, post.upvotes - 1)
                else:
                    post.downvotes = max(0, post.downvotes - 1)
                db.delete(existing)
                db.commit()
                return {"status": "removed", "upvotes": post.upvotes, "downvotes": post.downvotes}
            else:
                # switching vote direction
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
            # new vote
            new_vote = models.PostVote(user_id=user_id, post_id=post_id, direction=vote.direction)
            if vote.direction == 'up':
                post.upvotes += 1
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
    """Delete a community post (only by the author)"""
    try:
        post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        if post.user_id != user_id:
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
# COMPLAINTS ENDPOINTS
# ============================================
@app.post("/complaints", response_model=schemas.ComplaintOut, status_code=status.HTTP_201_CREATED)
def create_complaint(complaint: schemas.ComplaintCreate, user_id: int = Query(...), db: Session = Depends(get_db)):
    """Submit a complaint"""
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

@app.get("/complaints/", response_model=List[schemas.ComplaintOut])
def list_complaints(
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List all complaints (for admin dashboard)"""
    try:
        query = db.query(models.Complaint)
        if status_filter:
            query = query.filter(models.Complaint.status == status_filter)
        complaints = query.order_by(models.Complaint.created_at.desc()).all()
        return complaints
    except Exception as e:
        logger.error(f"Error listing complaints: {e}")
        raise HTTPException(status_code=500, detail="Failed to list complaints")

@app.patch("/complaints/{complaint_id}", response_model=schemas.ComplaintOut)
def update_complaint(complaint_id: int, complaint_update: schemas.ComplaintUpdate, db: Session = Depends(get_db)):
    """Update a complaint (e.g. mark as resolved)"""
    try:
        complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        update_data = complaint_update.dict(exclude_unset=True)
        for field, value in update_data.items():
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
    """Delete a complaint"""
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
# ADMIN ENDPOINTS
# ============================================
@app.patch("/users/{user_id}/role", response_model=schemas.UserOut)
def update_user_role(user_id: int, role: str = Query(..., pattern="^(user|admin)$"), db: Session = Depends(get_db)):
    """Update a user's role (use this to promote a user to admin)"""
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
# DEBUG ENDPOINTS
# ============================================
@app.get("/debug/users")
def get_all_users_debug(db: Session = Depends(get_db)):
    """Debug: View all users with roles"""
    try:
        users = db.query(models.User).all()
        return {
            "count": len(users),
            "users": [{"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in users]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/debug/seed-admin")
def seed_admin(db: Session = Depends(get_db)):
    """Debug: Create a default admin user or promote first user to admin"""
    try:
        # Check if an admin already exists
        existing_admin = db.query(models.User).filter(models.User.role == "admin").first()
        if existing_admin:
            return {"message": f"Admin already exists: {existing_admin.email}", "id": existing_admin.id}
        
        # Check if any user exists — promote the first one
        first_user = db.query(models.User).order_by(models.User.id).first()
        if first_user:
            first_user.role = "admin"
            db.commit()
            return {"message": f"Promoted '{first_user.name}' ({first_user.email}) to admin", "id": first_user.id}
        
        # No users at all — create a fresh admin
        admin = models.User(
            name="Admin",
            email="admin@smartitinerary.com",
            hashed_password=get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return {"message": "Admin user created", "id": admin.id, "email": admin.email, "password": "admin123"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug/itineraries")
def get_all_itineraries(db: Session = Depends(get_db)):
    """Debug: View all itineraries"""
    try:
        itineraries = db.query(models.Itinerary).all()
        return {
            "count": len(itineraries),
            "itineraries": [
                {
                    "id": i.id,
                    "title": i.title,
                    "destination": i.destination,
                    "user_id": i.user_id,
                    "days_count": len(i.days),
                    "activities_count": sum(len(day.activities) for day in i.days)
                }
                for i in itineraries
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# AI ITINERARY GENERATION ENDPOINT
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
          "location": "string - specific place name in Nepal, real and searchable on Google Maps",
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
- Read the user's description carefully and base the itinerary on the specific places, things to do, and interests they mention
- Do NOT default to generic Kathmandu locations unless the user specifically mentions Kathmandu
- cost and estimated_cost are numbers in NPR, never strings, never include currency symbols
- start_time is always 24hr format like "09:00" or "14:30"
- Generate exactly 3-4 activities per day
- activity_type must be one value from the allowed list only
- priority must be one value from the allowed list only
- location must be a real, specific place in Nepal that exists on Google Maps
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
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.7,
            ),
            contents=user_prompt
        )

        raw_text = response.text.strip()

        # Clean up in case Gemini adds markdown fences anyway
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        raw_text = raw_text.strip()

        itinerary_data = json.loads(raw_text)

        # Validate and fill defaults as safety net
        for day in itinerary_data.get("days", []):
            day.setdefault("estimated_cost", 0)
            for act in day.get("activities", []):
                act.setdefault("cost", 0)
                act.setdefault("priority", "medium")
                act.setdefault("start_time", "09:00")
                act.setdefault("activity_type", "sightseeing")
                act.setdefault("description", "")

        return itinerary_data

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON. Please try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@app.get("/ai/list-models")
async def list_models():
    """Debug: List all available Gemini models for this API key"""
    try:
        client = google_genai.Client(api_key=GEMINI_API_KEY)
        models_list = client.models.list()
        return {"models": [m.name for m in models_list]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)