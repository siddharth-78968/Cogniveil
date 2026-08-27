"""SignalFusionEngine for CogniVeil.

Dynamically fuses Cognitive (Active), Behavioral (Passive), and Voice (Acoustic)
agent findings into a unified, calibrated Personalized CogniScore.
Ensures transparent weighting and maintains compatibility with historical dual-mode sessions.
"""

from typing import Dict, Any, Optional


class SignalFusionEngine:
    """Multimodal signal fusion engine coordinating active, passive, and acoustic inputs."""

    AGENT_NAME = "SignalFusionEngine"
    VERSION = "2026.1"

    def fuse(
        self,
        cognitive_out: Dict[str, Any],
        behavior_out: Dict[str, Any],
        voice_out: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Fuses disparate agent outputs into a unified CogniScore.

        Args:
            cognitive_out: Dictionary output from CognitiveTestAgent.
            behavior_out: Dictionary output from BehaviorAnalysisAgent.
            voice_out: Optional dictionary output from VoiceAnalysisAgent.

        Returns:
            Structured fusion dictionary containing composite CogniScore, risk band, and contribution weights.
        """
        cog_score = float(cognitive_out.get("cognitive_score", 50.0))
        cog_conf = float(cognitive_out.get("confidence", 0.80))

        beh_score = float(behavior_out.get("behavior_score", 50.0))
        beh_conf = float(behavior_out.get("confidence", 0.75))

        has_voice = bool(voice_out and "voice_score" in voice_out and voice_out.get("voice_score") is not None)
        voice_score = float(voice_out.get("voice_score", 50.0)) if has_voice else None
        voice_conf = float(voice_out.get("confidence", 0.70)) if has_voice else 0.0

        if has_voice and voice_score is not None:
            # Tri-modal Fusion: 60% Active Cognitive + 20% Passive Behavioral + 20% Acoustic Voice
            w_cog = 0.60
            w_beh = 0.20
            w_voi = 0.20

            raw_fused = (cog_score * w_cog) + (beh_score * w_beh) + (voice_score * w_voi)
            overall_conf = round(w_cog * cog_conf + w_beh * beh_conf + w_voi * voice_conf, 2)
            fusion_mode = "tri_modal (cognitive + behavioral + voice)"
            component_scores = {
                "cognitive": round(cog_score, 1),
                "behavioral": round(beh_score, 1),
                "voice": round(voice_score, 1)
            }
            fusion_weights = {
                "cognitive": w_cog,
                "behavioral": w_beh,
                "voice": w_voi
            }
        else:
            # Bi-modal Legacy Compatibility: 80% Active Cognitive + 20% Passive Behavioral
            w_cog = 0.80
            w_beh = 0.20

            raw_fused = (cog_score * w_cog) + (beh_score * w_beh)
            overall_conf = round(w_cog * cog_conf + w_beh * beh_conf, 2)
            fusion_mode = "bi_modal (cognitive + behavioral)"
            component_scores = {
                "cognitive": round(cog_score, 1),
                "behavioral": round(beh_score, 1),
                "voice": None
            }
            fusion_weights = {
                "cognitive": w_cog,
                "behavioral": w_beh,
                "voice": 0.0
            }

        cogni_score = round(max(0.0, min(100.0, raw_fused)), 1)

        # Categorize Clinical Risk Band
        if cogni_score >= 65.0:
            risk_level = "Low"
        elif cogni_score >= 40.0:
            risk_level = "Moderate"
        else:
            risk_level = "High"

        # Signal Discordance Detection (e.g. high test score but severe keystroke degradation)
        score_diff = abs(cog_score - beh_score)
        discordance_flag = bool(score_diff > 30.0)

        summary = (
            f"Personalized CogniScore: {cogni_score}/100 ({risk_level} Risk Category) "
            f"derived via {fusion_mode}. Active cognitive battery contributed {component_scores['cognitive']:.1f}, "
            f"passive behavioral telemetry contributed {component_scores['behavioral']:.1f}"
            + (f", and voice acoustic biomarkers contributed {component_scores['voice']:.1f}." if has_voice else ".")
        )

        return {
            "agent": self.AGENT_NAME,
            "version": self.VERSION,
            "cogni_score": cogni_score,
            "risk_level": risk_level,
            "fusion_mode": fusion_mode,
            "fusion_weights": fusion_weights,
            "component_scores": component_scores,
            "confidence": overall_conf,
            "discordance_flag": discordance_flag,
            "summary": summary
        }
