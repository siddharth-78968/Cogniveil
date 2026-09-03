import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // Active states for interactive components
  const [activeStep, setActiveStep] = useState(0);
  const [selectedShap, setSelectedShap] = useState('sleep');
  const [activeFaq, setActiveFaq] = useState(null);

  // Interactive In-Browser Cognitive Reaction Test
  const [challengeState, setChallengeState] = useState('idle'); // 'idle', 'waiting', 'ready', 'result'
  const [challengeStartTime, setChallengeStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(null);
  const [stimulusWord, setStimulusWord] = useState({ text: 'EMERALD', color: '#3d5236' });
  const timerRef = useRef(null);

  const startChallenge = () => {
    setChallengeState('waiting');
    setReactionTime(null);
    const words = [
      { text: 'SAGE', color: '#4a6b43' },
      { text: 'OLIVE', color: '#3d5236' },
      { text: 'SLATE', color: '#576c52' },
      { text: 'FOREST', color: '#273822' },
    ];
    const chosen = words[Math.floor(Math.random() * words.length)];
    setStimulusWord(chosen);

    const delay = 1200 + Math.random() * 1600;
    timerRef.current = setTimeout(() => {
      setChallengeState('ready');
      setChallengeStartTime(Date.now());
    }, delay);
  };

  const handleChallengeClick = () => {
    if (challengeState === 'waiting') {
      clearTimeout(timerRef.current);
      setChallengeState('idle');
      alert('Too early! Wait for the stimulus box to turn green.');
    } else if (challengeState === 'ready') {
      const elapsed = Date.now() - challengeStartTime;
      setReactionTime(elapsed);
      setChallengeState('result');
    }
  };

  // 4 Multimodal Telemetry Channels
  const signalSources = [
    {
      id: 'speech',
      title: 'Acoustic Speech Biomarkers',
      tag: 'ACOUSTIC DOMAIN',
      metrics: 'WPM Cadence · Pause Rate · Lexical Richness',
      desc: 'Whisper neural acoustic feature extraction across 7 vernacular languages. Analyzes pause-to-speech ratios and articulation latency with zero raw audio storage.',
      specs: ['7 vernacular dialects', 'Sub-second pause tracking', 'Zero raw audio retention']
    },
    {
      id: 'telemetry',
      title: 'Interaction Keystroke Telemetry',
      tag: 'MOTOR BEHAVIOR',
      metrics: 'Inter-Key Latency · Backspace Rate · Scroll Hesitation',
      desc: 'Sub-millisecond passive timing measurement during natural daily typing. Evaluates neuromuscular hesitation and burst patterns with complete privacy preservation.',
      specs: ['Sub-ms precision', 'Zero-keylog privacy', 'EWMA smoothed baseline']
    },
    {
      id: 'psychometrics',
      title: 'Active Psychometrics Micro-Tasks',
      tag: 'COGNITIVE DOMAIN',
      metrics: 'Delayed Recall · Stroop Inhibition · Reaction Speed',
      desc: '3-minute daily micro-battery decomposing episodic retrieval, visual-spatial attention, and working memory into isolated validated subdomains.',
      specs: ['Standardized digit span', 'Color Stroop inhibition', 'Reaction decay curve']
    },
    {
      id: 'neuroimaging',
      title: 'Structural Neuroimaging (Tier 3)',
      tag: 'VOLUMETRIC MORPHOMETRY',
      metrics: 'ResNet-18 CDR Staging · Morphometry (BPF/VBR) · Grad-CAM',
      desc: 'Gated conditional evaluation triggered strictly when Tier 2 risk is elevated. Identifies hippocampal volume loss and ventricular enlargement with explainable heatmaps.',
      specs: ['ResNet-18 architecture', 'BPF/VBR volumetrics', 'Grad-CAM attention maps']
    }
  ];

  // 10-Agent Pipeline Steps
  const pipelineSteps = [
    { num: '01', name: 'DataQualityAgent', model: 'SNR & volume validation', desc: 'Validates keystroke volume (>30 samples), audio SNR, and session duration thresholds.', output: '{"status": "VALID", "keystroke_samples": 45, "snr_db": 28.4, "duration_s": 64.2}' },
    { num: '02', name: 'CognitiveTestAgent', model: 'Psychometric decomposition', desc: 'Decomposes active micro-task scores into Memory, Reaction, and Speed subdomains.', output: '{"memory_score": 36.5, "stroop_inhibition": 45.0, "reaction_decay": "-14.2%"}' },
    { num: '03', name: 'BehaviorAnalysisAgent', model: 'Motor dynamics engine', desc: 'Computes typing and scrolling sub-scores with non-diagnostic clinical reasoning.', output: '{"typing_score": 81.6, "scroll_hesitation_idx": 2.8, "motor_stability": "Normal"}' },
    { num: '04', name: 'VoiceAnalysisAgent', model: 'Whisper multi-lingual', desc: 'Extracts acoustic biomarkers across 7 vernacular languages with privacy guarantees.', output: '{"speech_rate_wpm": 77.6, "mean_pause_s": 1.45, "pitch_jitter_rms": 0.038}' },
    { num: '05', name: 'SignalFusionEngine', model: 'Calibrated EWMA fusion', desc: 'Computes exact 60/20/20 weighted contributions and ranks primary delta drivers.', output: '{"cogni_score": 71.2, "weights": {"cognitive": 0.60, "behavioral": 0.20, "voice": 0.20}}' },
    { num: '06', name: 'LongitudinalTrendAgent', model: 'CUSUM drift accumulator', desc: 'Applies EWMA smoothing and CUSUM accumulation to detect persistent trajectory drift.', output: '{"cusum_val": 14.8, "drift_detected": true, "trend_direction": "declining"}' },
    { num: '07', name: 'RiskOrchestrator', model: 'Gated state machine', desc: 'Governs conditional state-aware tier escalation (Tier 1 -> Tier 2 -> Tier 3).', output: '{"current_tier": 2, "trigger_condition": "EWMA_CUSUM_CONFIRMED", "status": "ESCALATED"}' },
    { num: '08', name: 'CatBoost + TreeSHAP', model: 'Gradient boosted trees', desc: 'Evaluates 24 clinical features with modifiable vs non-modifiable risk attributions.', output: '{"multivariate_risk": 0.68, "primary_factor": "Poor Sleep (<5h)", "shap_delta": "+0.28"}' },
    { num: '09', name: 'ResNet-18 + Grad-CAM', model: 'Volumetric morphometry', desc: 'Performs volumetric brain morphometry and visual attention localization.', output: '{"cdr_staging": "Mild CDR-1", "bpf_ratio": 0.742, "hippocampal_atrophy": "Detected"}' },
    { num: '10', name: 'MedGemma + Safety', model: 'Deterministic guardrails', desc: 'Synthesizes grounded 12-section evidence dossier with deterministic guardrails.', output: '{"dossier_sections": 12, "guardrails_passed": true, "non_diagnostic_certified": true}' },
  ];

  // TreeSHAP Scenarios
  const shapScenarios = {
    sleep: {
      label: 'Poor sleep architecture (<5 hrs/night)',
      shap: '+0.28',
      type: 'MODIFIABLE FACTOR',
      impact: 'Accelerates trajectory risk',
      note: 'Sleep fragmentation directly impairs glymphatic clearance and amplifies memory retrieval latency.'
    },
    exercise: {
      label: 'Regular aerobic conditioning (150 min/wk)',
      shap: '-0.19',
      type: 'MODIFIABLE FACTOR',
      impact: 'Protective against baseline drift',
      note: 'Cardiovascular fitness provides neuroprotective buffering against baseline motor latency decline.'
    },
    apoe: {
      label: 'APOE-e4 carrier (heterozygous)',
      shap: '+0.22',
      type: 'NON-MODIFIABLE FACTOR',
      impact: 'Increases baseline threshold',
      note: 'Genetic susceptibility factor evaluated strictly for baseline clinical calibration.'
    },
    vascular: {
      label: 'Stage 1 hypertension (systolic >135 mmHg)',
      shap: '+0.16',
      type: 'MODIFIABLE FACTOR',
      impact: 'Increases microvascular load',
      note: 'Cerebrovascular resistance correlates with executive latency and cognitive slowing.'
    }
  };

  // FAQ Items
  const faqItems = [
    {
      q: 'How does CogniVeil detect cognitive drift before symptoms trigger a clinical visit?',
      a: 'CogniVeil measures sub-clinical deviations in neuromuscular keystroke speed, inter-key latency, pause-to-speech ratios, and active memory micro-tasks. By applying exponentially weighted moving averages (EWMA) and CUSUM change-point algorithms against a patient’s personal baseline, it flags statistically meaningful drift 6–8 months before traditional clinical observation.'
    },
    {
      q: 'What patient data is captured and how is privacy preserved?',
      a: 'CogniVeil is designed with zero-compromise differential privacy. It never logs keystroke characters or records raw speech audio. Only derived numerical timing features (e.g. dwell time, cadence, pitch jitter) are processed locally, ensuring full HIPAA and ISO/DIS 13485 compliance.'
    },
    {
      q: 'When does the diagnostic cascade escalate to Tier 2 or Tier 3?',
      a: 'Escalation is strictly evidence-governed. Tier 1 continuous passive monitoring runs continuously. If a patient’s personal baseline exhibits persistent negative statistical drift for over 14 days, Tier 2 targeted multidimensional assessments are triggered. Only when Tier 2 multimodal risk remains elevated is a Tier 3 structural neuroimaging review recommended.'
    },
    {
      q: 'How are the 10 AI agents verified to prevent hallucinations?',
      a: 'CogniVeil employs a deterministic 10-agent pipeline where each agent executes a discrete, audit-logged clinical function with strict JSON output schemas. The final MedGemma synthesis agent is constrained by deterministic safety regex filters and calibrated against OASIS and ADNI clinical benchmarks.'
    },
    {
      q: 'Does CogniVeil provide a definitive medical diagnosis?',
      a: 'No. CogniVeil is an authorized clinical decision-support and surveillance tool. It is engineered to buy care teams critical lead time, generate quantitative evidence dossiers, and support qualified neurologists in early intervention.'
    }
  ];

  return (
    <div className={`cv-landing ${isDark ? 'cv-theme-dark' : 'cv-theme-light'}`}>
      
      {/* ── STICKY TOP NAVBAR ── */}
      <header className="cv-nav">
        <div className="cv-nav-inner">
          <div className="cv-brand" onClick={() => navigate('/')}>
            <span className="cv-brand-mark">C</span>
            <span className="cv-brand-text">CogniVeil</span>
            <span className="cv-brand-tag">CLINICAL INTELLIGENCE</span>
          </div>

          <nav className="cv-nav-links">
            <a href="#cascade">Diagnostic Cascade</a>
            <a href="#vectors">Biomarker Vectors</a>
            <a href="#pipeline">10-Agent Pipeline</a>
            <a href="#attribution">Explainability</a>
            <a href="#faq">Governance & FAQ</a>
          </nav>

          <div className="cv-nav-actions">
            <button className="cv-theme-toggle" onClick={toggleTheme}>
              {isDark ? 'LIGHT MODE' : 'DARK MODE'}
            </button>
            <Link to="/login" className="cv-link-btn">
              Sign In
            </Link>
            <button className="cv-btn-primary" onClick={() => navigate('/login')}>
              Launch Workstation
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION (MATCHING TEMPLATE) ── */}
      <section className="cv-hero-section">
        <div className="cv-hero-container">
          
          <div className="cv-kicker-pill">
            <span className="cv-pill-dot" />
            <span>NEW RELEASE: 10-AGENT CLINICAL ARCHITECTURE</span>
          </div>

          <h1 className="cv-hero-title">
            Precision cognitive drift surveillance, for care teams and patients.
          </h1>

          <p className="cv-hero-sub">
            Continuous longitudinal neuromotor, acoustic, and psychometric change-point detection—buying care teams critical months before symptoms escalate.
          </p>

          <div className="cv-hero-cta-group">
            <button className="cv-hero-primary-btn" onClick={() => navigate('/login')}>
              Launch clinical workstation
            </button>
            <a href="#challenge" className="cv-hero-secondary-btn">
              Run reaction agility test
            </a>
          </div>

          {/* ── HERO DIAGNOSTIC PIPELINE TOPOLOGY SHOWCASE ── */}
          <div className="cv-hero-topology-card">
            
            {/* Top Bar of Topology Card */}
            <div className="cv-topology-bar">
              <div className="cv-topology-status">
                <span className="cv-status-indicator active" />
                <span>EVIDENCE PIPELINE: ACTIVE CALIBRATED SURVEILLANCE</span>
              </div>
              <div className="cv-topology-leadtime">
                <span>ESTIMATED LEAD TIME GAINED: </span>
                <strong>6–8 MONTHS</strong>
              </div>
            </div>

            {/* Visual Workflow Graph */}
            <div className="cv-topology-graph">
              <div className="cv-graph-node">
                <div className="cv-node-label">TIER 1 CAPTURE</div>
                <div className="cv-node-box">
                  <div className="cv-node-name">Passive Telemetry</div>
                  <div className="cv-node-sub">Keystroke & Acoustics</div>
                </div>
              </div>

              <div className="cv-graph-connector">
                <span className="cv-conn-line" />
                <span className="cv-conn-arrow">→</span>
              </div>

              <div className="cv-graph-node center-hub">
                <div className="cv-node-label">CORE ENGINE</div>
                <div className="cv-node-box hub">
                  <div className="cv-hub-circle">
                    <span className="cv-hub-pulse" />
                    <strong>10-Agent</strong>
                  </div>
                  <div className="cv-node-name">EWMA / CUSUM Fusion</div>
                </div>
              </div>

              <div className="cv-graph-connector">
                <span className="cv-conn-line" />
                <span className="cv-conn-arrow">→</span>
              </div>

              <div className="cv-graph-node">
                <div className="cv-node-label">DECISION SUPPORT</div>
                <div className="cv-node-box">
                  <div className="cv-node-name">Clinical Dossier</div>
                  <div className="cv-node-sub">MedGemma Verified</div>
                </div>
              </div>
            </div>

            {/* Live Telemetry Summary Strip */}
            <div className="cv-topology-telemetry">
              <div className="cv-telem-item">
                <span className="cv-telem-label">CALIBRATED COGNISCORE</span>
                <span className="cv-telem-val">71.2 <small>/ 100</small></span>
              </div>
              <div className="cv-telem-item">
                <span className="cv-telem-label">LONGITUDINAL DRIFT</span>
                <span className="cv-telem-val highlight">-8.4% drift</span>
              </div>
              <div className="cv-telem-item">
                <span className="cv-telem-label">DIAGNOSTIC STATE</span>
                <span className="cv-telem-val">Tier 2 Escalated</span>
              </div>
              <div className="cv-telem-item">
                <span className="cv-telem-label">PRIVACY ASSURANCE</span>
                <span className="cv-telem-val">Zero-Raw Retention</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── CREDIBILITY STANDARD TICKER STRIP ── */}
      <div className="cv-standards-strip">
        <div className="cv-standards-inner">
          <span className="cv-standards-title">CALIBRATED AGAINST CLINICAL STANDARDS:</span>
          <div className="cv-standards-tags">
            <span>OASIS-3 NEUROIMAGING</span>
            <span>ADNI COHORT</span>
            <span>NIA-AA FRAMEWORK</span>
            <span>TREESHAP EXPLAINABILITY</span>
            <span>ISO/DIS 13485</span>
            <span>WCAG 2.1 AA</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: 4-CARD WORKSPACE GRID (MATCHING TEMPLATE) ── */}
      <section id="vectors" className="cv-section">
        <div className="cv-container">
          
          <div className="cv-section-header">
            <h2 className="cv-section-title">
              A complete clinical workspace, for clinicians and caregivers
            </h2>
            <p className="cv-section-sub">
              Four independent multimodal channels captured across everyday interactions and calibrated assessments.
            </p>
          </div>

          <div className="cv-grid-4">
            {signalSources.map((s) => (
              <div key={s.id} className="cv-card-4">
                <div className="cv-card-top">
                  <span className="cv-card-tag">{s.tag}</span>
                  <span className="cv-card-metric">{s.metrics}</span>
                </div>
                <h3 className="cv-card-title">{s.title}</h3>
                <p className="cv-card-desc">{s.desc}</p>
                <div className="cv-card-specs">
                  {s.specs.map((sp, idx) => (
                    <span key={idx} className="cv-spec-pill">{sp}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── WARM CONTRAST BANNER 1 (MATCHING TEMPLATE CONTRAST BAND) ── */}
      <section className="cv-contrast-band">
        <div className="cv-container">
          <div className="cv-contrast-inner">
            <h2 className="cv-contrast-title">
              Give your clinical team the building blocks to intervene months earlier.
            </h2>
            <p className="cv-contrast-sub">
              Deterministic change-point detection catches subtle drift before symptoms trigger a hospital admission.
            </p>
            <button className="cv-contrast-btn" onClick={() => navigate('/login')}>
              Open Clinician Workstation
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: 10-AGENT PIPELINE & EXPLAINABILITY (2 WIDE CARDS) ── */}
      <section id="pipeline" className="cv-section">
        <div className="cv-container">
          
          <div className="cv-section-header">
            <h2 className="cv-section-title">
              Deterministic multi-agent sequence with explainable clinical attribution
            </h2>
            <p className="cv-section-sub">
              Every screening session executes a fixed, verifiable sequence of 10 specialized agent tools with zero hallucinations.
            </p>
          </div>

          <div className="cv-wide-2-grid">
            
            {/* Left Card: 10-Agent Interactive Inspector */}
            <div className="cv-wide-card">
              <div className="cv-wide-card-header">
                <span className="cv-wide-tag">01–10 MULTI-AGENT EXECUTION</span>
                <span className="cv-wide-status">VERIFIED DETERMINISTIC</span>
              </div>

              <div className="cv-agent-stepper">
                {pipelineSteps.map((st, idx) => (
                  <button
                    key={st.num}
                    onClick={() => setActiveStep(idx)}
                    className={`cv-step-pill ${activeStep === idx ? 'active' : ''}`}
                  >
                    {st.num} {st.name}
                  </button>
                ))}
              </div>

              <div className="cv-agent-detail-box">
                <div className="cv-agent-detail-meta">
                  <div className="cv-agent-step-name">{pipelineSteps[activeStep].name}</div>
                  <div className="cv-agent-step-model">{pipelineSteps[activeStep].model}</div>
                </div>
                <p className="cv-agent-step-desc">{pipelineSteps[activeStep].desc}</p>
                
                <div className="cv-agent-code-block">
                  <div className="cv-code-bar">output_payload.json</div>
                  <pre>{pipelineSteps[activeStep].output}</pre>
                </div>
              </div>
            </div>

            {/* Right Card: Explainable Risk Attribution (TreeSHAP) */}
            <div id="attribution" className="cv-wide-card">
              <div className="cv-wide-card-header">
                <span className="cv-wide-tag">TREESHAP RISK DECOMPOSITION</span>
                <span className="cv-wide-status">CALIBRATED COHORT</span>
              </div>

              <div className="cv-shap-selector">
                {Object.keys(shapScenarios).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedShap(key)}
                    className={`cv-shap-btn ${selectedShap === key ? 'active' : ''}`}
                  >
                    {shapScenarios[key].label.split(' (')[0]}
                  </button>
                ))}
              </div>

              <div className="cv-shap-content-box">
                <div className="cv-shap-hero">
                  <div>
                    <span className="cv-shap-type">{shapScenarios[selectedShap].type}</span>
                    <div className="cv-shap-name">{shapScenarios[selectedShap].label}</div>
                  </div>
                  <div className="cv-shap-val-badge">
                    <span className="cv-shap-val">{shapScenarios[selectedShap].shap}</span>
                    <span className="cv-shap-delta">SHAP Delta</span>
                  </div>
                </div>

                <div className="cv-shap-impact">
                  <strong>Clinical Impact: </strong>
                  {shapScenarios[selectedShap].impact}
                </div>

                <p className="cv-shap-note">
                  {shapScenarios[selectedShap].note}
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── IN-BROWSER INTERACTIVE COGNITIVE AGILITY TEST ── */}
      <section id="challenge" className="cv-section cv-section-compact">
        <div className="cv-container">
          <div className="cv-challenge-box">
            <div>
              <span className="cv-challenge-kicker">IN-BROWSER CLINICAL DEMONSTRATION</span>
              <h3 className="cv-challenge-title">Test your cognitive reaction agility</h3>
              <p className="cv-challenge-sub">
                Experience how CogniVeil measures sub-millisecond psychomotor reaction speed and executive inhibition during simple stimuli.
              </p>
            </div>

            <div className="cv-challenge-interactive">
              {challengeState === 'idle' && (
                <button className="cv-challenge-action-btn" onClick={startChallenge}>
                  Start 5-Second Reaction Test
                </button>
              )}

              {challengeState === 'waiting' && (
                <div className="cv-challenge-stimulus waiting" onClick={handleChallengeClick}>
                  Wait for green box... (Do not click yet)
                </div>
              )}

              {challengeState === 'ready' && (
                <div className="cv-challenge-stimulus ready" onClick={handleChallengeClick}>
                  CLICK NOW!
                </div>
              )}

              {challengeState === 'result' && (
                <div className="cv-challenge-result">
                  <div className="cv-result-ms">{reactionTime} ms</div>
                  <div className="cv-result-note">
                    {reactionTime < 320 ? 'Optimal psychomotor latency' : 'Baseline within expected parameters'}
                  </div>
                  <button className="cv-challenge-retry-btn" onClick={startChallenge}>
                    Test Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CLINICAL EVIDENCE & QUOTES (2 WIDE QUOTE CARDS) ── */}
      <section className="cv-section">
        <div className="cv-container">
          
          <div className="cv-section-header">
            <h2 className="cv-section-title">
              Built in partnership with clinical neurologists and caregivers
            </h2>
            <p className="cv-section-sub">
              Validated on longitudinal cognitive cohorts to turn passive telemetry into actionable clinical interventions.
            </p>
          </div>

          <div className="cv-quotes-grid">
            <div className="cv-quote-card">
              <p className="cv-quote-text">
                "The biggest barrier in memory care is that patients present 2 to 3 years after sub-clinical drift begins. Having a continuous, passive surveillance system that flags change-points months earlier fundamentally alters our therapeutic window."
              </p>
              <div className="cv-quote-author">
                <div className="cv-author-avatar">AN</div>
                <div>
                  <div className="cv-author-name">Dr. Arvind Natarajan, MD</div>
                  <div className="cv-author-role">Cognitive Neurologist · Memory Care Clinic</div>
                </div>
              </div>
            </div>

            <div className="cv-quote-card">
              <p className="cv-quote-text">
                "CogniVeil doesn't induce panic or spit out generic diagnosis labels. It provides defensible, longitudinal evidence that our family can bring directly into neurologist consultations with complete clarity."
              </p>
              <div className="cv-quote-author">
                <div className="cv-author-avatar">SC</div>
                <div>
                  <div className="cv-author-name">Sarah Chen</div>
                  <div className="cv-author-role">Primary Caregiver & Patient Advocate</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── SECTION 4: FREQUENTLY ASKED QUESTIONS (ACCORDION) ── */}
      <section id="faq" className="cv-section">
        <div className="cv-container">
          
          <div className="cv-section-header">
            <h2 className="cv-section-title">
              Frequently Asked Questions
            </h2>
            <p className="cv-section-sub">
              Clinical governance, data architecture, and privacy specifications.
            </p>
          </div>

          <div className="cv-faq-list">
            {faqItems.map((item, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="cv-faq-item">
                  <button 
                    className="cv-faq-question-btn"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                  >
                    <span>{item.q}</span>
                    <span className="cv-faq-icon">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="cv-faq-answer">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── BOTTOM WARM CONTRAST BANNER ── */}
      <section className="cv-contrast-band">
        <div className="cv-container">
          <div className="cv-contrast-inner">
            <h2 className="cv-contrast-title">
              Turn subtle neuromotor telemetry into proactive care today.
            </h2>
            <p className="cv-contrast-sub">
              Start monitoring passive cognitive signals with zero friction and enterprise-grade clinical governance.
            </p>
            <button className="cv-contrast-btn" onClick={() => navigate('/login')}>
              Launch Clinical Workstation
            </button>
          </div>
        </div>
      </section>

      {/* ── CLEAN FOOTER ── */}
      <footer className="cv-footer">
        <div className="cv-container">
          
          <div className="cv-footer-disclaimer">
            <strong>CLINICAL DECISION SUPPORT NOTICE: </strong>
            CogniVeil is an authorized decision-support and passive cognitive surveillance platform. It is not an automated diagnostic device and does not replace comprehensive neurological examination, blood laboratory assays, or formal clinical evaluation.
          </div>

          <div className="cv-footer-bottom">
            <div className="cv-footer-left">
              <span className="cv-footer-brand">CogniVeil</span>
              <span>© 2026 Clinical Intelligence Platform · ISO/DIS 13485 & WCAG 2.1 AA Compliant</span>
            </div>
            <div className="cv-footer-links">
              <Link to="/login">Clinician Portal</Link>
              <Link to="/register">Patient Registration</Link>
              <Link to="/consent">Informed Consent</Link>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default Landing;