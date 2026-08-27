import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from main import app
from database import get_db
import models
import mcp_tools
import mcp_server
from agents import (
    BehaviorAnalysisAgent,
    VoiceAnalysisAgent,
    CognitiveTestAgent,
    SignalFusionEngine,
    LongitudinalTrendAgent,
    RiskOrchestrationAgent,
    ClinicalSynthesisAgent,
    SafetyAgent,
    AuditAgent
)

client = TestClient(app)

print("==================================================")
print("     COGNIVEIL MULTI-AGENT VERIFICATION SUITE     ")
print("==================================================\n")

# 1. Health check
res = client.get("/")
assert res.status_code == 200, f"Root failed: {res.text}"
print("[PASS] 1. Root API Endpoint: OK")

# 2. Seed Demo Data
res = client.get("/setup-demo")
assert res.status_code == 200, f"Seed demo failed: {res.text}"
print("[PASS] 2. Demo Seed Database & Established Baselines: OK")

# 3. BehaviorAnalysisAgent Unit Verification
beh_agent = BehaviorAnalysisAgent()
beh_input = {
    "typing_speed": 36.0,
    "inter_key_latency": 260.0,
    "latency_variance": 52.0,
    "backspace_rate": 0.22,
    "correction_rate": 0.28,
    "typing_pauses": 7,
    "burst_duration": 2.1,
    "scroll_velocity": 45.0,
    "scroll_hesitation": 2.8,
    "scroll_reversals": 6,
    "idle_time": 12.0,
    "interaction_errors": 3,
    "task_completion_time": 110.0
}
beh_baseline = {"typing_speed": 58.0, "backspace_rate": 0.04, "scroll_hesitation": 1.0, "passive_score": 80.0}
beh_out = beh_agent.analyze(beh_input, baseline=beh_baseline)
assert beh_out["typing_status"] == "declining"
assert beh_out["scrolling_status"] in ["elevated_hesitation", "irregular"]
assert beh_out["behavioral_drift_score"] >= 0.50
assert beh_out["baseline_deviation"] < -10.0
assert "Alzheimer" not in beh_out["explanation"]
print(f"[PASS] 3. BehaviorAnalysisAgent (Status: {beh_out['typing_status']}, Drift: {beh_out['behavioral_drift_score']}, Non-diagnostic wording): OK")

# 4. VoiceAnalysisAgent Unit Verification
voice_agent_inst = VoiceAnalysisAgent()
voice_features = {
    "duration_seconds": 45.0,
    "speech_activity_ratio": 0.42,
    "pause_count": 14,
    "pause_rate_per_minute": 18.6,
    "mean_pause_duration": 1.45,
    "long_pause_frequency": 6,
    "mean_rms": 0.038,
    "pitch_variability": 19.2,
    "words_per_minute": 88.0,
    "vocabulary_richness": 0.52,
    "transcription_confidence": 0.93,
    "detected_language": "English"
}
voice_transcript = "Um... today I went to the... the grocery store... and uh... forgot my list."
voice_out = voice_agent_inst.analyze(voice_features, transcript=voice_transcript)
assert voice_out["speech_status"] in ["elevated_concern", "mild_concern"]
assert voice_out["pause_pattern"] == "increased"
assert voice_out["speech_rate"] == "below_baseline"
assert "Alzheimer" not in voice_out["explanation"]
assert "elevated speech-related cognitive indicators" in voice_out["explanation"].lower() or "biomarkers" in voice_out["explanation"].lower()
print(f"[PASS] 4. VoiceAnalysisAgent (Speech Status: {voice_out['speech_status']}, Pause Pattern: {voice_out['pause_pattern']}): OK")

# 5. CognitiveTestAgent Unit Verification
cog_agent_inst = CognitiveTestAgent()
mock_tests = [
    {"test_type": "pattern_recall", "score": 38.0, "duration_seconds": 60.0, "memory_accuracy": 40.0},
    {"test_type": "word_recall", "score": 35.0, "duration_seconds": 75.0, "delayed_recall": 32.0},
    {"test_type": "stroop", "score": 45.0, "duration_seconds": 55.0, "stroop_accuracy": 50.0},
    {"test_type": "reaction_time", "score": 42.0, "duration_seconds": 45.0, "reaction_time_ms": 680.0}
]
cog_out = cog_agent_inst.analyze(mock_tests)
assert cog_out["cognitive_status"] in ["significant_decline", "mild_decline"]
assert cog_out["memory"] == "declining"
assert "subdomain_scores" in cog_out
print(f"[PASS] 5. CognitiveTestAgent (Subdomains -> Memory: {cog_out['subdomain_scores']['memory']}, Attention: {cog_out['subdomain_scores']['attention']}, Status: {cog_out['cognitive_status']}): OK")

# 6. SignalFusionEngine Verification (Tri-modal & Bi-modal)
fusion_engine_inst = SignalFusionEngine()
tri_fusion = fusion_engine_inst.fuse(cog_out, beh_out, voice_out)
assert tri_fusion["fusion_mode"].startswith("tri_modal")
assert tri_fusion["cogni_score"] > 0
assert tri_fusion["fusion_weights"]["cognitive"] == 0.60
assert tri_fusion["fusion_weights"]["behavioral"] == 0.20
assert tri_fusion["fusion_weights"]["voice"] == 0.20

