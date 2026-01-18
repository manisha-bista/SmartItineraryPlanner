"""
Database Migration Script
This script will safely update your database schema to match the new models.
Run this ONCE after replacing models.py
"""

from sqlalchemy import create_engine, inspect, text
from database import SQLALCHEMY_DATABASE_URL
import os
from dotenv import load_dotenv

load_dotenv()

def migrate_database():
    """Migrate database to new schema"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    inspector = inspect(engine)
    
    print("🔍 Checking existing tables...")
    existing_tables = inspector.get_table_names()
    print(f"Found tables: {existing_tables}")
    
    # Ask for confirmation
    print("\n⚠️  WARNING: This will DROP all existing tables and recreate them.")
    print("   All existing data will be LOST!")
    response = input("\nType 'YES' to continue or anything else to cancel: ")
    
    if response != 'YES':
        print("❌ Migration cancelled.")
        return
    
    print("\n🗑️  Dropping all tables...")
    
    with engine.connect() as conn:
        # Drop tables in reverse order of dependencies
        tables_to_drop = [
            'trip_notes',
            'transportation', 
            'accommodations',
            'activities',
            'itinerary_days',
            'itineraries',
            'users',
            'trips'  # Old table if it exists
        ]
        
        for table in tables_to_drop:
            try:
                conn.execute(text(f'DROP TABLE IF EXISTS {table} CASCADE'))
                print(f"   ✓ Dropped {table}")
            except Exception as e:
                print(f"   ⚠ Could not drop {table}: {e}")
        
        conn.commit()
    
    print("\n📦 Creating new tables with updated schema...")
    
    # Import models after dropping tables
    import models
    models.Base.metadata.create_all(bind=engine)
    
    print("\n✅ Migration completed successfully!")
    print("\n📋 New tables created:")
    inspector = inspect(engine)
    for table in inspector.get_table_names():
        print(f"   ✓ {table}")
    
    print("\n🎯 You can now:")
    print("   1. Create a new account (signup)")
    print("   2. Login with new account")
    print("   3. Create itineraries")

if __name__ == "__main__":
    print("=" * 60)
    print("  Smart Itinerary - Database Migration")
    print("=" * 60)
    migrate_database()