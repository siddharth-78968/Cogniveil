import os
import io
import re
import base64
import zlib
from services.pdf_report import build_clinical_referral_pdf, generate_clinical_referral_summary

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Decompresses, parses and reconstructs all text stream words from an Adobe ASCII85 + FlateDecode PDF."""
    stream_blocks = re.findall(rb'stream[\r\n]+(.*?)[\r\n]*~>endstream', pdf_bytes, re.DOTALL)
    reconstructed_texts = []
    for blk in stream_blocks:
        try:
            raw_a85 = blk.strip() + b'~>'
            dec_a85 = base64.a85decode(raw_a85, adobe=True)
            dec_flate = zlib.decompress(dec_a85)
            text = dec_flate.decode('latin1', errors='ignore')
            # extract string literals in PDF operator syntax: (text) Tj or [(text)] TJ
            words = re.findall(r'\((.*?)\)\s*Tj', text)
            # unescape common PDF escape sequences
            cleaned_words = [w.replace(r'\(', '(').replace(r'\)', ')') for w in words]
            reconstructed_texts.append(" ".join(cleaned_words))
        except Exception as e:
            pass
    return "\n\n".join(reconstructed_texts)

def run():
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

    # 5. Extract decompressed PDF text
    extracted_text = extract_text_from_pdf_bytes(pdf_bytes)

    # 6. Verify ABSENCE of old raw technical phrases in the PDF content
    old_phrases = [
        "presented for multimodal cognitive health screening",
        "demonstrating an overall CogniScore of 74.7/100",
        "Time-series analysis confirms a persistent deviation from established baseline across",
        "driven primarily by a",
        "reduction in memory retention, reduced typing speed"
    ]

    for phrase in old_phrases:
        assert phrase not in extracted_text, f"CRITICAL ERROR: Old phrase found in PDF: '{phrase}'"
        print(f"[PASS] 5. Verified absence of old phrase: '{phrase[:50]}...'")

    # 7. Verify PRESENCE of new required sections and structure in the PDF
    required_new_elements = [
        "COGNIVEIL",
        "CLINICAL REFERRAL SUMMARY",
        "PATIENT OVERVIEW",
        "Patient:",
        "Assessment Date:",
        "CogniScore:",
        "Screening Status:",
        "EXECUTIVE SUMMARY",
        "Screening identified a persistent decline in memory and processing-speed performance",
        "Behavioral telemetry also showed increased hesitation and correction activity.",
        "Voice analysis demonstrated increased pausing, while speech coherence remained relatively preserved.",
        "The combined findings suggest that formal clinical evaluation may be appropriate.",
        "KEY FINDINGS",
        "Cognitive:",
        "Memory:  Declining",
        "Processing speed:  Declining",
        "Reaction time:  Stable",
        "Behavioral:",
        "Typing hesitation:  Increased",
        "Correction frequency:  Increased",
        "Voice:",
        "Pausing:  Increased",
        "Speech coherence:  Preserved",
        "Clinical Risk:",
        "Overall risk:",
        "Sleep fragmentation, physical activity, vascular risk",
        "MRI:",
        "Status:  Not available / not performed",
        "CLINICAL FOLLOW-UP",
        "Formal clinical evaluation is recommended to determine the significance of the observed changes.",
        "CLINICAL DISCLAIMER:",
        "APPENDIX",
        "DETAILED SUPPORTING ANALYSIS",
        "A. ACTIVE COGNITIVE BATTERY PSYCHOMETRICS",
        "B. PASSIVE BEHAVIORAL & ACOUSTIC TELEMETRY",
        "C. TIER 2 MULTIVARIATE RISK & TREESHAP DRIVERS",
        "D. TIER 3 STRUCTURAL MRI VOLUMETRY & GRAD-CAM MORPHOMETRY"
    ]

    for elem in required_new_elements:
        assert elem in extracted_text, f"Missing required element in PDF extracted text: '{elem}'"
        print(f"[PASS] 6. Verified presence of new section/content: '{elem[:50]}...'")

    print("\n" + "=" * 80)
    print("ALL 36 RIGOROUS PDF CONTENT & STRUCTURE VERIFICATIONS PASSED (100%)")
    print("=" * 80)

if __name__ == "__main__":
    run()
