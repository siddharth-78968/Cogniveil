from catboost import CatBoostClassifier, Pool
import joblib
import pandas as pd
import shap
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "catboost_alzheimers_model.cbm"
METADATA_PATH = BASE_DIR / "catboost_metadata.pkl"

# Lazy-loaded CatBoost model and calibration metadata
_csv_model = None
_metadata = None
_explainer = None


def get_csv_model() -> CatBoostClassifier:
    global _csv_model
    if _csv_model is None:
        m = CatBoostClassifier()
        if MODEL_PATH.exists():
            m.load_model(str(MODEL_PATH))
        _csv_model = m
    return _csv_model


def get_metadata() -> Dict[str, Any]:
    global _metadata
    if _metadata is None:
        if METADATA_PATH.exists():
            try:
                _metadata = joblib.load(str(METADATA_PATH))
            except Exception:
                _metadata = {}
        else:
            _metadata = {}
    return _metadata


def get_explainer():
    global _explainer
    if _explainer is None:
        try:
            m = get_csv_model()
            _explainer = shap.TreeExplainer(m)
        except Exception as e:
            print(f"[Predictor] TreeExplainer deferred/failed: {e}")
            _explainer = None
    return _explainer


class _LazyCsvModel:
    def __getattr__(self, name):
        return getattr(get_csv_model(), name)

    def __bool__(self):
        return True


class _LazyExplainer:
    def __getattr__(self, name):
        exp = get_explainer()
        if exp is None:
            raise AttributeError("Explainer not available")
        return getattr(exp, name)

    def __bool__(self):
        return True


csv_model = _LazyCsvModel()
explainer = _LazyExplainer()

threshold: float = 0.60
MODEL_VERSION: str = "2026.1-catboost-v2"

MODEL_COLUMNS = [
    'Country', 'Age', 'Gender', 'Education Level', 'BMI',
    'Physical Activity Level', 'Smoking Status', 'Alcohol Consumption',
    'Diabetes', 'Hypertension', 'Cholesterol Level',
    "Family History of Alzheimer's", 'Cognitive Test Score',
    'Depression Level', 'Sleep Quality', 'Dietary Habits',
    'Air Pollution Exposure', 'Employment Status', 'Marital Status',
    'Genetic Risk Factor (APOE-4 allele)', 'Social Engagement Level',
    'Income Level', 'Stress Levels', 'Urban vs Rural Living'
]

