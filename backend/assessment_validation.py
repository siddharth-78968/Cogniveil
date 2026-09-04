"""CogniVeil Assessment Validation & Clinical Evidence Quality Layer.

Standardizes data validation, sufficiency verification, and evidence quality states
across all assessment modalities:
  - GOOD: Enough valid evidence exists for defensible analysis.
  - LIMITED: Analysis is possible but has important limitations (e.g. partial battery, short sample).
  - INSUFFICIENT: Not enough valid evidence to calculate a meaningful result (e.g. < 5s audio, < 3 words, empty battery).
  - ERROR: The processing or ingestion pipeline failed.

Invariants:
  - INSUFFICIENT and ERROR states MUST NEVER default to LOW RISK or substitute fake probabilities.
  - Missing cognitive domains must not be silently imputed as normal baseline.
  - Clear, non-alarming clinician and patient explanatory reasons are attached to every assessment.
"""

from __future__ import annotations

import math
import re
from typing import Any, Dict, List, Optional, Tuple, Union


# Controlled Evidence Quality States
class EvidenceQuality:
    GOOD = "GOOD"
    LIMITED = "LIMITED"
    INSUFFICIENT = "INSUFFICIENT"
    ERROR = "ERROR"
    ALL = (GOOD, LIMITED, INSUFFICIENT, ERROR)


# Cognitive Battery Domain Definitions & Standard Norms
COGNITIVE_DOMAINS = {
    "pattern_recall": {
        "domain": "visuospatial_memory",
        "name": "Pattern Recall",
        "normative_mean": 82.0,
        "default_weight": 0.20,
    },
    "word_recall": {
        "domain": "verbal_episodic_memory",
        "name": "Word Recall",
        "normative_mean": 80.0,
        "default_weight": 0.20,
    },
    "digit_span": {
        "domain": "working_memory",
        "name": "Digit Span",
        "normative_mean": 78.0,
        "default_weight": 0.20,
    },
    "trail_making": {
        "domain": "executive_function",
        "name": "Trail Making Test",
        "normative_mean": 78.0,
        "default_weight": 0.20,
    },
    "stroop": {
        "domain": "executive_inhibition",
        "name": "Stroop Test",
        "normative_mean": 75.0,
        "default_weight": 0.10,
    },
    "reaction_time": {
        "domain": "processing_speed",
        "name": "Reaction Time",
        "normative_mean": 85.0,
        "default_weight": 0.10,
    },
}


# =============================================================================
# 1. Voice Assessment Validation
# =============================================================================

