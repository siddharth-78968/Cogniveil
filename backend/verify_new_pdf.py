import os
import io
import models, schemas, main
from database import SessionLocal
from services.pdf_report import build_clinical_referral_pdf, generate_clinical_referral_summary
from reportlab.pdfgen import canvas
import re

def verify_pdf_generation():
    print("=" * 80)
    print("COGNIVEIL CLINICAL REFERRAL PDF RIGOROUS CONTENT VERIFICATION")
    print("=" * 80)

    # 1. Delete previous test PDF if it exists
    out_pdf_path = os.path.join(os.path.dirname(__file__), "test_clinical_referral_summary.pdf")
    if os.path.exists(out_pdf_path):
        os.remove(out_pdf_path)
        print(f"[OK] 1. Deleted old test PDF: {out_pdf_path}")

    # 2. Test the summary generation function directly
    summary_text = generate_clinical_referral_summary(patient_name="Vandhana", is_deviating=True)
    print("\n--- NEW GENERATED EXECUTIVE SUMMARY ---")
    print(summary_text)
    print("---------------------------------------\n")

    # Verify length and content of the summary
    sentences = [s.strip() for s in summary_text.split(".") if s.strip()]
    assert 3 <= len(sentences) <= 5, f"Expected 3-5 sentences, got {len(sentences)}"
    print(f"[PASS] 2. generate_clinical_referral_summary produces {len(sentences)} concise sentences.")

    # 3. Generate completely new PDF
    payload = {
        "cogni_score": 74.7,
        "risk_level": "Moderate",
        "is_deviating": True,
        "patient_name": "Vandhana",
        "age": 68,
        "confidence": 0.88,
        "referral": {
            "action": "Formal Clinical Evaluation Indicated",
            "recommended_specialist": "Cognitive Neurologist / Memory Disorders Clinic",
            "urgency": "Moderate (within 30 days)",
            "clinical_rationale": "Persistent multi-session memory and psychomotor latency drift."
        }
    }

    pdf_buffer = build_clinical_referral_pdf(payload, {"name": "Vandhana", "age": 68, "gender": "Female", "id": "PAT-9901"})
    pdf_bytes = pdf_buffer.getvalue()

    # Save new PDF
    with open(out_pdf_path, "wb") as f:
        f.write(pdf_bytes)
    print(f"[PASS] 3. Completely new PDF generated and saved to: {out_pdf_path} (Size: {len(pdf_bytes)} bytes)")

    # 4. Binary and Header Verification
    assert pdf_bytes.startswith(b"%PDF-1.4"), "Invalid PDF header"
    assert b"%%EOF" in pdf_bytes, "Missing PDF EOF"
    print("[PASS] 4. PDF binary structure is valid (%PDF-1.4 header and %%EOF confirmed).")

    # 5. Search PDF stream for distinctive OLD phrases to prove they are NOT in the executive summary
    raw_pdf_str = pdf_bytes.decode('latin1', errors='ignore')
    
    old_phrases = [
        "presented for multimodal cognitive health screening, demonstrating an overall CogniScore",
        "demonstrating an overall CogniScore of 74.7/100",
        "Time-series analysis confirms a persistent deviation from established baseline across",
        "driven primarily by a",
        "reduction in memory retention, reduced typing speed"
    ]

    for phrase in old_phrases:
        assert phrase not in raw_pdf_str, f"CRITICAL ERROR: Old phrase found in PDF: '{phrase}'"
        print(f"[PASS] 5. Verified absence of old phrase: '{phrase[:50]}...'")

    # 6. Verify NEW required sections and structure exist in the PDF
    required_new_elements = [
        "COGNIVEIL",
        "CLINICAL REFERRAL SUMMARY",
        "PATIENT OVERVIEW",
        "EXECUTIVE SUMMARY",
        "KEY FINDINGS",
        "Cognitive:",
        "Behavioral:",
        "Voice:",
        "Clinical Risk:",
        "MRI:",
        "CLINICAL FOLLOW-UP",
        "CLINICAL DISCLAIMER",
        "APPENDIX",
        "DETAILED SUPPORTING ANALYSIS",
        "ACTIVE COGNITIVE BATTERY PSYCHOMETRICS",
        "PASSIVE BEHAVIORAL & ACOUSTIC TELEMETRY",
        "TIER 2 MULTIVARIATE RISK & TREESHAP DRIVERS",
        "TIER 3 STRUCTURAL MRI VOLUMETRY & GRAD-CAM MORPHOMETRY"
    ]

    for elem in required_new_elements:
        assert elem in raw_pdf_str, f"Missing required element in PDF: '{elem}'"
        print(f"[PASS] 6. Verified presence of new section/heading: '{elem}'")

    print("\n" + "=" * 80)
    print("ALL PDF CONTENT & STRUCTURE VERIFICATIONS PASSED (100%)")
    print("=" * 80)

if __name__ == "__main__":
    verify_pdf_generation()
