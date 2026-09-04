from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List, Dict, Any

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    age: int
    gender: Optional[str] = "Not specified"
    role: Optional[str] = "patient"
    is_caregiver: bool = False
    apoe_e4_provenance: Optional[str] = "self_reported"
    mri_provenance: Optional[str] = "self_reported"

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleLoginRequest(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = "patient"
    credential: Optional[str] = None
    mode: Optional[str] = "login"  # "register" or "login"
    password: Optional[str] = None

class ConsentRequest(BaseModel):
    consent_granted: bool = True

class CaregiverInviteRequest(BaseModel):
    patient_email: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    age: int
    gender: Optional[str] = "Not specified"
    role: str = "patient"
    is_caregiver: bool
    patient_id: Optional[int] = None
    clinician_id: Optional[int] = None
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
    metadata_json: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

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
    fusion_details: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[UserOut] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

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

class AgentOrchestrationRequest(BaseModel):
    voice_features: Optional[Dict[str, Any]] = None
    voice_transcript: Optional[str] = ""
    mri_filename: Optional[str] = "mri_scan.dcm"

class AgentOrchestrationResponse(BaseModel):
    pipeline_state: str
    session_id: Optional[str] = None
    tier1_fusion: Optional[Dict[str, Any]] = None
    cognitive_analysis: Optional[Dict[str, Any]] = None
    behavioral_analysis: Optional[Dict[str, Any]] = None
    voice_analysis: Optional[Dict[str, Any]] = None
    longitudinal_trend: Optional[Dict[str, Any]] = None
    tier2_ml: Optional[Dict[str, Any]] = None
    tier3_mri: Optional[Dict[str, Any]] = None
    clinical_synthesis: Optional[Dict[str, Any]] = None
    safety_review: Optional[Dict[str, Any]] = None
    sanitized_narrative: Optional[str] = None
    guidelines: Optional[List[Dict[str, Any]]] = None
    message: Optional[str] = None

class ClinicianOut(BaseModel):
    id: int
    name: str
    email: str
    age: Optional[int] = None
    gender: Optional[str] = None
    role: str = "clinician"
    specialty: Optional[str] = "Cognitive Neurologist & Supervisor"

    class Config:
        from_attributes = True

class AppointmentCreate(BaseModel):
    patient_id: Optional[int] = None
    clinician_id: Optional[int] = None
    patient_name: Optional[str] = None
    appointment_type: str = "Neurological Evaluation"
    scheduled_time: str
    notes: Optional[str] = None
    location: Optional[str] = "Memory & Cognitive Health Clinic - Suite 402"

class AppointmentStatusUpdate(BaseModel):
    status: str  # "Accepted", "Due", "Finished", "Cancelled", "Rejected", "Pending"

class AppointmentOut(BaseModel):
    id: int
    user_id: int
    patient_id: Optional[int] = None
    clinician_id: Optional[int] = None
    patient_name: str
    clinician_name: Optional[str] = None
    appointment_type: str
    scheduled_time: str
    status: str
    notes: Optional[str] = None
    location: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    severity: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SearchResultItem(BaseModel):
    id: str
    title: str
    subtitle: str
    category: str  # "patient", "test", "biomarker", "report", "module"
    link: str
    badge: Optional[str] = None

class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]

class EvidenceGraphResponse(BaseModel):
    user_id: int
    patient_name: str
    cogni_score: float
    risk_level: str
    is_deviating: bool
    nodes: Dict[str, Any]
    edges: List[Dict[str, Any]]
    dossier: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str
    guardrail_passed: bool = True
    sources_used: List[str] = []
    timestamp: str

class PatternProbabilityItem(BaseModel):
    pattern_key: str
    pattern_name: str
    probability: float
    percentage: str

class PatternSignalItem(BaseModel):
    feature_key: str
    signal_name: str
    domain: str
    value: str
    shap_attribution: float
    impact: str

class DementiaPatternProfileResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    status: str
    patient_id: int
    patient_name: Optional[str] = "Patient"
    most_consistent_pattern: Optional[str] = None
    confidence_score: Optional[float] = None
    pattern_probabilities: Optional[List[PatternProbabilityItem]] = None
    key_contributing_signals: Optional[List[PatternSignalItem]] = None
    model_version: Optional[str] = "2026.1-dementia-pattern-v1"
    evaluated_features_count: Optional[int] = 20
    timestamp: Optional[str] = None
    message: Optional[str] = None
    recommended_action: Optional[str] = None
    disclaimer: str = (
        "This is a model-estimated pattern profile derived from Level 1 cognitive/behavioral telemetry "
        "and Level 2 clinical biomarkers to support clinician review. It is not an autonomous medical diagnosis."
    )

class UserProfileUpdate(BaseModel):
    name: str
    email: str
    age: Optional[int] = None
    gender: Optional[str] = "Not specified"
    current_password: str
    new_password: Optional[str] = None
    verification_code: Optional[str] = None


