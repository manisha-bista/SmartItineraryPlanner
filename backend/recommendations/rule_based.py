"""
recommendations/rule_based.py
──────────────────────────────────────────────────────────────────────────────
Rule-Based Recommendation Engine
──────────────────────────────────────────────────────────────────────────────
Solves the cold-start problem: works with zero user history.
Scores every public itinerary against a request using explicit, interpretable
rules derived from the itinerary's own structured data.

Scoring breakdown (100 points total):
  30 pts  — destination match
  25 pts  — budget compatibility
  20 pts  — duration similarity
  15 pts  — activity-type overlap
  10 pts  — popularity (view_count + like_count normalised)

Used for:
  • "Show Similar Itineraries" on the itinerary detail page
  • New-user homepage recommendations (no interaction history yet)
  • Fallback when collaborative filtering has insufficient data
"""

from __future__ import annotations
import logging
import math
from typing import Optional

from sqlalchemy.orm import Session

import models

logger = logging.getLogger(__name__)

# ── Constants ──────────────────────────────────────────────────────────────────
_BUDGET_TOLERANCE   = 0.40   # ±40 % of reference budget still scores points
_MIN_POPULAR_VIEWS  = 500    # views above this are considered "very popular"
_MIN_POPULAR_LIKES  = 50     # likes above this are considered "very popular"

# Activity types the UI supports
ACTIVITY_TYPES = {
    "destination", "sightseeing", "dining", "cultural",
    "adventure", "transport", "shopping", "leisure",
}


# ═══════════════════════════════════════════════════════════════════════════════
#  PUBLIC API
# ═══════════════════════════════════════════════════════════════════════════════

def get_similar_itineraries(
    db: Session,
    reference_id: int,
    limit: int = 6,
    exclude_user_id: Optional[int] = None,
) -> list[dict]:
    """
    Find itineraries similar to `reference_id`.
    Called by the "Show Similar Itineraries" button on the detail page.

    Args:
        db              : SQLAlchemy session
        reference_id    : ID of the itinerary to find matches for
        limit           : max results to return
        exclude_user_id : optionally hide the requesting user's own itineraries

    Returns:
        List of scored itinerary dicts, sorted best-first.
    """
    reference = db.query(models.Itinerary).filter(
        models.Itinerary.id == reference_id
    ).first()

    if not reference:
        return []

    # Build the feature vector for the reference itinerary
    ref_features = _extract_features(reference)

    candidates = _get_public_candidates(db, exclude_ids={reference_id})
    if exclude_user_id:
        candidates = [c for c in candidates if c.user_id != exclude_user_id]

    return _score_and_rank(candidates, ref_features, limit, db=db)


def get_recommendations_for_new_user(
    db: Session,
    destination: Optional[str] = None,
    budget: Optional[float] = None,
    duration_days: Optional[int] = None,
    activity_preferences: Optional[list[str]] = None,
    limit: int = 8,
    exclude_user_id: Optional[int] = None,
) -> list[dict]:
    """
    Generate recommendations without any interaction history.
    Used for new users or as a fallback when collaborative data is sparse.

    Args:
        db                    : SQLAlchemy session
        destination           : city/destination filter (e.g. "Pokhara")
        budget                : user's estimated budget in NPR
        duration_days         : how many days the user wants to travel
        activity_preferences  : list of activity_type strings the user likes
        limit                 : max results to return
        exclude_user_id       : hide the requesting user's own itineraries

    Returns:
        List of scored itinerary dicts, sorted best-first.
    """
    # Build a synthetic feature vector from the user's preferences
    ref_features = {
        "destination":   destination or "",
        "budget":        budget or 0.0,
        "duration_days": duration_days or 3,
        "activity_types": set(activity_preferences or []),
        "tags":          set(),
    }

    candidates = _get_public_candidates(db)
    if exclude_user_id:
        candidates = [c for c in candidates if c.user_id != exclude_user_id]

    return _score_and_rank(candidates, ref_features, limit, db=db)


# ═══════════════════════════════════════════════════════════════════════════════
#  INTERNAL HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _get_public_candidates(
    db: Session,
    exclude_ids: set[int] | None = None,
) -> list[models.Itinerary]:
    """Fetch all public completed/planning itineraries."""
    q = db.query(models.Itinerary).filter(
        models.Itinerary.is_public == True,
        models.Itinerary.status.in_(["completed", "planning", "confirmed"]),
    )
    itineraries = q.all()
    if exclude_ids:
        itineraries = [i for i in itineraries if i.id not in exclude_ids]
    return itineraries


def _extract_features(itin: models.Itinerary) -> dict:
    """
    Pull the scoring-relevant features out of an ORM itinerary object.
    Aggregates activity types from all days/activities.
    """
    duration_days = 0
    if itin.start_date and itin.end_date:
        duration_days = (itin.end_date - itin.start_date).days + 1

    activity_types: set[str] = set()
    for day in (itin.days or []):
        for act in (day.activities or []):
            if act.activity_type and act.activity_type in ACTIVITY_TYPES:
                activity_types.add(act.activity_type)

    tags = {t.tag.lower() for t in (itin.tags or [])}

    return {
        "destination":   (itin.destination or "").lower(),
        "budget":        itin.estimated_budget or 0.0,
        "duration_days": duration_days,
        "activity_types": activity_types,
        "tags":          tags,
        "view_count":    itin.view_count or 0,
        "like_count":    itin.like_count or 0,
    }


