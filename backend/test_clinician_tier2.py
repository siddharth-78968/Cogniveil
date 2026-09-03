import sys
import os
import json
import urllib.request
import urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models
import auth

BASE_URL = "http://127.0.0.1:8000"

def make_req(path, token=None):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return resp.status, data
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            data = json.loads(body)
        except Exception:
            data = body
        return e.code, data

def test_clinician_tier2_flow():
    print("=================================================================")
    print("TESTING CLINICIAN TIER 2 PATIENT SELECTION & ML PREDICTION FLOW")
    print("=================================================================")
    
    db = SessionLocal()
    try:
        # 1. Find a clinician
        clinician = db.query(models.User).filter(models.User.is_caregiver == True).first()
        if not clinician:
            print("[FAIL] No clinician user found in database.")
            return False
            
        print(f"[OK] Clinician identified: {clinician.name} (ID: {clinician.id}, Email: {clinician.email})")
        
        # Generate clinician JWT
        token = auth.create_access_token(data={"sub": clinician.email})
        
        # 2. Test /api/clinician/patients
        status_code, patients = make_req("/api/clinician/patients", token=token)
        assert status_code == 200, f"Expected 200, got {status_code}: {patients}"
        assert isinstance(patients, list), "Expected list of patients"
        assert len(patients) > 0, "Expected at least 1 patient"
        print(f"[PASS] 1. /api/clinician/patients returned {len(patients)} authorized patients:")
        for p in patients[:5]:
            print(f"   - ID: {p.get('id')}, Name: {p.get('name')}, Age: {p.get('age')}")
            
        # 3. Test selecting each patient and verifying /api/clinician/patients/{id}/level2
        for target_patient in patients[:3]:
            p_id = target_patient["id"]
            status_code, l2_data = make_req(f"/api/clinician/patients/{p_id}/level2", token=token)
            assert status_code == 200, f"Expected 200 for patient {p_id}, got {status_code}: {l2_data}"
            
            assert "prediction" in l2_data, "Missing prediction in level2 response"
            assert "patient_name" in l2_data, "Missing patient_name in level2 response"
            assert l2_data["patient_id"] == p_id, "Patient ID mismatch"
            
            pred = l2_data["prediction"]
            print(f"[PASS] 2. /api/clinician/patients/{p_id}/level2 ({target_patient.get('name')}):")
            print(f"   - Patient Name: {l2_data.get('patient_name')}")
            print(f"   - Risk Probability: {pred.get('probability')}")
            print(f"   - Risk Level/Tier: {pred.get('risk_level') or pred.get('risk_tier')}")
            print(f"   - Top TreeSHAP features count: {len(pred.get('top_features', []))}")
            if pred.get("top_features"):
                for feat in pred["top_features"][:3]:
                    print(f"     * {feat.get('feature') or feat.get('name')}: {feat.get('importance') or feat.get('shap_value')}")
                
        # 4. Test unauthorized non-clinician access is blocked (403)
        patient_user = db.query(models.User).filter(models.User.is_caregiver == False).first()
        if patient_user:
            pat_token = auth.create_access_token(data={"sub": patient_user.email})
            p_id = patients[0]["id"]
            unauth_status, _ = make_req(f"/api/clinician/patients/{p_id}/level2", token=pat_token)
            assert unauth_status == 403, f"Expected 403 Forbidden for non-clinician, got {unauth_status}"
            print(f"[PASS] 3. Non-clinician access correctly blocked with HTTP 403 Forbidden.")
            
        # 5. Test nonexistent patient returns 404
        bad_status, _ = make_req("/api/clinician/patients/999999/level2", token=token)
        assert bad_status == 404, f"Expected 404 for invalid patient, got {bad_status}"
        print(f"[PASS] 4. Non-existent patient ID correctly returns HTTP 404 Not Found.")

        print("=================================================================")
        print("ALL CLINICIAN TIER 2 TESTS PASSED SUCCESSFULLY!")
        print("=================================================================")
        return True
    finally:
        db.close()

if __name__ == "__main__":
    success = test_clinician_tier2_flow()
    sys.exit(0 if success else 1)
