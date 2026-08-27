"""BehaviorAnalysisAgent for CogniVeil.

Consumes structured typing dynamics and scrolling telemetry to produce:
1. Explicit Typing Score (0-100) with detailed metric baseline % comparisons and reasoning.
2. Explicit Scrolling Score (0-100) with navigation metrics and reasoning.
3. Composite Behavioral Score (0-100) integrating typing + scrolling.
4. Non-diagnostic behavioral status, trend persistence, and explainable summaries.
"""

from typing import Dict, Any, Optional, List


class BehaviorAnalysisAgent:
    """Specialized agent analyzing keystroke dynamics, scrolling exploration, and interaction behavior."""

    AGENT_NAME = "BehaviorAnalysisAgent"
    VERSION = "2026.1"

    def analyze_typing(self, data: Dict[str, Any], baseline: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Calculates explicit Typing Score (0-100), metrics table with % delta comparisons, and reasoning."""
        typing_speed = float(data.get("typing_speed", data.get("wpm", 50.0)))
        inter_key_latency = float(data.get("inter_key_latency", data.get("latency_ms", 180.0)))
        latency_variance = float(data.get("latency_variance", 25.0))
        backspace_rate = float(data.get("backspace_rate", 0.05)) * 100.0 if float(data.get("backspace_rate", 0.05)) <= 1.0 else float(data.get("backspace_rate", 5.0))
        correction_rate = float(data.get("correction_rate", backspace_rate * 1.2))
        typing_pauses = float(data.get("typing_pauses", 2.0))
        burst_duration = float(data.get("burst_duration", 4.5))

        # Baseline references
        base_speed = float(baseline.get("typing_speed", 55.0)) if baseline else 55.0
        base_latency = float(baseline.get("inter_key_latency", 180.0)) if baseline else 180.0
        base_backspace = float(baseline.get("backspace_rate", 5.0)) if baseline else 5.0
        base_pauses = float(baseline.get("typing_pauses", 2.0)) if baseline else 2.0

        # Calculate % changes
        speed_delta_pct = round(((typing_speed - base_speed) / max(base_speed, 1.0)) * 100.0, 1)
        latency_delta_pct = round(((inter_key_latency - base_latency) / max(base_latency, 1.0)) * 100.0, 1)
        backspace_delta_pct = round(((backspace_rate - base_backspace) / max(base_backspace, 0.1)) * 100.0, 1)
        pauses_delta_pct = round(((typing_pauses - base_pauses) / max(base_pauses, 0.1)) * 100.0, 1)

        # Typing Score (0-100)
        speed_comp = max(0.0, min(100.0, (typing_speed / max(base_speed, 20.0)) * 70.0))
        accuracy_comp = max(0.0, min(100.0, (1.0 - min(backspace_rate / 100.0, 0.5)) * 30.0))
        typing_score = round(max(0.0, min(100.0, speed_comp + accuracy_comp)), 1)

        # Status & Trend
        if speed_delta_pct < -15.0 or backspace_delta_pct > 35.0:
            status = "declining"
            trend = "persistent_decline" if speed_delta_pct < -20.0 else "mild_decline"
        elif speed_delta_pct > 10.0:
            status = "improving"
            trend = "positive_adaptation"
        else:
            status = "stable"
            trend = "stable"

        confidence = round(min(0.95, 0.75 + (0.10 if typing_speed > 0 else 0.0)), 2)

        # Metrics Breakdown
        metrics_table = {
            "typing_speed": {
                "current": f"{typing_speed:.1f} WPM",
                "baseline": f"{base_speed:.1f} WPM",
                "change_percent": speed_delta_pct,
                "interpretation": f"↓ {abs(speed_delta_pct):.1f}%" if speed_delta_pct < 0 else f"↑ {speed_delta_pct:.1f}%"
            },
            "inter_key_latency": {
                "current": f"{inter_key_latency:.0f} ms",
                "baseline": f"{base_latency:.0f} ms",
                "change_percent": latency_delta_pct,
                "interpretation": f"↑ {latency_delta_pct:.1f}%" if latency_delta_pct > 0 else f"↓ {abs(latency_delta_pct):.1f}%"
            },
            "backspace_rate": {
                "current": f"{backspace_rate:.1f}%",
                "baseline": f"{base_backspace:.1f}%",
                "change_percent": backspace_delta_pct,
                "interpretation": f"↑ {backspace_delta_pct:.1f}%" if backspace_delta_pct > 0 else f"↓ {abs(backspace_delta_pct):.1f}%"
            },
            "typing_hesitation": {
                "current": f"{typing_pauses:.1f}/min",
                "baseline": f"{base_pauses:.1f}/min",
                "change_percent": pauses_delta_pct,
                "interpretation": f"↑ {pauses_delta_pct:.1f}%" if pauses_delta_pct > 0 else f"↓ {abs(pauses_delta_pct):.1f}%"
            }
        }

        # Non-diagnostic clinical reasoning
        if status == "declining":
            reasoning = (
                f"Typing performance is below the individual's established baseline. "
                f"Reduced typing speed ({typing_speed:.1f} vs {base_speed:.1f} WPM, {metrics_table['typing_speed']['interpretation']}), "
                f"increased inter-key latency, and elevated correction activity ({metrics_table['backspace_rate']['interpretation']}) "
                f"jointly contribute to the decline classification."
            )
        else:
            reasoning = (
                f"Typing cadence and keystroke dynamics remain consistent with personal baseline parameters "
                f"({typing_speed:.1f} WPM, stable latency variance)."
            )

        return {
            "score": typing_score,
            "status": status,
            "trend": trend,
            "confidence": confidence,
            "baseline_deviation_pct": speed_delta_pct,
            "metrics": metrics_table,
            "reasoning": reasoning
        }

    def analyze_scrolling(self, data: Dict[str, Any], baseline: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Calculates explicit Scrolling Score (0-100), navigation metrics table, and reasoning."""
        scroll_velocity = float(data.get("scroll_velocity", 120.0))
        scroll_hesitation = float(data.get("scroll_hesitation", 1.0))
        scroll_reversals = int(data.get("scroll_reversals", 1))
        idle_intervals = int(data.get("idle_intervals", 2))
        navigation_errors = int(data.get("navigation_errors", data.get("interaction_errors", 0)))

        # Baseline references
        base_velocity = float(baseline.get("scroll_velocity", 130.0)) if baseline else 130.0
        base_hesitation = float(baseline.get("scroll_hesitation", 1.0)) if baseline else 1.0
        base_reversals = int(baseline.get("scroll_reversals", 1)) if baseline else 1
        base_idle = int(baseline.get("idle_intervals", 2)) if baseline else 2

        # Calculate % changes
        vel_delta_pct = round(((scroll_velocity - base_velocity) / max(base_velocity, 1.0)) * 100.0, 1)
        hes_delta_pct = round(((scroll_hesitation - base_hesitation) / max(base_hesitation, 0.1)) * 100.0, 1)
        rev_delta_pct = round(((scroll_reversals - base_reversals) / max(base_reversals, 1)) * 100.0, 1)
        idle_delta_pct = round(((idle_intervals - base_idle) / max(base_idle, 1)) * 100.0, 1)

        # Scrolling Score (0-100)
        hes_penalty = min(scroll_hesitation * 9.0, 45.0)
        rev_penalty = min(scroll_reversals * 4.5, 30.0)
        scrolling_score = round(max(0.0, min(100.0, 100.0 - hes_penalty - rev_penalty)), 1)

        # Status & Trend
        if hes_delta_pct > 50.0 or rev_delta_pct >= 80.0:
            status = "elevated_hesitation"
            trend = "increasing_hesitation"
        elif scroll_velocity >= 80.0 and scroll_hesitation <= 1.5:
            status = "stable"
            trend = "stable"
        else:
            status = "stable"
            trend = "stable"

        confidence = round(min(0.95, 0.70 + (0.10 if scroll_velocity > 0 else 0.0)), 2)

        # Metrics Breakdown
        metrics_table = {
            "scroll_velocity": {
                "current": f"{scroll_velocity:.0f} px/s",
                "baseline": f"{base_velocity:.0f} px/s",
                "change_percent": vel_delta_pct,
                "interpretation": f"↓ {abs(vel_delta_pct):.1f}%" if vel_delta_pct < 0 else f"↑ {vel_delta_pct:.1f}%"
            },
            "scroll_hesitation": {
                "current": f"{scroll_hesitation:.1f}/min",
                "baseline": f"{base_hesitation:.1f}/min",
                "change_percent": hes_delta_pct,
                "interpretation": f"↑ {hes_delta_pct:.1f}%" if hes_delta_pct > 0 else f"↓ {abs(hes_delta_pct):.1f}%"
            },
            "scroll_reversals": {
                "current": f"{scroll_reversals}",
                "baseline": f"{base_reversals}",
                "change_percent": rev_delta_pct,
                "interpretation": f"↑ {rev_delta_pct:.1f}%" if rev_delta_pct > 0 else f"↓ {abs(rev_delta_pct):.1f}%"
            },
            "idle_intervals": {
                "current": f"{idle_intervals}",
                "baseline": f"{base_idle}",
                "change_percent": idle_delta_pct,
                "interpretation": f"↑ {idle_delta_pct:.1f}%" if idle_delta_pct > 0 else f"↓ {abs(idle_delta_pct):.1f}%"
            }
        }

        # Reasoning
        if status == "elevated_hesitation":
            reasoning = (
                f"Navigation behavior shows increased hesitation ({metrics_table['scroll_hesitation']['interpretation']}) "
                f"and reversal frequency ({metrics_table['scroll_reversals']['interpretation']}) compared with baseline. "
                f"The change contributes moderately to behavioral deviation without independently diagnosing clinical conditions."
            )
        else:
            reasoning = (
                f"Navigation and page scrolling trajectories were smooth and consistent with established visual exploration norms."
            )

        return {
            "score": scrolling_score,
            "status": status,
            "trend": trend,
            "confidence": confidence,
            "baseline_deviation_pct": hes_delta_pct,
            "metrics": metrics_table,
            "reasoning": reasoning
        }

    def analyze(self, data: Dict[str, Any], baseline: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Synthesizes Typing Score ($60\%$) and Scrolling Score ($40\%$) into unified Behavioral Score."""
        typing_res = self.analyze_typing(data, baseline=baseline)
        scrolling_res = self.analyze_scrolling(data, baseline=baseline)

        # Behavioral Score: 60% Typing + 40% Scrolling
        behavior_score = round(0.60 * typing_res["score"] + 0.40 * scrolling_res["score"], 1)

        # Composite Status
        if typing_res["status"] == "declining" and scrolling_res["status"] == "elevated_hesitation":
            behavior_status = "significant_decline"
            behavior_trend = "persistent_decline"
        elif typing_res["status"] == "declining" or scrolling_res["status"] == "elevated_hesitation":
            behavior_status = "mild_decline"
            behavior_trend = "increasing_hesitation"
        else:
            behavior_status = "stable"
            behavior_trend = "stable"

        confidence = round(0.60 * typing_res["confidence"] + 0.40 * scrolling_res["confidence"], 2)
        base_score = float(baseline.get("passive_score", 75.0)) if baseline else 75.0
        baseline_deviation = round(behavior_score - base_score, 1)

        behavioral_drift_score = 0.85 if behavior_status == "significant_decline" else 0.50 if behavior_status == "mild_decline" else 0.15

        unified_reasoning = (
            f"Behavioral Score: {behavior_score}/100 ({behavior_status.replace('_', ' ').title()}). "
            f"Typing sub-score ({typing_res['score']}/100, {typing_res['status']}) and scrolling sub-score "
            f"({scrolling_res['score']}/100, {scrolling_res['status']}) indicate "
            + ("elevated interactive latency and hesitation relative to baseline." if behavior_status != "stable" else "stable interactive motor performance.")
        )

        return {
            "agent": self.AGENT_NAME,
            "version": self.VERSION,
            "behavior_score": behavior_score,
            "behavior_status": behavior_status,
            "behavior_trend": behavior_trend,
            "confidence": confidence,
            "baseline_deviation": baseline_deviation,
            "behavioral_drift_score": behavioral_drift_score,
            "typing_status": typing_res["status"],
            "scrolling_status": scrolling_res["status"],
            "typing": typing_res,
            "scrolling": scrolling_res,
            "explanation": unified_reasoning,
            "metrics_summary": {
                "typing_speed_wpm": float(data.get("typing_speed", 50.0)),
                "inter_key_latency_ms": float(data.get("inter_key_latency", 180.0)),
                "latency_variance": float(data.get("latency_variance", 25.0)),
                "backspace_rate": float(data.get("backspace_rate", 0.05)),
                "correction_rate": float(data.get("correction_rate", 0.06)),
                "typing_pauses": int(data.get("typing_pauses", 2)),
                "burst_duration_sec": float(data.get("burst_duration", 4.5)),
                "scroll_velocity": float(data.get("scroll_velocity", 120.0)),
                "scroll_hesitation": float(data.get("scroll_hesitation", 1.0)),
                "scroll_reversals": int(data.get("scroll_reversals", 1)),
                "interaction_errors": int(data.get("interaction_errors", 0)),
                "task_completion_time_sec": float(data.get("task_completion_time", 60.0))
            }
        }
