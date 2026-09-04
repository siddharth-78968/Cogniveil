# CogniVeil — Mid-Evaluation Jury Feedback: Challenges & Solutions

**Jury panel:** 1 Doctor (clinical juror) + 1 Technical juror
**Purpose of this doc:** Master reference of every question raised, why it's a valid concern, and our prepared answer — for the next round of evaluation.

---

## 1. "It should have been a web app... elderly people won't be able to use a website" (Doctor)

**Why it's a valid concern:**
Elderly users genuinely struggle more with browser navigation — tabs, URLs, re-logins — than with a simple installable app icon.

**Our answer:**
- Acknowledge the concern directly — don't get defensive.
- Reframe: the *patient-facing* surface is intentionally thin (daily battery + voice journal + background passive tracking). The heavy dashboards (SHAP, Grad-CAM, agent logs) are clinician-only.
- The real fix is **converting to a PWA (Progressive Web App)**:
  - Add `manifest.json` (name, icons, theme colors) + a service worker.
  - Becomes installable to the home screen, opens full-screen like a native app, supports basic offline caching — without maintaining separate iOS/Android codebases.
- **Honest caveats to know if pressed:**
  - iOS Safari PWA support is weaker than Android for persistent background tasks (e.g., passive keystroke/scroll telemetry running in the background).
  - Push notification reliability for daily reminders is stronger on Android PWAs than iOS.
- **Pivot point:** The **Care Circle** feature already anticipates this — a caregiver/family member can help onboard and monitor trends for patients less comfortable with any digital interface, web or app.

**Framing line for jury:** *"We kept it web-based deliberately — a PWA gives elderly patients an installable, app-like experience without fragmenting into separate codebases, letting us focus limited time on the clinical ML pipeline instead of app-store packaging."*

---

## 2. "UI has too much info" / "UI is too heavy, make it user-friendly" (Technical juror — raised twice)

**These two comments are the same root issue** seen from two angles: information density (wrong content shown to wrong audience) and visual density (too many boxes/fonts/badges even where content is appropriate). Treat as ONE unified fix in presentation.

**Why it's valid — concrete evidence from our own screens:**
- Patient dashboard shows clinician-level telemetry: modality weight %, EWMA values, drift flags, a full "Real-Time MCP Execution Timeline" (raw agent/tool logs like `System::analyse_voice`), and an "Immutable Agent Audit Trail." This is engineering telemetry, not something a 68–90 year old patient needs.
- Tests page: every test card carries a category badge, time estimate, icon, title, description, AND an italicized clinical-rationale line ("Evaluates hippocampal spatial encoding...") — useful for a clinician, pure visual noise for a patient about to take the test.
- Multiple simultaneous typography styles on one screen: serif headings + sans body + monospace data + italic captions + badge chips.
- Repetitive bordered-card pattern — nearly everything is boxed, so nothing stands out.
- **Found bug:** dashboard label says "Bi-Modal (80/20)" but the actual breakdown shown is THREE components (Active 60% / Telemetry 20% / Voice 20%) — self-contradictory and undermines credibility. **Must fix before next round.**

**Our answer / fix — Role-Based, Progressive-Disclosure UI:**
- **Patient view:** CogniScore number, simple trend indicator, "Take Today's Test" button, voice journal button. Nothing else by default.
- **Clinician view:** keeps full complexity — SHAP waterfalls, Grad-CAM, audit trail, MCP pipeline status — because clinicians *want* that explainability.
- Technical/audit details go behind a collapsed "View technical details" toggle — closed by default — rather than being deleted.
- One consistent card style, used sparingly — not every section needs a bordered box.
- Patient view: max 2 typography styles (heading + body). Drop monospace/italic from patient-facing screens entirely.
- Remove the clinical-rationale line from patient-facing test cards; move it to a clinician/detail view.

**Framing line for jury:** *"The fixes aren't scattered patches — they all come from one principle: patient view = minimal and guided, clinician view = dense and data-rich. Same platform, role-based presentation."*

---

## 3. "Why daily tests? How would this pattern work and why?" (Doctor)

**Why it's valid:**
- Daily active testing indefinitely risks patient dropout (real-world digital health engagement drops sharply after the first 1–2 weeks).
- **Test-retest learning effect**: doing the SAME active test daily can artificially inflate performance just from familiarity — ironically the exact bias our own "Passive Over Active" philosophy claims to avoid.
- High daily burden on a population (early cognitive decline) least able to sustain a new daily habit.

