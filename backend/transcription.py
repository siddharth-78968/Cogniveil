"""Optional local multilingual ASR using faster-whisper.

The model is loaded lazily so a basic CogniVeil deployment still starts without
GPU support. Set WHISPER_MODEL (for example ``small``) and install the backend
requirements to enable server-side multilingual transcription.
"""
from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Any

_model = None
_load_error: str | None = None


def _get_model():
    global _model, _load_error
    if _model is not None or _load_error is not None:
        return _model
    try:
        from faster_whisper import WhisperModel
        _model = WhisperModel(
            os.getenv("WHISPER_MODEL", "small"),
            device=os.getenv("WHISPER_DEVICE", "cpu"),
            compute_type=os.getenv("WHISPER_COMPUTE_TYPE", "int8"),
        )
    except Exception as exc:  # dependency/model-download/configuration failures
        _load_error = str(exc)
    return _model


def transcribe(audio_bytes: bytes, suffix: str, language_hint: str | None = None) -> dict[str, Any]:
    """Return a transcript; never retain the uploaded audio after inference."""
    model = _get_model()
    if model is None:
        return {
            "available": False,
            "engine": "unavailable",
            "reason": "Server-side faster-whisper is not configured for this deployment.",
        }
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix or ".webm", delete=False) as handle:
            handle.write(audio_bytes)
            temp_path = Path(handle.name)
        segments, info = model.transcribe(
            str(temp_path),
            language=language_hint or None,
            vad_filter=True,
            beam_size=3,
        )
        transcript = " ".join(segment.text.strip() for segment in segments).strip()
        return {
            "available": True,
            "engine": f"faster-whisper:{os.getenv('WHISPER_MODEL', 'small')}",
            "transcript": transcript,
            "language_code": getattr(info, "language", language_hint or "en"),
            "language_probability": round(float(getattr(info, "language_probability", 0)), 3),
        }
    except Exception as exc:
        return {"available": False, "engine": "faster-whisper", "reason": f"Transcription failed: {exc}"}
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()
