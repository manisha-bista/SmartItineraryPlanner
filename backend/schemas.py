from pydantic import BaseModel, EmailStr, Field, validator, HttpUrl
from typing import List, Optional
from datetime import date, datetime, time

# ============================================
# USER SCHEMAS
# ============================================
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    bio: Optional[str] = None
    location: Optional[str] = None
    profile_picture_url: Optional[str] = None
    avatar_id: Optional[int] = Field(None, ge=1, le=20)

class UserOut(BaseModel):
    id: int
    name: str
    username: Optional[str] = None
    email: EmailStr
    role: str = "user"
    avatar_id: int = 1
    bio: Optional[str] = None
    location: Optional[str] = None
    profile_picture_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# public profile — no real name or email shown
class UserPublicProfile(BaseModel):
    id: int
    username: Optional[str] = None
    avatar_id: int = 1
    bio: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# ACTIVITY SCHEMAS
# ============================================
class ActivityBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    location: Optional[str] = None
    
    # Google Maps fields
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    place_id: Optional[str] = None
    formatted_address: Optional[str] = None
    place_types: Optional[str] = None
    rating: Optional[float] = Field(None, ge=0, le=5)
    user_ratings_total: Optional[int] = None
    photo_reference: Optional[str] = None
    
    # Timing
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration_minutes: Optional[int] = Field(None, gt=0)
    
    # Details
    activity_type: Optional[str] = None
    cost: float = Field(default=0.0, ge=0)
    booking_required: bool = False
    booking_url: Optional[str] = None
    booking_reference: Optional[str] = None
    
    # Status
    is_completed: bool = False
    priority: str = Field(default="medium", pattern="^(low|medium|high|must-do)$")
    display_order: int = Field(default=0, ge=0)
    notes: Optional[str] = None

class ActivityCreate(ActivityBase):
    day_id: int

class ActivityUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration_minutes: Optional[int] = None
    activity_type: Optional[str] = None
    cost: Optional[float] = None
    priority: Optional[str] = None
    is_completed: Optional[bool] = None
    display_order: Optional[int] = None
    notes: Optional[str] = None

class ActivityOut(ActivityBase):
    id: int
    day_id: int
    actual_cost: Optional[float] = 0.0   # Optional so NULL from DB coerces to 0
    weather_temp: Optional[float] = None
    weather_condition: Optional[str] = None
    weather_description: Optional[str] = None
    weather_icon: Optional[str] = None
    weather_humidity: Optional[int] = None
    weather_wind_speed: Optional[float] = None

    class Config:
        from_attributes = True


# ============================================
# ITINERARY DAY SCHEMAS
# ============================================
class ItineraryDayBase(BaseModel):
    day_number: int = Field(..., gt=0)
    date: date
    title: Optional[str] = None
    description: Optional[str] = None
    
    # Weather fields
    weather_temp_min: Optional[float] = None
    weather_temp_max: Optional[float] = None
    weather_condition: Optional[str] = None
    weather_description: Optional[str] = None
    weather_icon: Optional[str] = None
    weather_humidity: Optional[int] = None
    weather_wind_speed: Optional[float] = None
    
    # Budget
    estimated_cost: float = Field(default=0.0, ge=0)
    actual_cost: float = Field(default=0.0, ge=0)
    
    # Main location for weather
    main_location: Optional[str] = None
    main_latitude: Optional[float] = None
    main_longitude: Optional[float] = None

class ItineraryDayCreate(ItineraryDayBase):
    itinerary_id: int
    activities: List[ActivityBase] = []

class ItineraryDayUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    main_location: Optional[str] = None
    main_latitude: Optional[float] = None
    main_longitude: Optional[float] = None

class ItineraryDayOut(ItineraryDayBase):
    id: int
    itinerary_id: int
    weather_fetched_at: Optional[datetime] = None
    activities: List[ActivityOut] = []

    class Config:
        from_attributes = True


# ============================================
# ACCOMMODATION SCHEMAS
# ============================================
class AccommodationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    type: Optional[str] = None
    address: Optional[str] = None
    
    # Google Maps fields
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_id: Optional[str] = None
    rating: Optional[float] = None
    photo_reference: Optional[str] = None
    
    # Check-in/out
    check_in_date: date
    check_out_date: date
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None
    
    # Details
    cost_per_night: float = Field(default=0.0, ge=0)
    total_cost: float = Field(default=0.0, ge=0)
    number_of_nights: Optional[int] = None
    room_type: Optional[str] = None
    
    # Booking
    booking_reference: Optional[str] = None
    contact_number: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    website: Optional[str] = None
    is_booked: bool = False
    notes: Optional[str] = None

    @validator('check_out_date')
    def check_out_after_check_in(cls, v, values):
        if 'check_in_date' in values and v < values['check_in_date']:
            raise ValueError('check_out_date must be after check_in_date')
        return v

