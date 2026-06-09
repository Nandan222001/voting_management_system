import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config.settings import settings
from app.models.tenant import Tenant

# Use the database from settings
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

try:
    tenant_uuid = "5527de8e-05c5-4147-b6e0-7f0ee10c11b8"
    tenant = db.query(Tenant).filter(Tenant.uuid == tenant_uuid).first()
    if tenant:
        print(f"Tenant found: {tenant.name} (ID: {tenant.id}, UUID: {tenant.uuid})")
    else:
        print(f"Tenant NOT found for UUID: {tenant_uuid}")
        
    all_tenants = db.query(Tenant).all()
    print("All tenants in DB:")
    for t in all_tenants:
        print(f" - {t.name} (ID: {t.id}, UUID: {t.uuid})")
except Exception as e:
    print(f"Error occurred: {type(e).__name__}: {e}")
finally:
    db.close()
