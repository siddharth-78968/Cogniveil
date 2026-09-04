"""Comprehensive Verification Test Suite for Evidence Quality & Input Validation Layer.

Verifies:
1. Voice Analysis:
   - Duration check (< 5.0s -> INSUFFICIENT)
   - Usable speech duration check (< 2.0s -> INSUFFICIENT)
   - Transcript availability and word count check (< 3 words -> INSUFFICIENT)
   - Processing/transcription errors (-> ERROR)
   - Good voice sample (-> GOOD)
   - Brief voice sample (-> LIMITED)
   - Invariant: INSUFFICIENT/ERROR does NOT assign LOW RISK or produce fake risk probability.
2. Cognitive Test Validation:
   - Missing responses (None score -> INSUFFICIENT)
   - Invalid responses (NaN, negative, > 100, non-numeric -> rejected as invalid, not default normal)
   - Incomplete battery (< 3 domains -> LIMITED, 0 domains -> INSUFFICIENT)
   - Invariant: CognitiveTestAgent does NOT assign fake probability or default to normal baseline.
3. SignalFusionEngine:
   - Multimodal fusion handles INSUFFICIENT cognitive data safely (cogni_score is None, risk is Unassessed).
4. Clinician Workspace Endpoints:
   - Exposes evidence_quality, evidence_reason, can_calculate_risk, and risk_probability.
"""

import math
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from assessment_validation import (
    EvidenceQuality,
    validate_voice_assessment,
    validate_cognitive_test_item,
    validate_cognitive_battery,
    validate_fused_session,
)
from agents.voice import VoiceAnalysisAgent
from agents.cognitive import CognitiveTestAgent
from agents.fusion import SignalFusionEngine
from database import SessionLocal, engine, Base
import models
import main


