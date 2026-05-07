"""
routers/subscriptions.py
Subscription management with real Khalti payment gateway integration.

Payment flow:
  1. POST /subscriptions/khalti/initiate  → calls Khalti API, returns payment_url
  2. User pays on Khalti's hosted page
  3. Khalti redirects to /payment/return?pidx=...
  4. POST /subscriptions/khalti/verify    → verifies with Khalti, auto-activates Premium

Cancellation:
  - User keeps Premium access until premium_until expires (no immediate downgrade).
  - subscription_canceled_at is set; subscription_tier stays "premium" until the date.
"""
import os
import logging
import secrets
import httpx
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import models
from database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

# ── Khalti gateway config ─────────────────────────────────────────────────────
KHALTI_SECRET_KEY = os.getenv("Khalti_Secret_Key", "")
KHALTI_BASE_URL   = "https://a.khalti.com/api/v2"
FRONTEND_URL      = os.getenv("FRONTEND_URL", "http://localhost:5173")

# ── Plan config ───────────────────────────────────────────────────────────────
PLAN_DURATIONS = {
    "monthly":   30,
    "trip_pass": 7,
    "yearly":    365,
}

PLAN_LABELS = {
    "monthly":   "Monthly (NPR 299)",
    "trip_pass": "Trip Pass — 7 days (NPR 199)",
    "yearly":    "Annual (NPR 1,999)",
}

PLAN_PRICES = {          # NPR
    "monthly":   299.0,
    "trip_pass": 199.0,
    "yearly":    1999.0,
}

PLAN_PRICES_PAISA = {    # Khalti requires paisa (NPR × 100)
    "monthly":   29900,
    "trip_pass": 19900,
    "yearly":    199900,
}

PLAN_NAMES = {
    "monthly":   "Smart Itinerary Premium — Monthly",
    "trip_pass": "Smart Itinerary Premium — Trip Pass (7 Days)",
    "yearly":    "Smart Itinerary Premium — Annual",
}

# ── AI generation quota ───────────────────────────────────────────────────────
AI_LIMIT_FREE          = 2
AI_LIMIT_PREMIUM       = 15
AI_PERIOD_FREE_DAYS    = 7
AI_PERIOD_PREMIUM_DAYS = 30


def _quota_settings(user: models.User) -> tuple[int, int, str]:
    if user.subscription_tier == "premium":
        return (AI_LIMIT_PREMIUM, AI_PERIOD_PREMIUM_DAYS, "month")
    return (AI_LIMIT_FREE, AI_PERIOD_FREE_DAYS, "week")


def consume_ai_credit(user: models.User, db: Session) -> tuple[int, int]:
    """
    Reserve one AI generation for the user.
    Admins bypass quota; raises HTTP 429 if limit exceeded.
    Returns (used, limit).
    """
    if user.role == "admin":
        return (0, -1)

    limit, period_days, period_label = _quota_settings(user)
    now = datetime.utcnow()

    if not user.ai_reset_date or (now - user.ai_reset_date) >= timedelta(days=period_days):
        user.ai_generations_month = 0
        user.ai_reset_date = now

    if (user.ai_generations_month or 0) >= limit:
        next_reset = user.ai_reset_date + timedelta(days=period_days)
        raise HTTPException(
            429,
            f"AI generation limit reached ({limit} per {period_label}). "
            f"Resets on {next_reset.strftime('%d %b %Y')}.",
        )

    user.ai_generations_month = (user.ai_generations_month or 0) + 1
    db.commit()
    return (user.ai_generations_month, limit)


def _require_admin(admin_id: int, db: Session) -> models.User:
    user = db.query(models.User).filter(models.User.id == admin_id).first()
    if not user or user.role != "admin":
        raise HTTPException(403, "Admin access required")
    return user


