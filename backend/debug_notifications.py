from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import json

DATABASE_URL = "mysql+pymysql://root:@localhost:3306/voting_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

tenant_id = 1

try:
    query = text("SELECT * FROM announcements WHERE tenant_id = :tenant_id")
    result = db.execute(query, {"tenant_id": tenant_id}).fetchall()
    print(f"Found {len(result)} announcements")
    for row in result:
        d = dict(row._mapping)
        print(d.keys())
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
