from sqlalchemy import create_engine, inspect, text
from database import SQLALCHEMY_DATABASE_URL
import os
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

BACKUP_DIR = os.path.join(os.path.dirname(__file__), "db_backups")


def backup_database(engine):
    """Dump every table to a timestamped JSON file so nothing is lost."""
    os.makedirs(BACKUP_DIR, exist_ok=True)
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    if not tables:
        print("  No tables found — nothing to back up.")
        return None

    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(BACKUP_DIR, f"backup_{stamp}.json")

    backup = {}
    with engine.connect() as conn:
        for table in tables:
            try:
                rows = conn.execute(text(f"SELECT * FROM {table}")).mappings().all()
                backup[table] = [dict(r) for r in rows]
                print(f"    Backed up {table}: {len(rows)} rows")
            except Exception as e:
                print(f"    Could not back up {table}: {e}")
                backup[table] = []

    # serialize dates/datetimes so JSON doesn't choke
    def default_serializer(obj):
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        return str(obj)

    with open(backup_path, 'w') as f:
        json.dump(backup, f, indent=2, default=default_serializer)

    print(f"\n  Backup saved to: {backup_path}")
    return backup_path


def restore_database(engine, backup_path):
    """Restore rows from a backup JSON file into the freshly-created tables."""
    if not backup_path or not os.path.exists(backup_path):
        print("  No backup file found — skipping restore.")
        return

    with open(backup_path, 'r') as f:
        backup = json.load(f)

    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    # restore order matters — parent tables first, children after
    restore_order = [
        'users',
        'itineraries',
        'itinerary_days',
        'activities',
        'accommodations',
        'transportation',
        'trip_notes',
        'itinerary_comments',
        'itinerary_tags',
        'complaints',
        'community_updates',
        'community_posts',
        'post_votes',
        'post_comments',
        'notifications',
        'friendships',
        'messages',
        'places',
        'place_search_aliases',
        'password_reset_otps',
    ]

    # include any tables in backup that aren't in our known order
    for table in backup.keys():
        if table not in restore_order:
            restore_order.append(table)

    restored = 0
    skipped = 0

    with engine.connect() as conn:
        for table in restore_order:
            if table not in backup:
                continue
            if table not in existing_tables:
                print(f"    Skipping {table} — table doesn't exist in new schema")
                skipped += 1
                continue

            rows = backup[table]
            if not rows:
                continue

            # get actual column names so we only insert matching columns
            columns = [col['name'] for col in inspector.get_columns(table)]
            valid_rows = []
            for row in rows:
                filtered = {k: v for k, v in row.items() if k in columns}
                if filtered:
                    valid_rows.append(filtered)

            if not valid_rows:
                continue

            try:
                # build parameterised insert
                cols = list(valid_rows[0].keys())
                col_str = ", ".join(cols)
                val_str = ", ".join([f":{c}" for c in cols])
                insert_sql = text(f"INSERT INTO {table} ({col_str}) VALUES ({val_str})")

                for row in valid_rows:
                    try:
                        conn.execute(insert_sql, row)
                    except Exception:
                        # skip individual rows that conflict (dupes, FK issues)
                        pass

                conn.commit()

                # reset auto-increment sequence so new rows don't collide
                if 'id' in cols:
                    try:
                        conn.execute(text(
                            f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                            f"COALESCE((SELECT MAX(id) FROM {table}), 1))"
                        ))
                        conn.commit()
                    except Exception:
                        pass

                print(f"    Restored {table}: {len(valid_rows)} rows")
                restored += 1
            except Exception as e:
                print(f"    Could not restore {table}: {e}")
                skipped += 1

    print(f"\n  Restore complete — {restored} tables restored, {skipped} skipped")


def migrate_database():
    """Migrate database to new schema with automatic backup + restore."""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    inspector = inspect(engine)

    print("  Checking existing tables...")
    existing_tables = inspector.get_table_names()
    print(f"  Found tables: {existing_tables}")

    # ask for confirmation
    print("\n  WARNING: This will DROP all existing tables and recreate them.")
    print("  Your data will be backed up automatically and restored after migration.")
    response = input("\n  Type 'YES' to continue or anything else to cancel: ")

    if response != 'YES':
        print("  Migration cancelled.")
        return

    # step 1: backup everything
    print("\n  STEP 1 — Backing up existing data...")
    backup_path = backup_database(engine)

    # step 2: drop all tables
    print("\n  STEP 2 — Dropping all tables...")
    with engine.connect() as conn:
        tables_to_drop = [
            'messages',
            'friendships',
            'post_comments',
            'notifications',
            'post_votes',
            'community_posts',
            'community_updates',
            'itinerary_tags',
            'itinerary_comments',
            'complaints',
            'trip_notes',
            'transportation',
            'accommodations',
            'activities',
            'itinerary_days',
            'itineraries',
            'password_reset_otps',
            'place_search_aliases',
            'places',
            'users',
            'trips',
        ]
        for table in tables_to_drop:
            try:
                conn.execute(text(f'DROP TABLE IF EXISTS {table} CASCADE'))
                print(f"    Dropped {table}")
            except Exception as e:
                print(f"    Could not drop {table}: {e}")
        conn.commit()

    # step 3: create new tables
    print("\n  STEP 3 — Creating new tables with updated schema...")
    import models
    models.Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    for table in inspector.get_table_names():
        print(f"    + {table}")

    # step 4: restore data
    print("\n  STEP 4 — Restoring data from backup...")
    restore_database(engine, backup_path)

    print("\n  Migration completed successfully!")
    print(f"  Backup file kept at: {backup_path}")


if __name__ == "__main__":
    print("=" * 60)
    print("  Smart Itinerary — Database Migration (with backup)")
    print("=" * 60)
    migrate_database()