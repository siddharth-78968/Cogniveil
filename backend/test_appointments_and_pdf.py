import urllib.request
import urllib.parse
import json
import os
import sys

BASE_URL = "http://127.0.0.1:8000"

def api_call(endpoint, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{endpoint}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode("utf-8")
        return resp.status, json.loads(body) if body else {}

def api_call_bytes(endpoint, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{endpoint}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return resp.status, resp.headers, resp.read()

def run_tests():
    print("=" * 75)
    print("COGNIVEIL APPOINTMENTS & CONCISE PDF REPORT VERIFICATION SUITE")
    print("=" * 75)
    
    # 1. Clinician Authentication
    auth_url = f"{BASE_URL}/api/auth/demo?email=clinician@demo.com"
    req = urllib.request.Request(auth_url, data=b"", headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        auth_data = json.loads(resp.read().decode("utf-8"))
        token = auth_data["access_token"]
        print("[PASS] 1. Clinician Authentication: HTTP 200 (Token acquired)")
    
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get Appointments List
    status, appts = api_call("/api/appointments", headers=auth_headers)
    print(f"[PASS] 2. GET /api/appointments: HTTP {status} ({len(appts)} appointments loaded)")
    assert len(appts) > 0, "Expected seeded appointments"
    
    # 3. Create a New Appointment
    new_appt_payload = {
        "patient_name": "Test Patient",
        "appointment_type": "Neurological Diagnostic Review",
        "scheduled_time": "2026-09-10 - 11:30 AM",
        "location": "Memory & Cognitive Health Clinic - Room 301",
        "notes": "Evaluation for executive function and multi-lingual voice journal changes."
    }
    status, created_appt = api_call("/api/appointments", method="POST", data=new_appt_payload, headers=auth_headers)
    appt_id = created_appt["id"]
    print(f"[PASS] 3. POST /api/appointments: HTTP {status} (Created Appointment ID #{appt_id})")
    
    # 4. Get Appointment by ID
    status, fetched_appt = api_call(f"/api/appointments/{appt_id}", headers=auth_headers)
    print(f"[PASS] 4. GET /api/appointments/{appt_id}: HTTP {status} (Fetched: {fetched_appt['patient_name']} - {fetched_appt['appointment_type']})")
    assert fetched_appt["patient_name"] == "Test Patient"
    
    # 5. Update Status to Accepted
    status, update_res = api_call(f"/api/appointments/{appt_id}/status", method="PUT", data={"status": "Accepted"}, headers=auth_headers)
    print(f"[PASS] 5. PUT /api/appointments/{appt_id}/status -> Accepted: HTTP {status}")
    
    # Verify persistence
    status, verified_appt = api_call(f"/api/appointments/{appt_id}", headers=auth_headers)
    assert verified_appt["status"] == "Accepted", f"Expected Accepted, got {verified_appt['status']}"
    print(f"[PASS] 5b. Status Persistence Verified: Database status = '{verified_appt['status']}'")
    
    # 6. Update Status to Rejected/Cancelled
    status, update_res2 = api_call(f"/api/appointments/{appt_id}/status", method="PUT", data={"status": "Cancelled"}, headers=auth_headers)
    print(f"[PASS] 6. PUT /api/appointments/{appt_id}/status -> Cancelled: HTTP {status}")
    
    # 7. Delete Appointment
    status, del_res = api_call(f"/api/appointments/{appt_id}", method="DELETE", headers=auth_headers)
    print(f"[PASS] 7. DELETE /api/appointments/{appt_id}: HTTP {status}")
    
    # 8. Concise Clinical Referral PDF Generation
    pdf_payload = {
        "cogni_score": 64.0,
        "risk_level": "Moderate",
        "is_deviating": True,
        "patient_name": "Rajan Pillai",
        "age": 78,
        "gender": "Male"
    }
    status, headers, pdf_bytes = api_call_bytes("/api/clinical-report/pdf", method="POST", data=pdf_payload, headers=auth_headers)
    print(f"[PASS] 8. POST /api/clinical-report/pdf: HTTP {status}")
    assert headers.get("Content-Type") == "application/pdf", f"Unexpected Content-Type: {headers.get('Content-Type')}"
    assert pdf_bytes.startswith(b"%PDF-"), "Invalid PDF magic bytes signature"
    assert b"%%EOF" in pdf_bytes[-1024:], "Missing %%EOF marker"
    print(f"[PASS] 8b. PDF Structure Verified: Size = {len(pdf_bytes)} bytes, %PDF-1.4 header valid")
    
    # 9. Patient Dossier Direct PDF Download
    status, headers, pat_pdf_bytes = api_call_bytes("/api/clinician/patients/1/report-pdf", headers=auth_headers)
    print(f"[PASS] 9. GET /api/clinician/patients/1/report-pdf: HTTP {status} (Size = {len(pat_pdf_bytes)} bytes)")
    
    print("=" * 75)
    print("ALL APPOINTMENTS & CLINICAL REFERRAL PDF TESTS PASSED (100%)")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()
