#!/usr/bin/env python3
"""CogniVeil Model Context Protocol (MCP) Server.

Provides a standard JSON-RPC 2.0 stdio interface exposing CogniVeil's 18 modular
clinical screening tools, multi-agent reasoning engines, and safety guardrails
to external AI agents and MCP hosts (Claude Desktop, Cursor, Antigravity, etc.).
"""
from __future__ import annotations

import json
import sys
import os

# Ensure backend path is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import mcp_tools

TOOLS = [
    {
        "name": "01_validate_input",
        "description": "Validates completeness and consistency of clinical screening data and provenance flags.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "data": {"type": "object", "description": "Clinical parameters."}
            },
            "required": ["data"]
        }
    },
    {
        "name": "02_collect_baseline",
        "description": "Tracks the 7-day initial baseline calibration period and suppresses early drift alarms.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "historical_scores": {"type": "array", "items": {"type": "number"}},
                "target_days": {"type": "integer", "default": 7}
            }
        }
    },
    {
        "name": "03_score_tier1",
        "description": "Calculates fused Tier 1 CogniScore and checks EWMA / CUSUM longitudinal deviation.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "active_scores": {"type": "array", "items": {"type": "number"}},
                "signals": {"type": "object"},
                "historical_scores": {"type": "array", "items": {"type": "number"}}
            }
        }
    },
    {
        "name": "04_analyze_cognitive_tests",
        "description": "Deep psychometric pattern analysis across Memory, Attention, Speed, and Executive subdomains.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "test_results": {"type": "array", "items": {"type": "object"}}
            }
        }
    },
    {
        "name": "05_analyze_typing",
        "description": "Evaluates keystroke dynamics, inter-key latency variance, and correction rates.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "typing_data": {"type": "object"}
            },
            "required": ["typing_data"]
        }
    },
    {
        "name": "06_analyze_scrolling",
        "description": "Evaluates navigation velocity, pause hesitation index, and trajectory reversals.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "scroll_data": {"type": "object"}
            },
            "required": ["scroll_data"]
        }
    },
    {
        "name": "07_detect_language",
        "description": "Identifies spoken vernacular language across 7 supported dialects for Voice Journal.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string"},
                "sample_id": {"type": "string"}
            }
        }
    },
    {
        "name": "08_analyze_voice",
        "description": "Interprets speech acoustic biomarkers, pause patterns, and lexical richness.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "features": {"type": "object"},
                "transcript": {"type": "string"},
                "language_hint": {"type": "string", "default": "en"}
            },
            "required": ["features"]
        }
    },
    {
        "name": "09_analyze_longitudinal_trend",
        "description": "Tracks multi-day trajectory slopes, CUSUM drift accumulation, and trend persistence.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "historical_scores": {"type": "array", "items": {"type": "number"}},
                "current_score": {"type": "number"},
                "voice_trend": {"type": "string", "default": "stable"},
                "typing_trend": {"type": "string", "default": "stable"},
                "memory_trend": {"type": "string", "default": "stable"}
            },
            "required": ["current_score"]
        }
    },
    {
        "name": "10_predict_risk",
        "description": "Executes CatBoost Tier 2 ML dementia risk classification with SHAP local explanations.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "patient_data": {"type": "object"}
            },
            "required": ["patient_data"]
        }
    },
    {
        "name": "11_classify_mri",
        "description": "Evaluates conditional neuroimaging scan (ResNet-18) with Grad-CAM visual heatmaps.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "filename": {"type": "string", "default": "brain_mri.jpg"}
            }
        }
    },
    {
        "name": "12_calculate_morphometry",
        "description": "Extracts quantitative volumetric morphometry parameters from neuroimaging analysis.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "mri_result": {"type": "object"}
            },
            "required": ["mri_result"]
        }
    },
    {
        "name": "13_retrieve_guideline",
        "description": "RAG retrieval of clinical guidance from NIA-AA 2024, WHO ICOPE, and AAN guidelines.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "default": "referral criteria"},
                "risk_level": {"type": "string", "default": "Moderate"}
            }
        }
    },
    {
        "name": "14_synthesize_evidence",
        "description": "Assembles grounded multimodal evidence items [E1..E6] across all screening tiers.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "patient_name": {"type": "string"},
                "age": {"type": "integer"},
                "tier1_summary": {"type": "object"},
                "longitudinal_summary": {"type": "object"}
            },
            "required": ["patient_name", "age", "tier1_summary", "longitudinal_summary"]
        }
    },
    {
        "name": "15_draft_report",
        "description": "Synthesizes MedGemma-4B structured clinical decision support narrative.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "patient_name": {"type": "string"},
                "age": {"type": "integer"},
                "cogni_score": {"type": "number"},
                "risk_level": {"type": "string"},
                "is_deviating": {"type": "boolean"},
                "shap_features": {"type": "array", "items": {"type": "object"}},
                "mri_result": {"type": "object"}
            },
            "required": ["patient_name", "cogni_score", "risk_level"]
        }
    },
    {
        "name": "16_check_output_safety",
        "description": "Guardrail scanner enforcing non-diagnostic screening disclaimers and sanitizing forbidden claims.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "narrative": {"type": "string"}
            },
            "required": ["narrative"]
        }
    },
    {
        "name": "17_generate_referral",
        "description": "Determines clinical referral action, urgency, and recommended specialist pathway.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "risk_level": {"type": "string"},
                "is_deviating": {"type": "boolean", "default": False},
                "active_score": {"type": "number", "default": 50.0}
            },
            "required": ["risk_level"]
        }
    },
    {
        "name": "18_log_audit",
        "description": "Persists structured audit event with decision path traceability.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_id": {"type": "integer"},
                "tool_name": {"type": "string"},
                "input_data": {"type": "object"},
                "output_data": {"type": "object"}
            },
            "required": ["tool_name", "input_data", "output_data"]
        }
    },
    {
        "name": "check_subgroup_fairness",
        "description": "Evaluates demographic parity and equal opportunity metrics across cohorts.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    }
]


