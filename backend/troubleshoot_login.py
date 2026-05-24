#!/usr/bin/env python3
"""
Complete Login Troubleshooting Script
Checks every part of the login pipeline to identify the issue.
"""

import sys
from sqlalchemy.orm import Session
from app.config.database import SessionLocal
from app.models.user import User, UserRole, UserStatus
from app.repositories.user_repository import UserRepository
from app.utils.security import verify_password, hash_password


def print_section(title):
    """Print a formatted section header."""
    print(f"\n{'=' * 100}")
    print(f"{title:^100}")
    print('=' * 100)


def check_database_connection():
    """Verify database connection works."""
    print_section("STEP 1: Database Connection Check")
    try:
        db = SessionLocal()
        result = db.execute("SELECT 1").fetchone()
        db.close()
        print("✓ Database connection successful")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False


def list_all_users():
    """List all users in the database."""
    print_section("STEP 2: List All Users in Database")
    db = SessionLocal()
    try:
        users = db.query(User).all()
        
        if not users:
            print("✗ No users found in database!")
            print("  → Create a superadmin: python create_superadmin.py")
            return []
        
        print(f"Found {len(users)} user(s):\n")
        print(f"{'ID':3} | {'Email':40} | {'Name':20} | {'Role':10} | {'Status':10} | {'Verified'}")
        print("-" * 100)
        
        for user in users:
            verified = "Yes" if user.is_verified else "No"
            print(f"{user.id:3} | {user.email:40} | {user.full_name[:20]:20} | {user.role:10} | {user.status:10} | {verified}")
        
        return users
    finally:
        db.close()


def test_email_lookup(email):
    """Test email lookup with case variations."""
    print_section(f"STEP 3: Test Email Lookup - '{email}'")
    db = SessionLocal()
    try:
        repo = UserRepository(db)
        
        # Test different cases
        test_cases = [
            email,
            email.lower(),
            email.upper(),
            email.capitalize(),
        ]
        
        for test_email in test_cases:
            user = repo.get_by_email(test_email)
            status = "✓ Found" if user else "✗ Not found"
            print(f"{status:10} | Email: {test_email}")
            if user:
                print(f"           → ID: {user.id}, Name: {user.full_name}, Status: {user.status}")
        
        return repo.get_by_email(email)
    finally:
        db.close()


def test_password_hash(email, password):
    """Test password verification."""
    print_section(f"STEP 4: Password Verification Test")
    db = SessionLocal()
    try:
        repo = UserRepository(db)
        user = repo.get_by_email(email)
        
        if not user:
            print(f"✗ User not found with email: {email}")
            return False
        
        print(f"User found: {user.full_name} ({user.email})")
        print(f"Hashed password in DB: {user.hashed_password[:50]}...")
        
        # Test password
        is_correct = verify_password(password, user.hashed_password)
        
        if is_correct:
            print(f"✓ Password is CORRECT")
        else:
            print(f"✗ Password is INCORRECT")
            print(f"  Entered: {password}")
            print(f"  Tip: Check if you typed the password correctly")
        
        return is_correct
    finally:
        db.close()


def test_account_status(email):
    """Check account status."""
    print_section(f"STEP 5: Account Status Check")
    db = SessionLocal()
    try:
        repo = UserRepository(db)
        user = repo.get_by_email(email)
        
        if not user:
            print(f"✗ User not found")
            return False
        
        print(f"User: {user.full_name} ({user.email})")
        print(f"Role: {user.role.value}")
        print(f"Status: {user.status.value}")
        print(f"Is Verified: {user.is_verified}")
        
        issues = []
        
        if user.status == UserStatus.blocked:
            issues.append("Account is BLOCKED - contact administrator")
        elif user.status == UserStatus.pending:
            issues.append("Account is PENDING - waiting for admin approval")
        
        if not user.is_verified:
            issues.append("Account is NOT VERIFIED - OTP verification needed")
        
        if issues:
            print(f"\n⚠ Issues found:")
            for issue in issues:
                print(f"  • {issue}")
            return False
        else:
            print(f"\n✓ Account status is good")
            return True
    finally:
        db.close()


