"""SafetyAgent for CogniVeil.

Enforces deterministic and pattern-based clinical safety guardrails across all
agent-generated text and clinical reports. Intercepts unauthorized diagnostic claims,
mandates calibrated uncertainty language, checks provenance tags, and attaches
required medical disclaimers.
"""

from typing import Dict, Any, List, Tuple
import re


class SafetyAgent:
    """Specialized agent governing medical safety boundaries, language sanitization, and disclaimers."""

    AGENT_NAME = "SafetyAgent"
    VERSION = "2026.1"

    FORBIDDEN_DIAGNOSTIC_CLAIMS = [
        (r"\b(you|patient|user) (have|has) alzheimer'?s(\s+disease)?\b", "screening indicates elevated risk factors that warrant clinical evaluation"),
        (r"\b(you|patient|user) (have|has) dementia\b", "screening reveals cognitive indicators that warrant specialist review"),
        (r"\b(you|patient|user) (are|is) diagnosed with [a-zA-Z\s]+\b", "screening markers suggest clinical follow-up is recommended"),
        (r"\b(diagnosed with|diagnosis of) (alzheimer'?s|dementia)\b", "evaluated for cognitive risk factors"),
        (r"\bthis proves (alzheimer'?s|dementia)\b", "these markers correlate with cognitive risk indicators"),
        (r"\bdefinitive diagnosis\b", "clinical decision support screening"),
        (r"\bguaranteed (alzheimer'?s|dementia|cure)\b", "assessed risk profile"),
        (r"\bwe diagnose (you|the patient|patient)\b", "screening assessment indicates"),
    ]

    REQUIRED_DISCLAIMER = (
        "\n\n[Medical Disclaimer: CogniVeil is an AI-assisted digital screening and decision support tool, "
        "not a medical diagnostic device. Screening outputs do not constitute a definitive medical diagnosis. "
        "All findings should be interpreted by a qualified healthcare professional or neurologist.]"
    )

    def review(self, narrative: str, risk_level: str = "Moderate", provenance_meta: Dict[str, Any] = None) -> Dict[str, Any]:
        """Scans, sanitizes, and certifies clinical report text.

        Args:
            narrative: The raw generated narrative from the clinical synthesis agent.
            risk_level: The assessed risk level ("Low", "Moderate", "High").
            provenance_meta: Provenance flags for input features (self_reported vs clinically_obtained).

        Returns:
            Safety review certificate dictionary with sanitized text and compliance status.
        """
        violations_found: List[str] = []
        sanitized_narrative = narrative

        # 1. Regex-based Forbidden Claim Detection and Remediation
        for pattern, replacement in self.FORBIDDEN_DIAGNOSTIC_CLAIMS:
            matches = re.findall(pattern, sanitized_narrative, flags=re.IGNORECASE)
            if matches:
                for match in matches:
                    matched_str = match if isinstance(match, str) else match[0]
                    violations_found.append(matched_str)
                sanitized_narrative = re.sub(pattern, replacement, sanitized_narrative, flags=re.IGNORECASE)

        # 2. Check for Uncertainty & Probabilistic Language
        uncertainty_markers = ["indicates", "suggests", "risk factors", "markers", "screening", "probability", "correlated"]
        has_uncertainty = any(marker in sanitized_narrative.lower() for marker in uncertainty_markers)
        if not has_uncertainty and len(sanitized_narrative) > 50:
            sanitized_narrative = "Clinical Decision Support Note: " + sanitized_narrative

        # 3. Provenance Verification
        provenance_notes = []
        if provenance_meta:
            apoe_prov = provenance_meta.get("apoe_e4_provenance", "self_reported")
            mri_prov = provenance_meta.get("mri_provenance", "self_reported")
            if apoe_prov == "self_reported":
                provenance_notes.append("• Genetic APOE-e4 status is self-reported and requires laboratory confirmation.")
            if mri_prov == "self_reported":
                provenance_notes.append("• Neuroimaging history is patient-reported.")

        if provenance_notes and "DATA PROVENANCE & LIMITATIONS" not in sanitized_narrative:
            sanitized_narrative += "\n\nDATA PROVENANCE & CLINICAL LIMITATIONS:\n" + "\n".join(provenance_notes)

        # 4. Mandatory Medical Disclaimer Attachment
        if self.REQUIRED_DISCLAIMER.strip() not in sanitized_narrative:
            sanitized_narrative += self.REQUIRED_DISCLAIMER

        guardrail_passed = len(violations_found) == 0
        safety_score = 1.0 if guardrail_passed else round(max(0.5, 1.0 - (len(violations_found) * 0.15)), 2)

        explanation = (
            "Safety compliance certified. Narrative complies with non-diagnostic screening boundaries and includes mandatory disclaimers."
            if guardrail_passed else
            f"Remediated {len(violations_found)} non-compliant diagnostic assertion(s) into probabilistic screening language."
        )

        return {
            "agent": self.AGENT_NAME,
            "version": self.VERSION,
            "guardrail_passed": guardrail_passed,
            "violations_found": violations_found,
            "remediation_applied": not guardrail_passed,
            "sanitized_narrative": sanitized_narrative,
            "disclaimer_verified": True,
            "safety_score": safety_score,
            "explanation": explanation
        }
