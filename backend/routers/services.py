"""
routers/services.py
External integrations: Google Places (cache-first), OpenWeather, and Gemini AI.
"""
import os
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

import models
from database import get_db
from services.gemini_ai import generate_itinerary
from services.weather_maps import fetch_weather_for_itinerary

logger = logging.getLogger(__name__)

# Nepal city list for result prioritisation
def _sort_by_city_priority(places: list, preferred_city: Optional[str] = None) -> list:
    """
    Sort places so that:
      1. Places matching preferred_city come first
      2. Places in any Nepal city come next
      3. Everything else last
    Stable sort — preserves original order within each tier.
    """
    def _score(p) -> int:
        city = (p.city or "").lower()
        addr = (p.address or "").lower()
        combined = city + " " + addr

        if preferred_city and preferred_city.lower() in combined:
            return 0   # best: matches the requested city
        for nc in _ALL_CITIES:
            if nc.lower() in combined:
                return 1   # good: any Nepal city
        return 2           # last: outside Nepal / unknown

    return sorted(places, key=_score)

router = APIRouter(tags=["Services"])

GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
_PLACES_BASE          = "https://maps.googleapis.com/maps/api/place"


# ═══════════════════════════════════════════════════════════════════════════════
# GOOGLE PLACES
# ═══════════════════════════════════════════════════════════════════════════════

def _place_to_dict(p: models.Place) -> dict:
    return {
        "id":             p.id,
        "google_place_id":p.google_place_id,
        "name":           p.name,
        "address":        p.address,
        "latitude":       p.latitude,
        "longitude":      p.longitude,
        "place_types":    p.place_types.split(",") if p.place_types else [],
        "rating":         p.rating,
        "photo_reference":p.photo_reference,
        "city":           p.city,
    }


# Canonical city list — used for city extraction from addresses and result sorting
_ALL_CITIES = [
    # Major cities first (longer match wins via ordering)
    "Kathmandu", "Pokhara", "Bhaktapur", "Lalitpur", "Chitwan",
    "Lumbini", "Mustang", "Nagarkot", "Namche", "Lukla",
    "Gorkha", "Janakpur", "Tansen", "Bardiya", "Manang",
    "Jomsom", "Bandipur", "Dhulikhel", "Kirtipur",
    # Kathmandu sub-areas — map to parent city
    "Boudha", "Thamel", "Patan",
]
# Sub-areas that should map to a parent city
_SUBAREA_MAP = {
    "Boudha":    "Kathmandu",
    "Thamel":    "Kathmandu",
    "Patan":     "Lalitpur",
    "Lalitpur":  "Lalitpur",
}

def _extract_city(address: str) -> Optional[str]:
    lower = address.lower()
    for city in _ALL_CITIES:
        if city.lower() in lower:
            # Map sub-areas to canonical city
            return _SUBAREA_MAP.get(city, city)
    return None


def _save_aliases(db: Session, query_text: str, places: list) -> None:
    """Persist query→place mappings for queries ≥5 chars."""
    if len(query_text) < 5 or not places:
        return
    for place in places:
        if not db.query(models.PlaceSearchAlias).filter(
            models.PlaceSearchAlias.query_text == query_text,
            models.PlaceSearchAlias.place_id   == place.id,
        ).first():
            db.add(models.PlaceSearchAlias(query_text=query_text, place_id=place.id))
    try:
        db.commit()
    except Exception:
        db.rollback()


