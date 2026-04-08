"""
seed_places.py
──────────────────────────────────────────────────────────────────────────────
Populates the Places cache and back-fills Activity.place_id /
Activity.photo_reference for all seed itinerary activities.

How it works:
  1. Read every Activity row that has a location name but no place_id.
  2. Call your own running backend's /places/search endpoint for each location
     (this triggers Google Places API → caches the result in the Place table).
  3. If a match is found, write place_id, photo_reference, latitude, longitude
     back onto the Activity row.

Requirements:
  • Backend must be running at http://127.0.0.1:8000
  • GOOGLE_PLACES_API_KEY must be set in your backend .env
  • Run from the backend/ folder: python seed_places.py

The script is idempotent — activities that already have a place_id are skipped.
"""

import sys, os, time
from typing import Optional
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database import SessionLocal
from models import Activity, ItineraryDay, Itinerary, Place

BASE_URL = "http://127.0.0.1:8000"

# Mapping of rough location name → city hint, so the search is biased correctly
# Detected from the location + formatted_address on each activity

# Real Nepal municipalities — Thamel/Boudha are Kathmandu neighbourhoods, not cities
KNOWN_CITIES = [
    "Kathmandu", "Pokhara", "Lalitpur", "Bhaktapur", "Bharatpur",
    "Lumbini", "Namche", "Lukla", "Jomsom", "Manang",
    "Lo Manthang", "Nagarkot", "Dhulikhel", "Bandipur", "Tansen",
    "Gorkha", "Janakpur", "Kirtipur", "Dharan", "Biratnagar",
    "Butwal", "Hetauda", "Itahari", "Nepalgunj", "Birendranagar",
    "Dhangadhi", "Siddharthanagar", "Panauti", "Ilam", "Dhankuta",
    "Phaplu", "Salleri", "Okhaldhunga", "Khandbari", "Tumlingtar",
    "Charikot", "Jiri", "Besisahar", "Chame", "Kagbeni",
    "Syabrubesi", "Dhunche", "Ghandruk", "Ghorepani", "Tatopani",
    "Beni", "Baglung", "Jumla", "Simikot", "Dunai",
    "Taplejung", "Damauli", "Sauraha", "Thakurdwara", "Kakani",
    "Daman",
    # Mountain regions
    "Annapurna",
]

SUBAREA_MAP = {
    # Kathmandu
    "Thamel": "Kathmandu", "Boudha": "Kathmandu", "Bouddha": "Kathmandu",
    "Swayambhu": "Kathmandu", "Swayambhunath": "Kathmandu", "Asan": "Kathmandu",
    "Pashupatinath": "Kathmandu", "Durbar Marg": "Kathmandu", "Naxal": "Kathmandu",
    "Basantapur": "Kathmandu", "Baneshwor": "Kathmandu", "Koteshwor": "Kathmandu",
    "Maharajgunj": "Kathmandu", "Baluwatar": "Kathmandu", "Chabahil": "Kathmandu",
    "Gaushala": "Kathmandu", "Sinamangal": "Kathmandu", "Kalimati": "Kathmandu",
    "Teku": "Kathmandu", "Tripureshwor": "Kathmandu", "Lazimpat": "Kathmandu",
    "Thapathali": "Kathmandu", "Putalisadak": "Kathmandu", "Kamaladi": "Kathmandu",
    "Gyaneshwor": "Kathmandu", "Maitidevi": "Kathmandu", "Dillibazar": "Kathmandu",
    "Anamnagar": "Kathmandu", "Kuleshwor": "Kathmandu", "Bafal": "Kathmandu",
    "Sitapaila": "Kathmandu", "Samakhusi": "Kathmandu", "Gongabu": "Kathmandu",
    "Tokha": "Kathmandu", "Budhanilkantha": "Kathmandu", "Kapan": "Kathmandu",
    "Gokarna": "Kathmandu", "Sundarijal": "Kathmandu", "Dakshinkali": "Kathmandu",
    "Chobhar": "Kathmandu", "Chandragiri": "Kathmandu", "New Road": "Kathmandu",
    "Indrachowk": "Kathmandu", "Jamal": "Kathmandu", "Makhan": "Kathmandu",
    "Tahachal": "Kathmandu",
    # Lalitpur
    "Patan": "Lalitpur", "Jawalakhel": "Lalitpur", "Jhamsikhel": "Lalitpur",
    "Godawari": "Lalitpur",
    # Bhaktapur
    "Thimi": "Bhaktapur", "Suryabinayak": "Bhaktapur", "Sallaghari": "Bhaktapur",
    "Kamalbinayak": "Bhaktapur", "Dattatreya": "Bhaktapur", "Taumadhi": "Bhaktapur",
    "Pottery Square": "Bhaktapur", "Byasi": "Bhaktapur", "Chyamasingh": "Bhaktapur",
    "Bageshwori": "Bhaktapur", "Changunarayan": "Bhaktapur", "Bode": "Bhaktapur",
    "Nagdesh": "Bhaktapur", "Katunje": "Bhaktapur", "Balkot": "Bhaktapur",
    "Sirutar": "Bhaktapur", "Dadhikot": "Bhaktapur",
    # Pokhara
    "Lakeside": "Pokhara", "Sarangkot": "Pokhara", "Phewa": "Pokhara",
    "Begnas": "Pokhara", "Mahendrapul": "Pokhara", "Chipledhunga": "Pokhara",
    "Prithvichowk": "Pokhara", "Srijanachowk": "Pokhara", "Parsyang": "Pokhara",
    "Bagar": "Pokhara", "Amarsingh Chowk": "Pokhara", "Ram Bazaar": "Pokhara",
    "Matepani": "Pokhara", "Kahun Danda": "Pokhara", "Pumdikot": "Pokhara",
    "Shanti Stupa": "Pokhara", "Hemja": "Pokhara", "Lamachaur": "Pokhara",
    "Batulechaur": "Pokhara", "Pardi": "Pokhara", "Birauta": "Pokhara",
    "Chhorepatan": "Pokhara", "Rupakot": "Pokhara", "Majhikuna": "Pokhara",
    "Khapaudi": "Pokhara", "Pame": "Pokhara",
    # Other cities
    "Narayangarh": "Bharatpur", "Devghat": "Bharatpur",
    "Maya Devi": "Lumbini", "Monastic Zone": "Lumbini",
    "Khumjung": "Namche", "Tengboche": "Namche",
    "Gorkha Durbar": "Gorkha",
    "Janaki Mandir": "Janakpur",
    "Bhedetar": "Dharan", "Pindeshwor": "Dharan",
    "Kanyam": "Ilam", "Fikkal": "Ilam",
    "Tundikhel": "Bandipur",
    "Shreenagar": "Tansen", "Rani Mahal": "Tansen",
    "Muktinath": "Kagbeni",
    # Annapurna region
    "Annapurna Base Camp": "Annapurna", "ABC": "Annapurna",
    "Annapurna Circuit": "Annapurna", "Poon Hill": "Annapurna",
    "Tadapani": "Annapurna", "Chomrong": "Annapurna",
    "Sinuwa": "Annapurna", "Bamboo": "Annapurna",
    "Dovan": "Annapurna", "Machapuchare Base Camp": "Annapurna",
    "MBC": "Annapurna",
}


