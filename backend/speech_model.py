"""Runtime interface for CogniVeil's validated speech-risk model.

The model is deliberately unavailable until a provenance-checked artifact has
been trained by ``train_speech_model.py``. This prevents the product from
showing invented accuracy or silently substituting a heuristic for a validated
clinical model.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
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


def model_status() -> dict[str, Any]:
    """Return validation metadata only when a trained model artifact exists."""
    if not MODEL_PATH.exists() or not METADATA_PATH.exists():
        return {
            "available": False,
            "reason": "No validated speech-risk model has been trained for this deployment.",
            "required_features": FEATURE_COLUMNS,
        }
    try:
        metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
        return {"available": True, **metadata}
    except (OSError, json.JSONDecodeError):
        return {"available": False, "reason": "Speech-model metadata is unreadable."}


def predict(features: dict[str, Any]) -> dict[str, Any]:
    """Predict only from a validated artifact, otherwise return unavailable."""
    status = model_status()
    if not status["available"]:
        return status
    model = joblib.load(MODEL_PATH)
    frame = pd.DataFrame([{name: features.get(name) for name in FEATURE_COLUMNS}])
    probability = float(model.predict_proba(frame)[0, 1])
    threshold = float(status["operating_threshold"])
    return {
        "available": True,
        "probability": round(probability, 3),
        "screen_positive": probability >= threshold,
        "operating_threshold": threshold,
        "model_version": status["model_version"],
    }