# ═══════════════════════════════════════════════════════════════════════════════
#  KHALTI PAYMENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/khalti/initiate")
async def khalti_initiate(payload: dict, db: Session = Depends(get_db)):
    """
    Step 1: Initiate a Khalti e-payment.

    Backend calls Khalti's initiate API and returns the payment_url for the
    frontend to redirect the user to. The pidx (Khalti's payment identifier)
    is stored so we can verify it later.

    Body: { "user_id": int, "plan": "monthly"|"trip_pass"|"yearly" }
    Returns: { "payment_url": str, "pidx": str, "amount": float }
    """
    user_id = payload.get("user_id")
    plan    = payload.get("plan", "monthly")

    if not user_id:
        raise HTTPException(400, "user_id is required")
    if plan not in PLAN_DURATIONS:
        raise HTTPException(400, f"Unknown plan '{plan}'")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.subscription_tier == "premium" and not user.subscription_canceled_at:
        raise HTTPException(400, "User already has an active Premium subscription")

    if not KHALTI_SECRET_KEY:
        raise HTTPException(500, "Khalti payment gateway is not configured")

    order_id = f"SIP_u{user_id}_{plan}_{secrets.token_hex(4).upper()}"

    khalti_payload = {
        "return_url":           f"{FRONTEND_URL}/payment/return",
        "website_url":          FRONTEND_URL,
        "amount":               PLAN_PRICES_PAISA[plan],
        "purchase_order_id":    order_id,
        "purchase_order_name":  PLAN_NAMES[plan],
        "customer_info": {
            "name":  user.name,
            "email": user.email,
        },
        "product_details": [
            {
                "identity":    f"{plan}_subscription",
                "name":        PLAN_NAMES[plan],
                "total_price": PLAN_PRICES_PAISA[plan],
                "quantity":    1,
                "unit_price":  PLAN_PRICES_PAISA[plan],
            }
        ],
        "merchant_extra": f"{user_id}:{plan}",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{KHALTI_BASE_URL}/epayment/initiate/",
                json=khalti_payload,
                headers={
                    "Authorization":  f"Key {KHALTI_SECRET_KEY}",
                    "Content-Type":   "application/json",
                },
            )

        if resp.status_code != 200:
            logger.error(f"Khalti initiate error {resp.status_code}: {resp.text}")
            try:
                detail = resp.json().get("detail", "Failed to initiate payment")
            except Exception:
                detail = resp.text[:200] or "Failed to initiate payment"
            raise HTTPException(502, f"Payment gateway error: {detail}")

        data        = resp.json()
        pidx        = data.get("pidx")
        payment_url = data.get("payment_url")

        if not pidx or not payment_url:
            raise HTTPException(502, "Invalid response from payment gateway")

        # Mark user as pending and store pidx for verification
        user.subscription_tier         = "pending"
        user.subscription_plan         = plan
        user.subscription_requested_at = datetime.utcnow()
        user.payment_method            = "khalti"
        user.payment_transaction_id    = pidx        # pidx used for lookup
        user.payment_amount            = PLAN_PRICES[plan]
        user.payment_submitted_at      = datetime.utcnow()
        user.subscription_canceled_at  = None
        db.commit()

        logger.info(f"Khalti initiated: user={user_id} plan={plan} pidx={pidx} order={order_id}")
        return {
            "payment_url": payment_url,
            "pidx":        pidx,
            "order_id":    order_id,
            "amount":      PLAN_PRICES[plan],
        }

    except httpx.RequestError as exc:
        logger.error(f"Khalti network error: {exc}")
        raise HTTPException(502, "Could not reach the payment gateway. Please try again.")


