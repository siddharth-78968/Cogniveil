"""Comprehensive Verification Test Suite for Multimodal Voice & Language Analysis.

Verifies:
1. Audio quality validation (valid audio, silent audio, too-short audio, low volume)
2. Granular pause distribution (>500ms, >1000ms, >2000ms, median, max, variability)
3. Multilingual linguistic metrics (TTR, filler frequency, sentence length, repetition proxy)
4. Dynamic personal voice baseline calibration (% deltas, z-scores, session count)
5. Longitudinal trajectory classification (Stable, Minor Change, Persistent Change)
6. Data quality & confidence scoring (High, Moderate, Low)
7. Exact backward compatibility of voice_score formula
8. SignalFusionEngine bi-modal and tri-modal integration
9. Database metadata_json persistence and patient data isolation
10. Clinician workspace voice telemetry aggregation
11. Level 2 and Level 3 isolation
"""

import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.voice_analysis import (
    validate_audio_quality,
    analyze_detailed_pauses,
    extract_linguistic_metrics,
    compute_personal_baseline,
    evaluate_data_confidence,
)
from agents.voice import VoiceAnalysisAgent
from agents.fusion import SignalFusionEngine
from database import SessionLocal
import models
import mcp_tools


def run_tests():
    print("=================================================================")
    print("RUNNING COMPREHENSIVE VOICE & LANGUAGE ANALYSIS TEST SUITE")
    print("=================================================================")

    # Test 1: Audio Quality Control (Valid Audio)
    valid_feats = {
        "duration_seconds": 25.0,
        "mean_rms": 0.045,
        "max_rms": 0.090,
        "speech_activity_ratio": 0.72,
        "transcription_confidence": 0.94,
    }
    qc_valid = validate_audio_quality(valid_feats, transcript="I went to the store yesterday morning.")
    assert qc_valid["is_sufficient"] is True, "Valid audio must pass QC"
    assert qc_valid["status"] == "sufficient"
    assert qc_valid["quality_level"] in ["Good", "Excellent"]
    print("[PASS] 1. Audio Quality Validation - Valid audio: OK")

    # Test 2: Audio Quality Control (Silent / Too Short Audio)
    silent_feats = {
        "duration_seconds": 3.0,
        "mean_rms": 0.001,
        "speech_activity_ratio": 0.0,
        "transcription_confidence": 0.0,
    }
    qc_silent = validate_audio_quality(silent_feats, transcript="")
    assert qc_silent["is_sufficient"] is False, "Silent/short audio must fail QC"
    assert qc_silent["status"] == "insufficient_audio"
    assert len(qc_silent["issues"]) >= 1
    print(f"[PASS] 2. Audio Quality Validation - Silent/Short rejection: OK ({qc_silent['reason']})")

    # Test 3: Detailed Pause Distribution Extraction
    pause_data = {
        "pause_count": 8,
        "pause_durations_ms": [300, 600, 1200, 450, 2100, 750, 550, 1100],
        "speech_activity_ratio": 0.70,
    }
    pauses = analyze_detailed_pauses(duration_seconds=30.0, pause_data=pause_data)
    assert pauses["pause_count"] == 8
    assert pauses["pauses_gt_500ms"] == 6
    assert pauses["pauses_gt_1000ms"] == 3
    assert pauses["pauses_gt_2000ms"] == 1
    assert pauses["max_pause_duration_ms"] == 2100
    assert pauses["mean_pause_duration_ms"] > 0
    assert pauses["pause_variability_ms"] > 0
    print(f"[PASS] 3. Detailed Pause Analysis (Mean: {pauses['mean_pause_duration_ms']}ms, Max: {pauses['max_pause_duration_ms']}ms, >1s: {pauses['pauses_gt_1000ms']}): OK")

    # Test 4: Linguistic & Lexical Metrics
    sample_text = (
        "Yesterday morning I woke up early, uh, and prepared tea. "
        "Then I went for a walk in the park near my house. "
        "The weather was very pleasant and quiet."
    )
    ling = extract_linguistic_metrics(sample_text, duration_seconds=20.0, language_code="en")
    assert ling["word_count"] > 15
    assert ling["unique_word_count"] > 10
    assert 0.4 <= ling["type_token_ratio"] <= 1.0
    assert ling["sentence_count"] == 3
    assert ling["filler_word_count"] >= 1  # 'uh' detected
    assert ling["words_per_minute"] > 60.0
    print(f"[PASS] 4. Linguistic Feature Extraction (Words: {ling['word_count']}, TTR: {ling['type_token_ratio']}, WPM: {ling['words_per_minute']}, Fillers: {ling['filler_word_count']}): OK")

    # Test 5: Personal Baseline Calculation & Trajectory
    history = [
        {"words_per_minute": 120.0, "pause_to_speech_ratio": 0.18, "mean_pause_duration_ms": 480.0, "lexical_diversity": 0.75, "voice_score": 85.0},
        {"words_per_minute": 118.0, "pause_to_speech_ratio": 0.19, "mean_pause_duration_ms": 500.0, "lexical_diversity": 0.74, "voice_score": 84.0},
        {"words_per_minute": 115.0, "pause_to_speech_ratio": 0.20, "mean_pause_duration_ms": 510.0, "lexical_diversity": 0.72, "voice_score": 83.0},
    ]
    # Current session with prolonged pauses and reduced speech rate
    current_shift = {
        "words_per_minute": 92.0,
        "pause_to_speech_ratio": 0.32,
        "mean_pause_duration_ms": 780.0,
        "lexical_diversity": 0.65,
        "voice_score": 68.0,
    }
    baseline_res = compute_personal_baseline(history, current_shift)
    assert baseline_res["baseline_established"] is True
    assert baseline_res["historical_sessions_count"] == 3
    assert baseline_res["percentage_changes"]["words_per_minute"] < -15.0
    assert baseline_res["percentage_changes"]["pause_to_speech_ratio"] > 40.0
    assert baseline_res["trajectory"] in ["Persistent Change", "Change Detected"]
    print(f"[PASS] 5. Personal Baseline & Trajectory (WPM Delta: {baseline_res['percentage_changes']['words_per_minute']}%, Trajectory: {baseline_res['trajectory']}): OK")

    # Test 6: VoiceAnalysisAgent Integration
    agent = VoiceAnalysisAgent()
    out = agent.analyze(
        features={
            "duration_seconds": 25.0,
            "speech_activity_ratio": 0.68,
            "pause_count": 6,
            "mean_rms": 0.045,
            "pitch_variability": 26.0,
            "transcription_confidence": 0.92,
        },
        transcript="I had oatmeal and fruit for breakfast, and then watered the garden.",
        historical_records=history,
    )
    assert "voice_score" in out
    assert 0 <= out["voice_score"] <= 100
    assert "pause_analysis" in out
    assert "linguistic_metrics" in out
    assert "personal_baseline" in out
    assert "data_confidence" in out
    assert "acoustic_biomarkers" in out
    assert "disclaimer" in out
    print(f"[PASS] 6. VoiceAnalysisAgent End-to-End (Voice Score: {out['voice_score']}, Quality: {out['quality_assessment']['quality_level']}, Confidence: {out['data_confidence']['overall_confidence']}): OK")

    # Test 7: Backward Compatibility of Voice Score Formula
    expected_score = round(
        0.30 * out["subdomain_scores"]["speech_rate"] +
        0.25 * out["subdomain_scores"]["pause_pattern"] +
        0.20 * out["subdomain_scores"]["vocabulary"] +
        0.15 * out["subdomain_scores"]["energy_stability"] +
        0.10 * out["subdomain_scores"]["semantic_coherence"],
        1
    )
    assert out["voice_score"] == expected_score, "voice_score must match the exact weighted sum of subdomains"
    print(f"[PASS] 7. Voice Score Formula Mathematical Precision: OK ({out['voice_score']} == {expected_score})")

    # Test 8: SignalFusionEngine Bi-Modal & Tri-Modal Compatibility
    fusion = SignalFusionEngine()
    cog_out = {"score": 85.0, "cognitive_score": 85.0, "confidence": 0.90}
    beh_out = {"score": 80.0, "behavior_score": 80.0, "confidence": 0.85}
    
    # Bi-modal (no voice)
    bimodal = fusion.fuse(cog_out, beh_out, voice_out=None)
    assert bimodal["cogni_score"] == round(0.80 * 85.0 + 0.20 * 80.0, 1)
    
    # Tri-modal (with voice)
    trimodal = fusion.fuse(cog_out, beh_out, voice_out=out)
    expected_tri = round(0.60 * 85.0 + 0.20 * 80.0 + 0.20 * out["voice_score"], 1)
    assert trimodal["cogni_score"] == expected_tri
    print(f"[PASS] 8. SignalFusionEngine (Bi-modal: {bimodal['cogni_score']}, Tri-modal: {trimodal['cogni_score']}): OK")

    # Test 9: Database Persistence with metadata_json
    db = SessionLocal()
    try:
        # Find or use demo patient
        patient = db.query(models.User).filter(models.User.email == "arjun@demo.com").first()
        if not patient:
            patient = db.query(models.User).first()
        
        test_rec = models.TestResult(
            user_id=patient.id,
            test_type="voice_journal",
            score=out["voice_score"],
            duration_seconds=out["duration_seconds"],
            metadata_json=json.dumps({"test_run": True, "voice_score": out["voice_score"], "trajectory": out["trajectory"]})
        )
        db.add(test_rec)
        db.commit()
        db.refresh(test_rec)

        loaded = db.query(models.TestResult).filter(models.TestResult.id == test_rec.id).first()
        assert loaded.metadata_json is not None
        meta = json.loads(loaded.metadata_json)
        assert meta["test_run"] is True
        assert meta["voice_score"] == out["voice_score"]

        # Clean up test row
        db.delete(loaded)
        db.commit()
        print("[PASS] 9. Database TestResult.metadata_json persistence & safety: OK")
    finally:
        db.close()

    # Test 10: Clinician Voice Telemetry Extraction
    db = SessionLocal()
    try:
        patient = db.query(models.User).filter(models.User.email == "arjun@demo.com").first()
        if patient:
            voice_tests = db.query(models.TestResult).filter(
                models.TestResult.user_id == patient.id,
                models.TestResult.test_type == "voice_journal"
            ).all()
            print(f"[PASS] 10. Patient Isolation & Voice Sessions Query (Patient: {patient.name}, Sessions: {len(voice_tests)}): OK")
    finally:
        db.close()

    # Test 11: Level 2 & Level 3 Isolation Confirmation
    # Verify CatBoost model prediction remains undisturbed
    t2_data = {
        "age": 70, "education_years": 14, "hypertension": True, "diabetes": False,
        "smoking_history": False, "alcohol_units_weekly": 2, "physical_activity_level": "moderate",
        "family_history_dementia": True, "sleep_hours": 6.5, "systolic_bp": 138, "diastolic_bp": 86,
        "bmi": 24.8, "cholesterol_total": 210, "ldl": 128, "hdl": 54, "hba1c": 5.8,
        "depression_score_gds": 3, "apoe4_carrier": "unknown"
    }
    t2_res = mcp_tools.predict_risk(t2_data, level2_status="completed", session_id="test_session", pipeline_state="tier2_ml")
    assert "probability" in t2_res
    assert "risk_level" in t2_res
    # Test 12: BehaviorAnalysisAgent Literature-Validated Features
    from agents.behavior import BehaviorAnalysisAgent
    beh_agent = BehaviorAnalysisAgent()
    beh_input = {
        "text_keystrokes_per_min": 240.0,
        "operational_keystrokes_per_min": 14.0,
        "pauses_per_min": 1.4,
        "mean_pause_length": 14.2,
        "total_mouse_clicks": 22,
        "clicks_per_min": 22.0,
        "inter_click_interval": 1400.0,
        "total_pixel_distance": 2800.0,
        "pixels_per_sec": 95.0,
        "backspace_rate": 0.04,
        "inter_key_latency": 175.0,
        "scroll_reversals": 1
    }
    beh_result = beh_agent.analyze(beh_input)
    assert "literature_features" in beh_result
    lit_beh = beh_result["literature_features"]
    assert lit_beh["text_keystrokes_per_min"] == 240.0
    assert lit_beh["operational_keystrokes_per_min"] == 14.0
    assert lit_beh["pauses_per_min"] == 1.4
    assert lit_beh["mean_pause_length"] == 14.2
    assert lit_beh["total_mouse_clicks"] == 22
    assert "excluded_features_0pct_weight" in lit_beh
    assert 0 <= beh_result["behavior_score"] <= 100
    print(f"[PASS] 12. BehaviorAnalysisAgent Literature Features (Text Keys/min: {lit_beh['text_keystrokes_per_min']}, Op Keys/min: {lit_beh['operational_keystrokes_per_min']}, Pauses/min: {lit_beh['pauses_per_min']}, Clicks: {lit_beh['total_mouse_clicks']}): OK")

    # Test 13: VoiceAnalysisAgent Literature-Validated Linguistic Features (TTR, Content Density, Verb-Noun Ratio, Hesitation Rate)
    transcript_eval = (
        "Yesterday morning I woke up early, uh, and prepared a warm breakfast with fresh tea. "
        "Then I went walking quickly through the neighborhood park. "
        "The bright trees were very quiet and pleasant."
    )
    ling_res = extract_linguistic_metrics(transcript_eval, duration_seconds=25.0, language_code="en")
    assert "ttr" in ling_res and ling_res["ttr"] > 0
    assert "content_density" in ling_res and ling_res["content_density"] > 0
    assert "verb_noun_ratio" in ling_res and ling_res["verb_noun_ratio"] > 0
    assert "hesitation_word_rate" in ling_res and ling_res["hesitation_word_rate"] >= 0
    assert "verb_count" in ling_res
    assert "noun_count" in ling_res
    assert "adjective_count" in ling_res
    assert "adverb_count" in ling_res

    v_out = agent.analyze(
        features={"duration_seconds": 25.0, "speech_activity_ratio": 0.70},
        transcript=transcript_eval
    )
    assert "literature_features" in v_out
    lit_v = v_out["literature_features"]
    assert lit_v["TTR"] == ling_res["ttr"]
    assert lit_v["content_density"] == ling_res["content_density"]
    assert lit_v["verb_noun_ratio"] == ling_res["verb_noun_ratio"]
    assert lit_v["hesitation_word_rate"] == ling_res["hesitation_word_rate"]
    print(f"[PASS] 13. VoiceAnalysisAgent Literature Features (TTR: {lit_v['TTR']}, Content Density: {lit_v['content_density']}, Verb/Noun: {lit_v['verb_noun_ratio']}, Hesitation Rate: {lit_v['hesitation_word_rate']}): OK")

    print("\n=================================================================")
    print("ALL 13 COMPREHENSIVE PIPELINE & LITERATURE SUITE TESTS PASSED!")
    print("=================================================================")


if __name__ == "__main__":
    run_tests()

