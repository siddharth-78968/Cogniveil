"""LongitudinalTrendAgent for CogniVeil.

Analyzes long-term multi-session trajectories across 7 to 30+ days.
Evaluates EWMA, CUSUM accumulation, and cross-signal concordance to distinguish
persistent cognitive decline from transient fluctuations (e.g. acute sleep debt or stress).
"""

from typing import Dict, Any, List, Optional
import numpy as np


class LongitudinalTrendAgent:
    """Specialized agent tracking longitudinal multi-day trajectories and persistence."""

    AGENT_NAME = "LongitudinalTrendAgent"
    VERSION = "2026.1"

    def analyze(
        self,
        historical_scores: List[Any],
        current_score: float,
        voice_trend: str = "stable",
        typing_trend: str = "stable",
        memory_trend: str = "stable",
        subdomain_trends: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Evaluates longitudinal trajectory and trend persistence.

        Args:
            historical_scores: List of prior historical CogniScore records or numbers.
            current_score: Today's fused CogniScore.
            voice_trend: Speech biomarker trajectory status.
            typing_trend: Keystroke cadence trajectory status.
            memory_trend: Memory recall trajectory status.
            subdomain_trends: Optional detailed trend dictionary.

        Returns:
            Structured longitudinal trajectory evaluation dictionary.
        """
        past_values = [
            float(s.score if hasattr(s, "score") else (s.get("score") if isinstance(s, dict) else s))
            for s in historical_scores
        ] if historical_scores else []

        all_values = past_values + [float(current_score)]
        n_sessions = len(all_values)

        # Baseline Calibration Window (< 7 sessions)
        if len(past_values) < 6:  # Total sessions including today < 7
            baseline_mean = sum(all_values) / n_sessions
            return {
                "agent": self.AGENT_NAME,
                "version": self.VERSION,
                "baseline_status": "collecting",
                "sessions_collected": n_sessions,
                "target_sessions": 7,
                "baseline_mean": round(baseline_mean, 1),
                "ewma_score": round(current_score, 1),
                "cusum_value": 0.0,
                "trajectory_slope": 0.0,
                "trend_classification": "calibrating",
                "is_deviating": False,
                "persistent_pattern": False,
                "confidence": round(0.50 + (n_sessions / 7.0) * 0.25, 2),
                "explanation": f"Baseline calibration in progress ({n_sessions}/7 sessions recorded). Drift alarms are suppressed during baseline establishment.",
                "clinical_alert_level": "None"
            }

        # Established Baseline Calculations
        baseline_mean = sum(past_values) / len(past_values)
        
        # Calculate EWMA (alpha = 0.25)
        alpha = 0.25
        ewma = past_values[0]
        for v in past_values[1:] + [current_score]:
            ewma = alpha * v + (1.0 - alpha) * ewma
        ewma_score = round(ewma, 1)

        # Calculate CUSUM (k = 1.5 slack factor)
        k = 1.5
        cusum = 0.0
        cusum_history = []
        for v in all_values:
            diff = (baseline_mean - v) - k
            cusum = max(0.0, cusum + diff)
            cusum_history.append(cusum)
        cusum_value = round(cusum, 1)

        # Count consecutive days below baseline
        days_with_decline = 0
        for val in reversed(all_values):
            if val < baseline_mean - 3.0:
                days_with_decline += 1
            else:
                break

        # Calculate linear trajectory slope over available history (up to last 14 days)
        recent_window = all_values[-14:] if len(all_values) >= 14 else all_values
        x = np.arange(len(recent_window))
        slope, _ = np.polyfit(x, recent_window, 1) if len(recent_window) > 1 else (0.0, 0.0)
        trajectory_slope = round(float(slope), 2)

        # Volatility Index (Standard deviation of recent scores)
        volatility_index = round(float(np.std(recent_window)), 2)

        # Evaluate Signal Concordance
        concordant_declines = sum(1 for t in [voice_trend, typing_trend, memory_trend] if t == "declining")

        # Determine Persistent Decline vs Transient Fluctuation
        is_deviating = bool(
            (baseline_mean - current_score > 10.0) or
            (cusum_value > 12.0) or
            (days_with_decline >= 4 and trajectory_slope < -0.4)
        )

        if is_deviating and (days_with_decline >= 3 or concordant_declines >= 2 or cusum_value > 15.0):
            trend_classification = "persistent_decline"
            clinical_alert_level = "High" if (baseline_mean - current_score > 15.0 or concordant_declines >= 2) else "Moderate"
            persistent_pattern = True
            explanation = (
                f"Persistent downward drift confirmed over {days_with_decline} consecutive sessions (Trajectory slope: {trajectory_slope:.2f}, CUSUM: {cusum_value:.1f}). "
                f"{concordant_declines} modalities (voice: {voice_trend}, typing: {typing_trend}, memory: {memory_trend}) exhibit aligned decline."
            )
        elif is_deviating and days_with_decline <= 2:
            trend_classification = "transient_fluctuation"
            clinical_alert_level = "Moderate"
            persistent_pattern = False
            explanation = (
                f"Acute score drop detected (Current {current_score:.1f} vs Baseline {baseline_mean:.1f}), but longitudinal persistence is not yet established ({days_with_decline} session in drop). "
                f"Monitoring continues to rule out acute fatigue or situational stress."
            )
        elif trajectory_slope > 0.3:
            trend_classification = "improving"
            clinical_alert_level = "None"
            persistent_pattern = False
            explanation = f"Cognitive trajectory is stable or improving (+{trajectory_slope:.2f} slope over recent sessions)."
        else:
            trend_classification = "stable"
            clinical_alert_level = "None"
            persistent_pattern = False
            explanation = f"Cognitive trajectory is stable relative to established personal baseline ({baseline_mean:.1f} mean, EWMA: {ewma_score:.1f})."

        confidence = round(min(0.96, 0.70 + 0.02 * min(n_sessions, 14)), 2)

        return {
            "agent": self.AGENT_NAME,
            "version": self.VERSION,
            "baseline_status": "established",
            "sessions_collected": n_sessions,
            "baseline_mean": round(baseline_mean, 1),
            "current_score": round(current_score, 1),
            "ewma_score": ewma_score,
            "cusum_value": cusum_value,
            "days_with_decline": days_with_decline,
            "trajectory_slope": trajectory_slope,
            "volatility_index": volatility_index,
            "trend_classification": trend_classification,
            "is_deviating": is_deviating,
            "persistent_pattern": persistent_pattern,
            "clinical_alert_level": clinical_alert_level,
            "confidence": confidence,
            "explanation": explanation
        }
