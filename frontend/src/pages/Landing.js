import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [activeLevel, setActiveLevel] = useState('level1');
  const [activeChannel, setActiveChannel] = useState('speech');
  const [activeStep, setActiveStep] = useState(0);
  const [selectedShap, setSelectedShap] = useState('sleep');
  const [isSimulating, setIsSimulating] = useState(true);

  // Interactive In-Browser Cognitive Reaction Test
  const [challengeState, setChallengeState] = useState('idle'); // 'idle', 'waiting', 'ready', 'result'
  const [challengeStartTime, setChallengeStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(null);
  const [stimulusWord, setStimulusWord] = useState({ text: 'EMERALD', color: '#10b981' });
  const timerRef = useRef(null);

  const startChallenge = () => {
    setChallengeState('waiting');
    setReactionTime(null);
    const words = [
      { text: 'CYAN', color: '#22d3ee' },
      { text: 'EMERALD', color: '#10b981' },
      { text: 'AMBER', color: '#f59e0b' },
      { text: 'CORAL', color: '#f43f5e' },
      { text: 'VIOLET', color: '#818cf8' },
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
      alert('Too early! Wait for the stimulus to turn bright green.');
    } else if (challengeState === 'ready') {
      const elapsed = Date.now() - challengeStartTime;
      setReactionTime(elapsed);
      setChallengeState('result');
    }
  };

  // 3 Distinct Level Cards from Reference
  const levelCards = [
    {
      id: 'level1',
      levelNum: 'Level 1',
      badgeClass: 'level-1',
      accentColor: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      icon: '🧠',
      title: 'AI Screening',
      bullets: [
        'Passive monitoring of typing & scroll patterns',
        'Daily cognitive + memory tests',
        'Speech biomarker analysis via voice journal',
        'CogniScore calculated from all signals'
      ],
      footerBadge: 'Always running',
      clinicalNote: 'Establishes personal calibrated EWMA baseline envelope during natural daily engagement.'
    },
    {
      id: 'level2',
      levelNum: 'Level 2',
      badgeClass: 'level-2',
      accentColor: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.25)',
      icon: '🔬',
      title: 'Targeted Assessment',
      bullets: [
        'Triggered when CogniScore drops below 60',
        'Deeper memory and language evaluation',
        'Extended reaction time testing',
        'Detailed risk profiling'
      ],
      footerBadge: 'Suggested when needed',
      clinicalNote: 'Evaluates 24-feature health & sleep questionnaire with CatBoost + TreeSHAP explainability.'
    },
    {
      id: 'level3',
      levelNum: 'Level 3',
      badgeClass: 'level-3',
      accentColor: '#f43f5e',
      glowColor: 'rgba(244, 63, 94, 0.25)',
      icon: '🧠',
      title: 'MRI Deep Learning',
      bullets: [
        'Upload MRI brain scan for CNN analysis',
        'ResNet-18 / EfficientNet classifies CDR stages',
        'Final fusion: 0.2×L1 + 0.3×L2 + 0.5×L3',
        'Overall dementia risk output across all 3 levels'
      ],
      footerBadge: 'High-risk validation only',
      clinicalNote: 'Structural volumetrics for hippocampal atrophy and ventricular enlargement with Grad-CAM.'
    }
  ];

  // 4 Multimodal Telemetry Channels
  const signalSources = [
    {
      id: 'speech',
      title: 'Acoustic Speech Analysis',
      tag: 'Acoustic domain',
      color: '#22d3ee',
      icon: '🎙️',
      metrics: 'WPM Cadence · Pause Rate · Lexical Richness',
      desc: 'Whisper neural acoustic feature extraction across 7 vernacular languages. Analyzes pause-to-speech ratios and articulation latency with zero raw audio storage.',
      specs: ['7 vernacular dialects', 'Sub-second pause tracking', 'Zero raw audio retention']
    },
    {
      id: 'telemetry',
      title: 'Interaction Keystroke Telemetry',
      tag: 'Motor behavior',
      color: '#10b981',
      icon: '⌨️',
      metrics: 'Inter-Key Latency · Backspace Rate · Scroll Hesitation',
      desc: 'Sub-millisecond passive timing measurement during everyday app usage. Evaluates neuromuscular hesitation and burst patterns with 100% privacy preservation.',
      specs: ['Sub-ms precision', 'Zero-keylog privacy', 'EWMA smoothed baseline']
    },
    {
      id: 'psychometrics',
      title: 'Active Psychometrics Micro-Tasks',
      tag: 'Cognitive domain',
      color: '#818cf8',
      icon: '🧩',
      metrics: 'Delayed Recall · Stroop Inhibition · Reaction Speed',
      desc: '3-minute daily micro-battery decomposing episodic retrieval, visual-spatial attention, and working memory into isolated validated subdomains.',
      specs: ['Standardized digit span', 'Color Stroop inhibition', 'Reaction decay curve']
    },
    {
      id: 'neuroimaging',
      title: 'Structural Neuroimaging (Tier 3)',
      tag: 'Biomarker (conditional)',
      color: '#f43f5e',
      icon: '🧠',
      metrics: 'ResNet-18 CDR Staging · Morphometry (BPF/VBR) · Grad-CAM',
      desc: 'Gated conditional evaluation triggered strictly when Tier 2 risk is elevated. Identifies hippocampal volume loss and ventricular enlargement with explainable heatmaps.',
      specs: ['ResNet-18 architecture', 'BPF/VBR volumetrics', 'Grad-CAM attention maps']
    }
  ];

  // 10-Agent Pipeline Steps
  const pipelineSteps = [
    { num: '01', name: 'DataQualityAgent', model: 'SNR & volume validation', desc: 'Validates keystroke volume (>30 samples), audio SNR, and session duration thresholds.', output: '{"status": "VALID", "keystroke_samples": 45, "snr_db": 28.4, "duration_s": 64.2}' },
    { num: '02', name: 'CognitiveTestAgent', model: 'Psychometric decomposition', desc: 'Decomposes active micro-task scores into Memory, Reaction, and Speed subdomains.', output: '{"memory_score": 36.5, "stroop_inhibition": 45.0, "reaction_decay": "-14.2%"}' },
    { num: '03', name: 'BehaviorAnalysisAgent', model: 'Motor dynamics engine', desc: 'Computes explicit typing and scrolling sub-scores with non-diagnostic clinical reasoning.', output: '{"typing_score": 81.6, "scroll_hesitation_idx": 2.8, "motor_stability": "Normal"}' },
    { num: '04', name: 'VoiceAnalysisAgent', model: 'Whisper multi-lingual', desc: 'Extracts acoustic biomarkers across 7 vernacular languages with privacy guarantees.', output: '{"speech_rate_wpm": 77.6, "mean_pause_s": 1.45, "pitch_jitter_rms": 0.038}' },
    { num: '05', name: 'SignalFusionEngine', model: 'Calibrated EWMA fusion', desc: 'Computes exact 60/20/20 weighted contributions and ranks primary delta drivers.', output: '{"cogni_score": 71.2, "weights": {"cognitive": 0.60, "behavioral": 0.20, "voice": 0.20}}' },
    { num: '06', name: 'LongitudinalTrendAgent', model: 'CUSUM drift accumulator', desc: 'Applies EWMA smoothing and CUSUM accumulation to detect persistent trajectory drift.', output: '{"cusum_val": 14.8, "drift_detected": true, "trend_direction": "declining"}' },
    { num: '07', name: 'RiskOrchestrator', model: 'Gated state machine', desc: 'Governs conditional state-aware tier escalation (Tier 1 ──► Tier 2 ──► Tier 3).', output: '{"current_tier": 2, "trigger_condition": "EWMA_CUSUM_CONFIRMED", "status": "ESCALATED"}' },
    { num: '08', name: 'CatBoost + TreeSHAP', model: 'Gradient boosted trees', desc: 'Evaluates 24 clinical features with modifiable vs non-modifiable risk attributions.', output: '{"multivariate_risk": 0.68, "primary_factor": "Poor Sleep (<5h)", "shap_delta": "+0.28"}' },
    { num: '09', name: 'ResNet-18 + Grad-CAM', model: 'Volumetric morphometry', desc: 'Performs volumetric brain morphometry and visual attention localization.', output: '{"cdr_staging": "Mild CDR-1", "bpf_ratio": 0.742, "hippocampal_atrophy": "Detected"}' },
    { num: '10', name: 'MedGemma + Safety', model: 'Deterministic guardrails', desc: 'Synthesizes grounded 12-section evidence dossier with deterministic regex guardrails.', output: '{"dossier_sections": 12, "guardrails_passed": true, "non_diagnostic_certified": true}' },
  ];

  // TreeSHAP Scenarios
  const shapScenarios = {
    sleep: {
      label: 'Poor sleep architecture (<5 hrs/night)',
      shap: '+0.28',
      type: 'Modifiable factor',
      color: '#f59e0b',
      impact: 'Accelerates trajectory risk',
      note: 'Sleep fragmentation directly impairs glymphatic clearance and amplifies memory retrieval latency.'
    },
    exercise: {
      label: 'Regular aerobic conditioning (150 min/wk)',
      shap: '-0.19',
      type: 'Modifiable factor',
      color: '#10b981',
      impact: 'Protective against baseline drift',
      note: 'Cardiovascular fitness provides neuroprotective buffering against baseline motor latency decline.'
    },
    apoe: {
      label: 'APOE-ε4 carrier (heterozygous)',
      shap: '+0.22',
      type: 'Non-modifiable factor',
      color: '#818cf8',
      impact: 'Increases baseline threshold',
      note: 'Genetic susceptibility factor evaluated strictly for baseline clinical context and calibration.'
    },
    vascular: {
      label: 'Stage 1 hypertension (systolic >135 mmHg)',
      shap: '+0.16',
      type: 'Modifiable factor',
      color: '#f43f5e',
      impact: 'Increases microvascular load',
      note: 'Cerebrovascular resistance correlates with executive latency and cognitive slowing.'
    }
  };

  return (
    <div className="landing-root">
      {/* Navigation Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-brand-group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="brand-logo-icon">🧠</div>
            <div>
              <span className="brand-name">CogniVeil</span>
              <span className="brand-pipe">/</span>
              <span className="brand-desc">Clinical Intelligence</span>
            </div>
          </div>

          <nav className="landing-nav-menu">
            <a href="#levels">3-Level Triage</a>
            <a href="#vectors">Biomarker Vectors</a>
            <a href="#pipeline">10-Agent Pipeline</a>
            <a href="#challenge" className="highlight-pill">⚡ Live Challenge</a>
          </nav>

          <div className="landing-header-actions">
            <button 
              className="theme-toggle-switch" 
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button className="cv-btn-secondary" onClick={() => navigate('/login')}>
              Sign in
            </button>
            <button className="cv-btn-primary" onClick={() => navigate('/login')}>
              Start screening
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-container">
          <div className="hero-grid">
            
            <div className="hero-left">
              <div className="hero-kicker-badge">
                <span className="kicker-dot"></span>
                <span>Deterministic Multimodal Screening</span>
              </div>
              
              <h1 className="hero-headline">
                Cognitive decline is gradual. <br />
                <span className="headline-gradient">Detection shouldn't be.</span>
              </h1>
              
              <p className="hero-body">
                CogniVeil combines longitudinal behavioral telemetry, active psychometrics, acoustic speech biomarkers, and conditional structural neuroimaging into an explainable clinical screening workflow.
              </p>
              <p className="hero-sub-statement">
                Never a definitive diagnosis — always a defensible screening decision.
              </p>

              <div className="hero-actions">
                <button className="cv-btn-primary" onClick={() => navigate('/login')}>
                  Launch screening session
                </button>
                <a href="#challenge" className="hero-secondary-btn">
                  <span>⚡ Take 5-sec reaction test</span>
                </a>
              </div>

              <div className="hero-stats-row cv-numeric">
                <div className="hero-stat-item">
                  <span className="stat-num">10</span>
                  <span className="stat-label">Gated agents</span>
                </div>
                <div className="stat-separator" />
                <div className="hero-stat-item">
                  <span className="stat-num">3-Level</span>
                  <span className="stat-label">Dynamic triage</span>
                </div>
                <div className="stat-separator" />
                <div className="hero-stat-item">
                  <span className="stat-num">100%</span>
                  <span className="stat-label">Provenance grounded</span>
                </div>
              </div>
            </div>

            {/* Right: Live Telemetry Workstation Card */}
            <div className="hero-right">
              <div className="waveform-instrument-card">
                <div className="card-top-status">
                  <span className="cv-ai-tag"><span className="cv-ai-dot" /> Live signal acquisition</span>
                  <div className="channel-pills-row">
                    <button 
                      className={`channel-pill-btn ${activeChannel === 'speech' ? 'active' : ''}`}
                      onClick={() => setActiveChannel('speech')}
                    >
                      🎙️ Voice
                    </button>
                    <button 
                      className={`channel-pill-btn ${activeChannel === 'telemetry' ? 'active' : ''}`}
                      onClick={() => setActiveChannel('telemetry')}
                    >
                      ⌨️ Keystrokes
                    </button>
                    <button 
                      className={`channel-pill-btn ${activeChannel === 'psychometrics' ? 'active' : ''}`}
                      onClick={() => setActiveChannel('psychometrics')}
                    >
                      ⚡ Stroop
                    </button>
                  </div>
                </div>

                {/* Animated Waveform Display */}
                <div className="waveform-canvas-box">
                  <svg className="waveform-svg" viewBox="0 0 340 75" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                    <path 
                      className={`noisy-wave-stroke ${isSimulating ? 'animating' : ''}`} 
                      d={
                        activeChannel === 'speech'
                          ? "M0,37 Q18,8 36,60 T72,20 T108,65 T144,28 T180,50 T216,35 T252,45 T288,38 L340,37"
                          : activeChannel === 'telemetry'
                          ? "M0,37 L30,37 L34,12 L38,65 L42,37 L100,37 L104,18 L108,58 L112,37 L200,37 L204,10 L208,68 L212,37 L340,37"
                          : "M0,37 C35,12 70,62 105,37 C140,12 175,62 210,37 C245,12 280,62 340,37"
                      }
                    />
                  </svg>
                  <div className="waveform-overlay-tag">
                    <span className="overlay-pulse"></span>
                    <span className="cv-numeric">Sampling {activeChannel} (16kHz)</span>
                    <button 
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', marginLeft: '6px' }}
                      onClick={() => setIsSimulating(!isSimulating)}
                    >
                      {isSimulating ? '⏸' : '▶'}
                    </button>
                  </div>
                </div>

                {/* Calibrated CogniScore Readout */}
                <div className="score-readout-panel">
                  <div className="score-top-line">
                    <span className="score-label">Calibrated CogniScore</span>
                    <span className="level-badge level-2">
                      Elevated concern
                    </span>
                  </div>

                  <div className="score-value-row">
                    <div className="score-num-box">
                      <span className="score-number cv-numeric">71.2</span>
                      <span className="score-denominator cv-numeric">/ 100</span>
                    </div>
                    <div className="score-delta-box">
                      <span className="score-drift-text cv-numeric">↓ 8.4% drift</span>
                      <span className="score-baseline-note">vs personal baseline</span>
                    </div>
                  </div>

                  <div className="score-subdomain-row cv-numeric">
                    <div className="subdomain-item">
                      <span className="subdomain-lbl">Memory</span>
                      <span className="subdomain-stat negative">↓ 16.2%</span>
                    </div>
                    <div className="subdomain-item">
                      <span className="subdomain-lbl">Motor typing</span>
                      <span className="subdomain-stat negative">↓ 20.6%</span>
                    </div>
                    <div className="subdomain-item">
                      <span className="subdomain-lbl">Vocal pause</span>
                      <span className="subdomain-stat positive">↑ 42.0%</span>
                    </div>
                  </div>
                </div>

                <div className="instrument-card-footer cv-numeric">
                  <span>EWMA smoothed (λ=0.20)</span>
                  <span>·</span>
                  <span>CUSUM threshold: 12.0</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION: 3-LEVEL INTERACTIVE CARDS (EXACT STYLE FROM REFERENCE)
         ===================================================================== */}
      <section id="levels" className="landing-levels-section">
        <div className="landing-container">
          <div className="section-head-left">
            <span className="section-kicker">3-Tier Gated Architecture</span>
            <h2 className="section-heading">Screening escalates strictly when evidence warrants</h2>
            <p className="section-desc">
              CogniVeil prevents unnecessary alarm by enforcing strict conditional gates before triggering clinical questionnaires or structural neuroimaging.
            </p>
          </div>

          <div className="reference-level-cards-grid">
            {levelCards.map((card) => (
              <div 
                key={card.id} 
                className={`level-feature-card ${activeLevel === card.id ? 'active-level' : ''}`}
                style={{
                  '--card-accent': card.accentColor,
                  '--card-glow': card.glowColor,
                }}
                onClick={() => setActiveLevel(card.id)}
              >
                {/* Top Badge & Icon */}
                <div className="card-top-row">
                  <span className={`level-badge ${card.badgeClass}`}>
                    {card.levelNum}
                  </span>
                  <span className="card-emoji-icon">{card.icon}</span>
                </div>

                {/* Vibrant Card Title */}
                <h3 className="card-level-title" style={{ color: card.accentColor }}>
                  {card.title}
                </h3>

                {/* Bullet Points with Colored Arrows */}
                <ul className="card-bullet-list">
                  {card.bullets.map((bullet, idx) => (
                    <li key={idx} className="card-bullet-item">
                      <span className="bullet-arrow" style={{ color: card.accentColor }}>→</span>
                      <span className="bullet-text">{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* Bottom Status Chip */}
                <div className="card-bottom-row">
                  <span className="level-status-pill" style={{ borderColor: `${card.accentColor}40`, color: card.accentColor }}>
                    {card.footerBadge}
                  </span>
                </div>

                {/* Clinical note footer */}
                <p className="card-clinical-note cv-numeric">
                  {card.clinicalNote}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION: INTERACTIVE 5-SECOND REACTION TEST CHALLENGE
         ===================================================================== */}
      <section id="challenge" className="landing-challenge-section">
        <div className="landing-container">
          <div className="challenge-container-card">
            
            <div className="challenge-copy-col">
              <span className="section-kicker">⚡ Interactive In-Browser Demo</span>
              <h2 className="challenge-title">Test your cognitive reaction agility</h2>
              <p className="challenge-body">
                Experience how CogniVeil's Level 1 Active Psychometric micro-battery captures millisecond response latencies and inhibition control during everyday tasks.
              </p>
              <div className="challenge-tags cv-numeric">
                <span>✓ Sub-millisecond timing</span>
                <span>✓ Stroop inhibition measurement</span>
                <span>✓ Zero private data logged</span>
              </div>
            </div>

            <div className="challenge-interactive-widget">
              {challengeState === 'idle' && (
                <div className="challenge-state-box idle">
                  <div className="challenge-pulsing-icon">⚡</div>
                  <h4>Ready for a quick 5-second reaction test?</h4>
                  <p>Click below. When the stimulus box turns bright green, click as fast as possible!</p>
                  <button className="cv-btn-primary" onClick={startChallenge}>
                    Start Reaction Test →
                  </button>
                </div>
              )}

              {challengeState === 'waiting' && (
                <div className="challenge-state-box waiting" onClick={handleChallengeClick}>
                  <div className="waiting-spinner"></div>
                  <h4 className="cv-numeric">WAIT FOR GREEN...</h4>
                  <p>Do not click yet. Preparing stimulus timer...</p>
                </div>
              )}

              {challengeState === 'ready' && (
                <div className="challenge-state-box ready" onClick={handleChallengeClick}>
                  <div className="click-now-banner">CLICK NOW!</div>
                  <span className="stimulus-text" style={{ color: stimulusWord.color }}>{stimulusWord.text}</span>
                </div>
              )}

              {challengeState === 'result' && (
                <div className="challenge-state-box result">
                  <span className="level-badge level-1">RESPONSE RECORDED</span>
                  <div className="result-number-display cv-numeric">
                    {reactionTime} <span className="ms-unit">ms</span>
                  </div>
                  <p className="result-commentary">
                    {reactionTime < 300 
                      ? '⚡ Exceptional neuromuscular speed! Faster than 92% of calibrated baseline.' 
                      : reactionTime < 450 
                      ? '✓ Normal, healthy neuromuscular reaction latency within baseline envelope.' 
                      : 'ℹ️ Mild latency hesitation detected. In clinical screening, repeated drift triggers Level 2.'}
                  </p>
                  <button className="cv-btn-secondary" onClick={startChallenge}>
                    Test Again ↺
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION: 4 MULTIMODAL TELEMETRY VECTORS
         ===================================================================== */}
      <section id="vectors" className="landing-vectors-section">
        <div className="landing-container">
          <div className="section-head-left">
            <span className="section-kicker">Multimodal observation</span>
            <h2 className="section-heading">Four independent clinical vectors</h2>
            <p className="section-desc">
              Digital biomarkers are captured across isolated physiological and behavioral channels to construct a complete longitudinal trajectory.
            </p>
          </div>

          <div className="vectors-grid">
            {signalSources.map((s) => (
              <div 
                key={s.id} 
                className="vector-card"
                style={{ '--vector-color': s.color }}
              >
                <div className="vector-card-top">
                  <span className="vector-domain cv-numeric">{s.tag}</span>
                  <span className="vector-icon">{s.icon}</span>
                </div>

                <h3 className="vector-title" style={{ color: s.color }}>{s.title}</h3>
                <div className="vector-metrics cv-numeric">{s.metrics}</div>
                <p className="vector-desc">{s.desc}</p>
                
                <div className="vector-specs cv-numeric">
                  {s.specs.map((spec, i) => (
                    <span key={i}>✓ {spec}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION: 10-NODE DETERMINISTIC PIPELINE STRIP
         ===================================================================== */}
      <section id="pipeline" className="landing-pipeline-section">
        <div className="landing-container">
          <div className="section-head-left">
            <span className="section-kicker">Deterministic multi-agent sequence</span>
            <h2 className="section-heading">How CogniVeil reasons over evidence</h2>
            <p className="section-desc">
              Every screening session executes a fixed, verifiable sequence of 10 specialized agent tools with zero black-box hallucinations.
            </p>
          </div>

          {/* Ordered 10-node strip */}
          <div className="pipeline-strip-container">
            <div className="pipeline-node-strip">
              {pipelineSteps.map((step, idx) => (
                <button
                  key={idx}
                  className={`node-button ${activeStep === idx ? 'active' : ''}`}
                  onClick={() => setActiveStep(idx)}
                >
                  <span className="node-dot" />
                  <span className="node-id cv-numeric">{step.num}</span>
                  <span className="node-title">{step.name.replace('Agent', '').replace('+', ' ')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Step Clinical Inspector */}
          <div className="pipeline-inspector-panel">
            <div className="inspector-head">
              <div className="inspector-title-group">
                <span className="inspector-step-num cv-numeric">Step {pipelineSteps[activeStep].num} of 10</span>
                <h3 className="inspector-name">{pipelineSteps[activeStep].name}</h3>
                <span className="inspector-model-badge cv-numeric">Engine: {pipelineSteps[activeStep].model}</span>
              </div>

              <div className="inspector-status-group">
                <span className="cv-ai-tag"><span className="cv-ai-dot" /> Verified deterministic rule</span>
              </div>
            </div>

            <p className="inspector-description">{pipelineSteps[activeStep].desc}</p>

            {/* Raw Structured Output Console */}
            <div className="inspector-output-box">
              <div className="output-box-header">
                <span className="output-file-name cv-numeric">output_payload.json</span>
                <span className="output-tag cv-numeric">Provenance logged</span>
              </div>
              <pre className="output-code cv-numeric">
                <code>{pipelineSteps[activeStep].output}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION: TREESHAP FACTOR EXPLAINABILITY
         ===================================================================== */}
      <section className="landing-shap-section">
        <div className="landing-container">
          <div className="section-head-left">
            <span className="section-kicker">Explainable attribution</span>
            <h2 className="section-heading">Every factor decomposed and quantified</h2>
            <p className="section-desc">
              Recommendations isolate modifiable lifestyle factors from non-modifiable genetic and vascular risk attributes.
            </p>
          </div>

          <div className="shap-instrument-panel">
            <div className="shap-tab-selector">
              {Object.keys(shapScenarios).map((k) => (
                <button
                  key={k}
                  className={`shap-select-btn ${selectedShap === k ? 'active' : ''}`}
                  onClick={() => setSelectedShap(k)}
                >
                  {shapScenarios[k].label}
                </button>
              ))}
            </div>

            <div className="shap-detail-box">
              <div className="shap-detail-header">
                <div>
                  <span className="shap-type-tag cv-numeric">{shapScenarios[selectedShap].type}</span>
                  <h3 className="shap-factor-title">{shapScenarios[selectedShap].label}</h3>
                </div>
                <div className="shap-value-display">
                  <span className="shap-num cv-numeric" style={{ color: shapScenarios[selectedShap].color }}>
                    {shapScenarios[selectedShap].shap}
                  </span>
                  <span className="shap-impact-text">{shapScenarios[selectedShap].impact}</span>
                </div>
              </div>

              <p className="shap-clinical-note">{shapScenarios[selectedShap].note}</p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION: DISCLAIMER & FOOTER
         ===================================================================== */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="disclaimer-box">
            <h4 className="disclaimer-heading">Clinical decision support disclaimer</h4>
            <p className="disclaimer-body">
              CogniVeil is a digital clinical decision-support and screening platform designed to assist qualified healthcare professionals. 
              <strong> CogniVeil does not provide a definitive diagnosis of Alzheimer's disease, dementia, or Mild Cognitive Impairment (MCI).</strong> 
              All calculated risk scores, trajectory metrics, and synthesized reports must be interpreted in conjunction with comprehensive clinical examination, patient medical history, and formal laboratory diagnostics.
            </p>
          </div>

          <div className="footer-meta-row">
            <div className="footer-left">
              <span className="footer-name">CogniVeil</span>
              <span className="footer-rights cv-numeric">© 2026 Clinical Intelligence Platform</span>
            </div>

            <div className="footer-links">
              <span onClick={() => navigate('/consent')}>Informed consent & privacy</span>
              <span onClick={() => navigate('/login')}>Clinician portal</span>
              <span onClick={() => navigate('/register')}>Register patient</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;