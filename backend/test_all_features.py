import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from main import app
from database import get_db
import models
import mcp_tools

client = TestClient(app)

print("==================================================")
print("     COGNIVEIL SYSTEM VERIFICATION SUITE         ")
print("==================================================\n")

# 1. Health check
res = client.get("/")
assert res.status_code == 200, f"Root failed: {res.text}"
print("[PASS] 1. Root API Endpoint: OK")

# 2. Seed Demo Data
res = client.get("/setup-demo")
assert res.status_code == 200, f"Seed demo failed: {res.text}"
print("[PASS] 2. Demo Seed Database & Established Baselines: OK")

# 3. Consent Enforcement Gate
# Register brand new user (starts with consent_granted = False)
test_email = f"new_patient_{os.getpid()}@demo.com"
reg_payload = {"name": "Test Onboard", "email": test_email, "password": "password123", "age": 66, "gender": "Female"}
res_reg = client.post("/register", json=reg_payload)
assert res_reg.status_code == 200, f"Register failed: {res_reg.text}"
assert res_reg.json()["consent_granted"] is False

# Login as unconsented user
res_login = client.post("/login", json={"email": test_email, "password": "password123"})
assert res_login.status_code == 200
unconsented_token = res_login.json()["access_token"]
unconsented_headers = {"Authorization": f"Bearer {unconsented_token}"}

# Attempting to save passive signals without consent MUST return 403 Forbidden
res_signal_blocked = client.post("/signals", json={
    "typing_speed": 65.0, "backspace_rate": 0.05, "scroll_hesitation": 1.2, "session_duration": 120.0
}, headers=unconsented_headers)
assert res_signal_blocked.status_code == 403, f"Passive signals should be blocked without consent: {res_signal_blocked.text}"

# Grant consent via /auth/consent
res_consent = client.post("/auth/consent", json={"consent_granted": True}, headers=unconsented_headers)
assert res_consent.status_code == 200 and res_consent.json()["consent_granted"] is True

# Saving signals should now succeed
res_signal_allowed = client.post("/signals", json={
    "typing_speed": 65.0, "backspace_rate": 0.05, "scroll_hesitation": 1.2, "session_duration": 120.0
}, headers=unconsented_headers)
assert res_signal_allowed.status_code == 200
print("[PASS] 3. Consent Enforcement Gate (403 unconsented -> 200 consented): OK")

# 4. 7-Day Baseline Calibration Mode
# New user has 0 prior historical sessions -> baseline_status is 'collecting' and false drift alerts are suppressed
res_calib = client.post("/score/calculate", headers=unconsented_headers)
assert res_calib.status_code == 200
calib_data = res_calib.json()
assert calib_data["baseline_status"] == "collecting", f"Expected collecting, got {calib_data['baseline_status']}"
assert calib_data["is_deviating"] is False, "Drift alerts should be muted during baseline calibration week"
print(f"[PASS] 4. 7-Day Baseline Calibration Mode (Status: {calib_data['baseline_status']}, Drift Alarms Muted): OK")

# 5. Established User Login & State Transition on Drift
login_payload = {"email": "rajan@demo.com", "password": "demo1234"}
res_rajan = client.post("/login", json=login_payload)
assert res_rajan.status_code == 200
rajan_token = res_rajan.json()["access_token"]
rajan_headers = {"Authorization": f"Bearer {rajan_token}"}

res_rajan_calc = client.post("/score/calculate", headers=rajan_headers)
assert res_rajan_calc.status_code == 200
rajan_score_data = res_rajan_calc.json()
assert rajan_score_data["baseline_status"] == "established"
assert rajan_score_data["is_deviating"] is True
assert rajan_score_data["trigger_level2"] is True
assert rajan_score_data["level2_status"] == "triggered"
print(f"[PASS] 5. Established Baseline Drift Transition (is_deviating: True, level2_status: {rajan_score_data['level2_status']}): OK")

# 6. CatBoost Execution Guard (MCP Tool 4)
# Calling predict_risk when Level 2 is not completed must return insufficient_data guard
res_guard = mcp_tools.predict_risk(data={}, level2_status="triggered")
assert res_guard["status"] == "insufficient_data"
assert "Monitoring continues" in res_guard["message"]
print("[PASS] 6. CatBoost Execution Guard (Blocks ML model execution when Level 2 unassessed): OK")

