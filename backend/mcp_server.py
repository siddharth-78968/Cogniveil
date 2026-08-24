#!/usr/bin/env python3
"""CogniVeil Model Context Protocol (MCP) Server.

Provides a standard JSON-RPC 2.0 stdio interface exposing CogniVeil's
clinical screening tools, EWMA deviation tracking, and CatBoost/MedGemma models
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
        "name": "validate_input",
        "description": "Validates completeness and consistency of incoming clinical and screening data (age bounds, score ranges, provenance flags).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "data": {
                    "type": "object",
                    "description": "Dictionary of clinical and screening parameters (Age, CognitiveScore, APOE_e4, etc.)."
                }
            },
            "required": ["data"]
        }
    },
    {
        "name": "score_tier1",
        "description": "Calculates Tier 1 active and passive scores and computes EWMA/CUSUM tracking signals against historical baseline to detect cognitive drift.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "active_scores": {
                    "type": "array",
                    "items": {"type": "number"},
                    "description": "List of active test scores from current session (0-100)."
                },
                "signals": {
                    "type": "object",
                    "description": "Passive digital biomarkers (typing_speed, backspace_rate, scroll_hesitation)."
                },
                "historical_scores": {
                    "type": "array",
                    "items": {"type": "number"},
                    "description": "List of prior historical CogniScore values for baseline calculation."
                }
            }
        }
    },
    {
        "name": "detect_language",
        "description": "Identifies vernacular language in speech/text for Voice Journal routing (English, Hindi, Tamil, Telugu, Marathi, Bengali, Spanish).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Spoken or transcribed text sample."},
                "sample_id": {"type": "string", "description": "Optional audio sample identifier."}
            }
        }
    },
    {
        "name": "analyse_voice",
        "description": "Scores measurable acoustic biomarkers (speech activity ratio, pause rate, WPM, vocabulary richness) using validated logistic regression model or exploratory metrics.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "features": {
                    "type": "object",
                    "description": "Extracted audio features (duration_seconds, speech_activity_ratio, pause_count, mean_rms)."
                },
                "transcript": {"type": "string", "description": "Speech transcript text."},
                "language_hint": {"type": "string", "description": "Language code (en, hi, ta, te, mr, bn, es)."}
            },
            "required": ["features"]
        }
    },
    {
        "name": "predict_risk",
        "description": "Executes CatBoost Tier 2 ML dementia risk classification with SHAP feature contribution explanations.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "patient_data": {
                    "type": "object",
                    "description": "Patient clinical risk factors (Age, Gender, BMI, Education_Level, APOE_e4, Diabetic, Hypertension, etc.)."
                }
            },
            "required": ["patient_data"]
        }
    },
    {
        "name": "classify_mri",
        "description": "Evaluates conditional neuroimaging scan (EfficientNet CNN) with explicit non-fusion disclaimer and confirmatory-only classification.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "filename": {"type": "string", "description": "Filename of uploaded scan (e.g. brain_mri.jpg)."}
            }
        }
    },
    {
        "name": "retrieve_guideline",
        "description": "RAG retrieval of clinical guidance from NIA-AA 2024, WHO ICOPE, and AAN guidelines based on risk level.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query."},
                "risk_level": {"type": "string", "description": "Patient risk level (Low, Moderate, High)."}
            }
        }
    },
    {
        "name": "draft_report",
        "description": "Synthesizes structured clinical narrative integrating multimodal evidence (CogniScore, CatBoost SHAP drivers, MRI context, and guideline snippets).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "patient_name": {"type": "string"},
                "age": {"type": "integer"},
                "cogni_score": {"type": "number"},
                "risk_level": {"type": "string"},
                "is_deviating": {"type": "boolean"},
                "shap_features": {"type": "array", "items": {"type": "object"}},
                "mri_result": {"type": "object"},
                "guidelines": {"type": "array", "items": {"type": "object"}}
            },
            "required": ["patient_name", "cogni_score", "risk_level"]
        }
    },
    {
        "name": "generate_referral",
        "description": "Determines clinical referral action, urgency, recommended specialist (Neurologist / Memory Clinic), and rationale based on evidence.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "risk_level": {"type": "string"},
                "is_deviating": {"type": "boolean"},
                "active_score": {"type": "number"},
                "shap_features": {"type": "array", "items": {"type": "object"}}
            },
            "required": ["risk_level"]
        }
    },
    {
        "name": "check_output_safety",
        "description": "Guardrail scanner enforcing non-diagnostic disclaimers and sanitizing unauthorized clinical claims.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "narrative": {"type": "string", "description": "Draft clinical narrative to scan."}
            },
            "required": ["narrative"]
        }
    },
    {
        "name": "check_subgroup_fairness",
        "description": "Evaluates demographic parity and equal opportunity metrics across age, gender, and education cohorts.",
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
    def __init__(self, score: float):
        self.score = score


def call_tool(name: str, args: dict) -> dict:
    if name == "validate_input":
        return mcp_tools.validate_input(args.get("data", {}))

    elif name == "score_tier1":
        active_scores = args.get("active_scores", [75.0])
        tests = [DummyTest(s) for s in active_scores]
        signals = []
        raw_hist = args.get("historical_scores", [])
        hist = [DummyScore(s) for s in raw_hist]
        return mcp_tools.score_tier1(tests, signals, hist)

    elif name == "detect_language":
        return mcp_tools.detect_language(text=args.get("text"), sample_id=args.get("sample_id"))

    elif name == "analyse_voice":
        return mcp_tools.analyse_voice(
            features=args.get("features", {}),
            transcript=args.get("transcript", ""),
            language_hint=args.get("language_hint", "en")
        )

    elif name == "predict_risk":
        return mcp_tools.predict_risk(args.get("patient_data", {}))

    elif name == "classify_mri":
        return mcp_tools.classify_mri(filename=args.get("filename", "sample_mri_scan.dcm"))

    elif name == "retrieve_guideline":
        return mcp_tools.retrieve_guideline(
            query=args.get("query", "cognitive decline"),
            risk_level=args.get("risk_level", "Moderate")
        )

    elif name == "draft_report":
        guidelines = args.get("guidelines") or mcp_tools.retrieve_guideline("cognitive decline", args.get("risk_level", "Moderate"))
        narrative = mcp_tools.draft_report(
            patient_name=args.get("patient_name", "Patient"),
            age=args.get("age", 65),
            cogni_score=args.get("cogni_score", 50.0),
            risk_level=args.get("risk_level", "Moderate"),
            is_deviating=args.get("is_deviating", False),
            shap_features=args.get("shap_features"),
            mri_result=args.get("mri_result"),
            guidelines=guidelines
        )
        safety = mcp_tools.check_output_safety(narrative)
        referral = mcp_tools.generate_referral(
            risk_level=args.get("risk_level", "Moderate"),
            is_deviating=args.get("is_deviating", False),
            active_score=args.get("cogni_score", 50.0),
            shap_features=args.get("shap_features")
        )
        return {
            "narrative": safety["sanitized_narrative"],
            "guardrail_passed": safety["guardrail_passed"],
            "guidelines": guidelines,
            "referral": referral
        }

    elif name == "generate_referral":
        return mcp_tools.generate_referral(
            risk_level=args.get("risk_level", "Moderate"),
            is_deviating=args.get("is_deviating", False),
            active_score=args.get("active_score", 50.0),
            shap_features=args.get("shap_features")
        )

    elif name == "check_output_safety":
        return mcp_tools.check_output_safety(args.get("narrative", ""))

    elif name == "check_subgroup_fairness":
        return mcp_tools.check_subgroup_fairness()

    else:
        raise ValueError(f"Unknown MCP tool: {name}")


def main():
    """Run MCP JSON-RPC stdio event loop."""
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            line = line.strip()
            if not line:
                continue

            request = json.loads(line)
            req_id = request.get("id")
            method = request.get("method")
            params = request.get("params", {})

            if method == "initialize":
                response = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {
                            "tools": {"listChanged": False}
                        },
                        "serverInfo": {
                            "name": "cogniveil-mcp-server",
                            "version": "1.0.0"
                        }
                    }
                }
            elif method == "notifications/initialized" or method == "initialized":
                continue
            elif method == "tools/list":
                response = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "tools": TOOLS
                    }
                }
            elif method == "tools/call":
                tool_name = params.get("name")
                tool_args = params.get("arguments", {})
                try:
                    result = call_tool(tool_name, tool_args)
                    response = {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": json.dumps(result, indent=2, default=str)
                                }
                            ],
                            "isError": False
                        }
                    }
                except Exception as exc:
                    response = {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "content": [{"type": "text", "text": f"Error: {exc}"}],
                            "isError": True
                        }
                    }
            elif method == "ping":
                response = {"jsonrpc": "2.0", "id": req_id, "result": {}}
            else:
                response = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32601,
                        "message": f"Method not found: {method}"
                    }
                }

            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()

        except Exception as err:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32603, "message": str(err)}
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
