# CogniVeil — Clinical Intelligence & Precision Cognitive Drift Surveillance

CogniVeil is a continuous, multi-tiered digital clinical intelligence platform engineered for early cognitive drift and dementia surveillance. By unifying **longitudinal passive digital biomarkers**, **active psychometric micro-tasks**, **acoustic voice fluency analytics**, a **10-node autonomous multi-agent pipeline (MCP suite)**, and **deep learning MRI neuroimaging volumetry**, CogniVeil bridges the diagnostic gap and enables timely clinical intervention years before conventional symptomatic thresholds are reached.

> 📖 **Full System Architecture & Technical Documentation**:
> For the complete architectural, algorithmic, clinical, and database specification, see [PROJECT_DOCUMENTATION.md](file:///d:/flutter_projects/Cogniveil/PROJECT_DOCUMENTATION.md).

---

## Key Highlights

- **3-Tier Diagnostic Escalation**:
  - **Tier 1 (Continuous Surveillance)**: Keystroke flight times, scroll hesitation index, daily active micro-tasks (Digit Span, Pattern Recall, Word Recall, Voice Journal), analyzed via **EWMA** and two-sided **CUSUM** change-point drift detection.
  - **Tier 2 (Clinical In-Depth Profiling)**: Acoustic phonation and pause-ratio analytics, functional activity markers, cross-attention multimodal fusion, and **TreeSHAP** feature attribution waterfalls.
  - **Tier 3 (Neuroimaging & Specialist Referral)**: Deep learning structural MRI brain volumetry (hippocampal and ventricular atrophy indexing) and automated vector-rendered board-ready PDF referral reports.
- **10-Agent Autonomous Clinical Architecture**:
  - Operates via the Model Context Protocol (MCP) suite across 18 typed clinical tools (`validate_input`, `score_tier1`, `analyze_voice`, `classify_mri`, `log_audit`, etc.).
- **Clinical Security & RBAC**:
  - Strict Role-Based Access Control separating patients from attending clinicians.
  - Profile modification verification via time-limited 6-digit clinical security PINs.
  - Immutable SHA-256 audit logging.
- **Accessibility & Design System**:
  - WCAG 2.1 AA compliant with high-contrast Olive Dark Mode & Pastel Green Light Mode, dynamic font scaling, and vestibular-safe reduced motion.

---

## Tech Stack

- **Frontend**: React 18, Recharts, Custom Vanilla CSS Token Architecture, Lucide Vector Icons.
- **Backend**: Python 3.13, FastAPI (ASGI), Pydantic v2, ReportLab PDF Engine, AnyIO.
- **Machine Learning & Signal Processing**: PyTorch, Scikit-Learn, XGBoost, SHAP (TreeSHAP), Librosa, Scipy.
- **Database**: SQLite3 with Write-Ahead Logging (WAL) mode (`PRAGMA journal_mode=WAL;`) and 30s connection timeout resilience, SQLAlchemy 2.0 ORM.

