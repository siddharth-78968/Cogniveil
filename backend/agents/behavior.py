"""BehaviorAnalysisAgent for CogniVeil.

Consumes structured typing dynamics and interaction telemetry to compute literature-validated
features for passive cognitive-change monitoring (Stringer et al. 2018; Jahan et al. 2024).

Literature-Validated Behavioral Features:
1. text_keystrokes_per_min: Keystrokes during content-generation fields ONLY (free text entry),
   excluding navigation/shortcut/backspace-for-correction keys. Tracked as a separate stream.
   (Source: Stringer et al. 2018, Int J Geriatr Psychiatry; Jahan et al. 2024, Discover Sustainability)
2. operational_keystrokes_per_min: Navigation/shortcut keys, tracked separately from text keys;
   low weight in scoring (validated as non-discriminating alone).
   (Source: Stringer et al. 2018, Int J Geriatr Psychiatry)
3. pauses_per_min: Count of gaps >10 seconds of inactivity, normalized by session duration.
   (Source: Stringer et al. 2018, Int J Geriatr Psychiatry)
4. mean_pause_length: Mean duration of inactivity pauses; logged in summary with low weight.
   (Source: Stringer et al. 2018, Int J Geriatr Psychiatry)
5. total_mouse_clicks: Raw count over the session (proxy for error-correction / mis-clicks).
   (Source: Stringer et al. 2018, Int J Geriatr Psychiatry)

Explicitly Non-Discriminating Features (Tracked/Logged ONLY, 0% Weight in CogniScore):
- clicks_per_min (Source: Stringer et al. 2018, Int J Geriatr Psychiatry)
- inter_click_interval (Source: Stringer et al. 2018, Int J Geriatr Psychiatry)
- total_pixel_distance (Source: Stringer et al. 2018, Int J Geriatr Psychiatry)
- pixels_per_sec (Source: Stringer et al. 2018, Int J Geriatr Psychiatry)
"""

from typing import Dict, Any, Optional, List


