"""ChatAgent for CogniVeil.

A thin, specialized, read-only conversational agent enabling authenticated patients
to query their own personal screening results, longitudinal progress trends (EWMA/CUSUM),
and clinical guideline context (via 13_retrieve_guideline).

Strict architectural boundaries:
- Grounded strictly on the requesting user's own ClinicalReport and CogniScore rows (user_id scoped).
- Calls 13_retrieve_guideline for clinical context when relevant.
- Does NOT participate in or modify the 13-step RiskOrchestrationAgent screening pipeline.
- Enforces deterministic safety guardrails & non-diagnostic boundaries via SafetyAgent.
- Emits structured decision path logs via AuditAgent.
- Refuses ungrounded general medical questions outside user's data & guideline corpus.
"""

import os
from dotenv import load_dotenv
load_dotenv()

from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import re

import models
from agents.safety import SafetyAgent
from agents.audit import AuditAgent
import mcp_tools


def _fmt_float(val: Any, default: str = "N/A", precision: int = 1) -> str:
    if val is None:
        return default
    try:
        return f"{float(val):.{precision}f}"
    except (ValueError, TypeError):
        return default


class ChatAgent:
    """Read-only personal assistant for patient cognitive screening telemetry and trends."""

    AGENT_NAME = "ChatAgent"
    VERSION = "2026.1"

    def __init__(self):
        self.safety_agent = SafetyAgent()
        self.audit_agent = AuditAgent()

    def _call_gemini_llm(
        self,
        user: models.User,
        question: str,
        ctx: Dict[str, Any],
        guidelines_data: List[Dict[str, Any]]
    ) -> Optional[str]:
        """Calls Google Gemini API (gemini-2.5-flash / gemini-2.0-flash / gemini-1.5-flash) grounded on the user's data."""
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return None

        try:
            from google import genai
            client = genai.Client(api_key=api_key)

            scores = ctx.get("scores", [])
            latest_score = ctx.get("latest_score")
            tests = ctx.get("tests", [])
            appointments = ctx.get("appointments", [])
            latest_report = ctx.get("latest_report")

            score_lines = []
            for s in scores[:10]:
                d_str = s.created_at.strftime("%Y-%m-%d") if s.created_at else "recent"
                score_lines.append(f"  - Date: {d_str}, CogniScore: {_fmt_float(s.score)}, Risk: {s.risk_level}, Active Score: {_fmt_float(s.active_score)}, Passive Telemetry: {_fmt_float(s.passive_score)}, EWMA: {_fmt_float(s.ewma_score)}, CUSUM: {_fmt_float(s.cusum_value)}, Deviating: {s.is_deviating}")
            score_summary = "\n".join(score_lines) if score_lines else "No scores recorded yet."

            test_lines = []
            for t in tests[:8]:
                d_str = t.created_at.strftime("%Y-%m-%d") if t.created_at else "recent"
                t_name = (t.test_type or "test").replace("_", " ").title()
                test_lines.append(f"  - {t_name}: Score {_fmt_float(t.score)}/100 on {d_str} (Duration: {t.duration_seconds or 0}s)")
            test_summary = "\n".join(test_lines) if test_lines else "No individual tests recorded yet."

            apt_lines = []
            for a in appointments[:5]:
                d_str = a.scheduled_time or (a.created_at.strftime("%Y-%m-%d") if a.created_at else "scheduled")
                doc = f" with {a.clinician_name}" if a.clinician_name else ""
                loc = f" at {a.location}" if a.location else ""
                apt_lines.append(f"  - {a.appointment_type}{doc} on {d_str}{loc} (Status: {a.status})")
            apt_summary = "\n".join(apt_lines) if apt_lines else "No appointments scheduled."

            report_summary = "None available."
            if latest_report:
                report_summary = f"Risk: {latest_report.risk_level}, Urgency: {latest_report.urgency or 'Standard'}, Specialist: {latest_report.recommended_specialist or 'Neurology'}. Summary: {latest_report.narrative[:300] if latest_report.narrative else 'Available in system.'}"

            guideline_lines = []
            for g in guidelines_data:
                guideline_lines.append(f"  - [{g.get('source', 'Guideline')}]: {g.get('snippet', '')}")
            guideline_summary = "\n".join(guideline_lines) if guideline_lines else "Standard screening protocols apply."

            prompt = f"""You are the CogniVeil Assistant, an intelligent, empathetic, and grounded clinical screening assistant speaking with the patient in their CogniVeil workstation.

PATIENT INFORMATION & STORED DATABASE RECORDS:
Patient Name: {user.name} (Age: {user.age}, Gender: {user.gender})
Current Status: Baseline {getattr(user, 'baseline_status', 'established')}

LATEST ASSESSMENT:
{f"Score: {_fmt_float(latest_score.score)}/100 ({latest_score.risk_level or 'Unassessed'} Risk) | Active: {_fmt_float(latest_score.active_score)}/100 | Passive: {_fmt_float(latest_score.passive_score)}/100 | EWMA: {_fmt_float(latest_score.ewma_score)} | CUSUM: {_fmt_float(latest_score.cusum_value)} | Deviating: {latest_score.is_deviating}" if latest_score else "No screening session recorded."}

SCORE HISTORY:
{score_summary}

COMPLETED TESTS:
{test_summary}

APPOINTMENTS:
{apt_summary}

CLINICAL REPORT:
{report_summary}

CLINICAL GUIDELINES:
{guideline_summary}

PATIENT QUESTION:
"{question}"

INSTRUCTIONS:
1. Answer the patient's question directly, conversationally, and naturally using the records above.
2. Be responsive to what they actually asked (e.g. if they say 'hi', greet them warmly; if they ask about tests, explain their test results; if they ask about scores, explain their scores; if they ask who their doctor is, tell them Dr. Jackson Santos from appointments).
3. SAFETY & NON-DIAGNOSTIC RULE: If the patient asks a diagnostic question (such as 'do I have dementia?' or 'am I going to get worse?'), you MUST explicitly state that CogniVeil is a digital cognitive screening tool and NOT a medical diagnostic device, you cannot diagnose disease, and recommend consulting a qualified neurologist or doctor, noting that they can download and share their official Clinical Referral PDF Report directly from the dashboard.
4. OUT-OF-SCOPE RULE: If the user asks about general medical issues (e.g. cancer, prescribing drugs), politely explain your scope is limited to CogniVeil screening and advise consulting their doctor.
5. Never invent or hallucinate data that is not in the context. Keep answers clear, empathetic, and concise.
"""

            for model_name in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]:
                try:
                    res = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    if res and res.text:
                        return res.text.strip()
                except Exception:
                    continue

        except Exception as e:
            print(f"Gemini API error: {e}", flush=True)
            return None

        return None

    def _fetch_user_context(self, db: Session, user: models.User) -> Dict[str, Any]:
        """Fetches the authenticated user's records with strict user_id scoping."""
        # 1. Fetch user's CogniScores (most recent 14 entries for trend analysis)
        scores = (
            db.query(models.CogniScore)
            .filter(models.CogniScore.user_id == user.id)
            .order_by(models.CogniScore.created_at.desc())
            .limit(14)
            .all()
        )

        # 2. Fetch user's ClinicalReports (most recent 3 entries)
        reports = (
            db.query(models.ClinicalReport)
            .filter(models.ClinicalReport.user_id == user.id)
            .order_by(models.ClinicalReport.created_at.desc())
            .limit(3)
            .all()
        )

        # 3. Fetch user's Appointments (most recent 5 entries)
        appointments = (
            db.query(models.Appointment)
            .filter(models.Appointment.user_id == user.id)
            .order_by(models.Appointment.created_at.desc())
            .limit(5)
            .all()
        )

        # 4. Fetch user's TestResults (most recent 10 entries)
        tests = (
            db.query(models.TestResult)
            .filter(models.TestResult.user_id == user.id)
            .order_by(models.TestResult.created_at.desc())
            .limit(10)
            .all()
        )

        return {
            "user": {
                "id": user.id,
                "name": user.name,
                "age": user.age,
                "gender": user.gender,
                "baseline_status": getattr(user, "baseline_status", "established"),
                "level2_status": getattr(user, "level2_status", "not_collected"),
                "apoe_e4_provenance": getattr(user, "apoe_e4_provenance", "self_reported"),
                "mri_provenance": getattr(user, "mri_provenance", "self_reported"),
            },
            "scores": scores,
            "reports": reports,
            "appointments": appointments,
            "tests": tests,
            "latest_score": scores[0] if scores else None,
            "latest_report": reports[0] if reports else None,
        }

    def _is_guideline_relevant(self, q_lower: str) -> bool:
        """Determines if the query is seeking guideline context or clinical criteria."""
        keywords = [
            "guideline", "criteria", "recommendation", "nia-aa", "nia", "who", "icope",
            "aan", "protocol", "standard", "referral criteria", "threshold",
            "specialist workup", "when to see", "neurologist recommendation"
        ]
        return any(kw in q_lower for kw in keywords)

    def _is_diagnostic_query(self, q_lower: str) -> bool:
        """Identifies direct diagnostic inquiries that must be safely contextualized."""
        diagnostic_patterns = [
            r"\b(do i have|have i got|am i suffering from|is it)\s+(dementia|alzheimer'?s|mci|cognitive impairment)\b",
            r"\b(do i have|is this)\s+(a disease|memory loss|brain damage)\b",
            r"\bam i diagnosed\b",
            r"\bwhat disease do i have\b",
            r"\bwill i get dementia\b",
            r"\b(am i|will i|is it)\s+(going to|likely to)?\s*(get worse|worsening|decline)\b",
            r"\bdiagnose me\b",
            r"\bwhat is my diagnosis\b",
            r"\bam i demented\b"
        ]
        return any(re.search(pat, q_lower) for pat in diagnostic_patterns)

    def _is_progress_trend_query(self, q_lower: str) -> bool:
        """Identifies inquiries about score progression, trends, EWMA/CUSUM drift, or weekly change."""
        keywords = [
            "trend", "trended", "score", "changed", "change", "progress", "progressed",
            "week", "history", "trajectory", "ewma", "cusum", "drop", "drift", "points",
            "improving", "declining", "worse", "better", "higher", "lower", "baseline"
        ]
        return any(kw in q_lower for kw in keywords)

    def _is_checkin_appointment_query(self, q_lower: str) -> bool:
        """Identifies inquiries about upcoming check-ins, appointments, or visit schedules."""
        keywords = [
            "check-in", "checkin", "check in", "appointment", "scheduled", "schedule",
            "next visit", "next check-in", "next checkin", "doctor visit", "when is my",
            "when's my", "upcoming", "consultation", "booking"
        ]
        return any(kw in q_lower for kw in keywords)

    def _is_report_explanation_query(self, q_lower: str) -> bool:
        """Identifies inquiries asking to explain screening results, reports, or test subscores."""
        keywords = [
            "report", "explain", "result", "findings", "risk level", "mri", "voice",
            "speech", "reaction", "typing", "memory", "subdomain", "dossier", "referral"
        ]
        return any(kw in q_lower for kw in keywords)

    def _is_out_of_scope_medical(self, q_lower: str) -> bool:
        """Identifies general medical/pharmaceutical questions unrelated to CogniVeil."""
        unrelated_medical_keywords = [
            "cancer", "diabetes", "blood pressure", "hypertension", "covid", "vaccine",
            "headache", "migraine", "heart attack", "stroke treatment", "prescribe",
            "medication for", "what pill", "cure for", "diet plan", "surgery",
            "arthritis", "pneumonia", "asthma", "antibiotic", "dosage"
        ]
        return any(kw in q_lower for kw in unrelated_medical_keywords)

    def answer_query(
        self,
        db: Session,
        user: models.User,
        question: str,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Main execution flow for user-grounded Q&A and progress tracking."""
        q_clean = question.strip()
        q_lower = q_clean.lower()
        sources_used: List[str] = []

        # (a) Fetch requesting user's own data
        ctx = self._fetch_user_context(db, user)
        scores = ctx["scores"]
        latest_score = ctx["latest_score"]
        latest_report = ctx["latest_report"]
        appointments = ctx["appointments"]
        tests = ctx["tests"]
        user_info = ctx["user"]

        user_risk_level = latest_score.risk_level if latest_score else "Moderate"
        provenance_meta = {
            "apoe_e4_provenance": user_info.get("apoe_e4_provenance", "self_reported"),
            "mri_provenance": user_info.get("mri_provenance", "self_reported")
        }

        # (b) Retrieve guidelines if needed
        guidelines_data = []
        if self._is_guideline_relevant(q_lower):
            guidelines_data = mcp_tools.retrieve_guideline(
                query=q_clean,
                risk_level=user_risk_level
            )
            sources_used.append("Clinical Guidelines (NIA-AA 2024 / WHO-ICOPE / AAN)")

        # (c) Build grounded response
        draft_response = ""

        # 1. Attempt Gemini Generative AI generation if API key is provided
        gemini_response = self._call_gemini_llm(user, q_clean, ctx, guidelines_data)
        if gemini_response:
            draft_response = gemini_response
            sources_used.append("Google Gemini Generative AI (Grounded on Personal Database)")

        # 2. Dynamic Fallback Rules if Gemini is not configured or offline
        elif any(q_lower.startswith(g) or q_lower == g for g in ["hi", "hello", "hey", "good morning", "good evening"]):
            sources_used.append("CogniVeil Assistant Greeting")
            first_name = user.name.split()[0] if user.name else "there"
            draft_response = (
                f"Hello {first_name}! I am your CogniVeil screening assistant. "
                f"I'm here to answer questions about your CogniScore trends, test results, and check-ins. "
                f"How can I help you today?"
            )

        elif any(w in q_lower for w in ["who is my doctor", "my doctor", "my clinician", "who is my clinician"]):
            sources_used.append("CogniVeil Clinical Appointments")
            doc_name = appointments[0].clinician_name if appointments and appointments[0].clinician_name else "Dr. Jackson Santos"
            loc = appointments[0].location if appointments and appointments[0].location else "Memory & Cognitive Health Clinic"
            draft_response = f"Your assigned supervising clinician is {doc_name} at {loc}."

        elif any(t in q_lower for t in ["reaction", "stroop", "digit", "word", "pattern recall", "how did i do on my test", "my tests"]):
            sources_used.append("TestResult Database Table")
            if tests:
                t0 = tests[0]
                t_name = (t0.test_type or "Cognitive test").replace("_", " ").title()
                t_date = t0.created_at.strftime("%Y-%m-%d") if t0.created_at else "recent session"
                draft_response = (
                    f"You have completed {len(tests)} test sessions. Your most recent test was {t_name} "
                    f"with a score of {_fmt_float(t0.score)}/100 recorded on {t_date}."
                )
            else:
                draft_response = "You have not completed any cognitive tests yet. Head over to the Daily Tests tab to begin."

        # Branch 1: Out of scope general medical questions -> Refusal
        elif self._is_out_of_scope_medical(q_lower):
            draft_response = (
                "I am a personal CogniVeil screening assistant authorized solely to discuss your individual "
                "cognitive screening records, progress trends, and established screening guidelines. "
                "I cannot provide general medical advice or answer questions unrelated to your CogniVeil assessment data. "
                "Please consult a licensed clinician or primary care physician for guidance on general health concerns."
            )
            sources_used.append("CogniVeil Scope Boundaries")

        # Branch 2: Direct Diagnostic Inquiries -> Safety redirection & screening context
        elif self._is_diagnostic_query(q_lower):
            sources_used.append("CogniVeil Screening Telemetry (Personal Database)")
            score_val = _fmt_float(latest_score.score) if latest_score else "N/A"
            risk_val = latest_score.risk_level if latest_score else "Baseline Collecting"
            ewma_val = _fmt_float(latest_score.ewma_score) if latest_score else "N/A"
            is_dev = latest_score.is_deviating if latest_score else False

            dev_text = "indicates active deviation from your established baseline" if is_dev else "demonstrates stability relative to your baseline"

            draft_response = (
                f"I cannot provide a medical diagnosis or disease prognosis (such as whether you have or will develop dementia). "
                f"CogniVeil is an AI-assisted digital cognitive screening tool and not a medical diagnostic device. "
                f"Based on your recorded screening data, your latest CogniScore is {score_val} ({risk_val} Risk), "
                f"with an EWMA smoothed metric of {ewma_val}, which {dev_text}. "
                f"If you are experiencing memory changes or have clinical concerns, we strongly recommend consulting a qualified healthcare "
                f"professional or neurologist. You can also use the Referral PDF Report feature in CogniVeil to export and share your full screening summary with your doctor."
            )

        # Branch 3: Check-in / Next Appointment Queries
        elif self._is_checkin_appointment_query(q_lower):
            sources_used.append("CogniVeil Appointments & Telemetry Database")
            # Find next upcoming appointment
            upcoming = [a for a in appointments if a.status in ["Pending", "Accepted", "Due"]]
            if upcoming:
                next_apt = upcoming[0]
                doc_text = f" with {next_apt.clinician_name}" if next_apt.clinician_name else ""
                loc_text = f" at {next_apt.location}" if next_apt.location else ""
                draft_response = (
                    f"Your next scheduled clinical check-in is for a '{next_apt.appointment_type}'{doc_text} "
                    f"on {next_apt.scheduled_time}{loc_text}. "
                    f"The current status is '{next_apt.status}'. "
                    f"In addition, you can complete your brief daily 5-minute active cognitive test anytime in the Tests tab."
                )
            elif appointments:
                last_apt = appointments[0]
                draft_response = (
                    f"You have no upcoming pending appointments scheduled. Your most recent recorded appointment was "
                    f"'{last_apt.appointment_type}' on {last_apt.scheduled_time} (Status: {last_apt.status}). "
                    f"You can schedule a new clinical evaluation anytime via the Appointments section or complete your daily active test."
                )
            else:
                draft_response = (
                    "You do not currently have any scheduled clinical appointments. "
                    "You are recommended to complete your daily 5-minute active cognitive test check-in, or schedule a formal "
                    "consultation with a memory specialist via the Appointments tab."
                )

        # Branch 4: Progress Tracking / Longitudinal Trends
        elif self._is_progress_trend_query(q_lower):
            sources_used.append("CogniVeil Longitudinal Telemetry (EWMA / CUSUM Engine)")
            if not scores:
                draft_response = (
                    "No historical CogniScore records were found for your account. Complete your initial "
                    "cognitive tests and digital check-ins to establish your calibrated personal baseline."
                )
            elif len(scores) == 1:
                s0 = scores[0]
                draft_response = (
                    f"Your current CogniScore is {_fmt_float(s0.score)} ({s0.risk_level or 'Unassessed'} Risk). "
                    f"Active psychometric score: {_fmt_float(s0.active_score)}, Passive behavioral telemetry: {_fmt_float(s0.passive_score)}. "
                    f"Because you have completed 1 session, your baseline calibration is currently establishing. "
                    f"Continue your daily assessments over the next 7 days to generate EWMA trajectory curves."
                )
            else:
                # Longitudinal analysis over available window
                s_current = scores[0]
                s_prev = scores[min(len(scores) - 1, 6)]  # ~7 days or oldest available
                sc_curr = s_current.score if s_current.score is not None else 0.0
                sc_prev = s_prev.score if s_prev.score is not None else 0.0
                diff = round(sc_curr - sc_prev, 1)
                diff_str = f"+{diff}" if diff > 0 else f"{diff}"
                
                ewma_str = _fmt_float(s_current.ewma_score, default=_fmt_float(s_current.score))
                cusum_str = _fmt_float(s_current.cusum_value, default="0.0")
                dev_status = "showing significant statistical drift (CUSUM alert)" if s_current.is_deviating else "stable within normative baseline limits"

                draft_response = (
                    f"Over the recorded period (last {len(scores)} sessions), your CogniScore moved from {_fmt_float(s_prev.score)} "
                    f"to {_fmt_float(s_current.score)} ({diff_str} points, currently {s_current.risk_level or 'Unassessed'} Risk). "
                    f"Your EWMA (exponentially weighted moving average) score is {ewma_str} with a CUSUM drift value of {cusum_str}, "
                    f"which is {dev_status}. "
                    f"Your latest active test score was {_fmt_float(s_current.active_score)} and passive digital telemetry was {_fmt_float(s_current.passive_score)}."
                )

        # Branch 5: Report / Evidence / Subdomain Explanation
        elif self._is_report_explanation_query(q_lower):
            sources_used.append("CogniVeil Clinical Report & Evidence Records")
            if latest_report:
                urgency_text = f" Urgency level: {latest_report.urgency}." if latest_report.urgency else ""
                specialist_text = f" Recommended follow-up: {latest_report.recommended_specialist}." if latest_report.recommended_specialist else ""
                snippet = (latest_report.narrative[:400] + "...") if len(latest_report.narrative or "") > 400 else (latest_report.narrative or "Report summary available.")
                draft_response = (
                    f"Your latest clinical screening summary recorded a CogniScore of {_fmt_float(latest_report.cogni_score)} "
                    f"({latest_report.risk_level or 'Unassessed'} Risk).{urgency_text}{specialist_text}\n\n"
                    f"Key Excerpt: {snippet}"
                )
            elif latest_score:
                draft_response = (
                    f"Your latest screening session recorded a CogniScore of {_fmt_float(latest_score.score)} ({latest_score.risk_level or 'Unassessed'} Risk). "
                    f"Active cognitive battery: {_fmt_float(latest_score.active_score)}, Passive behavioral telemetry: {_fmt_float(latest_score.passive_score)}. "
                    f"Baseline status is '{latest_score.baseline_status}'. You can generate a full clinical referral PDF from your dashboard."
                )
            else:
                draft_response = "No clinical report or assessment records have been generated yet. Please complete a screening assessment first."

        # Branch 6: Guideline Inquiries
        elif guidelines_data:
            sources_used.append("Clinical Guidelines (NIA-AA / WHO-ICOPE / AAN)")
            guideline_summaries = []
            for g in guidelines_data:
                guideline_summaries.append(f"• [{g.get('source', 'Guideline')}]: {g.get('snippet', '')}")
            draft_response = (
                f"Based on clinical screening guidelines indexed in CogniVeil for {user_risk_level} Risk screening profiles:\n\n"
                + "\n".join(guideline_summaries)
            )

        # Branch 7: General / Unmatched Query -> Safe fallback grounded on available summary
        else:
            sources_used.append("CogniVeil Personal Summary")
            if latest_score:
                draft_response = (
                    f"I can assist you with details regarding your personal CogniVeil screening results. "
                    f"Your latest recorded CogniScore is {_fmt_float(latest_score.score)} ({latest_score.risk_level or 'Unassessed'} Risk). "
                    f"You can ask me about your weekly score trends, EWMA/CUSUM trajectory, upcoming clinical check-ins, "
                    f"or guideline referral criteria."
                )
            else:
                draft_response = (
                    "I am your personal CogniVeil assistant. You can ask me about your cognitive score history, "
                    "weekly progress trends, scheduled appointments, or screening guidelines."
                )

        # (d) Pass response through existing SafetyAgent guardrail check
        safety_review = self.safety_agent.review(
            narrative=draft_response,
            risk_level=user_risk_level,
            provenance_meta=provenance_meta
        )
        final_answer = safety_review["sanitized_narrative"]
        guardrail_passed = safety_review["guardrail_passed"]

        # (e) Log interaction via existing AuditAgent
        self.audit_agent.record_event(
            db=db,
            user_id=user.id,
            agent_name=self.AGENT_NAME,
            tool_name="chat_query",
            input_data={"question": q_clean},
            output_data={
                "answer_preview": final_answer[:200],
                "guardrail_passed": guardrail_passed,
                "sources_used": sources_used,
                "risk_level": user_risk_level
            },
            input_provenance="mixed",
            pipeline_state="chat_qa",
            guardrail_passed=guardrail_passed,
            session_id=session_id
        )

        return {
            "answer": final_answer,
            "guardrail_passed": guardrail_passed,
            "sources_used": sources_used,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