def _detect_city(location: str, address: str) -> Optional[str]:
    combined = f"{location} {address}"
    # Check sub-areas first (more specific match)
    for subarea, parent in SUBAREA_MAP.items():
        if subarea.lower() in combined.lower():
            return parent
    # Fall back to direct city name
    for city in KNOWN_CITIES:
        if city.lower() in combined.lower():
            return city
    return None


def search_place(query: str, city=None):
    """Call the backend /places/search endpoint and return the top result."""
    params = {"query": query}
    if city:
        params["city"] = city
    try:
        res = requests.get(f"{BASE_URL}/places/search", params=params, timeout=15)
        if res.status_code == 200:
            results = res.json().get("results", [])
            return results[0] if results else None
    except Exception as e:
        print(f"    ⚠  Request error: {e}")
    return None


def main():
    db = SessionLocal()
    try:
        print("\n" + "═" * 60)
        print("  SMART ITINERARY PLANNER — PLACE CACHE SEEDER")
        print("═" * 60)

        # Check backend is running
        try:
            requests.get(f"{BASE_URL}/health", timeout=3)
        except Exception:
            print("\n❌  Backend is not running at http://127.0.0.1:8000")
            print("    Start it first with: uvicorn main:app --reload")
            return

        # Fetch all activities without a place_id
        activities = (
            db.query(Activity)
            .filter(Activity.location.isnot(None))
            .filter(Activity.place_id.is_(None))
            .all()
        )

        print(f"\nFound {len(activities)} activities without a place_id\n")

        matched = 0
        skipped = 0
        failed  = 0

        seen_queries: dict[str, dict | None] = {}  # cache per-location

        for i, act in enumerate(activities, 1):
            location = (act.location or "").strip()
            address  = (act.formatted_address or "").strip()

            if not location:
                skipped += 1
                continue

            city = _detect_city(location, address)

            # Deduplicate: same location name → reuse cached API result
            cache_key = f"{location.lower()}|{city or ''}"
            if cache_key in seen_queries:
                place_data = seen_queries[cache_key]
            else:
                print(f"  [{i}/{len(activities)}] Searching: {location!r}"
                      + (f" (city={city})" if city else ""))
                place_data = search_place(location, city)
                seen_queries[cache_key] = place_data
                # Respect rate limits — 200ms between unique API calls
                time.sleep(0.2)

            if place_data:
                act.place_id          = place_data.get("google_place_id")
                act.photo_reference   = place_data.get("photo_reference")
                # Only update coords if activity didn't already have them
                if not act.latitude and place_data.get("latitude"):
                    act.latitude  = place_data["latitude"]
                    act.longitude = place_data["longitude"]
                db.commit()
                matched += 1
                status = "✓" if act.photo_reference else "✓ (no photo)"
                print(f"    {status}  → {place_data.get('name', location)}")
            else:
                failed += 1
                print(f"    ✗  No result for {location!r}")

        print("\n" + "═" * 60)
        print(f"  Done!  Matched: {matched}  |  No result: {failed}  |  Skipped: {skipped}")
        print("═" * 60 + "\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌  Error: {e}")
        import traceback; traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()