bi_fusion = fusion_engine_inst.fuse(cog_out, beh_out, None)
assert bi_fusion["fusion_mode"].startswith("bi_modal")
assert bi_fusion["fusion_weights"]["cognitive"] == 0.80
assert bi_fusion["fusion_weights"]["behavioral"] == 0.20
print(f"[PASS] 6. SignalFusionEngine (Tri-modal CogniScore: {tri_fusion['cogni_score']}, Bi-modal CogniScore: {bi_fusion['cogni_score']}): OK")

# 7. LongitudinalTrendAgent (Persistent Decline vs Transient Fluctuation)
long_agent_inst = LongitudinalTrendAgent()
# Simulated 14 days of historical scores with sustained drop
declining_history = [85, 84, 82, 80, 81, 79, 78, 75, 72, 68, 65, 60, 58, 55]
long_out_persistent = long_agent_inst.analyze(
    historical_scores=declining_history,
    current_score=52.0,
    voice_trend="declining",
    typing_trend="declining",
    memory_trend="declining"
)
assert long_out_persistent["trend_classification"] == "persistent_decline"
assert long_out_persistent["is_deviating"] is True
assert long_out_persistent["persistent_pattern"] is True

# Simulated single-day drop after stable baseline
stable_history = [82, 81, 83, 82, 80, 82, 81, 83, 82, 81, 82, 83, 82, 81]
long_out_transient = long_agent_inst.analyze(
    historical_scores=stable_history,
    current_score=68.0,
    voice_trend="stable",
    typing_trend="stable",
    memory_trend="stable"
)
assert long_out_transient["trend_classification"] == "transient_fluctuation"
print(f"[PASS] 7. LongitudinalTrendAgent (Persistent Trend: {long_out_persistent['trend_classification']}, Transient Trend: {long_out_transient['trend_classification']}): OK")

# 8. SafetyAgent Guardrail Sanitization Verification
safety_agent_inst = SafetyAgent()
unsafe_narrative = (
    "Based on this screening, you have Alzheimer's disease. "
    "You definitely have dementia. This proves dementia and represents a definitive diagnosis."
)
safety_out = safety_agent_inst.review(unsafe_narrative, risk_level="High")
assert safety_out["guardrail_passed"] is False
assert safety_out["remediation_applied"] is True
assert "you have alzheimer's" not in safety_out["sanitized_narrative"].lower()
assert "definitive diagnosis" not in safety_out["sanitized_narrative"].lower()
assert "Medical Disclaimer" in safety_out["sanitized_narrative"]
print("[PASS] 8. SafetyAgent (Sanitized forbidden claims into probabilistic screening language & appended disclaimer): OK")

# 9. AuditAgent Event Trace Verification
audit_agent_inst = AuditAgent()
audit_event = audit_agent_inst.record_event(
    db=None,
    user_id=101,
    agent_name="RiskOrchestrationAgent",
    tool_name="predict_risk",
    input_data={"features_count": 24},
    output_data={"risk_level": "High", "probability": 0.88},
    input_provenance="clinically_obtained",
    pipeline_state="full_pipeline_completed",
    next_action="classify_mri",
    session_id="S_101_TEST"
)
assert audit_event["agent"] == "RiskOrchestrationAgent"
assert audit_event["next_action"] == "classify_mri"
assert audit_event["input_provenance"] == "clinically_obtained"
print(f"[PASS] 9. AuditAgent (Structured event trace generated with provenance and next_action): OK")