class AccommodationCreate(AccommodationBase):
    itinerary_id: int

class AccommodationUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    check_in_date: Optional[date] = None
    check_out_date: Optional[date] = None
    cost_per_night: Optional[float] = None
    total_cost: Optional[float] = None
    is_booked: Optional[bool] = None
    notes: Optional[str] = None

class AccommodationOut(AccommodationBase):
    id: int
    itinerary_id: int

    class Config:
        from_attributes = True


# ============================================
# TRANSPORTATION SCHEMAS
# ============================================
class TransportationBase(BaseModel):
    type: str = Field(..., min_length=1)
    from_location: str
    to_location: str
    from_latitude: Optional[float] = None
    from_longitude: Optional[float] = None
    to_latitude: Optional[float] = None
    to_longitude: Optional[float] = None
    
    # Timing
    departure_datetime: Optional[datetime] = None
    arrival_datetime: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    
    # Booking
    provider: Optional[str] = None
    booking_reference: Optional[str] = None
    seat_number: Optional[str] = None
    cost: float = Field(default=0.0, ge=0)
    is_booked: bool = False
    
    # Additional
    terminal: Optional[str] = None
    gate: Optional[str] = None
    confirmation_url: Optional[str] = None
    notes: Optional[str] = None

class TransportationCreate(TransportationBase):
    itinerary_id: int

class TransportationUpdate(BaseModel):
    type: Optional[str] = None
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    departure_datetime: Optional[datetime] = None
    arrival_datetime: Optional[datetime] = None
    cost: Optional[float] = None
    is_booked: Optional[bool] = None
    notes: Optional[str] = None

class TransportationOut(TransportationBase):
    id: int
    itinerary_id: int

    class Config:
        from_attributes = True


# ============================================
# TRIP NOTE SCHEMAS
# ============================================
class TripNoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    category: Optional[str] = None
    priority: str = Field(default="normal", pattern="^(low|normal|high|urgent)$")

class TripNoteCreate(TripNoteBase):
    itinerary_id: int

class TripNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None

class TripNoteOut(TripNoteBase):
    id: int
    itinerary_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================
# ITINERARY COMMENT SCHEMAS
# ============================================
class CommentBase(BaseModel):
    content: str = Field(..., min_length=1)
    rating: Optional[int] = Field(None, ge=1, le=5)

class CommentCreate(CommentBase):
    itinerary_id: int

class CommentUpdate(BaseModel):
    content: Optional[str] = None
    rating: Optional[int] = None

class CommentOut(CommentBase):
    id: int
    itinerary_id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================
# ITINERARY TAG SCHEMAS
# ============================================
class TagCreate(BaseModel):
    tag: str = Field(..., min_length=1, max_length=50)
    itinerary_id: int

class TagOut(BaseModel):
    id: int
    tag: str
    itinerary_id: int

    class Config:
        from_attributes = True


# ============================================
# COMMUNITY UPDATE SCHEMAS
# ============================================
class CommunityUpdateBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    location: str = Field(..., min_length=1)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    update_type: str = Field(..., pattern="^(closure|event|alert|tip|hazard)$")
    severity: str = Field(default="info", pattern="^(info|warning|urgent)$")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool = True

class CommunityUpdateCreate(CommunityUpdateBase):
    pass

class CommunityUpdateUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = None
    end_date: Optional[date] = None

class CommunityUpdateOut(CommunityUpdateBase):
    id: int
    user_id: int
    verified: bool
    upvotes: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================
