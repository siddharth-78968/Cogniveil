from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    age: int
    is_caregiver: bool = False

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    age: int
    is_caregiver: bool
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
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None