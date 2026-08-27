"""VoiceAnalysisAgent for CogniVeil.

Interprets objective acoustic biomarkers and linguistic indices extracted from
voice sessions. Formulates speech-related cognitive indicator assessments while
strictly observing non-diagnostic clinical boundaries.
"""

from typing import Dict, Any, Optional, List
import re


class VoiceAnalysisAgent:
    """Specialized agent analyzing acoustic speech biomarkers and language characteristics."""

    AGENT_NAME = "VoiceAnalysisAgent"
    VERSION = "2026.1"

    def analyze(self, features: Dict[str, Any], transcript: str = "", baseline: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Reason over acoustic parameters and transcript linguistics.

        Args:
            features: Objective acoustic parameters (activity ratio, pause rates, RMS, pitch).
            transcript: Transcribed text if available.
            baseline: User's historical voice performance baselines.

        Returns:
            Structured speech cognitive indicator dictionary.
        """
        # 1. Acoustic Parameters Extraction
        duration = max(1.0, float(features.get("duration_seconds", 30.0)))
        activity_ratio = min(1.0, max(0.0, float(features.get("speech_activity_ratio", 0.65))))
        pause_count = int(features.get("pause_count", 6))
        pause_rate = float(features.get("pause_rate_per_minute", (pause_count / max(duration / 60.0, 0.25))))
        mean_pause_duration = float(features.get("mean_pause_duration", 0.85))
        long_pause_frequency = float(features.get("long_pause_frequency", pause_count * 0.3))
        mean_rms = float(features.get("mean_rms", 0.045))
        pitch_variability = float(features.get("pitch_variability", 28.5))

        # 2. Linguistic & Lexical Extraction from Transcript
        words = re.findall(r"\b[\w']+\b", transcript, flags=re.UNICODE) if transcript else []
        word_count = len(words)
        wpm = float(features.get("words_per_minute", round((word_count / duration) * 60, 1) if word_count > 0 else 115.0))
        
        # Filler words detection (e.g. uh, um, ah, err, matlab, like, you know)
        filler_tokens = {"uh", "um", "ah", "er", "erm", "like", "matlab", "yani", "hmm"}
        filler_count = sum(1 for w in words if w.lower() in filler_tokens)
        filler_frequency = round((filler_count / max(word_count, 1)) * 100, 2)

        # Lexical Diversity & Vocabulary Richness (Type-Token Ratio / TTR)
        unique_words = set(w.lower() for w in words)
        lexical_diversity = round(len(unique_words) / max(word_count, 1), 3) if word_count > 0 else 0.72
        vocabulary_richness = float(features.get("vocabulary_richness", lexical_diversity))

        # Word-Finding Difficulty & Repetitions
        repetition_count = 0
        for i in range(len(words) - 1):
            if words[i].lower() == words[i+1].lower():
                repetition_count += 1
        repetition_frequency = round((repetition_count / max(word_count, 1)) * 100, 2)
        
        word_finding_index = round(min(1.0, (filler_frequency / 15.0) * 0.4 + (long_pause_frequency / 10.0) * 0.4 + (repetition_frequency / 10.0) * 0.2), 2)
        semantic_coherence = "stable" if word_finding_index < 0.60 else "mild_hesitation"
        sentence_complexity = "moderate" if (word_count / max(len(re.split(r'[.!?]+', transcript)) if transcript else 1, 1)) > 6 else "simple"
        transcription_confidence = float(features.get("transcription_confidence", 0.91))
        detected_language = str(features.get("detected_language", "English"))

        # Baseline Comparison
        base_wpm = float(baseline.get("wpm", 125.0)) if baseline else 125.0
        base_pause_rate = float(baseline.get("pause_rate", 8.0)) if baseline else 8.0
        base_richness = float(baseline.get("vocabulary_richness", 0.70)) if baseline else 0.70

        # Pattern Interpretations
        # Pause Pattern
        if pause_rate > base_pause_rate * 1.35 or mean_pause_duration > 1.3:
            pause_pattern = "increased"
        elif pause_rate < base_pause_rate * 0.8:
            pause_pattern = "decreased"
        else:
            pause_pattern = "stable"

        # Speech Rate
        wpm_delta = (wpm - base_wpm) / max(base_wpm, 1.0)
        if wpm_delta < -0.18:
            speech_rate = "below_baseline"
        elif wpm_delta > 0.15:
            speech_rate = "above_baseline"
        else:
            speech_rate = "stable"

        # Lexical Richness Trend
        if vocabulary_richness < base_richness - 0.12 or word_finding_index > 0.65:
            lexical_richness = "declining"
        elif vocabulary_richness > base_richness + 0.08:
            lexical_richness = "expanding"
        else:
            lexical_richness = "stable"

        # Overall Speech Status
        concern_signals = 0
        if pause_pattern == "increased": concern_signals += 1
        if speech_rate == "below_baseline": concern_signals += 1
        if lexical_richness == "declining": concern_signals += 1
        if word_finding_index > 0.55: concern_signals += 1

        if concern_signals >= 3:
            speech_status = "elevated_concern"
            trend = "persistent"
        elif concern_signals >= 1:
            speech_status = "mild_concern"
            trend = "transient"
        else:
            speech_status = "normal"
            trend = "stable"

        # Voice Quality & Biomarker Score (0-100 scale)
        activity_score = min(100.0, activity_ratio * 120.0)
        pause_score = max(0.0, 100.0 - pause_rate * 5.0)
        cadence_score = max(0.0, min(100.0, 100.0 - abs(wpm - 120.0) * 0.6))
        voice_score = round(max(0.0, min(100.0, 0.40 * activity_score + 0.35 * pause_score + 0.25 * cadence_score)), 1)

        confidence = round(min(0.95, 0.65 + 0.20 * min(duration / 30.0, 1.0) + 0.10 * transcription_confidence), 2)

        # Generate Non-Diagnostic Explanation
        if speech_status == "elevated_concern":
            explanation = (
                f"Elevated speech-related cognitive indicators observed: cadence is below baseline ({wpm:.1f} WPM vs {base_wpm:.1f} target) "
                f"with increased inter-phrase pause rate ({pause_rate:.1f}/min) and elevated word-search latency."
            )
        elif speech_status == "mild_concern":
            explanation = (
                f"Mild acoustic variation noted in conversational flow, with subtle pause elongation ({mean_pause_duration:.2f}s mean duration) "
                f"while semantic coherence remains intact."
            )
        else:
            explanation = (
                f"Conversational speech biomarkers within normal baseline parameters. Fluent articulation ({wpm:.1f} WPM) "
                f"and healthy lexical richness ({vocabulary_richness:.2f}) observed."
            )

        return {
            "agent": self.AGENT_NAME,
            "version": self.VERSION,
            "speech_status": speech_status,
            "pause_pattern": pause_pattern,
            "speech_rate": speech_rate,
            "lexical_richness": lexical_richness,
            "semantic_coherence": semantic_coherence,
            "sentence_complexity": sentence_complexity,
            "trend": trend,
            "confidence": confidence,
            "voice_score": voice_score,
            "detected_language": detected_language,
            "word_finding_difficulty_index": word_finding_index,
            "explanation": explanation,
            "acoustic_biomarkers": {
                "duration_seconds": duration,
                "words_per_minute": wpm,
                "pause_rate_per_min": pause_rate,
                "mean_pause_duration_sec": mean_pause_duration,
                "long_pause_frequency": long_pause_frequency,
                "speech_activity_ratio": activity_ratio,
                "mean_rms_energy": mean_rms,
                "pitch_variability_hz": pitch_variability,
                "filler_frequency_pct": filler_frequency,
                "repetition_frequency_pct": repetition_frequency,
                "vocabulary_richness": vocabulary_richness,
                "transcription_confidence": transcription_confidence
            }
        }
