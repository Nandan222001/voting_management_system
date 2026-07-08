import requests
import json

def test_api():
    base_url = "http://localhost:8000/api/v1"
    
    # 1. Login as follower
    # (Using the follower user created in previous steps)
    print("Logging in as follower...")
    login_data = {
        "username": "follower@test.com",
        "password": "password123"
    }
    response = requests.post(f"{base_url}/auth/login", data=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.status_code}")
        print(f"Response Body: {response.text}")
        return
    
    token = response.json().get("data", {}).get("access_token")
    if not token:
        print("No access token in response!")
        return
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Test following-count
    print("\nTesting /candidates/me/following-count...")
    response = requests.get(f"{base_url}/candidates/me/following-count", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 200
    assert response.json()["data"]["count"] >= 1
    
    # 3. Test following list
    print("\nTesting /candidates/me/following...")
    response = requests.get(f"{base_url}/candidates/me/following", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 200
    assert len(response.json()["data"]) >= 1
    assert any(c["email"] == "candidate@test.com" for c in response.json()["data"])
    
    print("\n✓ Following API Verification successful!")

if __name__ == "__main__":
    test_api()
