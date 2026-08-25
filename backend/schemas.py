from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List, Dict, Any

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    age: int
    gender: Optional[str] = "Not specified"
    is_caregiver: bool = False
    apoe_e4_provenance: Optional[str] = "self_reported"
    mri_provenance: Optional[str] = "self_reported"

class UserLogin(BaseModel):
    email: str
    password: str

class ConsentRequest(BaseModel):
    consent_granted: bool = True

class CaregiverInviteRequest(BaseModel):
    patient_email: EmailStr

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    age: int
    gender: Optional[str] = "Not specified"
    is_caregiver: bool
    consent_granted: bool = False
    consent_granted_at: Optional[datetime] = None
    baseline_status: str = "collecting"
    level2_status: str = "not_collected"
    combined_risk_score: Optional[float] = None
    apoe_e4_provenance: Optional[str] = "self_reported"
    mri_provenance: Optional[str] = "self_reported"
    created_at: datetime

    class Config:
        from_attributes = True

class PassiveSignalCreate(BaseModel):
    typing_speed: float
    backspace_rate: float
    scroll_hesitation: float
    session_duration: float

class TestResultCreate(BaseModel):
    test_type: str
    score: float
    duration_seconds: float

class CogniScoreOut(BaseModel):
    id: int
    user_id: int
    score: float
    active_score: float
    passive_score: float
    risk_level: str
    ewma_score: Optional[float] = 0.0
    cusum_value: Optional[float] = 0.0
    baseline_mean: Optional[float] = 0.0
    is_deviating: Optional[bool] = False
    combined_risk_score: Optional[float] = None
    baseline_status: Optional[str] = "collecting"
    level2_status: Optional[str] = "not_collected"
    trigger_level2: Optional[bool] = False
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class LanguageDetectRequest(BaseModel):
    text: Optional[str] = None
    audio_sample_id: Optional[str] = None

class LanguageDetectResponse(BaseModel):
    detected_language: str
    language_code: str
    confidence: float
    whisper_mode: str

class ReferralRequest(BaseModel):
    risk_level: str
    is_deviating: bool = False
    active_score: float = 50.0
    shap_top_features: Optional[List[Dict[str, Any]]] = None

class ReferralResponse(BaseModel):
    action: str
    urgency: str
    timeframe: str
    recommended_specialist: str
    clinical_rationale: str

class ClinicalReportRequest(BaseModel):
    user_id: Optional[int] = None
    patient_name: Optional[str] = "Patient"
    age: Optional[int] = 65
    cogni_score: float = 50.0
    risk_level: str = "Moderate"
    is_deviating: bool = False
    combined_risk_score: Optional[float] = None
    shap_features: Optional[List[Dict[str, Any]]] = None
    mri_result: Optional[Dict[str, Any]] = None

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    tool_name: str
    input_summary: Optional[str] = None
    output_summary: Optional[str] = None
    pipeline_state: Optional[str] = None
    guardrail_passed: bool = True
    created_at: datetime

    class Config:
        from_attributes = True