class DummyScore:
    def __init__(self, score: float):
        self.score = score


class DummyTest:
    def __init__(self, score: float, test_type: str = "general", duration_seconds: float = 60.0):
        self.score = score
        self.test_type = test_type
        self.duration_seconds = duration_seconds


def call_tool(name: str, args: dict) -> dict:
    clean_name = name.replace("01_", "").replace("02_", "").replace("03_", "").replace("04_", "").replace("05_", "").replace("06_", "").replace("07_", "").replace("08_", "").replace("09_", "").replace("10_", "").replace("11_", "").replace("12_", "").replace("13_", "").replace("14_", "").replace("15_", "").replace("16_", "").replace("17_", "").replace("18_", "")

    if clean_name == "validate_input":
        return mcp_tools.validate_input(args.get("data", {}))

    elif clean_name == "collect_baseline":
        raw_hist = args.get("historical_scores", [])
        hist = [DummyScore(s) for s in raw_hist]
        return mcp_tools.collect_baseline(hist, target_days=args.get("target_days", 7))

    elif clean_name == "score_tier1":
        active_scores = args.get("active_scores", [75.0])
        tests = [DummyTest(s) for s in active_scores]
        signals = []
        raw_hist = args.get("historical_scores", [])
        hist = [DummyScore(s) for s in raw_hist]
        return mcp_tools.score_tier1(tests, signals, hist)

    elif clean_name == "analyze_cognitive_tests":
        return mcp_tools.analyze_cognitive_tests(args.get("test_results", []))

    elif clean_name == "analyze_typing":
        return mcp_tools.analyze_typing(args.get("typing_data", {}))

    elif clean_name == "analyze_scrolling":
        return mcp_tools.analyze_scrolling(args.get("scroll_data", {}))

    elif clean_name == "detect_language":
        return mcp_tools.detect_language(text=args.get("text"), sample_id=args.get("sample_id"))

    elif clean_name == "analyze_voice" or clean_name == "analyse_voice":
        return mcp_tools.analyze_voice(
            features=args.get("features", {}),
            transcript=args.get("transcript", ""),
            language_hint=args.get("language_hint", "en")
        )

    elif clean_name == "analyze_longitudinal_trend":
        raw_hist = args.get("historical_scores", [])
        hist = [DummyScore(s) for s in raw_hist]
        return mcp_tools.analyze_longitudinal_trend(
            historical_scores=hist,
            current_score=args.get("current_score", 65.0),
            voice_trend=args.get("voice_trend", "stable"),
            typing_trend=args.get("typing_trend", "stable"),
            memory_trend=args.get("memory_trend", "stable")
        )

    elif clean_name == "predict_risk":
        return mcp_tools.predict_risk(data=args.get("patient_data") or args.get("data", {}))

    elif clean_name == "classify_mri":
        return mcp_tools.classify_mri(filename=args.get("filename", "mri_scan.dcm"))

    elif clean_name == "calculate_morphometry":
        return mcp_tools.calculate_morphometry(mri_result=args.get("mri_result", {}))

    elif clean_name == "retrieve_guideline":
        return mcp_tools.retrieve_guideline(
            query=args.get("query", "referral criteria"),
            risk_level=args.get("risk_level", "Moderate")
        )

    elif clean_name == "synthesize_evidence":
        return mcp_tools.synthesize_evidence(
            patient_name=args.get("patient_name", "Patient"),
            age=args.get("age", 68),
            tier1_summary=args.get("tier1_summary", {}),
            longitudinal_summary=args.get("longitudinal_summary", {}),
            cognitive_summary=args.get("cognitive_summary"),
            behavior_summary=args.get("behavior_summary"),
            voice_summary=args.get("voice_summary"),
            tier2_result=args.get("tier2_result"),
            mri_result=args.get("mri_result"),
            guidelines=args.get("guidelines")
        )

    elif clean_name == "draft_report":
        return {
            "report": mcp_tools.draft_report(
                patient_name=args.get("patient_name", "Patient"),
                age=args.get("age", 68),
                cogni_score=args.get("cogni_score", 70.0),
                risk_level=args.get("risk_level", "Moderate"),
                is_deviating=args.get("is_deviating", False),
                shap_features=args.get("shap_features"),
                mri_result=args.get("mri_result"),
                guidelines=args.get("guidelines")
            )
        }

    elif clean_name == "check_output_safety":
        return mcp_tools.check_output_safety(narrative=args.get("narrative", ""))

    elif clean_name == "generate_referral":
        return mcp_tools.generate_referral(
            risk_level=args.get("risk_level", "Moderate"),
            is_deviating=args.get("is_deviating", False),
            active_score=args.get("active_score", 50.0),
            shap_features=args.get("shap_features")
        )

    elif clean_name == "log_audit":
        return mcp_tools.audit_agent.record_event(
            db=None,
            user_id=args.get("user_id"),
            agent_name="MCPHost",
            tool_name=args.get("tool_name", "generic_call"),
            input_data=args.get("input_data", {}),
            output_data=args.get("output_data", {})
        )

    elif clean_name == "check_subgroup_fairness":
        return mcp_tools.check_subgroup_fairness()

    else:
        raise ValueError(f"Unknown tool: {name}")


def handle_request(req: dict) -> dict:
    req_id = req.get("id")
    method = req.get("method")
    params = req.get("params", {})

    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {"tools": TOOLS}
        }

    elif method == "tools/call":
        tool_name = params.get("name")
        tool_args = params.get("arguments", {})
        try:
            result = call_tool(tool_name, tool_args)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(result, indent=2)
                        }
                    ]
                }
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32603, "message": str(e)}
            }

    elif method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {
                    "name": "cogniveil-mcp-server",
                    "version": "2026.1"
                }
            }
        }

    else:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": f"Method not found: {method}"}
        }


def main():
    """Stdio JSON-RPC loop."""
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            res = handle_request(req)
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()
        except json.JSONDecodeError as e:
            err_res = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": f"Parse error: {e}"}
            }
            sys.stdout.write(json.dumps(err_res) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
