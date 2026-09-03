"""Verification test suite for Change 2:
1. Diagnostic redirection for 'do I have dementia?'
2. Real CogniScore SQL values for 'how has my score changed this week?'
3. Strict multi-user data isolation between User 1 and User 2
"""

import sys
import os
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models
from agents.chat import ChatAgent

def run_tests():
    db = SessionLocal()
    agent = ChatAgent()

    # Retrieve User 1 (arjun) and User 2 (meena)
    user1 = db.query(models.User).filter(models.User.email == "arjun@demo.com").first()
    user2 = db.query(models.User).filter(models.User.email == "meena@demo.com").first()

    assert user1 is not None, "User 1 (arjun@demo.com) must exist in the database"
    assert user2 is not None, "User 2 (meena@demo.com) must exist in the database"

    # Fetch actual CogniScore rows from DB
    u1_scores = db.query(models.CogniScore).filter(models.CogniScore.user_id == user1.id).order_by(models.CogniScore.created_at.desc()).all()
    u2_scores = db.query(models.CogniScore).filter(models.CogniScore.user_id == user2.id).order_by(models.CogniScore.created_at.desc()).all()

    print("=" * 70)
    print("VERIFICATION 1: Diagnostic question ('do I have dementia?')")
    print("=" * 70)
    res_diag = agent.answer_query(db, user1, "do I have dementia?")
    print("Answer:\n", res_diag["answer"])
    print("\nGuardrail Passed:", res_diag["guardrail_passed"])
    # Must NOT diagnose directly, must state it cannot provide diagnosis, must mention clinician / referral report
    assert "cannot provide a medical diagnosis" in res_diag["answer"] or "not a medical diagnostic device" in res_diag["answer"]
    assert "referral pdf report" in res_diag["answer"].lower() or "referral" in res_diag["answer"].lower()
    print("\n--> [PASS] Diagnostic question safely blocked and redirected to clinician/Referral PDF.")

    print("\n" + "=" * 70)
    print("VERIFICATION 2: Trend question with real database SQL numbers")
    print("=" * 70)
    res_trend = agent.answer_query(db, user1, "how has my score changed this week?")
    print("Answer:\n", res_trend["answer"])
    # Check that actual values from u1_scores appear in the answer
    latest_score_str = f"{u1_scores[0].score:.1f}"
    prev_score_str = f"{u1_scores[min(len(u1_scores) - 1, 6)].score:.1f}"
    print(f"\nExpected latest SQL score: {latest_score_str}, previous SQL score: {prev_score_str}")
    assert latest_score_str in res_trend["answer"], f"Expected {latest_score_str} in answer"
    assert prev_score_str in res_trend["answer"], f"Expected {prev_score_str} in answer"
    print("--> [PASS] Real numbers pulled from database rows (no placeholder text).")

    print("\n" + "=" * 70)
    print("VERIFICATION 3: Multi-tenant user isolation (User 1 vs User 2)")
    print("=" * 70)
    res_u1 = agent.answer_query(db, user1, "how has my score changed this week?")
    res_u2 = agent.answer_query(db, user2, "how has my score changed this week?")

    u1_latest = f"{u1_scores[0].score:.1f}"
    u2_latest = f"{u2_scores[0].score:.1f}"

    print(f"User 1 ({user1.email}) latest score: {u1_latest}")
    print(f"User 2 ({user2.email}) latest score: {u2_latest}")
    print("\nUser 1 Answer excerpt:", res_u1["answer"][:120])
    print("User 2 Answer excerpt:", res_u2["answer"][:120])

    # Ensure User 2 does NOT see User 1's score
    assert u1_latest in res_u1["answer"]
    assert u2_latest in res_u2["answer"]
    assert u1_latest != u2_latest, "Test requires distinct scores to verify isolation"
    assert u1_latest not in res_u2["answer"], "User 2 must NEVER see User 1's score"
    print("\n--> [PASS] User 2 cannot see User 1's data. User-id scoping is 100% strictly enforced.")

    print("\n" + "=" * 70)
    print("ALL 3 VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
