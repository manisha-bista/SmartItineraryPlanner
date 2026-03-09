from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, Text, Boolean, Time, Index
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# USER MODEL
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)  # user, admin
    
    # Profile fields
    profile_picture_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    itineraries = relationship("Itinerary", back_populates="owner", cascade="all, delete-orphan")
    comments = relationship("ItineraryComment", back_populates="user", cascade="all, delete-orphan")
    community_updates = relationship("CommunityUpdate", back_populates="author", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="user", cascade="all, delete-orphan")
    community_posts = relationship("CommunityPost", back_populates="author", cascade="all, delete-orphan")


# ITINERARY MODEL (Main Trip)
class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    destination = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Cover image for the trip
    cover_image_url = Column(String(500), nullable=True)
    
    # Dates
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False)
    
    # Budget
    estimated_budget = Column(Float, default=0.0)
    actual_budget = Column(Float, default=0.0)
    currency = Column(String(10), default="NPR")
    
    # Status
    status = Column(String(50), default="planning", index=True)  # planning, confirmed, ongoing, completed, cancelled
    
    # Public/Private
    is_public = Column(Boolean, default=False, index=True)
    
    # Engagement metrics
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    owner = relationship("User", back_populates="itineraries")
    days = relationship("ItineraryDay", back_populates="itinerary", cascade="all, delete-orphan", order_by="ItineraryDay.day_number")
    accommodations = relationship("Accommodation", back_populates="itinerary", cascade="all, delete-orphan")
    transportation = relationship("Transportation", back_populates="itinerary", cascade="all, delete-orphan")
    notes = relationship("TripNote", back_populates="itinerary", cascade="all, delete-orphan")
    comments = relationship("ItineraryComment", back_populates="itinerary", cascade="all, delete-orphan")
    tags = relationship("ItineraryTag", back_populates="itinerary", cascade="all, delete-orphan")

    # Composite indexes for common queries
    __table_args__ = (
        Index('idx_user_status', 'user_id', 'status'),
        Index('idx_public_status', 'is_public', 'status'),
        Index('idx_destination_dates', 'destination', 'start_date'),
    )


