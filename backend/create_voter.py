from app.config.database import SessionLocal
from app.models.user import User, UserRole, UserStatus
from app.utils.security import hash_password
import sys

def create_voter():
    db = SessionLocal()
    try:
        email = "voter@example.com"
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User {email} already exists.")
            return

        new_voter = User(
            full_name="Active Voter",
            email=email,
            phone="1234567890",
            hashed_password=hash_password("Password123!"),
            role=UserRole.voter,
            status=UserStatus.active,
            is_verified=True,
            tenant_id=1,
            district="Mumbai",
            designation="Member"
        )
        db.add(new_voter)
        db.commit()
        print(f"Successfully created active voter: {email}")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_voter()
