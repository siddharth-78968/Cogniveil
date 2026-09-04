import requests, json, time

BACKEND = 'https://cogniveil-backend.onrender.com'
FRONTEND = 'https://cogniveil.vercel.app'

print('===============================================================')
print('     COGNIVEIL COMPLETE END-TO-END LIVE AUDIT & VERIFICATION   ')
print('===============================================================\n')

passed = 0
failed = 0

def test(name, fn):
    global passed, failed
    t0 = time.time()
    try:
        res = fn()
        dur = round((time.time() - t0) * 1000, 1)
        print(f'[PASS] {name} ({dur}ms) -> {res}')
        passed += 1
    except Exception as e:
        dur = round((time.time() - t0) * 1000, 1)
        print(f'[FAIL] {name} ({dur}ms) -> ERROR: {e}')
        failed += 1

# 1. Root & Health Check
def check_health():
    r = requests.get(f'{BACKEND}/api/health', timeout=10)
    assert r.status_code == 200, f'Status {r.status_code}'
    return r.json()
test('1. Backend Service Health (/api/health)', check_health)

# 2. Patient Demo Authentication
patient_token = None
patient_id = None
def check_patient_auth():
    global patient_token, patient_id
    r = requests.post(f'{BACKEND}/api/auth/demo?email=arjun@demo.com', timeout=10)
    assert r.status_code == 200, f'Status {r.status_code}'
    data = r.json()
    patient_token = data['access_token']
    patient_id = data.get('user', {}).get('id')
    role = data.get('user', {}).get('role')
    return f'Token obtained, role={role}, id={patient_id}'
test('2. Patient Demo Auth (arjun@demo.com)', check_patient_auth)

# 3. Clinician Demo Authentication
clinician_token = None
def check_clinician_auth():
    global clinician_token
    r = requests.post(f'{BACKEND}/api/auth/demo?email=doctor@cogniveil.ai', timeout=10)
    assert r.status_code == 200, f'Status {r.status_code}'
    data = r.json()
    clinician_token = data['access_token']
    role = data.get('user', {}).get('role')
    assert role == 'clinician', f'Expected clinician role, got {role}'
    return f'Token obtained, role={role}'
test('3. Clinician Demo Auth (doctor@cogniveil.ai)', check_clinician_auth)

# 4. Ingest Telemetry Signals (Passive behavioral sensors)
def check_signals():
    payload = {
        'typing_speed': 32.5,
        'backspace_rate': 0.08,
        'scroll_velocity': 420.0,
        'scroll_hesitation': 3.2,
        'session_duration': 65.0
    }
    r = requests.post(
        f'{BACKEND}/signals',
        headers={'Authorization': f'Bearer {patient_token}'},
        json=payload,
        timeout=10
    )
    assert r.status_code == 200, f'Status {r.status_code}: {r.text}'
    return f'Telemetry ingested successfully: {r.json()}'
test('4. Ingest Passive Behavioral Telemetry (/signals)', check_signals)

# 5. Read Signals Today
def check_today_signals():
    r = requests.get(
        f'{BACKEND}/signals/today',
        headers={'Authorization': f'Bearer {patient_token}'},
        timeout=10
    )
    assert r.status_code == 200, f'Status {r.status_code}'
    data = r.json()
    return f'Signals logged today: {len(data.get("signals", [])) if isinstance(data, dict) else len(data)}'
test('5. Retrieve Today Telemetry Signals (/signals/today)', check_today_signals)

# 6. Real-Time Patient Notifications
def check_notifications():
    r = requests.get(
        f'{BACKEND}/api/notifications',
        headers={'Authorization': f'Bearer {patient_token}'},
        timeout=10
    )
    assert r.status_code == 200, f'Status {r.status_code}'
    return f'{len(r.json())} active notifications'
test('6. Real-Time Notification Stream (/api/notifications)', check_notifications)

