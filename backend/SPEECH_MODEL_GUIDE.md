# Speech-risk model: training and release checklist

CogniVeil will not label its voice score as a validated model until the files in
`backend/artifacts/` are created by the training script.

## Approved feature data

Use a CSV containing derived features only; do not place raw audio in the
repository. Required columns are:

```text
participant_id,label,language,dataset_name,consent_basis,
speech_activity_ratio,pause_rate_per_minute,mean_rms,
words_per_minute,vocabulary_richness
```

- `label`: 0/1 screening reference label defined in a study protocol.
- `participant_id`: stable pseudonymous ID. It prevents sessions from one
  person crossing training and validation boundaries.
- `dataset_name` and `consent_basis`: mandatory provenance fields.

## Train

```powershell
cd backend
python train_speech_model.py --data data/approved_speech_features.csv --model-version 2026.1
```

The script performs stratified group cross-validation, selects an operating
threshold that targets sensitivity, and writes:

- `artifacts/speech_risk_model.joblib`
- `artifacts/speech_risk_metadata.json`

## Release gate

Before enabling model-backed clinical screening, document and review:

1. Dataset licence, consent basis, demographic/language composition.
2. Independent external validation, not only cross-validation.
3. Sensitivity, specificity, ROC-AUC, calibration, and subgroup results.
4. Human clinical review of referral behaviour and false-positive burden.
5. The intended-use statement and screening-only disclaimer.

Until then, Voice Journal is explicitly labelled exploratory and uses measured
speech activity/pause features without claiming validated diagnostic accuracy.
