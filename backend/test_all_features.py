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
    DataQualityAgent,
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

# 3. DataQualityAgent Verification
dq_agent = DataQualityAgent()
dq_telemetry_pass = dq_agent.check_telemetry({"total_keys": 45, "session_duration": 60.0})
assert dq_telemetry_pass["is_sufficient"] is True
dq_voice_pass = dq_agent.check_voice({"duration_seconds": 25.0, "mean_rms": 0.045, "transcription_confidence": 0.92}, transcript="Hello doctor")
assert dq_voice_pass["is_sufficient"] is True
print("[PASS] 3. DataQualityAgent (Telemetry & Voice Sufficiency Validation): OK")

# 4. BehaviorAnalysisAgent - Decomposed Typing & Scrolling Sub-Scores
beh_agent = BehaviorAnalysisAgent()
beh_input = {
    "typing_speed": 27.0,
    "inter_key_latency": 410.0,
    "latency_variance": 52.0,
    "backspace_rate": 0.132,
    "correction_rate": 0.18,
    "typing_pauses": 4.1,
    "burst_duration": 2.1,
    "scroll_velocity": 410.0,
    "scroll_hesitation": 5.2,
    "scroll_reversals": 8,
    "idle_intervals": 6,
    "interaction_errors": 3,
    "task_completion_time": 110.0
}
beh_baseline = {
    "typing_speed": 34.0, "inter_key_latency": 320.0, "backspace_rate": 7.4, "typing_pauses": 2.0,
    "scroll_velocity": 480.0, "scroll_hesitation": 2.8, "scroll_reversals": 4, "idle_intervals": 3,
    "passive_score": 80.0
}
beh_out = beh_agent.analyze(beh_input, baseline=beh_baseline)

# Verify Typing Score & Metrics
assert "typing" in beh_out
assert beh_out["typing"]["score"] > 0
assert beh_out["typing"]["metrics"]["typing_speed"]["change_percent"] < 0
assert "reasoning" in beh_out["typing"]

# Verify Scrolling Score & Metrics
assert "scrolling" in beh_out
assert beh_out["scrolling"]["score"] > 0
assert beh_out["scrolling"]["metrics"]["scroll_hesitation"]["change_percent"] > 0
assert "reasoning" in beh_out["scrolling"]

# Verify Composite Behavioral Score
assert beh_out["behavior_score"] > 0
assert beh_out["behavior_status"] in ["declining", "mild_decline", "significant_decline"]
assert "Alzheimer" not in beh_out["explanation"]
print(f"[PASS] 4. BehaviorAnalysisAgent (Typing Score: {beh_out['typing']['score']}, Scrolling Score: {beh_out['scrolling']['score']} -> Behavioral Score: {beh_out['behavior_score']}/100): OK")