# ITINERARY DAY MODEL
class ItineraryDay(Base):
    __tablename__ = "itinerary_days"

    id = Column(Integer, primary_key=True, index=True)
    day_number = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    
    # Weather data (from OpenWeather API)
    weather_temp_min = Column(Float, nullable=True)
    weather_temp_max = Column(Float, nullable=True)
    weather_condition = Column(String(100), nullable=True)
    weather_description = Column(String(200), nullable=True)
    weather_icon = Column(String(50), nullable=True)
    weather_humidity = Column(Integer, nullable=True)
    weather_wind_speed = Column(Float, nullable=True)
    weather_fetched_at = Column(DateTime, nullable=True)
    
    # Budget
    estimated_cost = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    
    # Main location for the day (for weather API)
    main_location = Column(String(200), nullable=True)
    main_latitude = Column(Float, nullable=True)
    main_longitude = Column(Float, nullable=True)
    
    # Foreign Keys
    itinerary_id = Column(Integer, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    itinerary = relationship("Itinerary", back_populates="days")
    activities = relationship("Activity", back_populates="day", cascade="all, delete-orphan", order_by="Activity.start_time")

    __table_args__ = (
        Index('idx_itinerary_day_number', 'itinerary_id', 'day_number'),
    )


# ACTIVITY MODEL
class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)
    
    # Google Maps data
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    place_id = Column(String(200), nullable=True, index=True)  # Google Place ID
    formatted_address = Column(String(500), nullable=True)
    place_types = Column(String(500), nullable=True)  # Comma-separated types from Google
    rating = Column(Float, nullable=True)  # Google rating
    user_ratings_total = Column(Integer, nullable=True)
    
    # Photos from Google Places
    photo_reference = Column(String(500), nullable=True)
    
    # Timing
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Details
    activity_type = Column(String(50), nullable=True, index=True)  # sightseeing, dining, adventure, etc.
    cost = Column(Float, default=0.0)
    booking_required = Column(Boolean, default=False)
    booking_url = Column(String(500), nullable=True)
    booking_reference = Column(String(200), nullable=True)
    
    # Status and Priority
    is_completed = Column(Boolean, default=False, index=True)
    priority = Column(String(20), default="medium")  # low, medium, high, must-do
    
    # Order within the day
    display_order = Column(Integer, default=0)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Foreign Keys
    day_id = Column(Integer, ForeignKey("itinerary_days.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    day = relationship("ItineraryDay", back_populates="activities")

    __table_args__ = (
        Index('idx_day_order', 'day_id', 'display_order'),
        Index('idx_day_time', 'day_id', 'start_time'),
    )


# ACCOMMODATION MODEL
class Accommodation(Base):
    __tablename__ = "accommodations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    type = Column(String(50), nullable=True)  # hotel, hostel, guesthouse, airbnb, camping
    address = Column(String(500), nullable=True)
    
    # Google Maps data
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    place_id = Column(String(200), nullable=True, index=True)
    rating = Column(Float, nullable=True)
    photo_reference = Column(String(500), nullable=True)
    
    # Check-in/out
    check_in_date = Column(Date, nullable=False, index=True)
    check_out_date = Column(Date, nullable=False)
    check_in_time = Column(Time, nullable=True)
    check_out_time = Column(Time, nullable=True)
    
    # Details
    cost_per_night = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    number_of_nights = Column(Integer, nullable=True)
    room_type = Column(String(100), nullable=True)
    
    # Booking
    booking_reference = Column(String(200), nullable=True)
    contact_number = Column(String(50), nullable=True)
    contact_email = Column(String(200), nullable=True)
    website = Column(String(500), nullable=True)
    is_booked = Column(Boolean, default=False)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Foreign Keys
    itinerary_id = Column(Integer, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    itinerary = relationship("Itinerary", back_populates="accommodations")


# TRANSPORTATION MODEL
class Transportation(Base):
    __tablename__ = "transportation"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False, index=True)  # flight, bus, train, car, taxi, etc.
    
    # Journey details
    from_location = Column(String(200), nullable=False)
    to_location = Column(String(200), nullable=False)
    from_latitude = Column(Float, nullable=True)
    from_longitude = Column(Float, nullable=True)
    to_latitude = Column(Float, nullable=True)
    to_longitude = Column(Float, nullable=True)
    
    # Timing
    departure_datetime = Column(DateTime, nullable=True, index=True)
    arrival_datetime = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Booking details
    provider = Column(String(200), nullable=True)  # Airline, Bus company, etc.
    booking_reference = Column(String(200), nullable=True)
    seat_number = Column(String(50), nullable=True)
    cost = Column(Float, default=0.0)
    is_booked = Column(Boolean, default=False)
    
    # Additional info
    terminal = Column(String(100), nullable=True)
    gate = Column(String(50), nullable=True)
    confirmation_url = Column(String(500), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Foreign Keys
    itinerary_id = Column(Integer, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    itinerary = relationship("Itinerary", back_populates="transportation")


# TRIP NOTES MODEL
class TripNote(Base):
    __tablename__ = "trip_notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), nullable=True, index=True)  # packing, documents, tips, emergency, etc.
    priority = Column(String(20), default="normal")  # low, normal, high, urgent
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    itinerary_id = Column(Integer, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    itinerary = relationship("Itinerary", back_populates="notes")


# NEW: ITINERARY COMMENTS (for community engagement)
class ItineraryComment(Base):
    __tablename__ = "itinerary_comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)  # 1-5 stars (optional)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    itinerary_id = Column(Integer, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    itinerary = relationship("Itinerary", back_populates="comments")
    user = relationship("User", back_populates="comments")

    __table_args__ = (
        Index('idx_itinerary_created', 'itinerary_id', 'created_at'),
    )


# NEW: ITINERARY TAGS (for categorization and search)
class ItineraryTag(Base):
    __tablename__ = "itinerary_tags"

    id = Column(Integer, primary_key=True, index=True)
    tag = Column(String(50), nullable=False, index=True)  # adventure, budget, luxury, cultural, etc.
    
    # Foreign Keys
    itinerary_id = Column(Integer, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    itinerary = relationship("Itinerary", back_populates="tags")

    __table_args__ = (
        Index('idx_tag_itinerary', 'tag', 'itinerary_id'),
    )


# NEW: COMMUNITY UPDATES (road closures, events, alerts)
class CommunityUpdate(Base):
    __tablename__ = "community_updates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    location = Column(String(200), nullable=False, index=True)
    
    # Location coordinates
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Type of update
    update_type = Column(String(50), nullable=False, index=True)  # closure, event, alert, tip, hazard
    severity = Column(String(20), default="info")  # info, warning, urgent
    
    # Validity period
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    
    # Engagement
    verified = Column(Boolean, default=False)
    upvotes = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    author = relationship("User", back_populates="community_updates")

    __table_args__ = (
        Index('idx_location_active', 'location', 'is_active'),
        Index('idx_type_created', 'update_type', 'created_at'),
    )


# COMPLAINT MODEL (for admin management)
class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=True, index=True)  # bug, feedback, abuse, other
    status = Column(String(20), default="open", nullable=False, index=True)  # open, pending, resolved
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="complaints")


# COMMUNITY POST MODEL (user-generated feed posts)
class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    
    # tag/flair for the post (Experience, Alert, Event, Tip, Question)
    tag = Column(String(50), default="Experience", nullable=False, index=True)
    
    # place filter — "All" for now, will be destination-specific later
    place = Column(String(200), default="All", nullable=False, index=True)
    
    # engagement
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    author = relationship("User", back_populates="community_posts")
    votes = relationship("PostVote", back_populates="post", cascade="all, delete-orphan")


# tracks which user voted on which post (so one vote per user per post)
class PostVote(Base):
    __tablename__ = "post_votes"

    id = Column(Integer, primary_key=True, index=True)
    direction = Column(String(10), nullable=False)  # 'up' or 'down'
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    post = relationship("CommunityPost", back_populates="votes")

    __table_args__ = (
        Index('idx_user_post_vote', 'user_id', 'post_id', unique=True),
    )