# COGNIVEIL — Comprehensive Architectural Blueprint & System Specification

> **Clinical Decision Support & Multimodal Cognitive Health Surveillance Platform**  
> *Document Version:* 2.4.0  
> *Target Architecture:* React 19 + FastAPI + CatBoost / PyTorch ResNet-18 / TreeSHAP / MedGemma-4B / Whisper  
> *Environment:* Local Development & Clinical Staging (Port 3000 / Port 8000)

---

## 1. Executive Summary & Clinical Mission

CogniVeil is a **multi-tiered clinical decision support platform** engineered for the early detection, longitudinal surveillance, and differential stratification of cognitive decline, Mild Cognitive Impairment (MCI), and neurodegenerative conditions (including Alzheimer's Disease, Vascular Dementia, Lewy Body Dementia, and Frontotemporal Dementia).

### Core Clinical Philosophies
1. **Passive Over Active**: Active cognitive tests (e.g., MMSE, MoCA) suffer from test-retest learning effects, white-coat anxiety, and episodic sampling bias. CogniVeil combines brief active micro-batteries with continuous, unobtrusive passive digital phenotyping (typing dynamics, scroll hesitation, acoustic conversational biomarkers).
2. **Intra-Individual Baseline Over Population Cutoffs**: Traditional screening compares an individual to population averages, frequently missing early decline in high-cognitive-reserve individuals. CogniVeil builds a longitudinal personal baseline using Exponentially Weighted Moving Averages (EWMA) and flags intra-individual deterioration using Cumulative Sum (CUSUM) change-point detection.
3. **Tiered Clinical Escalation**: 
   - **Tier 1**: Continuous passive telemetry + daily active cognitive battery + voice journal.
   - **Tier 2**: Multimodal biometric, vascular, lifestyle, and genetic risk assessment via CatBoost ML with TreeSHAP explainability.
   - **Tier 3**: Structural Brain MRI morphometry via PyTorch ResNet-18 with Grad-CAM explainable saliency heatmaps.
   - **Clinician Decision Support**: Multiclass dementia type profiling, 10-node autonomous agent pipeline, and automated MedGemma-4B 12-section clinical referral dossiers with signed PDF export.
4. **Ethical Non-Diagnostic Guardrails**: CogniVeil provides probabilistic screening indicators and clinical decision support. It explicitly does **not** generate automated medical diagnoses, strictly enforcing clinician oversight and patient consent governance.

---

## 2. High-Level System Topology

```
+--------------------------------------------------------------------------------------------------+
|                                    COGNIVEIL FRONTEND CLIENT                                     |
|                              (React 19.2 + React Router v7 + Recharts)                           |
+--------------------------------------------------------------------------------------------------+
|  Patient Portal:                        Clinician Portal:                   Shared Modals / Nav: |
|  - Daily Battery (TMT A/B, Stroop)      - Patient Cohort Directory          - DoctorLayout       |
|  - Acoustic Voice Journal               - Longitudinal CUSUM Charts         - Collapsible Sidebar|
|  - Passive Phenotyping Tracker          - Dementia Subtype Profiling        - Evidence Graph     |
|  - Care Circle Permissions              - MedGemma-4B Referral Dossier      - Agent Pipeline     |
|  - Consent & Privacy Settings           - Appointments & Consultations      - Profile & Sessions |
+--------------------------------------------------------------------------------------------------+
                                                |
                                        REST / JSON / Multipart
                                                v
+--------------------------------------------------------------------------------------------------+
|                                   FASTAPI BACKEND RUNTIME (Port 8000)                             |
+--------------------------------------------------------------------------------------------------+
|  Security & Ingestion:                  Database & ORM:                     Clinical Intelligence:|
|  - OAuth 2.0 / JWT Authentication       - SQLite / SQLAlchemy SessionLocal  - 18 MCP Tool Suite  |
|  - Google Identity Services             - models.py (8 Core Entities)       - 10-Node AI Pipeline|
|  - Role-Based Access Control (RBAC)     - Automatic Seed Ingestion          - ReportLab PDF Engine|
+--------------------------------------------------------------------------------------------------+
        |                                       |                                       |
        v                                       v                                       v
+-----------------------+       +-------------------------------+       +--------------------------+
|  TIER 1 SCREENING     |       |  TIER 2 CLINICAL RISK         |       |  TIER 3 NEUROIMAGING     |
+-----------------------+       +-------------------------------+       +--------------------------+
| - Active Battery (0-100)|     | - CatBoost Tabular Classifier |       | - PyTorch ResNet-18      |
| - Keystroke IKL & Back|       | - 20 Biometric/Vascular feats |       | - OASIS/ADNI CDR Staging |
| - Voice Journal (Acou)|       | - TreeSHAP Local Attributions |       | - Grad-CAM Visual Heatmap|
| - CUSUM Drift Monitor |       | - Modifiable Risk Actions     |       | - Anatomical Slice Viewer|
+-----------------------+       +-------------------------------+       +--------------------------+
```

---

## 3. The 3-Tier Multi-Modal Screening Cascade

### Tier 1: Daily Cognitive Battery, Passive Telemetry & Voice Journal

#### 1. Active Cognitive Micro-Battery
- **Trail Making Test Part A & B (TMT-A / TMT-B)**:
  - *TMT-A*: Sequential numerical tracing (1 &rarr; 2 &rarr; 3...) measuring basic motor speed and visual scan rate.
  - *TMT-B*: Alternating alphanumeric tracing (1 &rarr; A &rarr; 2 &rarr; B...) measuring cognitive flexibility, working memory, and executive function.
  - *Metrics*: Completion time (ms), error count, path efficiency, hesitation latency before node clicks.
- **Visual Pattern Recall**: Grid memory reconstruction assessing visuospatial retention and short-term hippocampal recall.
- **Digit Span (Forward & Backward)**: Phonological loop and central executive working memory span.
- **Stroop Color-Word Inhibition**: Processing speed and executive cognitive inhibition (latency delta between congruent vs incongruent stimuli).

#### 2. Continuous Passive Digital Phenotyping (`PassiveTracker.js`)
- Runs invisibly during normal portal navigation (strictly gated by user consent).
- **Inter-Key Latency (IKL)**: Mean time interval (ms) between keystrokes. Increases during motor slowing or lexical search hesitation.
- **Typing Backspace Rate**: Ratio of delete/backspace keystrokes to total inputs. Escalates with motor tremor, visual inaccuracy, or cognitive self-correction.
- **Scroll Hesitation & Direction Reversals**: Measures micro-pauses and abrupt directional scroll reversals, correlating with disorientation.
- **Session Duration & Interaction Velocity**: Quantifies general user navigation pacing.

#### 3. Acoustic Voice Journal (`VoiceJournal.js` & `backend/agents/voice.py`)
- Standardized narrative elicitations (e.g., Cookie Theft Picture description, autobiographical recall, structured prompt storytelling).
- **Physical Acoustic Biomarkers**:
  - *Fundamental Frequency (Pitch)*: Tracks vocal cord modulation and fundamental frequency variation.
  - *Jitter & Shimmer*: Micro-variations in pitch period and acoustic amplitude; indicators of laryngeal neuro-motor stability.
  - *Pause-to-Speech Ratio*: Proportion of silent acoustic intervals relative to voiced phonation.
  - *Mean & Longest Pause Duration*: Extended conversational latencies reflecting word-finding difficulty (anomia).
  - *Words Per Minute (WPM)*: Overall expressive speech tempo.
  - *Type-Token Ratio (TTR)*: Lexical diversity and richness (unique words divided by total words).
  - *Hesitation / Filler Frequency*: Counts occurrences of vocalized fillers (*"um"*, *"uh"*, repeated prefixes).
- **Validated Machine Learning Classifier (`speech_model.py`)**:
  - 5-feature normalized pipeline (`speech_activity_ratio`, `pause_rate_per_minute`, `mean_rms`, `words_per_minute`, `vocabulary_richness`).
  - Evaluates continuous probability against operating thresholds (0.92 default) to yield Screen Positive / Screen Negative flags with clinical confidence metrics.

#### 4. Longitudinal CUSUM Surveillance (`LongitudinalTrendAgent`)
- Standard cross-sectional scores miss gradual subtle decline. CogniVeil employs two mathematical statistical process control algorithms:
  1. **EWMA (Exponentially Weighted Moving Average)**:
     $$\text{EWMA}_t = \lambda \cdot S_t + (1 - \lambda) \cdot \text{EWMA}_{t-1}$$
     Filters out acute day-to-day transient fluctuations (poor sleep, temporary stress, distraction).
  2. **CUSUM (Cumulative Sum Control Chart)**:
     $$C_t = \max(0, C_{t-1} + (K - (S_t - \mu_{\text{baseline}})))$$
     Accumulates systematic deviations from the patient's established baseline ($\mu_{\text{baseline}}$). If $C_t > H$ (decision boundary $H = 12.0$), a **CUSUM Drift Flag** is raised, automatically recommending Tier 2 escalation.

---

### Tier 2: Multimodal Health & Lifestyle Risk Assessment (`Level2Assessment.js`)

Tier 2 captures the broader clinical, vascular, genetic, and environmental context using a 20-feature matrix.

#### 20 Categorized Feature Drivers
| Category | Features |
| :--- | :--- |
| **Cognitive Baseline (Level 1)** | Word Recall Score, Digit Span Score, Pattern Recall Score, Reaction Time Latency (ms) |
| **Behavioral Telemetry (Level 1)** | Typing Speed (WPM), Backspace Rate, Scroll Hesitation, Speech Pause Ratio |
| **Longitudinal Stability** | EWMA Score, CUSUM Drift Statistic |
| **Demographics & Reserve** | Patient Age, Education Years, Body Mass Index (BMI) |
| **Vascular & Metabolic** | Hypertension (Systolic/Diastolic), Type 2 Diabetes, High Cholesterol |
| **Genetic & Neuropsychiatric**| Family History of Dementia, APOE-ε4 Carrier Status, Sleep Disruption Index, Depression Severity Index |

#### CatBoost ML & TreeSHAP Explainability
- A trained **CatBoost Classifier** predicts probabilistic risk tier: Low, Moderate, or High.
- **TreeSHAP (SHapley Additive exPlanations)** calculates exact local feature attributions:
  $$\text{Prediction} = \phi_0 + \sum_{i=1}^{M} \phi_i$$
- Categorizes drivers into **Modifiable** (sleep fragmentation, hypertension, aerobic inactivity, metabolic markers) versus **Non-Modifiable** (chronological age, genetic APOE-ε4 status).
- Generates specific, personalized clinical action items (e.g., *"Anti-hypertensive review with Primary Care"*, *"Sleep hygiene / Polysomnography OSA referral"*, *"150 min/wk aerobic exercise plan"*).

---

### Tier 3: Neuroimaging & Brain MRI Morphometry (`Level3MRI.js` & `backend/mri_model.py`)

Tier 3 acts as the confirmatory neuroimaging evaluation layer.

- **Volumetric Classification Architecture**:
  - Based on a deep Convolutional Neural Network (PyTorch ResNet-18) trained on normalized T1-weighted MPRAGE structural scans from OASIS and ADNI datasets.
- **Clinical Dementia Rating (CDR) Staging**:
  - CDR 0.0: No Cognitive Impairment / Healthy Brain Morphology.
  - CDR 0.5: Very Mild Cognitive Impairment / Early Medial Temporal Lobe Sparing.
  - CDR 1.0: Mild Dementia / Definite Hippocampal & Entorhinal Atrophy.
  - CDR 2.0: Moderate Dementia / Global Cerebral Atrophy with Significant Ventriculomegaly.
- **Grad-CAM (Gradient-Weighted Class Activation Mapping)**:
  - Generates spatial heatmaps displaying the neural network's focal activation regions.
  - Highlights whether model attention is localized to the **Hippocampus**, **Entorhinal Cortex**, or **Enlarged Ventricles**.
  - Provides slice-by-slice axial, coronal, and sagittal view navigation with adjustable Grad-CAM opacity overlays and Jet colormap legends.

---

### Dementia Type Profiling Engine (`backend/dementia_pattern_model.py`)

A specialized, clinician-only decision support engine that performs multiclass pattern estimation across 5 diagnostic patterns:
1. **Healthy Control**
2. **Alzheimer's-like Pattern** (prominent delayed memory recall loss, temporal atrophy, APOE-ε4 association)
3. **Vascular-like Pattern** (elevated hypertension, pulse pressure, stepwise executive dysfunction, motor slowing)
4. **Lewy Body-like Pattern** (marked visual-spatial deficits, reaction time volatility, sleep disruption / REM behavior)
5. **Frontotemporal (FTD)-like Pattern** (behavioral disinhibition, executive impairment, relative episodic memory preservation)

---

## 4. The 10-Node Autonomous Agent Pipeline & 18 MCP Tools

CogniVeil implements an asynchronous, decoupled multi-agent intelligence architecture coordinated through the Model Context Protocol (MCP).

```
   [Incoming Screening Data / Telemetry]
                     |
                     v
   +------------------------------------+
   |   01. DataQualityAgent             |  <-- MCP: validate_input
   +------------------------------------+
                     |
         +-----------+-----------+
         |           |           |
         v           v           v
  +--------------+ +-----------+ +--------------+
  | 02. Cognitive| |03.Behavior| | 04. Voice    |  <-- MCP: analyze_cognitive_tests,
  |     Agent    | |   Agent   | |     Agent    |           analyze_typing, analyze_scrolling,
  +--------------+ +-----------+ +--------------+           detect_language, analyze_voice
         |           |           |
         +-----------+-----------+
                     |
                     v
   +------------------------------------+
   |   05. SignalFusionEngine           |  <-- MCP: score_tier1
   +------------------------------------+
                     |
                     v
   +------------------------------------+
   |   06. LongitudinalTrendAgent       |  <-- MCP: analyze_longitudinal_trend
   +------------------------------------+
                     |
                     v
   +------------------------------------+
   |   07. RiskOrchestrationAgent       |  <-- MCP: predict_risk, classify_mri,
   +------------------------------------+           calculate_morphometry
                     |
                     v
   +------------------------------------+
   |   08. ClinicalSynthesisAgent       |  <-- MCP: retrieve_guideline, synthesize_evidence,
   |       (MedGemma-4B Grounding)      |           draft_report, generate_referral
   +------------------------------------+
                     |
                     v
   +------------------------------------+
   |   09. SafetyAgent (Guardrails)     |  <-- MCP: check_output_safety
   +------------------------------------+
                     |
                     v
   +------------------------------------+
   |   10. AuditAgent                   |  <-- MCP: log_audit
   +------------------------------------+
```

### The 18 Typed MCP Tools
1. `validate_input`: Type constraints, range validation (18-120 yrs, 0-100 scores), provenance auditing.
2. `collect_baseline`: Establishes 14-day rolling intra-individual baseline metrics.
3. `score_tier1`: Computes composite active (60%) + passive (40%) CogniScore.
4. `analyze_cognitive_tests`: Normalizes TMT-B, Stroop, and Digit Span to normative Z-scores and percentiles.
5. `analyze_typing`: Evaluates Inter-Key Latency (IKL) and backspace error rates.
6. `analyze_scrolling`: Quantifies hesitation index and velocity variance.
7. `detect_language`: Identifies language and phonetic characteristics for speech biomarker calibration.
8. `analyze_voice`: Extracts acoustic features (pitch, jitter, shimmer, pause duration) and ML risk probability.
9. `analyze_longitudinal_trend`: Runs EWMA filtering and CUSUM change-point drift analysis.
10. `predict_risk`: Executes CatBoost Level 2 multivariate risk classification with TreeSHAP.
11. `classify_mri`: Infers ResNet-18 volumetric CDR stage from brain neuroimaging.
12. `calculate_morphometry`: Computes hippocampal volume ratio, entorhinal thickness, ventricular enlargement index.
13. `retrieve_guideline`: Contextualizes findings against NICE, AAN, and DSM-5 clinical dementia guidelines.
14. `synthesize_evidence`: Connects cross-tier signals into the Multimodal Evidence Graph.
15. `draft_report`: Constructs the structured 12-section clinical referral draft.
16. `check_output_safety`: Validates guardrails (prohibits deterministic diagnosis, ensures advisory disclaimer).
17. `generate_referral`: Assigns urgency triage, target specialty (Memory Clinic / Neurologist), and recommended battery.
18. `log_audit`: Writes immutable, HIPAA-compliant audit entries to `AuditLog`.

---

## 5. MedGemma-4B Clinical Decision Support & Referral Dossier

### 12-Section Evidence Dossier Structure (`ReferralReport.js`)
1. **Assessment & Patient Overview**: Demographics, CogniScore (0-100), screening tier reached, CUSUM drift status.
2. **Executive Clinical Summary**: MedGemma-4B generated contextual summary written in formal clinical prose.
3. **Active Cognitive Battery Performance**: Subtest breakdown (Visual Recall, Digit Span, Stroop, TMT) with Z-scores, normative percentiles, and deficit flags.
4. **Digital Biomarker Telemetry**: Physical acoustic metrics (pause duration, pause-to-speech ratio) and keystroke dynamics (IKL, backspace rate) compared to healthy norms.
5. **Tier 2 Multivariate Risk & TreeSHAP Drivers**: Top mathematical feature contributions with modifiability categorization.
6. **Tier 3 Neuroimaging Findings**: Structural MRI classification, CDR rating, and Grad-CAM focal attention zones.
7. **Dementia Subtype Correlation**: Multiclass pattern probabilities (Alzheimer's, Vascular, Lewy Body, FTD).
8. **Longitudinal Trajectory & CUSUM Change-Points**: Multi-week trendline analysis detecting onset of deviation.
9. **Patient & Caregiver Functional Observations**: Caregiver telemetry and reported activities of daily living (ADL).
10. **Differential Diagnosis Considerations**: Rule-out factors (thyroid dysfunction, B12 deficiency, pseudo-dementia/depression).
11. **Actionable Referral Pathway**: Target specialty, referral urgency (e.g., *High: within 2 weeks*), and specific clinical rationale.
12. **Regulatory Notice & Clinician Sign-Off**: Mandatory advisory disclaimer, clinician signature line, NPI / license number, and date stamp.

### Automated Binary PDF Generation (`backend/services/pdf_report.py`)
- Built using ReportLab.
- Emits print-ready, high-resolution vector PDF referral packets with embedded clinical tables, urgency badges, and doctor sign-off fields.

---

## 6. Patient Consent, Care Circle & Privacy Governance

### Granular Consent (`Consent.js`)
- CogniVeil does not record passive keystrokes, voice audio, or lifestyle factors without explicit, opt-in patient consent.
- Patients can view their exact telemetry permissions, revoke consent at any moment, or download an audit log of collected signals.

### Care Circle Telemetry Sharing (`CareCircle.js`)
- Patients retain sovereign control over who accesses their cognitive trends.
- Caregivers or family members request access via email invitation.
- The patient must explicitly **Grant Access**.
- The patient can instantly **Revoke Access** at any time.
- Unconsented raw data is never exposed; caregivers only receive high-level trend summaries and drift alerts.

---

## 7. Database Entity Relationship Model (`models.py`)

The SQLite database (`backend/cogniveil.db`) contains 8 relational tables:

```
+-----------------------------------------------------------------------------------------------+
|                                            USERS                                              |
+-----------------------------------------------------------------------------------------------+
| id (PK, Int)                                                                                  |
| name (Str) | email (Unique, Str) | hashed_password (Str) | age (Int) | gender (Str)          |
| role ("patient" | "clinician") | is_caregiver (Bool)                                         |
| consent_granted (Bool) | consent_granted_at (DateTime)                                        |
| baseline_status ("collecting" | "established") | level2_status ("not_collected" | "completed")|
| level2_data (Text JSON) | combined_risk_score (Float)                                         |
| apoe_e4_provenance (Str) | mri_provenance (Str) | created_at (DateTime)                          |
+-----------------------------------------------------------------------------------------------+
        |                     |                     |                     |
        | 1:N                 | 1:N                 | 1:N                 | 1:N
        v                     v                     v                     v
+------------------+  +------------------+  +------------------+  +------------------+
|   COGNISCORES    |  | PASSIVE_SIGNALS  |  |   TEST_RESULTS   |  |   AUDIT_LOGS     |
+------------------+  +------------------+  +------------------+  +------------------+
| id (PK, Int)     |  | id (PK, Int)     |  | id (PK, Int)     |  | id (PK, Int)     |
| user_id (FK)     |  | user_id (FK)     |  | user_id (FK)     |  | user_id (FK)     |
| score (Float)    |  | typing_speed     |  | test_type (Str)  |  | tool_name (Str)  |
| active_score     |  | backspace_rate   |  | score (Float)    |  | input_summary    |
| passive_score    |  | scroll_hesitation|  | duration_seconds |  | output_summary   |
| risk_level (Str) |  | session_duration |  | metadata_json    |  | pipeline_state   |
| ewma_score       |  | created_at       |  | created_at       |  | guardrail_passed |
| cusum_value      |  +------------------+  +------------------+  | created_at       |
| baseline_mean    |                                              +------------------+
| is_deviating     |
| created_at       |
+------------------+

+------------------------+  +------------------------+  +------------------------+
|    CAREGIVER_ACCESS    |  |    CLINICAL_REPORTS    |  |      APPOINTMENTS      |
+------------------------+  +------------------------+  +------------------------+
| id (PK, Int)           |  | id (PK, Int)           |  | id (PK, Int)           |
| caregiver_id (FK->User)|  | user_id (FK->User)     |  | user_id (FK->User)     |
| patient_id (FK->User)  |  | cogni_score (Float)    |  | patient_id (FK->User)  |
| status ("pending"|...) |  | risk_level (Str)       |  | clinician_id (FK->User)|
| created_at (DateTime)  |  | is_deviating (Bool)    |  | appointment_date (Str) |
| accepted_at (DateTime) |  | combined_risk_score    |  | appointment_time (Str) |
+------------------------+  | narrative (Text)       |  | status ("scheduled"|..)|
                            | referral_action (Str)  |  | reason (Str)           |
                            | recommended_specialist |  | notes (Text)           |
                            | urgency (Str)          |  | created_at (DateTime)  |
                            | guardrail_passed (Bool)|  +------------------------+
                            | created_at (DateTime)  |
                            +------------------------+
```

---

## 8. Complete API Endpoint Surface (`backend/main.py`)

### Authentication & User Identity
- `POST /register`: Registers a new patient or clinician with password hashing.
- `POST /login`: Validates credentials, returns JWT bearer token and user role profile.
- `POST /auth/google`: Handles official Google Identity Services OAuth 2.0 credential verification.
- `GET /me`: Returns the currently authenticated user's profile and consent status.
- `PUT /users/profile`: Updates user profile information (name, age, gender).

### Telemetry & Ingestion (Tier 1)
- `POST /passive-signals`: Ingests real-time typing speed, backspace rates, scroll hesitation, and session timing.
- `POST /tests/result`: Records active cognitive test scores (Pattern Recall, Digit Span, Stroop, TMT-A/B).
- `GET /dashboard`: Returns recent CogniScore trends, test results, and passive signals for the active user.
- `POST /voice/analyze`: Multipart audio upload; processes acoustic biomarkers (pitch, jitter, shimmer, pauses, WPM, TTR) and executes the ML speech risk classifier.
- `GET /voice/status`: Returns current status and metadata of the speech model artifact.

### Clinical Assessment (Tier 2 & Tier 3)
- `POST /level2/predict`: Runs the CatBoost Level 2 assessment model; returns risk classification and TreeSHAP waterfall values.
- `GET /level2/data`: Retrieves saved Level 2 survey data and risk scores.
- `POST /mri/classify`: Uploads brain MRI scan image; runs PyTorch ResNet-18 classification, returns CDR stage and Grad-CAM spatial heatmap.
- `POST /dementia-pattern/predict`: Evaluates 20-feature matrix across the 5 dementia subtypes; returns class probabilities and primary drivers.

### Clinical Decision Support & Dossier Generation
- `GET /clinician/patients`: Returns all monitored patients in the clinician's cohort with risk tiers and drift flags.
- `GET /clinician/patient/{id}/overview`: Returns comprehensive dossier data for a specific patient.
- `POST /clinician/patient/enroll`: Clinicians enroll a new patient directly into surveillance.
- `PUT /clinician/patient/{id}`: Modifies patient clinical details.
- `DELETE /clinician/patient/{id}`: Removes a patient from cohort surveillance.
- `POST /clinical-report`: Generates a structured 12-section MedGemma-4B clinical synthesis JSON object.
- `POST /clinical-report/download-pdf`: Generates and streams a binary ReportLab PDF referral dossier.
- `GET /clinician/patient/{id}/download-pdf`: Downloads an official referral PDF for a cohort patient.

### Care Circle & Appointments
- `POST /caregiver/invite`: Sends a consent-based telemetry sharing invitation to a patient.
- `GET /caregiver/patients`: Retrieves all patients who have approved caregiver access.
- `GET /sharing/requests`: Retrieves incoming caregiver access requests for the logged-in patient.
- `POST /sharing/request/{id}/accept`: Grants caregiver access.
- `POST /sharing/request/{id}/revoke`: Revokes caregiver access.
- `GET /appointments`: Lists user appointments (strictly isolated by clinician/patient ID).
- `POST /appointments`: Schedules a new appointment consultation.
- `PUT /appointments/{id}`: Updates appointment status (e.g., *Confirmed*, *Completed*, *Cancelled*).
- `DELETE /appointments/{id}`: Cancels an appointment.

---

## 9. Design System & Frontend Component Architecture

### Aesthetic Design Philosophy
- **Palette**: Cohesive, clinical, and calming green/slate palette avoiding harsh generic colors.
  - Dark Theme: Deep Forest/Olive (`#111A12`, `#142016`, `#1a291d`), Pale Olive Text (`#F1F5EE`, `#D8E2D4`), Sage Accents (`#A3B18A`, `#00D4AA`).
  - Light Theme: Soft Mint/Sage (`#F3F8F1`, `#FFFFFF`), Slate/Forest Text (`#1B2A1A`, `#273822`), Evergreen Accents (`#287C78`, `#0F4C4A`).
- **Typography Hierarchy**:
  - Editorial Serifs (`Newsreader`): Section hero headings, executive summaries, clinical dossier titles.
  - Clean Technical Sans (`Inter`, `Plus Jakarta Sans`): Technical UI, controls, tables, buttons, navigation items.
  - Tabular Monospace (`JetBrains Mono`): Numeric telemetry values, Z-scores, IKL latencies, timestamps, confidence scores.
- **Glassmorphism & Depth**: Subtly blurred translucent cards (`backdrop-filter: blur(14px)`), hairline borders (`rgba(163, 177, 138, 0.22)`), and elevation drop shadows.

### Primary Page Catalog
- [Landing.js](file:///c:/Users/siddf/.gemini/antigravity-ide/scratch/Cogniveil/frontend/src/pages/Landing.js): Public overview, mission briefing, architecture demonstration, interactive tier exploration.
- [Login.js](file:///c:/Users/siddf/.gemini/antigravity-ide/scratch/Cogniveil/frontend/src/pages/Login.js) / [Register.js](file:///c:/Users/siddf/.gemini/antigravity-ide/scratch/Cogniveil/frontend/src/pages/Register.js): Role selection, remember-device persistence, Google OAuth 2.0 integration.
- [Dashboard.js](file:///c:/Users/siddf/.gemini/antigravity-ide/scratch/Cogniveil/frontend/src/pages/Dashboard.js): Primary hub; adapts dynamically for Clinicians (cohort metrics, patient cards, drift alerts) vs Patients (personal CogniScore, daily battery launch, progress chart).
- [Patients.js](file:///c:/Users/siddf/.gemini/antigravity-ide/scratch/Cogniveil/frontend/src/pages/Patients.js): Clinician Cohort Surveillance table with multi-filter search, risk badge sorting, and patient enrollment modal.
- [Tests.js](file:///c:/Users/siddf/.gemini/antigravity-ide/scratch/Cogniveil/frontend/src/pages/Tests.js): Active micro-battery suite with real-time Trail Making Test interactive canvas.
- [VoiceJournal.js](file:///c:/Users/siddf/.gemini/antigravity-ide/scratch/Cogniveil/frontend/src/pages/VoiceJournal.js): Audio recording hub, live animated waveform bars, sample demo audio loaders, acoustic parameter cards, Xue et al. risk gauge.
- [Level2Assessment.js](file:///c:/Users/siddf/.gemini/antigravity-ide/scratch/Cogniveil/frontend/src/pages/Level2Assessment.js): Multi-step clinical assessment questionnaire, CatBoost risk tiering, TreeSHAP waterfall visualization.
- [Level3MRI.js](file:///c:/Users/siddf/.gemini/antigravity-ide/scratch/Cogniveil/frontend/src/pages/Level3MRI.js): DICOM/T1 MRI scan dropzone, preloaded clinical scan library, PyTorch ResNet-18 CDR prediction, Grad-CAM interactive slice viewer.
- [DementiaProfiling.js](file:///c:/Users/siddf/.gemini/antigravity-ide/scratch/Cogniveil/frontend/src/pages/DementiaProfiling.js): Clinician differential subtype estimator with probability radar and feature impact rankings.
- [ReferralReport.js](file:///c:/Users/siddf/.gemini/antigravity-ide/scratch/Cogniveil/frontend/src/pages/ReferralReport.js): 12-Section evidence dossier with patient selector, in-browser printable paper view, and binary PDF downloader.
- [Appointments.js](file:///c:/Users/siddf/.gemini/antigravity-ide/scratch/Cogniveil/frontend/src/pages/Appointments.js): Clinical consultation scheduling, tele-visit tracking, clinician notes.
- [CareCircle.js](file:///c:/Users/siddf/.gemini/antigravity-ide/scratch/Cogniveil/frontend/src/pages/CareCircle.js): Caregiver invitation, permission granting, and instant access revocation.
- [Consent.js](file:///c:/Users/siddf/.gemini/antigravity-ide/scratch/Cogniveil/frontend/src/pages/Consent.js): Sovereign telemetry consent toggles, privacy audit trail, data purge controls.

---

## 10. Pre-Seeded Cohort Profiles & Verification Credentials

The backend automatically seeds a representative clinical cohort into `backend/cogniveil.db`:

| Account | Role | Email | Password | Clinical Trajectory & Profile |
| :--- | :--- | :--- | :--- | :--- |
| **Dr. Jackson Santos** | Clinician | `clinician@demo.com` | `demo1234` | Full clinical surveillance access across all cohort patients, referral dossiers, and MRI reviews. |
| **Arjun Sharma** | Patient (Low Risk) | `arjun@demo.com` | `demo1234` | Age 68 · CogniScore 88 · Stable baseline · Normal typing and acoustic pause metrics. |
| **Meena Krishnan** | Patient (Moderate Risk) | `meena@demo.com` | `demo1234` | Age 72 · CogniScore 64 · Mild Cognitive Impairment (MCI) trajectory · Moderate CUSUM drift. |
| **Rajan Pillai** | Patient (High Risk) | `rajan@demo.com` | `demo1234` | Age 78 · CogniScore 38 · Significant intra-individual decline · Severe CUSUM deviation flagged &middot; Elevated backspaces & long acoustic pauses. |

---

## 11. Verification & Testing Commands

- **Frontend Compilation**:
  ```powershell
  cd frontend
  npm.cmd run build
  ```
- **Backend Voice Pipeline Test**:
  ```powershell
  python backend/test_voice_cases.py
  ```
- **Backend Trail Making Test Test**:
  ```powershell
  python backend/test_api_trail_making.py
  ```
- **Role Isolation & Strict Access Enforcement**:
  ```powershell
  python backend/test_appointment_isolation_strict.py
  ```

---
*End of CogniVeil Architectural Blueprint. Generated for development reference and system documentation.*
