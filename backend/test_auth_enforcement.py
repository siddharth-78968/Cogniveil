import sys
import os
import uuid
from fastapi import HTTPException

# Ensure backend dir is on path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import database
import models
import schemas
import main

def run_tests():
    print("=" * 70)
    print("COGNIVEIL DIRECT INTEGRATION TEST: 1 REGISTRATION PER GMAIL & LOGIN RESTRICTIONS")
    print("=" * 70)

    db = database.SessionLocal()
    try:
        unique_id = uuid.uuid4().hex[:8]
        test_email = f"testuser_{unique_id}@gmail.com"
        test_password = "SecretPassword123!"

        # 1. Register new email
        print(f"1. Testing standard registration for {test_email}...")
        reg_user = schemas.UserCreate(
            name="Alex Mercer",
            email=test_email,
            password=test_password,
            age=42,
            gender="Female",
            role="patient",
            is_caregiver=False
        )
        created = main.register(reg_user, db=db)
        assert created.email == test_email.lower(), f"Unexpected email: {created.email}"
        print(f"   [PASS] Registration succeeded for {created.email} (ID: {created.id})")

        # 2. Duplicate standard registration prevention
        print(f"2. Testing DUPLICATE standard registration prevention for {test_email}...")
        dup_user = schemas.UserCreate(
            name="Alex Mercer",
            email=test_email.upper(),
            password="AnotherPassword",
            age=42,
            gender="Female",
            role="patient",
            is_caregiver=False
        )
        dup_caught = False
        try:
            main.register(dup_user, db=db)
        except HTTPException as e:
            dup_caught = True
            assert e.status_code == 400
            assert "already registered" in e.detail.lower()
            print(f"   [PASS] Duplicate registration rejected with 400: '{e.detail}'")
        assert dup_caught, "Failed to reject duplicate registration!"

        # 3. Standard Login works
        print(f"3. Testing login for registered user {test_email}...")
        login_req = schemas.UserLogin(email=test_email, password=test_password)
        login_res = main.login(login_req, db=db)
        assert "access_token" in login_res, "Missing access_token"
        assert login_res["user"].email == test_email.lower()
        print(f"   [PASS] Login succeeded, access_token generated")

        # 4. Google initial enrollment (mode="register")
        google_email = f"googleuser_{unique_id}@gmail.com"
        print(f"4. Testing Google initial enrollment for {google_email} (mode='register')...")
        g_reg_req = schemas.GoogleLoginRequest(
            email=google_email,
            name="Google User",
            role="clinician",
            mode="register",
            password="GoogleSavedPass999!"
        )
        g_reg_res = main.google_login(g_reg_req, db=db)
        assert "access_token" in g_reg_res, "Missing access_token"
        assert g_reg_res["user"].email == google_email.lower()
        assert g_reg_res["user"].role == "clinician"
        print(f"   [PASS] Google enrollment succeeded (ID: {g_reg_res['user'].id}, Role: {g_reg_res['user'].role})")

        # 5. Duplicate Google enrollment prevention with same Gmail (mode="register")
        print(f"5. Testing DUPLICATE Google enrollment prevention for {google_email} (mode='register')...")
        g_dup_caught = False
        try:
            main.google_login(schemas.GoogleLoginRequest(
                email=google_email.upper(),
                name="Google User",
                role="clinician",
                mode="register"
            ), db=db)
        except HTTPException as e:
            g_dup_caught = True
            assert e.status_code == 400
            assert "already registered" in e.detail.lower()
            print(f"   [PASS] Duplicate Google enrollment rejected with 400: '{e.detail}'")
        assert g_dup_caught, "Failed to reject duplicate Google enrollment!"

        # 6. Google Login with registered Gmail (mode="login")
        print(f"6. Testing Google LOGIN for existing user {google_email} (mode='login')...")
        g_login_req = schemas.GoogleLoginRequest(
            email=google_email,
            name="Google User",
            role="clinician",
            mode="login"
        )
        g_login_res = main.google_login(g_login_req, db=db)
        assert "access_token" in g_login_res
        assert g_login_res["user"].email == google_email.lower()
        print(f"   [PASS] Google login succeeded for registered user")

        # 7. Google Login with UNREGISTERED Gmail (mode="login")
        unreg_email = f"unregistered_{unique_id}@gmail.com"
        print(f"7. Testing Google LOGIN rejection for unregistered account {unreg_email} (mode='login')...")
        unreg_caught = False
        try:
            main.google_login(schemas.GoogleLoginRequest(
                email=unreg_email,
                name="Unregistered User",
                role="patient",
                mode="login"
            ), db=db)
        except HTTPException as e:
            unreg_caught = True
            assert e.status_code == 404
            assert "no cogniveil account found" in e.detail.lower()
            print(f"   [PASS] Unregistered Google login correctly rejected with 404: '{e.detail}'")
        assert unreg_caught, "Failed to reject unregistered Google login!"

        # 8. Standard Login using password saved during Google enrollment
        print(f"8. Testing standard email/password login for Google account with saved password...")
        g_std_login = schemas.UserLogin(email=google_email, password="GoogleSavedPass999!")
        g_std_res = main.login(g_std_login, db=db)
        assert "access_token" in g_std_res
        assert g_std_res["user"].email == google_email.lower()
        print(f"   [PASS] Standard login with saved password succeeded for Google enrolled user")

        print("=" * 70)
        print("ALL AUTH ENFORCEMENT & CREDENTIAL PERSISTENCE TESTS PASSED!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
