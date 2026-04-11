from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import timedelta
import models, schemas, auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CogniVeil API")

@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return JSONResponse(content={}, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    })

@app.get("/")
def root():
    return {"message": "CogniVeil API is running"}

@app.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = auth.get_password_hash(user.password)
    new_user = models.User(name=user.name, email=user.email, hashed_password=hashed, age=user.age, is_caregiver=user.is_caregiver)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_access_token(data={"sub": db_user.email}, expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer"}

@app.post("/signals")
def save_signal(signal: schemas.PassiveSignalCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_signal = models.PassiveSignal(user_id=current_user.id, typing_speed=signal.typing_speed, backspace_rate=signal.backspace_rate, scroll_hesitation=signal.scroll_hesitation, session_duration=signal.session_duration)
    db.add(new_signal)
    db.commit()
    return {"message": "Signal saved"}

@app.post("/tests")
def save_test(result: schemas.TestResultCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_result = models.TestResult(user_id=current_user.id, test_type=result.test_type, score=result.score, duration_seconds=result.duration_seconds)
    db.add(new_result)
    db.commit()
    return {"message": "Test result saved"}

@app.get("/score", response_model=schemas.CogniScoreOut)
def get_score(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    score = db.query(models.CogniScore).filter(models.CogniScore.user_id == current_user.id).order_by(models.CogniScore.created_at.desc()).first()
    if not score:
        raise HTTPException(status_code=404, detail="No score found yet")
    return score

@app.get("/scores/history")
def get_score_history(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    scores = db.query(models.CogniScore).filter(models.CogniScore.user_id == current_user.id).order_by(models.CogniScore.created_at.asc()).all()
    return scores

@app.post("/score/calculate")
def calculate_score(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    tests = db.query(models.TestResult).filter(models.TestResult.user_id == current_user.id).all()
    signals = db.query(models.PassiveSignal).filter(models.PassiveSignal.user_id == current_user.id).all()

    if not tests:
        active_score = 50.0
    else:
        active_score = sum(t.score for t in tests) / len(tests)

    if not signals:
        passive_score = 50.0
    else:
        avg_typing = sum(s.typing_speed for s in signals) / len(signals)
        avg_backspace = sum(s.backspace_rate for s in signals) / len(signals)
        passive_score = max(0, min(100, avg_typing - (avg_backspace * 10)))

    final_score = (active_score * 0.6) + (passive_score * 0.4)

    if final_score >= 75:
        risk = "Low"
    elif final_score >= 50:
        risk = "Moderate"
    else:
        risk = "High"

    new_score = models.CogniScore(user_id=current_user.id, score=round(final_score, 2), active_score=round(active_score, 2), passive_score=round(passive_score, 2), risk_level=risk)
    db.add(new_score)
    db.commit()
    db.refresh(new_score)
    return new_score