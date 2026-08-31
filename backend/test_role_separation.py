import sys
import os
import json
import time
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

class ApiClient:
    def __init__(self):
        self.token = None

    def request(self, method, path, data=None):
        url = f"{BASE_URL}{path}"
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        body = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        
        try:
            with urllib.request.urlopen(req) as response:
                content_type = response.headers.get("Content-Type", "")
                raw = response.read()
                if "application/json" in content_type:
                    return response.status, json.loads(raw.decode("utf-8")), response.headers
                return response.status, raw, response.headers
        except urllib.error.HTTPError as e:
            raw = e.read()
            try:
                err_json = json.loads(raw.decode("utf-8"))
            except Exception:
                err_json = {"detail": raw.decode("utf-8", errors="ignore")}
            return e.code, err_json, e.headers

def run_role_separation_suite():
    print("==================================================")
    print("RUNNING ROLE SEPARATION & AUTHORIZATION TEST SUITE")
    print("==================================================")

    client_patient = ApiClient()
    client_patient_b = ApiClient()
    client_clinician = ApiClient()

    ts = int(time.time() * 1000)
    email_pat = f"patient_{ts}@cogniveil.test"
    email_pat_b = f"patient_b_{ts}@cogniveil.test"
    email_doc = f"dr_santos_{ts}@cogniveil.test"
    password = "SecurePassword123!"

    # 1. Register Patient with role="patient"
    print("\n[TEST 1] Register Patient with explicit role='patient'")
    status, res, _ = client_patient.request("POST", "/register", {
        "name": "Evelyn Harper",
        "email": email_pat,
        "password": password,
        "age": 64,
        "gender": "Female",
        "role": "patient",
        "is_caregiver": False
    })
    assert status == 200, f"Patient register failed: {res}"
    assert res.get("role") == "patient", f"Expected role 'patient', got {res.get('role')}"
    assert res.get("is_caregiver") is False
    patient_id = res["id"]
    print(f"[PASS] Patient registered with id={patient_id}, role={res.get('role')}")

    # 2. Login Patient & Check Token and User Profile
    print("\n[TEST 2] Login Patient and verify user profile in response")
    status, res, _ = client_patient.request("POST", "/login", {
        "email": email_pat,
        "password": password
    })
    assert status == 200, f"Patient login failed: {res}"
    assert "access_token" in res, "Missing access_token"
    assert res.get("user", {}).get("role") == "patient", f"Expected user.role == 'patient', got {res.get('user')}"
    client_patient.token = res["access_token"]
    print("[PASS] Patient logged in successfully with valid JWT token & role='patient'")

    # 3. Register Clinician with role="clinician"
    print("\n[TEST 3] Register Clinician with explicit role='clinician'")
    status, res, _ = client_clinician.request("POST", "/register", {
        "name": "Dr. Jackson Santos",
        "email": email_doc,
        "password": password,
        "age": 49,
        "gender": "Male",
        "role": "clinician",
        "is_caregiver": True
    })
    assert status == 200, f"Clinician register failed: {res}"
    assert res.get("role") == "clinician", f"Expected role 'clinician', got {res.get('role')}"
    assert res.get("is_caregiver") is True
    clinician_id = res["id"]
    print(f"[PASS] Clinician registered with id={clinician_id}, role={res.get('role')}")

    # 4. Login Clinician & Check Token and User Profile
    print("\n[TEST 4] Login Clinician and verify user profile in response")
    status, res, _ = client_clinician.request("POST", "/login", {
        "email": email_doc,
        "password": password
    })
    assert status == 200, f"Clinician login failed: {res}"
    assert res.get("user", {}).get("role") == "clinician"
    client_clinician.token = res["access_token"]
    print("[PASS] Clinician logged in successfully with valid JWT token & role='clinician'")

    # 5. Unauthenticated Access Blocked
    print("\n[TEST 5] Unauthenticated request to /api/clinician/patients must return 401")
    anon_client = ApiClient()
    status, res, _ = anon_client.request("GET", "/api/clinician/patients")
    assert status == 401, f"Expected 401 Unauthorized, got {status}"
    print(f"[PASS] Unauthenticated request blocked with status {status}")

    # 6. Patient Forbidden from Clinician Endpoints (403 Forbidden)
    print("\n[TEST 6] Patient calling clinician-only endpoints must return 403 Forbidden")
    status, res, _ = client_patient.request("GET", "/api/clinician/patients")
    assert status == 403, f"Expected 403 Forbidden, got {status}: {res}"
    print(f"[PASS] Patient GET /api/clinician/patients blocked with 403 Forbidden ({res.get('detail')})")

    status, res, _ = client_patient.request("GET", f"/api/clinician/patients/{patient_id}/overview")
    assert status == 403, f"Expected 403 Forbidden, got {status}: {res}"
    print(f"[PASS] Patient GET /api/clinician/patients/{patient_id}/overview blocked with 403 Forbidden")

    status, res, _ = client_patient.request("GET", f"/api/clinician/patients/{patient_id}/report-pdf")
    assert status == 403, f"Expected 403 Forbidden, got {status}: {res}"
    print(f"[PASS] Patient GET /api/clinician/patients/{patient_id}/report-pdf blocked with 403 Forbidden")

    # 7. Clinician Authorized to Access Clinician Endpoints (200 OK)
    print("\n[TEST 7] Clinician calling /api/clinician/patients must return 200 OK")
    status, res, _ = client_clinician.request("GET", "/api/clinician/patients")
    assert status == 200, f"Expected 200 OK, got {status}: {res}"
    assert isinstance(res, list), "Expected list of patients"
    print(f"[PASS] Clinician successfully retrieved {len(res)} patient records")

    # 8. Appointments Data Isolation: New Patient starts with 0 appointments (No mock bleed)
    print("\n[TEST 8] Appointments Data Isolation: New Patient starts with empty registry")
    status, res, _ = client_patient.request("GET", "/api/appointments")
    assert status == 200, f"GET /api/appointments failed: {res}"
    assert len(res) == 0, f"Expected 0 appointments for fresh patient, but found {len(res)}: {res}"
    print("[PASS] Fresh patient appointment roster is clean (0 fake/mock appointments)")

    # 9. Patient creates an appointment & only sees their own
    print("\n[TEST 9] Patient schedules consultation request")
    status, res, _ = client_patient.request("POST", "/api/appointments", {
        "appointment_type": "Neurological Consultation",
        "scheduled_time": "2026-09-15 - 10:30 AM",
        "notes": "Review memory fluctuations over the last month."
    })
    assert status == 200, f"Create appointment failed: {res}"
    appt_id = res["id"]
    assert res["status"] == "Pending", f"Expected 'Pending' status, got {res['status']}"
    assert res["patient_name"] == "Evelyn Harper"
    print(f"[PASS] Patient created appointment #{appt_id} with status='Pending'")

    status, res, _ = client_patient.request("GET", "/api/appointments")
    assert status == 200
    assert len(res) == 1, f"Expected 1 appointment, got {len(res)}"
    assert res[0]["id"] == appt_id
    print("[PASS] Patient only sees their own scheduled appointment")

    # 10. Appointment Authorization: Patient B cannot modify Patient A's appointment
    print("\n[TEST 10] Appointment Authorization: Patient B cannot modify Patient A's appointment")
    status, reg_b, _ = client_patient_b.request("POST", "/register", {
        "name": "Frankie Patient B",
        "email": email_pat_b,
        "password": password,
        "age": 57,
        "role": "patient"
    })
    login_b = client_patient_b.request("POST", "/login", {"email": email_pat_b, "password": password})[1]
    client_patient_b.token = login_b["access_token"]

    # Patient B tries to update Patient A's appointment
    status, res, _ = client_patient_b.request("PUT", f"/api/appointments/{appt_id}/status", {
        "status": "Accepted"
    })
    assert status == 403, f"Expected 403 Forbidden for unauthorized update, got {status}: {res}"
    print(f"[PASS] Patient B unauthorized modification blocked with 403 Forbidden ({res.get('detail')})")

    # Clinician CAN accept the appointment
    status, res, _ = client_clinician.request("PUT", f"/api/appointments/{appt_id}/status", {
        "status": "Accepted"
    })
    assert status == 200, f"Clinician update failed: {res}"
    assert res["status"] == "Accepted"
    print(f"[PASS] Clinician successfully triaged and updated appointment #{appt_id} to 'Accepted'")

    print("\n==================================================")
    print("ALL 10 ROLE SEPARATION & RBAC ASSERTIONS PASSED! [PASS]")
    print("==================================================")

if __name__ == "__main__":
    run_role_separation_suite()
