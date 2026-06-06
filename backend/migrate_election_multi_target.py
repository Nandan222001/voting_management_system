import sys
from sqlalchemy import text
from app.config.database import SessionLocal

def migrate():
    db = SessionLocal()
    try:
        print("Starting multi-jurisdiction migration...")
        
        # 1. Add committee_level to elections
        print("Checking for committee_level column...")
        cols = db.execute(text("DESCRIBE elections")).fetchall()
        col_names = [c[0] for c in cols]
        
        if 'committee_level' not in col_names:
            print("Adding committee_level column...")
            db.execute(text("ALTER TABLE elections ADD COLUMN committee_level VARCHAR(50) AFTER nomination_end_date"))
        
        # 2. Create junction table
        print("Creating election_targets junction table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS election_targets (
                election_id INT NOT NULL,
                target_id INT NOT NULL,
                PRIMARY KEY (election_id, target_id),
                FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
                FOREIGN KEY (target_id) REFERENCES targets(id) ON DELETE CASCADE
            )
        """))
        
        # 3. Seed junction table from legacy target_id
        print("Migrating legacy target_ids to junction table...")
        db.execute(text("""
            INSERT IGNORE INTO election_targets (election_id, target_id)
            SELECT id, target_id FROM elections WHERE target_id IS NOT NULL
        """))
        
        db.commit()
        print("Migration completed successfully!")
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
