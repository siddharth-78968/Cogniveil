import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cogniveil.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH.replace(os.sep, '/')}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False, "timeout": 30}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def run_migrations():
    import sqlite3
    try:
        conn = sqlite3.connect(DB_PATH, timeout=30)
        conn.execute("PRAGMA journal_mode=WAL;")
        cursor = conn.cursor()
        # Check if role column exists in users table
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        if columns and "role" not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'patient'")
            # Backfill existing clinicians where is_caregiver is true
            cursor.execute("UPDATE users SET role = 'clinician' WHERE is_caregiver = 1")
            cursor.execute("UPDATE users SET role = 'patient' WHERE role IS NULL OR role = ''")
            conn.commit()

        # Check if patient_id column exists in appointments table
        cursor.execute("PRAGMA table_info(appointments)")
        appt_cols = [row[1] for row in cursor.fetchall()]
        if appt_cols and "patient_id" not in appt_cols:
            cursor.execute("ALTER TABLE appointments ADD COLUMN patient_id INTEGER REFERENCES users(id)")
            cursor.execute("UPDATE appointments SET patient_id = user_id WHERE patient_id IS NULL")
            conn.commit()

        conn.close()
    except Exception as e:
        print(f"Migration error: {e}")

run_migrations()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()