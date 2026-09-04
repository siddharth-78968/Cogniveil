# CogniVeil — Dev Action Items (from Mid-Evaluation Jury Feedback)

> Feed this directly into Antigravity IDE. Each item lists: the problem, the file(s) likely involved, and the exact change to make. Ordered by priority (bug fixes first, then UX restructuring, then new features).

---

## PRIORITY 0 — Bug Fixes (do these first, they're quick and currently visible on-screen)

### 0.1 Fix incorrect "Bi-Modal" label on Dashboard
- **File:** `frontend/src/pages/Dashboard.js`
- **Problem:** The "CogniScore Modality Contribution & Primary Drivers" card displays the label `Bi-Modal (80/20)` but the actual breakdown shown directly below it is THREE components: Active Cognitive Battery (60%), Behavioral Telemetry (20%), Acoustic Voice Biomarkers (20%).
- **Change:** Update the label to reflect the real tri-modal weighting, e.g. `Tri-Modal (60/20/20)`. Ensure the label is generated dynamically from the actual weight config, not hardcoded, so it can never drift out of sync again — pull from the same source that renders the three progress bars below it.

### 0.2 Fix "3-minute daily tests" copy inconsistency
- **File:** `frontend/src/pages/Dashboard.js` (welcome banner), `frontend/src/pages/Tests.js`
- **Problem:** Dashboard promises "3-minute daily tests," but the full battery (6 tests: Pattern Recall ~2min, Digit Span ~1min, Word Recall ~2min, Stroop ~1min, Trail Making ~2min, Reaction Time ~1min) totals ~9 minutes.
- **Change:** Once the daily/weekly rotation split is implemented (see section 2 below), update copy to accurately reflect the daily subset time (e.g., "Take your ~2-3 minute daily check-in"), and separately label the full weekly battery with its own accurate time estimate.

---

## PRIORITY 1 — Role-Based UI Separation (Patient view vs Clinician view)

**Core principle:** Patient-facing screens show only what a patient needs to act (score, trend, buttons). Clinician-facing screens keep full technical depth (SHAP, Grad-CAM, agent logs, audit trail). Same data, different presentation layer per role.

### 1.1 Strip clinician-level telemetry from patient Dashboard
- **File:** `frontend/src/pages/Dashboard.js`
- **Remove from default patient view (or move behind a collapsed toggle, closed by default):**
  - "CogniScore Modality Contribution & Primary Drivers" detailed breakdown (weight %, pts, "How did CogniVeil reach this result?")
  - "Real-Time MCP Execution Timeline" (agent/tool call logs like `System::analyse_voice`, `System::classify_mri`)
  - "Immutable Agent Audit Trail" section
  - "Recent Screening Sessions" table with EWMA Filter / Drift Flag / Passive Keystrokes columns
- **Keep visible by default for patient:**
  - CogniScore number + simple trend (up/down/stable arrow, plain language e.g. "Similar to last week")
  - "Take Today's Test" CTA
  - Voice journal CTA
  - Streak/calibration progress (simplify — see 1.3)
- **Implementation approach:** Add a component-level `role` prop or route guard (`/dashboard` for patients, `/clinician/patient/:id/overview` for clinicians) that conditionally renders the detailed sections only when `user.role === 'clinician'`. If a single Dashboard.js currently serves both roles, split rendering logic with an early conditional block, or split into `PatientDashboard.js` and `ClinicianDashboard.js` components.
- **For sections removed from default patient view but not clinician-only:** wrap in a collapsible `<details>`/accordion component labeled "View technical details" — collapsed by default — rather than deleting, so power users can still expand if curious.

### 1.2 Remove clinical-rationale text from patient-facing Test cards
- **File:** `frontend/src/pages/Tests.js`
- **Problem:** Each test card shows an italicized line like *"Evaluates hippocampal spatial encoding & working memory coordinate fidelity"* — clinician-relevant, patient-irrelevant, adds visual weight.
- **Change:** Remove this line from the patient-facing card render. Keep the plain-language description line ("Memorize an illuminated matrix grid...") only. Move the clinical-rationale text into the clinician's patient-overview screen instead, where it's actually useful.

### 1.3 Simplify streak/calibration UI on Dashboard
- **File:** `frontend/src/pages/Dashboard.js`
- **Problem:** Currently multiple stacked bordered cards (streak counter + mini 7-day calendar + separate "clinical lead-time window" banner) before any real content.
- **Change:** Consolidate into a single, simpler progress element — one line of text + one progress bar (e.g., "Day 2 of 7 — building your baseline") without the separate mini-calendar grid and separate advisory banner as distinct boxed sections. Combine or remove one of the two.

---

## PRIORITY 2 — Test Battery Restructuring (frequency + flow)

### 2.1 Implement daily/weekly test rotation
- **Files:** `frontend/src/pages/Tests.js`, backend scheduling logic (likely `backend/main.py` or a new `backend/services/test_scheduler.py`)
- **Change:**
  - **Days 1–7 (baseline calibration period):** show all 6 tests daily, matching current "Day 2 of 7: Baseline Calibration" behavior — no change here, this part is already correct.
  - **After baseline established (`baseline_status == "established"`):**
    - Daily view shows only **2 tests**, rotating through a fixed weekly schedule (e.g., Mon: Reaction Time + Digit Span, Tue: Stroop + Pattern Recall, etc. — define a rotation table).
    - Once weekly, surface the **full 6-test battery** as a distinct "Weekly Full Check-In."
  - Add a `test_rotation_schedule` config (day-of-week → test IDs) that the frontend reads to determine which tests to display that day.

