import uuid
from sqlalchemy.orm import Session
from app.config.database import SessionLocal
from app.models.tenant import Tenant

def seed_tenant_uuids():
    db = SessionLocal()
    try:
        tenants = db.query(Tenant).filter(Tenant.uuid == None).all()
        for tenant in tenants:
            tenant.uuid = str(uuid.uuid4())
            print(f"Generated UUID for tenant {tenant.slug}: {tenant.uuid}")
        db.commit()
        print(f"Successfully updated {len(tenants)} tenants.")
    except Exception as e:
        print(f"Error seeding tenant UUIDs: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_tenant_uuids()
