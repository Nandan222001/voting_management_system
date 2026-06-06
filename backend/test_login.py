import os
import requests

# Test script to check login responsiveness
# Set TEST_USERNAME and TEST_PASSWORD env vars before running
url = "http://localhost:8000/api/v1/auth/login"
data = {
    "username": os.environ.get("TEST_USERNAME", ""),
    "password": os.environ.get("TEST_PASSWORD", ""),
}

print(f"Sending POST to {url}...")
try:
    response = requests.post(url, data=data, timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