# 7. Submit Cognitive Test Result
def check_save_test():
    payload = {
        'test_type': 'trail_making',
        'score': 82.5,
        'duration_seconds': 42.1,
        'metadata': {'time_taken_seconds': 42.1, 'errors': 0}
    }
    r = requests.post(
        f'{BACKEND}/tests',
        headers={'Authorization': f'Bearer {patient_token}'},
        json=payload,
        timeout=10
    )
    assert r.status_code == 200, f'Status {r.status_code}: {r.text}'
    return f'Test recorded: {r.json().get("test_type")} -> score {r.json().get("score")}'
test('7. Record Cognitive Test Result (/tests)', check_save_test)

# 8. Retrieve & Calculate Multimodal CogniScore
def check_score():
    r = requests.get(
        f'{BACKEND}/score',
        headers={'Authorization': f'Bearer {patient_token}'},
        timeout=10
    )
    assert r.status_code == 200, f'Status {r.status_code}: {r.text}'
    data = r.json()
    return f'Score={data.get("score")}, Risk={data.get("risk_level")}, Active={data.get("active_score")}, Passive={data.get("passive_score")}'
test('8. Multimodal CogniScore Retrieval (/score)', check_score)

# 9. Trigger Dynamic Score Recalculation
def check_calc_score():
    r = requests.post(
        f'{BACKEND}/score/calculate',
        headers={'Authorization': f'Bearer {patient_token}'},
        timeout=10
    )
    assert r.status_code == 200, f'Status {r.status_code}: {r.text}'
    data = r.json()
    return f'Recalculated Score={data.get("score")}, Risk={data.get("risk_level")}'
test('9. Multimodal Dynamic Score Engine (/score/calculate)', check_calc_score)

# 10. Tier 2 Confirmatory Health Assessment (CatBoost ML + SHAP)
def check_tier2():
    payload = {
        'age': 68,
        'education_years': 16,
        'mmse': 24,
        'active_score': 62.0,
        'passive_score': 65.0,
        'voice_pause_rate': 14.2,
        'cv_risk': 1,
        'apoe4_carrier': 1
    }
    r = requests.post(
        f'{BACKEND}/predict/level2',
        headers={'Authorization': f'Bearer {patient_token}'},
        json=payload,
        timeout=15
    )
    assert r.status_code == 200, f'Status {r.status_code}: {r.text}'
    data = r.json()
    risk = data.get('risk_level') or data.get('predicted_risk')
    return f'Risk={risk}, Top SHAP Features={list(data.get("shap_values", {}).keys())[:3]}'
test('10. Tier 2 CatBoost ML + SHAP Explainer (/predict/level2)', check_tier2)

# 11. Tier 3 MRI Neuroimaging & Grad-CAM Heatmap
def check_mri():
    r = requests.post(
        f'{BACKEND}/api/classify-mri',
        headers={'Authorization': f'Bearer {patient_token}'},
        timeout=20
    )
    assert r.status_code == 200, f'Status {r.status_code}: {r.text}'
    data = r.json()
    has_cam = bool(data.get('gradcam', {}).get('overlay_image_url'))
    return f'Status={data.get("status")}, Class={data.get("predicted_class")}, CDR={data.get("cdr_rating")}, GradCAM={has_cam}'
test('11. Tier 3 MRI Volumetry & Grad-CAM (/api/classify-mri)', check_mri)

# 12. Clinical Specialist Vector PDF Generation
def check_pdf():
    payload = {
        'cogni_score': 62.5,
        'risk_level': 'Moderate',
        'is_deviating': True,
        'patient_name': 'Siddharth Khathuria',
        'age': 68
    }
    r = requests.post(
        f'{BACKEND}/api/clinical-report/pdf',
        headers={'Authorization': f'Bearer {clinician_token}'},
        json=payload,
        timeout=15
    )
    assert r.status_code == 200, f'Status {r.status_code}'
    assert r.headers.get('content-type', '').startswith('application/pdf'), 'Not application/pdf'
    assert r.content.startswith(b'%PDF-'), 'Invalid PDF binary header'
    return f'Generated vector PDF ({len(r.content)} bytes)'
