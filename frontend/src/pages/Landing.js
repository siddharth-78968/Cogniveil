import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // Active states for interactive components
  const [activeStep, setActiveStep] = useState(5); // Default to LongitudinalTrendAgent (index 5)
  const [selectedShap, setSelectedShap] = useState('sleep');
  const [activeFaq, setActiveFaq] = useState(null);
  const [trendView, setTrendView] = useState('graph'); // 'graph' or 'json'

  // Interactive In-Browser Cognitive Reaction Test
  const [challengeState, setChallengeState] = useState('idle');
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
    { num: '01', name: 'DataQualityAgent', model: 'SNR & volume validation', desc: 'Validates keystroke volume (>30 samples), audio SNR, and session duration thresholds.', output: '{\n  "status": "VALID",\n  "keystroke_samples": 45,\n  "snr_db": 28.4,\n  "duration_s": 64.2\n}' },
    { num: '02', name: 'CognitiveTestAgent', model: 'Psychometric decomposition', desc: 'Decomposes active micro-task scores into Memory, Reaction, and Speed subdomains.', output: '{\n  "memory_score": 36.5,\n  "stroop_inhibition": 45.0,\n  "reaction_decay": "-14.2%"\n}' },
    { num: '03', name: 'BehaviorAnalysisAgent', model: 'Motor dynamics engine', desc: 'Computes typing and scrolling sub-scores with non-diagnostic clinical reasoning.', output: '{\n  "typing_score": 81.6,\n  "scroll_hesitation_idx": 2.8,\n  "motor_stability": "Normal"\n}' },
    { num: '04', name: 'VoiceAnalysisAgent', model: 'Whisper multi-lingual', desc: 'Extracts acoustic biomarkers across 7 vernacular languages with privacy guarantees.', output: '{\n  "speech_rate_wpm": 77.6,\n  "mean_pause_s": 1.45,\n  "pitch_jitter_rms": 0.038\n}' },
    { num: '05', name: 'SignalFusionEngine', model: 'Calibrated EWMA fusion', desc: 'Computes exact 60/20/20 weighted contributions and ranks primary delta drivers.', output: '{\n  "cogni_score": 71.2,\n  "weights": {\n    "cognitive": 0.60,\n    "behavioral": 0.20,\n    "voice": 0.20\n  }\n}' },
    { num: '06', name: 'LongitudinalTrendAgent', model: 'CUSUM drift accumulator', desc: 'Applies EWMA smoothing and CUSUM accumulation to detect persistent trajectory drift.', output: '{\n  "cusum_val": 14.8,\n  "drift_detected": true,\n  "trend_direction": "declining",\n  "lead_time_gained": "6-8 months"\n}' },
    { num: '07', name: 'RiskOrchestrator', model: 'Gated state machine', desc: 'Governs conditional state-aware tier escalation (Tier 1 -> Tier 2 -> Tier 3).', output: '{\n  "current_tier": 2,\n  "trigger_condition": "EWMA_CUSUM_CONFIRMED",\n  "status": "ESCALATED"\n}' },
    { num: '08', name: 'CatBoost + TreeSHAP', model: 'Gradient boosted trees', desc: 'Evaluates 24 clinical features with modifiable vs non-modifiable risk attributions.', output: '{\n  "multivariate_risk": 0.68,\n  "primary_factor": "Poor Sleep (<5h)",\n  "shap_delta": "+0.28"\n}' },
    { num: '09', name: 'ResNet-18 + Grad-CAM', model: 'Volumetric morphometry', desc: 'Performs volumetric brain morphometry and visual attention localization.', output: '{\n  "cdr_staging": "Mild CDR-1",\n  "bpf_ratio": 0.742,\n  "hippocampal_atrophy": "Detected"\n}' },
    { num: '10', name: 'MedGemma + Safety', model: 'Deterministic guardrails', desc: 'Synthesizes grounded 12-section evidence dossier with deterministic guardrails.', output: '{\n  "dossier_sections": 12,\n  "guardrails_passed": true,\n  "non_diagnostic_certified": true\n}' },
  ];

  // TreeSHAP Scenarios
  const shapScenarios = {
    sleep: {
      id: 'sleep',
      label: 'Poor sleep architecture (<5 hrs/night)',
      shap: '+0.28',
      rawVal: 0.28,
      type: 'MODIFIABLE ACCELERATOR',
      color: '#e57373',
      impact: 'Accelerates trajectory risk by reducing glymphatic amyloid clearance',
      note: 'Chronic sleep fragmentation impairs hippocampal memory consolidation and amplifies daytime motor hesitation.'
    },
    apoe: {
      id: 'apoe',
      label: 'APOE-e4 carrier (heterozygous)',
      shap: '+0.22',
      rawVal: 0.22,
      type: 'NON-MODIFIABLE GENETIC',
      color: '#d4a373',
      impact: 'Shifts baseline statistical deviation threshold downwards',
      note: 'Genetic susceptibility marker used strictly for baseline calibration without altering non-diagnostic posture.'
    },
    vascular: {
      id: 'vascular',
      label: 'Stage 1 hypertension (systolic >135 mmHg)',
      shap: '+0.16',
      rawVal: 0.16,
      type: 'MODIFIABLE VASCULAR',
      color: '#e09f3e',
      impact: 'Increases microvascular cerebral resistance',
      note: 'Elevated systolic pressure correlates with sub-second executive hesitation and neuromotor slowing.'
    },
    exercise: {
      id: 'exercise',
      label: 'Regular aerobic conditioning (150 min/wk)',
      shap: '-0.19',
      rawVal: -0.19,
      type: 'MODIFIABLE PROTECTIVE',
      color: '#52b788',
      impact: 'Provides neuroprotective buffering against baseline drift',
      note: 'Sustained cardiovascular fitness improves cerebral perfusion and stabilizes longitudinal motor latency.'
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
            <a href="#topology">Evidence Graph</a>
            <a href="#vectors">Biomarker Vectors</a>
            <a href="#pipeline">10-Agent Pipeline</a>
            <a href="#attribution">TreeSHAP Nodes</a>
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

      {/* ── HERO SECTION ── */}
      <section className="cv-hero-section">
        <div className="cv-hero-container">
          
          <div className="cv-kicker-pill">
            <span className="cv-pill-dot" />
            <span>NEW RELEASE: 10-AGENT CLINICAL ARCHITECTURE</span>
          </div>

          <h1 className="cv-hero-title">
            <span className="cv-hero-line-1">Precision cognitive drift surveillance,</span>
            <span className="cv-hero-line-2">for care teams and patients.</span>
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

          {/* ── HERO DIAGNOSTIC PIPELINE TOPOLOGY GRAPH SHOWCASE ── */}
          <div id="topology" className="cv-hero-topology-card">
            
            {/* Top Bar of Topology Card */}
            <div className="cv-topology-bar">
              <div className="cv-topology-status">
                <span className="cv-status-indicator active" />
                <span>EVIDENCE TOPOLOGY GRAPH: MULTI-CHANNEL INPUTS & ACTIVE INFERENCE</span>
              </div>
              <div className="cv-topology-leadtime">
                <span>ESTIMATED LEAD TIME GAINED: </span>
                <strong>6–8 MONTHS</strong>
              </div>
            </div>

            {/* Visual SVG Network DAG Graph */}
            <div className="cv-topology-network-container">
              <svg className="cv-topology-svg" viewBox="0 0 920 280" fill="none">
                {/* Connecting Curved Lines */}
                <path d="M 180 50 C 270 50, 270 140, 360 140" stroke="currentColor" strokeWidth="1.8" strokeDasharray="4 4" className="cv-svg-edge" />
                <path d="M 180 140 C 270 140, 270 140, 360 140" stroke="currentColor" strokeWidth="2.2" className="cv-svg-edge active" />
                <path d="M 180 230 C 270 230, 270 140, 360 140" stroke="currentColor" strokeWidth="1.8" strokeDasharray="4 4" className="cv-svg-edge" />
                
                {/* Hub to Outputs */}
                <path d="M 540 140 C 620 140, 620 80, 710 80" stroke="currentColor" strokeWidth="1.8" className="cv-svg-edge" />
                <path d="M 540 140 C 620 140, 620 200, 710 200" stroke="currentColor" strokeWidth="2.2" className="cv-svg-edge active" />
              </svg>

              <div className="cv-network-grid">
                
                {/* Column 1: Tier 1 Sensor Nodes */}
                <div className="cv-net-col col-inputs">
                  <div className="cv-net-node sensor-node">
                    <span className="cv-node-pip" />
                    <div className="cv-node-content">
                      <div className="cv-node-name">Speech Acoustics</div>
                      <div className="cv-node-sub">Whisper Jitter & Pause</div>
                    </div>
                  </div>

                  <div className="cv-net-node sensor-node active">
                    <span className="cv-node-pip active" />
                    <div className="cv-node-content">
                      <div className="cv-node-name">Keystroke Dynamics</div>
                      <div className="cv-node-sub">Sub-ms Inter-Key Latency</div>
                    </div>
                  </div>

                  <div className="cv-net-node sensor-node">
                    <span className="cv-node-pip" />
                    <div className="cv-node-content">
                      <div className="cv-node-name">Active Psychometrics</div>
                      <div className="cv-node-sub">Stroop Inhibition Battery</div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Central Core Engine Hub */}
                <div className="cv-net-col col-hub">
                  <div className="cv-hub-node">
                    <div className="cv-hub-inner">
                      <div className="cv-hub-badge">CORE AGENT ENGINE</div>
                      <div className="cv-hub-title">10-Agent EWMA & CUSUM Fusion</div>
                      <div className="cv-hub-params">
                        <span>λ = 0.20</span>
                        <span>h = 3.0σ</span>
                        <span>p &lt; 0.001</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Tier Escalation & Dossier Nodes */}
                <div className="cv-net-col col-outputs">
                  <div className="cv-net-node decision-node">
                    <span className="cv-node-pip" />
                    <div className="cv-node-content">
                      <div className="cv-node-name">Tier 3 Neuroimaging</div>
                      <div className="cv-node-sub">ResNet-18 OASIS Volumetrics</div>
                    </div>
                  </div>

                  <div className="cv-net-node decision-node active">
                    <span className="cv-node-pip active" />
                    <div className="cv-node-content">
                      <div className="cv-node-name">MedGemma Dossier</div>
                      <div className="cv-node-sub">12-Section Clinical Synthesis</div>
                    </div>
                  </div>
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

      {/* ── SECTION 1: 4-CARD WORKSPACE GRID ── */}
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

      {/* ── WARM CONTRAST BANNER 1 (HIGH CONTRAST TEXT) ── */}
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

      {/* ── SECTION 2: 10-AGENT PIPELINE & EXPLAINABILITY WITH GRAPH NODES ── */}
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
            
            {/* Left Card: LongitudinalTrendAgent & Multi-Agent Graph */}
            <div className="cv-wide-card">
              <div className="cv-wide-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="cv-wide-tag">LONGITUDINAL TREND ENGINE</span>
                  <span className="cv-wide-status">EWMA & CUSUM DRIFT</span>
                </div>
                <div className="cv-view-toggle">
                  <button 
                    onClick={() => setTrendView('graph')} 
                    className={`cv-view-btn ${trendView === 'graph' ? 'active' : ''}`}
                  >
                    Drift Graph
                  </button>
                  <button 
                    onClick={() => setTrendView('json')} 
                    className={`cv-view-btn ${trendView === 'json' ? 'active' : ''}`}
                  >
                    Agent Payload
                  </button>
                </div>
              </div>

              {/* Multi-Agent Selector Bar */}
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

              {/* View 1: Interactive SVG Longitudinal Trend Drift Graph */}
              {trendView === 'graph' ? (
                <div className="cv-drift-graph-card">
                  <div className="cv-graph-legend-bar">
                    <span className="cv-leg-item"><span className="cv-leg-line baseline" /> Normal Baseline Zone (±1.5σ)</span>
                    <span className="cv-leg-item"><span className="cv-leg-line trajectory" /> Patient EWMA Trajectory</span>
                    <span className="cv-leg-item"><span className="cv-leg-line threshold" /> CUSUM Threshold (h=3.0)</span>
                  </div>

                  <div className="cv-svg-graph-wrapper">
                    <svg viewBox="0 0 540 210" className="cv-chart-svg">
                      {/* Grid Lines */}
                      <line x1="40" y1="30" x2="520" y2="30" stroke="currentColor" strokeOpacity="0.1" />
                      <line x1="40" y1="80" x2="520" y2="80" stroke="currentColor" strokeOpacity="0.1" />
                      <line x1="40" y1="130" x2="520" y2="130" stroke="currentColor" strokeOpacity="0.1" />
                      <line x1="40" y1="180" x2="520" y2="180" stroke="currentColor" strokeOpacity="0.1" />

                      {/* Baseline Green Zone */}
                      <rect x="40" y="30" width="480" height="50" fill="currentColor" fillOpacity="0.06" />

                      {/* CUSUM Decision Threshold Line (Dashed) */}
                      <line x1="40" y1="140" x2="520" y2="140" stroke="#f87171" strokeWidth="1.5" strokeDasharray="5 5" />
                      <text x="430" y="134" fill="#f87171" fontSize="10" fontFamily="'JetBrains Mono', monospace">h = 3.0σ Threshold</text>

                      {/* Patient EWMA Trend Curve */}
                      <path
                        d="M 60 45 Q 140 48, 220 62 T 340 105 T 440 152 T 500 168"
                        fill="none"
                        stroke="#a3b18a"
                        strokeWidth="3"
                      />

                      {/* Graph Nodes along Trajectory */}
                      <circle cx="60" cy="45" r="4.5" fill="#f1f5ee" stroke="#3d5236" strokeWidth="2" />
                      <circle cx="140" cy="50" r="4.5" fill="#f1f5ee" stroke="#3d5236" strokeWidth="2" />
                      <circle cx="220" cy="62" r="4.5" fill="#f1f5ee" stroke="#3d5236" strokeWidth="2" />
                      <circle cx="340" cy="105" r="4.5" fill="#f1f5ee" stroke="#3d5236" strokeWidth="2" />
                      
                      {/* Critical Deviation Change-Point Node */}
                      <circle cx="440" cy="152" r="7" fill="#f87171" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="500" cy="168" r="5" fill="#f87171" />

                      {/* Change Point Callout */}
                      <rect x="330" y="165" width="180" height="34" rx="6" fill="#1b261a" stroke="#f87171" strokeWidth="1.2" />
                      <text x="340" y="180" fill="#f1f5ee" fontSize="10" fontWeight="bold" fontFamily="'Mulish', sans-serif">DRIFT FLAGGED</text>
                      <text x="340" y="193" fill="#cbd5e1" fontSize="9" fontFamily="'JetBrains Mono', monospace">6–8 Mo Lead Time Window</text>

                      {/* X-Axis Labels */}
                      <text x="60" y="200" fill="currentColor" fillOpacity="0.6" fontSize="10" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">M-8</text>
                      <text x="140" y="200" fill="currentColor" fillOpacity="0.6" fontSize="10" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">M-6</text>
                      <text x="220" y="200" fill="currentColor" fillOpacity="0.6" fontSize="10" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">M-4</text>
                      <text x="340" y="200" fill="currentColor" fillOpacity="0.6" fontSize="10" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">M-2</text>
                      <text x="440" y="200" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">Detected</text>
                      <text x="500" y="200" fill="currentColor" fillOpacity="0.6" fontSize="10" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">Current</text>
                    </svg>
                  </div>
                  <div className="cv-drift-footer">
                    <span>CUSUM C+ Accumulator: <strong>14.8 &gt; 12.0</strong></span>
                    <span>Persistent negative trajectory confirmed</span>
                  </div>
                </div>
              ) : (
                /* View 2: Agent Detail Code View */
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
              )}
            </div>

            {/* Right Card: TreeSHAP Feature Attribution Waterfall Graph & Nodes */}
            <div id="attribution" className="cv-wide-card">
              <div className="cv-wide-card-header">
                <span className="cv-wide-tag">TREESHAP RISK ATTRIBUTION NODES</span>
                <span className="cv-wide-status">24-FEATURE CASCADE</span>
              </div>

              {/* Interactive SHAP Factor Nodes Graph */}
              <div className="cv-shap-network-box">
                <div className="cv-shap-waterfall-header">
                  <span>CLINICAL BIOMARKER FACTOR</span>
                  <span>SHAP IMPACT DELTA</span>
                </div>

                <div className="cv-shap-factors-list">
                  {Object.keys(shapScenarios).map((key) => {
                    const sc = shapScenarios[key];
                    const isSelected = selectedShap === key;
                    const isPositive = sc.rawVal > 0;
                    const barWidth = Math.abs(sc.rawVal) * 280;
                    return (
                      <div
                        key={key}
                        onClick={() => setSelectedShap(key)}
                        className={`cv-shap-factor-row ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="cv-factor-label-col">
                          <span className={`cv-factor-pip ${isPositive ? 'risk' : 'protective'}`} />
                          <div>
                            <div className="cv-factor-name">{sc.label.split(' (')[0]}</div>
                            <div className="cv-factor-type">{sc.type}</div>
                          </div>
                        </div>

                        {/* Waterfall Visual Bar */}
                        <div className="cv-factor-bar-col">
                          <div className="cv-bar-track">
                            <div 
                              className={`cv-bar-fill ${isPositive ? 'risk' : 'protective'}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="cv-factor-val">{sc.shap}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Node Detailed Clinical Breakdown */}
                <div className="cv-shap-selected-card">
                  <div className="cv-selected-top">
                    <div>
                      <span className="cv-selected-badge">{shapScenarios[selectedShap].type}</span>
                      <h4 className="cv-selected-title">{shapScenarios[selectedShap].label}</h4>
                    </div>
                    <div className="cv-selected-delta">
                      <span className="delta-num">{shapScenarios[selectedShap].shap}</span>
                      <span className="delta-label">TreeSHAP value</span>
                    </div>
                  </div>
                  <p className="cv-selected-note">
                    {shapScenarios[selectedShap].note}
                  </p>
                </div>
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

      {/* ── BOTTOM WARM CONTRAST BANNER (HIGH CONTRAST) ── */}
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