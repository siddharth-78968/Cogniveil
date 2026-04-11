from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
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
    created_at = Column(DateTime, default=datetime.utcnow)

    scores = relationship("CogniScore", back_populates="user")
    signals = relationship("PassiveSignal", back_populates="user")

class CogniScore(Base):
    __tablename__ = "cogniscores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Float)
    active_score = Column(Float)
    passive_score = Column(Float)
    risk_level = Column(String)
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