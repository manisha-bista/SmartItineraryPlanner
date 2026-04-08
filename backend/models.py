from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, Text, Boolean, Time, Index, UniqueConstraint
from sqlalchemy.orm import relationship, backref
from database import Base
from datetime import datetime

# USER MODEL
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    username = Column(String(20), unique=True, index=True, nullable=True)  # auto-generated, public identity
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)  # user, admin
    
    # Profile fields
    avatar_id = Column(Integer, default=1, nullable=False)  # index into predefined avatar list (1-30)
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

    # Fork tracking
    forked_from = Column(Integer, ForeignKey("itineraries.id", ondelete="SET NULL"), nullable=True)
    
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
    collaborators = relationship("ItineraryCollaborator", back_populates="itinerary", cascade="all, delete-orphan", foreign_keys="[ItineraryCollaborator.itinerary_id]")

    # Composite indexes for common queries
    __table_args__ = (
        Index('idx_user_status', 'user_id', 'status'),
        Index('idx_public_status', 'is_public', 'status'),
        Index('idx_destination_dates', 'destination', 'start_date'),
    )


# ITINERARY COLLABORATOR MODEL - for shared collaborative editing
class ItineraryCollaborator(Base):
    __tablename__ = "itinerary_collaborators"

    id = Column(Integer, primary_key=True, index=True)
    itinerary_id = Column(Integer, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), default="editor", nullable=False)   # editor, viewer
    status = Column(String(20), default="pending", nullable=False) # pending, accepted, rejected

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    accepted_at = Column(DateTime, nullable=True)

    # Relationships
    itinerary = relationship("Itinerary", back_populates="collaborators", foreign_keys=[itinerary_id])

    __table_args__ = (
        Index('idx_collab_itinerary_user', 'itinerary_id', 'user_id', unique=True),
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
    photo_reference = Column(Text, nullable=True)

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
    
    # Weather (per-activity, fetched by time slot)
    weather_temp = Column(Float, nullable=True)
    weather_condition = Column(String(100), nullable=True)
    weather_description = Column(String(200), nullable=True)
    weather_icon = Column(String(50), nullable=True)
    weather_humidity = Column(Integer, nullable=True)
    weather_wind_speed = Column(Float, nullable=True)

    # Actual spend (tracked separately from estimated cost)
    actual_cost = Column(Float, default=0.0)

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
    photo_reference = Column(Text, nullable=True)

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


# ITINERARY COMMENTS (for community engagement)
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


# ITINERARY TAGS (for categorization and search)
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


# COMMUNITY UPDATES (road closures, events, alerts)
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

    # Optional linked itinerary
    shared_itinerary_id = Column(Integer, ForeignKey("itineraries.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    author = relationship("User", back_populates="community_posts")
    votes = relationship("PostVote", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("PostComment", back_populates="post", cascade="all, delete-orphan")
    shared_itinerary = relationship("Itinerary", foreign_keys=[shared_itinerary_id])


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


# PLACE MODEL
# Caches Google Places API results so we only ever call the API
# once per unique place. All future lookups for the same place hit our DB.
class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    google_place_id = Column(String(200), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False, index=True)
    address = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    place_types = Column(String(500), nullable=True)   # "tourist_attraction,park"
    rating = Column(Float, nullable=True)
    photo_reference = Column(String(1000), nullable=True)
    city = Column(String(100), nullable=True, index=True)  # "Kathmandu" | "Pokhara" | "Bhaktapur"
    created_at = Column(DateTime, default=datetime.utcnow)

    # relationship to aliases
    aliases = relationship("PlaceSearchAlias", back_populates="place", cascade="all, delete-orphan")


# PLACE SEARCH ALIAS
# Learns from every Google API query. Maps user search terms to cached places.
# e.g. "monkey temple" → Swayambhunath, "boudha" → Boudhanath Stupa
# Only stores aliases for queries 5+ chars to avoid noisy short fragments.
class PlaceSearchAlias(Base):
    __tablename__ = "place_search_aliases"

    id = Column(Integer, primary_key=True, index=True)
    query_text = Column(String(300), nullable=False, index=True)  # lowercase, trimmed
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False, index=True)
    hit_count = Column(Integer, default=1)  # how many times this alias was searched
    created_at = Column(DateTime, default=datetime.utcnow)

    # relationship
    place = relationship("Place", back_populates="aliases")

    __table_args__ = (
        Index('idx_alias_query_place', 'query_text', 'place_id', unique=True),
    )


# PASSWORD RESET OTP
# Stores a temporary 6-digit OTP for password reset.
# Expires after 10 minutes. Deleted after successful use.
class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    otp_code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# POST COMMENT MODEL
# Comments on community posts
class PostComment(Base):
    __tablename__ = "post_comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Foreign Keys
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_comment_id = Column(Integer, ForeignKey("post_comments.id", ondelete="CASCADE"), nullable=True, index=True)

    # Relationships
    post = relationship("CommunityPost", back_populates="comments")
    user = relationship("User")
    reactions = relationship("PostCommentReaction", back_populates="comment", cascade="all, delete-orphan")
    replies = relationship("PostComment", backref=backref("parent", remote_side="PostComment.id"), foreign_keys=[parent_comment_id], cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_post_comment_created', 'post_id', 'created_at'),
    )


# POST COMMENT REACTION MODEL
class PostCommentReaction(Base):
    __tablename__ = "post_comment_reactions"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("post_comments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    emoji = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    comment = relationship("PostComment", back_populates="reactions")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("comment_id", "user_id", name="uq_comment_user_reaction"),
    )


# NOTIFICATION MODEL
# Tracks events users should know about — votes, comments on their content
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)  # 'comment', 'upvote', 'alert'
    message = Column(String(500), nullable=False)
    is_read = Column(Boolean, default=False, index=True)

    # optional references
    post_id = Column(Integer, nullable=True)
    from_user_id = Column(Integer, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_user_unread', 'user_id', 'is_read'),
    )


# FRIENDSHIP MODEL
# Bidirectional friend connections with request/accept flow
class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending, accepted, rejected

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    accepted_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index('idx_friendship_pair', 'requester_id', 'receiver_id', unique=True),
    )


# MESSAGE MODEL
# Direct messages between friends
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)

    # optional: shared itinerary
    shared_itinerary_id = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('idx_message_conversation', 'sender_id', 'receiver_id', 'created_at'),
    )


# SAVED POST MODEL
class SavedPost(Base):
    __tablename__ = "saved_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_saved_user_post"),
    )


# POST REPORT MODEL
# Users can report posts or comments for admin review
class PostReport(Base):
    __tablename__ = "post_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=True, index=True)
    comment_id = Column(Integer, ForeignKey("post_comments.id", ondelete="CASCADE"), nullable=True, index=True)
    reason = Column(String(200), nullable=False)
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending, reviewed, dismissed

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    reporter = relationship("User", foreign_keys=[reporter_id])
    post = relationship("CommunityPost", foreign_keys=[post_id])
    comment = relationship("PostComment", foreign_keys=[comment_id])

    __table_args__ = (
        Index('idx_report_status_created', 'status', 'created_at'),
    )