def _score_and_rank(
    candidates: list[models.Itinerary],
    ref_features: dict,
    limit: int,
    db=None,
) -> list[dict]:
    """Score every candidate against the reference features, return top-N."""
    scored = []
    for itin in candidates:
        f = _extract_features(itin)
        score = _compute_score(ref_features, f)
        if score > 0:
            scored.append((score, itin, f))

    # Sort by score descending, break ties by like_count
    scored.sort(key=lambda x: (x[0], x[2].get("like_count", 0)), reverse=True)

    results = []
    for score, itin, f in scored[:limit]:
        results.append(_format_result(itin, score, f, db=db))
    return results


def _compute_score(ref: dict, candidate: dict) -> float:
    """
    Compute a 0–100 similarity score between reference and candidate features.

    Weights:
      30  destination match
      25  budget compatibility
      20  duration similarity
      15  activity-type overlap
      10  popularity
    """
    score = 0.0

    # ── 1. Destination (30 pts) ───────────────────────────────────────────────
    ref_dest  = ref.get("destination", "").lower()
    cand_dest = candidate.get("destination", "").lower()

    if ref_dest and cand_dest:
        if ref_dest == cand_dest:
            score += 30.0
        else:
            # Partial match: one destination is a substring of the other
            # e.g. "Kathmandu" matches "Kathmandu, Bhaktapur"
            ref_cities  = {c.strip() for c in ref_dest.split(",")}
            cand_cities = {c.strip() for c in cand_dest.split(",")}
            overlap     = ref_cities & cand_cities
            if overlap:
                score += 30.0 * (len(overlap) / max(len(ref_cities), len(cand_cities)))
    elif not ref_dest:
        # No destination filter — give partial credit so results still appear
        score += 10.0

    # ── 2. Budget (25 pts) ────────────────────────────────────────────────────
    ref_budget  = ref.get("budget", 0.0)
    cand_budget = candidate.get("budget", 0.0)

    if ref_budget > 0 and cand_budget > 0:
        ratio = min(ref_budget, cand_budget) / max(ref_budget, cand_budget)
        if ratio >= (1 - _BUDGET_TOLERANCE):
            # Within tolerance — linear scale from 0→25 as ratio approaches 1
            score += 25.0 * ratio
        else:
            # Outside tolerance — small consolation points for being in same order of magnitude
            if abs(math.log10(ref_budget + 1) - math.log10(cand_budget + 1)) < 1:
                score += 5.0
    elif ref_budget == 0 or cand_budget == 0:
        score += 8.0   # budget unknown — neutral partial credit

    # ── 3. Duration (20 pts) ─────────────────────────────────────────────────
    ref_days  = ref.get("duration_days", 0)
    cand_days = candidate.get("duration_days", 0)

    if ref_days > 0 and cand_days > 0:
        diff = abs(ref_days - cand_days)
        if diff == 0:
            score += 20.0
        elif diff == 1:
            score += 16.0
        elif diff == 2:
            score += 10.0
        elif diff <= 4:
            score += 5.0
        # else: too different → 0 pts

    # ── 4. Activity-type overlap (15 pts) ─────────────────────────────────────
    ref_types  = ref.get("activity_types", set())
    cand_types = candidate.get("activity_types", set())

    if ref_types and cand_types:
        jaccard = len(ref_types & cand_types) / len(ref_types | cand_types)
        score  += 15.0 * jaccard
    elif not ref_types:
        score += 5.0   # no preference specified — neutral partial credit

    # ── 5. Popularity (10 pts) ────────────────────────────────────────────────
    views = candidate.get("view_count", 0)
    likes = candidate.get("like_count", 0)

    view_score = min(views / _MIN_POPULAR_VIEWS, 1.0) * 5.0
    like_score = min(likes / _MIN_POPULAR_LIKES, 1.0) * 5.0
    score += view_score + like_score

    return round(score, 2)


def _format_result(itin: models.Itinerary, score: float, features: dict, db=None) -> dict:
    """Serialize an itinerary ORM object into a response dict."""
    from routers.itineraries import _pick_cover_photo
    days_count       = len(itin.days or [])
    activities_count = sum(len(d.activities or []) for d in (itin.days or []))
    cover_photo      = _pick_cover_photo(db, itin) if db else None

    return {
        "id":                itin.id,
        "title":             itin.title,
        "destination":       itin.destination,
        "start_date":        itin.start_date.isoformat() if itin.start_date else None,
        "end_date":          itin.end_date.isoformat()   if itin.end_date   else None,
        "estimated_budget":  itin.estimated_budget,
        "currency":          itin.currency,
        "status":            itin.status,
        "view_count":        itin.view_count,
        "like_count":        itin.like_count,
        "days_count":        days_count,
        "activities_count":  activities_count,
        "tags":              [t.tag for t in (itin.tags or [])],
        "activity_types":    list(features["activity_types"]),
        "owner_username":    itin.owner.username if itin.owner else None,
        "owner_avatar_id":   itin.owner.avatar_id if itin.owner else 1,
        "similarity_score":  score,
        "cover_photo":       cover_photo,
        "recommendation_source": "rule_based",
    }