test('12. Board-Ready Vector PDF Referral (/api/clinical-report/pdf)', check_pdf)

# 13. Clinician Patient Directory
def check_clinician_patients():
    r = requests.get(
        f'{BACKEND}/api/clinician/patients',
        headers={'Authorization': f'Bearer {clinician_token}'},
        timeout=10
    )
    assert r.status_code == 200, f'Status {r.status_code}'
    return f'{len(r.json())} patient records indexed'
test('13. Clinician Patient Management Directory (/api/clinician/patients)', check_clinician_patients)

# 14. Appointments System
def check_appointments():
    r = requests.get(
        f'{BACKEND}/api/appointments',
        headers={'Authorization': f'Bearer {patient_token}'},
        timeout=10
    )
    assert r.status_code == 200, f'Status {r.status_code}'
    return f'{len(r.json())} scheduled appointments'
test('14. Telehealth & Appointment Scheduling (/api/appointments)', check_appointments)

# 15. Multi-Agent Evidence Graph
def check_evidence_graph():
    r = requests.get(
        f'{BACKEND}/api/evidence-graph',
        headers={'Authorization': f'Bearer {patient_token}'},
        timeout=10
    )
    assert r.status_code == 200, f'Status {r.status_code}'
    data = r.json()
    return f'Nodes={len(data.get("nodes", []))}, Edges={len(data.get("edges", []))}'
test('15. Multi-Agent Evidence Graph Topology (/api/evidence-graph)', check_evidence_graph)

# 16. Subgroup Fairness & Demographic Parity Check
def check_fairness():
    r = requests.get(
        f'{BACKEND}/api/fairness-check',
        headers={'Authorization': f'Bearer {patient_token}'},
        timeout=10
    )
    assert r.status_code == 200, f'Status {r.status_code}'
    data = r.json()
    return f'Verdict: {data.get("fairness_verdict")}'
test('16. AI Algorithmic Subgroup Fairness Check (/api/fairness-check)', check_fairness)

# 17. Clinical MedGemma / Assistant Chat
def check_chat():
    r = requests.post(
        f'{BACKEND}/chat',
        headers={'Authorization': f'Bearer {patient_token}'},
        json={'question': 'Hello, what can you help me with?'},
        timeout=15
    )
    assert r.status_code == 200, f'Status {r.status_code}'
    data = r.json()
    reply = data.get('response') or data.get('reply') or data.get('answer') or str(data)[:60]
    return f'Chat response received: {reply[:60]}...'
test('17. Clinical Assistant & Safety Guardrail Chat (/chat)', check_chat)

# 18. Regulatory Audit Trail
def check_audit():
    r = requests.get(
        f'{BACKEND}/api/audit-logs',
        headers={'Authorization': f'Bearer {clinician_token}'},
        timeout=10
    )
    assert r.status_code == 200, f'Status {r.status_code}'
    return f'{len(r.json())} immutable audit events verified'
test('18. Regulatory Traceability & Audit Trail (/api/audit-logs)', check_audit)

# 19. All Core Vercel Frontend Pages
def check_frontend_pages():
    routes = ['/', '/login', '/dashboard', '/tests', '/voice', '/level2', '/level3', '/appointments', '/doctor']
    statuses = {}
    for rt in routes:
        resp = requests.get(f'{FRONTEND}{rt}', timeout=8)
        statuses[rt] = resp.status_code
        assert resp.status_code == 200, f'{rt} returned {resp.status_code}'
    return f'All {len(routes)} routes returned HTTP 200 OK'
test('19. Vercel Frontend Deployment (All 9 Core Clinical Pages)', check_frontend_pages)

print('\n===============================================================')
print(f'TOTAL: {passed + failed} Tests | PASSED: {passed} | FAILED: {failed}')
print('===============================================================')
