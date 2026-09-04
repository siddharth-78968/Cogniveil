from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    age = Column(Integer)
    gender = Column(String, default="Not specified")
    role = Column(String, default="patient")  # "patient" | "clinician"
    is_caregiver = Column(Boolean, default=False)
    consent_granted = Column(Boolean, default=False)
    consent_granted_at = Column(DateTime, nullable=True)
    baseline_status = Column(String, default="collecting")  # "collecting" | "established"
    level2_status = Column(String, default="not_collected")  # "not_collected" | "triggered" | "completed"
    level2_data = Column(Text, nullable=True)
    combined_risk_score = Column(Float, nullable=True)
    apoe_e4_provenance = Column(String, default="self_reported")
    mri_provenance = Column(String, default="self_reported")
    created_at = Column(DateTime, default=datetime.utcnow)

    scores = relationship("CogniScore", back_populates="user")
    signals = relationship("PassiveSignal", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    clinical_reports = relationship("ClinicalReport", back_populates="user")

class CogniScore(Base):
    __tablename__ = "cogniscores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Float)
    active_score = Column(Float)
    passive_score = Column(Float)
    risk_level = Column(String)
    ewma_score = Column(Float, default=0.0)
    cusum_value = Column(Float, default=0.0)
    baseline_mean = Column(Float, default=0.0)
    is_deviating = Column(Boolean, default=False)
    combined_risk_score = Column(Float, nullable=True)
    baseline_status = Column(String, default="collecting")
    level2_status = Column(String, default="not_collected")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="scores")

class PassiveSignal(Base):
    __tablename__ = "passive_signals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    typing_speed = Column(Float)
    backspace_rate = Column(Float)
    scroll_hesitation = Column(Float)
    session_duration = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="signals")

class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    test_type = Column(String)
    score = Column(Float)
    duration_seconds = Column(Float)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    tool_name = Column(String)
    input_summary = Column(Text)
    output_summary = Column(Text)
    pipeline_state = Column(String, nullable=True)
    guardrail_passed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")

class CaregiverAccess(Base):
    __tablename__ = "caregiver_access"
    __table_args__ = (UniqueConstraint("caregiver_id", "patient_id", name="uq_caregiver_patient"),)

    id = Column(Integer, primary_key=True, index=True)
    caregiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)

class ClinicalReport(Base):
    __tablename__ = "clinical_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cogni_score = Column(Float)
    risk_level = Column(String)
    is_deviating = Column(Boolean, default=False)
    combined_risk_score = Column(Float, nullable=True)
    narrative = Column(Text)
    referral_action = Column(String, nullable=True)
    recommended_specialist = Column(String, nullable=True)
    urgency = Column(String, nullable=True)
    guardrail_passed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="clinical_reports")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # patient user account
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=True) # explicit patient foreign key
    clinician_id = Column(Integer, ForeignKey("users.id"), nullable=True) # attending clinician foreign key
    patient_name = Column(String, nullable=False)
    clinician_name = Column(String, nullable=True) # derived dynamically from authenticated clinician or selected clinician
    appointment_type = Column(String, default="Neurological Evaluation")  # "Cognitive Battery", "Acoustic Fluency", "Tier 2 Review", "MRI Review", "Neurological Evaluation"
    scheduled_time = Column(String, nullable=False)  # e.g. "Today - 10:00 AM", "Tomorrow - 2:00 PM", "2026-09-02 14:00"
    status = Column(String, default="Pending")  # "Pending", "Accepted", "Due", "Finished", "Cancelled", "Rejected"
    notes = Column(Text, nullable=True)
    location = Column(String, default="Memory & Cognitive Health Clinic - Suite 402")
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")  # "alert", "reminder", "success", "info"
    severity = Column(String, default="normal")  # "critical", "warning", "normal"
    link = Column(String, nullable=True)  # e.g. "/dashboard", "/tests", "/appointments"
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_uuid = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Patient ID
    clinician_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Initiating Clinician ID
    status = Column(String, default="NOT_STARTED", nullable=False)  # NOT_STARTED, IN_PROGRESS, PAUSED, COMPLETED, CANCELLED
    current_test_index = Column(Integer, default=0, nullable=False)
    battery_config_json = Column(Text, nullable=True)  # JSON list of test IDs in order
    results_summary_json = Column(Text, nullable=True)  # JSON mapping of test_type -> {score, status, duration, ...}
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


