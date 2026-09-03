import sqlite3
import os

db_path = "cogniveil.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

def add_col_if_missing(table, col, col_type):
    cur.execute(f"PRAGMA table_info({table})")
    cols = [r[1] for r in cur.fetchall()]
    if col not in cols:
        print(f"Adding column {col} to {table}...")
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
        conn.commit()
    else:
        print(f"Column {col} already exists in {table}.")

add_col_if_missing("test_results", "metadata_json", "TEXT")
add_col_if_missing("users", "role", "VARCHAR(50) DEFAULT 'patient'")
add_col_if_missing("users", "is_caregiver", "BOOLEAN DEFAULT 0")
add_col_if_missing("appointments", "notes", "TEXT")
add_col_if_missing("appointments", "location", "VARCHAR(255)")

conn.close()
print("Migration completed successfully.")