@router.post("/khalti/verify")
async def khalti_verify(payload: dict, db: Session = Depends(get_db)):
    """
    Step 2: Verify payment after Khalti redirects back.

    Calls Khalti's lookup API with the pidx. On Completed status, Premium is
    activated automatically — no admin approval needed.

    Body: { "pidx": str, "user_id": int }
    Returns: { "status": "success"|"pending"|"canceled"|"failed", "message": str, ... }
    """
    pidx    = payload.get("pidx")
    user_id = payload.get("user_id")

    if not pidx:
        raise HTTPException(400, "pidx is required")
    if not user_id:
        raise HTTPException(400, "user_id is required")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    if not KHALTI_SECRET_KEY:
        raise HTTPException(500, "Khalti payment gateway is not configured")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{KHALTI_BASE_URL}/epayment/lookup/",
                json={"pidx": pidx},
                headers={
                    "Authorization": f"Key {KHALTI_SECRET_KEY}",
                    "Content-Type":  "application/json",
                },
            )

        if resp.status_code != 200:
            logger.error(f"Khalti lookup error {resp.status_code}: {resp.text}")
            raise HTTPException(502, "Could not verify payment with the gateway")

        data           = resp.json()
        status         = data.get("status", "")
        transaction_id = data.get("transaction_id")
        total_amount   = data.get("total_amount", 0)  # paisa

        logger.info(f"Khalti lookup: user={user_id} pidx={pidx} status={status} txn={transaction_id}")

        if status == "Completed":
            plan    = user.subscription_plan or "monthly"
            days    = PLAN_DURATIONS.get(plan, 30)
            expires = datetime.utcnow() + timedelta(days=days)

            user.subscription_tier        = "premium"
            user.subscription_plan        = plan
            user.premium_until            = expires
            user.subscription_canceled_at = None
            user.ai_generations_month     = 0
            user.ai_reset_date            = datetime.utcnow()
            # Keep transaction_id as proof of payment; clear pidx/pending fields
            user.payment_method           = None
            user.payment_mobile           = None
            user.payment_transaction_id   = transaction_id or pidx
            user.payment_amount           = (total_amount / 100) if total_amount else user.payment_amount
            user.payment_submitted_at     = datetime.utcnow()
            db.commit()

            logger.info(
                f"Premium AUTO-ACTIVATED: user={user_id} plan={plan} "
                f"txn={transaction_id} expires={expires.date()}"
            )
            return {
                "status":        "success",
                "message":       "Payment verified! Your Premium plan is now active.",
                "plan":          plan,
                "plan_label":    PLAN_LABELS.get(plan, plan),
                "premium_until": expires.isoformat(),
                "transaction_id": transaction_id,
                "amount":        total_amount / 100,
            }

        elif status in ("Pending", "Initiated"):
            return {
                "status":  "pending",
                "message": "Your payment is still being processed. Please wait a moment and refresh.",
            }

        elif status == "User canceled":
            # Clean up pending state
            user.subscription_tier        = "free"
            user.subscription_plan        = None
            user.payment_method           = None
            user.payment_transaction_id   = None
            user.payment_amount           = None
            user.payment_submitted_at     = None
            user.subscription_canceled_at = None
            db.commit()
            return {
                "status":  "canceled",
                "message": "Payment was canceled. No charge was made.",
            }

        elif status == "Refunded":
            user.subscription_tier = "free"
            user.subscription_plan = None
            user.premium_until     = None
            db.commit()
            return {
                "status":  "refunded",
                "message": "Payment was refunded.",
            }

        else:
            # Expired, Partially Refunded, or any other failure
            user.subscription_tier      = "free"
            user.subscription_plan      = None
            user.payment_method         = None
            user.payment_transaction_id = None
            user.payment_amount         = None
            user.payment_submitted_at   = None
            db.commit()
            return {
                "status":  "failed",
                "message": f"Payment {status.lower()}. Please try again.",
            }

    except httpx.RequestError as exc:
        logger.error(f"Khalti verify network error: {exc}")
        raise HTTPException(502, "Could not reach the payment gateway during verification")


