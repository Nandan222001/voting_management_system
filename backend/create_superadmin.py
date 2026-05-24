#!/usr/bin/env python3
"""
Script to create a superadmin user for the Digital Voting System.

Usage:
    python create_superadmin.py [--email EMAIL] [--password PASSWORD] [--name NAME]
    
    If arguments are not provided, the script will prompt for them interactively.

Example:
    python create_superadmin.py --email admin@example.com --password SecurePass123 --name "John Doe"
"""

import argparse
import sys
from datetime import datetime
from getpass import getpass

from sqlalchemy.orm import Session

from app.config.database import SessionLocal, engine
from app.config.settings import settings
from app.models.user import Base, User, UserRole, UserStatus
from app.utils.security import hash_password


def create_tables() -> None:
    """Create all tables in the database if they don't exist."""
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables are ready")


def validate_email(email: str) -> bool:
    """Simple email validation."""
    if "@" not in email or "." not in email:
        print("✗ Invalid email format")
        return False
    return True


def validate_password(password: str) -> bool:
    """Validate password strength."""
    if len(password) < 8:
        print("✗ Password must be at least 8 characters long")
        return False
    if not any(c.isupper() for c in password):
        print("✗ Password must contain at least one uppercase letter")
        return False
    if not any(c.isdigit() for c in password):
        print("✗ Password must contain at least one digit")
        return False
    return True


def superadmin_exists(db: Session, email: str) -> bool:
    """Check if a superadmin with the given email already exists."""
    user = db.query(User).filter(User.email == email.lower()).first()
    return user is not None


def create_superadmin(
    db: Session,
    full_name: str,
    email: str,
    password: str,
) -> User:
    """
    Create a new superadmin user.
    
    Args:
        db: Database session
        full_name: Full name of the superadmin
        email: Email address (unique)
        password: Plain-text password (will be hashed)
        
    Returns:
        The newly created User instance
        
    Raises:
        ValueError: If email already exists or inputs are invalid
    """
    # Normalize email
    email = email.lower()
    
    # Check if user already exists
    if superadmin_exists(db, email):
        raise ValueError(f"User with email '{email}' already exists")
    
    # Create new superadmin user
    new_user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
        role=UserRole.superadmin,
        status=UserStatus.active,
        is_verified=True,
        tenant_id=None,  # Superadmins are global, not tied to a tenant
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


def prompt_for_credentials() -> tuple[str, str, str]:
    """Interactively prompt user for superadmin credentials."""
    print("\n" + "=" * 60)
    print("Create New Superadmin User")
    print("=" * 60 + "\n")
    
    # Get full name
    while True:
        full_name = input("Full Name: ").strip()
        if len(full_name) < 2:
            print("✗ Name must be at least 2 characters")
            continue
        break
    
    # Get email
    while True:
        email = input("Email Address: ").strip()
        if not validate_email(email):
            continue
        break
    
    # Get password with confirmation
    while True:
        password = getpass("Password (hidden): ")
        if not validate_password(password):
            continue
        
        password_confirm = getpass("Confirm Password: ")
        if password != password_confirm:
            print("✗ Passwords do not match")
            continue
        
        break
    
    return full_name, email, password


def main() -> None:
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(
        description="Create a superadmin user for the Digital Voting System"
    )
    parser.add_argument(
        "--email",
        type=str,
        help="Email address for the superadmin",
    )
    parser.add_argument(
        "--password",
        type=str,
        help="Password for the superadmin (if not provided, you'll be prompted)",
    )
    parser.add_argument(
        "--name",
        type=str,
        help="Full name of the superadmin",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Skip the confirmation prompt (use with caution)",
    )
    
    args = parser.parse_args()
    
    # Ensure database is configured
    if not settings.DATABASE_URL:
        print("✗ DATABASE_URL environment variable is not set")
        sys.exit(1)
    
    # Create tables if needed
    create_tables()
    
    # Get credentials from arguments or prompt
    if args.email and args.password and args.name:
        full_name = args.name
        email = args.email
        password = args.password
    else:
        full_name, email, password = prompt_for_credentials()
    
    # Validate inputs
    if not validate_email(email):
        sys.exit(1)
    
    if not validate_password(password):
        sys.exit(1)
    
    if len(full_name) < 2:
        print("✗ Name must be at least 2 characters")
        sys.exit(1)
    
    # Show summary and confirm
    print("\n" + "=" * 60)
    print("Superadmin Details")
    print("=" * 60)
    print(f"Name:  {full_name}")
    print(f"Email: {email}")
    print(f"Role:  superadmin")
    print(f"Status: active")
    print("=" * 60 + "\n")
    
    if not args.force:
        confirm = input("Create superadmin with these details? (yes/no): ").strip().lower()
        if confirm != "yes":
            print("✗ Creation cancelled")
            sys.exit(0)
    
    # Create the superadmin
    db = SessionLocal()
    try:
        user = create_superadmin(db, full_name, email, password)
        print(f"\n✓ Superadmin user created successfully!")
        print(f"  ID: {user.id}")
        print(f"  Email: {user.email}")
        print(f"  Name: {user.full_name}")
        print(f"  Status: {user.status}")
        print(f"  Created: {user.created_at}")
        print()
    except ValueError as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
