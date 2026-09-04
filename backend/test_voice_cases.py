"""Verification script for the 5 conceptual speech cases in CogniVeil Voice Analysis Pipeline."""

import io
import json
import numpy as np
import scipy.io.wavfile as wavfile
from agents.voice import VoiceAnalysisAgent
from services.voice_analysis import evaluate_evidence_quality

def generate_synthetic_audio(duration: float, speech_intervals: list, sr: int = 16000) -> np.ndarray:
    """Generate 16kHz mono audio with voiced harmonics during speech intervals and silence otherwise."""
    total_samples = int(duration * sr)
    audio = np.zeros(total_samples, dtype=np.float32)
    t = np.linspace(0, duration, total_samples, endpoint=False)
    
    for (start_s, end_s, f0) in speech_intervals:
        s_idx = int(start_s * sr)
        e_idx = min(total_samples, int(end_s * sr))
        t_sub = t[s_idx:e_idx]
        # Voiced harmonic signal + light white noise
        audio[s_idx:e_idx] = (
            0.5 * np.sin(2 * np.pi * f0 * t_sub) +
            0.25 * np.sin(2 * np.pi * 2 * f0 * t_sub) +
            0.12 * np.sin(2 * np.pi * 3 * f0 * t_sub) +
            0.02 * np.random.randn(len(t_sub))
        )
    return audio

def main():
    agent = VoiceAnalysisAgent()
    print("=" * 70)
    print("COGNIVEIL VOICE ANALYSIS PIPELINE VERIFICATION SUITE")
    print("=" * 70)

    # -------------------------------------------------------------
    # Case A: Normal continuous speech (~15s, 35 words, 75% active, few pauses)
    # -------------------------------------------------------------
    print("\n--- CASE A: Normal Continuous Speech ---")
    audio_a = generate_synthetic_audio(
        duration=15.0,
        speech_intervals=[(0.5, 4.5, 200), (5.0, 9.5, 195), (10.0, 14.5, 205)]
    )
    transcript_a = (
        "Yesterday morning I woke up early made a fresh cup of coffee walked through the quiet park "
        "and read a chapter of my favourite history book before starting work."
    )
    res_a = agent.analyze(
        features={
            "duration_seconds": 15.0,
            "speech_activity_ratio": 0.85,
            "pause_count": 3,
            "pause_durations_ms": [500, 500],
            "mean_rms": 0.048,
            "pitch_variability": 24.5,
        },
        transcript=transcript_a
    )
    print(f"Result A -> Score: {res_a['voice_score']}, ML Prob: {res_a['speech_ml_model']['probability']}, EQ: {res_a['evidence_quality']}")

    # -------------------------------------------------------------
    # Case B: Speech with several intentional long pauses (15s, 10 words, 35% active, long pauses)
    # -------------------------------------------------------------
    print("\n--- CASE B: Speech with Several Long Pauses ---")
    audio_b = generate_synthetic_audio(
        duration=15.0,
        speech_intervals=[(0.5, 2.0, 180), (4.5, 6.0, 185), (9.0, 10.5, 180), (13.5, 14.5, 175)]
    )
    transcript_b = "I woke up... then I had... some breakfast... and walked outside."
    res_b = agent.analyze(
        features={
            "duration_seconds": 15.0,
            "speech_activity_ratio": 0.35,
            "pause_count": 6,
            "pause_durations_ms": [2500, 3000, 3000],
            "mean_rms": 0.025,
            "pitch_variability": 15.0,
        },
        transcript=transcript_b
    )
    print(f"Result B -> Score: {res_b['voice_score']}, ML Prob: {res_b['speech_ml_model']['probability']}, EQ: {res_b['evidence_quality']}")

    # -------------------------------------------------------------
    # Case C: Very short speech / 1 word in 12s (12s, 1 word "Hello.")
    # -------------------------------------------------------------
    print("\n--- CASE C: Very Short Speech / 1 Word in 12s ---")
    audio_c = generate_synthetic_audio(
        duration=12.0,
        speech_intervals=[(1.0, 1.8, 210)]
    )
    transcript_c = "Hello."
    res_c = agent.analyze(
        features={
            "duration_seconds": 12.0,
            "speech_activity_ratio": 0.07,
            "pause_count": 1,
            "pause_durations_ms": [10200],
            "mean_rms": 0.012,
            "pitch_variability": 5.0,
        },
        transcript=transcript_c
    )
    print(f"Result C -> Score: {res_c['voice_score']}, ML Prob: {res_c['speech_ml_model']['probability']}, EQ: {res_c['evidence_quality']}")

    # -------------------------------------------------------------
    # Case D: Speech with many filler words and hesitations (15s, 25 words, high filler %)
    # -------------------------------------------------------------
    print("\n--- CASE D: Speech with Many Fillers & Hesitations ---")
    audio_d = generate_synthetic_audio(
        duration=15.0,
        speech_intervals=[(0.5, 3.5, 190), (4.5, 8.0, 195), (9.0, 14.0, 185)]
    )
    transcript_d = "Um uh I think like yesterday you know um I went to the er store and um bought some uh apples."
    res_d = agent.analyze(
        features={
            "duration_seconds": 15.0,
            "speech_activity_ratio": 0.70,
            "pause_count": 4,
            "pause_durations_ms": [1000, 1000],
            "mean_rms": 0.038,
            "pitch_variability": 20.0,
        },
        transcript=transcript_d
    )
    print(f"Result D -> Score: {res_d['voice_score']}, ML Prob: {res_d['speech_ml_model']['probability']}, EQ: {res_d['evidence_quality']}, Hesitation: {res_d['linguistic_metrics']['filler_frequency_pct']}%")

    # -------------------------------------------------------------
    # Case E: Longer fluent speech (25s, 60 words, 85% active)
    # -------------------------------------------------------------
    print("\n--- CASE E: Longer Fluent Speech ---")
    audio_e = generate_synthetic_audio(
        duration=25.0,
        speech_intervals=[(0.5, 6.0, 205), (6.5, 12.0, 200), (12.5, 18.0, 205), (18.5, 24.5, 200)]
    )
    transcript_e = (
        "Every Sunday I enjoy preparing a traditional family meal using fresh vegetables and aromatic spices. "
        "I begin by chopping onions, garlic, and fresh herbs, then gently simmering the sauce over low heat "
        "while baking fresh bread for everyone to share together at dinner."
    )
    res_e = agent.analyze(
        features={
            "duration_seconds": 25.0,
            "speech_activity_ratio": 0.88,
            "pause_count": 3,
            "pause_durations_ms": [500, 500, 500],
            "mean_rms": 0.052,
            "pitch_variability": 26.0,
        },
        transcript=transcript_e
    )
    print(f"Result E -> Score: {res_e['voice_score']}, ML Prob: {res_e['speech_ml_model']['probability']}, EQ: {res_e['evidence_quality']}")

    print("\n" + "=" * 70)
    print("ALL 5 CASES EVALUATED SUCCESSFULLY")
    print("=" * 70)

if __name__ == "__main__":
    main()