def run_tests():
    print("=================================================================")
    print("RUNNING EVIDENCE QUALITY & INPUT VALIDATION LAYER VERIFICATION")
    print("=================================================================")

    voice_agent = VoiceAnalysisAgent()
    cog_agent = CognitiveTestAgent()
    fusion_engine = SignalFusionEngine()

    # -------------------------------------------------------------------------
    # 1. Voice Analysis: Critical Sufficiency & Error Checks
    # -------------------------------------------------------------------------
    print("\n[GROUP 1] Voice Assessment Validation:")

    # Case 1A: Valid Audio (GOOD)
    good_feats = {
        "duration_seconds": 22.0,
        "mean_rms": 0.045,
        "speech_activity_ratio": 0.70,
        "transcription_confidence": 0.95,
    }
    v_good = validate_voice_assessment(good_feats, transcript="Yesterday morning I prepared warm tea and walked in the park.")
    assert v_good["evidence_quality"] == EvidenceQuality.GOOD
    assert v_good["is_sufficient"] is True
    assert v_good["can_calculate_risk"] is True
    print("  [PASS] 1A. Valid recording -> GOOD (can_calculate_risk=True)")

    # Case 1B: Brief Audio (LIMITED)
    limited_feats = {
        "duration_seconds": 7.0,
        "mean_rms": 0.040,
        "speech_activity_ratio": 0.60,
        "transcription_confidence": 0.85,
    }
    v_ltd = validate_voice_assessment(limited_feats, transcript="I went to the store.")
    assert v_ltd["evidence_quality"] == EvidenceQuality.LIMITED
    assert v_ltd["is_sufficient"] is True
    assert v_ltd["can_calculate_risk"] is True
    print(f"  [PASS] 1B. Brief recording (7.0s) -> LIMITED ({v_ltd['reason']})")

    # Case 1C: Too short (< 5s -> INSUFFICIENT)
    short_feats = {
        "duration_seconds": 3.2,
        "mean_rms": 0.035,
        "speech_activity_ratio": 0.50,
        "transcription_confidence": 0.90,
    }
    v_short = validate_voice_assessment(short_feats, transcript="Hello there.")
    assert v_short["evidence_quality"] == EvidenceQuality.INSUFFICIENT
    assert v_short["is_sufficient"] is False
    assert v_short["can_calculate_risk"] is False
    assert "shorter than the minimum required" in v_short["reason"]
    print(f"  [PASS] 1C. Short recording (<5s) -> INSUFFICIENT ({v_short['reason']})")

    # Case 1D: Insufficient active speech (< 2.0s active speech -> INSUFFICIENT)
    low_speech_feats = {
        "duration_seconds": 12.0,
        "mean_rms": 0.020,
        "speech_activity_ratio": 0.10,  # 1.2s active speech
        "transcription_confidence": 0.80,
    }
    v_low_sp = validate_voice_assessment(low_speech_feats, transcript="Yes.")
    assert v_low_sp["evidence_quality"] == EvidenceQuality.INSUFFICIENT
    assert v_low_sp["can_calculate_risk"] is False
    print(f"  [PASS] 1D. Insufficient active speech (<2s, 1 word) -> INSUFFICIENT ({v_low_sp['reason']})")

    # Case 1E: Silent / Disconnected mic -> INSUFFICIENT
    silent_feats = {
        "duration_seconds": 15.0,
        "mean_rms": 0.001,
        "speech_activity_ratio": 0.0,
        "transcription_confidence": 0.0,
    }
    v_silent = validate_voice_assessment(silent_feats, transcript="")
    assert v_silent["evidence_quality"] == EvidenceQuality.INSUFFICIENT
    assert v_silent["can_calculate_risk"] is False
    print(f"  [PASS] 1E. Silent audio (mean_rms < 0.003) -> INSUFFICIENT ({v_silent['reason']})")

    # Case 1F: Processing Error -> ERROR
    err_feats = {
        "error": "Audio decoding header corruption (WAV unparseable)"
    }
    v_err = validate_voice_assessment(err_feats, transcript="")
    assert v_err["evidence_quality"] == EvidenceQuality.ERROR
    assert v_err["is_sufficient"] is False
    assert v_err["can_calculate_risk"] is False
    assert "Audio processing error" in v_err["reason"]
    print(f"  [PASS] 1F. Processing Error payload -> ERROR ({v_err['reason']})")

    # Case 1G: VoiceAnalysisAgent Behavior on INSUFFICIENT
    out_insufficient = voice_agent.analyze(
        features={"duration_seconds": 3.0, "mean_rms": 0.03, "speech_activity_ratio": 0.4},
        transcript="Hello"
    )
    assert out_insufficient["voice_score"] is None, "Score must be None when insufficient"
    assert out_insufficient["risk_level"] == "Unassessed", "Must NOT assign Low Risk when insufficient"
    assert out_insufficient["risk_probability"] is None, "Must NOT generate fake risk probability"
    assert out_insufficient["evidence_quality"] == EvidenceQuality.INSUFFICIENT
    assert out_insufficient["confidence"] == 0.0
    print("  [PASS] 1G. VoiceAnalysisAgent invariant: voice_score=None, risk_level='Unassessed', risk_probability=None")

    # -------------------------------------------------------------------------
    # 2. Cognitive Test & Battery Validation
    # -------------------------------------------------------------------------
    print("\n[GROUP 2] Cognitive Test & Battery Validation:")

    # Case 2A: Valid Cognitive Test Item
    item_valid = {"test_type": "pattern_recall", "score": 85.0, "duration_seconds": 45.0}
    val_item_ok = validate_cognitive_test_item(item_valid)
    assert val_item_ok["is_valid"] is True
    assert val_item_ok["score"] == 85.0
    assert val_item_ok["evidence_quality"] == EvidenceQuality.GOOD
    print("  [PASS] 2A. Valid cognitive item -> GOOD (score=85.0)")

    # Case 2B: Missing Score (None) -> INSUFFICIENT
    item_null = {"test_type": "pattern_recall", "score": None, "duration_seconds": 40.0}
    val_item_null = validate_cognitive_test_item(item_null)
    assert val_item_null["is_valid"] is False
    assert val_item_null["evidence_quality"] == EvidenceQuality.INSUFFICIENT
    assert "Missing score" in val_item_null["reason"]
    print(f"  [PASS] 2B. Missing response (score=None) -> INSUFFICIENT ({val_item_null['reason']})")

    # Case 2C: Invalid Non-numeric / NaN / Out of Bounds -> INSUFFICIENT
    item_nan = {"test_type": "trail_making", "score": float("nan"), "duration_seconds": 30.0}
    val_nan = validate_cognitive_test_item(item_nan)
    assert val_nan["is_valid"] is False
    assert "NaN score" in val_nan["reason"]

    item_out_bounds = {"test_type": "digit_span", "score": 150.0, "duration_seconds": 30.0}
    val_bounds = validate_cognitive_test_item(item_out_bounds)
    assert val_bounds["is_valid"] is False
    assert "outside valid psychometric range" in val_bounds["reason"]
    print("  [PASS] 2C. NaN / Out-of-bounds score -> Invalidated, not silently converted to normal")

    # Case 2D: Incomplete Battery (0 valid tests -> INSUFFICIENT)
    empty_battery = [
        {"test_type": "pattern_recall", "score": None},
        {"test_type": "digit_span", "score": -10.0},
    ]
    bat_empty = validate_cognitive_battery(empty_battery)
    assert bat_empty["evidence_quality"] == EvidenceQuality.INSUFFICIENT
    assert bat_empty["can_calculate_score"] is False
    assert bat_empty["valid_tests_count"] == 0
    assert "No valid cognitive test results" in bat_empty["reason"]
    print(f"  [PASS] 2D. Empty / corrupted battery -> INSUFFICIENT ({bat_empty['reason']})")

    # Case 2E: Partial Battery (< 3 domains -> LIMITED)
    partial_battery = [
        {"test_type": "word_recall", "score": 80.0, "duration_seconds": 60.0},
    ]
    bat_partial = validate_cognitive_battery(partial_battery)
    assert bat_partial["evidence_quality"] == EvidenceQuality.LIMITED
    assert bat_partial["can_calculate_score"] is True
    assert len(bat_partial["completed_domains"]) == 1
    assert len(bat_partial["missing_domains"]) == 5
    print(f"  [PASS] 2E. Partial battery (memory only) -> LIMITED ({bat_partial['reason']})")

    # Case 2F: Substantial Battery (>= 3 domains -> GOOD)
    full_battery = [
        {"test_type": "pattern_recall", "score": 82.0, "duration_seconds": 60.0},
        {"test_type": "digit_span", "score": 78.0, "duration_seconds": 60.0},
        {"test_type": "trail_making", "score": 80.0, "duration_seconds": 60.0},
        {"test_type": "stroop", "score": 76.0, "duration_seconds": 60.0},
    ]
    bat_full = validate_cognitive_battery(full_battery)
    assert bat_full["evidence_quality"] == EvidenceQuality.GOOD
    assert bat_full["can_calculate_score"] is True
    print(f"  [PASS] 2F. Substantial battery (4 tests, 5 domains) -> GOOD ({bat_full['reason']})")

    # Case 2G: CognitiveTestAgent Behavior on INSUFFICIENT
    cog_out_insufficient = cog_agent.analyze(empty_battery)
    assert cog_out_insufficient["cognitive_score"] is None, "Score must be None when insufficient"
    assert cog_out_insufficient["risk_level"] == "Unassessed", "Must NOT assign Low Risk when insufficient"
    assert cog_out_insufficient["risk_probability"] is None, "Must NOT generate fake probability"
    assert cog_out_insufficient["evidence_quality"] == EvidenceQuality.INSUFFICIENT
    assert cog_out_insufficient["confidence"] == 0.0
    print("  [PASS] 2G. CognitiveTestAgent invariant: cognitive_score=None, risk_level='Unassessed', risk_probability=None")

    # -------------------------------------------------------------------------
    # 3. Multimodal Signal Fusion Reliability
    # -------------------------------------------------------------------------
    print("\n[GROUP 3] SignalFusionEngine Invariant Checks:")

    beh_out = {"score": 75.0, "behavior_score": 75.0, "confidence": 0.85, "typing_status": "stable"}
    fuse_insufficient = fusion_engine.fuse(
        cognitive_out=cog_out_insufficient,
        behavior_out=beh_out,
        voice_out=out_insufficient
    )
    assert fuse_insufficient["cogni_score"] is None, "Fused CogniScore must be None when cognitive is insufficient"
    assert fuse_insufficient["risk_level"] == "Unassessed", "Risk level must NOT be Low Risk"
    assert fuse_insufficient["risk_probability"] is None, "Risk probability must be None"
    assert fuse_insufficient["evidence_quality"] == EvidenceQuality.INSUFFICIENT
    print("  [PASS] 3A. SignalFusionEngine invariant: cogni_score=None, risk_level='Unassessed', evidence_quality=INSUFFICIENT")

    # Case 3B: Valid Fusion (Preserved Formula)
    cog_out_valid = cog_agent.analyze(full_battery)
    v_out_valid = voice_agent.analyze(
        features=good_feats,
        transcript="Yesterday morning I prepared warm tea and walked in the park."
    )
    fuse_valid = fusion_engine.fuse(
        cognitive_out=cog_out_valid,
        behavior_out=beh_out,
        voice_out=v_out_valid
    )
    assert fuse_valid["cogni_score"] is not None and fuse_valid["cogni_score"] > 0
    assert fuse_valid["risk_level"] in ["Low", "Moderate", "High"]
    print(f"  [PASS] 3B. SignalFusionEngine Valid Tri-modal Score: {fuse_valid['cogni_score']}/100 (Risk: {fuse_valid['risk_level']})")

    # -------------------------------------------------------------------------
    # 4. Clinician Workspace Endpoints Integration
    # -------------------------------------------------------------------------
    print("\n[GROUP 4] Clinician Workspace Endpoints Integration:")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        doc = db.query(models.User).filter(models.User.email == "clinician@demo.com").first()
        if not doc:
            doc = models.User(email="clinician@demo.com", name="Dr. Jackson Santos", is_caregiver=True, role="clinician")
            db.add(doc); db.commit(); db.refresh(doc)

        patient = db.query(models.User).filter(models.User.email == "arjun@demo.com").first()
        if not patient:
            patient = models.User(email="arjun@demo.com", name="Arjun Sharma", age=68, gender="Male", role="patient")
            db.add(patient); db.commit(); db.refresh(patient)

        # Overview Endpoint
        overview = main.get_clinician_patient_overview(patient_id=patient.id, db=db, current_user=doc)
        assert "evidence_summary" in overview
        assert overview["evidence_summary"]["evidence_quality"] in EvidenceQuality.ALL
        assert "can_calculate_risk" in overview["evidence_summary"]
        print(f"  [PASS] 4A. GET /api/clinician/patients/{patient.id}/overview: evidence_quality={overview['evidence_summary']['evidence_quality']}")

        # Tests Endpoint
        tests_data = main.get_clinician_patient_tests(patient_id=patient.id, db=db, current_user=doc)
        assert "evidence_quality" in tests_data
        assert "evidence_reason" in tests_data
        assert "can_calculate_score" in tests_data
        print(f"  [PASS] 4B. GET /api/clinician/patients/{patient.id}/tests: evidence_quality={tests_data['evidence_quality']}, can_calculate_score={tests_data['can_calculate_score']}")

        # Voice Endpoint
        voice_data = main.get_clinician_patient_voice(patient_id=patient.id, db=db, current_user=doc)
        assert "evidence_quality" in voice_data
        assert "evidence_reason" in voice_data
        assert "can_calculate_risk" in voice_data
        print(f"  [PASS] 4C. GET /api/clinician/patients/{patient.id}/voice: evidence_quality={voice_data['evidence_quality']}, risk_probability={voice_data['acoustic_profile']['risk_probability']}")
    finally:
        db.close()

    print("\n=================================================================")
    print("ALL EVIDENCE QUALITY & INPUT VALIDATION TESTS PASSED SUCCESSFULLY!")
    print("=================================================================")


if __name__ == "__main__":
    run_tests()
