"""AuditAgent for CogniVeil.

Manages fine-grained, immutable decision path tracking for every AI agent action,
tool invocation, and state transition in the screening lifecycle.
"""

from typing import Dict, Any, Optional
from datetime import datetime
import json
from sqlalchemy.orm import Session
from models import AuditLog


class AuditAgent:
    """Specialized agent capturing and persisting structured decision path audit logs."""

    AGENT_NAME = "AuditAgent"
    VERSION = "2026.1"

    def record_event(
        self,
        db: Optional[Session],
        user_id: Optional[int],
        agent_name: str,
        tool_name: str,
        input_data: Any,
        output_data: Any,
        input_provenance: str = "mixed",
        pipeline_state: Optional[str] = None,
        guardrail_passed: bool = True,
        next_action: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Creates and persists an audit event.

        Args:
            db: Optional SQLAlchemy database session.
            user_id: Patient or caregiver ID.
            agent_name: Name of the originating agent.
            tool_name: MCP tool invoked.
            input_data: Summary or full input payload.
            output_data: Summary or full output payload.
            input_provenance: Source provenance (self_reported, clinically_obtained, sensor, mixed).
            pipeline_state: Current lifecycle stage.
            guardrail_passed: Whether safety guardrail passed.
            next_action: Proposed next step in the pipeline.
            session_id: Optional tracking session identifier.

        Returns:
            Structured audit event payload.
        """
        timestamp = datetime.utcnow().isoformat() + "Z"
        effective_session_id = session_id or f"S_{user_id or 'anon'}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        event_payload = {
            "session_id": effective_session_id,
            "timestamp": timestamp,
            "agent": agent_name,
            "tool": tool_name,
            "input_provenance": input_provenance,
            "pipeline_state": pipeline_state,
            "guardrail_passed": guardrail_passed,
            "result_summary": output_data if isinstance(output_data, (str, int, float, bool)) else (
                output_data.get("status") or output_data.get("risk_level") or output_data.get("action") or "completed"
                if isinstance(output_data, dict) else "completed"
            ),
            "next_action": next_action
        }

        # Persist to database if db session is provided
        if db is not None:
            try:
                log_entry = AuditLog(
                    user_id=user_id,
                    tool_name=f"{agent_name}::{tool_name}",
                    input_summary=json.dumps(input_data, default=str)[:1000],
                    output_summary=json.dumps(output_data, default=str)[:1000],
                    pipeline_state=pipeline_state,
                    guardrail_passed=guardrail_passed,
                    created_at=datetime.utcnow()
                )
                db.add(log_entry)
                db.commit()
            except Exception as e:
                print(f"[AuditAgent] Warning: Failed to persist audit log: {e}")

        return event_payload
