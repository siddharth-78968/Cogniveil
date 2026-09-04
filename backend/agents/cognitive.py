from typing import Dict, Any, List, Optional
from assessment_validation import EvidenceQuality, validate_cognitive_battery


class CognitiveTestAgent:
    """Specialized agent analyzing cross-test psychometric patterns and subdomain performance."""

    AGENT_NAME = "CognitiveTestAgent"
    VERSION = "2026.1"

    def analyze(self, test_results: Optional[List[Any]] = None, baseline: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Reason over battery test metrics and subdomains with rigorous evidence quality checks.

        Returns:
            Structured cognitive status dictionary with subdomain scores, % deltas,
            evidence quality, completed/missing domains, and non-diagnostic clinical reasoning.
        """
        raw_tests = test_results or []
        battery_eval = validate_cognitive_battery(raw_tests)
        evidence_quality = battery_eval["evidence_quality"]
        completed_domains = battery_eval["completed_domains"]
        missing_domains = battery_eval["missing_domains"]

        # 1. Handle Insufficient / Incomplete Data
        if evidence_quality in (EvidenceQuality.INSUFFICIENT, EvidenceQuality.ERROR) or not battery_eval["can_calculate_score"]:
            reasoning = (
                f"No valid cognitive test data available to evaluate performance ({battery_eval['reason']}). "
                "Assessment status: INCOMPLETE. Cognitive score and risk probability are not calculated."
            )
            empty_subdomains = {
                "memory": None, "executive_function": None, "attention": None,
                "working_memory": None, "visuospatial": None, "processing_speed": None,
                "reaction": None, "stroop": None
            }
            return {
                "agent": self.AGENT_NAME,
                "version": self.VERSION,
                "cognitive_score": None,
                "score": None,
                "cognitive_status": "unassessed",
                "status": "unassessed",
                "trend": "unassessed",
                "risk_level": "Unassessed",
                "risk_probability": None,
                "confidence": 0.0,
                "evidence_quality": evidence_quality,
                "completed_domains": completed_domains,
                "missing_domains": missing_domains,
                "subdomain_scores": empty_subdomains,
                "metrics": {},
                "explanation": reasoning,
                "reasoning": reasoning,
                "validation": battery_eval,
            }

        # 2. Extract Subdomain Scores from Validated Tests
        memory_scores: List[float] = []
        attention_scores: List[float] = []
        working_memory_scores: List[float] = []
        visuospatial_scores: List[float] = []
        executive_scores: List[float] = []
        speed_scores: List[float] = []
        reaction_scores: List[float] = []
        stroop_scores: List[float] = []
        durations: List[float] = []

        reaction_time_ms = 420.0
        memory_accuracy_pct = None
        stroop_accuracy_pct = None
        trail_part_b_seconds = None
        trail_errors_count = 0

        for t in raw_tests:
            ttype = (t.test_type if hasattr(t, "test_type") else (t.get("test_type", "general") if isinstance(t, dict) else "general")).lower()
            tscore = float(t.score if hasattr(t, "score") else (t.get("score", 50.0) if isinstance(t, dict) else 50.0))
            tdur = float(t.duration_seconds if hasattr(t, "duration_seconds") else (t.get("duration_seconds", 60.0) if isinstance(t, dict) else 60.0))
            durations.append(tdur)

            # Domain Mapping
            if any(k in ttype for k in ["trail", "tmt", "trail_making"]):
                executive_scores.append(tscore)
                speed_scores.append(tscore)
                stroop_scores.append(tscore)
            elif any(k in ttype for k in ["stroop", "inhibition"]):
                executive_scores.append(tscore)
                stroop_scores.append(tscore)
                attention_scores.append(tscore)
            elif "pattern_recall" in ttype or "spatial" in ttype:
                memory_scores.append(tscore)
                visuospatial_scores.append(tscore)
                working_memory_scores.append(tscore)
            elif any(k in ttype for k in ["word_recall", "verbal_recall", "word"]):
                memory_scores.append(tscore)
            elif "digit_span" in ttype or "digit" in ttype:
                working_memory_scores.append(tscore)
                attention_scores.append(tscore)
            elif any(k in ttype for k in ["reaction", "flanker", "tap"]):
                reaction_scores.append(tscore)
                speed_scores.append(tscore)
                attention_scores.append(tscore)
            else:
                memory_scores.append(tscore)

            if isinstance(t, dict):
                if "reaction_time_ms" in t: reaction_time_ms = float(t["reaction_time_ms"])
                if "memory_accuracy" in t: memory_accuracy_pct = float(t["memory_accuracy"])
                if "stroop_accuracy" in t: stroop_accuracy_pct = float(t["stroop_accuracy"])
                if "part_b_duration_seconds" in t: trail_part_b_seconds = float(t["part_b_duration_seconds"])
                if "total_errors" in t: trail_errors_count = int(t["total_errors"])

        # Computed Subdomain Scores (0-100 scale, without silent normal imputation)
        mem_val = round(sum(memory_scores) / len(memory_scores), 1) if memory_scores else (memory_accuracy_pct if memory_accuracy_pct is not None else None)
        att_val = round(sum(attention_scores) / len(attention_scores), 1) if attention_scores else None
        wm_val = round(sum(working_memory_scores) / len(working_memory_scores), 1) if working_memory_scores else None
        visuo_val = round(sum(visuospatial_scores) / len(visuospatial_scores), 1) if visuospatial_scores else mem_val
        exec_val = round(sum(executive_scores) / len(executive_scores), 1) if executive_scores else (
            sum(stroop_scores) / len(stroop_scores) if stroop_scores else stroop_accuracy_pct
        )
        rxn_val = round(sum(reaction_scores) / len(reaction_scores), 1) if reaction_scores else None
        str_val = round(sum(stroop_scores) / len(stroop_scores), 1) if stroop_scores else exec_val
        spd_val = round(sum(speed_scores) / len(speed_scores), 1) if speed_scores else (rxn_val if rxn_val is not None else None)

        # Baseline Subdomain References
        base_mem = float(baseline.get("memory", 82.0)) if baseline else 82.0
        base_att = float(baseline.get("attention", 80.0)) if baseline else 80.0
        base_wm = float(baseline.get("working_memory", 80.0)) if baseline else 80.0
        base_visuo = float(baseline.get("visuospatial", 80.0)) if baseline else 80.0
        base_exec = float(baseline.get("executive_function", baseline.get("stroop", 80.0))) if baseline else 80.0
        base_rxn = float(baseline.get("reaction", 82.0)) if baseline else 82.0
        base_str = float(baseline.get("stroop", 80.0)) if baseline else 80.0
        base_spd = float(baseline.get("processing_speed", 80.0)) if baseline else 80.0

        # Calculate % changes for available domains
        mem_delta_pct = round(((mem_val - base_mem) / max(base_mem, 1.0)) * 100.0, 1) if mem_val is not None else 0.0
        att_delta_pct = round(((att_val - base_att) / max(base_att, 1.0)) * 100.0, 1) if att_val is not None else 0.0
        wm_delta_pct = round(((wm_val - base_wm) / max(base_wm, 1.0)) * 100.0, 1) if wm_val is not None else 0.0
        visuo_delta_pct = round(((visuo_val - base_visuo) / max(base_visuo, 1.0)) * 100.0, 1) if visuo_val is not None else 0.0
        exec_delta_pct = round(((exec_val - base_exec) / max(base_exec, 1.0)) * 100.0, 1) if exec_val is not None else 0.0
        rxn_delta_pct = round(((rxn_val - base_rxn) / max(base_rxn, 1.0)) * 100.0, 1) if rxn_val is not None else 0.0
        str_delta_pct = round(((str_val - base_str) / max(base_str, 1.0)) * 100.0, 1) if str_val is not None else 0.0
        spd_delta_pct = round(((spd_val - base_spd) / max(base_spd, 1.0)) * 100.0, 1) if spd_val is not None else 0.0

        # Composite Cognitive Score (0-100 scale)
        # Dynamically normalized over available valid domains
        has_trail = any("trail" in (t.test_type if hasattr(t, "test_type") else (t.get("test_type", "") if isinstance(t, dict) else "")).lower() for t in raw_tests)
        
        domain_weights = (
            [
                (mem_val, 0.25), (exec_val, 0.20), (att_val, 0.15),
                (wm_val, 0.15), (visuo_val, 0.15), (spd_val, 0.10)
            ] if has_trail else [
                (mem_val, 0.35), (str_val, 0.20), (rxn_val, 0.15),
                (spd_val, 0.15), (att_val, 0.15)
            ]
        )

        active_weight_sum = sum(w for (v, w) in domain_weights if v is not None)
        if active_weight_sum > 0:
            weighted_score = sum(v * w for (v, w) in domain_weights if v is not None) / active_weight_sum
            cognitive_score = round(max(0.0, min(100.0, weighted_score)), 1)
        else:
            cognitive_score = None

        base_cog = float(baseline.get("cognitive_score", 81.0)) if baseline else 81.0
        overall_delta_pct = round(((cognitive_score - base_cog) / max(base_cog, 1.0)) * 100.0, 1) if cognitive_score is not None else 0.0

        # Subdomain Statuses
        mem_status = ("declining" if mem_delta_pct < -12.0 else "improving" if mem_delta_pct > 8.0 else "stable") if mem_val is not None else "untested"
        att_status = ("declining" if att_delta_pct < -12.0 else "improving" if att_delta_pct > 8.0 else "stable") if att_val is not None else "untested"
        wm_status = ("declining" if wm_delta_pct < -12.0 else "improving" if wm_delta_pct > 8.0 else "stable") if wm_val is not None else "untested"
        visuo_status = ("declining" if visuo_delta_pct < -12.0 else "improving" if visuo_delta_pct > 8.0 else "stable") if visuo_val is not None else "untested"
        exec_status = ("declining" if exec_delta_pct < -12.0 else "improving" if exec_delta_pct > 8.0 else "stable") if exec_val is not None else "untested"
        rxn_status = ("declining" if rxn_delta_pct < -12.0 else "improving" if rxn_delta_pct > 8.0 else "stable") if rxn_val is not None else "untested"
        str_status = ("declining" if str_delta_pct < -12.0 else "improving" if str_delta_pct > 8.0 else "stable") if str_val is not None else "untested"
        spd_status = ("declining" if spd_delta_pct < -12.0 else "improving" if spd_delta_pct > 8.0 else "stable") if spd_val is not None else "untested"

        # Overall Status
        declines = sum(1 for s in [mem_status, exec_status, wm_status, visuo_status, att_status, spd_status] if s == "declining")
        if declines >= 3 or (mem_status == "declining" and (spd_status == "declining" or exec_status == "declining")):
            cognitive_status = "significant_decline"
            trend = "persistent_decline"
        elif declines >= 1:
            cognitive_status = "mild_decline"
            trend = "mild_decline"
        else:
            cognitive_status = "stable"
            trend = "stable"

        confidence = round(min(0.96, 0.50 + 0.08 * min(len(completed_domains), 6)), 2)

        # Metrics Breakdown Table
        subdomain_metrics = {}
        if mem_val is not None:
            subdomain_metrics["memory"] = {
                "score": mem_val, "baseline": base_mem, "change_percent": mem_delta_pct,
                "status": mem_status, "interpretation": f"↓ {abs(mem_delta_pct):.1f}%" if mem_delta_pct < 0 else f"↑ {mem_delta_pct:.1f}%"
            }
        if exec_val is not None:
            subdomain_metrics["executive_function"] = {
                "score": exec_val, "baseline": base_exec, "change_percent": exec_delta_pct,
                "status": exec_status, "interpretation": f"↓ {abs(exec_delta_pct):.1f}%" if exec_delta_pct < 0 else f"↑ {exec_delta_pct:.1f}%"
            }
        if att_val is not None:
            subdomain_metrics["attention"] = {
                "score": att_val, "baseline": base_att, "change_percent": att_delta_pct,
                "status": att_status, "interpretation": f"↓ {abs(att_delta_pct):.1f}%" if att_delta_pct < 0 else f"↑ {att_delta_pct:.1f}%"
            }
        if wm_val is not None:
            subdomain_metrics["working_memory"] = {
                "score": wm_val, "baseline": base_wm, "change_percent": wm_delta_pct,
                "status": wm_status, "interpretation": f"↓ {abs(wm_delta_pct):.1f}%" if wm_delta_pct < 0 else f"↑ {wm_delta_pct:.1f}%"
            }
        if visuo_val is not None:
            subdomain_metrics["visuospatial"] = {
                "score": visuo_val, "baseline": base_visuo, "change_percent": visuo_delta_pct,
                "status": visuo_status, "interpretation": f"↓ {abs(visuo_delta_pct):.1f}%" if visuo_delta_pct < 0 else f"↑ {visuo_delta_pct:.1f}%"
            }
        if spd_val is not None:
            subdomain_metrics["processing_speed"] = {
                "score": spd_val, "baseline": base_spd, "change_percent": spd_delta_pct,
                "status": spd_status, "interpretation": f"↓ {abs(spd_delta_pct):.1f}%" if spd_delta_pct < 0 else f"↑ {spd_delta_pct:.1f}%"
            }

        # Formulate Non-Diagnostic Clinical Reasoning
        if evidence_quality == EvidenceQuality.LIMITED:
            reasoning = (
                f"Cognitive score ({cognitive_score}/100, Evidence: LIMITED) is derived from a partial battery "
                f"({len(completed_domains)}/6 domains: {', '.join(completed_domains)}). "
                f"Missing domains: {', '.join(missing_domains)}. "
                + (f"Memory status: {mem_status}. " if mem_val is not None else "")
                + "Results are screening indicators requiring completion of remaining assessments."
            )
        elif mem_status == "declining" and exec_status == "declining":
            reasoning = (
                f"Memory performance ({subdomain_metrics['memory']['interpretation']}) and Executive Function "
                f"set-shifting ({subdomain_metrics['executive_function']['interpretation']}) show divergence from baseline. "
                f"The overall cognitive score ({cognitive_score}/100) reflects multi-domain task latency and sequencing shifts."
            )
        elif exec_status == "declining":
            reasoning = (
                f"Executive-function performance has slowed relative to personal baseline "
                f"({subdomain_metrics['executive_function']['interpretation']}), while other evaluated domains remain stable."
            )
        elif declines > 0:
            reasoning = (
                f"Cognitive score ({cognitive_score}/100) shows mild domain-specific variation relative to personal baseline norms."
            )
        else:
            reasoning = (
                f"Multi-domain cognitive battery performance remains stable across evaluated domains."
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
            "evidence_quality": evidence_quality,
            "completed_domains": completed_domains,
            "missing_domains": missing_domains,
            "baseline_deviation_pct": overall_delta_pct,
            "memory": mem_status,
            "executive_function": exec_status,
            "attention": att_status,
            "working_memory": wm_status,
            "visuospatial": visuo_status,
            "processing_speed": spd_status,
            "subdomain_scores": {
                "memory": mem_val,
                "executive_function": exec_val,
                "attention": att_val,
                "working_memory": wm_val,
                "visuospatial": visuo_val,
                "processing_speed": spd_val,
                "reaction": rxn_val,
                "stroop": str_val
            },
            "metrics": subdomain_metrics,
            "explanation": reasoning,
            "reasoning": reasoning,
            "validation": battery_eval,
        }

