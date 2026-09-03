import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:8000"

def api_call(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
    
    with urllib.request.urlopen(req) as response:
        status_code = response.getcode()
        body = json.loads(response.read().decode("utf-8"))
        return status_code, body

def run_tests():
    print("=" * 70)
    print("COGNIVEIL CLINICIAN WORKSPACE AUTOMATED VERIFICATION SUITE")
    print("=" * 70)

    # 1. Clinician Authentication via demo auth
    status, auth_res = api_call("/api/auth/demo?email=clinician@demo.com", method="POST")
    assert status == 200, f"Clinician login failed: {auth_res}"
    token = auth_res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Clinician Authentication: HTTP 200 (Bearer Token acquired)")

    # 2. Get Monitored Patients Cohort
    status, patients = api_call("/api/clinician/patients", headers=headers)
    assert status == 200, f"Get patients failed: {patients}"
    assert isinstance(patients, list) and len(patients) > 0, "No patients returned"
    print(f"[PASS] GET /api/clinician/patients: HTTP 200 (Cohort size: {len(patients)} patients)")
    sample_patient_id = patients[0]["id"]

    # 3. Patient Detailed Overview
    status, ov = api_call(f"/api/clinician/patients/{sample_patient_id}/overview", headers=headers)
    assert status == 200, f"Get overview failed: {ov}"
    assert "patient" in ov and "latest_score" in ov, "Malformed patient overview"
    print(f"[PASS] GET /api/clinician/patients/{sample_patient_id}/overview: HTTP 200 (Patient: {ov['patient']['name']})")

    # 4. Cognitive Battery Results & Domain Psychometrics
    status, tests_data = api_call(f"/api/clinician/patients/{sample_patient_id}/tests", headers=headers)
    assert status == 200, f"Get tests failed: {tests_data}"
    assert "domain_breakdown" in tests_data and len(tests_data["domain_breakdown"]) == 5
    print(f"[PASS] GET /api/clinician/patients/{sample_patient_id}/tests: HTTP 200 (5 Psychometric Domains Normed)")

    # 5. Acoustic Voice Biomarkers Review
    status, v_data = api_call(f"/api/clinician/patients/{sample_patient_id}/voice", headers=headers)
    assert status == 200, f"Get voice failed: {v_data}"
    assert "acoustic_profile" in v_data and "mean_pause_duration_ms" in v_data["acoustic_profile"]
    print(f"[PASS] GET /api/clinician/patients/{sample_patient_id}/voice: HTTP 200 (Mean Pause: {v_data['acoustic_profile']['mean_pause_duration_ms']}ms)")

    # 6. Tier 2 CatBoost ML & TreeSHAP Attributions
    status, l2_data = api_call(f"/api/clinician/patients/{sample_patient_id}/level2", headers=headers)
    assert status == 200, f"Get Level 2 failed: {l2_data}"
    assert "prediction" in l2_data, "No prediction found"
    pred = l2_data["prediction"]
    has_shap = "top_features" in pred or "shap_features" in pred or "modifiable_drivers" in pred
    assert has_shap, f"No SHAP features in prediction: {pred.keys()}"
    print(f"[PASS] GET /api/clinician/patients/{sample_patient_id}/level2: HTTP 200 (Risk Probability: {round(pred['probability']*100)}%)")

    # 7. Tier 3 Structural MRI & Grad-CAM Analysis
    status, mri_data = api_call(f"/api/clinician/patients/{sample_patient_id}/mri", headers=headers)
    assert status == 200, f"Get MRI failed: {mri_data}"
    assert "mri_analysis" in mri_data and "volumetric_metrics" in mri_data["mri_analysis"]
    print(f"[PASS] GET /api/clinician/patients/{sample_patient_id}/mri: HTTP 200 (CDR Stage: {mri_data['mri_analysis']['cdr_stage']})")

    # 8. Clinical Appointments
    status, appts = api_call("/api/appointments", headers=headers)
    assert status == 200, f"Get appointments failed: {appts}"
    print(f"[PASS] GET /api/appointments: HTTP 200 ({len(appts)} scheduled consultations)")

    print("=" * 70)
    print("ALL CLINICIAN WORKSPACE INTEGRATION TESTS PASSED (100%)")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
