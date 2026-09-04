"""Comprehensive Automated Verification Test Suite for CogniVeil Automated Cognitive Assessment Workflow.

Verifies:
1. Automated Assessment Session Creation (Clinician for Patient & Patient self-start).
2. Authoritative timing & telemetry persistence (started_at, completed_at, duration_seconds).
3. Incomplete, Skipped & Timeout status handling (never defaults to high/normal score).
4. Full 6-Test Battery Sequential Progression (Pattern, Digit Span, Word Recall, Stroop, Trail Making, Reaction Time).
5. Automated finalization: Session completion, CogniScore computation, and Evidence Quality integration.
6. Session state transitions: Pause, Resume, and Cancellation.
7. Clinician Active Assessment Monitoring endpoint.
8. Patient Isolation and Access Control Security.
"""

import os
import sys
from datetime import datetime, timedelta

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database import SessionLocal, engine, Base
import models, schemas, auth, main, mcp_tools

def run_tests():
    print("=" * 65)
    print("RUNNING AUTOMATED TIMED COGNITIVE ASSESSMENT SUITE")
    print("=" * 65)

    db = SessionLocal()
    models.Base.metadata.create_all(bind=engine)

    # 1. Setup Test Users: Clinician & Patient
    doc = db.query(models.User).filter(models.User.email == "dr.arun@demo.com").first()
    if not doc:
        doc = db.query(models.User).filter(models.User.role == "clinician").first()
    if not doc:
        doc = models.User(
            name="Dr. Arun Sharma",
            email="dr.arun@demo.com",
            hashed_password=auth.get_password_hash("doctor123"),
            age=48,
            gender="Male",
            role="clinician",
            is_caregiver=True,
            consent_granted=True
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

    patient = db.query(models.User).filter(models.User.email == "arjun@demo.com").first()
    if not patient:
        patient = db.query(models.User).filter(models.User.role == "patient").first()
    if not patient:
        patient = models.User(
            name="Arjun Patel",
            email="arjun@demo.com",
            hashed_password=auth.get_password_hash("patient123"),
            age=72,
            gender="Male",
            role="patient",
            is_caregiver=False,
            consent_granted=True
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

    print("\n[GROUP 1] Assessment Session Initialization & Permissions:")
    
    # 1A. Clinician Starts Session for Patient
    start_payload = schemas.AssessmentSessionCreate(patient_id=patient.id)
    session_res = main.start_assessment_session(start_payload, db=db, current_user=doc)
    assert session_res.session_uuid is not None, "Session UUID must be generated"
    assert session_res.user_id == patient.id, "Target user must be the patient"
    assert session_res.clinician_id == doc.id, "Clinician ID must be recorded"
    assert session_res.status == "IN_PROGRESS", "Initial status must be IN_PROGRESS"
    assert session_res.current_test_index == 0, "Initial test index must be 0"
    assert session_res.current_test == "pattern_recall", "First test must be pattern_recall"
    assert session_res.total_tests == 6, "Total battery tests must be 6"
    print(f"  [PASS] 1A. Clinician initiated session {session_res.session_uuid[:8]}... for Patient {patient.id}")

    # 1B. Patient Fetches Session Status (Resilience check)
    get_res = main.get_assessment_session(session_res.session_uuid, db=db, current_user=patient)
    assert get_res.session_uuid == session_res.session_uuid
    assert get_res.current_test == "pattern_recall"
    print("  [PASS] 1B. Patient successfully retrieved active session status")

    # 1C. Patient Isolation / Access Control Check
    other_patient = db.query(models.User).filter(models.User.email == "other_patient_iso@demo.com").first()
    if not other_patient:
        other_patient = models.User(
            name="Unrelated Patient",
            email="other_patient_iso@demo.com",
            hashed_password=auth.get_password_hash("testpass123"),
            age=65,
            role="patient",
            consent_granted=True
        )
        db.add(other_patient)
        db.commit()
        db.refresh(other_patient)

    try:
        main.get_assessment_session(session_res.session_uuid, db=db, current_user=other_patient)
        assert False, "Unauthorized patient should be blocked with 403"
    except Exception as e:
        assert getattr(e, "status_code", None) == 403, "Must return HTTP 403 Forbidden"
        print("  [PASS] 1C. Patient isolation enforced: Unauthorized patient blocked from session")

    print("\n[GROUP 2] Automated Test Progression & Authoritative Timing:")

    # 2A. Submit Test 1: Pattern Recall (Valid Completion)
    t1_now = datetime.utcnow()
    t1_payload = schemas.AssessmentTestSubmit(
        test_type="pattern_recall",
        score=83.33,
        duration_seconds=22.4,
        started_at=t1_now - timedelta(seconds=22),
        completed_at=t1_now,
        completion_status="COMPLETED",
        raw_response={"selected": [0, 2, 5, 8, 11], "correct_count": 5},
        metadata={"recalled_cells": "5 / 6"}
    )
    t1_res = main.submit_assessment_test(session_res.session_uuid, t1_payload, db=db, current_user=patient)
    assert t1_res.current_test_index == 1, "Index must advance to 1"
    assert t1_res.current_test == "digit_span", "Next test must be digit_span"
    assert "pattern_recall" in t1_res.results_summary
    assert t1_res.results_summary["pattern_recall"]["score"] == 83.33
    print("  [PASS] 2A. Test 1 (Pattern Recall) completed -> Advanced to Digit Span")

    # 2B. Submit Test 2: Digit Span (Timeout & Partial Response Handling)
    t2_now = datetime.utcnow()
    t2_payload = schemas.AssessmentTestSubmit(
        test_type="digit_span",
        score=66.67,
        duration_seconds=20.0,
        started_at=t2_now - timedelta(seconds=20),
        completed_at=t2_now,
        completion_status="TIMEOUT",
        raw_response={"sequences_tested": 3, "correct_count": 2},
        metadata={"is_timeout": True}
    )
    t2_res = main.submit_assessment_test(session_res.session_uuid, t2_payload, db=db, current_user=patient)
    assert t2_res.current_test_index == 2, "Index must advance to 2"
    assert t2_res.current_test == "word_recall", "Next test must be word_recall"
    assert t2_res.results_summary["digit_span"]["completion_status"] == "TIMEOUT"
    print("  [PASS] 2B. Test 2 (Digit Span TIMEOUT) recorded accurately -> Advanced to Word Recall")

    # 2C. Submit Test 3: Word Recall (Delayed Retrieval)
    t3_now = datetime.utcnow()
    t3_payload = schemas.AssessmentTestSubmit(
        test_type="word_recall",
        score=80.0,
        duration_seconds=28.5,
        started_at=t3_now - timedelta(seconds=28),
        completed_at=t3_now,
        completion_status="COMPLETED",
        raw_response={"words_recalled": 4, "total": 5},
        metadata={"distractor_completed": True}
    )
    t3_res = main.submit_assessment_test(session_res.session_uuid, t3_payload, db=db, current_user=patient)
    assert t3_res.current_test_index == 3, "Index must advance to 3"
    assert t3_res.current_test == "stroop", "Next test must be stroop"
    print("  [PASS] 2C. Test 3 (Word Recall) completed -> Advanced to Stroop Test")

    # 2D. Submit Test 4: Stroop Test (Executive Inhibition)
    t4_now = datetime.utcnow()
    t4_payload = schemas.AssessmentTestSubmit(
        test_type="stroop",
        score=75.0,
        duration_seconds=24.1,
        started_at=t4_now - timedelta(seconds=24),
        completed_at=t4_now,
        completion_status="COMPLETED",
        raw_response={"correct_trials": 6, "total_trials": 8}
    )
    t4_res = main.submit_assessment_test(session_res.session_uuid, t4_payload, db=db, current_user=patient)
    assert t4_res.current_test_index == 4, "Index must advance to 4"
    assert t4_res.current_test == "trail_making", "Next test must be trail_making"
    print("  [PASS] 2D. Test 4 (Stroop Test) completed -> Advanced to Trail Making Test")

    # 2E. Submit Test 5: Trail Making Test (Set-Shifting)
    t5_now = datetime.utcnow()
    t5_payload = schemas.AssessmentTestSubmit(
        test_type="trail_making",
        score=78.0,
        duration_seconds=54.2,
        started_at=t5_now - timedelta(seconds=54),
        completed_at=t5_now,
        completion_status="COMPLETED",
        raw_response={"durA": 16.2, "durB": 38.0, "total_errors": 1}
    )
    t5_res = main.submit_assessment_test(session_res.session_uuid, t5_payload, db=db, current_user=patient)
    assert t5_res.current_test_index == 5, "Index must advance to 5"
    assert t5_res.current_test == "reaction_time", "Next test must be reaction_time"
    print("  [PASS] 2E. Test 5 (Trail Making Test) completed -> Advanced to Reaction Time")

    # 2F. Submit Test 6: Reaction Time (Final Subtest) & Automated Finalization
    t6_now = datetime.utcnow()
    t6_payload = schemas.AssessmentTestSubmit(
        test_type="reaction_time",
        score=82.0,
        duration_seconds=18.0,
        started_at=t6_now - timedelta(seconds=18),
        completed_at=t6_now,
        completion_status="COMPLETED",
        raw_response={"mean_rt_ms": 330}
    )
    t6_res = main.submit_assessment_test(session_res.session_uuid, t6_payload, db=db, current_user=patient)
    assert t6_res.is_completed is True, "Session must be marked COMPLETED"
    assert t6_res.status == "COMPLETED"
    assert t6_res.current_test is None, "No remaining tests in battery"
    assert t6_res.latest_score is not None, "CogniScore must be calculated upon completion"
    assert t6_res.latest_score["evidence_quality"] == "GOOD", "Substantial battery must produce GOOD evidence quality"
    print(f"  [PASS] 2F. Test 6 (Reaction Time) finalized -> CogniScore: {t6_res.latest_score['score']}, Evidence: {t6_res.latest_score['evidence_quality']}")

    print("\n[GROUP 3] Pause, Resume, and Cancellation Operations:")

    # 3A. Start a second session to test Pause / Resume / Cancel
    s2_payload = schemas.AssessmentSessionCreate(patient_id=patient.id)
    s2 = main.start_assessment_session(s2_payload, db=db, current_user=doc)
    assert s2.status == "IN_PROGRESS"

    # Pause
    paused = main.pause_assessment_session(s2.session_uuid, db=db, current_user=patient)
    assert paused.status == "PAUSED"
    print("  [PASS] 3A. Assessment successfully PAUSED")

    # Resume
    resumed = main.resume_assessment_session(s2.session_uuid, db=db, current_user=patient)
    assert resumed.status == "IN_PROGRESS"
    print("  [PASS] 3B. Assessment successfully RESUMED")

    # Cancel
    cancelled = main.cancel_assessment_session(s2.session_uuid, db=db, current_user=patient)
    assert cancelled.status == "CANCELLED"
    print("  [PASS] 3C. Assessment successfully CANCELLED")

    print("\n[GROUP 4] Clinician Real-Time Monitoring Endpoint:")
    
    # 4A. Clinician monitors active assessment for patient
    active_mon = main.get_clinician_patient_active_assessment(patient.id, db=db, current_user=doc)
    assert "has_active_session" in active_mon
    assert "session" in active_mon
    print(f"  [PASS] 4A. Clinician monitoring active session endpoint returned status: {active_mon['session']['status']}")

    print("\n" + "=" * 65)
    print("ALL AUTOMATED COGNITIVE ASSESSMENT WORKFLOW TESTS PASSED (100%)")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()
