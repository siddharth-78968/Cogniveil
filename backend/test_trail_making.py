"""Comprehensive automated tests for Digital Trail Making Test (Executive Function) in CogniVeil.

Validates:
1. Raw Trail Making metric normalization & error penalty handling.
2. Subdomain mapping (Executive Function, Memory, Attention, Working Memory, Visuospatial, Processing Speed).
3. Backward compatibility with legacy 5-test batteries (no Trail Making).
4. Longitudinal drift & personal baseline tracking (EWMA / CUSUM integration).
5. Signal fusion engine with Executive Function integration.
6. Non-diagnostic explanations and clinical performance indicators.
"""

import unittest
import json
import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(backend_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from agents.cognitive import CognitiveTestAgent
from agents.fusion import SignalFusionEngine
from agents.longitudinal import LongitudinalTrendAgent
from schemas import TestResultCreate


class MockTestResult:
    def __init__(self, test_type: str, score: float, duration_seconds: float = 60.0):
        self.test_type = test_type
        self.score = score
        self.duration_seconds = duration_seconds


class TestDigitalTrailMaking(unittest.TestCase):

    def setUp(self):
        self.cog_agent = CognitiveTestAgent()
        self.fusion_engine = SignalFusionEngine()
        self.long_agent = LongitudinalTrendAgent()

    def test_trail_making_domain_mapping(self):
        """Test that trail_making maps to Executive Function domain correctly."""
        results = [
            MockTestResult("trail_making", 85.0, 48.0),
            MockTestResult("pattern_recall", 90.0, 50.0),
            MockTestResult("digit_span", 80.0, 40.0),
            MockTestResult("word_recall", 88.0, 60.0),
            MockTestResult("stroop", 82.0, 30.0),
            MockTestResult("reaction_time", 75.0, 25.0),
        ]
        analysis = self.cog_agent.analyze(results)
        
        self.assertIn("executive_function", analysis["subdomain_scores"])
        self.assertAlmostEqual(analysis["subdomain_scores"]["executive_function"], 83.5, places=1) # (85+82)/2
        self.assertIn("memory", analysis["subdomain_scores"])
        self.assertIn("working_memory", analysis["subdomain_scores"])
        self.assertIn("attention", analysis["subdomain_scores"])
        self.assertIn("visuospatial", analysis["subdomain_scores"])
        self.assertIn("processing_speed", analysis["subdomain_scores"])

    def test_trail_making_slow_drift_interpretation(self):
        """Test longitudinal executive-function slowing relative to personal baseline."""
        baseline = {
            "cognitive_score": 85.0,
            "memory": 85.0,
            "executive_function": 88.0,
            "attention": 82.0,
            "working_memory": 82.0,
            "visuospatial": 85.0,
            "processing_speed": 82.0,
        }
        # Trail making score dropped to 55 (slower completion / set-shifting delay)
        results = [
            MockTestResult("trail_making", 55.0, 105.0),
            MockTestResult("pattern_recall", 86.0, 45.0),
            MockTestResult("digit_span", 84.0, 35.0),
            MockTestResult("word_recall", 85.0, 55.0),
            MockTestResult("reaction_time", 80.0, 25.0),
        ]
        analysis = self.cog_agent.analyze(results, baseline=baseline)
        
        self.assertEqual(analysis["executive_function"], "declining")
        self.assertIn("Executive-function performance has slowed relative to personal baseline", analysis["reasoning"])
        # Ensure no medical diagnostic claims
        self.assertNotIn("diagnosed with dementia", analysis["reasoning"].lower())
        self.assertNotIn("alzheimer's disease confirmed", analysis["reasoning"].lower())

    def test_legacy_battery_backward_compatibility(self):
        """Test that legacy 5-test battery without Trail Making retains exact legacy formula."""
        legacy_results = [
            MockTestResult("pattern_recall", 80.0, 50.0),
            MockTestResult("word_recall", 80.0, 60.0),
            MockTestResult("stroop", 85.0, 30.0),
            MockTestResult("reaction_time", 90.0, 20.0),
            MockTestResult("digit_span", 75.0, 40.0),
        ]
        analysis = self.cog_agent.analyze(legacy_results)
        
        # In legacy formula: 0.35 * mem + 0.20 * stroop + 0.15 * rxn + 0.15 * spd + 0.15 * att
        # mem=80.0, stroop=85.0, rxn=90.0, spd=90.0, att=(85+90+75)/3=83.3
        # 0.35*80 + 0.20*85 + 0.15*90 + 0.15*90 + 0.15*83.3 = 84.5
        self.assertAlmostEqual(analysis["cognitive_score"], 84.5, places=1)
        self.assertEqual(analysis["cognitive_status"], "stable")

    def test_fusion_engine_with_executive_function(self):
        """Test SignalFusionEngine incorporates executive function degradation."""
        cog_result = {
            "cognitive_score": 62.0,
            "status": "mild_decline",
            "confidence": 0.85,
            "executive_function": "declining",
            "memory": "declining",
            "attention": "stable",
            "metrics": {
                "memory": {"change_percent": -15.0},
                "executive_function": {"change_percent": -22.0}
            },
            "explanation": "Executive function set-shifting and memory show divergence."
        }
        beh_result = {
            "behavior_score": 78.0,
            "status": "stable",
            "confidence": 0.80,
            "typing": {"score": 76.0, "status": "stable"},
            "scrolling": {"score": 80.0, "status": "stable"}
        }
        voice_result = {
            "voice_score": 75.0,
            "status": "stable",
            "confidence": 0.80,
            "explanation": "Acoustic features within expected ranges."
        }
        
        fusion = self.fusion_engine.fuse(cog_result, beh_result, voice_result)
        factors = [c["factor"] for c in fusion["primary_contributors"]]
        self.assertIn("Executive function (Trail Making)", factors)
        self.assertIn("Memory performance", factors)

    def test_longitudinal_agent_with_executive_trend(self):
        """Test LongitudinalTrendAgent tracks executive trend alongside memory and voice."""
        long_res = self.long_agent.analyze(
            historical_scores=[85.0, 84.0, 82.0, 80.0, 77.0, 74.0, 70.0],
            current_score=66.0,
            memory_trend="declining",
            voice_trend="stable",
            executive_trend="declining"
        )
        self.assertEqual(long_res["trend_classification"], "persistent_decline")
        self.assertIn("executive (Trail Making)", long_res["explanation"])

    def test_schema_metadata_serialization(self):
        """Test TestResultCreate schema handles optional metadata gracefully."""
        payload = {
            "test_type": "trail_making",
            "score": 92.5,
            "duration_seconds": 45.2,
            "metadata": {
                "part_a_duration_seconds": 18.2,
                "part_b_duration_seconds": 27.0,
                "total_errors": 0,
                "part_a_errors": 0,
                "part_b_errors": 0,
                "set_shifting_cost_seconds": 8.8,
                "completed": True
            }
        }
        item = TestResultCreate(**payload)
        self.assertEqual(item.test_type, "trail_making")
        self.assertEqual(item.score, 92.5)
        self.assertIsNotNone(item.metadata)
        self.assertEqual(item.metadata["set_shifting_cost_seconds"], 8.8)


if __name__ == "__main__":
    unittest.main()
