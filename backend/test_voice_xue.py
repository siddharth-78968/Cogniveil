"""Test suite for Xue et al. Voice ML Model and Transparent Acoustic Feature Extraction."""

import unittest
import numpy as np
import io
import json
import os
import sys
import torch

sys.path.insert(0, os.path.dirname(__file__))
from xue_voice_model import MFCC_Extractor, XueTCN, xue_voice_service
from acoustic_features import AcousticFeatureExtractor, acoustic_feature_extractor


class TestXueVoiceModelAndAcoustics(unittest.TestCase):

    def setUp(self):
        # 16kHz audio sample of 5 seconds with 2 speech segments and 1 clear pause
        self.sr = 16000
        self.duration = 5.0
        self.t = np.linspace(0, self.duration, int(self.sr * self.duration), endpoint=False)
        self.test_audio = np.zeros(len(self.t), dtype=np.float32)
        # Segment 1: Speech (0.0s - 2.0s) ~200Hz fundamental + harmonics
        s1 = slice(0, int(2.0 * self.sr))
        self.test_audio[s1] = (
            0.6 * np.sin(2 * np.pi * 200 * self.t[s1]) +
            0.3 * np.sin(2 * np.pi * 400 * self.t[s1]) +
            0.05 * np.random.randn(len(self.t[s1]))
        )
        # Segment 2: Pause (2.0s - 3.2s, 1.2s pause)
        # Segment 3: Speech (3.2s - 5.0s) ~190Hz fundamental + harmonics
        s3 = slice(int(3.2 * self.sr), int(5.0 * self.sr))
        self.test_audio[s3] = (
            0.5 * np.sin(2 * np.pi * 190 * self.t[s3]) +
            0.25 * np.sin(2 * np.pi * 380 * self.t[s3]) +
            0.05 * np.random.randn(len(self.t[s3]))
        )

    def test_01_mfcc_extractor(self):
        """Verify MFCC extractor conforms to Xue specifications (13 cepstra, 26 filterbanks)."""
        extractor = MFCC_Extractor(samplerate=16000, numcep=13, nfilt=26)
        ceps = extractor(self.test_audio)
        self.assertEqual(ceps.ndim, 3)
        self.assertEqual(ceps.shape[0], 1)  # batch size
        self.assertEqual(ceps.shape[2], 13) # 13 cepstral coefficients
        self.assertGreater(ceps.shape[1], 100) # num_frames
        print(f"--> [PASS] MFCC extraction verified. Output shape: {ceps.shape}")

    def test_02_xue_tcn_architecture(self):
        """Verify XueTCN forward pass and CAM activation dimensions."""
        model = XueTCN(in_channels=13, num_classes=2)
        model.eval()
        x = torch.randn(1, 13, 200)
        with torch.no_grad():
            logits, act = model(x)
        self.assertEqual(logits.shape, (1, 2))
        self.assertEqual(act.shape[0], 1)
        self.assertEqual(act.shape[1], 512)
        print(f"--> [PASS] XueTCN forward pass verified: logits {logits.shape}, act {act.shape}")

    def test_03_xue_service_inference_and_saliency(self):
        """Verify complete Xue service inference, probability output, and CAM saliency regions."""
        res = xue_voice_service.analyze(self.test_audio, sample_rate=16000)
        self.assertTrue(res["available"])
        self.assertIn("Xue et al.", res["model_name"])
        self.assertIsInstance(res["risk_probability"], float)
        self.assertTrue(0.0 <= res["risk_probability"] <= 1.0)
        self.assertIsInstance(res["risk_percentage"], int)
        self.assertIn(res["risk_category"], ["Low Risk", "Moderate Risk", "Elevated Risk"])
        self.assertGreater(len(res["saliency_timeline"]), 10)
        self.assertIsInstance(res["model_salient_regions"], list)
        for reg in res["model_salient_regions"]:
            self.assertEqual(reg["label"], "Model-salient region")
            self.assertGreaterEqual(reg["end_sec"], reg["start_sec"])
        self.assertIn("does not constitute a medical diagnosis", res["disclaimer"])
        print(f"--> [PASS] Xue ML output: Risk = {res['risk_percentage']}%, Salient regions = {len(res['model_salient_regions'])}")

    def test_04_explicit_acoustic_features(self):
        """Verify independent calculation of measurable speech characteristics & voice stability."""
        res = acoustic_feature_extractor.extract(self.test_audio, transcript="first segment second segment")
        self.assertTrue(res["available"])
        speech = res["speech_characteristics"]
        stability = res["voice_stability"]

        # Pause checks: we inserted 1 long pause (1.2s)
        self.assertGreaterEqual(speech["num_pauses"], 1)
        self.assertGreater(speech["longest_pause_sec"], 0.8)
        self.assertGreater(speech["total_silence_sec"], 0.8)
        self.assertGreater(speech["speech_duration_sec"], 2.5)

        # Cadence
        self.assertIsInstance(speech["speech_rate_wpm"], (int, float))

        # Stability: Jitter, Shimmer, HNR, SNR
        self.assertTrue(stability["jitter_percent"].endswith("%"))
        self.assertTrue(stability["shimmer_percent"].endswith("%"))
        self.assertTrue(stability["hnr_db"].endswith("dB"))
        self.assertTrue(stability["audio_quality_snr"].endswith("dB"))

        # Interpretations
        self.assertGreaterEqual(len(res["interpretations"]), 3)
        for note in res["interpretations"]:
            self.assertIn("metric", note)
            self.assertIn("observation", note)
            # Must not claim dementia diagnosis
            self.assertNotIn("diagnose", note["observation"].lower())
            self.assertNotIn("dementia detected", note["observation"].lower())

        # Timeline
        self.assertGreater(len(res["timeline"]), 20)
        self.assertIn("is_speech", res["timeline"][0])
        self.assertIn("time_sec", res["timeline"][0])
        print(f"--> [PASS] Acoustic features extracted: Pauses={speech['num_pauses']}, AvgPause={speech['avg_pause_sec']}s, Jitter={stability['jitter_percent']}, HNR={stability['hnr_db']}")

    def test_05_unmeasurable_audio_graceful_handling(self):
        """Verify silence or corrupted audio displays 'Not reliably measurable' without crashing."""
        silent_audio = np.zeros(16000, dtype=np.float32)
        res = acoustic_feature_extractor.extract(silent_audio)
        self.assertFalse(res["available"])
        speech = res["speech_characteristics"]
        stability = res["voice_stability"]
        self.assertEqual(speech["num_pauses"], "Not reliably measurable")
        self.assertEqual(stability["jitter_percent"], "Not reliably measurable")
        self.assertEqual(stability["shimmer_percent"], "Not reliably measurable")
        self.assertEqual(stability["hnr_db"], "Not reliably measurable")
        print("--> [PASS] Silent audio safely returned 'Not reliably measurable' across all fields.")


if __name__ == "__main__":
    unittest.main()