def validate_voice_assessment(
    features: Optional[Dict[str, Any]] = None,
    transcript: str = "",
    min_duration_seconds: float = 5.0,
    min_active_speech_seconds: float = 2.0,
    min_words: int = 3,
) -> Dict[str, Any]:
    """Validates acoustic voice and transcript characteristics against clinical sufficiency criteria.

    Detects:
      - Processing or transcription errors (ERROR state)
      - Recording too short (< 5.0s)
      - Insufficient active speech (< 2.0s)
      - Insufficient word volume (< 3 words)
      - Silent / near-zero microphone energy (mean_rms < 0.003 and no transcript)
      - Audio clipping distortion (mean_rms > 0.85)
      - Low transcription confidence (< 0.50)
      - Corrupted or empty feature payloads

    Returns:
      Structured validation report with controlled evidence_quality, issues, warnings,
      and whether risk calculation is clinically permitted.
    """
    if features is not None and not isinstance(features, dict):
        return {
            "evidence_quality": EvidenceQuality.ERROR,
            "is_sufficient": False,
            "can_calculate_risk": False,
            "reason": "Invalid feature payload format.",
            "issues": ["Features payload must be a key-value dictionary."],
            "warnings": [],
            "recommendation": "Check client audio feature serialization.",
            "metrics": {
                "duration_seconds": 0.0,
                "active_speech_duration_sec": 0.0,
                "speech_activity_ratio": 0.0,
                "word_count": 0,
                "mean_rms": 0.0,
                "transcription_confidence": 0.0,
                "has_transcript": False,
            },
        }

    feats = features or {}

    # Check for explicit ingestion/processing errors
    if feats.get("error") or feats.get("processing_error"):
        err_msg = str(feats.get("error") or feats.get("processing_error"))
        return {
            "evidence_quality": EvidenceQuality.ERROR,
            "is_sufficient": False,
            "can_calculate_risk": False,
            "reason": f"Audio processing error: {err_msg}",
            "issues": [f"Audio processing error: {err_msg}"],
            "warnings": [],
            "recommendation": "Audio processing failed. Please check audio recording hardware and try again.",
            "metrics": {
                "duration_seconds": 0.0,
                "active_speech_duration_sec": 0.0,
                "speech_activity_ratio": 0.0,
                "word_count": 0,
                "mean_rms": 0.0,
                "transcription_confidence": 0.0,
                "has_transcript": False,
            },
        }

    issues: List[str] = []
    warnings: List[str] = []

    try:
        raw_dur = feats.get("duration_seconds")
        duration = float(raw_dur) if raw_dur is not None else 0.0
    except (ValueError, TypeError):
        duration = 0.0

    try:
        raw_rms = feats.get("mean_rms")
        mean_rms = float(raw_rms) if raw_rms is not None else 0.045
    except (ValueError, TypeError):
        mean_rms = 0.045

    try:
        raw_act = feats.get("speech_activity_ratio")
        activity_ratio = min(1.0, max(0.0, float(raw_act))) if raw_act is not None else 0.65
    except (ValueError, TypeError):
        activity_ratio = 0.65

    try:
        raw_conf = feats.get("transcription_confidence")
        tconf = float(raw_conf) if raw_conf is not None else 0.90
    except (ValueError, TypeError):
        tconf = 0.90

    # Tokenize words cleanly across languages
    clean_transcript = (transcript or "").strip()
    words = re.findall(r"\b[\w']+\b", clean_transcript, flags=re.UNICODE)
    word_count = len(words)
    active_speech_sec = duration * activity_ratio

    # 1. Critical Insufficiency Checks
    if duration <= 0.0:
        issues.append("No audio data received or recording failed to capture.")
    elif duration < min_duration_seconds:
        issues.append(f"Recording duration ({duration:.1f}s) is shorter than the minimum required ({min_duration_seconds:.1f}s).")

    if word_count == 0 and not clean_transcript:
        if duration < 10.0 or active_speech_sec < min_active_speech_seconds:
            issues.append("No intelligible speech detected in recording.")
    elif word_count < min_words:
        issues.append(f"Insufficient usable speech detected ({word_count} word{'s' if word_count != 1 else ''} < {min_words} required for reliable acoustic/linguistic analysis).")

    if active_speech_sec < min_active_speech_seconds and word_count < min_words:
        if f"Insufficient active speech detected" not in " ".join(issues):
            issues.append(f"Insufficient active speech detected ({active_speech_sec:.1f}s active speech < {min_active_speech_seconds:.1f}s required).")

    if mean_rms < 0.003 and word_count == 0:
        issues.append("Microphone input was near-silent or disconnected.")

    # 2. Quality Warnings (Analysis permitted under LIMITED state)
    if mean_rms < 0.008 and not issues:
        warnings.append("Low microphone volume detected. Audio signal is weak.")

    if mean_rms > 0.85:
        warnings.append("Microphone audio clipping or excessive input gain detected.")

    if tconf < 0.50 and word_count > 0:
        warnings.append("Low speech recognition transcription confidence.")

    if duration >= min_duration_seconds and duration < 10.0 and not issues:
        warnings.append(f"Brief recording duration ({duration:.1f}s). Standard continuous speech protocol recommends >= 10s.")

    # 3. Determine Evidence Quality
    if issues:
        evidence_quality = EvidenceQuality.INSUFFICIENT
        reason = issues[0]
        can_calculate_risk = False
        recommendation = "Please repeat the recording in a quiet environment and speak clearly for at least 10–15 seconds."
    elif warnings or duration < 10.0 or word_count < 6 or tconf < 0.70:
        evidence_quality = EvidenceQuality.LIMITED
        reason = warnings[0] if warnings else "Brief voice sample with limited lexical content."
        can_calculate_risk = True
        recommendation = "Voice analysis completed with limitations. Consider repeating for higher precision."
    else:
        evidence_quality = EvidenceQuality.GOOD
        reason = "Acoustic signal and transcription meet clinical evidence quality criteria."
        can_calculate_risk = True
        recommendation = "Voice sample validated for longitudinal baseline comparison."

    return {
        "evidence_quality": evidence_quality,
        "is_sufficient": evidence_quality not in (EvidenceQuality.INSUFFICIENT, EvidenceQuality.ERROR),
        "can_calculate_risk": can_calculate_risk,
        "reason": reason,
        "issues": issues,
        "warnings": warnings,
        "recommendation": recommendation,
        "metrics": {
            "duration_seconds": round(duration, 2),
            "active_speech_duration_sec": round(active_speech_sec, 2),
            "speech_activity_ratio": round(activity_ratio, 3),
            "word_count": word_count,
            "mean_rms": round(mean_rms, 4),
            "transcription_confidence": round(tconf, 2),
            "has_transcript": bool(clean_transcript),
        },
    }


# =============================================================================
# 2. Cognitive Test Item Validation
# =============================================================================

