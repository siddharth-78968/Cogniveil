import sqlite3
import os
import json
import urllib.request
import urllib.error

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cogniveil.db")
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

def audit():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("=" * 80)
    print("COGNIVEIL CLINICIAN PATIENT DIRECTORY AUDIT")
    print("=" * 80)

    # 1. Check Tables in DB
    tables = [row[0] for row in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    print("Database Tables:", tables)

    # 2. Check Vandhana Users
    vandhana = cursor.execute("SELECT id, name, email, role, is_caregiver FROM users WHERE name LIKE '%Vandhana%' OR email LIKE '%vandhana%'").fetchall()
    print("\nVandhana User Records in DB:")
    for v in vandhana:
        print(" ", v)

    # 3. Check All Clinicians
    clinicians = cursor.execute("SELECT id, name, email, role, is_caregiver FROM users WHERE role = 'clinician' OR is_caregiver = 1").fetchall()
    print(f"\nAll Clinicians ({len(clinicians)} total):")
    for c in clinicians:
        print(" ", c)

    # 4. Check All Patients
    patients = cursor.execute("SELECT id, name, email, role, is_caregiver, baseline_status, level2_status FROM users WHERE role = 'patient' OR (role IS NULL AND is_caregiver = 0)").fetchall()
    print(f"\nAll Patients ({len(patients)} total):")
    
    # 5. Build Diagnostic Table
    print("\n" + "-" * 100)
    print(f"{'Patient':<20} | {'ID':<4} | {'Active':<7} | {'Assigned Clinician':<20} | {'Assessments':<12} | {'Tier2':<7} | {'MRI':<7} | {'Appts':<6}")
    print("-" * 100)

    for p in patients:
        pid, pname, pemail, prole, pis_cg, pbase, plevel2 = p
        
        # Check assessments
        assessments_cnt = cursor.execute("SELECT COUNT(*) FROM cogniscores WHERE user_id = ?", (pid,)).fetchone()[0]
        tests_cnt = cursor.execute("SELECT COUNT(*) FROM test_results WHERE user_id = ?", (pid,)).fetchone()[0]
        
        # Check Tier 2 ML
        tier2_exists = "Yes" if plevel2 in ("moderate_risk", "high_risk", "low_risk") else "No"
        
        # Check MRI
        mri_cnt = cursor.execute("SELECT COUNT(*) FROM test_results WHERE user_id = ? AND test_type LIKE '%MRI%'", (pid,)).fetchone()[0]
        mri_exists = "Yes" if mri_cnt > 0 else "No"

        # Check Appointments & Assigned Clinician
        appts = cursor.execute("SELECT clinician_name FROM appointments WHERE patient_id = ?", (pid,)).fetchall()
        appts_cnt = len(appts)
        assigned_clinicians = list(set([a[0] for a in appts if a[0]]))
        assigned_str = ", ".join(assigned_clinicians) if assigned_clinicians else "None"

        print(f"{pname[:20]:<20} | {pid:<4} | {'Yes':<7} | {assigned_str[:20]:<20} | {assessments_cnt} scores / {tests_cnt} tests | {tier2_exists:<7} | {mri_exists:<7} | {appts_cnt:<6}")

    print("-" * 100)

    # 6. Test API call as Dr. Vandhana (ID: 68 or demo email)
    print("\n--- Testing API GET /api/clinician/patients ---")
    
    # Try login as Dr. Vandhana
    for v in vandhana:
        vid, vname, vemail, vrole, vcg = v
        st, res = api_call("/login", method="POST", data={"email": vemail, "password": "demo1234"})
        if st != 200:
            st, res = api_call("/login", method="POST", data={"email": vemail, "password": "Password123!"})
        
        print(f"\nLogin attempt for {vname} ({vemail}): HTTP {st}")
        if st == 200:
            token = res["access_token"]
            st_pats, pats = api_call("/api/clinician/patients", headers={"Authorization": f"Bearer {token}"})
            print(f"GET /api/clinician/patients as {vname}: HTTP {st_pats}, Returned count: {len(pats) if isinstance(pats, list) else pats}")
            if isinstance(pats, list):
                print(f"First 5 patients returned:")
                for p in pats[:5]:
                    print("  ", p["name"], f"(ID: {p['id']}, Score: {p['latest_score']}, Risk: {p['risk_level']})")

    # Also test Dr. Jackson Santos (clinician@demo.com)
    st_santos, res_santos = api_call("/login", method="POST", data={"email": "clinician@demo.com", "password": "demo1234"})
    print(f"\nLogin attempt for clinician@demo.com: HTTP {st_santos}")
    if st_santos == 200:
        token = res_santos["access_token"]
        st_pats, pats = api_call("/api/clinician/patients", headers={"Authorization": f"Bearer {token}"})
        print(f"GET /api/clinician/patients as clinician@demo.com: HTTP {st_pats}, Returned count: {len(pats) if isinstance(pats, list) else pats}")

    conn.close()

if __name__ == "__main__":
    audit()
