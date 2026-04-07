"""
recommendations/collaborative.py
──────────────────────────────────────────────────────────────────────────────
Collaborative Filtering Recommendation Engine
──────────────────────────────────────────────────────────────────────────────
Finds users who have similar travel preferences to the requesting user,
then recommends itineraries those similar users created or interacted with.

Interaction signals (implicit feedback — no explicit ratings needed):
  • Created an itinerary          → weight 3.0  (strongest signal)
  • Forked an itinerary           → weight 2.5  (liked it enough to copy)
  • Shared a post about it        → weight 2.0  (shared it publicly)
  • Upvoted a community post      → weight 1.5  (expressed approval)
  • Viewed an itinerary (>0 views)→ weight 1.0  (passive interest)

Friend boost:
  Itineraries created by friends of the requesting user receive a +15%
  score boost, rewarding the social graph signal from your proposal.

Sparsity fallback:
  If the user has fewer than MIN_INTERACTIONS interactions, or the
  resulting cosine similarity matrix is too sparse, the function returns
  an empty list — the router will then fall back to rule_based.
"""

from __future__ import annotations
import logging
import math
from collections import defaultdict
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

import models

logger = logging.getLogger(__name__)

# ── Tuning constants ───────────────────────────────────────────────────────────
MIN_INTERACTIONS      = 3    # user needs at least this many interactions for CF
MIN_SIMILAR_USERS     = 2    # need at least this many similar users for a result
SIMILARITY_THRESHOLD  = 0.10 # cosine similarity must exceed this to count
FRIEND_BOOST          = 1.15 # multiply score by this for friends' itineraries
MAX_CANDIDATE_USERS   = 200  # cap to avoid O(n²) on large datasets

# Interaction weights
WEIGHTS = {
    "created": 3.0,
    "forked":  2.5,
    "shared":  2.0,
    "upvoted": 1.5,
    "viewed":  1.0,
}


# ═══════════════════════════════════════════════════════════════════════════════
#  PUBLIC API
# ═══════════════════════════════════════════════════════════════════════════════

def get_collaborative_recommendations(
    db: Session,
    user_id: int,
    limit: int = 8,
) -> list[dict]:
    """
    Generate personalised recommendations for `user_id` using collaborative
    filtering on implicit feedback signals.

    Returns an empty list when there is insufficient data — the router
    should fall back to rule_based in that case.

    Args:
        db      : SQLAlchemy session
        user_id : the requesting user
        limit   : max results to return

    Returns:
        List of recommendation dicts sorted by collaborative score, or []
        if there is insufficient interaction data.
    """
    # ── Step 1: Build the user–itinerary interaction matrix ───────────────────
    user_vector, all_users_matrix = _build_interaction_matrix(db, user_id)

    if sum(user_vector.values()) < MIN_INTERACTIONS:
        logger.debug(f"CF: user {user_id} has insufficient interactions, falling back")
        return []

    # ── Step 2: Find friends (for the social boost) ───────────────────────────
    friend_ids = _get_friend_ids(db, user_id)

    # ── Step 3: Compute cosine similarity with every other user ───────────────
    similarities = _compute_similarities(user_vector, all_users_matrix, user_id)

    if len(similarities) < MIN_SIMILAR_USERS:
        logger.debug(f"CF: not enough similar users for {user_id}, falling back")
        return []

    # ── Step 4: Aggregate weighted scores for candidate itineraries ───────────
    already_seen = set(user_vector.keys())
    itinerary_scores: dict[int, float] = defaultdict(float)

    for other_user_id, sim in similarities.items():
        if sim < SIMILARITY_THRESHOLD:
            continue
        for itin_id, interaction_weight in all_users_matrix[other_user_id].items():
            if itin_id in already_seen:
                continue   # don't recommend what the user already knows about
            weighted = sim * interaction_weight
            # Friend boost
            if other_user_id in friend_ids:
                weighted *= FRIEND_BOOST
            itinerary_scores[itin_id] += weighted

    if not itinerary_scores:
        return []

    # ── Step 5: Fetch, filter, and format results ─────────────────────────────
    top_ids = sorted(itinerary_scores, key=itinerary_scores.get, reverse=True)

    results = []
    for itin_id in top_ids:
        itin = db.query(models.Itinerary).filter(
            models.Itinerary.id == itin_id,
            models.Itinerary.is_public == True,
        ).first()

        if not itin:
            continue

        results.append(_format_result(
            itin,
            score=round(itinerary_scores[itin_id], 4),
            is_friend=itin.user_id in friend_ids,
        ))

        if len(results) >= limit:
            break

    return results


