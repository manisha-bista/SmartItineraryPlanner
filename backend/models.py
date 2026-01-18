from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, Text, Boolean, Time
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# USER MODEL
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    itineraries = relationship("Itinerary", back_populates="owner", cascade="all, delete-orphan")


# ITINERARY MODEL (Main Trip)
class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)  # e.g., "Summer Trip to Annapurna"
    destination = Column(String, nullable=False)  # e.g., "Annapurna Base Camp, Nepal"
    description = Column(Text, nullable=True)  # Brief description of the trip
    
    # Dates
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Budget
    estimated_budget = Column(Float, default=0.0)  # Total estimated budget
    actual_budget = Column(Float, default=0.0)  # Actual spent (can be updated)
    currency = Column(String, default="NPR")  # Currency code
    
    # Status
    status = Column(String, default="planning")  # planning, confirmed, ongoing, completed, cancelled
    
    # Meta
    is_public = Column(Boolean, default=False)  # Can other users see this?
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="itineraries")
    days = relationship("ItineraryDay", back_populates="itinerary", cascade="all, delete-orphan", order_by="ItineraryDay.day_number")
    accommodations = relationship("Accommodation", back_populates="itinerary", cascade="all, delete-orphan")
    transportation = relationship("Transportation", back_populates="itinerary", cascade="all, delete-orphan")
    notes = relationship("TripNote", back_populates="itinerary", cascade="all, delete-orphan")



# ITINERARY DAY MODEL (Daily Schedule)

class ItineraryDay(Base):
    __tablename__ = "itinerary_days"

    id = Column(Integer, primary_key=True, index=True)
    day_number = Column(Integer, nullable=False)  # Day 1, Day 2, etc.
    date = Column(Date, nullable=False)  # Actual date
    title = Column(String, nullable=True)  # e.g., "Trek to Base Camp"
    description = Column(Text, nullable=True)  # Daily summary
    
    # Weather placeholders (will be populated from API later)
    weather_temp_min = Column(Float, nullable=True)
    weather_temp_max = Column(Float, nullable=True)
    weather_condition = Column(String, nullable=True)  # sunny, rainy, cloudy, etc.
    
    # Budget for this day
    estimated_cost = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    
    # Foreign Keys
    itinerary_id = Column(Integer, ForeignKey("itineraries.id"), nullable=False)
    
    # Relationships
    itinerary = relationship("Itinerary", back_populates="days")
    activities = relationship("Activity", back_populates="day", cascade="all, delete-orphan", order_by="Activity.start_time")



# ACTIVITY MODEL (Things to do each day)
class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)  # e.g., "Visit Swayambhunath Temple"
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)  # Place name
    
    # Location coordinates (for Google Maps integration later)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    place_id = Column(String, nullable=True)  # Google Place ID
    
    # Timing
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    duration_minutes = Column(Integer, nullable=True)  # Estimated duration
    
    # Details
    activity_type = Column(String, nullable=True)  # sightseeing, dining, adventure, relaxation, etc.
    cost = Column(Float, default=0.0)
    booking_required = Column(Boolean, default=False)
    booking_url = Column(String, nullable=True)
    
    # Status
    is_completed = Column(Boolean, default=False)
    priority = Column(String, default="medium")  # low, medium, high, must-do
    
    # Foreign Keys
    day_id = Column(Integer, ForeignKey("itinerary_days.id"), nullable=False)
    
    # Relationships
    day = relationship("ItineraryDay", back_populates="activities")



# ACCOMMODATION MODEL (Where to stay)
class Accommodation(Base):
    __tablename__ = "accommodations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Hotel/Guesthouse name
    type = Column(String, nullable=True)  # hotel, hostel, guesthouse, airbnb, camping
    address = Column(String, nullable=True)
    
    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    place_id = Column(String, nullable=True)
    
    # Check-in/out
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    
    # Details
    cost_per_night = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    booking_reference = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    website = Column(String, nullable=True)
    
    # Status
    is_booked = Column(Boolean, default=False)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Foreign Keys
    itinerary_id = Column(Integer, ForeignKey("itineraries.id"), nullable=False)
    
    # Relationships
    itinerary = relationship("Itinerary", back_populates="accommodations")


# TRANSPORTATION MODEL (How to get around)
class Transportation(Base):
    __tablename__ = "transportation"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # flight, bus, train, car, taxi, etc.
    
    # Journey details
    from_location = Column(String, nullable=False)
    to_location = Column(String, nullable=False)
    departure_datetime = Column(DateTime, nullable=True)
    arrival_datetime = Column(DateTime, nullable=True)
    
    # Booking details
    provider = Column(String, nullable=True)  # Airline, Bus company, etc.
    booking_reference = Column(String, nullable=True)
    cost = Column(Float, default=0.0)
    
    # Status
    is_booked = Column(Boolean, default=False)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Foreign Keys
    itinerary_id = Column(Integer, ForeignKey("itineraries.id"), nullable=False)
    
    # Relationships
    itinerary = relationship("Itinerary", back_populates="transportation")


# TRIP NOTES MODEL (General notes/reminders)
class TripNote(Base):
    __tablename__ = "trip_notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=True)  # packing, documents, tips, emergency
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Foreign Keys
    itinerary_id = Column(Integer, ForeignKey("itineraries.id"), nullable=False)
    
    # Relationships
    itinerary = relationship("Itinerary", back_populates="notes")