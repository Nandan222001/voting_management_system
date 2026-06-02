import requests

def test_public_elections_no_tenant():
    url = "http://localhost:8000/api/v1/elections/public"
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")
    assert response.status_code == 400
    assert "Tenant identification required" in response.json()["detail"]

if __name__ == "__main__":
    try:
        test_public_elections_no_tenant()
        print("Reproduction successful: 400 Bad Request returned as expected.")
    except Exception as e:
        print(f"Reproduction failed or error occurred: {e}")