### 2.2 Convert Tests page from a list to a guided auto-advancing flow
- **File:** `frontend/src/pages/Tests.js`
- **Problem:** Currently renders a scrollable list of 6 (or 2, post-2.1) test cards the patient must choose from — decision fatigue.
- **Change:** Replace the card-list UI with a single-focus guided flow:
  - Show one test at a time, full-screen/large touch target.
  - Header indicator: "Test 1 of 2" (dynamic based on how many are scheduled that day).
  - On completion, auto-advance to the next test without returning to a list.
  - Play the relevant "Elderly Voice Guidance" audio instruction automatically before each test begins (leverage existing audio guidance feature — currently a manual "Play Instructions" button; consider auto-play with a mute option instead of requiring a manual tap).

---

## PRIORITY 3 — Voice Journal: Fear-Reduction & Trust Features

### 3.1 Add reassurance copy to Voice Journal screen
- **File:** `frontend/src/pages/VoiceJournal.js`
- **Change:** Add visible text near the record button: *"There's no right or wrong answer — just talk naturally."* Add a second line near the privacy area: *"Only you and your care team can hear this. Your family only sees trends, never the raw recording."*

### 3.2 Add a practice/trial recording mode
- **File:** `frontend/src/pages/VoiceJournal.js`, backend `backend/agents/voice.py`
- **Change:** For first-time users (or via a persistent "Try a practice recording" button), allow a trial recording that:
  - Uses the same UI/mic flow as the real recording.
  - Is explicitly NOT sent to the backend for analysis / NOT logged to `TEST_RESULTS` or passed through `analyze_voice`.
  - Shows a confirmation like "Great, that's how it works — ready to do the real one?"

### 3.3 Remove/delay instant score reveal after recording
- **File:** `frontend/src/pages/VoiceJournal.js`
- **Problem:** If the current flow shows a risk score/gauge immediately after the patient finishes speaking, this creates exam-like pressure.
- **Change:** After recording, show a neutral confirmation only (e.g., "Thank you — recorded successfully"). Do NOT surface the risk gauge/score on the patient-facing confirmation screen; keep that data visible only in the clinician view / patient's own trend chart (not as an immediate post-recording reveal).

### 3.4 Clarify mic recording state visually
- **File:** `frontend/src/pages/VoiceJournal.js`
- **Change:** Ensure the mic icon has an unambiguous, high-contrast "Recording..." active state (e.g., pulsing animation + red/active color + text label), distinct from the idle state, so there's never ambiguity about whether audio is being captured.

---

## PRIORITY 4 — PWA Conversion (addresses "should've been an app")

### 4.1 Add Web App Manifest
- **New file:** `frontend/public/manifest.json`
- **Content requirements:** app name ("CogniVeil"), short_name, icons (192x192, 512x512 — use existing brand assets), theme_color and background_color matching the existing green/slate palette (`#111A12` dark / `#F3F8F1` light), `display: "standalone"`, `start_url`.
- **Link it:** add `<link rel="manifest" href="/manifest.json">` to `frontend/public/index.html`.

### 4.2 Add a basic Service Worker
- **New file:** `frontend/public/service-worker.js` (or use Create React App's built-in `serviceWorkerRegistration.js` if the project was CRA-bootstrapped — check `frontend/src/index.js` for existing registration code first before adding a duplicate).
- **Scope for hackathon MVP:** cache static assets (JS/CSS bundle, icons) for offline shell loading and enable "Add to Home Screen" prompt. Do not attempt complex background sync for passive telemetry at this stage — note as a known iOS limitation in the pitch, not something to solve now.

### 4.3 Register service worker
- **File:** `frontend/src/index.js`
- **Change:** Call `serviceWorkerRegistration.register()` (currently likely commented out or set to `unregister()` by default in CRA templates — flip to `register()`).

---

## PRIORITY 5 — Documentation / Talking-Point Prep (non-code, but prepare before next round)

### 5.1 Build a concrete end-to-end patient walk-through
- Not a code change — a rehearsed narrative using real seeded data (e.g., Rajan Pillai, High Risk patient) tracing: CogniScore composition → SHAP top 3 drivers with actual point values → CUSUM value vs threshold H=12.0 → resulting referral urgency. See `CogniVeil_Jury_Challenges_and_Solutions.md` section 7d for the template.

### 5.2 Prepare an honest calibration-gap statement
- Have a ready, non-defensive line acknowledging that current thresholds (CUSUM H=12.0, voice screen 0.92, etc.) are reasonable defaults from cited methodology, not yet validated against real longitudinal outcome data — and that this validation is explicitly a next-phase roadmap item.

---

*Companion file: `CogniVeil_Jury_Challenges_and_Solutions.md` — contains the full reasoning and jury-facing framing for each item above.*