CAT_INDICES = [0, 2, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
CAT_COLUMNS = [MODEL_COLUMNS[i] for i in CAT_INDICES]
NUM_COLUMNS = [col for col in MODEL_COLUMNS if col not in CAT_COLUMNS]

FRIENDLY_NAMES = {
    'Country': 'Country',
    'Age': 'Age',
    'Gender': 'Gender',
    'Education Level': 'Education Level',
    'BMI': 'BMI',
    'Physical Activity Level': 'Physical Activity',
    'Smoking Status': 'Smoking Status',
    'Alcohol Consumption': 'Alcohol Consumption',
    'Diabetes': 'Diabetes',
    'Hypertension': 'Hypertension',
    'Cholesterol Level': 'Cholesterol Level',
    "Family History of Alzheimer's": "Family History",
    'Cognitive Test Score': 'Cognitive Score',
    'Depression Level': 'Depression Level',
    'Sleep Quality': 'Sleep Quality',
    'Dietary Habits': 'Dietary Habits',
    'Air Pollution Exposure': 'Air Pollution',
    'Employment Status': 'Employment Status',
    'Marital Status': 'Marital Status',
    'Genetic Risk Factor (APOE-4 allele)': 'APOE-e4 Gene',
    'Social Engagement Level': 'Social Engagement',
    'Income Level': 'Income Level',
    'Stress Levels': 'Stress Levels',
    'Urban vs Rural Living': 'Urban vs Rural',
}

FEATURE_METADATA = {
    'Physical Activity Level': {
        'category': 'Modifiable Lifestyle',
        'is_modifiable': True,
        'recommendation': 'Increase aerobic physical activity (target 150+ min/week of moderate exercise to enhance neurogenesis and cerebral perfusion).'
    },
    'Smoking Status': {
        'category': 'Modifiable Lifestyle',
        'is_modifiable': True,
        'recommendation': 'Initiate smoking cessation support. Active smoking significantly elevates vascular damage and oxidative neurodegeneration.'
    },
    'Alcohol Consumption': {
        'category': 'Modifiable Lifestyle',
        'is_modifiable': True,
        'recommendation': 'Minimize or eliminate alcohol intake to prevent neurotoxic hippocampal atrophy and sleep architecture fragmentation.'
    },
    'Dietary Habits': {
        'category': 'Modifiable Lifestyle',
        'is_modifiable': True,
        'recommendation': 'Adopt a Mediterranean-DASH Intervention for Neurodegenerative Delay (MIND) diet rich in berries, leafy greens, and omega-3s.'
    },
    'Sleep Quality': {
        'category': 'Modifiable Lifestyle',
        'is_modifiable': True,
        'recommendation': 'Optimize sleep hygiene and screen for obstructive sleep apnea to support nocturnal glymphatic amyloid clearance.'
    },
    'Stress Levels': {
        'category': 'Modifiable Lifestyle',
        'is_modifiable': True,
        'recommendation': 'Incorporate structured stress reduction (mindfulness, CBT, breathing protocols) to mitigate cortisol-induced hippocampal toxicity.'
    },
    'Social Engagement Level': {
        'category': 'Modifiable Lifestyle',
        'is_modifiable': True,
        'recommendation': 'Increase meaningful social interactions and community group participation to reinforce cognitive reserve networks.'
    },
    'BMI': {
        'category': 'Cardiovascular & Metabolic',
        'is_modifiable': True,
        'recommendation': 'Maintain a healthy target BMI (18.5–24.9) through tailored nutritional guidance and metabolic conditioning.'
    },
    'Hypertension': {
        'category': 'Cardiovascular & Metabolic',
        'is_modifiable': True,
        'recommendation': 'Achieve rigorous systolic blood pressure control (<130 mmHg) to prevent cerebral small vessel disease and microbleeds.'
    },
    'Diabetes': {
        'category': 'Cardiovascular & Metabolic',
        'is_modifiable': True,
        'recommendation': 'Maintain strict glycemic control (HbA1c monitoring) to counteract cerebral insulin resistance and neuroinflammation.'
    },
    'Cholesterol Level': {
        'category': 'Cardiovascular & Metabolic',
        'is_modifiable': True,
        'recommendation': 'Manage lipid profiles through dietary intervention or physician-guided lipid-lowering therapy to prevent atherosclerosis.'
    },
    'Depression Level': {
        'category': 'Neuropsychiatric',
        'is_modifiable': True,
        'recommendation': 'Seek clinical evaluation for depressive symptoms; psychotherapy and affective stabilization significantly restore cognitive focus.'
    },
    'Air Pollution Exposure': {
        'category': 'Environmental',
        'is_modifiable': True,
        'recommendation': 'Reduce exposure to airborne fine particulates (PM2.5) using HEPA air filtration and avoiding heavy-traffic outdoor exertion.'
    },
    'Cognitive Test Score': {
        'category': 'Clinical Biomarker',
        'is_modifiable': False,
        'recommendation': 'Engage in daily multi-domain computerized cognitive stimulation (working memory, processing speed, spatial recall).'
    },
    'Age': {
        'category': 'Non-Modifiable Demographic',
        'is_modifiable': False,
        'recommendation': 'Prioritize aggressive control of all modifiable lifestyle and vascular factors to build cognitive resilience.'
    },
    'Gender': {
        'category': 'Non-Modifiable Demographic',
        'is_modifiable': False,
        'recommendation': None
    },
    "Family History of Alzheimer's": {
        'category': 'Non-Modifiable Genetic',
        'is_modifiable': False,
        'recommendation': 'Early routine monitoring and lifestyle optimization can significantly mitigate hereditary vulnerability.'
    },
    'Genetic Risk Factor (APOE-4 allele)': {
        'category': 'Non-Modifiable Genetic',
        'is_modifiable': False,
        'recommendation': 'APOE-e4 carriers benefit substantially from proactive lipid management, antioxidant-rich diet, and aerobic exercise.'
    },
    'Education Level': {
        'category': 'Socioeconomic & Cognitive Reserve',
        'is_modifiable': False,
        'recommendation': 'Engage in continuous lifelong learning (new languages, instruments, complex tasks) to build neuroplastic reserve.'
    },
    'Employment Status': {
        'category': 'Socioeconomic',
        'is_modifiable': False,
        'recommendation': None
    },
    'Marital Status': {
        'category': 'Socioeconomic',
        'is_modifiable': False,
        'recommendation': None
    },
    'Income Level': {
        'category': 'Socioeconomic',
        'is_modifiable': False,
        'recommendation': None
    },
    'Country': {
        'category': 'Demographic',
        'is_modifiable': False,
        'recommendation': None
    },
    'Urban vs Rural Living': {
        'category': 'Environmental',
        'is_modifiable': False,
        'recommendation': None
    },
}

# Note: explainer is lazy-initialized on demand via _LazyExplainer


def _normalize_binary(val: Any, default: str = "No") -> str:
    """Normalize boolean/string inputs to Yes/No or Positive/Negative."""
    if val is None:
        return default
    if isinstance(val, bool):
        return "Yes" if val else "No"
    s = str(val).strip()
    if s.lower() in ("1", "true", "yes", "y", "positive"):
        return "Yes" if default in ("Yes", "No") else "Positive"
    if s.lower() in ("0", "false", "no", "n", "negative"):
        return "No" if default in ("Yes", "No") else "Negative"
    return s.capitalize() if s else default


def normalize_inputs(patient_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Map flexible patient payload into model schema with fallback imputation."""
    p = {k.lower().replace(" ", "_").replace("-", "_"): v for k, v in patient_dict.items()}

    def get_val(*keys, default=None):
        for k in keys:
            k_clean = k.lower().replace(" ", "_").replace("-", "_")
            if k_clean in p and p[k_clean] is not None and p[k_clean] != "":
                return p[k_clean]
        return default

    # Extract numerical features
    age_raw = get_val("age", default=65)
    try:
        age_val = float(age_raw)
    except (ValueError, TypeError):
        age_val = 65.0

    bmi_raw = get_val("bmi", default=25.0)
    try:
        bmi_val = float(bmi_raw)
    except (ValueError, TypeError):
        bmi_val = 25.0

    edu_raw = get_val("education_level", "education", default=12)
    try:
        edu_val = float(edu_raw)
    except (ValueError, TypeError):
        edu_val = 12.0

    cog_raw = get_val("cognitive_test_score", "cognitivescore", "cognitive_score", default=25)
    try:
        cog_val = float(cog_raw)
    except (ValueError, TypeError):
        cog_val = 25.0

    # Extract & normalize categoricals
    country = str(get_val("country", default="India"))
    gender = str(get_val("gender", default="Male")).capitalize()
    if gender not in ("Male", "Female", "Other"):
        gender = "Male"

    phys_act = str(get_val("physical_activity_level", "physical_activity", default="Moderate")).capitalize()
    if phys_act not in ("Sedentary", "Light", "Moderate", "Active"):
        phys_act = "Moderate"

    smoking = str(get_val("smoking_status", "smoking", default="Never")).capitalize()
    if smoking not in ("Never", "Former", "Current"):
        smoking = "Never"

    alcohol = str(get_val("alcohol_consumption", "alcohol", default="Never")).capitalize()
    if alcohol not in ("Never", "Rarely", "Moderate", "Heavy"):
        alcohol = "Never"

    diabetes = _normalize_binary(get_val("diabetes", "diabetic"), default="No")
    hypertension = _normalize_binary(get_val("hypertension"), default="No")

    cholesterol = str(get_val("cholesterol_level", "cholesterol", default="Normal")).capitalize()
    if cholesterol not in ("Normal", "High", "Low"):
        cholesterol = "Normal"

    fam_hist = _normalize_binary(get_val("family_history_of_alzheimers", "family_history"), default="No")

    apoe = str(get_val("genetic_risk_factor_(apoe_4_allele)", "genetic_risk_factor", "apoe_e4", "apoe", default="Negative")).capitalize()
    if apoe in ("Yes", "1", "True", "Positive"):
        apoe = "Positive"
    else:
        apoe = "Negative"

    depression = str(get_val("depression_level", "depression_status", "depression", default="No")).capitalize()
    if depression not in ("No", "Mild", "Moderate", "Severe"):
        depression = "No"

    sleep = str(get_val("sleep_quality", "sleep", default="Good")).capitalize()
    if sleep not in ("Good", "Fair", "Poor"):
        sleep = "Good"

    diet = str(get_val("dietary_habits", "nutrition_diet", "diet", default="Balanced")).capitalize()
    if diet not in ("Balanced", "Mediterranean", "High Fat", "Vegetarian"):
        diet = "Balanced"

    pollution = str(get_val("air_pollution_exposure", "air_pollution", "airpollution", default="Low")).capitalize()
    if pollution not in ("Low", "Moderate", "High"):
        pollution = "Low"

    employment = str(get_val("employment_status", "employment", default="Retired")).capitalize()
    if employment not in ("Employed", "Retired", "Unemployed", "Self-employed"):
        employment = "Retired"

    marital = str(get_val("marital_status", "marital", default="Married")).capitalize()
    if marital not in ("Married", "Single", "Divorced", "Widowed"):
        marital = "Married"

    social = str(get_val("social_engagement_level", "social_engagement", default="Moderate")).capitalize()
    if social not in ("Low", "Moderate", "High"):
        social = "Moderate"

    income = str(get_val("income_level", "income", default="Middle")).capitalize()
    if income not in ("Low", "Middle", "High"):
        income = "Middle"

    stress = str(get_val("stress_levels", "stress_level", "stress", default="Low")).capitalize()
    if stress not in ("Low", "Moderate", "High"):
        stress = "Low"

    urban_rural = str(get_val("urban_vs_rural_living", "urban_rural", "urbanrural", default="Urban")).capitalize()
    if urban_rural not in ("Urban", "Rural"):
        urban_rural = "Urban"

    return {
        'Country': country,
        'Age': age_val,
        'Gender': gender,
        'Education Level': edu_val,
        'BMI': bmi_val,
        'Physical Activity Level': phys_act,
        'Smoking Status': smoking,
        'Alcohol Consumption': alcohol,
        'Diabetes': diabetes,
        'Hypertension': hypertension,
        'Cholesterol Level': cholesterol,
        "Family History of Alzheimer's": fam_hist,
        'Cognitive Test Score': cog_val,
        'Depression Level': depression,
        'Sleep Quality': sleep,
        'Dietary Habits': diet,
        'Air Pollution Exposure': pollution,
        'Employment Status': employment,
        'Marital Status': marital,
        'Genetic Risk Factor (APOE-4 allele)': apoe,
        'Social Engagement Level': social,
        'Income Level': income,
        'Stress Levels': stress,
        'Urban vs Rural Living': urban_rural,
    }


def predict_level2(patient_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes Tier 2 CatBoost model and generates comprehensive SHAP explainability.
    
    Returns:
        - probability: float (calibrated dementia risk score 0.0 - 1.0)
        - prediction: int (0 or 1 based on optimal operating threshold)
        - risk_level: str ("Low", "Moderate", "High")
        - confidence_score: float (confidence margin)
        - operating_threshold: float (model threshold, e.g. 0.60)
        - model_version: str
        - shap_features: List of top 8 feature drivers (backward compatible)
        - modifiable_drivers: List of modifiable factors with clinical recommendations
        - non_modifiable_drivers: List of genetic/demographic baseline drivers
        - risk_summary: Actionable clinical narrative
    """
    mapped = normalize_inputs(patient_dict)
    df = pd.DataFrame([mapped])[MODEL_COLUMNS]

    for col in NUM_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    for col in CAT_COLUMNS:
        df[col] = df[col].astype(str)

    pool = Pool(data=df, cat_features=CAT_INDICES)
    prob = float(csv_model.predict_proba(pool)[:, 1][0])
    pred = int(prob >= threshold)

    # Risk Stratification based on clinical thresholds
    if prob < 0.35:
        risk = "Low"
    elif prob < threshold:
        risk = "Moderate"
    else:
        risk = "High"

    # Confidence calculation (distance from decision boundary)
    certainty = abs(prob - threshold) / max(threshold, 1.0 - threshold)
    confidence_score = round(min(1.0, 0.60 + 0.40 * certainty), 3)

    # SHAP TreeExplainer calculation
    shap_values = explainer.shap_values(df)
    if isinstance(shap_values, list):
        sv = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
    elif len(shap_values.shape) > 1:
        sv = shap_values[0]
    else:
        sv = shap_values

    # Base value (model expected log-odds)
    base_val = float(explainer.expected_value[1] if isinstance(explainer.expected_value, (list, np.ndarray)) else explainer.expected_value)

    # Parse all feature contributions
    all_features = []
    total_positive_shap = 0.0
    total_negative_shap = 0.0

    for i, col in enumerate(MODEL_COLUMNS):
        val = float(sv[i])
        meta = FEATURE_METADATA.get(col, {'category': 'Other', 'is_modifiable': False, 'recommendation': None})
        friendly = FRIENDLY_NAMES.get(col, col)
        input_str = str(df[col].iloc[0])

        if val > 0:
            total_positive_shap += val
        else:
            total_negative_shap += abs(val)

        all_features.append({
            "feature": friendly,
            "raw_feature": col,
            "value": round(val, 4),
            "input": input_str,
            "category": meta["category"],
            "is_modifiable": meta["is_modifiable"],
            "impact": "increases_risk" if val > 0 else "reduces_risk",
            "recommendation": meta["recommendation"] if (val > 0 and meta["recommendation"]) else None
        })

    # Sort all features by magnitude of SHAP attribution
    all_features.sort(key=lambda x: abs(x["value"]), reverse=True)

    # Calculate relative importance percentage for top drivers
    sum_abs = sum(abs(f["value"]) for f in all_features) or 1.0
    for f in all_features:
        f["relative_importance_pct"] = round((abs(f["value"]) / sum_abs) * 100, 1)

    # Backward-compatible top 8 features for UI
    top_features = all_features[:8]

    # Partition into modifiable vs non-modifiable
    modifiable_drivers = [f for f in all_features if f["is_modifiable"] and f["value"] > 0][:5]
    non_modifiable_drivers = [f for f in all_features if not f["is_modifiable"]][:4]

    # Generate structured summary narrative
    top_driver_names = [f["feature"] for f in top_features[:3] if f["value"] > 0]
    protective_names = [f["feature"] for f in top_features if f["value"] < 0][:2]

    narrative_parts = []
    if top_driver_names:
        narrative_parts.append(f"Primary risk drivers: {', '.join(top_driver_names)}.")
    if protective_names:
        narrative_parts.append(f"Protective factors observed: {', '.join(protective_names)}.")
    if modifiable_drivers:
        narrative_parts.append(f"Targeted lifestyle interventions on {modifiable_drivers[0]['feature']} can notably reduce long-term risk progression.")

    risk_summary = " ".join(narrative_parts) if narrative_parts else "Balanced risk profile with stable baseline indicators."

    return {
        "probability": round(prob, 3),
        "prediction": pred,
        "risk_level": risk,
        "confidence_score": confidence_score,
        "operating_threshold": threshold,
        "model_version": MODEL_VERSION,
        "base_value": round(base_val, 4),
        "shap_features": top_features,
        "modifiable_drivers": modifiable_drivers,
        "non_modifiable_drivers": non_modifiable_drivers,
        "risk_summary": risk_summary,
        "total_risk_amplification": round(total_positive_shap, 3),
        "total_risk_mitigation": round(total_negative_shap, 3)
    }