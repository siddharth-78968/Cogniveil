"""BehaviorAnalysisAgent for CogniVeil.

Consumes structured typing dynamics and scrolling telemetry to reason over
fine-grained behavioral trends relative to personal and population baselines.
Enforces non-diagnostic clinical language boundaries.
"""

from typing import Dict, Any, Optional, List


class BehaviorAnalysisAgent:
    """Specialized agent analyzing keystroke dynamics and scroll interaction telemetry."""

    AGENT_NAME = "BehaviorAnalysisAgent"
    VERSION = "2026.1"

    def analyze(self, data: Dict[str, Any], baseline: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze structured behavioral signals and reason over stability/drift.

        Args:
            data: Current session behavioral metrics (typing + scrolling).
            baseline: Historical personal baseline reference values.

        Returns:
            Structured reasoning dictionary containing status, deviation, and plain-language explanation.
        """
        # Keystroke Metrics Extraction with defaults
        typing_speed = float(data.get("typing_speed", data.get("wpm", 50.0)))
        inter_key_latency = float(data.get("inter_key_latency", data.get("latency_ms", 180.0)))
        latency_variance = float(data.get("latency_variance", 25.0))
        backspace_rate = float(data.get("backspace_rate", 0.05))
        correction_rate = float(data.get("correction_rate", backspace_rate * 1.2))
        typing_pauses = int(data.get("typing_pauses", 2))
        burst_duration = float(data.get("burst_duration", 4.5))

        # Scrolling & Navigation Metrics Extraction
        scroll_velocity = float(data.get("scroll_velocity", 120.0))
        scroll_hesitation = float(data.get("scroll_hesitation", 1.0))
        scroll_reversals = int(data.get("scroll_reversals", 1))
        idle_time = float(data.get("idle_time", 5.0))
        interaction_errors = int(data.get("interaction_errors", 0))
        task_completion_time = float(data.get("task_completion_time", data.get("session_duration", 60.0)))

        # Baseline References
        base_typing = float(baseline.get("typing_speed", 55.0)) if baseline else 55.0
        base_backspace = float(baseline.get("backspace_rate", 0.05)) if baseline else 0.05
        base_hesitation = float(baseline.get("scroll_hesitation", 1.0)) if baseline else 1.0
        base_score = float(baseline.get("passive_score", 75.0)) if baseline else 75.0

        # Calculate Subdomain Performance Scores (0-100 scale)
        # 1. Typing Sub-Score: higher speed, lower backspace, lower pause burden = higher score
        typing_efficiency = max(0.0, min(100.0, (typing_speed / max(base_typing, 20.0)) * 70.0 + (1.0 - min(backspace_rate, 0.5)) * 30.0))
        
        # 2. Scrolling Sub-Score: smooth velocity, low hesitation, low erratic reversals = higher score
        hesitation_penalty = min(scroll_hesitation * 8.0, 40.0)
        reversals_penalty = min(scroll_reversals * 4.0, 30.0)
        scrolling_efficiency = max(0.0, min(100.0, 100.0 - hesitation_penalty - reversals_penalty))

        # Composite Behavioral Score
        behavior_score = round(0.65 * typing_efficiency + 0.35 * scrolling_efficiency, 1)

        # Baseline Deviation
        baseline_deviation = round(behavior_score - base_score, 1)

        # Typing Status Classification
        typing_delta_pct = (typing_speed - base_typing) / max(base_typing, 1.0)
        backspace_increase = backspace_rate - base_backspace

        if typing_delta_pct < -0.18 or backspace_increase > 0.08 or latency_variance > 45.0:
            typing_status = "declining"
        elif typing_delta_pct > 0.10:
            typing_status = "improving"
        else:
            typing_status = "stable"

        # Scrolling Status Classification
        hesitation_increase = scroll_hesitation - base_hesitation
        if hesitation_increase > 1.2 or scroll_reversals >= 5:
            scrolling_status = "elevated_hesitation" if hesitation_increase > 1.2 else "irregular"
        elif scroll_velocity >= 80.0 and scroll_hesitation <= 1.2:
            scrolling_status = "stable"
        else:
            scrolling_status = "stable"

        # Normalized Behavioral Drift Score (0.0 = perfectly normal, 1.0 = severe drift)
        drift_raw = 0.0
        if typing_status == "declining":
            drift_raw += 0.45
        if scrolling_status in ["elevated_hesitation", "irregular"]:
            drift_raw += 0.30
        if interaction_errors > 2:
            drift_raw += 0.15
        if typing_pauses > 5:
            drift_raw += 0.10
        behavioral_drift_score = round(min(1.0, drift_raw), 2)

        # Pattern persistence
        persistent_pattern = bool(behavioral_drift_score >= 0.50 or baseline_deviation <= -12.0)

        # Confidence Calculation
        sample_richness = min(1.0, max(0.4, (task_completion_time / 60.0) * 0.5 + (1.0 if typing_speed > 0 else 0.0) * 0.3 + 0.2))
        confidence = round(min(0.95, 0.70 + 0.25 * sample_richness), 2)

        # Evidence Explanation (Strictly Non-Diagnostic)
        explanation_parts = []
        if typing_status == "declining":
            explanation_parts.append(
                f"Typing cadence decreased ({typing_speed:.1f} WPM vs baseline {base_typing:.1f} WPM) with elevated backspace correction rate ({backspace_rate * 100:.1f}%)."
            )
        elif typing_status == "stable":
            explanation_parts.append(f"Typing motor cadence remained consistent with personal baseline ({typing_speed:.1f} WPM).")
        else:
            explanation_parts.append("Typing speed and keystroke fluency showed positive adaptation.")

        if scrolling_status in ["elevated_hesitation", "irregular"]:
            explanation_parts.append(f"Elevated navigational pause duration (hesitation index {scroll_hesitation:.1f}) and {scroll_reversals} trackpad reversals observed.")
        else:
            explanation_parts.append("Page scrolling velocity and visual exploration trajectory were smooth.")

        if interaction_errors > 0:
            explanation_parts.append(f"{interaction_errors} interface mis-clicks or input correction events were recorded.")

        explanation = " ".join(explanation_parts)

        return {
            "agent": self.AGENT_NAME,
            "version": self.VERSION,
            "behavior_score": behavior_score,
            "typing_status": typing_status,
            "scrolling_status": scrolling_status,
            "behavioral_drift_score": behavioral_drift_score,
            "baseline_deviation": baseline_deviation,
            "persistent_pattern": persistent_pattern,
            "confidence": confidence,
            "explanation": explanation,
            "metrics_summary": {
                "typing_speed_wpm": typing_speed,
                "inter_key_latency_ms": inter_key_latency,
                "latency_variance": latency_variance,
                "backspace_rate": backspace_rate,
                "correction_rate": correction_rate,
                "typing_pauses": typing_pauses,
                "burst_duration_sec": burst_duration,
                "scroll_velocity": scroll_velocity,
                "scroll_hesitation": scroll_hesitation,
                "scroll_reversals": scroll_reversals,
                "interaction_errors": interaction_errors,
                "task_completion_time_sec": task_completion_time
            }
        }
