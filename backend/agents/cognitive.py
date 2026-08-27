"""CognitiveTestAgent for CogniVeil.

Decomposes the active psychometric battery into explicit subdomains:
  Memory, Reaction Time, Stroop Interference, Processing Speed, and Attention.
Calculates % baseline deviations for each subdomain and formulates explainable
clinical reasoning over multi-test patterns.
"""

from typing import Dict, Any, List, Optional


class CognitiveTestAgent:
    """Specialized agent analyzing cross-test psychometric patterns and subdomain performance."""

    AGENT_NAME = "CognitiveTestAgent"
    VERSION = "2026.1"

    def analyze(self, test_results: List[Any], baseline: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Reason over battery test metrics and subdomains.

        Returns:
            Structured cognitive status dictionary with subdomain scores, % deltas, and reasoning.
        """
        memory_scores: List[float] = []
        reaction_scores: List[float] = []
        stroop_scores: List[float] = []
        speed_scores: List[float] = []
        attention_scores: List[float] = []
        durations: List[float] = []

        reaction_time_ms = 420.0
        memory_accuracy_pct = 78.0
        stroop_accuracy_pct = 82.0

        for t in test_results:
            ttype = (t.test_type if hasattr(t, "test_type") else t.get("test_type", "general")).lower()
            tscore = float(t.score if hasattr(t, "score") else t.get("score", 50.0))
            tdur = float(t.duration_seconds if hasattr(t, "duration_seconds") else t.get("duration_seconds", 60.0))
            durations.append(tdur)

            if any(k in ttype for k in ["memory", "recall", "word_recall", "pattern_recall", "digit_span"]):
                memory_scores.append(tscore)
            elif any(k in ttype for k in ["reaction", "flanker", "tap"]):
                reaction_scores.append(tscore)
                speed_scores.append(tscore)
                attention_scores.append(tscore)
            elif any(k in ttype for k in ["stroop", "executive", "inhibition"]):
                stroop_scores.append(tscore)
                attention_scores.append(tscore)
            else:
                memory_scores.append(tscore)
                attention_scores.append(tscore)

            if isinstance(t, dict):
                if "reaction_time_ms" in t: reaction_time_ms = float(t["reaction_time_ms"])
                if "memory_accuracy" in t: memory_accuracy_pct = float(t["memory_accuracy"])
                if "stroop_accuracy" in t: stroop_accuracy_pct = float(t["stroop_accuracy"])

        # Computed Subdomain Scores (0-100 scale)
        mem_val = round(sum(memory_scores) / len(memory_scores), 1) if memory_scores else memory_accuracy_pct
        rxn_val = round(sum(reaction_scores) / len(reaction_scores), 1) if reaction_scores else max(0.0, 100.0 - (reaction_time_ms - 250.0) * 0.15)
        str_val = round(sum(stroop_scores) / len(stroop_scores), 1) if stroop_scores else stroop_accuracy_pct
        spd_val = round(sum(speed_scores) / len(speed_scores), 1) if speed_scores else max(0.0, 100.0 - (reaction_time_ms - 200.0) * 0.14)
        att_val = round(sum(attention_scores) / len(attention_scores), 1) if attention_scores else 78.0

        # Baseline Subdomain References
        base_mem = float(baseline.get("memory", 82.0)) if baseline else 82.0
        base_rxn = float(baseline.get("reaction", 82.0)) if baseline else 82.0
        base_str = float(baseline.get("stroop", 80.0)) if baseline else 80.0
        base_spd = float(baseline.get("processing_speed", 80.0)) if baseline else 80.0
        base_att = float(baseline.get("attention", 80.0)) if baseline else 80.0

        # Calculate % changes
        mem_delta_pct = round(((mem_val - base_mem) / max(base_mem, 1.0)) * 100.0, 1)
        rxn_delta_pct = round(((rxn_val - base_rxn) / max(base_rxn, 1.0)) * 100.0, 1)
        str_delta_pct = round(((str_val - base_str) / max(base_str, 1.0)) * 100.0, 1)
        spd_delta_pct = round(((spd_val - base_spd) / max(base_spd, 1.0)) * 100.0, 1)
        att_delta_pct = round(((att_val - base_att) / max(base_att, 1.0)) * 100.0, 1)

        # Composite Cognitive Score (0-100)
        cognitive_score = round(
            0.35 * mem_val +
            0.20 * str_val +
            0.15 * rxn_val +
            0.15 * spd_val +
            0.15 * att_val,
            1
        )

        base_cog = float(baseline.get("cognitive_score", 81.0)) if baseline else 81.0
        overall_delta_pct = round(((cognitive_score - base_cog) / max(base_cog, 1.0)) * 100.0, 1)

        # Subdomain Statuses
        mem_status = "declining" if mem_delta_pct < -12.0 else "improving" if mem_delta_pct > 8.0 else "stable"
        rxn_status = "declining" if rxn_delta_pct < -12.0 else "improving" if rxn_delta_pct > 8.0 else "stable"
        str_status = "declining" if str_delta_pct < -12.0 else "improving" if str_delta_pct > 8.0 else "stable"
        spd_status = "declining" if spd_delta_pct < -12.0 else "improving" if spd_delta_pct > 8.0 else "stable"
        att_status = "declining" if att_delta_pct < -12.0 else "improving" if att_delta_pct > 8.0 else "stable"

        # Overall Status
        declines = sum(1 for s in [mem_status, rxn_status, str_status, spd_status, att_status] if s == "declining")
        if declines >= 3 or (mem_status == "declining" and spd_status == "declining"):
            cognitive_status = "significant_decline"
            trend = "persistent_decline"
        elif declines >= 1:
            cognitive_status = "mild_decline"
            trend = "mild_decline"
        else:
            cognitive_status = "stable"
            trend = "stable"

        confidence = round(min(0.96, 0.70 + 0.05 * min(len(test_results), 5)), 2)

        # Metrics Breakdown
        subdomain_metrics = {
            "memory": {
                "score": mem_val, "baseline": base_mem, "change_percent": mem_delta_pct,
                "status": mem_status, "interpretation": f"↓ {abs(mem_delta_pct):.1f}%" if mem_delta_pct < 0 else f"↑ {mem_delta_pct:.1f}%"
            },
            "reaction": {
                "score": rxn_val, "baseline": base_rxn, "change_percent": rxn_delta_pct,
                "status": rxn_status, "interpretation": f"↓ {abs(rxn_delta_pct):.1f}%" if rxn_delta_pct < 0 else f"↑ {rxn_delta_pct:.1f}%"
            },
            "stroop": {
                "score": str_val, "baseline": base_str, "change_percent": str_delta_pct,
                "status": str_status, "interpretation": f"↓ {abs(str_delta_pct):.1f}%" if str_delta_pct < 0 else f"↑ {str_delta_pct:.1f}%"
            },
            "processing_speed": {
                "score": spd_val, "baseline": base_spd, "change_percent": spd_delta_pct,
                "status": spd_status, "interpretation": f"↓ {abs(spd_delta_pct):.1f}%" if spd_delta_pct < 0 else f"↑ {spd_delta_pct:.1f}%"
            },
            "attention": {
                "score": att_val, "baseline": base_att, "change_percent": att_delta_pct,
                "status": att_status, "interpretation": f"↓ {abs(att_delta_pct):.1f}%" if att_delta_pct < 0 else f"↑ {att_delta_pct:.1f}%"
            }
        }

        # Formulate Reasoning
        if mem_status == "declining" and spd_status == "declining":
            reasoning = (
                f"Memory performance is below baseline ({subdomain_metrics['memory']['interpretation']}) "
                f"alongside reduced processing speed ({subdomain_metrics['processing_speed']['interpretation']}), "
                f"while reaction and attention show relative preservation. The overall cognitive score ({cognitive_score}/100) "
                f"is driven primarily by memory retention and task latency shifts."
            )
        elif declines > 0:
            reasoning = (
                f"Cognitive score ({cognitive_score}/100) shows mild domain-specific variation, "
                f"with subtle shifts in {', '.join([k for k, v in subdomain_metrics.items() if v['status'] == 'declining'])} "
                f"relative to personal baseline norms."
            )
        else:
            reasoning = (
                f"Multi-domain cognitive battery performance remains stable across Memory ({mem_val}), "
                f"Reaction ({rxn_val}), and Executive Stroop ({str_val}) tasks."
            )

        return {
            "agent": self.AGENT_NAME,
            "version": self.VERSION,
            "cognitive_score": cognitive_score,
            "score": cognitive_score,
            "cognitive_status": cognitive_status,
            "status": cognitive_status,
            "trend": trend,
            "confidence": confidence,
            "baseline_deviation_pct": overall_delta_pct,
            "memory": mem_status,
            "attention": att_status,
            "processing_speed": spd_status,
            "subdomain_scores": {
                "memory": mem_val,
                "reaction": rxn_val,
                "stroop": str_val,
                "processing_speed": spd_val,
                "attention": att_val
            },
            "metrics": subdomain_metrics,
            "explanation": reasoning,
            "reasoning": reasoning
        }
