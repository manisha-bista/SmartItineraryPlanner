"""
services/weather_maps.py
OpenWeatherMap helpers: fetch day-level and activity-level weather for an itinerary.
"""
import os
import logging
from datetime import datetime, date as date_type
from typing import Optional
import httpx
from sqlalchemy.orm import Session
import models

logger = logging.getLogger(__name__)

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
_BASE = "https://api.openweathermap.org/data/2.5"


async def fetch_weather_for_itinerary(itin: models.Itinerary, db: Session) -> list:
    """
    Fetch day-level and per-activity weather for every day in an itinerary.
    Returns a list of dicts summarising what was updated.
    Writes results directly to the ORM objects; caller must db.commit().
    """
    if not OPENWEATHER_API_KEY:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="OpenWeather API key not configured")

    updated_days: list = []

    # ── Day-level weather ──────────────────────────────────────────────────────
    async with httpx.AsyncClient() as client:
        for day in itin.days:
            lat, lon, loc_name = _resolve_day_coords(day, itin)
            if lat is None:
                continue
            try:
                resp = await client.get(
                    f"{_BASE}/weather",
                    params={"lat": lat, "lon": lon, "units": "metric",
                            "appid": OPENWEATHER_API_KEY},
                    timeout=10.0,
                )
                data = resp.json()
                if data.get("main"):
                    day.weather_temp_min   = data["main"].get("temp_min")
                    day.weather_temp_max   = data["main"].get("temp_max")
                    day.weather_condition  = data["weather"][0].get("main")  if data.get("weather") else None
                    day.weather_description= data["weather"][0].get("description") if data.get("weather") else None
                    day.weather_icon       = data["weather"][0].get("icon")  if data.get("weather") else None
                    day.weather_humidity   = data["main"].get("humidity")
                    day.weather_wind_speed = data["wind"].get("speed") if data.get("wind") else None

                day.weather_fetched_at = datetime.utcnow()
                updated_days.append({
                    "day_number": day.day_number,
                    "location": loc_name,
                    "condition": day.weather_condition,
                    "temp": f"{day.weather_temp_min}°–{day.weather_temp_max}°C",
                })
            except Exception as e:
                logger.error(f"Day-level weather error for day {day.day_number}: {e}")

    # ── Activity-level weather ─────────────────────────────────────────────────
    today = date_type.today()
    async with httpx.AsyncClient() as client:
        for day in itin.days:
            day_date = day.date
            if not day_date:
                continue
            for act in day.activities:
                if not act.latitude or not act.longitude:
                    continue
                try:
                    if day_date >= today:
                        resp = await client.get(
                            f"{_BASE}/forecast",
                            params={"lat": act.latitude, "lon": act.longitude,
                                    "units": "metric", "appid": OPENWEATHER_API_KEY},
                            timeout=10.0,
                        )
                        data = resp.json()
                        if data.get("list"):
                            hour = act.start_time.hour if act.start_time else 12
                            target_str = f"{day_date} {str(hour).zfill(2)}:00:00"
                            closest = min(
                                data["list"],
                                key=lambda f: abs(
                                    datetime.strptime(f["dt_txt"], "%Y-%m-%d %H:%M:%S")
                                    - datetime.strptime(target_str, "%Y-%m-%d %H:%M:%S")
                                ),
                            )
                            _write_act_weather(act, closest)
                    else:
                        resp = await client.get(
                            f"{_BASE}/weather",
                            params={"lat": act.latitude, "lon": act.longitude,
                                    "units": "metric", "appid": OPENWEATHER_API_KEY},
                            timeout=10.0,
                        )
                        data = resp.json()
                        if data.get("main"):
                            _write_act_weather(act, data)
                except Exception as e:
                    logger.error(f"Activity weather error act {act.id}: {e}")

    return updated_days


# ── Helpers ────────────────────────────────────────────────────────────────────

def _resolve_day_coords(day, itin) -> tuple:
    """Return (lat, lon, name) for a day, falling back through activities."""
    if day.main_latitude and day.main_longitude:
        return day.main_latitude, day.main_longitude, day.main_location or itin.destination
    for act in day.activities:
        if act.latitude and act.longitude:
            return act.latitude, act.longitude, act.location or act.title
    return None, None, None


def _write_act_weather(act, data: dict) -> None:
    """Write weather fields from an OWM response dict onto an Activity ORM object."""
    main   = data.get("main", {})
    wind   = data.get("wind", {})
    weather= data.get("weather", [{}])
    act.weather_temp        = main.get("temp")
    act.weather_condition   = weather[0].get("main")        if weather else None
    act.weather_description = weather[0].get("description") if weather else None
    act.weather_icon        = weather[0].get("icon")        if weather else None
    act.weather_humidity    = main.get("humidity")
    act.weather_wind_speed  = wind.get("speed")