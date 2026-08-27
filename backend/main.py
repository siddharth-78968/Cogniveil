from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, date
from typing import List, Optional
import json
import os
import models, schemas, auth
from database import engine, get_db
import mcp_tools
import transcription

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CogniVeil API")

cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    allow_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    allow_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "CogniVeil API is running with 10 MCP tools and EWMA baseline deviation engine"}

@app.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = auth.get_password_hash(user.password)
    new_user = models.User(
        name=user.name, 
        email=user.email, 
        hashed_password=hashed, 
        age=user.age, 
        gender=user.gender or "Not specified",
        is_caregiver=user.is_caregiver,
        consent_granted=False,
        baseline_status="collecting",
        level2_status="not_collected",
        apoe_e4_provenance=user.apoe_e4_provenance or "self_reported",
        mri_provenance=user.mri_provenance or "self_reported"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    mcp_tools.log_audit(db, new_user.id, "register", {"email": user.email}, {"status": "registered"}, pipeline_state="consent_required")
    return new_user

@app.post("/auth/consent")
@app.post("/consent")
def grant_consent(req: schemas.ConsentRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    current_user.consent_granted = req.consent_granted
    current_user.consent_granted_at = datetime.utcnow() if req.consent_granted else None
    db.commit()
    db.refresh(current_user)
    pipeline_state = "baseline_period" if current_user.consent_granted else "consent_required"
    mcp_tools.log_audit(db, current_user.id, "grant_consent", {"consent_granted": req.consent_granted}, {"status": "updated"}, pipeline_state=pipeline_state)
    return {"message": "Consent status updated successfully", "consent_granted": current_user.consent_granted}

@app.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_access_token(data={"sub": db_user.email}, expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES))
    
    pipeline_state = "consent_required" if not db_user.consent_granted else ("baseline_period" if db_user.baseline_status == "collecting" else "full_pipeline_completed")
    mcp_tools.log_audit(db, db_user.id, "login", {"email": user.email}, {"status": "authenticated"}, pipeline_state=pipeline_state)
    return {"access_token": token, "token_type": "bearer"}

@app.get("/me", response_model=schemas.UserOut)
@app.get("/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

def require_caregiver(current_user: models.User):
    if not current_user.is_caregiver:
        raise HTTPException(status_code=403, detail="This action is available only to caregiver accounts.")

@app.post("/caregiver/invites")
def invite_patient(req: schemas.CaregiverInviteRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    require_caregiver(current_user)
    patient = db.query(models.User).filter(models.User.email == req.patient_email).first()
    if not patient or patient.is_caregiver:
        raise HTTPException(status_code=404, detail="A patient account with that email was not found.")
    if patient.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot invite your own account.")
    access = db.query(models.CaregiverAccess).filter(
        models.CaregiverAccess.caregiver_id == current_user.id,
        models.CaregiverAccess.patient_id == patient.id
    ).first()
    if access:
        if access.status == "accepted":
            raise HTTPException(status_code=400, detail="You already have access to this patient's shared data.")
        access.status = "pending"
        access.created_at = datetime.utcnow()
    else:
        access = models.CaregiverAccess(caregiver_id=current_user.id, patient_id=patient.id)
        db.add(access)
    db.commit()
    mcp_tools.log_audit(db, current_user.id, "caregiver_invite", {"patient_email": req.patient_email}, {"status": "pending"})
    return {"message": "Consent request sent to the patient.", "status": "pending"}

@app.get("/caregiver/patients")
def caregiver_patients(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    require_caregiver(current_user)
    accesses = db.query(models.CaregiverAccess).filter(
        models.CaregiverAccess.caregiver_id == current_user.id,
        models.CaregiverAccess.status == "accepted"
    ).all()
    result = []
    for access in accesses:
        patient = db.query(models.User).filter(models.User.id == access.patient_id).first()
        latest = db.query(models.CogniScore).filter(models.CogniScore.user_id == access.patient_id).order_by(models.CogniScore.created_at.desc()).first()
        result.append({
            "access_id": access.id, "name": patient.name, "email": patient.email, "age": patient.age,
            "shared_since": access.accepted_at,
            "latest_score": latest.score if latest else None,
            "risk_level": latest.risk_level if latest else None,
            "is_deviating": latest.is_deviating if latest else False,
            "last_updated": latest.created_at if latest else None,
        })
    return result

@app.get("/sharing/requests")
def patient_sharing_requests(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    requests = db.query(models.CaregiverAccess).filter(models.CaregiverAccess.patient_id == current_user.id).all()
    result = []
    for request in requests:
        caregiver = db.query(models.User).filter(models.User.id == request.caregiver_id).first()
        result.append({"id": request.id, "caregiver_name": caregiver.name, "caregiver_email": caregiver.email, "status": request.status, "created_at": request.created_at})
    return result

@app.post("/sharing/requests/{access_id}/accept")
def accept_sharing_request(access_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    access = db.query(models.CaregiverAccess).filter(models.CaregiverAccess.id == access_id, models.CaregiverAccess.patient_id == current_user.id).first()
    if not access:
        raise HTTPException(status_code=404, detail="Sharing request not found.")
    access.status = "accepted"
    access.accepted_at = datetime.utcnow()
    db.commit()
    mcp_tools.log_audit(db, current_user.id, "caregiver_access_accepted", {"access_id": access_id}, {"status": "accepted"})
    return {"message": "Caregiver access granted."}

@app.delete("/sharing/requests/{access_id}")
def revoke_sharing_request(access_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    access = db.query(models.CaregiverAccess).filter(models.CaregiverAccess.id == access_id, models.CaregiverAccess.patient_id == current_user.id).first()
    if not access:
        raise HTTPException(status_code=404, detail="Sharing request not found.")
    db.delete(access)
    db.commit()
    mcp_tools.log_audit(db, current_user.id, "caregiver_access_revoked", {"access_id": access_id}, {"status": "revoked"})
    return {"message": "Caregiver access revoked."}
@app.post("/signals")
def save_signal(signal: schemas.PassiveSignalCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.consent_granted:
        raise HTTPException(status_code=403, detail="Informed consent is required before capturing passive digital telemetry.")
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
    if not current_user.consent_granted:
        raise HTTPException(status_code=403, detail="Informed consent is required before recording cognitive test results.")
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

# -----------------------------------------------------------------------------
# MCP Tool 2 & API Endpoint: score_tier1 with EWMA / CUSUM Deviation Tracking
# -----------------------------------------------------------------------------
@app.post("/score/calculate")
def calculate_score(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # A CogniScore represents one calendar-day screening session. Never blend a
    # person's entire raw test history into today's score.
    session_start = datetime.combine(date.today(), datetime.min.time())
    session_end = session_start + timedelta(days=1)
    tests = db.query(models.TestResult).filter(
        models.TestResult.user_id == current_user.id,
        models.TestResult.created_at >= session_start,
        models.TestResult.created_at < session_end
    ).all()
    signals = db.query(models.PassiveSignal).filter(
        models.PassiveSignal.user_id == current_user.id,
        models.PassiveSignal.created_at >= session_start,
        models.PassiveSignal.created_at < session_end
    ).all()
    history = db.query(models.CogniScore).filter(
        models.CogniScore.user_id == current_user.id,
        models.CogniScore.created_at < session_start
    ).order_by(models.CogniScore.created_at.asc()).all()

    tier1_res = mcp_tools.score_tier1(tests, signals, history)
    baseline_status = tier1_res.get("baseline_status", "collecting")
    is_deviating = tier1_res.get("is_deviating", False)

    trigger_level2 = False
    if is_deviating and current_user.level2_status == "not_collected":
        current_user.level2_status = "triggered"
        trigger_level2 = True

    current_user.baseline_status = baseline_status

    score_record = db.query(models.CogniScore).filter(
        models.CogniScore.user_id == current_user.id,
        models.CogniScore.created_at >= session_start,
        models.CogniScore.created_at < session_end
    ).first()
    if not score_record:
        score_record = models.CogniScore(user_id=current_user.id)
        db.add(score_record)
    score_record.score = tier1_res["score"]
    score_record.active_score = tier1_res["active_score"]
    score_record.passive_score = tier1_res["passive_score"]
    score_record.risk_level = tier1_res["risk_level"]
    score_record.ewma_score = tier1_res["ewma_score"]
    score_record.cusum_value = tier1_res["cusum_value"]
    score_record.baseline_mean = tier1_res["baseline_mean"]
    score_record.baseline_status = baseline_status
    score_record.level2_status = current_user.level2_status
    score_record.is_deviating = is_deviating
    score_record.combined_risk_score = current_user.combined_risk_score
    db.commit()
    db.refresh(score_record)

    pipeline_state = "baseline_period" if baseline_status == "collecting" else ("awaiting_level2" if current_user.level2_status != "completed" else "full_pipeline_completed")
    
    mcp_tools.log_audit(db, current_user.id, "score_tier1", {
        "session_date": session_start.date().isoformat(),
        "tests_count": len(tests),
        "signals_count": len(signals),
        "prior_sessions": len(history),
        "baseline_status": baseline_status,
        "level2_status": current_user.level2_status
    }, {**tier1_res, "trigger_level2": trigger_level2}, pipeline_state=pipeline_state)
    
    return {
        "id": score_record.id,
        "user_id": score_record.user_id,
        "score": score_record.score,
        "active_score": score_record.active_score,
        "passive_score": score_record.passive_score,
        "risk_level": score_record.risk_level,
        "ewma_score": score_record.ewma_score,
        "cusum_value": score_record.cusum_value,
        "baseline_mean": score_record.baseline_mean,
        "baseline_status": score_record.baseline_status,
        "level2_status": score_record.level2_status,
        "is_deviating": score_record.is_deviating,
        "combined_risk_score": score_record.combined_risk_score,
        "trigger_level2": trigger_level2,
        "created_at": score_record.created_at
    }
    return score_record

# -----------------------------------------------------------------------------
# MCP Tool 3 & API Endpoint: detect_language
# -----------------------------------------------------------------------------
@app.post("/api/detect-language", response_model=schemas.LanguageDetectResponse)
def detect_language_endpoint(req: schemas.LanguageDetectRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    res = mcp_tools.detect_language(text=req.text, sample_id=req.audio_sample_id)
    mcp_tools.log_audit(db, current_user.id, "detect_language", req.dict(), res)
    return res

@app.post("/api/voice/analyze")
async def analyse_voice_endpoint(
    audio: Optional[UploadFile] = File(None),
    features_json: str = Form(...),
    transcript: str = Form(""),
    language_hint: str = Form("en"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Analyse derived voice biomarkers without retaining raw audio by default."""
    try:
        features = json.loads(features_json)
    except Exception:
        raise HTTPException(status_code=422, detail="features_json must be valid JSON")
    audio_bytes = await audio.read() if audio else b""
    if len(audio_bytes) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Voice sample exceeds the 15 MB upload limit.")
    suffix = os.path.splitext(audio.filename)[1] if audio and audio.filename else ".webm"
    asr_result = transcription.transcribe(audio_bytes, suffix, language_hint) if audio_bytes else {"available": False, "engine": "unavailable", "reason": "No audio sample received."}
    effective_transcript = asr_result.get("transcript") if asr_result.get("available") else transcript
    effective_language = asr_result.get("language_code") if asr_result.get("available") else language_hint
    result = mcp_tools.analyse_voice(features, effective_transcript, effective_language)
    result["transcription"] = {
        "engine": asr_result.get("engine", "browser-speech-recognition"),
        "server_side": bool(asr_result.get("available")),
        "fallback_used": not bool(asr_result.get("available")),
        "reason": asr_result.get("reason"),
    }
    result["transcript"] = effective_transcript if effective_transcript else None
    db.add(models.TestResult(
        user_id=current_user.id,
        test_type="voice_journal",
        score=result["voice_score"],
        duration_seconds=result["duration_seconds"]
    ))
    db.commit()
    mcp_tools.log_audit(db, current_user.id, "analyse_voice", {
        "audio_received": audio is not None,
        "server_transcription": result["transcription"]["server_side"],
        "transcript_available": result["transcript_available"],
        "language_hint": language_hint
    }, result)
    return result

@app.get("/api/voice/model-status")
def voice_model_status(current_user: models.User = Depends(auth.get_current_user)):
    return mcp_tools.speech_model.model_status()

@app.get("/api/voice/transcription-status")
def transcription_status(current_user: models.User = Depends(auth.get_current_user)):
    model = transcription._get_model()
    return {"available": model is not None, "engine": f"faster-whisper:{os.getenv('WHISPER_MODEL', 'small')}" if model else "unavailable"}

# -----------------------------------------------------------------------------
# MCP Tool 4 & API Endpoint: predict_risk (CatBoost Tier 2) & Level 2 Questionnaire Submission
# -----------------------------------------------------------------------------
@app.post("/api/level2/submit")
@app.post("/predict/level2")
def level2_predict(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    try:
        current_user.level2_data = json.dumps(data)
        current_user.level2_status = "completed"
        res = mcp_tools.predict_risk(data, level2_status="completed")
        current_user.combined_risk_score = res.get("combined_risk_score")
        
        # Update latest score record with combined_risk_score and level2_status
        today_start = datetime.combine(date.today(), datetime.min.time())
        score_rec = db.query(models.CogniScore).filter(
            models.CogniScore.user_id == current_user.id,
            models.CogniScore.created_at >= today_start
        ).order_by(models.CogniScore.created_at.desc()).first()
        if score_rec:
            score_rec.combined_risk_score = res.get("combined_risk_score")
            score_rec.level2_status = "completed"

        db.commit()
        db.refresh(current_user)
        mcp_tools.log_audit(
            db, current_user.id, "submit_level2_questionnaire",
            {"features_count": len(data)},
            {"probability": res["probability"], "risk_level": res["risk_level"], "combined_risk_score": res.get("combined_risk_score")},
            pipeline_state="full_pipeline_completed"
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -----------------------------------------------------------------------------
# MCP Tool 5 & API Endpoint: classify_mri (Conditional Neuroimaging Panel)
# -----------------------------------------------------------------------------
@app.post("/api/classify-mri")
async def classify_mri_endpoint(file: Optional[UploadFile] = File(None), db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    filename = file.filename if file else "sample_mri_scan.dcm"
    image_bytes = await file.read() if file else None
    res = mcp_tools.classify_mri(image_bytes=image_bytes, filename=filename)
    mcp_tools.log_audit(db, current_user.id, "classify_mri", {"filename": filename, "bytes_length": len(image_bytes) if image_bytes else 0}, res)
    return res

# -----------------------------------------------------------------------------
# MCP Tool 8 & API Endpoint: generate_referral
# -----------------------------------------------------------------------------
@app.post("/api/generate-referral", response_model=schemas.ReferralResponse)
def generate_referral_endpoint(req: schemas.ReferralRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    res = mcp_tools.generate_referral(
        risk_level=req.risk_level, 
        is_deviating=req.is_deviating, 
        active_score=req.active_score, 
        shap_features=req.shap_top_features
    )
    mcp_tools.log_audit(db, current_user.id, "generate_referral", req.dict(), res)
    return res

# -----------------------------------------------------------------------------
# MCP Tool 6, 7 & 9 API Endpoint: RAG + MedGemma Clinical Report + Guardrail Scan
# -----------------------------------------------------------------------------
@app.post("/api/clinical-report")
def generate_clinical_report_endpoint(req: schemas.ClinicalReportRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    patient_name = req.patient_name or current_user.name
    age = req.age or current_user.age
    
    # 1. RAG retrieval (Tool 6)
    guidelines = mcp_tools.retrieve_guideline(query="cognitive decline referral", risk_level=req.risk_level)
    
    # 2. Draft narrative (Tool 7)
    narrative = mcp_tools.draft_report(
        patient_name=patient_name,
        age=age,
        cogni_score=req.cogni_score,
        risk_level=req.risk_level,
        is_deviating=req.is_deviating,
        shap_features=req.shap_features,
        mri_result=req.mri_result,
        guidelines=guidelines
    )
    
    # 3. Guardrail check (Tool 9)
    safety_check = mcp_tools.check_output_safety(narrative)
    
    # 4. Generate explicit referral (Tool 8)
    referral = mcp_tools.generate_referral(
        risk_level=req.risk_level,
        is_deviating=req.is_deviating,
        active_score=req.cogni_score,
        shap_features=req.shap_features
    )
    
    # Save report to longitudinal ClinicalReport table
    try:
        report_record = models.ClinicalReport(
            user_id=current_user.id,
            cogni_score=req.cogni_score,
            risk_level=req.risk_level,
            is_deviating=req.is_deviating,
            narrative=safety_check["sanitized_narrative"],
            referral_action=referral.get("action"),
            recommended_specialist=referral.get("recommended_specialist"),
            urgency=referral.get("urgency"),
            guardrail_passed=safety_check["guardrail_passed"]
        )
        db.add(report_record)
        db.commit()
    except Exception as e:
        print(f"Failed to persist clinical report record: {e}")

    response_payload = {
        "narrative": safety_check["sanitized_narrative"],
        "guardrail_passed": safety_check["guardrail_passed"],
        "guidelines": guidelines,
        "referral": referral
    }
    
    mcp_tools.log_audit(db, current_user.id, "draft_report", req.dict(), {"guardrail_passed": safety_check["guardrail_passed"]}, safety_check["guardrail_passed"])
    return response_payload

@app.get("/api/clinical-reports/history")
def get_clinical_reports_history(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    reports = db.query(models.ClinicalReport).filter(models.ClinicalReport.user_id == current_user.id).order_by(models.ClinicalReport.created_at.desc()).all()
    return reports

@app.get("/api/audit-logs", response_model=List[schemas.AuditLogOut])
def get_audit_logs(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    logs = db.query(models.AuditLog).filter(models.AuditLog.user_id == current_user.id).order_by(models.AuditLog.created_at.desc()).limit(50).all()
    return logs

# -----------------------------------------------------------------------------
# Multi-Agent Screening Orchestration & Sub-Agent Endpoints
# -----------------------------------------------------------------------------
@app.post("/api/orchestrate", response_model=schemas.AgentOrchestrationResponse)
def orchestrate_screening(
    req: schemas.AgentOrchestrationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Executes the master RiskOrchestrationAgent across all screening tiers."""
    session_start = datetime.combine(date.today(), datetime.min.time())
    session_end = session_start + timedelta(days=1)
    
    tests = db.query(models.TestResult).filter(
        models.TestResult.user_id == current_user.id,
        models.TestResult.created_at >= session_start,
        models.TestResult.created_at < session_end
    ).all()
    signals = db.query(models.PassiveSignal).filter(
        models.PassiveSignal.user_id == current_user.id,
        models.PassiveSignal.created_at >= session_start,
        models.PassiveSignal.created_at < session_end
    ).all()
    history = db.query(models.CogniScore).filter(
        models.CogniScore.user_id == current_user.id,
        models.CogniScore.created_at < session_start
    ).order_by(models.CogniScore.created_at.asc()).all()

    orchestration_result = mcp_tools.run_screening_orchestrator(
        db=db,
        user=current_user,
        active_scores=tests,
        signals=signals,
        historical_scores=history,
        voice_features=req.voice_features,
        voice_transcript=req.voice_transcript or "",
        mri_bytes=None
    )
    return orchestration_result

@app.post("/api/behavior/analyze")
def analyze_behavior_endpoint(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Executes BehaviorAnalysisAgent on structured typing and scrolling dynamics."""
    result = mcp_tools.behavior_agent.analyze(data)
    mcp_tools.log_audit(db, current_user.id, "analyze_behavior", data, result, agent_name="BehaviorAnalysisAgent")
    return result

@app.post("/api/cognitive/analyze")
def analyze_cognitive_endpoint(
    test_results: list,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Executes CognitiveTestAgent across battery psychometrics."""
    result = mcp_tools.cognitive_agent.analyze(test_results)
    mcp_tools.log_audit(db, current_user.id, "analyze_cognitive_tests", {"test_count": len(test_results)}, result, agent_name="CognitiveTestAgent")
    return result

# -----------------------------------------------------------------------------
# Subgroup Fairness Analysis Endpoint
# -----------------------------------------------------------------------------
@app.get("/api/fairness-check")
def fairness_check_endpoint():
    return mcp_tools.check_subgroup_fairness()

# -----------------------------------------------------------------------------
# Demo Seed Endpoint
# -----------------------------------------------------------------------------
@app.get("/setup-demo")
def setup_demo(db: Session = Depends(get_db)):
    import hashlib, random
    from datetime import datetime, date, timedelta
    
    def hash_pw(p): return auth.get_password_hash(p)
    
    def make_user(name, email, age, gender="Male"):
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            existing.consent_granted = True
            existing.consent_granted_at = datetime.utcnow()
            existing.baseline_status = "established"
            existing.level2_status = "not_collected"
            existing.combined_risk_score = None
            existing.gender = gender
            db.commit()
            return existing
        u = models.User(
            name=name,
            email=email,
            hashed_password=hash_pw("demo1234"),
            age=age,
            gender=gender,
            is_caregiver=False,
            consent_granted=True,
            consent_granted_at=datetime.utcnow(),
            baseline_status="established",
            level2_status="not_collected"
        )
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
            ewma = round(s - random.uniform(0, 2), 2)
            cusum = round(random.uniform(0, 5) if s > 50 else random.uniform(10, 16), 2)
            is_dev = cusum > 12.0 or s < 45
            db.add(models.CogniScore(
                user_id=uid, 
                score=round(s,2), 
                active_score=round(s+random.uniform(-5,5),2), 
                passive_score=round(s+random.uniform(-5,5),2), 
                risk_level="Low" if s>=65 else "Moderate" if s>=40 else "High", 
                ewma_score=ewma,
                cusum_value=cusum,
                baseline_mean=round(base, 2),
                baseline_status="established",
                level2_status="not_collected",
                is_deviating=is_dev,
                created_at=d
            ))
        db.commit()
    
    def seed_tests(uid, base):
        for i in range(15):
            d = datetime.now() - timedelta(days=(14-i))
            for tt in ['pattern_recall','digit_span','word_recall','voice_journal']:
                db.add(models.TestResult(user_id=uid, test_type=tt, score=round(max(0,min(100,base+random.uniform(-5,5))),2), duration_seconds=60, created_at=d))
        db.commit()
    
    def seed_signals(uid, typing_base, backspace_base):
        for i in range(15):
            d = datetime.now() - timedelta(days=(14-i))
            db.add(models.PassiveSignal(user_id=uid, typing_speed=round(typing_base+random.uniform(-5,5),2), backspace_rate=round(backspace_base+random.uniform(-0.02,0.02),2), scroll_hesitation=round(random.uniform(0,3),2), session_duration=300, created_at=d))
        db.commit()
    
    p1 = make_user("Arjun Sharma", "arjun@demo.com", 68, "Male")
    seed_scores(p1.id, 88, 0.3)
    seed_tests(p1.id, 92)
    seed_signals(p1.id, 95, 0.01)
    
    p2 = make_user("Meena Krishnan", "meena@demo.com", 72, "Female")
    seed_scores(p2.id, 68, -1.2)
    seed_tests(p2.id, 60)
    seed_signals(p2.id, 60, 0.12)
    
    p3 = make_user("Rajan Pillai", "rajan@demo.com", 78, "Male")
    seed_scores(p3.id, 78, -3.2)
    seed_tests(p3.id, 28)
    seed_signals(p3.id, 30, 0.35)
    
    return {"status": "Demo users seeded successfully with EWMA/CUSUM baseline metrics and informed consent!"}

import os

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
