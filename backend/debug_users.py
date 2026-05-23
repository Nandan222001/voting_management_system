#!/usr/bin/env python3
"""
Debug script to check superadmin users and test login credentials.
Useful for troubleshooting login issues.

Usage:
    python debug_users.py                          # Show all users
    python debug_users.py --test email password    # Test specific login
"""

import sys
from sqlalchemy.orm import Session

from app.config.database import SessionLocal
from app.models.user import User, UserRole
from app.utils.security import verify_password


def check_all_users():
    """Check all users in the database."""
    db = SessionLocal()
    try:
        print("\n" + "=" * 90)
        print("ALL USERS IN DATABASE")
        print("=" * 90)
        
        all_users = db.query(User).all()
        
        if not all_users:
            print("✗ No users found in database")
        else:
            print(f"{'ID':3} | {'Email':35} | {'Name':20} | {'Role':10} | {'Status'}")
            print("-" * 90)
            for user in all_users:
                print(f"{user.id:3} | {user.email:35} | {user.full_name[:20]:20} | {user.role:10} | {user.status}")
        
        # Check superadmins specifically
        print("\n" + "=" * 90)
        print("SUPERADMIN USERS")
        print("=" * 90)
        
        superadmins = db.query(User).filter(User.role == UserRole.superadmin).all()
        
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
                print("-" * 90)
        
        print()
        
    finally:
        db.close()


def test_login(email: str, password: str):
    """Test login with specific credentials."""
    db = SessionLocal()
    try:
        from app.repositories.user_repository import UserRepository
        
        print("\n" + "=" * 90)
        print(f"TEST LOGIN CREDENTIALS")
        print("=" * 90)
        print(f"Email:    {email}")
        print(f"Password: {'*' * len(password)}")
        print("-" * 90)
        
        repo = UserRepository(db)
        
        # Try to find user (will normalize email to lowercase)
        user = repo.get_by_email(email)
        
        if user is None:
            print(f"✗ FAIL: User not found")
            print(f"  Searched for: {email.lower()}")
            print(f"  Tip: Check if the email address is correct")
            return False
        
        print(f"✓ PASS: User found")
        print(f"  Name: {user.full_name}")
        print(f"  Email (in DB): {user.email}")
        print(f"  Role: {user.role}")
        print(f"  Status: {user.status}")
        print(f"  Verified: {user.is_verified}")
        
        # Test password
        print(f"\nPassword verification...")
        if verify_password(password, user.hashed_password):
            print(f"✓ PASS: Password is correct")
        else:
            print(f"✗ FAIL: Password is incorrect")
            return False
        
        # Check account status
        print(f"\nAccount status check...")
        if user.status.value == "pending":
            print(f"✗ FAIL: Account is pending - needs admin approval")
            return False
        elif user.status.value == "blocked":
            print(f"✗ FAIL: Account is blocked")
            return False
        else:
            print(f"✓ PASS: Account is {user.status.value}")
        
        print(f"\n{'=' * 90}")
        print(f"✓ ALL CHECKS PASSED - Login should work!")
        print(f"{'=' * 90}\n")
        return True
        
    except Exception as e:
        print(f"\n✗ ERROR: {e}\n")
        return False
    finally:
        db.close()


def main():
    """Main entry point."""
    if len(sys.argv) > 1:
        if sys.argv[1] == "--test":
            if len(sys.argv) < 4:
                print("\nUsage: python debug_users.py --test <email> <password>")
                print("Example: python debug_users.py --test admin@example.com SecurePass123\n")
                sys.exit(1)
            email = sys.argv[2]
            password = sys.argv[3]
            success = test_login(email, password)
            sys.exit(0 if success else 1)
        elif sys.argv[1] == "--help":
            print("""
Debug Users Script
==================

Usage:
  python debug_users.py                        Show all users in database
  python debug_users.py --test EMAIL PASSWORD  Test login with credentials
  python debug_users.py --help                 Show this help message

Examples:
  python debug_users.py
  python debug_users.py --test john@example.com MyPassword123

This script helps diagnose login issues by:
  1. Showing all users in the database
  2. Verifying password hashes
  3. Checking account status
  4. Testing email lookup (case-insensitive)
""")
            sys.exit(0)
    
    # Default: show all users
    check_all_users()


if __name__ == "__main__":
    main()