**Our answer:**
- Concede directly: daily active testing forever isn't realistic.
- Explain the intended frequency structure:
  - **Days 1–7:** daily active battery — but ONLY for baseline calibration (matches existing "Day 2 of 7: Baseline Calibration" UI — point at our own screen as evidence this is already time-boxed).
  - **After baseline established:** active battery drops to **2–3x/week**.
  - **Passive telemetry** (typing, scrolling) continues running in the background every day — zero extra patient effort, so daily data density isn't lost.
  - **Voice journal:** weekly — it's the most burdensome single task, so it gets the lowest frequency.
- If pushed on "why not passive-only": passive signals alone are noisier (could reflect mood, distraction, unrelated tremor, not cognition specifically). Periodic active testing gives ground-truth anchoring passive data can't.

---

## 4. "Why so many tests? Simplify it." (Doctor)

**Why it's valid — evidence:**
- Dashboard promises "3-minute daily tests" but the Tests page shows 6 separate tests (Pattern Recall ~2min, Digit Span ~1min, Word Recall ~2min, Stroop ~1min, Trail Making ~2min, Reaction Time ~1min) = ~9 minutes, not 3. This is a real inconsistency, not just a UX nitpick.
- 6 different interaction paradigms in one sitting = heavy cognitive/context-switching load, especially for elderly users.

