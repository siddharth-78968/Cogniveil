from catboost import CatBoostClassifier, Pool
import joblib
import pandas as pd

csv_model = CatBoostClassifier()
csv_model.load_model("catboost_alzheimers_model.cbm")
metadata = joblib.load("catboost_metadata.pkl")
threshold = metadata["final_threshold"]

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

def predict_level2(patient_dict):
    mapped = {
        'Country': patient_dict.get('Country', 'India'),
        'Age': patient_dict.get('Age', 65),
        'Gender': patient_dict.get('Gender', 'Male'),
        'Education Level': patient_dict.get('Education_Level', 12),
        'BMI': patient_dict.get('BMI', 25),
        'Physical Activity Level': patient_dict.get('Physical_Activity', 'Moderate'),
        'Smoking Status': patient_dict.get('Smoking_Status', 'Never'),
        'Alcohol Consumption': patient_dict.get('AlcoholConsumption', 'Never'),
        'Diabetes': patient_dict.get('Diabetic', 'No'),
        'Hypertension': patient_dict.get('Hypertension', 'No'),
        'Cholesterol Level': patient_dict.get('CholesterolLevel', 'Normal'),
        "Family History of Alzheimer's": patient_dict.get('Family_History', 'No'),
        'Cognitive Test Score': patient_dict.get('CognitiveScore', 25),
        'Depression Level': patient_dict.get('Depression_Status', 'No'),
        'Sleep Quality': patient_dict.get('Sleep_Quality', 'Good'),
        'Dietary Habits': patient_dict.get('Nutrition_Diet', 'Balanced'),
        'Air Pollution Exposure': patient_dict.get('AirPollution', 'Low'),
        'Employment Status': patient_dict.get('EmploymentStatus', 'Retired'),
        'Marital Status': patient_dict.get('MaritalStatus', 'Married'),
        'Genetic Risk Factor (APOE-4 allele)': patient_dict.get('APOE_e4', 'Negative'),
        'Social Engagement Level': patient_dict.get('SocialEngagement', 'Moderate'),
        'Income Level': patient_dict.get('IncomeLevel', 'Middle'),
        'Stress Levels': patient_dict.get('StressLevels', 'Low'),
        'Urban vs Rural Living': patient_dict.get('UrbanRural', 'Urban'),
    }

    df = pd.DataFrame([mapped])
    df = df[MODEL_COLUMNS]

    for col in NUM_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    for col in CAT_COLUMNS:
        df[col] = df[col].astype(str)

    pool = Pool(data=df, cat_features=CAT_INDICES)
    prob = csv_model.predict_proba(pool)[:, 1][0]
    pred = int(prob >= threshold)

    if prob < 0.35:
        risk = "Low"
    elif prob < 0.65:
        risk = "Moderate"
    else:
        risk = "High"

    return {
        "probability": round(float(prob), 3),
        "prediction": pred,
        "risk_level": risk
    }