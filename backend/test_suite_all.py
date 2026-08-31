import os
import io
import json
from database import SessionLocal, engine, Base
import models
import schemas
import main
from services.pdf_report import build_clinical_referral_pdf

def run_direct_tests():
    print("=" * 80)
    print("COGNIVEIL DIRECT INTEGRATION TEST SUITE: PDF REPORT & APPOINTMENTS")
    print("=" * 80)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Ensure Clinician and Patient users exist
        clinician = db.query(models.User).filter(models.User.email == "dr_jackson@cogniveil.ai").first()
        if not clinician:
            clinician = models.User(
                email="dr_jackson@cogniveil.ai",
                name="Dr. Jackson Santos",
                age=48,
                gender="Male",
                is_caregiver=True
            )
            db.add(clinician)
            db.commit()
            db.refresh(clinician)
        print(f"[PASS] 1. Clinician User Verified (ID: {clinician.id}, Name: {clinician.name})")

        patient = db.query(models.User).filter(models.User.email == "patient_rajan@demo.com").first()
        if not patient:
            patient = models.User(
                email="patient_rajan@demo.com",
                name="Rajan Pillai",
                age=74,
                gender="Male",
                is_caregiver=False
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)
        print(f"[PASS] 2. Patient User Verified (ID: {patient.id}, Name: {patient.name})")

        # 2. Test PDF Report Generation Directly
        report_payload = {
            "cogni_score": 64.2,
            "risk_level": "Moderate",
            "is_deviating": True,
            "patient_name": "Rajan Pillai",
            "age": 74,
            "confidence": 0.88,
            "referral": {
                "action": "Comprehensive Neuropsychological & Cognitive Evaluation",
                "recommended_specialist": "Cognitive Neurologist / Memory Disorders Clinic",
                "urgency": "Moderate (within 30 days)",
                "clinical_rationale": "Convergence across active recall, passive telemetry, and voice pause dispersion."
            }
        }
        pdf_buf = build_clinical_referral_pdf(report_payload, {"name": "Rajan Pillai", "age": 74, "gender": "Male", "id": "PAT-2026-084"})
        pdf_bytes = pdf_buf.getvalue()

        assert len(pdf_bytes) > 2000, f"PDF suspiciously small: {len(pdf_bytes)} bytes"
        assert pdf_bytes.startswith(b"%PDF-"), "Invalid PDF header magic bytes"
        assert b"%%EOF" in pdf_bytes, "Missing EOF marker in PDF"
        print(f"[PASS] 3. build_clinical_referral_pdf: Valid Binary PDF generated (Size: {len(pdf_bytes)} bytes, Magic: {pdf_bytes[:8].decode('ascii', errors='ignore')})")

        # Save to disk for manual inspection
        out_path = os.path.join(os.path.dirname(__file__), "test_clinical_referral_summary.pdf")
        with open(out_path, "wb") as f:
            f.write(pdf_bytes)
        print(f"[PASS] 4. Test PDF saved to: {out_path}")

        # 3. Test Endpoint: generate_clinical_report_pdf_endpoint
        req_pdf = schemas.ClinicalReportRequest(
            cogni_score=64.2,
            risk_level="Moderate",
            is_deviating=True,
            patient_name="Rajan Pillai",
            age=74
        )
        res_pdf = main.generate_clinical_report_pdf_endpoint(req=req_pdf, db=db, current_user=clinician)
        assert res_pdf.status_code == 200
        assert res_pdf.media_type == "application/pdf"
        assert res_pdf.body.startswith(b"%PDF-")
        print(f"[PASS] 5. generate_clinical_report_pdf_endpoint: HTTP 200, Content-Type=application/pdf, Size={len(res_pdf.body)} bytes")

        # 4. Test Endpoint: get_patient_clinical_referral_pdf
        res_pat_pdf = main.get_patient_clinical_referral_pdf(patient_id=patient.id, db=db, current_user=clinician)
        assert res_pat_pdf.status_code == 200
        assert res_pat_pdf.media_type == "application/pdf"
        assert res_pat_pdf.body.startswith(b"%PDF-")
        print(f"[PASS] 6. get_patient_clinical_referral_pdf: HTTP 200 for Patient #{patient.id} (Size: {len(res_pat_pdf.body)} bytes)")

        # 5. Test Appointments: GET
        appts = main.get_appointments(db=db, current_user=clinician)
        assert isinstance(appts, list) and len(appts) > 0
        print(f"[PASS] 7. get_appointments: Retrieved {len(appts)} appointments from database")

        # 6. Test Appointments: POST Create
        create_req = schemas.AppointmentCreate(
            patient_name="Meena Iyer",
            appointment_type="Acoustic Fluency & Speech Pause Review",
            scheduled_time="2026-09-12 - 10:00 AM",
            location="Memory & Cognitive Health Clinic - Suite 402",
            notes="Review multi-lingual speech pause duration drift."
        )
        new_appt = main.create_appointment(req=create_req, db=db, current_user=clinician)
        assert new_appt.id is not None
        assert new_appt.patient_name == "Meena Iyer"
        appt_id = new_appt.id
        print(f"[PASS] 8. create_appointment: Created Appointment #{appt_id} for Meena Iyer")

        # 7. Test Appointments: GET by ID
        fetched_appt = main.get_appointment_by_id(appointment_id=appt_id, db=db, current_user=clinician)
        assert fetched_appt.id == appt_id
        print(f"[PASS] 9. get_appointment_by_id: Retrieved details for Appointment #{appt_id}")

        # 8. Test Appointments: PUT Status -> Accepted
        up_acc = main.update_appointment_status(appointment_id=appt_id, req=schemas.AppointmentStatusUpdate(status="Accepted"), db=db, current_user=clinician)
        db_appt_acc = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
        assert db_appt_acc.status == "Accepted"
        print(f"[PASS] 10. update_appointment_status -> Accepted: Persisted in DB as '{db_appt_acc.status}'")

        # 9. Test Appointments: PUT Status -> Rejected
        up_rej = main.update_appointment_status(appointment_id=appt_id, req=schemas.AppointmentStatusUpdate(status="Rejected"), db=db, current_user=clinician)
        db_appt_rej = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
        assert db_appt_rej.status == "Rejected"
        print(f"[PASS] 11. update_appointment_status -> Rejected: Persisted in DB as '{db_appt_rej.status}'")

        # 10. Test Appointments: PUT Status -> Finished
        up_fin = main.update_appointment_status(appointment_id=appt_id, req=schemas.AppointmentStatusUpdate(status="Finished"), db=db, current_user=clinician)
        db_appt_fin = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
        assert db_appt_fin.status == "Finished"
        print(f"[PASS] 12. update_appointment_status -> Finished: Persisted in DB as '{db_appt_fin.status}'")

        print("=" * 80)
        print("ALL 12 BACKEND DIRECT INTEGRATION TESTS PASSED (100%)")
        print("=" * 80)

    finally:
        db.close()

if __name__ == "__main__":
    run_direct_tests()
