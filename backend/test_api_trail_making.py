"""API and Endpoint integration test for Digital Trail Making in CogniVeil using FastAPI TestClient."""

import unittest
import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(backend_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from main import save_test, calculate_score, get_clinician_patient_tests
from database import SessionLocal, engine, Base
from models import User, TestResult
from auth import get_password_hash
from schemas import TestResultCreate
import asyncio


class TestTrailMakingAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            patient = db.query(User).filter(User.email == "tmt_patient@cogniveil.test").first()
            if not patient:
                patient = User(
                    name="TMT Test Patient",
                    email="tmt_patient@cogniveil.test",
                    hashed_password=get_password_hash("SecretPass123!"),
                    role="patient",
                    is_caregiver=False,
                    consent_granted=True
                )
                db.add(patient)
                db.commit()
                db.refresh(patient)
            else:
                patient.consent_granted = True
                db.commit()
            cls.patient_id = patient.id

            clinician = db.query(User).filter(User.email == "tmt_clinician@cogniveil.test").first()
            if not clinician:
                clinician = User(
                    name="TMT Clinician",
                    email="tmt_clinician@cogniveil.test",
                    hashed_password=get_password_hash("ClinicianPass123!"),
                    role="clinician",
                    is_caregiver=True,
                    consent_granted=True
                )
                db.add(clinician)
                db.commit()
                db.refresh(clinician)
            cls.clinician_id = clinician.id
        finally:
            db.close()

    def test_save_and_calculate_trail_making_flow(self):
        """Test save_test endpoint, calculate_score, and get_clinician_patient_tests with Trail Making."""
        db = SessionLocal()
        try:
            patient = db.query(User).filter(User.id == self.patient_id).first()
            clinician = db.query(User).filter(User.id == self.clinician_id).first()
            
            payload = TestResultCreate(
                test_type="trail_making",
                score=86.0,
                duration_seconds=48.2,
                metadata={
                    "part_a_duration_seconds": 18.0,
                    "part_b_duration_seconds": 30.2,
                    "total_errors": 1,
                    "part_a_errors": 0,
                    "part_b_errors": 1,
                    "incorrect_selections": 1,
                    "correction_count": 1,
                    "set_shifting_cost_seconds": 12.2,
                    "completed": True
                }
            )

            # 1. Save Test Result
            save_res = save_test(result=payload, current_user=patient, db=db)
            self.assertEqual(save_res.get("message"), "Test result saved")

            # 2. Verify stored in DB with metadata_json
            saved_row = db.query(TestResult).filter(
                TestResult.user_id == patient.id,
                TestResult.test_type == "trail_making"
            ).order_by(TestResult.id.desc()).first()
            self.assertIsNotNone(saved_row)
            self.assertEqual(saved_row.score, 86.0)
            self.assertIsNotNone(saved_row.metadata_json)

            # 3. Calculate Score
            calc_res = calculate_score(current_user=patient, db=db)
            self.assertIn("score", calc_res)
            self.assertIn("active_score", calc_res)
            self.assertIn("ewma_score", calc_res)
            self.assertGreaterEqual(calc_res["score"], 0)
            self.assertLessEqual(calc_res["score"], 100)

            # 4. Clinician Viewport Endpoint
            clinician_res = get_clinician_patient_tests(patient_id=patient.id, current_user=clinician, db=db)
            self.assertIn("domain_breakdown", clinician_res)
            tmt_domain = next((d for d in clinician_res["domain_breakdown"] if d["test_type"] == "trail_making"), None)
            self.assertIsNotNone(tmt_domain)
            self.assertIn("Executive Function", tmt_domain["domain"])
            self.assertAlmostEqual(tmt_domain["average_score"], 86.0, places=1)
            self.assertEqual(tmt_domain["normative_mean"], 78.0)

        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
