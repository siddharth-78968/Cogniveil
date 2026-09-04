import requests

def test_demo_passthrough():
    base = 'http://127.0.0.1:8000'
    emails = [
        'riyamehta55@gmail.com', 
        'rajan@demo.com', 
        'meena@demo.com', 
        'arjun@demo.com', 
        'dr.arun@demo.com',
        'freshdemo@demo.com'
    ]

    print("=== 1. Testing /api/auth/demo Pass-Through Endpoint ===")
    for email in emails:
        res = requests.post(f"{base}/api/auth/demo?email={email}")
        assert res.status_code == 200, f"Failed for {email}: {res.text}"
        data = res.json()
        assert "access_token" in data, f"No token in response for {email}"
        user = data.get("user")
        assert user is not None, f"No user object in response for {email}"
        print(f"PASS: Demo auth for {email} -> Role: {user.get('role')}, Name: {user.get('name')}")

    print("\n=== 2. Testing /login Direct Pass-Through Without Password Verification ===")
    for email in emails:
        res = requests.post(f"{base}/login", json={"email": email, "password": "wrong_dummy_password"})
        assert res.status_code == 200, f"Login pass-through failed for {email}: {res.text}"
        data = res.json()
        assert "access_token" in data, f"No token in /login response for {email}"
        user = data.get("user")
        assert user is not None, f"No user object in /login response for {email}"
        print(f"PASS: /login pass-through for {email} -> Role: {user.get('role')}, Name: {user.get('name')}")

    print("\n=== 3. Testing Standard Non-Demo Account Still Rejects Wrong Password ===")
    res_invalid = requests.post(f"{base}/login", json={"email": "nonexistent_patient@gmail.com", "password": "wrongpassword"})
    assert res_invalid.status_code == 401, f"Expected 401 for non-demo invalid login, got {res_invalid.status_code}"
    print("PASS: Non-demo accounts continue to require valid credentials as expected.")

    print("\nALL DEMO PASS-THROUGH TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_demo_passthrough()
