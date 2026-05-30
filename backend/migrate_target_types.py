import sys
from sqlalchemy import text
from app.config.database import SessionLocal

def migrate():
    db = SessionLocal()
    try:
        print("Updating target_type_enum in database...")
        # MySQL ALTER TABLE to update ENUM
        db.execute(text("ALTER TABLE targets MODIFY COLUMN type ENUM('country', 'state', 'district', 'block', 'booth', 'taluka', 'city', 'village', 'other') NOT NULL DEFAULT 'district'"))
        db.commit()
        print("Database migration completed successfully!")
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
