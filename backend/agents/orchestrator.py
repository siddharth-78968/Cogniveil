"""RiskOrchestrationAgent for CogniVeil.

High-level multi-tier lifecycle orchestrator and MCP tool dispatcher.
Controls the state-aware transition across:
  Onboarding -> Baseline Calibration -> Tier 1 Screening -> Longitudinal Drift Check ->
  Tier 2 CatBoost ML -> Tier 3 Neuroimaging -> Clinical Synthesis -> Safety Guardrail -> Audit Log
"""

from typing import Dict, Any, List, Optional
import json
from sqlalchemy.orm import Session

from .behavior import BehaviorAnalysisAgent
from .voice import VoiceAnalysisAgent
from .cognitive import CognitiveTestAgent
from .fusion import SignalFusionEngine
from .longitudinal import LongitudinalTrendAgent
from .clinical import ClinicalSynthesisAgent
from .safety import SafetyAgent
from .audit import AuditAgent


class RiskOrchestrationAgent:
    """Master orchestrator agent coordinating screening stages, tool dispatches, and state gating."""

    AGENT_NAME = "RiskOrchestrationAgent"
    VERSION = "2026.1"

    def __init__(self):
        self.behavior_agent = BehaviorAnalysisAgent()
        self.voice_agent = VoiceAnalysisAgent()
        self.cognitive_agent = CognitiveTestAgent()
        self.fusion_engine = SignalFusionEngine()
        self.longitudinal_agent = LongitudinalTrendAgent()
        self.clinical_agent = ClinicalSynthesisAgent()
        self.safety_agent = SafetyAgent()
        self.audit_agent = AuditAgent()

    def run_pipeline(
        self,
        db: Optional[Session],
        user: Any,
        tests: List[Any],
        signals: List[Any],
        history: List[Any],
        voice_features: Optional[Dict[str, Any]] = None,
        voice_transcript: str = "",
        mri_bytes: Optional[bytes] = None,
        mri_filename: str = "mri_scan.dcm",
        mri_classifier_fn=None,
        catboost_predictor_fn=None,
        guidelines_fn=None
    ) -> Dict[str, Any]:
        """Executes the complete state-aware multi-agent screening and decision pipeline.

        Returns:
            Structured orchestration execution payload.
        """
        user_id = getattr(user, "id", None)
        user_name = getattr(user, "name", "Patient")
        user_age = getattr(user, "age", 68)
        session_id = f"S_{user_id or 'anon'}_{getattr(user, 'email', 'user').split('@')[0]}"

        # Phase 1: Cognitive Battery Psychometrics Analysis
        cog_res = self.cognitive_agent.analyze(tests)
        self.audit_agent.record_event(
            db, user_id, self.cognitive_agent.AGENT_NAME, "analyze_cognitive_tests",
            {"test_count": len(tests)}, cog_res, session_id=session_id
        )

        # Phase 2: Behavioral Interaction Telemetry Analysis
        latest_signal = signals[-1] if signals else {}
        signal_dict = (
            {
                "typing_speed": getattr(latest_signal, "typing_speed", 50.0),
                "backspace_rate": getattr(latest_signal, "backspace_rate", 0.05),
                "scroll_hesitation": getattr(latest_signal, "scroll_hesitation", 1.0),
                "session_duration": getattr(latest_signal, "session_duration", 60.0)
            }
            if hasattr(latest_signal, "typing_speed") else (latest_signal if isinstance(latest_signal, dict) else {})
        )
        beh_res = self.behavior_agent.analyze(signal_dict)
        self.audit_agent.record_event(
            db, user_id, self.behavior_agent.AGENT_NAME, "analyze_behavior",
            {"signal_samples": len(signals)}, beh_res, session_id=session_id
        )

        # Phase 3: Voice Biomarker Analysis (if voice sample / features provided)
        voice_res = None
        if voice_features:
            voice_res = self.voice_agent.analyze(voice_features, voice_transcript)
            self.audit_agent.record_event(
                db, user_id, self.voice_agent.AGENT_NAME, "analyze_voice",
                {"features_present": True, "transcript_length": len(voice_transcript)}, voice_res, session_id=session_id
            )

        # Phase 4: Multimodal Signal Fusion
        fusion_res = self.fusion_engine.fuse(cog_res, beh_res, voice_res)
        fused_score = fusion_res["cogni_score"]
        self.audit_agent.record_event(
            db, user_id, self.fusion_engine.AGENT_NAME, "fuse_signals",
            {"cog": cog_res["cognitive_score"], "beh": beh_res["behavior_score"], "has_voice": voice_res is not None},
            fusion_res, session_id=session_id
        )

        # Phase 5: Longitudinal Trajectory & Drift Assessment
        long_res = self.longitudinal_agent.analyze(
            historical_scores=history,
            current_score=fused_score,
            voice_trend=voice_res.get("trend", "stable") if voice_res else "stable",
            typing_trend=beh_res.get("typing_status", "stable"),
            memory_trend=cog_res.get("memory", "stable")
        )
        self.audit_agent.record_event(
            db, user_id, self.longitudinal_agent.AGENT_NAME, "analyze_longitudinal_trend",
            {"prior_sessions": len(history), "current_score": fused_score},
            long_res, session_id=session_id
        )

        is_deviating = long_res.get("is_deviating", False)
        baseline_status = long_res.get("baseline_status", "collecting")

        # Lifecycle State Gating: Baseline Collection Mode (< 7 sessions)
        if baseline_status == "collecting":
            pipeline_state = "baseline_period"
            self.audit_agent.record_event(
                db, user_id, self.AGENT_NAME, "orchestrator_early_stop",
                {"reason": "Baseline calibration week (< 7 days)", "sessions": long_res.get("sessions_collected")},
                {"pipeline_state": pipeline_state, "message": "Baseline calibration in progress. Drift alarms muted."},
                pipeline_state=pipeline_state, next_action="continue_daily_tracking", session_id=session_id
            )
            return {
                "pipeline_state": pipeline_state,
                "tier1_fusion": fusion_res,
                "cognitive_analysis": cog_res,
                "behavioral_analysis": beh_res,
                "voice_analysis": voice_res,
                "longitudinal_trend": long_res,
                "tier2_ml": None,
                "tier3_mri": None,
                "clinical_report": None,
                "message": f"Baseline calibration in progress ({long_res.get('sessions_collected')}/7 sessions recorded). Keep logging daily!"
            }

        # Lifecycle State Gating: Trigger Level 2 Questionnaire on Drift
        level2_status = getattr(user, "level2_status", "not_collected")
        if is_deviating and level2_status == "not_collected":
            if hasattr(user, "level2_status"):
                user.level2_status = "triggered"
                if db is not None:
                    db.commit()
            level2_status = "triggered"

        # If Level 2 health questionnaire is not completed yet:
        if level2_status != "completed":
            pipeline_state = "awaiting_level2"
            self.audit_agent.record_event(
                db, user_id, self.AGENT_NAME, "orchestrator_early_stop",
                {"reason": "Level 2 health questionnaire pending", "level2_status": level2_status, "is_deviating": is_deviating},
                {"pipeline_state": pipeline_state, "message": "Awaiting Level 2 health questionnaire completion."},
                pipeline_state=pipeline_state, next_action="submit_level2_questionnaire" if is_deviating else "continue_daily_tracking",
                session_id=session_id
            )
            return {
                "pipeline_state": pipeline_state,
                "tier1_fusion": fusion_res,
                "cognitive_analysis": cog_res,
                "behavioral_analysis": beh_res,
                "voice_analysis": voice_res,
                "longitudinal_trend": long_res,
                "tier2_ml": None,
                "tier3_mri": None,
                "clinical_report": None,
                "message": "Level 2 clinical questionnaire not completed. Monitoring continues without active diagnosis."
            }

        # Phase 6: Tier 2 CatBoost ML Execution
        tier2_res = None
        if catboost_predictor_fn is not None and getattr(user, "level2_data", None):
            level2_dict = json.loads(user.level2_data) if isinstance(user.level2_data, str) else user.level2_data
            tier2_res = catboost_predictor_fn(level2_dict)
            self.audit_agent.record_event(
                db, user_id, self.AGENT_NAME, "predict_risk",
                {"features_count": len(level2_dict)}, tier2_res, session_id=session_id
            )

        # Phase 7: Tier 3 Conditional Neuroimaging (ResNet-18 + GradCAM)
        mri_res = None
        assessed_risk = tier2_res.get("risk_level", "Moderate") if tier2_res else fusion_res["risk_level"]
        if (mri_bytes is not None or assessed_risk in ["Moderate", "High"]) and mri_classifier_fn is not None:
            mri_res = mri_classifier_fn(image_bytes=mri_bytes, filename=mri_filename)
            self.audit_agent.record_event(
                db, user_id, self.AGENT_NAME, "classify_mri",
                {"scan_provided": mri_bytes is not None, "filename": mri_filename}, mri_res, session_id=session_id
            )

        # Phase 8: RAG Clinical Practice Guidelines Retrieval
        guidelines = guidelines_fn("Cognitive decline referral criteria", assessed_risk) if guidelines_fn else []

        # Phase 9: Clinical Synthesis
        synthesis_res = self.clinical_agent.synthesize(
            patient_name=user_name,
            age=user_age,
            tier1_summary=fusion_res,
            longitudinal_summary=long_res,
            cognitive_summary=cog_res,
            behavior_summary=beh_res,
            voice_summary=voice_res,
            tier2_result=tier2_res,
            mri_result=mri_res,
            guidelines=guidelines
        )

        # Phase 10: Safety Agent Review & Guardrail Enforcement
        provenance_meta = {
            "apoe_e4_provenance": getattr(user, "apoe_e4_provenance", "self_reported"),
            "mri_provenance": getattr(user, "mri_provenance", "self_reported")
        }
        safety_res = self.safety_agent.review(
            narrative=synthesis_res["raw_narrative"],
            risk_level=assessed_risk,
            provenance_meta=provenance_meta
        )
        self.audit_agent.record_event(
            db, user_id, self.safety_agent.AGENT_NAME, "check_output_safety",
            {"violations_count": len(safety_res["violations_found"])},
            {"guardrail_passed": safety_res["guardrail_passed"], "remediation_applied": safety_res["remediation_applied"]},
            guardrail_passed=safety_res["guardrail_passed"], session_id=session_id
        )

        pipeline_state = "full_pipeline_completed"
        self.audit_agent.record_event(
            db, user_id, self.AGENT_NAME, "full_pipeline_run",
            {"fused_score": fused_score, "assessed_risk": assessed_risk, "is_deviating": is_deviating},
            {"pipeline_state": pipeline_state, "guardrail_passed": safety_res["guardrail_passed"]},
            pipeline_state=pipeline_state, next_action="clinical_review", session_id=session_id
        )

        return {
            "pipeline_state": pipeline_state,
            "session_id": session_id,
            "tier1_fusion": fusion_res,
            "cognitive_analysis": cog_res,
            "behavioral_analysis": beh_res,
            "voice_analysis": voice_res,
            "longitudinal_trend": long_res,
            "tier2_ml": tier2_res,
            "tier3_mri": mri_res,
            "clinical_synthesis": synthesis_res,
            "safety_review": safety_res,
            "sanitized_narrative": safety_res["sanitized_narrative"],
            "guidelines": guidelines
        }
