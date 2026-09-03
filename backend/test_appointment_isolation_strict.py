import sys
import os
import time
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def api_call(path, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    url = f"{BASE_URL}{path}"
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"error": body}
        return e.code, parsed

def register_and_login(name, email, password, age=65, is_caregiver=False, role="patient"):
    st_reg, res_reg = api_call("/register", method="POST", data={
        "name": name,
        "email": email,
        "password": password,
        "age": age,
        "gender": "Other",
        "is_caregiver": is_caregiver,
        "role": role,
        "consent_granted": True
    })
    assert st_reg == 200, f"Registration failed for {email}: {st_reg} {res_reg}"
    
    st_log, res_log = api_call("/login", method="POST", data={
        "email": email,
        "password": password
    })
    assert st_log == 200, f"Login failed for {email}: {st_log} {res_log}"
    return res_log["access_token"], res_reg

def run_strict_isolation_tests():
    print("=" * 70)
    print("COGNIVEIL STRICT PATIENT APPOINTMENT DATA ISOLATION TEST SUITE")
    print("=" * 70)

    # Ping backend
    st, res = api_call("/")
    assert st == 200, f"Backend not reachable: {st} {res}"
    print("[PASS] 0. Backend server is alive (200 OK).")

    # 1. Setup Patient Alpha and Patient Beta
    ts = int(time.time() * 1000)
    pat_a_email = f"patient_a_{ts}@isolation.test"
    pat_b_email = f"patient_b_{ts}@isolation.test"
    doc_email = f"doctor_{ts}@isolation.test"

    token_a, user_a = register_and_login("Patient Alpha", pat_a_email, "Password123!", age=65)
    headers_a = {"Authorization": f"Bearer {token_a}"}

    token_b, user_b = register_and_login("Patient Beta", pat_b_email, "Password123!", age=70)
    headers_b = {"Authorization": f"Bearer {token_b}"}

    token_doc, user_doc = register_and_login("Dr. Sarah Miller", doc_email, "Password123!", age=45, is_caregiver=True, role="clinician")
    headers_doc = {"Authorization": f"Bearer {token_doc}"}

    # Verify initial appointment lists are empty for newly created patients
    st, res_a_init = api_call("/api/appointments", headers=headers_a)
    assert st == 200
    assert len(res_a_init) == 0, f"Patient A should have 0 appointments initially, got {res_a_init}"
    print("[PASS] 1. New patient initial appointment list is empty (0 appointments).")

    # 2. Patient Alpha requests an appointment
    st, res_create_a = api_call("/api/appointments", method="POST", data={
        "appointment_type": "Comprehensive Neurological Evaluation",
        "scheduled_time": "2026-09-12 - 10:00 AM",
        "location": "Memory & Cognitive Health Clinic - Suite 402",
        "notes": "Patient A experiencing memory drift."
    }, headers=headers_a)
    assert st == 200, f"Failed to create appointment for Patient Alpha: {st} {res_create_a}"
    appt_a_id = res_create_a["id"]
    assert res_create_a["patient_name"] == "Patient Alpha"
    print(f"[PASS] 2. Created appointment #{appt_a_id} for Patient Alpha.")

    # 3. Patient Alpha fetches appointments -> MUST see appointment A
    st, appts_a = api_call("/api/appointments", headers=headers_a)
    assert st == 200
    assert len(appts_a) == 1
    assert appts_a[0]["id"] == appt_a_id
    assert appts_a[0]["patient_name"] == "Patient Alpha"
    print(f"[PASS] 3. Patient Alpha sees ONLY their own appointment #{appt_a_id}.")

    # 4. Patient Beta fetches appointments -> MUST NOT see Patient Alpha's appointment (MUST be 0)
    st, appts_b = api_call("/api/appointments", headers=headers_b)
    assert st == 200
    assert len(appts_b) == 0, f"Patient Beta should NOT see Patient Alpha's appointment, but got {appts_b}"
    print("[PASS] 4. Patient Beta query returns 0 appointments (Patient Alpha's data is isolated).")

    # 5. Patient Beta attempts direct access to Patient Alpha's appointment ID -> MUST return 403 Forbidden
    st, res_direct = api_call(f"/api/appointments/{appt_a_id}", headers=headers_b)
    assert st == 403, f"Expected 403 Forbidden for unauthorized appointment detail, got {st} {res_direct}"
    print(f"[PASS] 5. GET /api/appointments/{appt_a_id} rejected with 403 Forbidden for Patient Beta.")

    # 6. Patient Beta attempts to update Patient Alpha's appointment status -> MUST return 403 Forbidden
    st, res_update_attack = api_call(f"/api/appointments/{appt_a_id}/status", method="PUT", data={"status": "Cancelled"}, headers=headers_b)
    assert st == 403, f"Expected 403 Forbidden for unauthorized status update, got {st} {res_update_attack}"
    print(f"[PASS] 6. PUT /api/appointments/{appt_a_id}/status rejected with 403 Forbidden for Patient Beta.")

    # 7. Patient Beta attempts to delete Patient Alpha's appointment -> MUST return 403 Forbidden
    st, res_del_attack = api_call(f"/api/appointments/{appt_a_id}", method="DELETE", headers=headers_b)
    assert st == 403, f"Expected 403 Forbidden for unauthorized delete, got {st} {res_del_attack}"
    print(f"[PASS] 7. DELETE /api/appointments/{appt_a_id} rejected with 403 Forbidden for Patient Beta.")

    # 8. Patient Beta creates their own appointment
    st, res_create_b = api_call("/api/appointments", method="POST", data={
        "appointment_type": "Acoustic Fluency Battery",
        "scheduled_time": "2026-09-14 - 03:00 PM",
        "location": "Memory & Cognitive Health Clinic - Suite 402",
        "notes": "Patient B speech fluency consultation."
    }, headers=headers_b)
    assert st == 200
    appt_b_id = res_create_b["id"]
    print(f"[PASS] 8. Created appointment #{appt_b_id} for Patient Beta.")

    # 9. Verify Patient Beta sees ONLY appointment B, and Patient Alpha sees ONLY appointment A
    st, appts_b_final = api_call("/api/appointments", headers=headers_b)
    assert st == 200
    assert len(appts_b_final) == 1
    assert appts_b_final[0]["id"] == appt_b_id
    assert appts_b_final[0]["patient_name"] == "Patient Beta"

    st, appts_a_final = api_call("/api/appointments", headers=headers_a)
    assert st == 200
    assert len(appts_a_final) == 1
    assert appts_a_final[0]["id"] == appt_a_id
    assert appts_a_final[0]["patient_name"] == "Patient Alpha"
    print("[PASS] 9. Bi-directional isolation confirmed: Patient Alpha and Patient Beta see only their own respective appointments.")

    # 10. Spoofing test: Patient Alpha tries to create appointment supplying a fake patient_name/patient_id in payload
    st, spoofed_appt = api_call("/api/appointments", method="POST", data={
        "patient_id": 99999,
        "patient_name": "Spoofed Patient Name",
        "appointment_type": "Spoofed Consultation",
        "scheduled_time": "2026-09-20 - 11:00 AM",
        "notes": "Spoof test."
    }, headers=headers_a)
    assert st == 200
    assert spoofed_appt["patient_name"] == "Patient Alpha", f"Backend must derive patient_name from token, got {spoofed_appt['patient_name']}"
    print("[PASS] 10. Patient cannot spoof appointment identity (derived strictly from authenticated token).")

    # 11. Test Existing Demo Accounts
    print("\n--- Testing Existing Demo Accounts ---")
    demo_accounts = [
        ("rajan@demo.com", "demo1234", "Rajan Pillai"),
        ("meena@demo.com", "demo1234", "Meena Krishnan"),
        ("arjun@demo.com", "demo1234", "Arjun Sharma"),
    ]

    for email, pwd, expected_name in demo_accounts:
        st_login, res_login = api_call("/login", method="POST", data={"email": email, "password": pwd})
        assert st_login == 200, f"Login failed for {email}: {st_login} {res_login}"
        tok = res_login["access_token"]
        h = {"Authorization": f"Bearer {tok}"}
        st_appts, demo_appts = api_call("/api/appointments", headers=h)
        assert st_appts == 200, f"GET /api/appointments failed for {email}: {st_appts} {demo_appts}"
        for a in demo_appts:
            assert a["patient_name"] == expected_name, f"Demo account {email} returned appointment for '{a['patient_name']}' instead of '{expected_name}'!"
        print(f"[PASS] Demo patient '{expected_name}' ({email}) sees only their own consultations ({len(demo_appts)} items, 0 foreign records).")

    print("\n" + "=" * 70)
    print("ALL PATIENT DATA ISOLATION TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_strict_isolation_tests()
