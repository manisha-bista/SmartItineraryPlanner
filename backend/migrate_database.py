from sqlalchemy import create_engine, inspect, text
from database import SQLALCHEMY_DATABASE_URL
import models

def migrate_database():
    """Drop all tables and recreate from scratch — no backup."""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

    print("\n  Dropping all existing tables...")
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.commit()
    print("  Done.")

    print("\n  Creating tables from models...")
    models.Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    for table in inspector.get_table_names():
        print(f"    + {table}")

    print("\n  Fresh database ready!")


if __name__ == "__main__":
    print("=" * 60)
    print("  Smart Itinerary — Fresh Migration (no backup)")
    print("=" * 60)
    migrate_database()