# 5. VoiceAnalysisAgent - Acoustic Subdomains & Metrics
voice_agent_inst = VoiceAnalysisAgent()
voice_features = {
    "duration_seconds": 45.0,
    "speech_activity_ratio": 0.55,
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
voice_baseline = {"wpm": 125.0, "pause_rate": 8.0, "vocabulary_richness": 0.70}
voice_transcript = "Um... today I went to the... the grocery store... and uh... forgot my list."
voice_out = voice_agent_inst.analyze(voice_features, transcript=voice_transcript, baseline=voice_baseline)

assert voice_out["voice_score"] > 0
assert "subdomain_scores" in voice_out
assert "speech_rate" in voice_out["subdomain_scores"]
assert "pause_pattern" in voice_out["subdomain_scores"]
assert "metrics" in voice_out
assert "Alzheimer" not in voice_out["explanation"]
print(f"[PASS] 5. VoiceAnalysisAgent (Voice Score: {voice_out['voice_score']}/100, Speech Rate: {voice_out['subdomain_scores']['speech_rate']}, Pause: {voice_out['subdomain_scores']['pause_pattern']}): OK")

# 6. CognitiveTestAgent - Subdomain Breakdown
cog_agent_inst = CognitiveTestAgent()
mock_tests = [
    {"test_type": "pattern_recall", "score": 38.0, "duration_seconds": 60.0, "memory_accuracy": 40.0},
    {"test_type": "word_recall", "score": 35.0, "duration_seconds": 75.0, "delayed_recall": 32.0},
    {"test_type": "stroop", "score": 45.0, "duration_seconds": 55.0, "stroop_accuracy": 50.0},
    {"test_type": "reaction_time", "score": 42.0, "duration_seconds": 45.0, "reaction_time_ms": 680.0}
]
cog_baseline = {"memory": 82.0, "reaction": 80.0, "stroop": 80.0, "processing_speed": 80.0, "attention": 80.0}
cog_out = cog_agent_inst.analyze(mock_tests, baseline=cog_baseline)

assert cog_out["cognitive_score"] > 0
assert "subdomain_scores" in cog_out
assert "memory" in cog_out["subdomain_scores"]
assert "stroop" in cog_out["subdomain_scores"]
assert "metrics" in cog_out
print(f"[PASS] 6. CognitiveTestAgent (Cognitive Score: {cog_out['cognitive_score']}/100, Memory: {cog_out['subdomain_scores']['memory']}, Stroop: {cog_out['subdomain_scores']['stroop']}): OK")

# 7. SignalFusionEngine - Numeric Contributions & Primary Contributors Ranking
fusion_engine_inst = SignalFusionEngine()
tri_fusion = fusion_engine_inst.fuse(cog_out, beh_out, voice_out)

assert tri_fusion["fusion_mode"].startswith("tri_modal")
assert tri_fusion["cogni_score"] > 0
assert "numeric_contributions" in tri_fusion
assert "cognitive" in tri_fusion["numeric_contributions"]
assert "behavioral" in tri_fusion["numeric_contributions"]
assert "voice" in tri_fusion["numeric_contributions"]
assert len(tri_fusion["primary_contributors"]) > 0
print(f"[PASS] 7. SignalFusionEngine (CogniScore: {tri_fusion['cogni_score']}, Contribs -> Cog: {tri_fusion['numeric_contributions']['cognitive']}, Beh: {tri_fusion['numeric_contributions']['behavioral']}, Voice: {tri_fusion['numeric_contributions']['voice']}): OK")

# 8. LongitudinalTrendAgent
long_agent_inst = LongitudinalTrendAgent()
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
print(f"[PASS] 8. LongitudinalTrendAgent (Persistent Drift: {long_out_persistent['trend_classification']}, CUSUM: {long_out_persistent['cusum_value']}): OK")

# 9. ClinicalSynthesisAgent - Fixed 12-Section MedGemma Structured Dossier
clin_agent = ClinicalSynthesisAgent()
synth_res = clin_agent.synthesize(
    patient_name="Rajan Pillai",
    age=78,
    tier1_summary=tri_fusion,
    longitudinal_summary=long_out_persistent,
    cognitive_summary=cog_out,
    behavior_summary=beh_out,
    voice_summary=voice_out,
    tier2_result={"risk_level": "High", "probability": 0.78, "shap_features": [{"feature": "CognitiveScore", "value": 0.35, "input": "32.0"}]},
    mri_result={"predicted_class": "Very Mild Cognitive Impairment", "cdr_rating": "CDR 0.5", "confidence": 0.88, "regional_findings": [{"region": "Hippocampus", "finding": "Mild bilateral volume loss"}]}
)
report_json = synth_res["report_json"]
for sec_idx in range(1, 13):
    sec_key = f"section_{sec_idx:02d}"
    matched = any(k.startswith(sec_key) for k in report_json.keys())
    assert matched, f"Missing {sec_key} in report_json!"

assert len(report_json["section_09_multimodal_integration"]["concordant_findings"]) > 0
assert len(report_json["section_09_multimodal_integration"]["discordant_findings"]) > 0
assert len(report_json["section_10_modifiable_actions"]) > 0
print("[PASS] 9. ClinicalSynthesisAgent (Fixed 12-Section MedGemma Evidence Dossier & Concordance Reasoning): OK")

# 10. SafetyAgent Guardrail Check
safety_agent_inst = SafetyAgent()
safety_out = safety_agent_inst.review("Patient has Alzheimer's disease.", risk_level="High")
assert safety_out["guardrail_passed"] is False
assert "alzheimer" not in safety_out["sanitized_narrative"].lower()
assert "Medical Disclaimer" in safety_out["sanitized_narrative"]
print("[PASS] 10. SafetyAgent (Sanitized forbidden claims & appended disclaimer): OK")

# 11. AuditAgent
audit_agent_inst = AuditAgent()
audit_event = audit_agent_inst.record_event(
    db=None, user_id=1, agent_name="RiskOrchestrationAgent", tool_name="predict_risk",
    input_data={}, output_data={"risk_level": "High"}, input_provenance="multivariate_tabular_ml",
    pipeline_state="full_pipeline_completed", next_action="classify_mri"
)
assert audit_event["input_provenance"] == "multivariate_tabular_ml"
print("[PASS] 11. AuditAgent (Audit event trail with provenance tracking): OK")

# 12. Full Orchestrator Endpoint (/api/orchestrate)
login_payload = {"email": "rajan@demo.com", "password": "demo1234"}
res_rajan = client.post("/login", json=login_payload)
assert res_rajan.status_code == 200
rajan_token = res_rajan.json()["access_token"]
rajan_headers = {"Authorization": f"Bearer {rajan_token}"}

orch_payload = {
    "voice_features": voice_features,
    "voice_transcript": voice_transcript,
    "mri_filename": "patient_mri_t1.dcm"
}
res_orch = client.post("/api/orchestrate", json=orch_payload, headers=rajan_headers)
assert res_orch.status_code == 200
orch_data = res_orch.json()
assert orch_data["tier1_fusion"]["numeric_contributions"]["cognitive"] > 0
print(f"[PASS] 12. Master RiskOrchestrationAgent (/api/orchestrate Pipeline State: {orch_data['pipeline_state']}, Numeric Contributions: {orch_data['tier1_fusion']['numeric_contributions']}): OK")

print("\n==================================================")
print("  ALL PER-MODALITY SCORING & AGENTS FULLY VERIFIED!")
print("==================================================")
