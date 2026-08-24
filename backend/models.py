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
    is_caregiver = Column(Boolean, default=False)
    apoe_e4_provenance = Column(String, default="self_reported")
    mri_provenance = Column(String, default="self_reported")
    created_at = Column(DateTime, default=datetime.utcnow)

    scores = relationship("CogniScore", back_populates="user")
    signals = relationship("PassiveSignal", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

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
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    tool_name = Column(String)
    input_summary = Column(Text)
    output_summary = Column(Text)
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
