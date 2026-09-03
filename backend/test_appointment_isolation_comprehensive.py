import sys
import os
sys.path.append(os.path.abspath('backend'))
import json
import auth
import models
from main import app
from database import SessionLocal
from fastapi.testclient import TestClient

client = TestClient(app)
db = SessionLocal()

# 1. Total counts check
total_users = db.query(models.User).count()
total_patients = db.query(models.User).filter((models.User.role == 'patient') | (models.User.role == None), models.User.is_caregiver == False).count()
total_clinicians = db.query(models.User).filter((models.User.role == 'clinician') | (models.User.is_caregiver == True)).count()
total_appts = db.query(models.Appointment).count()

print("=== BASELINE DB STATS ===")
print(f"Users: {total_users}, Patients: {total_patients}, Clinicians: {total_clinicians}, Appointments: {total_appts}")

def api_call(endpoint, token=None, method="GET", data=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if method == "GET":
        resp = client.get(endpoint, headers=headers)
    elif method == "POST":
        resp = client.post(endpoint, headers=headers, json=data)
    elif method == "PUT":
        resp = client.put(endpoint, headers=headers, json=data)
    elif method == "DELETE":
        resp = client.delete(endpoint, headers=headers)
    return resp.status_code, resp.json()

# 2. Test Patient Vandhana (User ID 1)
u_pv = db.query(models.User).filter(models.User.email == "vandhana2306@gmail.com").first()
token_pv = auth.create_access_token(data={"sub": u_pv.email})

status, res_pv = api_call("/api/appointments", token_pv)
print(f"\n1. Patient Vandhana (ID={u_pv.id}, Role={u_pv.role}):")
print(f"   GET /api/appointments -> HTTP {status}, Total Returned: {len(res_pv)}")
db_pv_count = db.query(models.Appointment).filter(models.Appointment.patient_id == u_pv.id).count()
print(f"   DB records for Patient Vandhana: {db_pv_count} (Matches API: {len(res_pv) == db_pv_count})")

# 3. Test Rajan Pillai (User ID 4)
u_rajan = db.query(models.User).filter(models.User.email == "rajan@demo.com").first()
token_rajan = auth.create_access_token(data={"sub": u_rajan.email})

status, res_rajan = api_call("/api/appointments", token_rajan)
db_rajan_count = db.query(models.Appointment).filter(models.Appointment.patient_id == u_rajan.id).count()
print(f"\n2. Patient Rajan Pillai (ID={u_rajan.id}, Role={u_rajan.role}):")
print(f"   GET /api/appointments -> HTTP {status}, Total Returned: {len(res_rajan)}")
print(f"   DB records for Rajan: {db_rajan_count} (Matches API: {len(res_rajan) == db_rajan_count})")
for a in res_rajan:
    print(f"     Appt #{a['id']}: Patient='{a['patient_name']}', Clinician='{a['clinician_name']}', Status='{a['status']}'")

# 4. Test Clinician Vandhana (User ID 6)
u_cv = db.query(models.User).filter(models.User.email == "vandhanamarichamy@gmail.com").first()
token_cv = auth.create_access_token(data={"sub": u_cv.email})

status, res_cv_pat = api_call("/api/clinician/patients", token_cv)
status, res_cv_app = api_call("/api/appointments", token_cv)
print(f"\n3. Clinician Vandhana (ID={u_cv.id}, Role={u_cv.role}):")
print(f"   GET /api/clinician/patients -> HTTP {status}, Total Monitored Patients: {len(res_cv_pat)}")
print(f"   GET /api/appointments -> HTTP {status}, Triage/Assigned Appts: {len(res_cv_app)}")

# 5. Test Creating Appointment WITHOUT clinician (Patient Vandhana)
post_data_no_doc = {
    "appointment_type": "Cognitive Screening Battery",
    "scheduled_time": "2026-09-18 - 10:00 AM",
    "location": "Memory & Cognitive Health Clinic - Suite 402",
    "notes": "Unassigned general intake request"
}
status, created_no_doc = api_call("/api/appointments", token_pv, method="POST", data=post_data_no_doc)
print(f"\n4. Create Appointment WITHOUT Clinician:")
print(f"   POST /api/appointments -> HTTP {status}")
print(f"   Created ID={created_no_doc['id']}, Clinician ID={created_no_doc['clinician_id']}, Clinician Name='{created_no_doc['clinician_name']}', Patient='{created_no_doc['patient_name']}', Status='{created_no_doc['status']}'")

# 6. Test Creating Appointment WITH clinician (Patient Vandhana selecting Clinician Vandhana ID=6)
post_data_with_doc = {
    "clinician_id": u_cv.id,
    "appointment_type": "Tier 2 Biomarker Consultation",
    "scheduled_time": "2026-09-22 - 02:30 PM",
    "location": "Virtual Tele-Neurology Video Consultation",
    "notes": "Targeted consultation with Dr. Vandhana"
}
status, created_with_doc = api_call("/api/appointments", token_pv, method="POST", data=post_data_with_doc)
print(f"\n5. Create Appointment WITH Clinician (ID={u_cv.id}):")
print(f"   POST /api/appointments -> HTTP {status}")
print(f"   Created ID={created_with_doc['id']}, Clinician ID={created_with_doc['clinician_id']}, Clinician Name='{created_with_doc['clinician_name']}', Patient='{created_with_doc['patient_name']}', Status='{created_with_doc['status']}'")

# 7. Test Cross-Patient Security Isolation
# Patient Rajan trying to access Patient Vandhana's new appointment
status, access_denied_res = api_call(f"/api/appointments/{created_no_doc['id']}", token_rajan)
print(f"\n6. Cross-Patient Security Isolation Test:")
print(f"   Patient Rajan (ID=4) accessing Patient Vandhana Appt #{created_no_doc['id']} -> HTTP {status} (Expected: 403 Forbidden)")

# Patient Vandhana accessing her own appointment
status, access_ok_res = api_call(f"/api/appointments/{created_no_doc['id']}", token_pv)
print(f"   Patient Vandhana accessing own Appt #{created_no_doc['id']} -> HTTP {status} (Expected: 200 OK)")

# 8. Test Status Update & Persistence
status, update_res = api_call(f"/api/appointments/{created_with_doc['id']}/status", token_cv, method="PUT", data={"status": "Accepted"})
print(f"\n7. Status Update & Persistence Test:")
print(f"   Clinician Vandhana accepting Appt #{created_with_doc['id']} -> HTTP {status}")
status, verify_appt = api_call(f"/api/appointments/{created_with_doc['id']}", token_pv)
print(f"   Patient Vandhana querying updated Appt #{created_with_doc['id']} -> Status is '{verify_appt['status']}'")

# Clean up test appointments created during this run to keep baseline exact
db.query(models.Appointment).filter(models.Appointment.id.in_([created_no_doc['id'], created_with_doc['id']])).delete(synchronize_session=False)
db.commit()

final_appts = db.query(models.Appointment).count()
print(f"\n=== CLEANUP & INVARIANCE VERIFICATION ===")
print(f"Appointments count returned to baseline: {final_appts} (Matches 29: {final_appts == 29})")

db.close()