# 7. Level 2 Questionnaire Submission & Combined Risk Score
l2_data = {
    "Country": "India", "Age": 78, "Gender": "Male", "Education_Level": 10,
    "BMI": 26.5, "Physical_Activity": "Low", "Smoking_Status": "Former",
    "AlcoholConsumption": "Occasional", "Diabetic": "Yes", "Hypertension": "Yes",
    "CholesterolLevel": "High", "Family_History": "Yes", "CognitiveScore": 32,
    "Depression_Status": "Yes", "Sleep_Quality": "Poor", "Nutrition_Diet": "Fair",
    "AirPollution": "High", "EmploymentStatus": "Retired", "MaritalStatus": "Widowed",
    "APOE_e4": "Positive", "SocialEngagement": "Low", "IncomeLevel": "Low",
    "StressLevels": "High", "Genetic_Risk": "High", "Active_Score": 30.0,
    "Passive_Score": 35.0, "typing_speed": 35.0, "backspace_rate": 0.25,
    "apoe_e4_provenance": "clinically_obtained", "mri_provenance": "clinically_obtained"
}
res_l2 = client.post("/api/level2/submit", json=l2_data, headers=rajan_headers)
assert res_l2.status_code == 200
l2_resp = res_l2.json()
assert l2_resp["status"] == "success"
assert l2_resp["combined_risk_score"] is not None
assert len(l2_resp["shap_features"]) > 0
print(f"[PASS] 7. Level 2 Clinical Assessment & Combined Risk Score (Combined: {l2_resp['combined_risk_score']}%, Risk: {l2_resp['risk_level']}): OK")

# 8. State-Aware MCP Screening Orchestrator
db = next(get_db())
rajan_user = db.query(models.User).filter(models.User.email == "rajan@demo.com").first()
orch_result = mcp_tools.run_screening_orchestrator(
    db=db,
    user=rajan_user,
    active_scores=[30.0, 32.0, 28.0],
    signals=[],
    historical_scores=db.query(models.CogniScore).filter(models.CogniScore.user_id == rajan_user.id).all()
)
assert orch_result["pipeline_state"] == "full_pipeline_completed"
assert orch_result["guardrail_passed"] is True
print(f"[PASS] 8. State-Aware MCP Screening Orchestrator (Pipeline State: {orch_result['pipeline_state']}): OK")

# 9. PyTorch ResNet-18 MRI Neuroimaging Confirmatory Panel & Grad-CAM
res_mri = client.post("/api/classify-mri", headers=rajan_headers)
assert res_mri.status_code == 200 and "predicted_class" in res_mri.json()
assert "PyTorch ResNet-18" in res_mri.json()["architecture"]
assert res_mri.json()["gradcam"]["overlay_image_url"] is not None
print(f"[PASS] 9. PyTorch ResNet-18 & Grad-CAM Attention Heatmap (Predicted: {res_mri.json()['predicted_class']}): OK")

# 10. MedGemma Clinical Narrative + Guardrails + Referral
clinical_payload = {
    "cogni_score": 32.5,
    "risk_level": "High",
    "is_deviating": True,
    "combined_risk_score": l2_resp["combined_risk_score"],
    "patient_name": "Rajan Pillai",
    "age": 78,
    "shap_features": l2_resp.get("shap_features", []),
    "mri_result": res_mri.json()
}
res_report = client.post("/api/clinical-report", json=clinical_payload, headers=rajan_headers)
assert res_report.status_code == 200 and res_report.json()["guardrail_passed"] is True
print("[PASS] 10. MedGemma Clinical Report & Guardrail Safety Scanner: OK")

# 11. Audit Log Trace with Pipeline State
res_audit = client.get("/api/audit-logs", headers=rajan_headers)
assert res_audit.status_code == 200 and len(res_audit.json()) > 0
print(f"[PASS] 11. Immutable Audit Trail ({len(res_audit.json())} events with pipeline state tracking): OK")

print("\n==================================================")
print("      ALL STATEFUL CLINICAL PIPELINES VERIFIED!   ")
print("==================================================")
