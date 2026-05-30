import sys
from sqlalchemy import text
from app.config.database import SessionLocal

def migrate():
    db = SessionLocal()
    try:
        print("Adding nomination columns to 'elections' table...")
        # Add nomination_start_date
        db.execute(text("ALTER TABLE elections ADD COLUMN nomination_start_date DATETIME AFTER description"))
        # Add nomination_end_date
        db.execute(text("ALTER TABLE elections ADD COLUMN nomination_end_date DATETIME AFTER nomination_start_date"))
        db.commit()
        print("Database migration completed successfully!")
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
        # If columns already exist, we might get an error. Let's handle it or just exit.
        if "Duplicate column name" in str(e):
            print("Columns already exist, proceeding...")
        else:
            sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
