from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, date
import models, schemas, auth
from database import engine, get_db
from predictor import predict_level2

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CogniVeil API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

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

@app.get("/signals/today")
def get_today_signals(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    today_start = datetime.combine(date.today(), datetime.min.time())
    count = db.query(models.PassiveSignal).filter(
        models.PassiveSignal.user_id == current_user.id,
        models.PassiveSignal.created_at >= today_start
    ).count()
    return {"count": count}

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

    final_score = (active_score * 0.8) + (passive_score * 0.2)

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

@app.post("/predict/level2")
def level2_predict(data: dict, current_user: models.User = Depends(auth.get_current_user)):
    try:
        result = predict_level2(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/setup-demo")
def setup_demo(db: Session = Depends(get_db)):
    import hashlib, random
    from datetime import datetime, date, timedelta
    
    def hash_pw(p): return hashlib.sha256(p.encode()).hexdigest()
    
    def make_user(name, email, age):
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing: return existing
        u = models.User(name=name, email=email, hashed_password=hash_pw("demo1234"), age=age, is_caregiver=False)
        db.add(u); db.commit(); db.refresh(u)
        return u
    
    def seed_scores(uid, base, trend):
        db.query(models.CogniScore).filter(models.CogniScore.user_id == uid).delete()
        db.query(models.TestResult).filter(models.TestResult.user_id == uid).delete()
        db.query(models.PassiveSignal).filter(models.PassiveSignal.user_id == uid).delete()
        db.commit()
        for i in range(14):
            d = datetime.now() - timedelta(days=(14-i))
            s = max(0, min(100, base + trend*i + random.uniform(-3,3)))
            db.add(models.CogniScore(user_id=uid, score=round(s,2), active_score=round(s+random.uniform(-5,5),2), passive_score=round(s+random.uniform(-5,5),2), risk_level="Low" if s>=75 else "Moderate" if s>=50 else "High", created_at=d))
        db.commit()
    
    def seed_tests(uid, base):
        for i in range(14):
            d = datetime.now() - timedelta(days=(14-i))
            for tt in ['pattern_recall','digit_span','word_recall','voice_journal']:
                db.add(models.TestResult(user_id=uid, test_type=tt, score=round(max(0,min(100,base+random.uniform(-8,8))),2), duration_seconds=60, created_at=d))
        db.commit()
    
    def seed_signals(uid, typing_base, backspace_base):
        for i in range(14):
            d = datetime.now() - timedelta(days=(14-i))
            db.add(models.PassiveSignal(user_id=uid, typing_speed=round(typing_base+random.uniform(-5,5),2), backspace_rate=round(backspace_base+random.uniform(-0.02,0.02),2), scroll_hesitation=round(random.uniform(0,3),2), session_duration=300, created_at=d))
        db.commit()
    
    p1 = make_user("Arjun Sharma", "arjun@demo.com", 68)
    seed_scores(p1.id, 85, 0.2)
    seed_tests(p1.id, 85)
    seed_signals(p1.id, 95, 0.01)
    
    p2 = make_user("Meena Krishnan", "meena@demo.com", 72)
    seed_scores(p2.id, 68, -1.2)
    seed_tests(p2.id, 60)
    seed_signals(p2.id, 60, 0.12)
    
    p3 = make_user("Rajan Pillai", "rajan@demo.com", 78)
    seed_scores(p3.id, 32, -0.8)
    seed_tests(p3.id, 30)
    seed_signals(p3.id, 35, 0.25)
    
    return {"status": "Demo users seeded successfully!"}