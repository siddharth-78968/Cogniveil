"""SignalFusionEngine for CogniVeil.

Fuses Cognitive (Active), Behavioral (Passive), and Voice (Acoustic) agent findings
into a calibrated Personalized CogniScore.
Explicitly computes numeric contributions, identifies top primary delta contributors,
and generates tailored Low-Risk vs Elevated-Risk clinical reasoning.
"""

from typing import Dict, Any, Optional, List


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
        """Fuses disparate agent outputs into a unified CogniScore with contribution math.

        Returns:
            Structured fusion dictionary with component scores, numeric contributions,
            primary contributors list, and risk-stratified reasoning.
        """
        cog_score = float(cognitive_out.get("score", cognitive_out.get("cognitive_score", 50.0)))
        cog_conf = float(cognitive_out.get("confidence", 0.85))

        beh_score = float(behavior_out.get("score", behavior_out.get("behavior_score", 50.0)))
        beh_conf = float(behavior_out.get("confidence", 0.80))
        typing_score = float(behavior_out.get("typing", {}).get("score", beh_score))
        scrolling_score = float(behavior_out.get("scrolling", {}).get("score", beh_score))

        has_voice = bool(voice_out and ("score" in voice_out or "voice_score" in voice_out) and voice_out.get("voice_score") is not None)
        voice_score = float(voice_out.get("score", voice_out.get("voice_score", 50.0))) if has_voice else None
        voice_conf = float(voice_out.get("confidence", 0.80)) if has_voice else 0.0

        if has_voice and voice_score is not None:
            # Tri-modal Fusion: 60% Active Cognitive + 20% Passive Behavioral + 20% Acoustic Voice
            w_cog = 0.60
            w_beh = 0.20
            w_voi = 0.20

            cog_contrib = round(cog_score * w_cog, 1)
            beh_contrib = round(beh_score * w_beh, 1)
            voi_contrib = round(voice_score * w_voi, 1)

            raw_fused = cog_contrib + beh_contrib + voi_contrib
            overall_conf = round(w_cog * cog_conf + w_beh * beh_conf + w_voi * voice_conf, 2)
            fusion_mode = "tri_modal (60% Cognitive + 20% Behavioral + 20% Voice)"

            component_scores = {
                "cognitive": round(cog_score, 1),
                "behavioral": round(beh_score, 1),
                "typing": round(typing_score, 1),
                "scrolling": round(scrolling_score, 1),
                "voice": round(voice_score, 1)
            }
            numeric_contributions = {
                "cognitive": cog_contrib,
                "behavioral": beh_contrib,
                "voice": voi_contrib
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

            cog_contrib = round(cog_score * w_cog, 1)
            beh_contrib = round(beh_score * w_beh, 1)

            raw_fused = cog_contrib + beh_contrib
            overall_conf = round(w_cog * cog_conf + w_beh * beh_conf, 2)
            fusion_mode = "bi_modal (80% Cognitive + 20% Behavioral)"

            component_scores = {
                "cognitive": round(cog_score, 1),
                "behavioral": round(beh_score, 1),
                "typing": round(typing_score, 1),
                "scrolling": round(scrolling_score, 1),
                "voice": None
            }
            numeric_contributions = {
                "cognitive": cog_contrib,
                "behavioral": beh_contrib,
                "voice": 0.0
            }
            fusion_weights = {
                "cognitive": w_cog,
                "behavioral": w_beh,
                "voice": 0.0
            }

        cogni_score = round(max(0.0, min(100.0, raw_fused)), 1)

        # Categorize Risk Band
        if cogni_score >= 65.0:
            risk_level = "Low"
            risk_label = "STABLE / LOW RISK"
        elif cogni_score >= 40.0:
            risk_level = "Moderate"
            risk_label = "MODERATE DEVIATION"
        else:
            risk_level = "High"
            risk_label = "ELEVATED CONCERN"

        # Extract Primary Contributors (Negative Shifts Relative to Baseline)
        primary_contributors: List[Dict[str, Any]] = []

        # 1. Check Cognitive Subdomains (Memory, Executive Function)
        cog_metrics = cognitive_out.get("metrics", {})
        if "memory" in cog_metrics:
            mem_chg = cog_metrics["memory"].get("change_percent", 0.0)
            if mem_chg < -5.0:
                primary_contributors.append({
                    "factor": "Memory performance",
                    "change": f"↓ {abs(mem_chg):.1f}% from baseline",
                    "modality": "Cognitive",
                    "delta": mem_chg
                })
        if "executive_function" in cog_metrics:
            exec_chg = cog_metrics["executive_function"].get("change_percent", 0.0)
            if exec_chg < -5.0:
                primary_contributors.append({
                    "factor": "Executive function (Trail Making)",
                    "change": f"↓ {abs(exec_chg):.1f}% from baseline",
                    "modality": "Cognitive",
                    "delta": exec_chg
                })

        # 2. Check Typing Cadence
        typ_metrics = behavior_out.get("typing", {}).get("metrics", {})
        if "typing_speed" in typ_metrics:
            typ_chg = typ_metrics["typing_speed"].get("change_percent", 0.0)
            if typ_chg < -5.0:
                primary_contributors.append({
                    "factor": "Typing cadence",
                    "change": f"↓ {abs(typ_chg):.1f}% from baseline",
                    "modality": "Behavioral",
                    "delta": typ_chg
                })

        # 3. Check Scroll Hesitation
        scr_metrics = behavior_out.get("scrolling", {}).get("metrics", {})
        if "scroll_hesitation" in scr_metrics:
            scr_chg = scr_metrics["scroll_hesitation"].get("change_percent", 0.0)
            if scr_chg > 15.0:
                primary_contributors.append({
                    "factor": "Scroll hesitation",
                    "change": f"↑ {scr_chg:.1f}% from baseline",
                    "modality": "Behavioral",
                    "delta": -scr_chg
                })

        # 4. Check Speech Pause
        if voice_out and "metrics" in voice_out:
            voi_metrics = voice_out.get("metrics", {})
            if "pause_pattern" in voi_metrics:
                pau_chg = voi_metrics["pause_pattern"].get("change_percent", 0.0)
                if pau_chg > 15.0:
                    primary_contributors.append({
                        "factor": "Speech pause frequency",
                        "change": f"↑ {pau_chg:.1f}% from baseline",
                        "modality": "Voice",
                        "delta": -pau_chg
                    })

        # Sort contributors by magnitude of negative impact
        primary_contributors.sort(key=lambda x: x["delta"])

        # Fallback contributors if none were severely negative
        if not primary_contributors:
            primary_contributors = [
                {"factor": "Cognitive active battery", "change": "Within normal variance (±3%)", "modality": "Cognitive", "delta": 0.0},
                {"factor": "Digital interaction telemetry", "change": "Stable typing & navigation", "modality": "Behavioral", "delta": 0.0}
            ]

        # Generate Contextual Reasoning
        if risk_level == "Low":
            reasoning = (
                f"Overall screening pattern is currently stable (CogniScore: {cogni_score}/100, Low Risk). "
                f"Cognitive performance remains near baseline ({component_scores['cognitive']}/100), "
                f"behavioral telemetry shows no persistent decline ({component_scores['behavioral']}/100), "
                + (f"and voice biomarkers remain within the expected range ({component_scores['voice']}/100). " if has_voice else "")
                + "No Tier-2 escalation trigger was detected. Continue routine longitudinal monitoring."
            )
        elif risk_level == "Moderate":
            reasoning = (
                f"Moderate screening deviation observed (CogniScore: {cogni_score}/100). "
                f"Active cognitive performance ({component_scores['cognitive']}/100) or behavioral interaction cadence "
                f"({component_scores['behavioral']}/100) exhibits mild divergence from established personal baseline. "
                f"Monitoring continues to track longitudinal persistence."
            )
        else:
            reasoning = (
                f"The elevated screening signal (CogniScore: {cogni_score}/100, High Concern) is primarily associated with "
                f"persistent cognitive and behavioral deviation from the individual's baseline. "
                f"Primary drivers include {', '.join([c['factor'].lower() + ' (' + c['change'] + ')' for c in primary_contributors[:3]])}. "
                f"These findings trigger Tier-2 clinical assessment."
            )

        return {
            "agent": self.AGENT_NAME,
            "version": self.VERSION,
            "cogni_score": cogni_score,
            "score": cogni_score,
            "risk_level": risk_level,
            "risk_label": risk_label,
            "fusion_mode": fusion_mode,
            "fusion_weights": fusion_weights,
            "component_scores": component_scores,
            "numeric_contributions": numeric_contributions,
            "primary_contributors": primary_contributors,
            "confidence": overall_conf,
            "discordance_flag": abs(cog_score - beh_score) > 30.0,
            "reasoning": reasoning,
            "summary": reasoning
        }
