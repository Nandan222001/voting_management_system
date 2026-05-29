import sys
from sqlalchemy import text
from app.config.database import SessionLocal

def migrate():
    db = SessionLocal()
    try:
        print("Starting migration...")
        
        # 1. Add contact_phone column if it doesn't exist
        print("Checking for contact_phone column...")
        columns = db.execute(text("DESCRIBE tenants")).fetchall()
        column_names = [col[0] for col in columns]
        
        if 'contact_phone' not in column_names:
            print("Adding contact_phone column...")
            db.execute(text("ALTER TABLE tenants ADD COLUMN contact_phone VARCHAR(20) AFTER contact_email"))
            print("Added contact_phone column.")
        else:
            print("contact_phone column already exists.")
            
        # 2. Update Enum 'trial' to 'draft'
        # In MySQL, we need to modify the column definition.
        # First, let's add 'draft' to the enum and make it the default.
        print("Updating status enum to include 'draft' and setting it as default...")
        db.execute(text("ALTER TABLE tenants MODIFY COLUMN status ENUM('trial', 'draft', 'active', 'suspended', 'cancelled') NOT NULL DEFAULT 'draft'"))
        
        # 3. Update existing 'trial' records to 'draft'
        print("Migrating existing 'trial' records to 'draft'...")
        db.execute(text("UPDATE tenants SET status = 'draft' WHERE status = 'trial'"))
        
        # 4. Finalize the enum (optional: remove 'trial')
        print("Removing 'trial' from status enum...")
        db.execute(text("ALTER TABLE tenants MODIFY COLUMN status ENUM('draft', 'active', 'suspended', 'cancelled') NOT NULL DEFAULT 'draft'"))
        
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
