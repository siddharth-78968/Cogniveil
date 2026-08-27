"""CognitiveTestAgent for CogniVeil.

Interprets the multi-test psychometric battery across subdomains (Memory,
Attention, Processing Speed, and Executive Function via Stroop) rather than
relying on a single aggregated test score.
"""

from typing import Dict, Any, List, Optional


class CognitiveTestAgent:
    """Specialized agent analyzing cross-test psychometric patterns and domain performance."""

    AGENT_NAME = "CognitiveTestAgent"
    VERSION = "2026.1"

    def analyze(self, test_results: List[Any], baseline: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Reason over battery test metrics and subdomains.

        Args:
            test_results: List of test results (TestResult objects or dicts).
            baseline: User's historical subdomain baseline scores.

        Returns:
            Structured cognitive status dictionary across subdomains.
        """
        # Parse tests by category
        memory_scores: List[float] = []
        attention_scores: List[float] = []
        speed_scores: List[float] = []
        executive_scores: List[float] = []
        durations: List[float] = []

        # Extract detailed parameters if provided
        reaction_time_ms = 450.0
        reaction_variability_ms = 45.0
        memory_accuracy_pct = 80.0
        delayed_recall_pct = 75.0
        stroop_accuracy_pct = 85.0
        stroop_rt_ms = 620.0
        error_rate_pct = 12.0

        for t in test_results:
            ttype = (t.test_type if hasattr(t, "test_type") else t.get("test_type", "general")).lower()
            tscore = float(t.score if hasattr(t, "score") else t.get("score", 50.0))
            tdur = float(t.duration_seconds if hasattr(t, "duration_seconds") else t.get("duration_seconds", 60.0))
            durations.append(tdur)

            if any(k in ttype for k in ["memory", "recall", "word_recall", "pattern_recall", "digit_span"]):
                memory_scores.append(tscore)
            elif any(k in ttype for k in ["reaction", "speed", "tap", "flanker"]):
                speed_scores.append(tscore)
                attention_scores.append(tscore)
            elif any(k in ttype for k in ["stroop", "executive", "inhibition", "trail"]):
                executive_scores.append(tscore)
                attention_scores.append(tscore)
            else:
                # Default distribution
                memory_scores.append(tscore)
                attention_scores.append(tscore)

            # Check for specific metrics embedded in test result dicts
            if isinstance(t, dict):
                if "reaction_time_ms" in t: reaction_time_ms = float(t["reaction_time_ms"])
                if "reaction_variability_ms" in t: reaction_variability_ms = float(t["reaction_variability_ms"])
                if "memory_accuracy" in t: memory_accuracy_pct = float(t["memory_accuracy"])
                if "delayed_recall" in t: delayed_recall_pct = float(t["delayed_recall"])
                if "stroop_accuracy" in t: stroop_accuracy_pct = float(t["stroop_accuracy"])
                if "stroop_response_time_ms" in t: stroop_rt_ms = float(t["stroop_response_time_ms"])
                if "error_rate" in t: error_rate_pct = float(t["error_rate"])

        # Compute Subdomain Scores (0-100)
        mem_val = sum(memory_scores) / len(memory_scores) if memory_scores else memory_accuracy_pct
        att_val = sum(attention_scores) / len(attention_scores) if attention_scores else 78.0
        spd_val = sum(speed_scores) / len(speed_scores) if speed_scores else max(0.0, 100.0 - (reaction_time_ms - 250.0) * 0.15)
        exe_val = sum(executive_scores) / len(executive_scores) if executive_scores else stroop_accuracy_pct

        subdomain_scores = {
            "memory": round(max(0.0, min(100.0, mem_val)), 1),
            "attention": round(max(0.0, min(100.0, att_val)), 1),
            "processing_speed": round(max(0.0, min(100.0, spd_val)), 1),
            "executive_function": round(max(0.0, min(100.0, exe_val)), 1)
        }

        # Overall Active Cognitive Score
        active_score = round(
            0.35 * subdomain_scores["memory"] +
            0.25 * subdomain_scores["executive_function"] +
            0.20 * subdomain_scores["processing_speed"] +
            0.20 * subdomain_scores["attention"],
            1
        )

        # Baseline Subdomain Comparisons
        base_mem = float(baseline.get("memory", 80.0)) if baseline else 80.0
        base_att = float(baseline.get("attention", 80.0)) if baseline else 80.0
        base_spd = float(baseline.get("processing_speed", 80.0)) if baseline else 80.0
        base_exe = float(baseline.get("executive_function", 80.0)) if baseline else 80.0

        # Trend Evaluations per subdomain
        mem_status = "declining" if subdomain_scores["memory"] < base_mem - 12.0 else "improving" if subdomain_scores["memory"] > base_mem + 8.0 else "stable"
        att_status = "declining" if subdomain_scores["attention"] < base_att - 12.0 else "improving" if subdomain_scores["attention"] > base_att + 8.0 else "stable"
        spd_status = "declining" if subdomain_scores["processing_speed"] < base_spd - 12.0 else "improving" if subdomain_scores["processing_speed"] > base_spd + 8.0 else "stable"
        exe_status = "declining" if subdomain_scores["executive_function"] < base_exe - 12.0 else "improving" if subdomain_scores["executive_function"] > base_exe + 8.0 else "stable"

        # Overall Cognitive Battery Status
        decline_count = sum(1 for s in [mem_status, att_status, spd_status, exe_status] if s == "declining")
        if decline_count >= 3 or (mem_status == "declining" and exe_status == "declining"):
            cognitive_status = "significant_decline"
        elif decline_count >= 1:
            cognitive_status = "mild_decline"
        else:
            cognitive_status = "stable"

        # Confidence Estimation
        test_count = len(test_results)
        confidence = round(min(0.95, 0.65 + 0.06 * min(test_count, 5)), 2)

        # Explanation formulation
        reasons = []
        if mem_status == "declining":
            reasons.append(f"Memory task retention dropped below personal baseline ({subdomain_scores['memory']:.1f} vs {base_mem:.1f}).")
        if spd_status == "declining":
            reasons.append(f"Response latency lengthened ({subdomain_scores['processing_speed']:.1f} processing speed score).")
        if exe_status == "declining":
            reasons.append("Inhibition accuracy during Stroop interference tasks showed reduced efficiency.")
        if not reasons:
            reasons.append("Multi-domain psychometric test performance is consistent with personal baseline.")

        explanation = " ".join(reasons)

        return {
            "agent": self.AGENT_NAME,
            "version": self.VERSION,
            "cognitive_status": cognitive_status,
            "memory": mem_status,
            "attention": att_status,
            "processing_speed": spd_status,
            "executive_function": exe_status,
            "cognitive_score": active_score,
            "subdomain_scores": subdomain_scores,
            "confidence": confidence,
            "explanation": explanation,
            "battery_metrics": {
                "tests_completed": test_count,
                "reaction_time_ms": reaction_time_ms,
                "reaction_variability_ms": reaction_variability_ms,
                "memory_accuracy_pct": memory_accuracy_pct,
                "delayed_recall_pct": delayed_recall_pct,
                "stroop_accuracy_pct": stroop_accuracy_pct,
                "stroop_rt_ms": stroop_rt_ms,
                "error_rate_pct": error_rate_pct,
                "mean_duration_sec": round(sum(durations) / max(len(durations), 1), 1)
            }
        }
