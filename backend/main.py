from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from database import engine, get_db
import models, schemas
from passlib.context import CryptContext
from datetime import date, timedelta
import logging
from typing import List

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
    version="2.0.0"
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



# ROOT & HEALTH ENDPOINTS
@app.get("/")
def read_root():
    return {
        "message": "Welcome to Smart Itinerary API",
        "version": "2.0.0",
        "features": ["Nested Itineraries", "Activities", "Accommodations", "Transportation"],
        "status": "running"
    }

@app.get("/health")
def health_check():
    try:
        db = next(get_db())
        db.execute("SELECT 1")
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unavailable"
        )


# USER ENDPOINTS
@app.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        if not user.name or len(user.name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Name must be at least 2 characters long")
        if not user.email or "@" not in user.email:
            raise HTTPException(status_code=400, detail="Please provide a valid email address")
        if not user.password or len(user.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

        email_lower = user.email.strip().lower()
        existing_user = db.query(models.User).filter(models.User.email == email_lower).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
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
    try:
        email_lower = user_credentials.email.strip().lower()
        user = db.query(models.User).filter(models.User.email == email_lower).first()
        
        if not user or not verify_password(user_credentials.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        logger.info(f"User logged in: {user.email}")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


# ITINERARY ENDPOINTS
@app.post("/itineraries", response_model=schemas.ItineraryOut, status_code=status.HTTP_201_CREATED)
def create_itinerary(itinerary: schemas.ItineraryCreate, db: Session = Depends(get_db)):
    """Create a new itinerary (simple version without nested data)"""
    try:
        # Verify user exists
        user = db.query(models.User).filter(models.User.id == itinerary.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create itinerary
        new_itinerary = models.Itinerary(
            title=itinerary.title.strip(),
            destination=itinerary.destination.strip(),
            description=itinerary.description,
            start_date=itinerary.start_date,
            end_date=itinerary.end_date,
            estimated_budget=itinerary.estimated_budget,
            actual_budget=itinerary.actual_budget,
            currency=itinerary.currency,
            status=itinerary.status,
            is_public=itinerary.is_public,
            user_id=itinerary.user_id
        )
        
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
        new_itinerary = models.Itinerary(
            title=itinerary.title.strip(),
            destination=itinerary.destination.strip(),
            description=itinerary.description,
            start_date=itinerary.start_date,
            end_date=itinerary.end_date,
            estimated_budget=itinerary.estimated_budget,
            currency=itinerary.currency,
            status=itinerary.status,
            is_public=itinerary.is_public,
            user_id=itinerary.user_id
        )
        db.add(new_itinerary)
        db.flush()  # Get the ID without committing
        
        # Add days if provided
        for day_data in itinerary.days:
            new_day = models.ItineraryDay(
                day_number=day_data.day_number,
                date=day_data.date,
                title=day_data.title,
                description=day_data.description,
                estimated_cost=day_data.estimated_cost,
                itinerary_id=new_itinerary.id
            )
            db.add(new_day)
        
        # Add accommodations if provided
        for acc_data in itinerary.accommodations:
            new_acc = models.Accommodation(
                name=acc_data.name,
                type=acc_data.type,
                address=acc_data.address,
                check_in_date=acc_data.check_in_date,
                check_out_date=acc_data.check_out_date,
                cost_per_night=acc_data.cost_per_night,
                total_cost=acc_data.total_cost,
                itinerary_id=new_itinerary.id
            )
            db.add(new_acc)
        
        # Add transportation if provided
        for trans_data in itinerary.transportation:
            new_trans = models.Transportation(
                type=trans_data.type,
                from_location=trans_data.from_location,
                to_location=trans_data.to_location,
                departure_datetime=trans_data.departure_datetime,
                arrival_datetime=trans_data.arrival_datetime,
                cost=trans_data.cost,
                itinerary_id=new_itinerary.id
            )
            db.add(new_trans)
        
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
def get_user_itineraries(user_id: int, db: Session = Depends(get_db)):
    """Get all itineraries for a user"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        itineraries = db.query(models.Itinerary).filter(
            models.Itinerary.user_id == user_id
        ).order_by(models.Itinerary.start_date.desc()).all()
        
        return itineraries
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching itineraries: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch itineraries")

@app.get("/itineraries/{itinerary_id}", response_model=schemas.ItineraryDetailOut)
def get_itinerary_detail(itinerary_id: int, db: Session = Depends(get_db)):
    """Get complete itinerary with all nested data"""
    try:
        itinerary = db.query(models.Itinerary).filter(
            models.Itinerary.id == itinerary_id
        ).first()
        
        if not itinerary:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        
        return itinerary
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching itinerary detail: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch itinerary")

@app.put("/itineraries/{itinerary_id}", response_model=schemas.ItineraryOut)
def update_itinerary(itinerary_id: int, itinerary_update: schemas.ItineraryUpdate, db: Session = Depends(get_db)):
    """Update an itinerary"""
    try:
        itinerary = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
        if not itinerary:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        
        # Update fields if provided
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



# DAY & ACTIVITY ENDPOINTS
@app.post("/itinerary-days", response_model=schemas.ItineraryDayOut, status_code=status.HTTP_201_CREATED)
def create_itinerary_day(day: schemas.ItineraryDayCreate, db: Session = Depends(get_db)):
    """Add a day to an itinerary"""
    try:
        new_day = models.ItineraryDay(**day.dict(exclude={'activities'}))
        db.add(new_day)
        db.flush()
        
        # Add activities if provided
        for activity_data in day.activities:
            new_activity = models.Activity(**activity_data.dict(), day_id=new_day.id)
            db.add(new_activity)
        
        db.commit()
        db.refresh(new_day)
        return new_day
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating day: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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



# ACCOMMODATION ENDPOINTS
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



# TRANSPORTATION ENDPOINTS
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


# TRIP NOTES ENDPOINTS
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



# DEBUG ENDPOINTS
@app.get("/debug/users")
def get_all_users(db: Session = Depends(get_db)):
    """Debug: View all users"""
    try:
        users = db.query(models.User).all()
        return {
            "count": len(users),
            "users": [{"id": u.id, "name": u.name, "email": u.email} for u in users]
        }
    except Exception as e:
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)