"""
seed.py — Idempotent startup seeding.
Ensures the default admin account exists and that any new columns
added to the ORM are also present in the live DB (for dev setups that
skip Alembic). Runs on every app startup.
"""
import os
import random
import logging

from sqlalchemy import text
from sqlalchemy.orm import Session

import models
from database import SessionLocal, engine
from routers.auth import get_password_hash, generate_username

logger = logging.getLogger(__name__)


# ── Lightweight column migrations ─────────────────────────────────────────────
# We use PostgreSQL's `ADD COLUMN IF NOT EXISTS` so this is safe to re-run on
# every startup. If we ever switch to SQLite, we'd need to wrap this in a
# dialect check — but for now the app is Postgres-only.
_ADD_COLUMN_SQL = [
    # Khalti / payment fields on users — added when the Khalti payment UI
    # was wired up. Existing rows stay NULL until a user submits a payment.
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_mobile VARCHAR(20)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(100)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_amount DOUBLE PRECISION",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_submitted_at TIMESTAMP",
    # Cancellation tracking — set when user cancels a still-active subscription
    # so they keep access until premium_until expires rather than losing it immediately.
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_canceled_at TIMESTAMP",
]


def ensure_schema_extras() -> None:
    """Apply additive, idempotent column migrations for fields that were added
    after the initial schema was created. Safe to call on every startup."""
    try:
        with engine.begin() as conn:
            for stmt in _ADD_COLUMN_SQL:
                conn.execute(text(stmt))
        logger.info("Schema extras verified (payment columns present)")
    except Exception as e:
        # Don't crash the app if the migration fails (e.g. SQLite fallback) —
        # just log it so devs can notice.
        logger.warning(f"Schema extras migration skipped: {e}")

# The address that's also configured as EMAIL_SENDER. Owning this inbox
# means the admin can always recover the account via the OTP flow.
DEFAULT_ADMIN_EMAIL = "admin.smart.itinerary@gmail.com"
DEFAULT_ADMIN_NAME  = "Smart Itinerary Admin"


def ensure_default_admin() -> None:
    """
    Guarantee that DEFAULT_ADMIN_EMAIL exists with role='admin'.

    - If the account is missing, create it with a hashed password taken
      from the DEFAULT_ADMIN_PASSWORD env var (falls back to
      'Admin@12345'). The password is only set at creation time —
      existing accounts keep whatever password they already have.
    - If the account exists but isn't an admin, promote it.
    - If the account exists and is already admin, do nothing.
    """
    db: Session = SessionLocal()
    try:
        admin = db.query(models.User).filter(
            models.User.email == DEFAULT_ADMIN_EMAIL
        ).first()

        if admin:
            if admin.role != "admin":
                admin.role = "admin"
                db.commit()
                logger.info(f"Promoted existing user {DEFAULT_ADMIN_EMAIL} to admin")
            else:
                logger.info(f"Default admin {DEFAULT_ADMIN_EMAIL} already in place")
            return

        default_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "Admin@12345")
        admin = models.User(
            name=DEFAULT_ADMIN_NAME,
            email=DEFAULT_ADMIN_EMAIL,
            hashed_password=get_password_hash(default_password),
            username=generate_username(db),
            avatar_id=random.randint(1, 30),
            role="admin",
        )
        db.add(admin)
        db.commit()
        logger.info(
            f"Seeded default admin {DEFAULT_ADMIN_EMAIL}. "
            f"Set DEFAULT_ADMIN_PASSWORD in .env to override the initial password "
            f"(or use the 'Forgot password' flow to reset it)."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to ensure default admin: {e}")
    finally:
        db.close()
