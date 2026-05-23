#!/usr/bin/env python3
"""
Test the login API directly and capture the exact error response.
This helps identify what the backend is returning.

Usage:
    python test_api_login.py email@example.com mypassword
"""

import sys
import requests
from urllib.parse import urljoin

def test_login_api(email: str, password: str, base_url: str = "http://localhost:8000"):
    """
    Test login against the API directly.
    
    Args:
        email: User email
        password: User password
        base_url: API base URL (default: http://localhost:8000)
    """
    
    login_url = urljoin(base_url, "/api/v1/auth/login")
    
    print("\n" + "=" * 80)
    print("API LOGIN TEST")
    print("=" * 80)
    print(f"\nURL: {login_url}")
    print(f"Email: {email}")
    print(f"Password: {'*' * len(password)}")
    print("-" * 80)
    
    try:
        # Prepare form data as OAuth2PasswordRequestForm expects
        data = {
            "username": email,
            "password": password
        }
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        print("\nSending request...")
        response = requests.post(
            login_url,
            data=data,
            headers=headers,
            timeout=10
        )
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        try:
            response_json = response.json()
            print(f"\nResponse Body (JSON):")
            import json
            print(json.dumps(response_json, indent=2))
            
            if response.status_code == 200:
                print("\n✓ LOGIN SUCCESSFUL!")
                if "access_token" in response_json:
                    print(f"  Token: {response_json['access_token'][:50]}...")
                if "user" in response_json:
                    user = response_json["user"]
                    print(f"  User: {user.get('full_name')} ({user.get('email')})")
                    print(f"  Role: {user.get('role')}")
                return True
            else:
                print(f"\n✗ LOGIN FAILED!")
                detail = response_json.get("detail", "Unknown error")
                message = response_json.get("message", detail)
                print(f"  Error: {message}")
                return False
                
        except requests.exceptions.JSONDecodeError:
            print(f"\nResponse Body (Text):")
            print(response.text)
            return False
    
    except requests.exceptions.ConnectionError as e:
        print(f"\n✗ CONNECTION ERROR: {e}")
        print(f"\nMake sure:")
        print(f"  1. Backend is running: python main.py")
        print(f"  2. Backend is on {base_url}")
        return False
    
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        return False


def get_all_users_api(base_url: str = "http://localhost:8000"):
    """Get list of all users via API (if endpoint exists)."""
    try:
        url = urljoin(base_url, "/api/v1/users")
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            print(f"\nUsers in database: {response.json()}")
            return True
    except:
        pass
    return False


def main():
    if len(sys.argv) < 3:
        print("""
Direct API Login Test
=====================

This tool tests the login API endpoint directly to see the exact error.

Usage:
    python test_api_login.py <email> <password> [base_url]

Examples:
    python test_api_login.py admin@example.com MyPassword123
    python test_api_login.py superadmin@techElect.com Super@Admin123
    python test_api_login.py admin@example.com Password123 http://localhost:8000

What this checks:
    ✓ API connectivity
    ✓ User lookup
    ✓ Password verification
    ✓ Account status
    ✓ Token generation

Common error codes:
    200 - Success
    401 - Invalid email or password
    403 - Account pending approval or blocked
    404 - User not found
    500 - Server error (check backend logs)
""")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    base_url = sys.argv[3] if len(sys.argv) > 3 else "http://localhost:8000"
    
    success = test_login_api(email, password, base_url)
    
    print("\n" + "=" * 80)
    if success:
        print("✓ API test passed")
    else:
        print("✗ API test failed")
        print("\nNext steps:")
        print("1. Check backend logs for detailed error messages")
        print("2. Run: python troubleshoot_login.py")
        print("3. Verify user exists: python debug_users.py")
    print("=" * 80 + "\n")
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