@router.get("/places/search")
async def search_places(
    query: str = Query(..., min_length=2),
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(500, "Google Places API key not configured")

    clean = query.strip().lower()

    # Layer 1 — alias lookup (previously learned queries)
    if len(clean) >= 3:
        alias_q = (
            db.query(models.Place)
            .join(models.PlaceSearchAlias, models.PlaceSearchAlias.place_id == models.Place.id)
            .filter(models.PlaceSearchAlias.query_text == clean)
        )
        if city:
            alias_q = alias_q.filter(models.Place.city.ilike(city))
        alias_results = alias_q.limit(5).all()
        if alias_results:
            for p in alias_results:
                row = db.query(models.PlaceSearchAlias).filter(
                    models.PlaceSearchAlias.query_text == clean,
                    models.PlaceSearchAlias.place_id   == p.id,
                ).first()
                if row:
                    row.hit_count += 1
            db.commit()
            sorted_alias = _sort_by_city_priority(alias_results, city)
            return {"source": "alias", "results": [_place_to_dict(p) for p in sorted_alias]}

    # Layer 2 — exact substring match on name / address
    cache_q = db.query(models.Place)
    if city:
        cache_q = cache_q.filter(models.Place.city.ilike(city))
    exact = cache_q.filter(
        or_(models.Place.name.ilike(f"%{query}%"), models.Place.address.ilike(f"%{query}%"))
    ).limit(5).all()
    if exact:
        _save_aliases(db, clean, exact)
        sorted_exact = _sort_by_city_priority(exact, city)
        return {"source": "cache", "results": [_place_to_dict(p) for p in sorted_exact]}

    # Layer 3 — word-level match
    words = [w.strip() for w in query.split() if len(w.strip()) >= 2]
    if words:
        word_q = db.query(models.Place)
        if city:
            word_q = word_q.filter(models.Place.city.ilike(city))
        for w in words:
            word_q = word_q.filter(
                or_(models.Place.name.ilike(f"%{w}%"), models.Place.address.ilike(f"%{w}%"))
            )
        word_cache = word_q.limit(5).all()
        if word_cache:
            _save_aliases(db, clean, word_cache)
            sorted_word = _sort_by_city_priority(word_cache, city)
            return {"source": "cache", "results": [_place_to_dict(p) for p in sorted_word]}

    # Layer 4 — Google Places API
    # Always append "Nepal" to bias results toward Nepal; city appended if known
    nepal_suffix = f"{city} Nepal" if city else "Nepal"
    search_query = f"{query} {nepal_suffix}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_PLACES_BASE}/textsearch/json",
            params={
                "query": search_query,
                "key": GOOGLE_PLACES_API_KEY,
                "region": "np",
                # Location bias: center of Nepal, 500km radius
                "locationbias": "circle:500000@28.3949,84.1240",
            },
            timeout=10.0,
        )
    if resp.status_code != 200:
        raise HTTPException(502, "Google Places request failed")
    data = resp.json()
    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        raise HTTPException(502, f"Google Places error: {data.get('status')}")

    results = []
    for item in data.get("results", [])[:5]:
        place_id = item.get("place_id")
        if not place_id:
            continue
        existing = db.query(models.Place).filter(models.Place.google_place_id == place_id).first()
        if existing:
            results.append(existing)
            continue
        geo    = item.get("geometry", {}).get("location", {})
        photos = item.get("photos", [])
        place  = models.Place(
            google_place_id=place_id,
            name=item.get("name", ""),
            address=item.get("formatted_address", ""),
            latitude=geo.get("lat"),
            longitude=geo.get("lng"),
            place_types=",".join(item.get("types", [])[:5]),
            rating=item.get("rating"),
            photo_reference=photos[0].get("photo_reference") if photos else None,
            city=city or _extract_city(item.get("formatted_address", "")),
        )
        db.add(place)
        db.commit()
        db.refresh(place)
        results.append(place)

    _save_aliases(db, clean, results)
    return {"source": "google", "results": [_place_to_dict(p) for p in results]}


@router.get("/places/photo")
async def get_place_photo(
    photo_reference: str = Query(...),
    max_width: int       = Query(400),
):
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(500, "Google Places API key not configured")
    url = (
        f"{_PLACES_BASE}/photo"
        f"?maxwidth={max_width}"
        f"&photo_reference={photo_reference}"
        f"&key={GOOGLE_PLACES_API_KEY}"
    )
    return RedirectResponse(url)


@router.get("/places/cached")
def get_cached_places(city: Optional[str] = Query(None), db: Session = Depends(get_db)):
    q = db.query(models.Place)
    if city:
        q = q.filter(models.Place.city.ilike(city))
    return {"results": [_place_to_dict(p) for p in q.order_by(models.Place.name).all()]}


# ═══════════════════════════════════════════════════════════════════════════════
# WEATHER
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/itineraries/{itinerary_id}/fetch-weather")
async def fetch_weather(
    itinerary_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    itin = db.query(models.Itinerary).filter(models.Itinerary.id == itinerary_id).first()
    if not itin:
        raise HTTPException(404, "Itinerary not found")
    if itin.user_id != user_id:
        raise HTTPException(403, "Not your itinerary")

    updated_days = await fetch_weather_for_itinerary(itin, db)
    db.commit()
    return {"updated": len(updated_days), "days": updated_days}


# ═══════════════════════════════════════════════════════════════════════════════
# GEMINI AI GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/ai/generate-itinerary")
async def ai_generate_itinerary(request: dict):
    destination = request.get("destination", "")
    days        = request.get("days", 3)
    budget      = float(request.get("budget", 0))
    style       = request.get("style", "general")
    return generate_itinerary(destination, days, budget, style)