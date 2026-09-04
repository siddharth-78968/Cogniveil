# CogniVeil: Clinical Intelligence & Precision Cognitive Drift Surveillance Platform
## Comprehensive Architectural, Clinical, Technical & Algorithmic Master Specification

---

## 1. Executive Summary & Clinical Problem Statement

### 1.1 The Clinical Challenge
Dementia (encompassing Alzheimer's Disease, Vascular Dementia, Frontotemporal Lobar Degeneration, and Lewy Body Disease) affects over 55 million individuals globally, with prevalence projected to exceed 139 million by 2050. In standard clinical practice, a formal diagnosis is typically established **3 to 7 years after the onset of neurobiological degeneration**, often when massive, irreversible neuronal and synaptic loss has already taken place.

Current diagnostic models face severe structural barriers:
1. **Infrequent Episodic Testing**: Conventional bedside assessments (MMSE, MoCA) are administered months or years apart in artificial clinical environments, capturing single noisy snapshots confounded by white-coat anxiety, acute fatigue, and practice effects.
2. **High Barriers to Advanced Diagnostics**: Structural MRI, Amyloid/Tau PET scans, and CSF biomarkers require specialized hospital facilities, carry high financial costs, and impose months-long referral waiting lists.
3. **Invisibility of Early Sub-Clinical Drift**: Subtle early degradation in cognitive-motor functioning—such as micro-hesitations in keystroke intervals, micro-tremors, linguistic latency, and vocabulary shrinkage—remains undetectable in everyday life until overt functional impairment emerges.

### 1.2 The CogniVeil Solution
**CogniVeil** is a continuous, multi-tiered digital clinical intelligence platform engineered to detect subtle **cognitive drift** years before standard clinical thresholds are crossed. By combining **longitudinal passive digital biomarkers**, **active gamified psychometric micro-tasks**, **acoustic voice fluency analysis**, a **10-node autonomous multi-agent pipeline (MCP suite)**, and **deep learning MRI neuroimaging volumetry**, CogniVeil bridges the gap between everyday living and specialist neurological intervention.

---

## 2. Multi-Tiered Clinical Surveillance Architecture

CogniVeil implements a staged 3-Tier diagnostic escalation model designed to maximize clinical specificity while eliminating alert fatigue:

```
+-----------------------------------------------------------------------------------+
|                            TIER 1: CONTINUOUS SURVEILLANCE                        |
|   * Passive Telemetry: Typing cadence, keystroke flight time, scroll hesitation   |
|   * Active Micro-Tasks: Pattern recall, digit span, word recall, voice journal    |
|   * Statistical Drift Engine: EWMA + Two-Sided CUSUM Change-Point Detection      |
+------------------------------------------+----------------------------------------+
                                           |
                              Drift Trigger Confirmed (CUSUM > 12.0)
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                        TIER 2: CLINICAL IN-DEPTH PROFILING                        |
|   * Acoustic Speech Analysis: Pause ratio, phonation duration, spectral entropy    |
|   * Clinical ML Biomarkers: MMSE/MoCA synthesis, functional activities (FAQ)      |
|   * Multimodal Fusion Engine: Cross-attention weighted XGBoost/RandomForest       |
|   * TreeSHAP Explainability: Feature attribution & risk contribution waterfall     |
+------------------------------------------+----------------------------------------+
                                           |
                             High-Risk Phenotype Detected
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                    TIER 3: NEUROIMAGING & SPECIALIST ESCALATION                   |
|   * Deep Learning MRI Volumetry: Hippocampal & ventricular atrophy scoring       |
|   * Automated Clinical Referral: Board-ready PDF report generation (ReportLab)   |
|   * Clinician Triage Portal: Multimodal Evidence Graph & consultation scheduling  |
+-----------------------------------------------------------------------------------+
```

### 2.1 Tier 1: Continuous Digital Biomarkers & Active Micro-Tasks
- **Passive Behavioral Telemetry**:
  - *Typing Cadence & Flight Time*: Measures inter-key stroke intervals (ms), dwell duration, and backspace error-correction frequency during natural interaction.
  - *Scroll Hesitation & Visual Navigation*: Analyzes deceleration curves, mouse trajectory jitter, and orientation hesitation across dashboard sessions.
  - *Session Rhythm & Temporal Consistency*: Tracks daily engagement streaks and temporal regularity.
- **Active Micro-Assessments (1-2 minutes daily)**:
  - *Pattern Recall*: Visuospatial working memory and pattern separation.
  - *Digit Span (Forward/Backward)*: Phonological loop buffer capacity and executive control.
  - *Word Delayed Recall*: Episodic memory encoding and hippocampal retrieval fidelity.
  - *Voice Journal*: Short daily speech recordings for acoustic micro-feature extraction.

### 2.2 Tier 2: Specialized In-Depth Assessment & Speech Acoustics
When Tier 1 statistical change-point detection signals persistent cognitive drift, the platform escalates to Tier 2:
- **Acoustic Phonation & Fluency Analytics**:
  - **Pause-to-Speech Ratio**: Increased hesitation and latency before nouns.
  - **Acoustic Jitter & Shimmer**: Micro-instabilities in fundamental frequency ($F_0$) and amplitude perturbation reflecting bulbar and speech-motor coordination.
  - **Spectral Entropy & Formant Dispersion**: Quantifies vocal tract articulation clarity.
  - **Lexical Diversity & Type-Token Ratio (TTR)**: Identifies vocabulary shrinkage and circumlocution.
- **Multimodal Signal Fusion**:
  - Combines active scores, passive telemetry, acoustic markers, and demographic covariates (age, education level, APOE-$\varepsilon 4$ status).

### 2.3 Tier 3: Neuroimaging & Specialist Referral Escalation
For patients identified in moderate-to-high risk categories:
- **Structural MRI Deep Learning Classifier**:
  - Convolutional Neural Network (CNN / ResNet) architecture trained on OASIS & ADNI neuroimaging cohorts.
  - Analyzes structural T1-weighted coronal/axial slices for volumetric patterns:
    - Hippocampal atrophy index
    - Ventricular enlargement ratio
    - Cortical thickness thinning
  - Outputs 4-class diagnostic probabilities: *Non-Demented*, *Very Mild Cognitive Impairment (vMCI)*, *Mild Cognitive Impairment (MCI)*, and *Moderate Dementia*.
- **Clinical Referral Report Generator**:
  - Compiles comprehensive, auditable, PDF documentation for neurologists with embedded biomarker charts, TreeSHAP waterfall values, and recommended diagnostic workup.

---

## 3. Algorithmic Core: Drift Detection & Explainability

### 3.1 Statistical Process Control: EWMA & CUSUM Engines
To distinguish between benign day-to-day score variability (e.g., poor sleep, acute stress) and true neurodegenerative decay, CogniVeil avoids static thresholds and utilizes two industrial statistical process control algorithms:

#### Exponentially Weighted Moving Average (EWMA)
Calculates a recency-weighted baseline that tracks velocity of change without excessive noise:
$$Z_t = \lambda X_t + (1 - \lambda) Z_{t-1}$$
where:
- $X_t$ is the composite active-passive cognitive score on day $t$.
- $\lambda \in [0.15, 0.20]$ is the memory decay smoothing parameter.
- $Z_t$ represents the current smoothed trajectory.

#### Cumulative Sum (CUSUM) Quality Control
Detects sustained micro-shifts away from the individual's established 14-day baseline mean ($\mu_0$):
$$S_t^+ = \max(0, S_{t-1}^+ + (\mu_0 - X_t - k))$$
where:
- $k = 0.5 \times \sigma$ represents the allowable slack tolerance parameter.
- When $S_t^+ > h$ (decision threshold $h \approx 12.0$), the system flags **Statistically Significant Cognitive Drift**, triggering automatic Tier 2 clinical workflow recommendations.

### 3.2 TreeSHAP (Shapley Additive Explanations)
Machine learning in healthcare must not be an inscrutable black box. CogniVeil integrates **TreeSHAP** based on cooperative game theory to quantify the exact marginal contribution of every clinical and digital biomarker toward the overall risk score:
$$\phi_i = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} [f(S \cup \{i\}) - f(S)]$$
Clinicians inspect an interactive **TreeSHAP Waterfall Chart** directly in the UI, revealing:
- Whether risk is primarily driven by episodic memory decay, speech pause lengthening, or motor speed slowing.
- Objective evidence to guide differential diagnosis (e.g., distinguishing Alzheimer's amnesia from Vascular psychomotor slowing or depression-related pseudodementia).

---

## 4. The 10-Agent Autonomous Clinical Architecture (MCP Suite)

CogniVeil implements an asynchronous, decoupled multi-agent intelligence layer communicating via the standardized **Model Context Protocol (MCP)** with 18 typed clinical tools:

```
                     +---------------------------------+
                     |   RiskOrchestrationAgent (00)   |
                     +----------------+----------------+
                                      |
         +----------------------------+----------------------------+
         |                            |                            |
+--------v-------+          +---------v--------+          +--------v-------+
|  DataQuality   |          |    Behavior      |          |     Voice      |
|   Agent (01)   |          |   Agent (02)     |          |   Agent (03)   |
+--------+-------+          +---------+--------+          +--------+-------+
         |                            |                            |
+--------v-------+          +---------v--------+          +--------v-------+
|   Cognitive    |          |  Longitudinal    |          | SignalFusion   |
|   Agent (04)   |          |   Agent (05)     |          |  Engine (06)   |
+--------+-------+          +---------+--------+          +--------+-------+
         |                            |                            |
+--------v-------+          +---------v--------+          +--------v-------+
|   Clinical     |          |     Safety       |          |    Audit       |
| Synthesis (07) |          |   Agent (08)     |          |  Agent (09)    |
+----------------+          +------------------+          +----------------+
```

### 4.1 The 10 Specialized Agents
1. **RiskOrchestrationAgent**: Master pipeline supervisor. Coordinates inter-agent message passing, manages patient lifecycle states, and handles workflow escalation.
2. **DataQualityAgent**: Validates input sensor telemetry, detects packet dropouts, cleans noisy keyboard intervals, and flags missing modality attributes.
3. **BehaviorAnalysisAgent**: Analyzes typing speed variance, flight times, and scrolling hesitation indices.
4. **VoiceAnalysisAgent**: Processes acoustic speech recordings to extract acoustic pause ratios, pitch stability, and speech velocity.
5. **CognitiveTestAgent**: Scores active psychometric tasks (pattern recall, forward/backward digit span, word recall lists).
6. **LongitudinalTrendAgent**: Executes EWMA smoothing and two-sided CUSUM drift detection over 14-to-90-day time series windows.
7. **SignalFusionEngine**: Cross-modal neural/tree ensemble combining multi-source vectors into calibrated risk probabilities.
8. **ClinicalSynthesisAgent**: Synthesizes medical guidelines (NICE, NIA-AA, DSM-5) and constructs structured diagnostic summaries.
9. **SafetyAgent**: Enforces clinical guardrails, flags hallucinations, validates drug-contraindication notes, and ensures ethical AI disclosures.
10. **AuditAgent**: Records immutable, cryptographically verifiable decision path audit logs for full compliance traceability.

### 4.2 The 18-Tool MCP Specification
CogniVeil defines 18 standardized, type-checked MCP tools:
- `validate_input`: Sensor payload schema & boundary validation.
- `collect_baseline`: Establishes 14-day normative baseline per individual.
- `score_tier1`: Generates daily active/passive composite scoring.
- `analyze_cognitive_tests`: Evaluates memory, attention, and executive sub-scores.
- `analyze_typing`: Computes keystroke latency and error rates.
- `analyze_scrolling`: Quantifies hesitation index and motor instability.
- `detect_language`: Identifies language context for acoustic normalization.
- `analyze_voice`: Extracts acoustic features and hesitation metrics.
- `analyze_longitudinal_trend`: Runs EWMA & CUSUM statistical drift detectors.
- `predict_risk`: Tier 2 ML multimodal classification.
- `classify_mri`: Tier 3 deep learning neuroimaging volumetric classification.
- `calculate_morphometry`: Computes ventricular-to-brain and hippocampal volume ratios.
- `retrieve_guideline`: Semantic search across NIA-AA and clinical diagnostic criteria.
- `synthesize_evidence`: Aggregates findings into the Multimodal Evidence Graph.
- `draft_report`: Compiles clinical summary and physician notes.
- `check_output_safety`: Validates clinical safety rules and disclaimers.
- `generate_referral`: Builds exportable clinical referral payload.
- `log_audit`: Writes immutable audit entry to database.
- `check_subgroup_fairness`: Evaluates demographic parity and equal opportunity metrics across cohorts (age, gender, education).

---

## 5. Technical Stack & Architecture

```
+-----------------------------------------------------------------------------------+
|                                  FRONTEND LAYER                                   |
|   React 18 (SPA) * Recharts * Vanilla CSS Architecture * Lucide Vector Icons     |
|   Accessibility: WCAG 2.1 AA Compliant (Font Scaling, Olive/Pastel Themes)        |
+------------------------------------------^----------------------------------------+
                                           |  REST API / JWT Authentication
+------------------------------------------v----------------------------------------+
|                                   BACKEND LAYER                                   |
|   FastAPI (Python 3.13) * Uvicorn ASGI Server * Pydantic V2 * OAuth2 Password     |
|   ReportLab PDF Engine * AnyIO Thread Pools * Model Context Protocol (MCP)        |
+------------------------------------------^----------------------------------------+
                                           |  SQLAlchemy 2.0 ORM
+------------------------------------------v----------------------------------------+
|                                    DATA LAYER                                     |
|   SQLite3 with Write-Ahead Logging (WAL) Mode * 30s Timeout Resilience            |
|   Tables: Users, CogniScores, TestResults, PassiveSignals, Appointments, Audits   |
+-----------------------------------------------------------------------------------+
```

### 5.1 Backend Specifications
- **Language & Framework**: Python 3.13, FastAPI (high-performance asynchronous ASGI architecture).
- **Database & ORM**: SQLite3 configured with **Write-Ahead Logging (WAL)** mode (`PRAGMA journal_mode=WAL;`) and a 30-second concurrency timeout for concurrent multi-client operation; SQLAlchemy 2.0 ORM.
- **Authentication & Security**:
  - OAuth2 Bearer token authentication with JSON Web Tokens (JWT) signed via HS256.
  - Role-Based Access Control (RBAC) strictly delineating `clinician` and `patient` capabilities.
  - Bcrypt password hashing with multi-hash fallback compatibility for demo environments.
  - Profile modification verification via time-limited 6-digit clinical security PINs.
- **Machine Learning & Signal Processing**:
  - `PyTorch` & `Torchvision`: Structural MRI CNN feature extractor and classification.
  - `Scikit-Learn` & `XGBoost`: Multimodal risk classification and tabular ensembles.
  - `SHAP`: TreeSHAP value calculation for transparent feature attributions.
  - `Librosa` / `Scipy`: Audio processing, acoustic spectrogram analysis, and spectral entropy calculation.
- **Clinical Reporting Engine**:
  - `ReportLab`: Programmatic generation of high-resolution, vector-rendered clinical referral PDF documents.

### 5.2 Frontend Specifications
- **Framework**: React 18 Single Page Application (SPA) initialized with `react-scripts`.
- **Styling Architecture**: Vanilla CSS utilizing CSS Custom Properties (Tokens) for consistent theming:
  - **Olive Dark Mode**: Deep slate-olive surfaces (`#0D1A18`, `#122421`, `#1B332E`), soft mint highlights (`#4ADE80`), muted borders (`#1F3A34`).
  - **Pastel Green Light Mode**: Medical sage-cream tones (`#F4F8F5`, `#FFFFFF`, `#E8F2EC`), forest text (`#14352D`), emerald accents (`#2F7D5B`).
- **Data Visualization**: `Recharts` providing responsive SVG Area Charts, Trend Bars, and custom tooltips.
- **Accessibility (WCAG 2.1 AA Compliant)**:
  - Dynamic font resizing controls ($A-$, $A$, $A+$).
  - Reduced-motion toggle disabling transitions for vestibular safety.
  - High-contrast compliance across light and dark modes.
  - Zero placeholder emojis—strictly professional vector iconography.

---

## 6. Detailed Database Schema

CogniVeil operates a normalized relational schema with strict foreign key constraints and automated migrations:

```
                            +---------------+
                            |     users     |
                            +-------+-------+
                                    |
     +--------------+---------------+---------------+--------------+
     | 1:N          | 1:N           | 1:N           | 1:N          | 1:N
+----v-------+ +----v-------+ +-----v------+ +------v-----+ +------v------+
| cogni_     | | test_      | | passive_   | | appoint-   | | audit_      |
| scores     | | results    | | signals    | | ments      | | logs        |
+------------+ +------------+ +------------+ +------------+ +-------------+
```

### Table Specifications:

#### 1. `users`
- `id` (INTEGER, Primary Key)
- `email` (VARCHAR, Unique, Indexed)
- `hashed_password` (VARCHAR)
- `name` (VARCHAR)
- `age` (INTEGER)
- `gender` (VARCHAR)
- `is_caregiver` (BOOLEAN)
- `role` (VARCHAR: `patient` | `clinician`)
- `consent_granted` (BOOLEAN)
- `consent_granted_at` (DATETIME)
- `baseline_status` (VARCHAR: `not_started` | `collecting` | `established`)
- `level2_status` (VARCHAR: `not_collected` | `triggered` | `evaluated`)
- `apoe_e4_provenance` (VARCHAR: `self_reported` | `lab_confirmed`)
- `mri_provenance` (VARCHAR: `self_reported` | `clinical_upload`)
- `created_at` (DATETIME)

#### 2. `cogni_scores`
- `id` (INTEGER, Primary Key)
- `user_id` (INTEGER, Foreign Key -> `users.id`)
- `score` (FLOAT, Composite cognitive health metric 0-100)
- `active_score` (FLOAT)
- `passive_score` (FLOAT)
- `risk_level` (VARCHAR: `Low` | `Moderate` | `High`)
- `ewma_score` (FLOAT, Exponentially weighted moving average)
- `cusum_value` (FLOAT, Cumulative sum drift statistic)
- `baseline_mean` (FLOAT)
- `is_deviating` (BOOLEAN, True when $CUSUM > 12.0$)
- `trigger_level2` (BOOLEAN)
- `created_at` (DATETIME)

#### 3. `test_results`
- `id` (INTEGER, Primary Key)
- `user_id` (INTEGER, Foreign Key -> `users.id`)
- `test_type` (VARCHAR: `pattern_recall` | `digit_span` | `word_recall` | `voice_journal`)
- `score` (FLOAT, 0-100)
- `duration_seconds` (INTEGER)
- `metadata_json` (TEXT)
- `created_at` (DATETIME)

#### 4. `passive_signals`
- `id` (INTEGER, Primary Key)
- `user_id` (INTEGER, Foreign Key -> `users.id`)
- `typing_speed` (FLOAT, WPM)
- `backspace_rate` (FLOAT, ratio)
- `scroll_hesitation` (FLOAT, hesitation index)
- `session_duration` (INTEGER, seconds)
- `created_at` (DATETIME)

#### 5. `appointments`
- `id` (INTEGER, Primary Key)
- `user_id` (INTEGER, Legacy patient reference)
- `patient_id` (INTEGER, Foreign Key -> `users.id`)
- `clinician_id` (INTEGER, Foreign Key -> `users.id`, Nullable)
- `patient_name` (VARCHAR)
- `clinician_name` (VARCHAR)
- `appointment_type` (VARCHAR: e.g., `Acoustic Fluency Review`, `Tier 3 Structural MRI Consultation`)
- `scheduled_time` (VARCHAR: `YYYY-MM-DD - HH:MM AM/PM`)
- `notes` (TEXT)
- `location` (VARCHAR)
- `status` (VARCHAR: `Pending` | `Due` | `Accepted` | `Rejected` | `Cancelled` | `Finished`)
- `created_at` (DATETIME)

#### 6. `audit_logs`
- `id` (INTEGER, Primary Key)
- `user_id` (INTEGER, Foreign Key -> `users.id`, Nullable)
- `action` (VARCHAR: e.g., `login`, `score_tier1`, `triage_reassign`)
- `agent_name` (VARCHAR: e.g., `AuditAgent`, `SignalFusionEngine`)
- `tool_name` (VARCHAR)
- `input_data` (TEXT, JSON stringified)
- `output_data` (TEXT, JSON stringified)
- `pipeline_state` (VARCHAR)
- `guardrail_passed` (BOOLEAN)
- `hash_signature` (VARCHAR, SHA-256 integrity digest)
- `created_at` (DATETIME)

#### 7. `notifications`
- `id` (INTEGER, Primary Key)
- `user_id` (INTEGER, Foreign Key -> `users.id`)
- `title` (VARCHAR)
- `message` (TEXT)
- `type` (VARCHAR: `reminder` | `alert` | `info`)
- `severity` (VARCHAR: `normal` | `high` | `urgent`)
- `is_read` (BOOLEAN, Default False)
- `link` (VARCHAR)
- `created_at` (DATETIME)

---

## 7. Key User Interfaces & Experiences

### 7.1 Clinician Intelligence Dashboard (`/dashboard`)
- **Doctor Overview Greeting**: Shows clinician profile photo, credentials, supervisor badges, and active screening alerts.
- **Streak & Engagement Tracker**: Highlights patient longitudinal compliance and continuous attendance streaks.
- **Dual Triage Column System**:
  - *Appointment Request (Left)*: Lists incoming consultation requests with instant Accept ($\checkmark$) and Reject ($\times$) controls and status-aware toast feedback.
  - *Appointment Schedule (Right)*: Displays confirmed, upcoming consultations with attending physician assignments.
- **Multimodal Evidence Drawer & Modal**: Interactive node-link graph visualizing clinical data sources (Typing, Voice, Digit Span, Pattern Recall, MRI) and cross-correlations.
- **10-Agent Pipeline Visualizer**: Real-time modal detailing the lifecycle state, active MCP tools, and safety verification status across all 10 autonomous agents.
- **Recent Patients Directory**: Live search, tier status filtering, and one-click deep navigation to comprehensive patient charts.

### 7.2 Tier 2 In-Depth Assessment (`/assessment`)
- Multi-step clinical battery incorporating:
  - Acoustic recording with real-time audio waveform visualizer.
  - Working memory digit span tests with dynamic sequence pacing.
  - Visuospatial memory grids.
  - Real-time multimodal fusion calculation.

### 7.3 Tier 3 Neuroimaging & Volumetric Explorer (`/mri-scans`)
- Upload interface for axial/coronal T1 MRI DICOM/PNG slices.
- Deep learning neural net inference engine rendering:
  - Estimated hippocampal volume percentile.
  - Ventricular expansion index.
  - 4-class categorical probability distribution.
  - Direct link to generate exportable physician referral PDF.

### 7.4 Profile & Security Settings Modal
- Accessible directly by clicking the doctor or patient profile avatar.
- Allows modifications to Name, Email, Age, and Gender.
- **Clinical Security Verification Protocol**:
  - Requesting an edit issues a cryptographically secure 6-digit clinical verification PIN.
  - The modal dynamically renders a 6-cell numeric PIN input.
  - Changes are rejected by the backend unless the valid PIN is submitted, ensuring tamper-proof clinical records.

---

## 8. Complete API Directory Reference

| Method | Endpoint | Description | Authorization |
|---|---|---|---|
| `POST` | `/login` | Authenticates user; returns JWT token and user profile | Public |
| `POST` | `/register` | Registers new patient or clinician account | Public |
| `GET` | `/me` | Retrieves profile of currently authenticated user | Bearer Token |
| `PUT` | `/api/user/profile` | Updates user details with 6-digit PIN verification | Bearer Token |
| `POST` | `/api/user/request-verification-code` | Generates 6-digit security code for profile edit | Bearer Token |
| `GET` | `/api/score` | Retrieves latest composite CogniScore, EWMA, & CUSUM | Bearer Token |
| `GET` | `/api/score/history` | Fetches longitudinal score time series for charting | Bearer Token |
| `POST` | `/api/score/calculate` | Triggers on-demand calculation of multi-agent score | Bearer Token |
| `GET` | `/api/streak` | Computes consecutive day micro-task attendance streak | Bearer Token |
| `GET` | `/api/appointments` | Retrieves appointments (patient-isolated or clinician department) | Bearer Token |
| `POST` | `/api/appointments` | Schedules consultation request | Bearer Token |
| `PUT` | `/api/appointments/{id}/status` | Updates appointment status (`Accepted`, `Rejected`, `Cancelled`) | Bearer Token |
| `DELETE`| `/api/appointments/{id}` | Deletes consultation record | Bearer Token |
| `GET` | `/api/evidence-graph` | Generates multimodal node-link graph data | Bearer Token |
| `POST` | `/api/classify-mri` | Deep learning structural MRI inference | Bearer Token |
| `POST` | `/api/clinical-report/pdf` | Compiles and downloads vector-rendered PDF referral | Bearer Token |
| `GET` | `/api/audit-logs` | Retrieves immutable decision trail logs | Clinician Only |
| `POST` | `/chat` | Conversational clinical AI assistant endpoint | Bearer Token |

---

## 9. Verification, Safety & Regulatory Posture

1. **HIPAA & GDPR Alignment**:
   - Patient health information (PHI) is strictly partitioned with scoped tenant permissions.
   - Comprehensive audit logging (`AuditAgent`) captures every access and state mutation with SHA-256 integrity checksums.
2. **Clinical Safety Guardrails**:
   - The platform clearly displays clinical disclaimers: CogniVeil is a clinical intelligence surveillance platform intended to augment, not replace, formal neurological and medical diagnosis.
   - Guardrail interceptors in `SafetyAgent` flag anomalous inputs or potential algorithmic bias.
3. **Database Concurrency & High Availability**:
   - Built on SQLite3 Write-Ahead Logging (WAL) architecture with 30-second connection timeouts, preventing database lock contention during concurrent operations.
4. **Code Quality & Build Reliability**:
   - Strict adherence to modern React 18 standards, clean CSS variable token systems, zero hardcoded emojis, and robust error handling on every API boundary.

---
*Documentation compiled for CogniVeil Clinical Intelligence Systems. All rights reserved.*