# ITINERARY SCHEMAS (MAIN)
# ============================================
class ItineraryBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    destination: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    
    # Dates
    start_date: date
    end_date: date
    
    # Budget
    estimated_budget: float = Field(default=0.0, ge=0)
    actual_budget: float = Field(default=0.0, ge=0)
    currency: str = Field(default="NPR", max_length=10)
    
    # Status
    status: str = Field(default="planning", pattern="^(planning|confirmed|ongoing|completed|cancelled)$")
    is_public: bool = False

    @validator('end_date')
    def end_date_after_start_date(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v

class ItineraryCreate(ItineraryBase):
    user_id: int

class ItineraryCreateWithDays(ItineraryCreate):
    """Extended schema for creating itinerary with nested data"""
    days: List[ItineraryDayBase] = []
    accommodations: List[AccommodationBase] = []
    transportation: List[TransportationBase] = []
    tags: List[str] = []  # Simple list of tag strings

class ItineraryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    destination: Optional[str] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    estimated_budget: Optional[float] = None
    actual_budget: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[str] = None
    is_public: Optional[bool] = None

class ItineraryOut(ItineraryBase):
    id: int
    user_id: int
    view_count: int
    like_count: int
    created_at: datetime
    updated_at: datetime
    weather_fetched_at: Optional[datetime] = None  # from first day that has weather

    class Config:
        from_attributes = True

class ItineraryDetailOut(ItineraryOut):
    """Detailed itinerary with all nested data"""
    days: List[ItineraryDayOut] = []
    accommodations: List[AccommodationOut] = []
    transportation: List[TransportationOut] = []
    notes: List[TripNoteOut] = []
    comments: List[CommentOut] = []
    tags: List[TagOut] = []

    class Config:
        from_attributes = True


# ============================================
# SUMMARY SCHEMAS (For Dashboard/Listings)
# ============================================
class ItinerarySummary(BaseModel):
    """Lightweight schema for listing itineraries"""
    id: int
    title: str
    destination: str
    cover_image_url: Optional[str] = None
    start_date: date
    end_date: date
    status: str
    estimated_budget: float
    currency: str
    is_public: bool
    view_count: int
    like_count: int
    total_days: Optional[int] = 0
    total_activities: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# API INTEGRATION SCHEMAS
# ============================================
class WeatherData(BaseModel):
    """Schema for weather data from OpenWeather API"""
    temp_min: float
    temp_max: float
    condition: str
    description: str
    icon: str
    humidity: int
    wind_speed: float

class GooglePlaceData(BaseModel):
    """Schema for place data from Google Places API"""
    place_id: str
    name: str
    formatted_address: str
    latitude: float
    longitude: float
    types: List[str]
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    photo_reference: Optional[str] = None

class RouteRequest(BaseModel):
    """Request for route calculation"""
    origin: str
    destination: str
    waypoints: Optional[List[str]] = []
    mode: str = Field(default="driving", pattern="^(driving|walking|bicycling|transit)$")

class RouteResponse(BaseModel):
    """Response with route information"""
    distance_km: float
    duration_minutes: int
    polyline: str  # Encoded polyline for map display


# ============================================
# COMPLAINT SCHEMAS
# ============================================
class ComplaintBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    category: Optional[str] = Field(None, pattern="^(bug|feedback|abuse|other)$")

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(open|pending|resolved)$")

class ComplaintOut(ComplaintBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================
# COMMUNITY POST SCHEMAS
# ============================================
class CommunityPostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    body: Optional[str] = None
    image_url: Optional[str] = None
    tag: str = Field(default="Experience", pattern="^(Experience|Alert|Event|Tip|Question)$")
    place: str = Field(default="All", max_length=200)

class CommunityPostOut(BaseModel):
    id: int
    title: str
    body: Optional[str] = None
    image_url: Optional[str] = None
    tag: str
    place: str
    upvotes: int
    downvotes: int
    comment_count: int
    user_id: int
    created_at: datetime
    # added by the endpoint, not directly from the model
    author_name: Optional[str] = None
    author_initial: Optional[str] = None
    user_vote: Optional[str] = None  # 'up', 'down', or None

    class Config:
        from_attributes = True

class PostVoteRequest(BaseModel):
    direction: str = Field(..., pattern="^(up|down)$")


# ============================================
# POST COMMENT SCHEMAS
# ============================================
class PostCommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

class PostCommentOut(BaseModel):
    id: int
    content: str
    post_id: int
    user_id: int
    created_at: datetime
    author_name: Optional[str] = None
    author_initial: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================
# NOTIFICATION SCHEMAS
# ============================================
class NotificationOut(BaseModel):
    id: int
    user_id: int
    type: str
    message: str
    is_read: bool
    post_id: Optional[int] = None
    from_user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# FRIENDSHIP SCHEMAS
# ============================================
class FriendRequestCreate(BaseModel):
    receiver_username: str = Field(..., min_length=1)

class FriendshipOut(BaseModel):
    id: int
    requester_id: int
    receiver_id: int
    status: str
    created_at: datetime
    accepted_at: Optional[datetime] = None
    friend_username: Optional[str] = None
    friend_avatar_id: Optional[int] = None

    class Config:
        from_attributes = True


# ============================================
# MESSAGE SCHEMAS
# ============================================
class MessageCreate(BaseModel):
    receiver_id: int
    content: str = Field(..., min_length=1, max_length=2000)
    shared_itinerary_id: Optional[int] = None

class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    shared_itinerary_id: Optional[int] = None
    created_at: datetime
    sender_username: Optional[str] = None
    sender_avatar_id: Optional[int] = None

    class Config:
        from_attributes = True