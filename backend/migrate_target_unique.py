import sys
from sqlalchemy import text
from app.config.database import SessionLocal

def migrate():
    db = SessionLocal()
    try:
        print("Adding UNIQUE constraint to 'name' column in 'targets' table...")
        # MySQL ALTER TABLE to add UNIQUE index
        db.execute(text("ALTER TABLE targets ADD UNIQUE INDEX uix_target_name (name)"))
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
