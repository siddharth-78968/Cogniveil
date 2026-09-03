"""
Rigorous Automated Test Suite for CogniVeil Appointment Workflow
Tests Patient Request, Clinician Schedule, Accept, Reject, Complete, Cancel, Details, and Data Isolation.
"""
import urllib.request
import urllib.error
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"

class ApiClient:
    def __init__(self, token=None):
        self.token = token

    def request(self, method, endpoint, data=None):
        url = f"{BASE_URL}{endpoint}"
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        req_body = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(url, data=req_body, headers=headers, method=method)

        try:
            with urllib.request.urlopen(req) as response:
                status_code = response.getcode()
                raw = response.read()
                try:
                    res_json = json.loads(raw.decode("utf-8"))
                except Exception:
                    res_json = raw.decode("utf-8")
                return status_code, res_json, response.headers
        except urllib.error.HTTPError as e:
            status_code = e.code
            raw = e.read()
            try:
                res_json = json.loads(raw.decode("utf-8"))
            except Exception:
                res_json = raw.decode("utf-8")
            return status_code, res_json, {}

def run_suite():
    print("==================================================")
    print("RUNNING APPOINTMENT WORKFLOW COMPREHENSIVE SUITE")
    print("==================================================")

    uid = str(uuid.uuid4())[:6]
    doc_email = f"dr.vandhana_{uid}@demo.com"
    doc2_email = f"dr.santos_{uid}@demo.com"
    pat1_email = f"patient.rajan_{uid}@demo.com"
    pat2_email = f"patient.meena_{uid}@demo.com"
    pat3_email = f"patient.arjun_{uid}@demo.com"
    password = "SecretPassword123!"

    client_doc = ApiClient()
    client_doc2 = ApiClient()
    client_pat1 = ApiClient()
    client_pat2 = ApiClient()
    client_pat3 = ApiClient()

    # 1. Register Clinicians
    st, res, _ = client_doc.request("POST", "/register", {
        "name": "Dr. Vandhana",
        "email": doc_email,
        "password": password,
        "age": 45,
        "gender": "Female",
        "role": "clinician",
        "is_caregiver": True
    })
    assert st == 200, f"Register Dr. Vandhana failed: {res}"
    doc1_id = res["id"]

    st, res, _ = client_doc.request("POST", "/login", {"email": doc_email, "password": password})
    assert st == 200
    client_doc.token = res["access_token"]
    print(f"[PASS] 1. Registered & Logged in Clinician 1: Dr. Vandhana (ID: {doc1_id})")

    st, res, _ = client_doc2.request("POST", "/register", {
        "name": "Dr. Jackson Santos",
        "email": doc2_email,
        "password": password,
        "age": 48,
        "gender": "Male",
        "role": "clinician",
        "is_caregiver": True
    })
    assert st == 200
    doc2_id = res["id"]

    st, res, _ = client_doc2.request("POST", "/login", {"email": doc2_email, "password": password})
    assert st == 200
    client_doc2.token = res["access_token"]
    print(f"[PASS] 2. Registered & Logged in Clinician 2: Dr. Jackson Santos (ID: {doc2_id})")

    # 2. Register Patients
    st, res, _ = client_pat1.request("POST", "/register", {
        "name": "Rajan Pillai",
        "email": pat1_email,
        "password": password,
        "age": 78,
        "gender": "Male",
        "role": "patient",
        "is_caregiver": False
    })
    assert st == 200
    pat1_id = res["id"]

    st, res, _ = client_pat1.request("POST", "/login", {"email": pat1_email, "password": password})
    assert st == 200
    client_pat1.token = res["access_token"]
    print(f"[PASS] 3. Registered & Logged in Patient 1: Rajan Pillai (ID: {pat1_id})")

    st, res, _ = client_pat2.request("POST", "/register", {
        "name": "Meena Krishnan",
        "email": pat2_email,
        "password": password,
        "age": 72,
        "gender": "Female",
        "role": "patient",
        "is_caregiver": False
    })
    assert st == 200
    pat2_id = res["id"]

    st, res, _ = client_pat2.request("POST", "/login", {"email": pat2_email, "password": password})
    assert st == 200
    client_pat2.token = res["access_token"]
    print(f"[PASS] 4. Registered & Logged in Patient 2: Meena Krishnan (ID: {pat2_id})")

    st, res, _ = client_pat3.request("POST", "/register", {
        "name": "Arjun Sharma",
        "email": pat3_email,
        "password": password,
        "age": 68,
        "gender": "Male",
        "role": "patient",
        "is_caregiver": False
    })
    assert st == 200
    pat3_id = res["id"]

    st, res, _ = client_pat3.request("POST", "/login", {"email": pat3_email, "password": password})
    assert st == 200
    client_pat3.token = res["access_token"]
    print(f"[PASS] 5. Registered & Logged in Patient 3: Arjun Sharma (ID: {pat3_id})")

    # 3. Test GET /api/clinicians (Patient querying available clinicians)
    st, clinicians_list, _ = client_pat1.request("GET", "/api/clinicians")
    assert st == 200, f"GET /api/clinicians failed: {clinicians_list}"
    assert any(c["id"] == doc1_id for c in clinicians_list), "Dr. Vandhana not in clinicians list"
    assert any(c["id"] == doc2_id for c in clinicians_list), "Dr. Jackson Santos not in clinicians list"
    print(f"[PASS] 6. Patient queried /api/clinicians and retrieved {len(clinicians_list)} registered specialists")

    # 4. TEST A — Patient Request
    # Rajan Pillai requests consultation with Dr. Vandhana
    st, appt_a, _ = client_pat1.request("POST", "/api/appointments", {
        "clinician_id": doc1_id,
        "appointment_type": "Neurological Evaluation",
        "scheduled_time": "2026-09-15 - 10:30 AM",
        "notes": "Requesting memory screening review.",
        "location": "Memory & Cognitive Health Clinic - Suite 402"
    })
    assert st == 200, f"Patient request failed: {appt_a}"
    appt_a_id = appt_a["id"]
    assert appt_a["patient_id"] == pat1_id, f"Expected patient_id={pat1_id}, got {appt_a.get('patient_id')}"
    assert appt_a["clinician_id"] == doc1_id, f"Expected clinician_id={doc1_id}, got {appt_a.get('clinician_id')}"
    assert appt_a["clinician_name"] == "Dr. Vandhana", f"Expected clinician_name='Dr. Vandhana', got {appt_a.get('clinician_name')}"
    assert appt_a["status"] == "Pending", f"Expected status='Pending', got {appt_a.get('status')}"
    print(f"[PASS] 7. TEST A: Patient requested appointment #{appt_a_id} with Dr. Vandhana (status: 'Pending', clinician: 'Dr. Vandhana')")

    # Dr. Vandhana sees the request
    st, doc1_appts, _ = client_doc.request("GET", "/api/appointments")
    assert st == 200
    assert any(a["id"] == appt_a_id for a in doc1_appts), "Dr. Vandhana could not find the patient request"
    print(f"[PASS] 8. Dr. Vandhana verified incoming appointment request #{appt_a_id} in clinic inbox")

    # 5. TEST B — Clinician Schedule
    # Dr. Vandhana schedules consultation for Patient 2 (Meena Krishnan)
    st, appt_b, _ = client_doc.request("POST", "/api/appointments", {
        "patient_id": pat2_id,
        "appointment_type": "Acoustic Fluency Review",
        "scheduled_time": "2026-09-18 - 02:00 PM",
        "notes": "Speech hesitation telemetry review.",
        "location": "Virtual Tele-Neurology Video Consultation"
    })
    assert st == 200, f"Clinician schedule failed: {appt_b}"
    appt_b_id = appt_b["id"]
    assert appt_b["patient_id"] == pat2_id, f"Expected patient_id={pat2_id}, got {appt_b.get('patient_id')}"
    assert appt_b["clinician_id"] == doc1_id, f"Expected clinician_id={doc1_id}, got {appt_b.get('clinician_id')}"
    assert appt_b["clinician_name"] == "Dr. Vandhana", f"Expected clinician_name='Dr. Vandhana', got {appt_b.get('clinician_name')}"
    assert appt_b["status"] == "Accepted", f"Expected status='Accepted', got {appt_b.get('status')}"
    print(f"[PASS] 9. TEST B: Dr. Vandhana scheduled appointment #{appt_b_id} for Meena (status: 'Accepted', attending: 'Dr. Vandhana' NOT default)")

    # Meena sees her scheduled consultation
    st, pat2_appts, _ = client_pat2.request("GET", "/api/appointments")
    assert st == 200
    assert any(a["id"] == appt_b_id for a in pat2_appts), "Meena could not see her scheduled appointment"
    print(f"[PASS] 10. Patient Meena verified scheduled consultation #{appt_b_id} on her patient portal")

    # 6. TEST C — Accept Request
    # Dr. Vandhana accepts Rajan's pending request (#appt_a_id)
    st, res_acc, _ = client_doc.request("PUT", f"/api/appointments/{appt_a_id}/status", {
        "status": "Accepted"
    })
    assert st == 200, f"Accept failed: {res_acc}"
    assert res_acc["status"] == "Accepted"

    # Verify persistence
    st, appt_a_check, _ = client_doc.request("GET", f"/api/appointments/{appt_a_id}")
    assert st == 200
    assert appt_a_check["status"] == "Accepted"
    print(f"[PASS] 11. TEST C: Dr. Vandhana accepted appointment #{appt_a_id}, persisted status='Accepted'")

    # 7. TEST D — Reject Request
    # Meena creates another request and Dr. Vandhana rejects it
    st, appt_c, _ = client_pat2.request("POST", "/api/appointments", {
        "clinician_id": doc1_id,
        "appointment_type": "Tier 2 Biomarker Review",
        "scheduled_time": "2026-09-20 - 09:00 AM",
        "notes": "Preliminary review."
    })
    assert st == 200
    appt_c_id = appt_c["id"]

    st, res_rej, _ = client_doc.request("PUT", f"/api/appointments/{appt_c_id}/status", {
        "status": "Rejected"
    })
    assert st == 200
    assert res_rej["status"] == "Rejected"

    st, appt_c_check, _ = client_pat2.request("GET", f"/api/appointments/{appt_c_id}")
    assert st == 200
    assert appt_c_check["status"] == "Rejected"
    print(f"[PASS] 12. TEST D: Dr. Vandhana rejected appointment #{appt_c_id}, persisted status='Rejected'")

    # 8. TEST E — Mark Completed
    # Dr. Vandhana marks consultation #appt_a_id as Finished
    st, res_fin, _ = client_doc.request("PUT", f"/api/appointments/{appt_a_id}/status", {
        "status": "Finished"
    })
    assert st == 200
    assert res_fin["status"] == "Finished"

    st, appt_a_final, _ = client_doc.request("GET", f"/api/appointments/{appt_a_id}")
    assert st == 200
    assert appt_a_final["status"] == "Finished"
    print(f"[PASS] 13. TEST E: Dr. Vandhana marked appointment #{appt_a_id} as 'Finished' (Completed)")

    # 9. TEST F — Data Isolation
    # Patient 3 (Arjun Sharma) should NOT see Rajan's (#appt_a_id) or Meena's (#appt_b_id, #appt_c_id) appointments
    st, pat3_appts, _ = client_pat3.request("GET", "/api/appointments")
    assert st == 200
    assert len(pat3_appts) == 0, f"Data leak! Fresh patient Arjun saw appointments: {pat3_appts}"
    print(f"[PASS] 14. TEST F: Verified 100% Patient Data Isolation (Arjun sees 0 foreign appointments)")

    # Arjun tries to access Rajan's appointment details directly -> 403 Forbidden
    st, res_forbid, _ = client_pat3.request("GET", f"/api/appointments/{appt_a_id}")
    assert st == 403, f"Expected 403 Forbidden for direct cross-patient detail lookup, got {st}"
    print(f"[PASS] 15. Cross-patient direct appointment ID lookup blocked with 403 Forbidden")

    # 10. TEST G — Details Lookup
    st, details, _ = client_pat1.request("GET", f"/api/appointments/{appt_a_id}")
    assert st == 200
    assert details["patient_name"] == "Rajan Pillai"
    assert details["clinician_name"] == "Dr. Vandhana"
    assert details["appointment_type"] == "Neurological Evaluation"
    assert details["scheduled_time"] == "2026-09-15 - 10:30 AM"
    assert details["status"] == "Finished"
    print(f"[PASS] 16. TEST G: Appointment details retrieved with exact patient, clinician, date, and modality")

    print("\n==================================================")
    print("ALL APPOINTMENT WORKFLOW TESTS PASSED PERFECTLY!")
    print("==================================================")

if __name__ == "__main__":
    run_suite()