**Our answer:**
- Concede the inconsistency directly.
- Explain WHY 6 tests exist (don't cut clinical value): each isolates a different cognitive domain, because different dementia subtypes hit different domains first —
  - Alzheimer's → episodic memory early (Word Recall)
  - Lewy Body → visuospatial + reaction time volatility (Pattern Recall, Reaction Time)
  - FTD → executive/inhibition (Stroop, Trail Making)
  - So the variety feeds the Tier 2/dementia-subtype differentiation engine — it's not arbitrary.
- **The fix is restructuring frequency, not deleting tests:**
  - **Daily (true ~2–3 min):** 2 short tests, rotating across the week.
  - **Weekly:** full 6-test battery for a complete domain sweep.
- **UI fix:** replace the scrollable list of 6 cards (decision fatigue) with a single guided auto-advancing flow ("Test 1 of 2" → "Test 2 of 2" → done). No choosing, no reading 6 descriptions.
- Lean harder into the existing "Elderly Voice Guidance" audio feature — audio explains each test right before it starts, removing the need to read anything.

---

## 5. Voice Journal — what it does, parameters, active vs passive, call recording, score basis (Doctor)

**What it is:** A structured speech elicitation task (similar to the clinically-used "Cookie Theft" picture description method) — a fixed narrative prompt, patient speaks 15–30 seconds. NOT free conversation.

**Its clinical use:** Early speech/language changes (word-finding difficulty, reduced fluency) can appear YEARS before measurable memory decline, especially in FTD and early Alzheimer's — catches signals a memory test alone would miss.

**Parameters it's based on:**
- Pitch (fundamental frequency)
- Jitter & Shimmer (micro pitch/amplitude variation — neuro-motor stability indicator)
- Pause-to-speech ratio, mean & longest pause duration
- Words Per Minute (WPM)
- Type-Token Ratio (lexical diversity)
- Hesitation/filler frequency ("um," "uh")
- Feeds a 5-feature normalized pipeline: `speech_activity_ratio`, `pause_rate_per_minute`, `mean_rms`, `words_per_minute`, `vocabulary_richness`

**Active or passive:** **ACTIVE.** Deliberate, patient-initiated, single-session, explicitly consented recording. Not background/ambient listening.

**Does it record calls:** **NO — firm boundary, not a maybe.**
- Recording calls without two-party consent is illegal in most jurisdictions, including concerns under Indian law.
- Would break the existing consent governance model (explicit opt-in, revocable, auditable) — a voice-journal opt-in does not extend to call capture.
- Clinically unnecessary: the structured task gives clean, comparable data; call audio would be noisy and privacy-radioactive.

**How the score is derived:** 5 normalized features → trained classifier → continuous probability → thresholded (default 0.92) → Screen Positive / Screen Negative flag (a screening flag, not a diagnosis). Reference: methodology grounded in published research (e.g., Xue et al.) rather than arbitrary feature selection.

---

## 6. "What are you doing to remove the fear factor during voice journal recording?" (Doctor)

**Why this matters clinically (lead with this, not UX):**
Anxiety directly contaminates the exact signal being measured — a nervous patient naturally pauses more, hesitates more, sounds shakier. These are the SAME acoustic markers (pause duration, jitter, hesitation frequency) used to detect cognitive decline. An anxious but healthy patient can produce a false positive purely from nerves. This is the same "white-coat anxiety" bias our own philosophy already names as a reason to prefer passive monitoring — the voice journal has the identical vulnerability.

**Our answer — three-part fix:**
1. **Remove performance framing:**
   - No pass/fail, add copy: *"There's no right or wrong answer — just talk naturally."*
   - Don't show an instant risk score right after recording (turns it into a graded exam). Keep the moment neutral/warm; analysis stays back-end for the clinician.
2. **Make privacy visible and concrete:**
   - Clear, unambiguous mic-on indicator (pulsing/"Recording..." state).
   - Reassurance text at point of recording: *"Only you and your care team can hear this. Your family only sees trends, never the raw recording"* — ties directly to the existing Care Circle consent model.
3. **First-time practice run:**
   - A zero-stakes trial recording before the "real" one — nothing logged — to build comfort with the mechanic.
   - Keep the "Elderly Voice Guidance" narrator consistent (same voice every time) — builds familiarity/trust across sessions.

**Framing line for jury:** *"Reducing fear here isn't just empathy — it's a data-quality requirement. Anxiety inflates the same biomarkers we're measuring, so our approach removes performance framing, makes privacy concrete at the moment of recording, and gives a zero-stakes practice run before real data is captured."*

---

## 7. Doctor was NOT satisfied — Level 1 + Voice contribution / cutoffs / SHAP mechanics

**Root cause of dissatisfaction:** answers were conceptually correct but not concrete — no real numbers, no walk-through of an actual calculation. Fix = rehearse ONE real patient case end-to-end, not more abstract explanation.

### 7a. Score contribution breakdown (use exact numbers from our own dashboard)
- Active Cognitive Battery: **60% weight** → scored 40/100 → contributes 24.2 pts
- Behavioral Telemetry (passive typing/scrolling): **20% weight** → scored 88/100 → contributes 17.5 pts
- Acoustic Voice Biomarkers: **20% weight** → 0.0 pts if no voice entry that day
- Total CogniScore = 49.7/100 (matches dashboard)
- **BUG TO FIX:** dashboard label reads "Bi-Modal (80/20)" but breakdown is actually Tri-Modal 60/20/20 — inconsistent, must correct before next round (see dev action items file).

### 7b. Cutoffs — state exact values, don't be vague
| Cutoff | Value | Triggers |
|---|---|---|
| CUSUM drift boundary (H) | 12.0 | Flags drift → recommends Tier 2 escalation |
| Voice screen threshold | 0.92 probability | Screen Positive vs Negative |
| Risk tiers | Low / Moderate / High | From CatBoost → feeds referral urgency |
| CDR staging | 0.0 / 0.5 / 1.0 / 2.0 | From MRI ResNet-18 classification |

**Honest gap to own, not hide:** these are currently reasonable defaults (grounded in cited methodology / standard statistical process control practice for CUSUM), NOT yet calibrated against a large validated longitudinal patient-outcome dataset. State plainly that this calibration is an explicit next-phase step before real deployment. Clinicians respect this far more than an overconfident unvalidated claim.

### 7c. SHAP — answer all five sub-questions explicitly, don't bundle them
- **Use:** Answers "why did the model flag THIS specific patient as high-risk" — not just the score, but which inputs drove it.
- **How it's shown:** Waterfall chart — starts at a baseline (average predicted risk across all patients), each feature pushes the prediction up (red/higher risk) or down (green/lower risk), stacking to the individual's final score.
- **Why a factor "contributes":** Shapley value (game theory) — the feature's average marginal contribution across all possible combinations ("coalitions") of features being present/absent. Accounts for interactions between features, not just standalone importance.
- **How it's trained:** **NOT trained separately.** CatBoost is trained first on the 20 features. TreeSHAP then runs mathematically ON TOP of the already-trained model to compute exact attributions — it doesn't learn anything itself, it explains decisions the trained model already makes.
- **How it's "known" to be correct:** TreeSHAP has a mathematical guarantee (the "efficiency" property) — the sum of all individual feature contributions EXACTLY equals the gap between the patient's prediction and the baseline. For tree-based models this is an exact computation, not an approximation (unlike sampling-based methods such as LIME).

### 7d. Preparation task before next round
Build ONE full concrete walk-through using a seeded patient (e.g., Rajan Pillai — High Risk):
> "His CogniScore is 38. Active battery contributed X pts, telemetry Y pts, voice Z pts. His Level 2 SHAP shows top 3 drivers: age (+N), APOE-ε4 (+N), sleep disruption (+N). His CUSUM value is N, above H=12.0, so he was flagged for Tier 2 escalation."

This single real-numbers narrative is worth more than any amount of conceptual explanation — it proves the pipeline is real and connected end-to-end.

---

*End of document. See companion file `CogniVeil_Dev_Action_Items.md` for the concrete build changes derived from this feedback.*
