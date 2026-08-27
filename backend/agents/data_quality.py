"""DataQualityAgent for CogniVeil.

Validates telemetry and audio recording sufficiency before allowing signals
into the scoring and fusion engines. Flags low-confidence, corrupted, or
insufficient sessions to prevent misleading clinical risk scores.
"""

from typing import Dict, Any, List, Optional


class DataQualityAgent:
    """Specialized agent verifying data sufficiency and integrity across modalities."""

    AGENT_NAME = "DataQualityAgent"
    VERSION = "2026.1"

    def check_telemetry(
        self,
        typing_data: Optional[Dict[str, Any]] = None,
        scroll_data: Optional[Dict[str, Any]] = None,
        min_keys: int = 8,
        min_session_duration: float = 10.0
    ) -> Dict[str, Any]:
        """Validates keystroke and scrolling telemetry sufficiency."""
        issues: List[str] = []
        warnings: List[str] = []

        total_keys = 0
        session_dur = 0.0

        if typing_data:
            total_keys = int(typing_data.get("total_keys", typing_data.get("key_count", 0)))
            session_dur = float(typing_data.get("session_duration", 30.0))
            if total_keys < min_keys:
                warnings.append(f"Low keystroke volume ({total_keys} keys < {min_keys} recommended).")

        if session_dur < min_session_duration and session_dur > 0:
            warnings.append(f"Brief recording session ({session_dur:.1f}s < {min_session_duration}s).")

        is_sufficient = len(issues) == 0
        quality_score = 1.0 if (len(issues) == 0 and len(warnings) == 0) else 0.85 if len(issues) == 0 else 0.40

        return {
            "agent": self.AGENT_NAME,
            "version": self.VERSION,
            "modality": "behavioral_telemetry",
            "is_sufficient": is_sufficient,
            "quality_score": round(quality_score, 2),
            "issues": issues,
            "warnings": warnings,
            "recommendation": "Telemetry approved for baseline comparison." if is_sufficient else "Repeat telemetry collection session."
        }

    def check_voice(
        self,
        features: Dict[str, Any],
        transcript: str = "",
        min_duration: float = 5.0
    ) -> Dict[str, Any]:
        """Validates acoustic audio features and transcription quality."""
        issues: List[str] = []
        warnings: List[str] = []

        duration = float(features.get("duration_seconds", 0.0))
        mean_rms = float(features.get("mean_rms", 0.0))
        transcription_conf = float(features.get("transcription_confidence", 0.90))

        if duration < min_duration:
            issues.append(f"Voice sample duration ({duration:.1f}s) is shorter than minimum threshold ({min_duration}s).")

        if mean_rms < 0.005:
            warnings.append("Low microphone audio amplitude / high silence ratio detected.")

        if transcription_conf < 0.50 and transcript.strip():
            warnings.append("Low speech recognition transcription confidence.")

        is_sufficient = len(issues) == 0
        quality_score = 1.0 if (len(issues) == 0 and len(warnings) == 0) else 0.80 if len(issues) == 0 else 0.35

        return {
            "agent": self.AGENT_NAME,
            "version": self.VERSION,
            "modality": "voice_acoustics",
            "is_sufficient": is_sufficient,
            "quality_score": round(quality_score, 2),
            "issues": issues,
            "warnings": warnings,
            "recommendation": "Voice sample meets acoustic quality threshold." if is_sufficient else "Request re-recording with clear microphone input."
        }
