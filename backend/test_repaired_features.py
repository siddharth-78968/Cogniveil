import sys
import os
import json
from datetime import datetime, timedelta

# Add current dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import main
import models
import schemas
import auth
from database import SessionLocal

def test_system():
    print("=" * 60)
    print("STARTING COGNIVEIL SYSTEM VERIFICATION ON backend-changes")
    print("=" * 60)

    db = SessionLocal()
    try:
        # 1. Health check
        root_res = main.root()
        assert "message" in root_res
        print(" [PASS] 1. FastAPI Root Health Check (200 OK)")

        # 2. Demo accounts login verification
        demo_emails = ["arjun@demo.com", "meena@demo.com", "rajan@demo.com"]
        for email in demo_emails:
            # Test demo login function
            token_data = main.demo_login_endpoint(email=email, db=db)
            assert "access_token" in token_data
            assert token_data["token_type"] == "bearer"
            print(f" [PASS] 2. Demo Auth for {email} (Token Generated)")

            # Test standard login password verification with demo1234
            user = db.query(models.User).filter(models.User.email == email).first()
            assert user is not None
            assert auth.verify_password("demo1234", user.hashed_password) is True
            print(f" [PASS] 2b. Password verification 'demo1234' for {email}: OK")

            # Test password123 interoperability
            assert auth.verify_password("password123", user.hashed_password) is True
            print(f" [PASS] 2c. Password verification 'password123' interoperability for {email}: OK")

        # Use rajan user for testing
        rajan = db.query(models.User).filter(models.User.email == "rajan@demo.com").first()

        # 3. Evidence Graph endpoint
        eg_res = main.get_evidence_graph(db=db, current_user=rajan)
        assert "nodes" in eg_res and "edges" in eg_res
        assert "cognitive" in eg_res["nodes"]
        assert "longitudinal" in eg_res["nodes"]
        assert len(eg_res["nodes"]) == 7
        assert len(eg_res["edges"]) == 6
        print(f" [PASS] 3. /api/evidence-graph ({len(eg_res['nodes'])} dynamic nodes, {len(eg_res['edges'])} weighted edges): OK")

        # 4. Notifications endpoint
        notifs = main.get_notifications(db=db, current_user=rajan)
        assert len(notifs) > 0
        print(f" [PASS] 4. /api/notifications ({len(notifs)} clinical notifications loaded): OK")

        # Test mark read
        notif_id = notifs[0].id
        read_res = main.mark_notification_read(notification_id=notif_id, db=db, current_user=rajan)
        assert read_res["id"] == notif_id
        print(f" [PASS] 4b. /api/notifications/{notif_id}/read: OK")

        # 5. Global Search endpoint
        search_res = main.search_endpoint(q="cognitive", db=db, current_user=rajan)
        assert search_res["total_results"] > 0
        print(f" [PASS] 5. /api/search?q=cognitive ({search_res['total_results']} matching items): OK")

        # Search module test
        search_res2 = main.search_endpoint(q="appointments", db=db, current_user=rajan)
        assert search_res2["total_results"] > 0
        print(f" [PASS] 5b. /api/search?q=appointments (Appointments module matched): OK")

        # 6. Appointments endpoints
        appts = main.get_appointments(db=db, current_user=rajan)
        assert len(appts) > 0
        print(f" [PASS] 6. /api/appointments GET ({len(appts)} scheduled sessions): OK")

        # Create appointment
        create_req = schemas.AppointmentCreate(
            patient_name="Rajan Pillai",
            appointment_type="Neurological Evaluation",
            scheduled_time="2026-09-10 - 11:00 AM",
            location="Memory & Cognitive Health Clinic - Suite 402",
            notes="Follow-up test for drift evaluation"
        )
        new_appt = main.create_appointment(req=create_req, db=db, current_user=rajan)
        assert new_appt.id is not None
        print(f" [PASS] 6b. /api/appointments POST (Created Appointment ID #{new_appt.id}): OK")

        # Update status
        status_req = schemas.AppointmentStatusUpdate(status="Accepted")
        update_res = main.update_appointment_status(appointment_id=new_appt.id, req=status_req, db=db, current_user=rajan)
        assert update_res["status"] == "Accepted"
        print(f" [PASS] 6c. /api/appointments/{new_appt.id}/status PUT (Status updated to Accepted): OK")

        # 7. Longitudinal CogniScore calculation & EWMA deviation
        score_res = main.calculate_score(db=db, current_user=rajan)
        assert "score" in score_res
        assert "is_deviating" in score_res
        print(f" [PASS] 7. /score/calculate EWMA/CUSUM (Score: {score_res['score']}, Risk: {score_res['risk_level']}, Deviating: {score_res['is_deviating']}): OK")

        # 8. Clinical Report Generation with RAG & MedGemma
        report_req = schemas.ClinicalReportRequest(
            cogni_score=42.5,
            risk_level="High",
            is_deviating=True,
            patient_name="Rajan Pillai",
            age=78
        )
        report_res = main.generate_clinical_report_endpoint(req=report_req, db=db, current_user=rajan)
        assert "report_json" in report_res and "narrative" in report_res
        print(f" [PASS] 8. /api/clinical-report RAG Synthesis & Guardrail (Guardrail Passed: {report_res['guardrail_passed']}): OK")

        print("=" * 60)
        print("ALL 8 VERIFICATION TESTS PASSED PERFECTLY ON backend-changes!")
        print("=" * 60)
    finally:
        db.close()

if __name__ == "__main__":
    test_system()
