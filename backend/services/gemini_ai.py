"""
services/gemini_ai.py
Gemini AI itinerary generation service.
"""
import os
import re
import json
import logging
from fastapi import HTTPException
from google import genai as google_genai
from google.genai import types

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

SYSTEM_PROMPT = """
You are a Nepal travel itinerary planner AI.
You MUST return ONLY a valid JSON object with NO extra text, no markdown, no explanation,
no ```json fences — just raw JSON.

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
          "title": "string - meaningful activity name",
          "location": "string - specific venue or landmark, NOT just city name",
          "description": "string - 1-2 sentence description",
          "start_time": "HH:MM",
          "activity_type": "one of: destination, sightseeing, dining, cultural, adventure, transport, shopping, leisure",
          "cost": 0,
          "priority": "medium"
        }
      ]
    }
  ]
}

Rules:
- Base itinerary on what the user describes — do NOT default to Kathmandu unless mentioned
- Each activity must have a DIFFERENT, SPECIFIC location (not just the city/village name)
- cost and estimated_cost are numbers in NPR, never strings or currency symbols
- start_time is always 24hr format: "09:00", "14:30"
- Generate exactly 3-4 activities per day
- All fields must be present — never null or missing
- priority is always "medium"
"""


def _extract_json(text: str) -> str:
    """Strip markdown fences and extract the JSON object from model output."""
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fenced:
        return fenced.group(1).strip()
    first, last = text.find("{"), text.rfind("}")
    if first != -1 and last != -1 and last > first:
        return text[first : last + 1]
    return text


def generate_itinerary(destination: str, days: int, budget: float, style: str) -> dict:
    """
    Call Gemini to produce a structured itinerary JSON.
    Raises HTTPException on API or parse failure.
    """
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    if not destination:
        raise HTTPException(status_code=400, detail="Destination is required")

    client = google_genai.Client(api_key=GEMINI_API_KEY)

    user_prompt = f"""
The user has described their ideal trip as follows:
"{destination}"

Generate a {days}-day travel itinerary in Nepal.
- Travel style: {style}
- Total budget: NPR {budget if budget > 0 else "flexible"}
- Number of days: {days}

Instructions:
- Extract specific places, landmarks, and activities from the description.
- Spread activities logically across {days} days.
- Use real, accurate place names in Nepal.
- Make the itinerary feel personalized to the description.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT, temperature=0.7
            ),
            contents=user_prompt,
        )
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    raw_text = response.text.strip()
    clean = _extract_json(raw_text)

    try:
        data = json.loads(clean)
    except json.JSONDecodeError:
        logger.error(f"Gemini returned unparseable JSON:\n{raw_text[:400]}")
        raise HTTPException(
            status_code=500, detail="AI returned invalid JSON. Please try again."
        )

    # normalise defaults
    for day in data.get("days", []):
        day.setdefault("estimated_cost", 0)
        for act in day.get("activities", []):
            act.setdefault("cost", 0)
            act.setdefault("priority", "medium")
            act.setdefault("start_time", "09:00")
            act.setdefault("activity_type", "sightseeing")
            act.setdefault("description", "")

    return data