def validate_cognitive_test_item(
    test_item: Any,
) -> Dict[str, Any]:
    """Validates an individual psychometric test record for completeness, valid bounds, and duration."""
    issues: List[str] = []
    warnings: List[str] = []

    if test_item is None:
        return {
            "test_type": "unknown",
            "score": None,
            "duration_seconds": 0.0,
            "is_valid": False,
            "evidence_quality": EvidenceQuality.INSUFFICIENT,
            "issues": ["Missing cognitive test item (null record)."],
            "warnings": [],
            "reason": "Missing cognitive test item (null record).",
        }

    if isinstance(test_item, dict):
        if test_item.get("error") or test_item.get("processing_error"):
            err_msg = str(test_item.get("error") or test_item.get("processing_error"))
            return {
                "test_type": str(test_item.get("test_type", "unknown")),
                "score": None,
                "duration_seconds": 0.0,
                "is_valid": False,
                "evidence_quality": EvidenceQuality.ERROR,
                "issues": [f"Test processing error: {err_msg}"],
                "warnings": [],
                "reason": f"Test processing error: {err_msg}",
            }
        ttype = str(test_item.get("test_type", "")).strip().lower()
        raw_score = test_item.get("score")
        raw_dur = test_item.get("duration_seconds", 60.0)
        meta = test_item.get("metadata", {})
    else:
        if getattr(test_item, "error", None) or getattr(test_item, "processing_error", None):
            err_msg = str(getattr(test_item, "error", None) or getattr(test_item, "processing_error", None))
            return {
                "test_type": str(getattr(test_item, "test_type", "unknown")),
                "score": None,
                "duration_seconds": 0.0,
                "is_valid": False,
                "evidence_quality": EvidenceQuality.ERROR,
                "issues": [f"Test processing error: {err_msg}"],
                "warnings": [],
                "reason": f"Test processing error: {err_msg}",
            }
        ttype = str(getattr(test_item, "test_type", "")).strip().lower()
        raw_score = getattr(test_item, "score", None)
        raw_dur = getattr(test_item, "duration_seconds", 60.0)
        meta = {}

    if not ttype:
        issues.append("Missing test_type in cognitive test record.")

    # Validate Score
    score = None
    if raw_score is None:
        issues.append("Missing score value in cognitive test record.")
    else:
        try:
            fscore = float(raw_score)
            if math.isnan(fscore) or math.isinf(fscore):
                issues.append("Non-numeric or NaN score value.")
            elif fscore < 0.0 or fscore > 100.0:
                issues.append(f"Score ({fscore}) is outside valid psychometric range (0–100).")
            else:
                score = round(fscore, 1)
        except (ValueError, TypeError):
            issues.append(f"Invalid non-numeric score value: {raw_score}")

    # Validate Duration
    duration = 60.0
    if raw_dur is not None:
        try:
            fdur = float(raw_dur)
            if math.isnan(fdur) or fdur < 0.0:
                warnings.append("Invalid duration reported; using default estimate.")
            elif fdur < 1.0:
                warnings.append(f"Unusually brief test duration ({fdur:.1f}s). Potential aborted session.")
            else:
                duration = round(fdur, 1)
        except (ValueError, TypeError):
            warnings.append("Non-numeric duration.")

    is_valid = len(issues) == 0 and score is not None
    evidence_quality = EvidenceQuality.GOOD if is_valid and not warnings else (
        EvidenceQuality.LIMITED if is_valid else EvidenceQuality.INSUFFICIENT
    )

    return {
        "test_type": ttype,
        "score": score,
        "duration_seconds": duration,
        "is_valid": is_valid,
        "evidence_quality": evidence_quality,
        "issues": issues,
        "warnings": warnings,
        "reason": issues[0] if issues else (warnings[0] if warnings else "Valid psychometric response."),
    }


# =============================================================================
# 3. Cognitive Battery Validation
# =============================================================================

