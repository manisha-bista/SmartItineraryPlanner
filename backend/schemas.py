from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional
from datetime import date, datetime, time

# ============================================
# USER SCHEMAS
# ============================================
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


# ============================================
# ACTIVITY SCHEMAS
# ============================================
class ActivityBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_id: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration_minutes: Optional[int] = None
    activity_type: Optional[str] = None
    cost: float = 0.0
    booking_required: bool = False
    booking_url: Optional[str] = None
    is_completed: bool = False
    priority: str = "medium"

class ActivityCreate(ActivityBase):
    day_id: int

class ActivityUpdate(ActivityBase):
    pass

class ActivityOut(ActivityBase):
    id: int
    day_id: int

    class Config:
        from_attributes = True


# ============================================
# ITINERARY DAY SCHEMAS
# ============================================
class ItineraryDayBase(BaseModel):
    day_number: int
    date: date
    title: Optional[str] = None
    description: Optional[str] = None
    weather_temp_min: Optional[float] = None
    weather_temp_max: Optional[float] = None
    weather_condition: Optional[str] = None
    estimated_cost: float = 0.0
    actual_cost: float = 0.0

class ItineraryDayCreate(ItineraryDayBase):
    itinerary_id: int
    activities: List[ActivityBase] = []

class ItineraryDayUpdate(ItineraryDayBase):
    pass

class ItineraryDayOut(ItineraryDayBase):
    id: int
    itinerary_id: int
    activities: List[ActivityOut] = []

    class Config:
        from_attributes = True


# ============================================
# ACCOMMODATION SCHEMAS
# ============================================
class AccommodationBase(BaseModel):
    name: str
    type: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_id: Optional[str] = None
    check_in_date: date
    check_out_date: date
    cost_per_night: float = 0.0
    total_cost: float = 0.0
    booking_reference: Optional[str] = None
    contact_number: Optional[str] = None
    website: Optional[str] = None
    is_booked: bool = False
    notes: Optional[str] = None

class AccommodationCreate(AccommodationBase):
    itinerary_id: int

class AccommodationUpdate(AccommodationBase):
    pass

class AccommodationOut(AccommodationBase):
    id: int
    itinerary_id: int

    class Config:
        from_attributes = True


# ============================================
# TRANSPORTATION SCHEMAS
# ============================================
class TransportationBase(BaseModel):
    type: str
    from_location: str
    to_location: str
    departure_datetime: Optional[datetime] = None
    arrival_datetime: Optional[datetime] = None
    provider: Optional[str] = None
    booking_reference: Optional[str] = None
    cost: float = 0.0
    is_booked: bool = False
    notes: Optional[str] = None

class TransportationCreate(TransportationBase):
    itinerary_id: int

class TransportationUpdate(TransportationBase):
    pass

class TransportationOut(TransportationBase):
    id: int
    itinerary_id: int

    class Config:
        from_attributes = True


# ============================================
# TRIP NOTE SCHEMAS
# ============================================
class TripNoteBase(BaseModel):
    title: str
    content: str
    category: Optional[str] = None

class TripNoteCreate(TripNoteBase):
    itinerary_id: int

class TripNoteUpdate(TripNoteBase):
    pass

class TripNoteOut(TripNoteBase):
    id: int
    itinerary_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# ITINERARY SCHEMAS (MAIN)
# ============================================
class ItineraryBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    destination: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    start_date: date
    end_date: date
    estimated_budget: float = 0.0
    actual_budget: float = 0.0
    currency: str = "NPR"
    status: str = "planning"
    is_public: bool = False

    @validator('end_date')
    def end_date_after_start_date(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v

class ItineraryCreate(ItineraryBase):
    user_id: int

class ItineraryCreateWithDays(ItineraryCreate):
    """Extended schema for creating itinerary with nested days and activities"""
    days: List[ItineraryDayBase] = []
    accommodations: List[AccommodationBase] = []
    transportation: List[TransportationBase] = []

class ItineraryUpdate(BaseModel):
    title: Optional[str] = None
    destination: Optional[str] = None
    description: Optional[str] = None
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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ItineraryDetailOut(ItineraryOut):
    """Detailed itinerary with all nested data"""
    days: List[ItineraryDayOut] = []
    accommodations: List[AccommodationOut] = []
    transportation: List[TransportationOut] = []
    notes: List[TripNoteOut] = []

    class Config:
        from_attributes = True


# ============================================
# SUMMARY SCHEMAS (For Dashboard)
# ============================================
class ItinerarySummary(BaseModel):
    """Lightweight schema for listing itineraries on dashboard"""
    id: int
    title: str
    destination: str
    start_date: date
    end_date: date
    status: str
    estimated_budget: float
    currency: str
    total_days: Optional[int] = 0
    total_activities: Optional[int] = 0

    class Config:
        from_attributes = True