# ═══════════════════════════════════════════════════════════════════════════════
#  USER SUBSCRIPTION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/cancel")
def cancel_subscription(payload: dict, db: Session = Depends(get_db)):
    """
    Cancel a subscription.

    Premium users always keep access for the remainder of their paid period:
      - If premium_until is set and in the future → keep access until that date.
      - If premium_until is None (admin-activated legacy records without an
        explicit expiry) → mark as canceled but keep premium access; the admin
        can revoke manually, or it auto-expires when the admin sets a date.
      - If premium_until is already in the past → revert to Free immediately
        (subscription had already expired).
    Pending-payment users always revert to Free immediately.
    """
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(400, "user_id is required")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    if user.subscription_tier not in ("premium", "pending"):
        raise HTTPException(400, "No active subscription to cancel")

    try:
        now = datetime.utcnow()

        if user.subscription_tier == "premium":
            if user.premium_until is None:
                # Legacy record — premium set without an explicit expiry date.
                # Honour the cancel but don't immediately downgrade.
                user.subscription_canceled_at = now
                db.commit()
                logger.info(f"Cancel (no expiry): user {user_id} marked canceled, tier kept premium")
                return {
                    "status":        "canceled_with_access",
                    "message":       (
                        "Subscription canceled. Your Premium access remains active "
                        "until your current plan period ends."
                    ),
                    "premium_until": None,
                }

            elif user.premium_until > now:
                # Has remaining paid time — keep Premium, just flag as canceled
                user.subscription_canceled_at = now
                db.commit()
                logger.info(
                    f"Cancel (with access): user {user_id} canceled, "
                    f"premium until {user.premium_until.date()}"
                )
                return {
                    "status":        "canceled_with_access",
                    "message":       (
                        f"Subscription canceled. You'll keep Premium access until "
                        f"{user.premium_until.strftime('%d %b %Y')}."
                    ),
                    "premium_until": user.premium_until.isoformat(),
                }

            else:
                # premium_until already passed — subscription had expired
                user.subscription_tier        = "free"
                user.subscription_plan        = None
                user.premium_until            = None
                user.subscription_canceled_at = None
                db.commit()
                return {
                    "status":  "free",
                    "message": "Your Premium plan had already expired. You are now on the Free plan.",
                }

        else:
            # Pending payment — revert to Free immediately, clear payment data
            user.subscription_tier        = "free"
            user.subscription_plan        = None
            user.premium_until            = None
            user.subscription_canceled_at = None
            user.payment_method           = None
            user.payment_mobile           = None
            user.payment_transaction_id   = None
            user.payment_amount           = None
            user.payment_submitted_at     = None
            db.commit()
            return {
                "status":  "free",
                "message": "Subscription request canceled. You are now on the Free plan.",
            }

    except Exception as exc:
        db.rollback()
        logger.error(f"Cancel error for user {user_id}: {exc}")
        raise HTTPException(500, "Failed to cancel subscription")


