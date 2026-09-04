"""Runtime interface for CogniVeil's validated speech-risk model.

The model is deliberately unavailable until a provenance-checked artifact has
been trained by ``train_speech_model.py``. This prevents the product from
showing invented accuracy or silently substituting a heuristic for a validated
clinical model.
"""
from __future__ import annotations

import json
import math
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd


MODEL_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_PATH = MODEL_DIR / "speech_risk_model.joblib"
METADATA_PATH = MODEL_DIR / "speech_risk_metadata.json"

FEATURE_COLUMNS = [
    "speech_activity_ratio",
    "pause_rate_per_minute",
    "mean_rms",
    "words_per_minute",
    "vocabulary_richness",
]

# Standard physiological / acoustic bounding ranges and median imputation fallback
FEATURE_BOUNDS: Dict[str, Tuple[float, float, float]] = {
    "speech_activity_ratio": (0.0, 1.0, 0.65),
    "pause_rate_per_minute": (0.0, 60.0, 8.0),
    "mean_rms": (0.0, 1.0, 0.045),
    "words_per_minute": (0.0, 300.0, 120.0),
    "vocabulary_richness": (0.0, 1.0, 0.70),
}

_cached_model: Any = None
_cached_mtime: Optional[float] = None
_cached_metadata: Optional[Dict[str, Any]] = None


def model_status() -> dict[str, Any]:
    """Return validation metadata only when a trained model artifact exists."""
    global _cached_metadata
    if not MODEL_PATH.exists() or not METADATA_PATH.exists():
        return {
            "available": False,
            "reason": "No validated speech-risk model has been trained for this deployment.",
            "required_features": FEATURE_COLUMNS,
        }
    try:
        if _cached_metadata is None:
            _cached_metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
        return {"available": True, **_cached_metadata}
    except (OSError, json.JSONDecodeError):
        return {"available": False, "reason": "Speech-model metadata is unreadable."}


def _get_loaded_model() -> Optional[Any]:
    """Retrieve or cache the trained scikit-learn pipeline artifact."""
    global _cached_model, _cached_mtime
    if not MODEL_PATH.exists():
        return None
    try:
        current_mtime = os.path.getmtime(MODEL_PATH)
        if _cached_model is None or _cached_mtime != current_mtime:
            _cached_model = joblib.load(MODEL_PATH)
            _cached_mtime = current_mtime
        return _cached_model
    except Exception:
        return None


def sanitize_features(raw_features: Optional[Dict[str, Any]]) -> Tuple[Dict[str, float], List[str]]:
    """Strictly validates, cleans, and bounds the 5 required acoustic and lexical features.
    
    Replaces None, NaN, Inf, negative values, and non-numeric types with physiological priors,
    tracking all imputed features.
    """
    raw = raw_features or {}
    sanitized: Dict[str, float] = {}
    imputed: List[str] = []

    for col in FEATURE_COLUMNS:
        min_v, max_v, default_v = FEATURE_BOUNDS[col]
        val = raw.get(col)

        # Check for missing, non-numeric, or NaN/Inf
        is_invalid = False
        if val is None:
            is_invalid = True
        else:
            try:
                fval = float(val)
                if math.isnan(fval) or math.isinf(fval):
                    is_invalid = True
                else:
                    # Bound within physiological limits
                    clamped = max(min_v, min(max_v, fval))
                    sanitized[col] = float(clamped)
            except (ValueError, TypeError):
                is_invalid = True

        if is_invalid:
            sanitized[col] = float(default_v)
            imputed.append(col)

    return sanitized, imputed


def predict(features: Optional[Dict[str, Any]], transcript: str = "") -> dict[str, Any]:
    """Predict only from a validated artifact, otherwise return unavailable."""
    status = model_status()
    if not status.get("available"):
        return {
            "available": False,
            "reason": status.get("reason", "Speech-risk ML model unavailable."),
            "evidence_quality": "INSUFFICIENT",
        }

    model = _get_loaded_model()
    if model is None:
        return {
            "available": False,
            "reason": "Failed to load speech-risk model artifact.",
            "evidence_quality": "INSUFFICIENT",
        }

    # 1. Sanitize & enforce correct feature ordering
    sanitized_feats, imputed_cols = sanitize_features(features)
    frame = pd.DataFrame([{name: sanitized_feats[name] for name in FEATURE_COLUMNS}])

    # 2. Execute scikit-learn pipeline inference
    try:
        proba = float(model.predict_proba(frame)[0, 1])
    except Exception as exc:
        return {
            "available": False,
            "reason": f"Model inference error: {str(exc)}",
            "evidence_quality": "INSUFFICIENT",
        }

    threshold = float(status.get("operating_threshold", 0.92))
    risk_pct = round(proba * 100.0, 1)

    # 3. Derive Evidence Quality indicator
    from services.voice_analysis import evaluate_evidence_quality
    evidence_quality = evaluate_evidence_quality(
        features=features,
        transcript=transcript,
        duration_seconds=float((features or {}).get("duration_seconds", 0.0)),
        mean_rms=sanitized_feats.get("mean_rms"),
        activity_ratio=sanitized_feats.get("speech_activity_ratio"),
        transcription_conf=float((features or {}).get("transcription_confidence", 0.90)),
    )

    if evidence_quality == "INSUFFICIENT":
        return {
            "available": True,
            "probability": None,
            "risk_probability": None,
            "risk_percentage": None,
            "screen_positive": None,
            "operating_threshold": round(threshold, 3),
            "model_version": str(status.get("model_version", "2026.1")),
            "algorithm": str(status.get("algorithm", "median-imputed, scaled logistic regression")),
            "evidence_quality": "INSUFFICIENT",
            "features_used": sanitized_feats,
            "imputed_features": imputed_cols,
            "operating_notes": "Insufficient usable speech detected (< 3 words or < 2.0s active speech). Risk probability not calculated.",
        }

    operating_notes = "Screening support probability derived from validated speech-risk model artifact."

    return {
        "available": True,
        "probability": round(proba, 3),
        "risk_probability": round(proba, 3),
        "risk_percentage": risk_pct,
        "screen_positive": proba >= threshold,
        "operating_threshold": round(threshold, 3),
        "model_version": str(status.get("model_version", "2026.1")),
        "algorithm": str(status.get("algorithm", "median-imputed, scaled logistic regression")),
        "evidence_quality": evidence_quality,
        "features_used": sanitized_feats,
        "imputed_features": imputed_cols,
        "operating_notes": operating_notes,
    }

