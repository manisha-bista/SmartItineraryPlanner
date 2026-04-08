"""
recommendations/router.py
──────────────────────────────────────────────────────────────────────────────
FastAPI router that exposes the recommendation engines as REST endpoints.

Endpoints:
  GET /recommendations/similar/{itinerary_id}
      "Show Similar Itineraries" — rule-based, no auth needed.

  GET /recommendations/for-user/{user_id}
      Personalised feed — tries collaborative first, falls back to rule-based.

  GET /recommendations/explore
      Discovery endpoint — rule-based with optional filters, no auth needed.
      Used for the homepage explore section.

Hybrid strategy:
  1. Try collaborative filtering first (personalised, needs interaction data).
  2. If CF returns too few results (< MIN_CF_RESULTS), fill the remaining
     slots with rule-based results, de-duping by itinerary ID.
  3. Label each result with recommendation_source so the frontend can show
     "Because users like you liked this" vs "Similar to your trip".
──────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from recommendations.rule_based import (
    get_similar_itineraries,
    get_recommendations_for_new_user,
)
from recommendations.collaborative import get_collaborative_recommendations

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

# How many CF results we require before we stop supplementing with rule-based
MIN_CF_RESULTS = 4


# ── 1. Similar itineraries ────────────────────────────────────────────────────
@router.get("/similar/{itinerary_id}")
def similar_itineraries(
    itinerary_id: int,
    limit: int       = Query(6, ge=1, le=20),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Find itineraries similar to the given one (rule-based).
    Powers the "Show Similar Itineraries" button on the detail page.

    Query params:
      limit   — max results (default 6)
      user_id — optionally exclude the requesting user's own itineraries
    """
    try:
        results = get_similar_itineraries(
            db=db,
            reference_id=itinerary_id,
            limit=limit,
            exclude_user_id=user_id,
        )
        return {
            "itinerary_id": itinerary_id,
            "count":        len(results),
            "results":      results,
            "strategy":     "rule_based",
        }
    except Exception as e:
        logger.error(f"similar_itineraries error: {e}")
        raise HTTPException(500, "Failed to fetch similar itineraries")


# ── 2. Personalised recommendations for a user ────────────────────────────────
@router.get("/for-user/{user_id}")
def recommendations_for_user(
    user_id: int,
    limit: int               = Query(8, ge=1, le=20),
    destination: Optional[str] = Query(None),
    budget: Optional[float]    = Query(None),
    duration_days: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Personalised recommendations using a hybrid strategy:
      • Collaborative filtering first (uses the user's own interaction history)
      • Falls back to / supplements with rule-based if CF is insufficient

    Query params:
      limit         — max results (default 8)
      destination   — optional destination hint for rule-based fallback
      budget        — optional budget hint for rule-based fallback
      duration_days — optional trip length hint for rule-based fallback
    """
    try:
        results: list[dict] = []
        strategy = "rule_based"

        # ── Attempt collaborative filtering ───────────────────────────────────
        cf_results = get_collaborative_recommendations(
            db=db,
            user_id=user_id,
            limit=limit,
        )

        if cf_results:
            results  = cf_results
            strategy = "collaborative"

        # ── Supplement with rule-based if CF gave too few ─────────────────────
        if len(results) < MIN_CF_RESULTS:
            already_ids = {r["id"] for r in results}
            remaining   = limit - len(results)

            rb_results = get_recommendations_for_new_user(
                db=db,
                destination=destination,
                budget=budget,
                duration_days=duration_days,
                limit=remaining + 5,   # fetch a few extra to account for dedup
                exclude_user_id=user_id,
            )

            for rb in rb_results:
                if rb["id"] not in already_ids:
                    results.append(rb)
                    already_ids.add(rb["id"])
                if len(results) >= limit:
                    break

            if cf_results:
                strategy = "hybrid"
            # else strategy stays "rule_based"

        return {
            "user_id":  user_id,
            "count":    len(results),
            "results":  results[:limit],
            "strategy": strategy,
        }

    except Exception as e:
        logger.error(f"recommendations_for_user error: {e}")
        raise HTTPException(500, "Failed to fetch recommendations")


# ── 3. Explore / discovery ───────────────────────────────────────────────────
@router.get("/explore")
def explore(
    destination: Optional[str]      = Query(None),
    budget: Optional[float]         = Query(None),
    duration_days: Optional[int]    = Query(None),
    activity_types: Optional[str]   = Query(None,
        description="Comma-separated activity types, e.g. 'adventure,dining'"),
    limit: int                       = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """
    Rule-based discovery — no authentication required.
    Used for the public explore / homepage sections.

    Query params:
      destination     — filter by city/destination
      budget          — NPR budget
      duration_days   — trip length in days
      activity_types  — comma-separated preferred activity types
      limit           — max results
    """
    try:
        prefs = [a.strip() for a in activity_types.split(",")] if activity_types else []

        results = get_recommendations_for_new_user(
            db=db,
            destination=destination,
            budget=budget,
            duration_days=duration_days,
            activity_preferences=prefs,
            limit=limit,
        )
        return {
            "count":    len(results),
            "results":  results,
            "strategy": "rule_based",
            "filters": {
                "destination":    destination,
                "budget":         budget,
                "duration_days":  duration_days,
                "activity_types": prefs or None,
            },
        }
    except Exception as e:
        logger.error(f"explore error: {e}")
        raise HTTPException(500, "Failed to fetch explore results")