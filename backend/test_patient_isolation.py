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

def run_tests():
    print("==================================================")
    print("RUNNING MULTI-PATIENT DATA ISOLATION TEST SUITE")
    print("==================================================")

    client_a = ApiClient()
    client_b = ApiClient()
    client_doc = ApiClient()

    ts = int(time.time())
    email_a = f"alpha_{ts}@isolation.test"
    email_b = f"beta_{ts}@isolation.test"
    doc_email = f"dr_smith_{ts}@isolation.test"
    password = "TestPassword123!"

    # 1. Register Patient A
    status_reg_a, res_reg_a, _ = client_a.request("POST", "/register", {
        "name": "Alpha Isolation",
        "email": email_a,
        "password": password,
        "age": 68,
        "gender": "Female",
        "is_caregiver": False
    })
    assert status_reg_a == 200, f"Register A failed: {res_reg_a}"
    patient_a_id = res_reg_a["id"]

    # Login Patient A
    status_log_a, res_log_a, _ = client_a.request("POST", "/login", {
        "email": email_a,
        "password": password
    })
    assert status_log_a == 200, f"Login A failed: {res_log_a}"
    client_a.token = res_log_a["access_token"]
    print(f"[PASSED] 1. Created Patient A (ID: {patient_a_id}) and obtained token")

    # 2. Register Patient B
    status_reg_b, res_reg_b, _ = client_b.request("POST", "/register", {
        "name": "Beta Isolation",
        "email": email_b,
        "password": password,
        "age": 72,
        "gender": "Male",
        "is_caregiver": False
    })
    assert status_reg_b == 200, f"Register B failed: {res_reg_b}"
    patient_b_id = res_reg_b["id"]

    # Login Patient B
    status_log_b, res_log_b, _ = client_b.request("POST", "/login", {
        "email": email_b,
        "password": password
    })
    assert status_log_b == 200, f"Login B failed: {res_log_b}"
    client_b.token = res_log_b["access_token"]
    print(f"[PASSED] 2. Created Patient B (ID: {patient_b_id}) and obtained token")

    # 3. Register Clinician
    status_reg_doc, res_reg_doc, _ = client_doc.request("POST", "/register", {
        "name": "Dr. Smith",
        "email": doc_email,
        "password": password,
        "age": 45,
        "gender": "Male",
        "role": "clinician",
        "is_caregiver": True
    })
    assert status_reg_doc == 200, f"Register Clinician failed: {res_reg_doc}"

    status_log_doc, res_log_doc, _ = client_doc.request("POST", "/login", {
        "email": doc_email,
        "password": password
    })
    assert status_log_doc == 200, f"Login Clinician failed: {res_log_doc}"
    client_doc.token = res_log_doc["access_token"]
    print(f"[PASSED] 3. Created Clinician (Dr. Smith) and obtained token")

    # 4. Verify Patient A Initial Empty State
    st_score_a, res_score_a, _ = client_a.request("GET", "/score")
    assert st_score_a == 404, f"Patient A should not have a score yet: {res_score_a}"
    st_hist_a, res_hist_a, _ = client_a.request("GET", "/scores/history")
    assert st_hist_a == 200 and res_hist_a == [], f"Patient A history should be empty: {res_hist_a}"
    print(f"[PASSED] 4. Verified Patient A starts with completely empty state (404 score, [] history)")

    # 5. Verify Patient B Initial Empty State
    st_score_b, res_score_b, _ = client_b.request("GET", "/score")
    assert st_score_b == 404, f"Patient B should not have a score yet: {res_score_b}"
    st_hist_b, res_hist_b, _ = client_b.request("GET", "/scores/history")
    assert st_hist_b == 200 and res_hist_b == [], f"Patient B history should be empty: {res_hist_b}"
    print(f"[PASSED] 5. Verified Patient B starts with completely empty state (404 score, [] history)")

    # 6. Verify Clinician Inspector for Patient A & B Empty States
    st_ov_a, ov_a, _ = client_doc.request("GET", f"/api/clinician/patients/{patient_a_id}/overview")
    assert st_ov_a == 200, f"Clinician overview for A failed: {ov_a}"
    assert ov_a["latest_score"] is None, f"Clinician overview for A latest_score should be None: {ov_a}"
    assert ov_a["score_history"] == [], f"Clinician overview for A score_history should be []"
    assert ov_a.get("domain_averages", ov_a.get("subtest_averages")) == {}, f"Clinician overview for A domain_averages should be {{}}"

    st_ov_b, ov_b, _ = client_doc.request("GET", f"/api/clinician/patients/{patient_b_id}/overview")
    assert st_ov_b == 200, f"Clinician overview for B failed: {ov_b}"
    assert ov_b["latest_score"] is None, f"Clinician overview for B latest_score should be None: {ov_b}"
    assert ov_b["score_history"] == [], f"Clinician overview for B score_history should be []"
    assert ov_b.get("domain_averages", ov_b.get("subtest_averages")) == {}, f"Clinician overview for B domain_averages should be {{}}"
    print(f"[PASSED] 6. Verified Clinician endpoints return None/[] for brand new patients")

    # 7. Grant Consent and Add assessment data ONLY for Patient A
    st_c, res_c, _ = client_a.request("POST", "/consent", {"consent_granted": True})
    assert st_c == 200, f"Consent A failed: {res_c}"

    st_t1, res_t1, _ = client_a.request("POST", "/tests", {
        "test_type": "pattern_recognition",
        "score": 85.0,
        "duration_seconds": 45
    })
    assert st_t1 == 200, f"Submit test 1 failed: {res_t1}"

    st_t2, res_t2, _ = client_a.request("POST", "/tests", {
        "test_type": "stroop",
        "score": 80.0,
        "duration_seconds": 60
    })
    assert st_t2 == 200, f"Submit test 2 failed: {res_t2}"

    st_sig, res_sig, _ = client_a.request("POST", "/signals", {
        "typing_speed": 62.0,
        "backspace_rate": 0.04,
        "scroll_hesitation": 0.08,
        "session_duration": 120
    })
    assert st_sig == 200, f"Submit signals failed: {res_sig}"

    st_calc_a, calc_res_a, _ = client_a.request("POST", "/score/calculate")
    assert st_calc_a == 200, f"Calculate A failed: {calc_res_a}"
    print(f"[PASSED] 7. Added assessment data and calculated CogniScore for Patient A only (Score: {calc_res_a['score']})")

    # 8. Verify Patient A now has score and history
    _, a_score_after, _ = client_a.request("GET", "/score")
    _, a_hist_after, _ = client_a.request("GET", "/scores/history")
    assert a_score_after["score"] is not None and a_score_after["score"] > 0
    assert len(a_hist_after) >= 1
    print(f"[PASSED] 8. Patient A sees their own score ({a_score_after['score']}) and history (count: {len(a_hist_after)})")

    # 9. Verify Patient B STILL HAS NO DATA (CRITICAL ISOLATION CHECK)
    st_b_score_after, res_b_score, _ = client_b.request("GET", "/score")
    assert st_b_score_after == 404, f"LEAK DETECTED: Patient B received a score! {res_b_score}"
    _, b_hist_after, _ = client_b.request("GET", "/scores/history")
    assert len(b_hist_after) == 0, f"LEAK DETECTED: Patient B received history! {b_hist_after}"
    
    _, ov_b_after, _ = client_doc.request("GET", f"/api/clinician/patients/{patient_b_id}/overview")
    assert ov_b_after["latest_score"] is None, f"LEAK DETECTED in clinician endpoint for B: {ov_b_after}"
    assert ov_b_after["score_history"] == [], f"LEAK DETECTED in clinician endpoint for B score_history"
    print(f"[PASSED] 9. Verified Patient B STILL has NO score and NO history (100% Data Isolation Confirmed!)")

    # 10. Verify PDF Report Endpoint Isolation
    st_pdf_a, res_pdf_a, hdr_a = client_doc.request("GET", f"/api/clinician/patients/{patient_a_id}/report-pdf")
    assert st_pdf_a == 200, f"Patient A PDF report generation failed: {res_pdf_a}"
    assert "application/pdf" in hdr_a.get("Content-Type", "")
    print(f"[PASSED] 10. Patient A PDF report generates successfully (200 OK, Content-Type: application/pdf)")

    st_pdf_b, res_pdf_b, _ = client_doc.request("GET", f"/api/clinician/patients/{patient_b_id}/report-pdf")
    assert st_pdf_b == 400, f"Patient B PDF report should return 400 when empty, got: {st_pdf_b}"
    print(f"[PASSED] 11. Patient B PDF report returns 400 with message: '{res_pdf_b['detail']}'")

    print("\n==================================================")
    print("ALL PATIENT DATA ISOLATION TESTS PASSED PERFECTLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