# ═══════════════════════════════════════════════════════════════════════════════
#  INTERNAL HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _build_interaction_matrix(
    db: Session,
    target_user_id: int,
) -> tuple[dict[int, float], dict[int, dict[int, float]]]:
    """
    Build implicit feedback interaction vectors for all users.

    Returns:
        target_vector : {itinerary_id: weight} for the requesting user
        all_matrix    : {user_id: {itinerary_id: weight}} for all other users
    """
    all_matrix: dict[int, dict[int, float]] = defaultdict(lambda: defaultdict(float))

    # Signal 1: Created (own itineraries)
    itineraries = db.query(models.Itinerary).filter(
        models.Itinerary.is_public == True
    ).limit(5000).all()

    for itin in itineraries:
        all_matrix[itin.user_id][itin.id] += WEIGHTS["created"]
        # View signal — normalised by a soft cap
        if itin.view_count and itin.view_count > 0:
            view_weight = WEIGHTS["viewed"] * min(math.log1p(itin.view_count) / 6.0, 1.0)
            all_matrix[itin.user_id][itin.id] += view_weight

    # Signal 2: Forked
    forked = db.query(models.Itinerary).filter(
        models.Itinerary.forked_from != None
    ).all()
    for itin in forked:
        if itin.forked_from:
            all_matrix[itin.user_id][itin.forked_from] += WEIGHTS["forked"]

    # Signal 3: Shared as community post
    posts_with_itin = db.query(models.CommunityPost).filter(
        models.CommunityPost.shared_itinerary_id != None
    ).all()
    for post in posts_with_itin:
        if post.shared_itinerary_id:
            all_matrix[post.user_id][post.shared_itinerary_id] += WEIGHTS["shared"]

    # Signal 4: Upvoted a post that links to an itinerary
    upvotes = db.query(models.PostVote).filter(
        models.PostVote.direction == "up"
    ).all()
    # Build a lookup: post_id → shared_itinerary_id
    post_itin_map: dict[int, int] = {
        p.id: p.shared_itinerary_id
        for p in posts_with_itin
        if p.shared_itinerary_id
    }
    for vote in upvotes:
        if vote.post_id in post_itin_map:
            all_matrix[vote.user_id][post_itin_map[vote.post_id]] += WEIGHTS["upvoted"]

    # Extract the target user's vector, convert defaultdicts to plain dicts
    target_vector = dict(all_matrix.get(target_user_id, {}))
    plain_matrix  = {uid: dict(vec) for uid, vec in all_matrix.items()
                     if uid != target_user_id}

    return target_vector, plain_matrix


def _cosine_similarity(vec_a: dict[int, float], vec_b: dict[int, float]) -> float:
    """Compute cosine similarity between two sparse interaction vectors."""
    common_keys = set(vec_a.keys()) & set(vec_b.keys())
    if not common_keys:
        return 0.0

    dot = sum(vec_a[k] * vec_b[k] for k in common_keys)
    mag_a = math.sqrt(sum(v * v for v in vec_a.values()))
    mag_b = math.sqrt(sum(v * v for v in vec_b.values()))

    if mag_a == 0 or mag_b == 0:
        return 0.0

    return dot / (mag_a * mag_b)


def _compute_similarities(
    target_vector: dict[int, float],
    all_matrix: dict[int, dict[int, float]],
    target_user_id: int,
) -> dict[int, float]:
    """
    Compute cosine similarity between the target user and all others.
    Returns {other_user_id: similarity} sorted by similarity descending,
    capped at MAX_CANDIDATE_USERS for performance.
    """
    similarities: dict[int, float] = {}

    for other_uid, other_vec in all_matrix.items():
        if other_uid == target_user_id:
            continue
        sim = _cosine_similarity(target_vector, other_vec)
        if sim > 0:
            similarities[other_uid] = sim

    # Keep only the top-N most similar users
    top = sorted(similarities, key=similarities.get, reverse=True)
    return {uid: similarities[uid] for uid in top[:MAX_CANDIDATE_USERS]}


def _get_friend_ids(db: Session, user_id: int) -> set[int]:
    """Return the set of accepted friend user IDs for the given user."""
    friendships = db.query(models.Friendship).filter(
        or_(
            models.Friendship.requester_id == user_id,
            models.Friendship.receiver_id  == user_id,
        ),
        models.Friendship.status == "accepted",
    ).all()

    friend_ids: set[int] = set()
    for f in friendships:
        fid = f.receiver_id if f.requester_id == user_id else f.requester_id
        friend_ids.add(fid)
    return friend_ids


def _format_result(
    itin: models.Itinerary,
    score: float,
    is_friend: bool,
    db=None,
) -> dict:
    """Serialize an itinerary ORM object into a recommendation response dict."""
    from routers.itineraries import _pick_cover_photo
    days_count       = len(itin.days or [])
    activities_count = sum(len(d.activities or []) for d in (itin.days or []))
    cover_photo      = _pick_cover_photo(db, itin) if db else None

    activity_types: set[str] = set()
    for day in (itin.days or []):
        for act in (day.activities or []):
            if act.activity_type:
                activity_types.add(act.activity_type)

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
        "activity_types":    list(activity_types),
        "owner_username":    itin.owner.username if itin.owner else None,
        "owner_avatar_id":   itin.owner.avatar_id if itin.owner else 1,
        "similarity_score":  score,
        "cover_photo":       cover_photo,
        "from_friend":       is_friend,
        "recommendation_source": "collaborative",
    }