@router.get("/status/{user_id}")
async def get_status(user_id: int, db: Session = Depends(get_db)):
    """Return subscription status and AI quota for a user.

    For pending Khalti payments, calls the Khalti lookup API to sync the
    real payment state. This resolves the case where the user canceled on
    Khalti's page — the frontend skips the verify call in that case, so
    the user would otherwise be stuck in 'pending' forever.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    now = datetime.utcnow()

    # Admin short-circuit — no quota or expiry logic applies
    if user.role == "admin":
        return {
            "subscription_tier":   "admin",
            "subscription_plan":   None,
            "premium_until":       None,
            "ai_generations_used": 0,
            "ai_limit":            -1,
            "ai_period":           "unlimited",
            "ai_resets_on":        None,
            "is_canceled":         False,
        }

    # Auto-expire premium if past the paid period
    if user.subscription_tier == "premium" and user.premium_until:
        if now > user.premium_until:
            user.subscription_tier        = "free"
            user.subscription_plan        = None
            user.premium_until            = None
            user.subscription_canceled_at = None
            db.commit()

    # ── Auto-resolve pending Khalti payments ───────────────────────────────────
    # When the user cancels on Khalti's hosted page, the frontend detects the
    # `status=User+canceled` query param and skips calling /khalti/verify.
    # We fix this here by checking Khalti's lookup API on every status call
    # for users stuck in 'pending'. This also catches expired and refunded
    # payments and auto-activates premium for completed ones.
    if (
        user.subscription_tier == "pending"
        and user.payment_method == "khalti"
        and user.payment_transaction_id
        and KHALTI_SECRET_KEY
    ):
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                lookup_resp = await client.post(
                    f"{KHALTI_BASE_URL}/epayment/lookup/",
                    json={"pidx": user.payment_transaction_id},
                    headers={"Authorization": f"Key {KHALTI_SECRET_KEY}"},
                )

            if lookup_resp.status_code == 200:
                kdata   = lookup_resp.json()
                kstatus = kdata.get("status", "")

                if kstatus == "Completed":
                    plan    = user.subscription_plan or "monthly"
                    days    = PLAN_DURATIONS.get(plan, 30)
                    expires = now + timedelta(days=days)
                    user.subscription_tier        = "premium"
                    user.subscription_plan        = plan
                    user.premium_until            = expires
                    user.subscription_canceled_at = None
                    user.ai_generations_month     = 0
                    user.ai_reset_date            = now
                    user.payment_method           = None
                    user.payment_transaction_id   = kdata.get("transaction_id") or user.payment_transaction_id
                    total_amount                  = kdata.get("total_amount", 0)
                    user.payment_amount           = (total_amount / 100) if total_amount else user.payment_amount
                    user.payment_submitted_at     = now
                    db.commit()
                    logger.info(f"Status auto-activated: user={user_id} plan={plan} expires={expires.date()}")

                elif kstatus in ("User canceled", "Expired", "Partially Refunded", "Refunded"):
                    user.subscription_tier        = "free"
                    user.subscription_plan        = None
                    user.payment_method           = None
                    user.payment_transaction_id   = None
                    user.payment_amount           = None
                    user.payment_submitted_at     = None
                    user.subscription_canceled_at = None
                    db.commit()
                    logger.info(f"Status auto-reverted: user={user_id} khalti_status={kstatus}")
                # "Pending" / "Initiated" → keep as pending; user is still on Khalti's page

        except Exception as exc:
            logger.warning(f"Khalti status lookup failed for user={user_id}: {exc}")
            # Fallback: if the pidx is definitely expired (>35 min), reset to free
            if (
                user.payment_submitted_at
                and (now - user.payment_submitted_at) > timedelta(minutes=35)
            ):
                user.subscription_tier        = "free"
                user.subscription_plan        = None
                user.payment_method           = None
                user.payment_transaction_id   = None
                user.payment_amount           = None
                user.payment_submitted_at     = None
                db.commit()
                logger.info(f"Status expired (35 min fallback): user={user_id} reverted to free")

    elif (
        user.subscription_tier == "pending"
        and user.payment_submitted_at
        and (now - user.payment_submitted_at) > timedelta(minutes=35)
    ):
        # Non-Khalti pending or missing pidx: use time-based expiry
        user.subscription_tier        = "free"
        user.subscription_plan        = None
        user.payment_method           = None
        user.payment_transaction_id   = None
        user.payment_amount           = None
        user.payment_submitted_at     = None
        db.commit()
        logger.info(f"Status expired (non-Khalti 35 min): user={user_id} reverted to free")

    # Roll AI quota period if stale
    limit, period_days, period_label = _quota_settings(user)
    if user.ai_reset_date and (now - user.ai_reset_date) >= timedelta(days=period_days):
        user.ai_generations_month = 0
        user.ai_reset_date = now
        db.commit()

    next_reset = (
        (user.ai_reset_date + timedelta(days=period_days)) if user.ai_reset_date else None
    )

    is_canceled = bool(
        user.subscription_canceled_at
        and user.subscription_tier == "premium"
    )

    return {
        "subscription_tier":   user.subscription_tier or "free",
        "subscription_plan":   user.subscription_plan,
        "premium_until":       user.premium_until.isoformat() if user.premium_until else None,
        "ai_generations_used": user.ai_generations_month or 0,
        "ai_limit":            limit,
        "ai_period":           period_label,
        "ai_resets_on":        next_reset.isoformat() if next_reset else None,
        "is_canceled":         is_canceled,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  ADMIN ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/admin/pending")
def list_pending(admin_id: int = Query(...), db: Session = Depends(get_db)):
    _require_admin(admin_id, db)
    pending = (
        db.query(models.User)
        .filter(models.User.subscription_tier == "pending")
        .order_by(models.User.subscription_requested_at)
        .all()
    )
    return [
        {
            "id":           u.id,
            "name":         u.name,
            "email":        u.email,
            "plan":         u.subscription_plan,
            "plan_label":   PLAN_LABELS.get(u.subscription_plan, u.subscription_plan or "—"),
            "requested_at": u.subscription_requested_at.isoformat() if u.subscription_requested_at else None,
            "payment_method":         u.payment_method,
            "payment_mobile":         u.payment_mobile,
            "payment_transaction_id": u.payment_transaction_id,
            "payment_amount":         u.payment_amount,
            "payment_submitted_at":   u.payment_submitted_at.isoformat() if u.payment_submitted_at else None,
        }
        for u in pending
    ]


@router.post("/admin/activate/{user_id}")
def activate_subscription(user_id: int, payload: dict, db: Session = Depends(get_db)):
    """Admin manually activates Premium (fallback for edge cases)."""
    admin_id = payload.get("admin_id")
    _require_admin(admin_id, db)

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    plan    = payload.get("plan") or user.subscription_plan or "monthly"
    days    = PLAN_DURATIONS.get(plan, 30)
    expires = datetime.utcnow() + timedelta(days=days)

    try:
        user.subscription_tier        = "premium"
        user.subscription_plan        = plan
        user.premium_until            = expires
        user.subscription_canceled_at = None
        user.ai_generations_month     = 0
        user.ai_reset_date            = datetime.utcnow()
        user.payment_method           = None
        user.payment_mobile           = None
        user.payment_transaction_id   = None
        user.payment_amount           = None
        user.payment_submitted_at     = None
        db.commit()
        logger.info(f"Admin {admin_id} activated {plan} for user {user_id}, expires {expires.date()}")
        return {
            "message":       f"Premium activated for {user.name}",
            "plan":          plan,
            "premium_until": expires.isoformat(),
        }
    except Exception as exc:
        db.rollback()
        logger.error(f"Activation error: {exc}")
        raise HTTPException(500, "Failed to activate subscription")


@router.post("/admin/revoke/{user_id}")
def revoke_subscription(user_id: int, payload: dict, db: Session = Depends(get_db)):
    admin_id = payload.get("admin_id")
    _require_admin(admin_id, db)

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    try:
        user.subscription_tier        = "free"
        user.subscription_plan        = None
        user.premium_until            = None
        user.subscription_canceled_at = None
        user.payment_method           = None
        user.payment_mobile           = None
        user.payment_transaction_id   = None
        user.payment_amount           = None
        user.payment_submitted_at     = None
        db.commit()
        return {"message": f"Subscription revoked for {user.name}"}
    except Exception as exc:
        db.rollback()
        raise HTTPException(500, "Failed to revoke subscription")


# ═══════════════════════════════════════════════════════════════════════════════
#  LEGACY ENDPOINT (backwards compatibility)
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/request")
def request_upgrade(payload: dict, db: Session = Depends(get_db)):
    """
    Legacy manual-approval flow. Kept for backwards compatibility.
    The new flow uses /khalti/initiate → /khalti/verify.
    """
    user_id = payload.get("user_id")
    plan    = payload.get("plan", "monthly")
    label   = payload.get("label", "Monthly")

    if not user_id:
        raise HTTPException(400, "user_id is required")
    if plan not in PLAN_DURATIONS:
        raise HTTPException(400, f"Unknown plan '{plan}'")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.subscription_tier == "premium":
        raise HTTPException(400, "User is already on Premium")

    payment_method = (payload.get("payment_method") or "").strip().lower() or None
    payment_mobile = (payload.get("payment_mobile") or "").strip() or None
    payment_txn    = (payload.get("payment_transaction_id") or "").strip() or None
    payment_amount = payload.get("payment_amount")

    if payment_method == "khalti":
        if not payment_mobile or not payment_mobile.isdigit() or len(payment_mobile) != 10:
            raise HTTPException(400, "A valid 10-digit Khalti mobile number is required")
        if not payment_txn:
            payment_txn = "KHM_" + secrets.token_hex(6).upper()
        payment_amount = PLAN_PRICES.get(plan, payment_amount)

    try:
        user.subscription_tier         = "pending"
        user.subscription_plan         = plan
        user.subscription_requested_at = datetime.utcnow()
        user.payment_method            = payment_method
        user.payment_mobile            = payment_mobile
        user.payment_transaction_id    = payment_txn
        user.payment_amount            = float(payment_amount) if payment_amount is not None else None
        user.payment_submitted_at      = datetime.utcnow() if payment_method else None
        db.commit()
        return {
            "message":               f"Upgrade request submitted for {label} plan.",
            "plan":                  plan,
            "status":                "pending",
            "payment_transaction_id": payment_txn,
        }
    except Exception as exc:
        db.rollback()
        raise HTTPException(500, "Failed to submit upgrade request")
