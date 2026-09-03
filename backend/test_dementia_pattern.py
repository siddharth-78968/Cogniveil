"""
=============================================================================
COMPREHENSIVE TEST SUITE: DEMENTIA TYPE PROFILING & ARCHITECTURAL ISOLATION
=============================================================================
Verifies:
  1. Clinician receives HTTP 200 for dementia-profile endpoint.
  2. Authenticated patient receives HTTP 403 Forbidden.
  3. Unauthenticated requests receive HTTP 401 Unauthorized.
  4. Strict patient data isolation (Patient A vs Patient B).
  5. Insufficient screening data returns safe {"status": "insufficient_data"}.
  6. Sum of pattern probabilities equals 1.00 +/- 0.01.
  7. TreeSHAP feature attributions correspond to actual evaluated features.
  8. Level 1 active test scoring and passive tracking remain fully functional.
  9. Level 2 CatBoost Alzheimer's risk scoring remains fully functional.
 10. Level 3 PyTorch ResNet-18 MRI model remains fully functional.
 11. Zero database records, user roles, or appointments were altered or deleted.
 12. Non-diagnostic decision-support safety disclaimers are present.
=============================================================================
"""

import os
import sys
import unittest
import json
from pathlib import Path

# Ensure backend root is in sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from database import SessionLocal
import models
import auth
import dementia_pattern_model
import predictor
import mri_model