def validate_cognitive_battery(
    test_results: Optional[List[Any]] = None,
) -> Dict[str, Any]:
    """Validates an entire daily cognitive battery session across Memory, Attention, Working Memory,

    Executive Function, and Processing Speed.
    Prevents missing tests from silently becoming normal baseline values.
    """
    raw_tests = test_results or []
    valid_tests: List[Dict[str, Any]] = []
    invalid_tests: List[Dict[str, Any]] = []

    domain_hits: Dict[str, List[float]] = {
        "memory": [],
        "executive_function": [],
        "attention": [],
        "working_memory": [],
        "visuospatial": [],
        "processing_speed": [],
    }

    for item in raw_tests:
        val = validate_cognitive_test_item(item)
        if val["is_valid"]:
            valid_tests.append(val)
            tt = val["test_type"]
            sc = val["score"]

            if any(k in tt for k in ["trail", "tmt", "trail_making"]):
                domain_hits["executive_function"].append(sc)
                domain_hits["processing_speed"].append(sc)
            elif any(k in tt for k in ["stroop", "inhibition"]):
                domain_hits["executive_function"].append(sc)
                domain_hits["attention"].append(sc)
            elif "pattern_recall" in tt or "spatial" in tt:
                domain_hits["memory"].append(sc)
                domain_hits["visuospatial"].append(sc)
                domain_hits["working_memory"].append(sc)
            elif any(k in tt for k in ["word_recall", "word"]):
                domain_hits["memory"].append(sc)
            elif "digit_span" in tt or "digit" in tt:
                domain_hits["working_memory"].append(sc)
                domain_hits["attention"].append(sc)
            elif any(k in tt for k in ["reaction", "latency", "flanker"]):
                domain_hits["processing_speed"].append(sc)
                domain_hits["attention"].append(sc)
            else:
                domain_hits["memory"].append(sc)
        else:
            invalid_tests.append(val)

    completed_domains = [d for d, scores in domain_hits.items() if len(scores) > 0]
    missing_domains = [d for d, scores in domain_hits.items() if len(scores) == 0]

    # Calculate domain scores only for completed domains
    domain_scores: Dict[str, Optional[float]] = {}
    for d, scores in domain_hits.items():
        domain_scores[d] = round(sum(scores) / len(scores), 1) if scores else None

    total_valid = len(valid_tests)

    has_error = any(t.get("evidence_quality") == EvidenceQuality.ERROR for t in invalid_tests)

    if total_valid == 0:
        if has_error:
            evidence_quality = EvidenceQuality.ERROR
            reason = next((t["reason"] for t in invalid_tests if t.get("evidence_quality") == EvidenceQuality.ERROR), "Cognitive test processing error.")
        else:
            evidence_quality = EvidenceQuality.INSUFFICIENT
            reason = "No valid cognitive test results completed in this session."
        can_calculate_score = False
        status_label = "INCOMPLETE"
    elif len(completed_domains) < 3:
        evidence_quality = EvidenceQuality.LIMITED
        reason = f"Partial battery completed ({len(completed_domains)}/6 domains: {', '.join(completed_domains)}). Missing {', '.join(missing_domains)}."
        can_calculate_score = True
        status_label = "PARTIAL"
    else:
        evidence_quality = EvidenceQuality.GOOD
        reason = f"Substantial cognitive battery completed ({len(completed_domains)}/6 domains)."
        can_calculate_score = True
        status_label = "COMPLETED"

    return {
        "evidence_quality": evidence_quality,
        "status_label": status_label,
        "can_calculate_score": can_calculate_score,
        "total_tests_submitted": len(raw_tests),
        "valid_tests_count": total_valid,
        "invalid_tests_count": len(invalid_tests),
        "completed_domains": completed_domains,
        "missing_domains": missing_domains,
        "domain_scores": domain_scores,
        "reason": reason,
        "valid_tests": valid_tests,
        "invalid_tests": invalid_tests,
    }


# =============================================================================
# 4. Multimodal Fusion & Overall Reliability Validation
# =============================================================================

def validate_fused_session(
    cognitive_val: Dict[str, Any],
    voice_val: Optional[Dict[str, Any]] = None,
    behavior_sufficient: bool = True,
) -> Dict[str, Any]:
    """Synthesizes modality-specific quality checks into an overall session evidence state."""
    cog_eq = cognitive_val.get("evidence_quality", EvidenceQuality.INSUFFICIENT)
    voi_eq = voice_val.get("evidence_quality") if voice_val else None

    # Determine overall evidence quality
    if cog_eq == EvidenceQuality.INSUFFICIENT and (voi_eq is None or voi_eq == EvidenceQuality.INSUFFICIENT):
        overall_eq = EvidenceQuality.INSUFFICIENT
        overall_reason = "Insufficient valid cognitive or voice assessment data to produce a defensible clinical screening result."
        can_produce_result = False
    elif cog_eq == EvidenceQuality.LIMITED or voi_eq == EvidenceQuality.LIMITED:
        overall_eq = EvidenceQuality.LIMITED
        overall_reason = "Assessment completed with partial evidence coverage. Interpret within known limitations."
        can_produce_result = True
    elif cog_eq == EvidenceQuality.GOOD and (voi_eq is None or voi_eq == EvidenceQuality.GOOD):
        overall_eq = EvidenceQuality.GOOD
        overall_reason = "Full evidence requirements met across active psychometrics and acoustic telemetry."
        can_produce_result = True
    else:
        overall_eq = EvidenceQuality.LIMITED
        overall_reason = "Mixed evidence quality across screening modalities."
        can_produce_result = True

    return {
        "overall_evidence_quality": overall_eq,
        "can_produce_result": can_produce_result,
        "reason": overall_reason,
        "modality_breakdown": {
            "cognitive": cog_eq,
            "voice": voi_eq or "NOT_COLLECTED",
            "behavioral": "GOOD" if behavior_sufficient else "LIMITED",
        },
    }