# 10. Complete 18 MCP Tools Suite Verification
print("\n--- Verifying All 18 MCP Tools ---")
# 01 validate_input
assert mcp_server.call_tool("01_validate_input", {"data": {"Age": 70, "CognitiveScore": 75}})["is_valid"] is True
# 02 collect_baseline
assert mcp_server.call_tool("02_collect_baseline", {"historical_scores": [80, 82, 81], "target_days": 7})["baseline_status"] == "collecting"
# 03 score_tier1
assert "score" in mcp_server.call_tool("03_score_tier1", {"active_scores": [80], "historical_scores": [80, 80, 80, 80, 80, 80, 80]})
# 04 analyze_cognitive_tests
assert "subdomain_scores" in mcp_server.call_tool("04_analyze_cognitive_tests", {"test_results": mock_tests})
# 05 analyze_typing
assert "typing_status" in mcp_server.call_tool("05_analyze_typing", {"typing_data": beh_input})
# 06 analyze_scrolling
assert "scrolling_status" in mcp_server.call_tool("06_analyze_scrolling", {"scroll_data": beh_input})
# 07 detect_language
assert mcp_server.call_tool("07_detect_language", {"text": "Namaskaram nenu bagunnanu"})["detected_language"] == "Telugu"
# 08 analyze_voice
assert "speech_status" in mcp_server.call_tool("08_analyze_voice", {"features": voice_features, "transcript": voice_transcript})
# 09 analyze_longitudinal_trend
assert "trend_classification" in mcp_server.call_tool("09_analyze_longitudinal_trend", {"historical_scores": declining_history, "current_score": 52.0})
# 10 predict_risk
l2_data = {
    "Country": "India", "Age": 78, "Gender": "Male", "Education_Level": 10,
    "BMI": 26.5, "Physical_Activity": "Low", "Smoking_Status": "Former",
    "AlcoholConsumption": "Occasional", "Diabetic": "Yes", "Hypertension": "Yes",
    "CholesterolLevel": "High", "Family_History": "Yes", "CognitiveScore": 32,
    "Depression_Status": "Yes", "Sleep_Quality": "Poor", "Nutrition_Diet": "Fair",
    "AirPollution": "High", "EmploymentStatus": "Retired", "MaritalStatus": "Widowed",
    "APOE_e4": "Positive", "SocialEngagement": "Low", "IncomeLevel": "Low",
    "StressLevels": "High", "Genetic_Risk": "High", "Active_Score": 30.0,
    "Passive_Score": 35.0, "typing_speed": 35.0, "backspace_rate": 0.25,
    "apoe_e4_provenance": "clinically_obtained", "mri_provenance": "clinically_obtained"
}
l2_res = mcp_server.call_tool("10_predict_risk", {"patient_data": l2_data})
assert l2_res["status"] == "success"
# 11 classify_mri
mri_res = mcp_server.call_tool("11_classify_mri", {"filename": "brain_mri.jpg"})
assert "predicted_class" in mri_res
# 12 calculate_morphometry
morph_res = mcp_server.call_tool("12_calculate_morphometry", {"mri_result": mri_res})
assert "brain_parenchymal_fraction" in morph_res
# 13 retrieve_guideline
guidelines_res = mcp_server.call_tool("13_retrieve_guideline", {"risk_level": "High"})
assert len(guidelines_res) >= 2
# 14 synthesize_evidence
evidence_res = mcp_server.call_tool("14_synthesize_evidence", {
    "patient_name": "Rajan Pillai", "age": 78,
    "tier1_summary": {"score": 35.0, "risk_level": "High"},
    "longitudinal_summary": {"is_deviating": True, "trend_classification": "persistent_decline"}
})
assert len(evidence_res["evidence_items"]) >= 1
# 15 draft_report
report_res = mcp_server.call_tool("15_draft_report", {
    "patient_name": "Rajan Pillai", "age": 78, "cogni_score": 35.0, "risk_level": "High", "is_deviating": True
})
assert "MEDGEMMA-4B SYNTHESIS" in report_res["report"]
# 16 check_output_safety
assert mcp_server.call_tool("16_check_output_safety", {"narrative": report_res["report"]})["guardrail_passed"] is True
# 17 generate_referral
referral_res = mcp_server.call_tool("17_generate_referral", {"risk_level": "High", "is_deviating": True})
assert referral_res["urgency"] == "High"
# 18 log_audit
audit_mcp = mcp_server.call_tool("18_log_audit", {"user_id": 1, "tool_name": "test_mcp", "input_data": {}, "output_data": {}})
assert audit_mcp["tool"] == "test_mcp"
print("[PASS] 10. All 18 MCP Tools Verified (Schemas, execution, and dispatch): OK")

# 11. End-to-End API Orchestrator Endpoint (/api/orchestrate)
login_payload = {"email": "rajan@demo.com", "password": "demo1234"}
res_rajan = client.post("/login", json=login_payload)
assert res_rajan.status_code == 200
rajan_token = res_rajan.json()["access_token"]
rajan_headers = {"Authorization": f"Bearer {rajan_token}"}

# First submit Level 2 questionnaire to complete profile
res_l2_submit = client.post("/api/level2/submit", json=l2_data, headers=rajan_headers)
assert res_l2_submit.status_code == 200

# Call orchestrate endpoint
orch_payload = {
    "voice_features": voice_features,
    "voice_transcript": voice_transcript,
    "mri_filename": "patient_mri_t1.dcm"
}
res_orch = client.post("/api/orchestrate", json=orch_payload, headers=rajan_headers)
assert res_orch.status_code == 200
orch_data = res_orch.json()
assert orch_data["pipeline_state"] == "full_pipeline_completed"
assert orch_data["tier1_fusion"] is not None
assert orch_data["cognitive_analysis"] is not None
assert orch_data["behavioral_analysis"] is not None
assert orch_data["voice_analysis"] is not None
assert orch_data["longitudinal_trend"] is not None
assert orch_data["tier2_ml"] is not None
assert orch_data["tier3_mri"] is not None
assert orch_data["safety_review"]["guardrail_passed"] is True
print(f"[PASS] 11. Master RiskOrchestrationAgent (/api/orchestrate State: {orch_data['pipeline_state']}, Fused Score: {orch_data['tier1_fusion']['cogni_score']}): OK")

print("\n==================================================")
print("  ALL 9 AGENTS & 18 MCP TOOLS FULLY OPERATIONAL!  ")
print("==================================================")
