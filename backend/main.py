"""
main.py — Slim entry point.
Initialises the app, adds middleware, and wires all routers.
No business logic lives here.
"""
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import engine
import models

from routers import auth, users, itineraries, community, communication, services, admin
from routers.subscriptions import router as subscriptions_router
from routers.users import friends_router
from routers.community import updates_router, complaints_router  # /community-updates and /complaints
from routers.recommendations import router as recommendations_router
from seed import ensure_default_admin, ensure_schema_extras

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Create tables ──────────────────────────────────────────────────────────────
try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("Database tables ready")
except Exception as e:
    logger.error(f"Error creating database tables: {e}")

# ── Apply additive column migrations & seed required default rows (idempotent)
ensure_schema_extras()
ensure_default_admin()

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Smart Itinerary API",
    description="Nepal Adventure Smart Itinerary Planner",
    version="4.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL"), "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(friends_router)   # /friends/...
app.include_router(itineraries.router)
app.include_router(community.router) # /community/posts, /community/saved, etc.
app.include_router(updates_router)   # /community-updates (no /community prefix)
app.include_router(complaints_router) # /complaints (no /community prefix)
app.include_router(communication.router)
app.include_router(services.router)
app.include_router(admin.router)
app.include_router(recommendations_router)
app.include_router(subscriptions_router)


# ── Health / Root ──────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {
        "message": "Smart Itinerary API",
        "version": "4.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    from database import SessionLocal
    from sqlalchemy import text
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Service unavailable")
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)