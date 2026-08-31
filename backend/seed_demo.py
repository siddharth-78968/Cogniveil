import sys
sys.path.insert(0, '.')

from database import engine, SessionLocal
import models
import hashlib
from datetime import datetime, timedelta
import random

# Create all tables
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

import auth

def hash_password(password):
    return auth.get_password_hash(password)

def create_user(name, email, password, age):
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        print(f"User {email} already exists — skipping creation")
        return existing
    user = models.User(
        name=name,
        email=email,
        hashed_password=hash_password(password),
        age=age,
        is_caregiver=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"Created user: {email}")
    return user

def seed_scores(user_id, base_score, trend, days=10):
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=(days - i))
        noise = random.uniform(-3, 3)
        score = max(0, min(100, base_score + (trend * i) + noise))
        active = max(0, min(100, score + random.uniform(-5, 5)))
        passive = max(0, min(100, score + random.uniform(-5, 5)))

        if score >= 75:
            risk = "Low"
        elif score >= 50:
            risk = "Moderate"
        else:
            risk = "High"

        entry = models.CogniScore(
            user_id=user_id,
            score=round(score, 2),
            active_score=round(active, 2),
            passive_score=round(passive, 2),
            risk_level=risk,
            created_at=date
        )
        db.add(entry)
    db.commit()
    print(f"Seeded {days} score entries for user_id {user_id}")

def seed_signals(user_id, typing_base, backspace_base, days=10):
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=(days - i))
        signal = models.PassiveSignal(
            user_id=user_id,
            typing_speed=round(typing_base + random.uniform(-5, 5), 2),
            backspace_rate=round(backspace_base + random.uniform(-0.02, 0.02), 2),
            scroll_hesitation=round(random.uniform(0, 3), 2),
            session_duration=round(random.uniform(120, 600), 2),
            created_at=date
        )
        db.add(signal)
    db.commit()
    print(f"Seeded signals for user_id {user_id}")

def seed_tests(user_id, score_base, days=10):
    test_types = ['pattern_recall', 'digit_span', 'word_recall', 'voice_journal']
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=(days - i))
        for test_type in test_types:
            noise = random.uniform(-8, 8)
            score = max(0, min(100, score_base + noise))
            result = models.TestResult(
                user_id=user_id,
                test_type=test_type,
                score=round(score, 2),
                duration_seconds=round(random.uniform(30, 120), 2),
                created_at=date
            )
            db.add(result)
    db.commit()
    print(f"Seeded test results for user_id {user_id}")

print("\n--- Seeding Demo Patients ---\n")

# Patient 1 — Healthy baseline, stable high scores
p1 = create_user("Arjun Sharma", "arjun@demo.com", "demo1234", 68)
seed_scores(p1.id, base_score=85, trend=0.2, days=14)
seed_signals(p1.id, typing_base=80, backspace_base=0.05, days=14)
seed_tests(p1.id, score_base=85, days=14)

# Patient 2 — Early drift, slowly declining
p2 = create_user("Meena Krishnan", "meena@demo.com", "demo1234", 72)
seed_scores(p2.id, base_score=68, trend=-1.2, days=14)
seed_signals(p2.id, typing_base=60, backspace_base=0.12, days=14)
seed_tests(p2.id, score_base=60, days=14)

# Patient 3 — High risk, consistently low scores
p3 = create_user("Rajan Pillai", "rajan@demo.com", "demo1234", 78)
seed_scores(p3.id, base_score=32, trend=-0.8, days=14)
seed_signals(p3.id, typing_base=35, backspace_base=0.25, days=14)
seed_tests(p3.id, score_base=30, days=14)

# Clinician
existing_doc = db.query(models.User).filter(models.User.email == "clinician@demo.com").first()
if not existing_doc:
    doc = models.User(
        name="Dr. Jackson Santos",
        email="clinician@demo.com",
        hashed_password=hash_password("demo1234"),
        age=48,
        role="clinician",
        is_caregiver=True,
        consent_granted=True
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
else:
    doc = existing_doc

# Seed isolated demo consultations if none exist
existing_appts = db.query(models.Appointment).filter(models.Appointment.patient_id.in_([p1.id, p2.id, p3.id])).count()
if existing_appts == 0:
    db.add(models.Appointment(
        user_id=p1.id, patient_id=p1.id, clinician_id=doc.id,
        patient_name=p1.name, clinician_name=doc.name,
        appointment_type="Comprehensive Neurological Evaluation",
        scheduled_time="2026-09-15 - 10:00 AM",
        status="Accepted", notes="Baseline psychometric and neuromotor verification.",
        location="Memory & Cognitive Health Clinic - Suite 402"
    ))
    db.add(models.Appointment(
        user_id=p2.id, patient_id=p2.id, clinician_id=doc.id,
        patient_name=p2.name, clinician_name=doc.name,
        appointment_type="Acoustic Fluency & Cognitive Battery",
        scheduled_time="2026-09-18 - 02:30 PM",
        status="Pending", notes="Speech pause telemetry review requested by patient.",
        location="Memory & Cognitive Health Clinic - Suite 402"
    ))
    db.add(models.Appointment(
        user_id=p3.id, patient_id=p3.id, clinician_id=doc.id,
        patient_name=p3.name, clinician_name=doc.name,
        appointment_type="Neurological Evaluation",
        scheduled_time="2026-09-10 - 11:00 AM",
        status="Accepted", notes="Clinical follow-up for longitudinal drift.",
        location="Memory & Cognitive Health Clinic - Suite 402"
    ))
    db.commit()

print("\n--- Demo Seeding Complete ---")
print("\nDemo login credentials:")
print("Healthy:   arjun@demo.com     / demo1234")
print("Drifting:  meena@demo.com     / demo1234")
print("High Risk: rajan@demo.com     / demo1234")
print("Clinician: clinician@demo.com / demo1234")

db.close()