"""VoiceAnalysisAgent for CogniVeil.

Decomposes acoustic biomarkers and speech linguistics into explicit subdomains:
  Speech Rate, Pause Pattern, Vocabulary Richness, Energy Stability, and Semantic Coherence.
Calculates % baseline comparisons and generates explainable non-diagnostic speech indicators.
"""

from typing import Dict, Any, Optional, List
import re


class VoiceAnalysisAgent:
    """Specialized agent analyzing acoustic speech biomarkers and language characteristics."""

    AGENT_NAME = "VoiceAnalysisAgent"
    VERSION = "2026.1"

    def analyze(self, features: Dict[str, Any], transcript: str = "", baseline: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Reason over acoustic parameters and transcript linguistics with subdomain breakdown.

        Returns:
            Structured speech cognitive indicator dictionary with sub-scores, % deltas, and reasoning.
        """
        # 1. Parameter Extraction
        duration = max(1.0, float(features.get("duration_seconds", 30.0)))
        activity_ratio = min(1.0, max(0.0, float(features.get("speech_activity_ratio", 0.65))))
        pause_count = int(features.get("pause_count", 6))
        pause_rate = float(features.get("pause_rate_per_minute", (pause_count / max(duration / 60.0, 0.25))))
        mean_pause_duration = float(features.get("mean_pause_duration", 0.85))
        long_pause_frequency = float(features.get("long_pause_frequency", pause_count * 0.3))
        mean_rms = float(features.get("mean_rms", 0.045))
        pitch_variability = float(features.get("pitch_variability", 28.5))

        words = re.findall(r"\b[\w']+\b", transcript, flags=re.UNICODE) if transcript else []
        word_count = len(words)
        wpm = float(features.get("words_per_minute", round((word_count / duration) * 60, 1) if word_count > 0 else 115.0))

        # Lexical Richness
        unique_words = set(w.lower() for w in words)
        lexical_diversity = round(len(unique_words) / max(word_count, 1), 3) if word_count > 0 else 0.72
        vocabulary_richness = float(features.get("vocabulary_richness", lexical_diversity))

        # Word-finding indicators
        filler_tokens = {"uh", "um", "ah", "er", "erm", "like", "matlab", "yani", "hmm"}
        filler_count = sum(1 for w in words if w.lower() in filler_tokens)
        filler_pct = round((filler_count / max(word_count, 1)) * 100.0, 1)
        word_finding_index = round(min(1.0, (filler_pct / 15.0) * 0.4 + (long_pause_frequency / 10.0) * 0.4), 2)

        # Baseline References
        base_wpm = float(baseline.get("wpm", 125.0)) if baseline else 125.0
        base_pause_rate = float(baseline.get("pause_rate", 8.0)) if baseline else 8.0
        base_richness = float(baseline.get("vocabulary_richness", 0.70)) if baseline else 0.70
        base_rms = float(baseline.get("mean_rms", 0.045)) if baseline else 0.045

        # Calculate % changes
        wpm_delta_pct = round(((wpm - base_wpm) / max(base_wpm, 1.0)) * 100.0, 1)
        pause_delta_pct = round(((pause_rate - base_pause_rate) / max(base_pause_rate, 0.1)) * 100.0, 1)
        richness_delta_pct = round(((vocabulary_richness - base_richness) / max(base_richness, 0.1)) * 100.0, 1)
        rms_delta_pct = round(((mean_rms - base_rms) / max(base_rms, 0.001)) * 100.0, 1)

        # Explicit Subdomain Scores (0-100 scale)
        # 1. Speech Rate Score
        speech_rate_score = round(max(0.0, min(100.0, 100.0 - abs(wpm - 120.0) * 0.7)), 1)
        # 2. Pause Pattern Score
        pause_pattern_score = round(max(0.0, min(100.0, 100.0 - (pause_rate * 5.0) - (mean_pause_duration * 12.0))), 1)
        # 3. Vocabulary / Lexical Score
        vocab_score = round(max(0.0, min(100.0, vocabulary_richness * 120.0 - (filler_pct * 1.5))), 1)
        # 4. Energy Stability Score
        energy_score = round(max(0.0, min(100.0, min(activity_ratio * 125.0, 100.0))), 1)
        # 5. Semantic Coherence Score
        coherence_score = round(max(0.0, min(100.0, 100.0 - (word_finding_index * 35.0))), 1)

        # Composite Voice Score (0-100)
        voice_score = round(
            0.30 * speech_rate_score +
            0.25 * pause_pattern_score +
            0.20 * vocab_score +
            0.15 * energy_score +
            0.10 * coherence_score,
            1
        )

        # Status & Trend
        if pause_delta_pct > 35.0 or wpm_delta_pct < -18.0:
            speech_status = "elevated_concern"
            trend = "persistent_decline"
        elif pause_delta_pct > 15.0 or wpm_delta_pct < -10.0:
            speech_status = "mild_concern"
            trend = "mild_deviation"
        else:
            speech_status = "normal"
            trend = "stable"

        confidence = round(min(0.96, 0.70 + 0.15 * min(duration / 30.0, 1.0) + 0.10 * float(features.get("transcription_confidence", 0.9))), 2)
        risk_level = "Low" if voice_score >= 65 else "Moderate" if voice_score >= 40 else "High"
        detected_language = str(features.get("detected_language", "English"))

        # Subdomain Metrics Table
        metrics_table = {
            "speech_rate": {
                "score": speech_rate_score, "current": f"{wpm:.1f} WPM", "baseline": f"{base_wpm:.1f} WPM",
                "change_percent": wpm_delta_pct, "interpretation": f"↓ {abs(wpm_delta_pct):.1f}%" if wpm_delta_pct < 0 else f"↑ {wpm_delta_pct:.1f}%"
            },
            "pause_pattern": {
                "score": pause_pattern_score, "current": f"{pause_rate:.1f}/min", "baseline": f"{base_pause_rate:.1f}/min",
                "change_percent": pause_delta_pct, "interpretation": f"↑ {pause_delta_pct:.1f}%" if pause_delta_pct > 0 else f"↓ {abs(pause_delta_pct):.1f}%"
            },
            "vocabulary_richness": {
                "score": vocab_score, "current": f"{vocabulary_richness:.2f}", "baseline": f"{base_richness:.2f}",
                "change_percent": richness_delta_pct, "interpretation": f"↓ {abs(richness_delta_pct):.1f}%" if richness_delta_pct < 0 else f"↑ {richness_delta_pct:.1f}%"
            },
            "energy_stability": {
                "score": energy_score, "current": f"{round(activity_ratio*100)}% active", "baseline": "70% active",
                "change_percent": 0.0, "interpretation": "Stable"
            },
            "semantic_coherence": {
                "score": coherence_score, "current": "Coherent", "baseline": "Coherent",
                "change_percent": 0.0, "interpretation": "Stable"
            }
        }

        # Non-diagnostic Reasoning
        if speech_status == "elevated_concern":
            reasoning = (
                f"Speech rate ({metrics_table['speech_rate']['interpretation']}) and pause frequency "
                f"({metrics_table['pause_pattern']['interpretation']}) have shifted from baseline, "
                f"while semantic coherence remains relatively stable ({coherence_score}/100). "
                f"The resulting voice score ({voice_score}/100) indicates elevated acoustic deviation without representing an isolated diagnosis."
            )
        elif speech_status == "mild_concern":
            reasoning = (
                f"Speech biomarkers show subtle conversational variation (Voice Score: {voice_score}/100), "
                f"with mild pause elongation while speech cadence remains functional."
            )
        else:
            reasoning = (
                f"Conversational speech rate ({wpm:.1f} WPM) and acoustic pause patterns remain well aligned with personal baseline norms."
            )

        return {
            "agent": self.AGENT_NAME,
            "version": self.VERSION,
            "voice_score": voice_score,
            "score": voice_score,
            "speech_status": speech_status,
            "status": speech_status,
            "trend": trend,
            "confidence": confidence,
            "risk_level": risk_level,
            "detected_language": detected_language,
            "duration_seconds": duration,
            "words_per_minute": wpm,
            "pause_rate_per_minute": round(pause_rate, 1),
            "speech_activity_ratio": round(activity_ratio, 3),
            "vocabulary_richness": vocabulary_richness,
            "transcript_available": bool(transcript.strip()),
            "subdomain_scores": {
                "speech_rate": speech_rate_score,
                "pause_pattern": pause_pattern_score,
                "vocabulary": vocab_score,
                "energy_stability": energy_score,
                "semantic_coherence": coherence_score
            },
            "metrics": metrics_table,
            "explanation": reasoning,
            "reasoning": reasoning,
            "acoustic_biomarkers": {
                "duration_seconds": duration,
                "words_per_minute": wpm,
                "pause_rate_per_min": pause_rate,
                "mean_pause_duration_sec": mean_pause_duration,
                "long_pause_frequency": long_pause_frequency,
                "speech_activity_ratio": activity_ratio,
                "mean_rms_energy": mean_rms,
                "pitch_variability_hz": pitch_variability,
                "vocabulary_richness": vocabulary_richness,
                "transcription_confidence": float(features.get("transcription_confidence", 0.9))
            }
        }