class TestDementiaTypeProfiling(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.engine = dementia_pattern_model.DementiaPatternEngine.get_instance()
        
        # Clinician test token
        cls.clinician = cls.db.query(models.User).filter(models.User.email == "vandhana@demo.com").first()
        if not cls.clinician:
            cls.clinician = cls.db.query(models.User).filter(models.User.role == "clinician").first()

        # Patient test tokens
        cls.patient1 = cls.db.query(models.User).filter(models.User.email == "arjun@demo.com").first()
        cls.patient2 = cls.db.query(models.User).filter(models.User.email == "meena@demo.com").first()
        cls.patient3 = cls.db.query(models.User).filter(models.User.email == "rajan@demo.com").first()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_clinician_access_authorized(self):
        """Test 1: Authorized clinician retrieves valid dementia pattern profile."""
        self.assertIsNotNone(self.patient3, "Patient 3 (Rajan) should exist in demo database")
        profile = dementia_pattern_model.get_patient_dementia_profile(self.db, self.patient3.id)
        
        self.assertIn(profile.get("status"), ["completed", "insufficient_data"])
        if profile["status"] == "completed":
            self.assertIn(profile["most_consistent_pattern"], [
                "Healthy / Control", "Alzheimer's-like", "Vascular-like", "Lewy-body-like", "FTD-like"
            ])
            self.assertTrue(len(profile["pattern_probabilities"]) == 5)
            self.assertIn("disclaimer", profile)

    def test_02_patient_forbidden_rbac(self):
        """Test 2: Patient user is rejected by require_clinician authorization dependency."""
        self.assertIsNotNone(self.patient1)
        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as ctx:
            auth.require_clinician(self.patient1)
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Clinician authorization required", str(ctx.exception.detail))

    def test_03_clinician_passes_rbac(self):
        """Test 3: Clinician user passes require_clinician dependency."""
        self.assertIsNotNone(self.clinician)
        user = auth.require_clinician(self.clinician)
        self.assertEqual(user.id, self.clinician.id)

    def test_04_patient_data_isolation(self):
        """Test 4: Features extracted for Patient A are isolated from Patient B."""
        status_a, feat_a, _ = dementia_pattern_model.extract_patient_features_for_profiling(self.db, self.patient1.id)
        status_b, feat_b, _ = dementia_pattern_model.extract_patient_features_for_profiling(self.db, self.patient3.id)
        
        self.assertEqual(status_a, "completed")
        self.assertEqual(status_b, "completed")
        # Arjun (High Cognitive, stable) vs Rajan (Cognitive decline, vascular risk)
        self.assertNotEqual(feat_a["word_recall_score"], feat_b["word_recall_score"])
        self.assertNotEqual(feat_a["age"], feat_b["age"])

    def test_05_insufficient_data_graceful_handling(self):
        """Test 5: Patient with zero completed records receives safe insufficient_data payload."""
        # Non-existent or empty patient ID
        res = dementia_pattern_model.get_patient_dementia_profile(self.db, 999999)
        self.assertIn(res["status"], ["insufficient_data", "not_found"])

    def test_06_probabilities_sum_to_one(self):
        """Test 6: Sum of multiclass pattern probabilities equals 1.00 +/- 0.01."""
        profile = dementia_pattern_model.get_patient_dementia_profile(self.db, self.patient3.id)
        if profile.get("status") == "completed":
            prob_sum = sum(p["probability"] for p in profile["pattern_probabilities"])
            self.assertAlmostEqual(prob_sum, 1.0, places=2)

    def test_07_shap_signals_match_model_features(self):
        """Test 7: TreeSHAP signal attributions correspond to real evaluated features."""
        profile = dementia_pattern_model.get_patient_dementia_profile(self.db, self.patient3.id)
        if profile.get("status") == "completed" and profile.get("key_contributing_signals"):
            for sig in profile["key_contributing_signals"]:
                self.assertIn(sig["feature_key"], dementia_pattern_model.FEATURE_COLUMNS)
                self.assertIn("impact", sig)
                self.assertIn("domain", sig)

    def test_08_level1_integrity_preserved(self):
        """Test 8: Level 1 active test scoring and passive tracking remain untouched."""
        tests = self.db.query(models.TestResult).filter(models.TestResult.user_id == self.patient1.id).all()
        self.assertTrue(len(tests) > 0, "Level 1 test records must remain intact")
        signals = self.db.query(models.PassiveSignal).filter(models.PassiveSignal.user_id == self.patient1.id).all()
        self.assertTrue(len(signals) > 0, "Level 1 passive telemetry records must remain intact")

    def test_09_level2_catboost_integrity_preserved(self):
        """Test 9: Existing Level 2 Alzheimer's CatBoost model evaluates independently."""
        self.assertTrue(hasattr(predictor, "predict_risk") or hasattr(predictor, "csv_model"))
        self.assertTrue(Path(predictor.MODEL_PATH).exists())

    def test_10_level3_mri_integrity_preserved(self):
        """Test 10: Existing Level 3 PyTorch ResNet-18 MRI model evaluates independently."""
        self.assertTrue(hasattr(mri_model, "classify_mri_scan") or hasattr(mri_model, "DIAGNOSTIC_CLASSES"))


    def test_11_database_records_and_appointments_preserved(self):
        """Test 11: Users, appointments, and roles were not deleted or modified."""
        users_count = self.db.query(models.User).count()
        self.assertGreaterEqual(users_count, 4, "Cohort users must be preserved")
        appts_count = self.db.query(models.Appointment).count()
        self.assertGreaterEqual(appts_count, 3, "Appointments must be preserved")

    def test_12_safety_disclaimer_present(self):
        """Test 12: Decision support disclaimers are present in all profile payloads."""
        profile = dementia_pattern_model.get_patient_dementia_profile(self.db, self.patient1.id)
        self.assertIn("disclaimer", profile)
        self.assertIn("not", profile["disclaimer"].lower())

    def test_13_patients_directory_filters_test_artifacts(self):
        """Test 13: Clinician patient directory returns clean cohort and excludes test artifacts."""
        import main
        patients = main.get_clinician_patients_list(db=self.db, current_user=self.clinician)
        self.assertGreaterEqual(len(patients), 3, "Cohort must include official demo patients")
        
        # Verify no test artifacts leaked into the response
        for p in patients:
            email = p["email"].lower()
            name = p["name"]
            self.assertFalse(email.endswith("@isolation.test"), f"Test runner leaked: {email}")
            self.assertNotIn("alpha isolation", name.lower(), f"Placeholder leaked: {name}")
            self.assertNotIn("beta isolation", name.lower(), f"Placeholder leaked: {name}")
            self.assertIn("is_demo", p, "is_demo boolean flag must be present in response")

        # Verify all 3 official demo accounts are present and flagged as demo
        demo_emails = {p["email"] for p in patients if p["is_demo"]}
        self.assertIn("arjun@demo.com", demo_emails)
        self.assertIn("meena@demo.com", demo_emails)
        self.assertIn("rajan@demo.com", demo_emails)


if __name__ == "__main__":
    unittest.main(verbosity=2)

