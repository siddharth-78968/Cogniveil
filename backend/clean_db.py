import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cogniveil.db")
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# 1. Delete mock dummy appointments
cursor.execute("DELETE FROM appointments WHERE patient_name IN ('Lucile Crawford', 'Amy Jacobs', 'Adele Gross', 'Ray Clayton')")
print(f"Purged mock appointment rows. Count: {cursor.rowcount}")

# 2. Synchronize all remaining appointments to match users.name
from datetime import datetime
cursor.execute("""
    UPDATE appointments 
    SET patient_name = (SELECT name FROM users WHERE users.id = appointments.patient_id),
        created_at = COALESCE(created_at, ?)
    WHERE patient_id IN (SELECT id FROM users)
""", (datetime.utcnow().isoformat(),))
conn.commit()

# 3. Ensure demo users (Arjun, Meena, Rajan) have their isolated appointment
import auth
demo_pw = auth.get_password_hash("demo1234")
cursor.execute("UPDATE users SET hashed_password = ? WHERE email IN ('arjun@demo.com', 'meena@demo.com', 'rajan@demo.com', 'clinician@demo.com')", (demo_pw,))
conn.commit()

demo_users = {
    "arjun@demo.com": ("Comprehensive Neurological Evaluation", "2026-09-15 - 10:00 AM", "Accepted"),
    "meena@demo.com": ("Acoustic Fluency & Cognitive Battery", "2026-09-18 - 02:30 PM", "Pending"),
    "rajan@demo.com": ("Neurological Evaluation", "2026-09-10 - 11:00 AM", "Accepted")
}

doc = cursor.execute("SELECT id, name FROM users WHERE email = 'clinician@demo.com'").fetchone()
doc_id, doc_name = doc if doc else (None, "Dr. Jackson Santos")

for email, (appt_type, appt_time, appt_status) in demo_users.items():
    u = cursor.execute("SELECT id, name FROM users WHERE email = ?", (email,)).fetchone()
    if u:
        uid, uname = u
        existing = cursor.execute("SELECT id FROM appointments WHERE patient_id = ?", (uid,)).fetchall()
        if not existing:
            cursor.execute("""
                INSERT INTO appointments (user_id, patient_id, clinician_id, patient_name, clinician_name, appointment_type, scheduled_time, status, notes, location)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (uid, uid, doc_id, uname, doc_name, appt_type, appt_time, appt_status, f"Clinical consultation for {uname}", "Memory & Cognitive Health Clinic - Suite 402"))
            conn.commit()
            print(f"Seeded isolated appointment for {uname}")

print("\n--- Current Appointments in DB ---")
for row in cursor.execute("SELECT id, patient_id, clinician_id, patient_name, appointment_type, status FROM appointments").fetchall():
    print(row)

conn.close()
