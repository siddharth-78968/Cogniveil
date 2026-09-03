import urllib.request
import urllib.parse
import json
import os

BASE_URL = "http://127.0.0.1:8000"

def api_call_bytes(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {}
    if headers:
        req_headers.update(headers)
    
    encoded_data = None
    if data is not None:
        req_headers["Content-Type"] = "application/json"
        encoded_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
    
    with urllib.request.urlopen(req) as response:
        status_code = response.getcode()
        resp_headers = dict(response.headers)
        body = response.read()
        return status_code, resp_headers, body

def run_tests():
    print("=" * 75)
    print("COGNIVEIL CLINICAL REFERRAL REPORT & PDF GENERATION TEST SUITE")
    print("=" * 75)

    # 1. Clinician Authentication
    url = f"{BASE_URL}/api/auth/demo?email=clinician@demo.com"
    req = urllib.request.Request(url, data=b"", headers={}, method="POST")
    with urllib.request.urlopen(req) as resp:
        auth_data = json.loads(resp.read().decode("utf-8"))
    
    token = auth_data["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Clinician Authentication: HTTP 200 (Token acquired)")

    # 2. Test POST /api/clinical-report/pdf with custom screening payload
    payload = {
        "cogni_score": 62.5,
        "risk_level": "High",
        "is_deviating": True,
        "patient_name": "Rajan Pillai",
        "age": 78,
        "shap_features": [
            {"feature": "Sleep Quality", "value": 0.28, "input": "Poor", "is_modifiable": True},
            {"feature": "Age", "value": 0.31, "input": "78 yrs", "is_modifiable": False}
        ]
    }
    
    status, headers, pdf_bytes = api_call_bytes("/api/clinical-report/pdf", method="POST", data=payload, headers=auth_headers)
    assert status == 200, f"Expected 200, got {status}"
    
    # Verify Content-Type
    content_type = headers.get("content-type", headers.get("Content-Type", ""))
    assert "application/pdf" in content_type, f"Expected application/pdf, got {content_type}"
    print(f"[PASS] POST /api/clinical-report/pdf: Content-Type is '{content_type}'")
    
    # Verify Content-Disposition & Filename
    content_disp = headers.get("content-disposition", headers.get("Content-Disposition", ""))
    assert "attachment" in content_disp and "filename=" in content_disp, f"Invalid Content-Disposition: {content_disp}"
    assert "CogniVeil_Clinical_Referral_Report_Rajan_Pillai.pdf" in content_disp
    print(f"[PASS] Content-Disposition header verified: '{content_disp}'")
    
    # Verify PDF binary structure
    assert len(pdf_bytes) > 2000, f"PDF suspiciously small: {len(pdf_bytes)} bytes"
    assert pdf_bytes.startswith(b"%PDF-"), "File does not start with valid PDF magic bytes (%PDF-)"
    assert b"%%EOF" in pdf_bytes, "PDF does not contain valid EOF marker"
    print(f"[PASS] PDF Binary Structure Valid: Size = {len(pdf_bytes)} bytes, Magic Bytes = '{pdf_bytes[:8].decode('ascii', errors='ignore')}'")

    # 3. Test GET /api/clinician/patients/1/report-pdf
    status, headers, pat_pdf = api_call_bytes("/api/clinician/patients/1/report-pdf", method="GET", headers=auth_headers)
    assert status == 200, f"Patient PDF download failed with status {status}"
    pat_ct = headers.get("content-type", headers.get("Content-Type", ""))
    assert "application/pdf" in pat_ct
    assert len(pat_pdf) > 2000
    assert pat_pdf.startswith(b"%PDF-")
    print(f"[PASS] GET /api/clinician/patients/1/report-pdf: HTTP 200 (Size: {len(pat_pdf)} bytes)")

    # 4. Save generated PDF to disk for manual inspection
    out_path = os.path.join(os.path.dirname(__file__), "test_referral_report.pdf")
    with open(out_path, "wb") as f:
        f.write(pdf_bytes)
    print(f"[PASS] Generated PDF saved successfully to: {out_path}")

    print("=" * 75)
    print("ALL CLINICAL REFERRAL REPORT PDF INTEGRATION TESTS PASSED (100%)")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()