def simulate_login(email, password):
    """Simulate the complete login process."""
    print_section(f"STEP 6: Simulate Complete Login Flow")
    db = SessionLocal()
    try:
        from app.models.user import UserStatus
        from app.repositories.user_repository import UserRepository
        from app.utils.security import verify_password
        
        repo = UserRepository(db)
        
        # Step 1: Look up user
        print(f"Looking up user with email: {email}")
        user = repo.get_by_email(email)
        
        if user is None:
            print(f"✗ FAIL: User not found")
            return False
        print(f"✓ PASS: User found - {user.full_name}")
        
        # Step 2: Check password
        print(f"Verifying password...")
        if not verify_password(password, user.hashed_password):
            print(f"✗ FAIL: Password incorrect")
            return False
        print(f"✓ PASS: Password correct")
        
        # Step 3: Check if blocked
        print(f"Checking if account is blocked...")
        if user.status == UserStatus.blocked:
            print(f"✗ FAIL: Account is blocked")
            return False
        print(f"✓ PASS: Account is not blocked")
        
        # Step 4: Check if pending
        print(f"Checking if account is pending approval...")
        if user.status == UserStatus.pending:
            print(f"✗ FAIL: Account is pending approval")
            return False
        print(f"✓ PASS: Account is approved")
        
        print(f"\n{'✓ LOGIN WOULD SUCCEED':^100}")
        return True
    finally:
        db.close()


def create_test_superadmin():
    """Offer to create a test superadmin."""
    print_section("Option: Create a Test Superadmin")
    print(f"""
If you don't have a superadmin user, run:

    python create_superadmin.py

Or with specific credentials:

    python create_superadmin.py \\
        --name "Test Admin" \\
        --email "test@example.com" \\
        --password "TestPass123" \\
        --force
""")


def main():
    """Run all checks."""
    print("\n")
    print("█" * 100)
    print("VOTING MANAGEMENT SYSTEM - LOGIN TROUBLESHOOTER".center(100))
    print("█" * 100)
    
    # Step 1: Check database
    if not check_database_connection():
        print("\n✗ Cannot proceed - database connection failed")
        sys.exit(1)
    
    # Step 2: List users
    users = list_all_users()
    
    if not users:
        print(f"\n{'✗ NO USERS FOUND':^100}")
        create_test_superadmin()
        sys.exit(0)
    
    # Find a superadmin or first user for testing
    superadmins = [u for u in users if u.role == UserRole.superadmin]
    test_user = superadmins[0] if superadmins else users[0]
    
    print(f"\n\nUsing '{test_user.email}' for testing...")
    
    # Step 3: Test email lookup
    test_email_lookup(test_user.email)
    
    # Step 4 & 5: Need password to test, so ask user
    print_section("STEP 4-6: Interactive Password Test")
    print(f"To test password verification and simulate login,")
    print(f"I need the password for: {test_user.email}")
    print(f"(This is not stored anywhere, used only for testing)")
    
    from getpass import getpass
    try:
        password = getpass(f"Enter password for {test_user.email}: ")
        
        if not password:
            print("Skipping password tests...")
        else:
            # Test password
            if not test_password_hash(test_user.email, password):
                print("\n⚠ Password is incorrect")
            
            # Test account status
            if not test_account_status(test_user.email):
                print("\n⚠ Account has issues preventing login")
            else:
                # Simulate full login
                if simulate_login(test_user.email, password):
                    print(f"\n✓ All tests passed! Login should work.")
                    print(f"\nNext steps:")
                    print(f"  1. Ensure backend is running: python main.py")
                    print(f"  2. Refresh frontend browser: Ctrl+R")
                    print(f"  3. Try logging in again")
                else:
                    print(f"\n✗ Login simulation failed - see errors above")
    except KeyboardInterrupt:
        print("\nSkipped password testing")
    
    # Final tips
    print_section("Troubleshooting Tips")
    print("""
If login still fails:

1. Backend running?
   → Check if 'python main.py' is running in backend terminal
   → Should show "Uvicorn running on http://127.0.0.1:8000"

2. Frontend API configured?
   → Check frontend/.env has correct VITE_API_URL
   → Should be http://localhost:8000 (or your backend URL)

3. Browser console errors?
   → Press F12 in browser
   → Check Console and Network tabs for API errors

4. Database issues?
   → Run 'python debug_users.py' to see detailed user info
   → Check if DATABASE_URL in .env is correct

5. Cache issues?
   → Clear browser cache: Ctrl+Shift+Delete
   → Clear localStorage: F12 → Console → localStorage.clear()

6. Create fresh superadmin:
   → python create_superadmin.py
   → Use new credentials to login
""")
    
    print("=" * 100)


if __name__ == "__main__":
    main()