class BehaviorAnalysisAgent:
    """Specialized agent analyzing keystroke dynamics, interaction pauses, and interaction behavior."""

    AGENT_NAME = "BehaviorAnalysisAgent"
    VERSION = "2026.1"

    def analyze_typing(self, data: Dict[str, Any], baseline: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Calculates explicit Typing Score (0-100) using separate content vs operational streams."""
        session_dur_min = max(0.1, float(data.get("session_duration", data.get("session_duration_sec", 60.0))) / 60.0)

        # Feature 1: text_keystrokes_per_min (Content-generation keys ONLY, free text entry)
        # Source: Stringer et al. 2018, Int J Geriatr Psychiatry; Jahan et al. 2024, Discover Sustainability
        if "text_keystrokes_per_min" in data:
            text_keystrokes_per_min = float(data["text_keystrokes_per_min"])
        elif "content_keystrokes" in data:
            text_keystrokes_per_min = float(data["content_keystrokes"]) / session_dur_min
        elif "typing_speed" in data:
            # Approximate 5 characters per word for content entry
            text_keystrokes_per_min = float(data["typing_speed"]) * 5.0
        else:
            text_keystrokes_per_min = 250.0  # ~50 WPM default

        # Feature 2: operational_keystrokes_per_min (Navigation/shortcuts separate stream, low weight)
        # Source: Stringer et al. 2018, Int J Geriatr Psychiatry
        if "operational_keystrokes_per_min" in data:
            operational_keystrokes_per_min = float(data["operational_keystrokes_per_min"])
        elif "operational_keystrokes" in data:
            operational_keystrokes_per_min = float(data["operational_keystrokes"]) / session_dur_min
        elif "nav_keystrokes" in data:
            operational_keystrokes_per_min = float(data["nav_keystrokes"]) / session_dur_min
        else:
            operational_keystrokes_per_min = 12.0

        inter_key_latency = float(data.get("inter_key_latency", data.get("latency_ms", 180.0)))
        latency_variance = float(data.get("latency_variance", 25.0))
        raw_backspace = float(data.get("backspace_rate", 0.05))
        backspace_rate = raw_backspace * 100.0 if raw_backspace <= 1.0 else raw_backspace
        correction_rate = float(data.get("correction_rate", backspace_rate * 1.2))

        # Baseline references
        base_text_keys = float(baseline.get("text_keystrokes_per_min", 275.0)) if baseline else 275.0
        base_op_keys = float(baseline.get("operational_keystrokes_per_min", 12.0)) if baseline else 12.0
        base_latency = float(baseline.get("inter_key_latency", 180.0)) if baseline else 180.0
        base_backspace = float(baseline.get("backspace_rate", 5.0)) if baseline else 5.0

        # Calculate % changes
        text_speed_delta_pct = round(((text_keystrokes_per_min - base_text_keys) / max(base_text_keys, 1.0)) * 100.0, 1)
        op_speed_delta_pct = round(((operational_keystrokes_per_min - base_op_keys) / max(base_op_keys, 1.0)) * 100.0, 1)
        latency_delta_pct = round(((inter_key_latency - base_latency) / max(base_latency, 1.0)) * 100.0, 1)
        backspace_delta_pct = round(((backspace_rate - base_backspace) / max(base_backspace, 0.1)) * 100.0, 1)

        # Typing Score (0-100):
        # 65% content text keystroke cadence (primary discriminator)
        # 25% accuracy / error-correction (backspace)
        # 10% operational keystrokes (validated as low discriminating alone)
        content_comp = max(0.0, min(100.0, (text_keystrokes_per_min / max(base_text_keys, 50.0)) * 65.0))
        accuracy_comp = max(0.0, min(100.0, (1.0 - min(backspace_rate / 100.0, 0.5)) * 25.0))
        operational_comp = max(0.0, min(100.0, min(operational_keystrokes_per_min / max(base_op_keys, 1.0), 1.0) * 10.0))
        typing_score = round(max(0.0, min(100.0, content_comp + accuracy_comp + operational_comp)), 1)

        # Status & Trend
        if text_speed_delta_pct < -15.0 or backspace_delta_pct > 35.0:
            status = "declining"
            trend = "persistent_decline" if text_speed_delta_pct < -20.0 else "mild_decline"
        elif text_speed_delta_pct > 10.0:
            status = "improving"
            trend = "positive_adaptation"
        else:
            status = "stable"
            trend = "stable"

        confidence = round(min(0.95, 0.75 + (0.10 if text_keystrokes_per_min > 0 else 0.0)), 2)

        # Metrics Breakdown Table
        metrics_table = {
            "text_keystrokes_per_min": {
                "current": f"{text_keystrokes_per_min:.0f} keys/min",
                "baseline": f"{base_text_keys:.0f} keys/min",
                "change_percent": text_speed_delta_pct,
                "interpretation": f"↓ {abs(text_speed_delta_pct):.1f}%" if text_speed_delta_pct < 0 else f"↑ {text_speed_delta_pct:.1f}%"
            },
            "operational_keystrokes_per_min": {
                "current": f"{operational_keystrokes_per_min:.0f} keys/min",
                "baseline": f"{base_op_keys:.0f} keys/min",
                "change_percent": op_speed_delta_pct,
                "interpretation": "Low-weight navigation stream"
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
            }
        }

        # Non-diagnostic clinical reasoning
        if status == "declining":
            reasoning = (
                f"Content text generation keystroke velocity ({text_keystrokes_per_min:.0f} vs {base_text_keys:.0f} keys/min, "
                f"{metrics_table['text_keystrokes_per_min']['interpretation']}) and error-correction backspace rate "
                f"({metrics_table['backspace_rate']['interpretation']}) deviate from established baseline, "
                f"while operational keystroke stream remains stable."
            )
        else:
            reasoning = (
                f"Content generation keystroke cadence ({text_keystrokes_per_min:.0f} keys/min) and motor typing latency "
                f"remain well aligned with personal baseline parameters."
            )

        return {
            "score": typing_score,
            "status": status,
            "trend": trend,
            "confidence": confidence,
            "baseline_deviation_pct": text_speed_delta_pct,
            "text_keystrokes_per_min": text_keystrokes_per_min,
            "operational_keystrokes_per_min": operational_keystrokes_per_min,
            "metrics": metrics_table,
            "reasoning": reasoning
        }

    def analyze_scrolling(self, data: Dict[str, Any], baseline: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Calculates explicit Interaction Score (0-100) using literature-validated pause and click features."""
        session_dur_min = max(0.1, float(data.get("session_duration", data.get("session_duration_sec", 60.0))) / 60.0)

        # Feature 3: pauses_per_min (Inactivity gaps >10 seconds normalized per minute)
        # Source: Stringer et al. 2018, Int J Geriatr Psychiatry
        if "pauses_per_min" in data:
            pauses_per_min = float(data["pauses_per_min"])
        elif "inactivity_pauses_gt_10s" in data:
            pauses_per_min = float(data["inactivity_pauses_gt_10s"]) / session_dur_min
        elif "scroll_hesitation" in data:
            pauses_per_min = float(data["scroll_hesitation"])
        elif "typing_pauses" in data:
            pauses_per_min = float(data["typing_pauses"])
        else:
            pauses_per_min = 1.2

        # Feature 4: mean_pause_length (Mean duration of pauses in seconds, logged in summary with low weight)
        # Source: Stringer et al. 2018, Int J Geriatr Psychiatry
        mean_pause_length = float(data.get("mean_pause_length", data.get("mean_pause_duration", 12.5)))

        # Feature 5: total_mouse_clicks (Raw session click count, proxy for error-correction / mis-clicks)
        # Source: Stringer et al. 2018, Int J Geriatr Psychiatry
        total_mouse_clicks = int(data.get("total_mouse_clicks", data.get("mouse_clicks", data.get("click_count", 18))))

        # Explicitly Non-Discriminating Features (Tracked/Logged ONLY, 0% Weight in CogniScore)
        # Source: Stringer et al. 2018, Int J Geriatr Psychiatry
        clicks_per_min = float(data.get("clicks_per_min", total_mouse_clicks / session_dur_min))
        inter_click_interval_ms = float(data.get("inter_click_interval", 1250.0))
        total_pixel_distance = float(data.get("total_pixel_distance", 3400.0))
        scroll_velocity = float(data.get("scroll_velocity", data.get("pixels_per_sec", 120.0)))
        pixels_per_sec = scroll_velocity
        scroll_reversals = int(data.get("scroll_reversals", 1))

        # Baseline references
        base_pauses = float(baseline.get("pauses_per_min", 1.2)) if baseline else 1.2
        base_clicks = int(baseline.get("total_mouse_clicks", 18)) if baseline else 18
        base_reversals = int(baseline.get("scroll_reversals", 1)) if baseline else 1

        # Calculate % changes
        pause_delta_pct = round(((pauses_per_min - base_pauses) / max(base_pauses, 0.1)) * 100.0, 1)
        clicks_delta_pct = round(((total_mouse_clicks - base_clicks) / max(base_clicks, 1)) * 100.0, 1)
        rev_delta_pct = round(((scroll_reversals - base_reversals) / max(base_reversals, 1)) * 100.0, 1)

        # Interaction Score (0-100):
        # 50% pauses_per_min (>10s inactivity gaps)
        # 30% total_mouse_clicks (mis-click proxy)
        # 20% navigation trajectory reversals
        # Explicitly excluded from weighting: clicks_per_min, inter_click_interval, total_pixel_distance, pixels_per_sec
        pause_penalty = min(pauses_per_min * 18.0, 50.0)
        click_excess_penalty = min(max(0, total_mouse_clicks - 30) * 1.5, 30.0)
        rev_penalty = min(scroll_reversals * 4.0, 20.0)
        scrolling_score = round(max(0.0, min(100.0, 100.0 - pause_penalty - click_excess_penalty - rev_penalty)), 1)

        # Status & Trend
        if pause_delta_pct > 50.0 or rev_delta_pct >= 80.0:
            status = "elevated_hesitation"
            trend = "increasing_hesitation"
        elif pauses_per_min <= 1.5 and scroll_reversals <= 2:
            status = "stable"
            trend = "stable"
        else:
            status = "stable"
            trend = "stable"

        confidence = round(min(0.95, 0.70 + (0.10 if total_mouse_clicks > 0 else 0.0)), 2)

        # Metrics Table
        metrics_table = {
            "pauses_per_min": {
                "current": f"{pauses_per_min:.1f} pauses/min",
                "baseline": f"{base_pauses:.1f} pauses/min",
                "change_percent": pause_delta_pct,
                "interpretation": f"↑ {pause_delta_pct:.1f}%" if pause_delta_pct > 0 else f"↓ {abs(pause_delta_pct):.1f}%"
            },
            "mean_pause_length": {
                "current": f"{mean_pause_length:.1f} s",
                "baseline": "12.5 s",
                "change_percent": 0.0,
                "interpretation": "Logged (non-discriminating weighting)"
            },
            "total_mouse_clicks": {
                "current": f"{total_mouse_clicks} clicks",
                "baseline": f"{base_clicks} clicks",
                "change_percent": clicks_delta_pct,
                "interpretation": f"↑ {clicks_delta_pct:.1f}%" if clicks_delta_pct > 0 else f"↓ {abs(clicks_delta_pct):.1f}%"
            },
            "scroll_reversals": {
                "current": f"{scroll_reversals}",
                "baseline": f"{base_reversals}",
                "change_percent": rev_delta_pct,
                "interpretation": f"↑ {rev_delta_pct:.1f}%" if rev_delta_pct > 0 else f"↓ {abs(rev_delta_pct):.1f}%"
            }
        }

        # Reasoning
        if status == "elevated_hesitation":
            reasoning = (
                f"Interaction behavior shows increased inactivity pauses >10s ({metrics_table['pauses_per_min']['interpretation']}) "
                f"and trajectory reversals ({metrics_table['scroll_reversals']['interpretation']}) compared with baseline. "
                f"Non-discriminating metrics (pixels/sec, click interval) are tracked for telemetry but excluded from score weighting."
            )
        else:
            reasoning = (
                f"Navigation, pause intervals, and mouse interactions remain smooth and consistent with established baseline norms."
            )

        return {
            "score": scrolling_score,
            "status": status,
            "trend": trend,
            "confidence": confidence,
            "baseline_deviation_pct": pause_delta_pct,
            "pauses_per_min": pauses_per_min,
            "mean_pause_length": mean_pause_length,
            "total_mouse_clicks": total_mouse_clicks,
            "non_discriminating_features": {
                "clicks_per_min": clicks_per_min,
                "inter_click_interval_ms": inter_click_interval_ms,
                "total_pixel_distance": total_pixel_distance,
                "pixels_per_sec": pixels_per_sec,
                "note": "Validated as non-discriminating in Stringer et al. 2018; logged only with 0% score weight."
            },
            "metrics": metrics_table,
            "reasoning": reasoning
        }

    def analyze(self, data: Dict[str, Any], baseline: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Synthesizes Typing Score (60%) and Interaction/Scrolling Score (40%) into unified Behavioral Score."""
        typing_res = self.analyze_typing(data, baseline=baseline)
        scrolling_res = self.analyze_scrolling(data, baseline=baseline)

        # Behavioral Score: 60% Typing + 40% Scrolling/Interaction
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
            f"Content keystroke sub-score ({typing_res['score']}/100, {typing_res['status']}) and interaction pause sub-score "
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
            "literature_features": {
                "text_keystrokes_per_min": typing_res["text_keystrokes_per_min"],
                "operational_keystrokes_per_min": typing_res["operational_keystrokes_per_min"],
                "pauses_per_min": scrolling_res["pauses_per_min"],
                "mean_pause_length": scrolling_res["mean_pause_length"],
                "total_mouse_clicks": scrolling_res["total_mouse_clicks"],
                "excluded_features_0pct_weight": scrolling_res["non_discriminating_features"]
            },
            "metrics_summary": {
                "text_keystrokes_per_min": typing_res["text_keystrokes_per_min"],
                "operational_keystrokes_per_min": typing_res["operational_keystrokes_per_min"],
                "pauses_per_min": scrolling_res["pauses_per_min"],
                "mean_pause_length": scrolling_res["mean_pause_length"],
                "total_mouse_clicks": scrolling_res["total_mouse_clicks"],
                "typing_speed_wpm": float(data.get("typing_speed", 50.0)),
                "inter_key_latency_ms": float(data.get("inter_key_latency", 180.0)),
                "latency_variance": float(data.get("latency_variance", 25.0)),
                "backspace_rate": float(data.get("backspace_rate", 0.05)),
                "correction_rate": float(data.get("correction_rate", 0.06)),
                "typing_pauses": float(scrolling_res["pauses_per_min"]),
                "burst_duration_sec": float(data.get("burst_duration", 4.5)),
                "scroll_velocity": float(data.get("scroll_velocity", 120.0)),
                "scroll_hesitation": float(scrolling_res["pauses_per_min"]),
                "scroll_reversals": int(data.get("scroll_reversals", 1)),
                "clicks_per_min": scrolling_res["non_discriminating_features"]["clicks_per_min"],
                "inter_click_interval": scrolling_res["non_discriminating_features"]["inter_click_interval_ms"],
                "total_pixel_distance": scrolling_res["non_discriminating_features"]["total_pixel_distance"],
                "pixels_per_sec": scrolling_res["non_discriminating_features"]["pixels_per_sec"],
                "interaction_errors": int(data.get("interaction_errors", 0)),
                "task_completion_time_sec": float(data.get("task_completion_time", 60.0))
            }
        }
