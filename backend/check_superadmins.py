#!/usr/bin/env python3
"""
Debug script to check superadmin users in the database.
"""

from sqlalchemy.orm import Session
from app.config.database import SessionLocal
from app.models.user import User, UserRole

def check_superadmins():
    """Check all superadmin users in the database."""
    db = SessionLocal()
    try:
        superadmins = db.query(User).filter(User.role == UserRole.superadmin).all()
        
        print("\n" + "=" * 70)
        print("SUPERADMIN USERS IN DATABASE")
        print("=" * 70)
        
        if not superadmins:
            print("✗ No superadmin users found!")
        else:
            for user in superadmins:
                print(f"\nID: {user.id}")
                print(f"Name: {user.full_name}")
                print(f"Email: {user.email}")
                print(f"Status: {user.status}")
                print(f"Is Verified: {user.is_verified}")
                print(f"Tenant ID: {user.tenant_id}")
                print(f"Created: {user.created_at}")
                print("-" * 70)
        
        # Also show all users for reference
        print("\n" + "=" * 70)
        print("ALL USERS IN DATABASE")
        print("=" * 70)
        all_users = db.query(User).all()
        for user in all_users:
            print(f"{user.id:3} | {user.email:30} | {user.role:10} | {user.status}")
        print()
        
    finally:
        db.close()

if __name__ == "__main__":
    check_superadmins()
