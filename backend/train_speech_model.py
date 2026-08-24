"""Train and evaluate CogniVeil's speech-risk model from approved feature data.

Usage:
  python train_speech_model.py --data data/approved_speech_features.csv --model-version 2026.1

The CSV must contain the five FEATURE_COLUMNS plus ``participant_id``, ``label``
(0/1), ``language``, ``dataset_name``, and ``consent_basis``. Raw audio is not
accepted by this script. Participant-group splits prevent sessions from the same
person appearing in both a training and validation fold.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, roc_auc_score
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from speech_model import FEATURE_COLUMNS, MODEL_DIR, METADATA_PATH, MODEL_PATH

REQUIRED_COLUMNS = set(FEATURE_COLUMNS + ["participant_id", "label", "language", "dataset_name", "consent_basis"])


def choose_threshold(y_true: np.ndarray, probabilities: np.ndarray, minimum_sensitivity: float) -> tuple[float, float, float]:
    candidates = np.linspace(0.05, 0.95, 91)
    best = None
    for threshold in candidates:
        tn, fp, fn, tp = confusion_matrix(y_true, probabilities >= threshold, labels=[0, 1]).ravel()
        sensitivity = tp / (tp + fn) if (tp + fn) else 0.0
        specificity = tn / (tn + fp) if (tn + fp) else 0.0
        candidate = (specificity, threshold, sensitivity)
        if sensitivity >= minimum_sensitivity and (best is None or candidate > best):
            best = candidate
    if best is None:
        raise ValueError(f"No threshold achieves the requested sensitivity of {minimum_sensitivity:.2f}.")
    specificity, threshold, sensitivity = best
    return float(threshold), float(sensitivity), float(specificity)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, type=Path)
    parser.add_argument("--model-version", required=True)
    parser.add_argument("--minimum-sensitivity", type=float, default=0.85)
    args = parser.parse_args()

    data = pd.read_csv(args.data)
    missing = REQUIRED_COLUMNS - set(data.columns)
    if missing:
        raise ValueError(f"Dataset missing required columns: {', '.join(sorted(missing))}")
    if not set(data["label"].dropna().unique()).issubset({0, 1}):
        raise ValueError("label must contain only 0 (reference) and 1 (screen-positive reference).")
    if data["participant_id"].nunique() < 10:
        raise ValueError("At least 10 distinct participants are required for grouped validation.")
    if not data["consent_basis"].astype(str).str.strip().replace("", np.nan).notna().all():
        raise ValueError("Every record must document an approved consent_basis.")

    x = data[FEATURE_COLUMNS]
    y = data["label"].astype(int).to_numpy()
    groups = data["participant_id"].astype(str).to_numpy()
    pipeline = Pipeline([
        ("features", ColumnTransformer([("numeric", Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
        ]), FEATURE_COLUMNS)])),
        ("classifier", LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42)),
    ])

    folds = min(5, data["participant_id"].nunique())
    splitter = StratifiedGroupKFold(n_splits=folds, shuffle=True, random_state=42)
    oof_probabilities = np.zeros(len(data))
    for train_idx, test_idx in splitter.split(x, y, groups):
        pipeline.fit(x.iloc[train_idx], y[train_idx])
        oof_probabilities[test_idx] = pipeline.predict_proba(x.iloc[test_idx])[:, 1]

    auc = float(roc_auc_score(y, oof_probabilities))
    threshold, sensitivity, specificity = choose_threshold(y, oof_probabilities, args.minimum_sensitivity)
    pipeline.fit(x, y)
    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    metadata = {
        "model_version": args.model_version,
        "algorithm": "median-imputed, scaled logistic regression",
        "feature_columns": FEATURE_COLUMNS,
        "operating_threshold": threshold,
        "cross_validation": f"{folds}-fold stratified group CV by participant_id",
        "validation": {"roc_auc": round(auc, 3), "sensitivity": round(sensitivity, 3), "specificity": round(specificity, 3)},
        "dataset": {"rows": int(len(data)), "participants": int(data['participant_id'].nunique()), "sources": sorted(data['dataset_name'].astype(str).unique().tolist()), "languages": sorted(data['language'].astype(str).unique().tolist())},
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "limitations": "Screening support only. Metrics are out-of-fold estimates and must be externally validated before clinical use.",
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
