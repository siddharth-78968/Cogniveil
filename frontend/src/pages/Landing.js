import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './Landing.css';
import IntroSplash from '../components/IntroSplash';

// ============================================================================
// CLEAN SVG VECTOR ICONS (Zero Emojis)
// ============================================================================
const BrainIcon = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z" />
  </svg>
);

const MicroscopeIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2ZM12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
  </svg>
);

const MriIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" strokeDasharray="3 3" />
    <path d="M12 7v10M7 12h10" />
  </svg>
);

const MicIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
  </svg>
);

const KeyboardIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M10 13h4" />
  </svg>
);

const ActivityIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const SunIcon = ({ size = 18, color = '#f59e0b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = ({ size = 18, color = '#38bdf8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const PlayIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

// 10 Deterministic Pipeline Steps
const pipelineSteps = [
  { num: '01', name: 'DataQualityAgent', model: 'SNR & Schema verification', desc: 'Validates sample length, signal-to-noise ratio, and schema conformance before downstream propagation.', output: '{"status": "VALID", "snr_db": 28.4, "sample_length_ms": 14200, "audio_ok": true, "keystrokes_ok": true}' },
  { num: '02', name: 'CognitiveTestAgent', model: 'Reaction time & memory battery', desc: 'Scores active psychometric tasks (Stroop inhibition, visual-spatial attention, digit-span working memory).', output: '{"stroop_interference_ms": 84, "digit_span_forward": 7, "reaction_time_median_ms": 382, "normative_z": -0.42}' },
  { num: '03', name: 'VoiceAnalysisAgent', model: 'Whisper 16kHz + Prosodic ASR', desc: 'Extracts pause-to-speech ratio, articulation rate, phonetic diversity, and sentiment prosody without raw audio storage.', output: '{"wpm": 118, "pause_speech_ratio": 0.38, "hesitation_index": 0.44, "lexical_richness_ttr": 0.76}' },
  { num: '04', name: 'BehaviorAnalysisAgent', model: 'Typing kinematics & scroll dynamics', desc: 'Analyzes passive inter-keystroke flight time distributions, backspace correction density, and tap tremor.', output: '{"mean_flight_time_ms": 148, "backspace_ratio": 0.082, "scroll_pause_density": 0.19, "motor_stability": "Normal"}' },
  { num: '05', name: 'SignalFusionEngine', model: 'Calibrated EWMA fusion', desc: 'Computes exact 60/20/20 weighted contributions and ranks primary delta drivers.', output: '{"cogni_score": 71.2, "weights": {"cognitive": 0.60, "behavioral": 0.20, "voice": 0.20}}' },
  { num: '06', name: 'LongitudinalTrendAgent', model: 'CUSUM drift accumulator', desc: 'Applies EWMA smoothing and CUSUM accumulation to detect persistent trajectory drift.', output: '{"cusum_val": 14.8, "drift_detected": true, "trend_direction": "declining"}' },
  { num: '07', name: 'RiskOrchestrator', model: 'Gated state machine', desc: 'Governs conditional state-aware tier escalation (Tier 1 ──► Tier 2 ──► Tier 3).', output: '{"current_tier": 2, "trigger_condition": "EWMA_CUSUM_CONFIRMED", "status": "ESCALATED"}' },
  { num: '08', name: 'CatBoost + TreeSHAP', model: 'Gradient boosted trees', desc: 'Evaluates 24 clinical features with modifiable vs non-modifiable risk attributions.', output: '{"multivariate_risk": 0.68, "primary_factor": "Poor Sleep (<5h)", "shap_delta": "+0.28"}' },
  { num: '09', name: 'ResNet-18 + Grad-CAM', model: 'Volumetric morphometry', desc: 'Performs volumetric brain morphometry and visual attention localization.', output: '{"cdr_staging": "Mild CDR-1", "bpf_ratio": 0.742, "hippocampal_atrophy": "Detected"}' },
  { num: '10', name: 'MedGemma + Safety', model: 'Deterministic guardrails', desc: 'Synthesizes grounded 12-section evidence dossier with deterministic regex guardrails.', output: '{"dossier_sections": 12, "guardrails_passed": true, "non_diagnostic_certified": true}' },
];

const Landing = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [activeChannel, setActiveChannel] = useState('speech');
  const [activeStep, setActiveStep] = useState(0); // Starts at 01 DataQualityAgent by default
  const [isPipelineAutoPlaying, setIsPipelineAutoPlaying] = useState(false);

  const handleNextStage = () => {
    setActiveStep((prev) => (prev < pipelineSteps.length - 1 ? prev + 1 : 0));
  };

  const handlePrevStage = () => {
    setActiveStep((prev) => (prev > 0 ? prev - 1 : 0));
  };

  useEffect(() => {
    if (!isPipelineAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < pipelineSteps.length - 1 ? prev + 1 : 0));
    }, 2800);
    return () => clearInterval(timer);
  }, [isPipelineAutoPlaying]);

  const [selectedShap, setSelectedShap] = useState('sleep');
  const [isSimulating, setIsSimulating] = useState(true);

  // Level Sequence Automation (Level 1 -> Level 2 -> Level 3)
  const [sequenceLevelIndex, setSequenceLevelIndex] = useState(0);
  const [isSequenceAutoPlaying, setIsSequenceAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isSequenceAutoPlaying) return;
    const interval = setInterval(() => {
      setSequenceLevelIndex((prev) => (prev + 1) % 3);
    }, 3400);
    return () => clearInterval(interval);
  }, [isSequenceAutoPlaying]);

  // Interactive Flowchart State (4 Independent Clinical Vectors)
  const [selectedFlowVector, setSelectedFlowVector] = useState('speech');
  const [flowScenario, setFlowScenario] = useState('drift'); // 'baseline', 'drift', 'high_risk'

  // Intro Splash State
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('cogniveil_intro_seen');
  });

  const handleIntroComplete = () => {
    sessionStorage.setItem('cogniveil_intro_seen', 'true');
    setShowIntro(false);
  };

  // Interactive In-Browser Cognitive Reaction Test
  const [challengeState, setChallengeState] = useState('idle');
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

  // 3 Distinct Level Cards with SVG Icons
  const levelCards = [
    {
      id: 'level1',
      levelNum: 'Level 1',
      badgeClass: 'level-1',
      accentColor: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      icon: <BrainIcon size={22} color="#10b981" />,
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
      icon: <MicroscopeIcon size={22} color="#f59e0b" />,
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
      icon: <MriIcon size={22} color="#f43f5e" />,
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

  // 4 Multimodal Telemetry Channels for Interactive Flowchart
  const flowScenarios = {
    baseline: {
      name: 'Healthy Normal Baseline',
      score: '93.4',
      status: 'Optimal Baseline',
      statusColor: '#10b981',
      drift: '+0.01σ',
      vectorMetrics: {
        speech: { wpm: '148', pauseRate: '210ms', richness: '0.92', status: 'Healthy prosody' },
        telemetry: { latency: '132ms', hesitation: '0.04σ', errorRate: '1.2%', status: 'Stable motor flight' },
        psychometrics: { digitSpan: '7.8 digits', stroopDelay: '42ms', recall: '94%', status: 'Executive control robust' },
        neuroimaging: { vbr: 'Normal', hippocampalVol: '3,540 mm³', cdr: '0.0', status: 'Not indicated (Tier 1 safe)' }
      }
    },
    drift: {
      name: 'Early Longitudinal Drift',
      score: '71.2',
      status: 'Elevated Concern',
      statusColor: '#f59e0b',
      drift: '-0.18σ',
      vectorMetrics: {
        speech: { wpm: '118', pauseRate: '420ms', richness: '0.74', status: 'Acoustic latency drift' },
        telemetry: { latency: '168ms', hesitation: '0.14σ', errorRate: '4.8%', status: 'Motor typing hesitation' },
        psychometrics: { digitSpan: '5.6 digits', stroopDelay: '98ms', recall: '76%', status: 'Mild episodic slowing' },
        neuroimaging: { vbr: 'Marginal', hippocampalVol: '3,380 mm³', cdr: '0.5', status: 'Conditional gate armed' }
      }
    },
    high_risk: {
      name: 'High Risk Escalation',
      score: '44.8',
      status: 'Clinical Triage Required',
      statusColor: '#f43f5e',
      drift: '-0.42σ',
      vectorMetrics: {
        speech: { wpm: '88', pauseRate: '680ms', richness: '0.58', status: 'Phonemic pause inflation' },
        telemetry: { latency: '240ms', hesitation: '0.38σ', errorRate: '11.2%', status: 'Severe kinematic drift' },
        psychometrics: { digitSpan: '4.1 digits', stroopDelay: '184ms', recall: '52%', status: 'Inhibition decay' },
        neuroimaging: { vbr: 'Enlarged', hippocampalVol: '2,920 mm³', cdr: '1.0', status: 'Tier 3 structural atrophy confirmed' }
      }
    }
  };

  const signalSources = [
    {
      id: 'speech',
      title: 'Acoustic Speech Analysis',
      tag: 'Acoustic domain',
      color: '#22d3ee',
      glow: 'rgba(34, 211, 238, 0.25)',
      icon: <MicIcon size={20} color="#22d3ee" />,
      metrics: 'WPM Cadence · Pause Rate · Lexical Richness',
      desc: 'Whisper neural acoustic feature extraction across 7 vernacular languages. Analyzes pause-to-speech ratios and articulation latency with zero raw audio storage.',
      specs: ['7 vernacular dialects', 'Sub-second pause tracking', 'Zero raw audio retention']
    },
    {
      id: 'telemetry',
      title: 'Interaction Keystroke Telemetry',
      tag: 'Motor behavior',
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.25)',
      icon: <KeyboardIcon size={20} color="#10b981" />,
      metrics: 'Inter-Key Latency · Backspace Rate · Scroll Hesitation',
      desc: 'Sub-millisecond passive timing measurement during everyday app usage. Evaluates neuromuscular hesitation and burst patterns with 100% privacy preservation.',
      specs: ['Sub-ms precision', 'Zero-keylog privacy', 'EWMA smoothed baseline']
    },
    {
      id: 'psychometrics',
      title: 'Active Psychometrics Micro-Tasks',
      tag: 'Cognitive domain',
      color: '#818cf8',
      glow: 'rgba(129, 140, 248, 0.25)',
      icon: <ActivityIcon size={20} color="#818cf8" />,
      metrics: 'Delayed Recall · Stroop Inhibition · Reaction Speed',
      desc: '3-minute daily micro-battery decomposing episodic retrieval, visual-spatial attention, and working memory into isolated validated subdomains.',
      specs: ['Standardized digit span', 'Color Stroop inhibition', 'Reaction decay curve']
    },
    {
      id: 'neuroimaging',
      title: 'Structural Neuroimaging (Tier 3)',
      tag: 'Biomarker (conditional)',
      color: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.25)',
      icon: <BrainIcon size={20} color="#f43f5e" />,
      metrics: 'ResNet-18 CDR Staging · Morphometry (BPF/VBR) · Grad-CAM',
      desc: 'Gated conditional evaluation triggered strictly when Tier 2 risk is elevated. Identifies hippocampal volume loss and ventricular enlargement with explainable heatmaps.',
      specs: ['ResNet-18 architecture', 'BPF/VBR volumetrics', 'Grad-CAM attention maps']
    }
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

  const currentScenarioData = flowScenarios[flowScenario];
  const activeFlowObj = signalSources.find((s) => s.id === selectedFlowVector) || signalSources[0];

  return (
    <div className="landing-root">
      {/* Intro Splash Video Player */}
      <IntroSplash
        isOpen={showIntro}
        onClose={() => setShowIntro(false)}
        onComplete={handleIntroComplete}
      />

      {/* Navigation Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-brand-group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="brand-logo-icon">
              <BrainIcon size={24} color="#22d3ee" />
            </div>
            <div>
              <span className="brand-name">CogniVeil</span>
              <span className="brand-pipe">/</span>
              <span className="brand-desc">Clinical Intelligence</span>
            </div>
          </div>

          <nav className="landing-nav-menu">
            <a href="#levels">3-Level Triage</a>
            <a href="#vectors">Biomarker Flowchart</a>
            <a href="#pipeline">10-Agent Pipeline</a>
            <a href="#challenge" className="highlight-pill">
              <span className="kicker-dot" /> Live Challenge
            </a>
          </nav>

          <div className="landing-header-actions">
            <button 
              className="theme-toggle-switch" 
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button 
              className="cv-btn-secondary" 
              onClick={() => setShowIntro(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', borderColor: 'rgba(16, 185, 129, 0.4)' }}
              title="Watch System Introduction"
            >
              <PlayIcon size={12} color="#10b981" />
              <span>Intro</span>
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
                Never a definitive diagnosis, always a defensible screening decision.
              </p>

              <div className="hero-actions">
                <button className="cv-btn-primary" onClick={() => navigate('/login')}>
                  Launch screening session
                </button>
                <button 
                  className="hero-secondary-btn" 
                  onClick={() => setShowIntro(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                >
                  <PlayIcon size={14} color="#10b981" />
                  <span>Watch System Intro</span>
                </button>
                <a href="#challenge" className="hero-secondary-btn">
                  <span>Take 5-sec reaction test</span>
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
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <MicIcon size={14} /> Voice
                    </button>
                    <button 
                      className={`channel-pill-btn ${activeChannel === 'telemetry' ? 'active' : ''}`}
                      onClick={() => setActiveChannel('telemetry')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <KeyboardIcon size={14} /> Keystrokes
                    </button>
                    <button 
                      className={`channel-pill-btn ${activeChannel === 'psychometrics' ? 'active' : ''}`}
                      onClick={() => setActiveChannel('psychometrics')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <ActivityIcon size={14} /> Stroop
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
                      {isSimulating ? 'Pause' : 'Resume'}
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
          SECTION: 3-LEVEL SEQUENTIAL PIPELINE (Level 1 -> Level 2 -> Level 3)
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

          {/* Sequential Stepper Control Bar */}
          <div className="level-sequence-stepper-bar">
            <div className="level-step-indicator-group">
              <button 
                className={`level-step-indicator-btn ${sequenceLevelIndex === 0 ? 'active' : ''}`}
                onClick={() => { setSequenceLevelIndex(0); setIsSequenceAutoPlaying(false); }}
              >
                <span>01</span>
                <span>Passive AI Screening</span>
              </button>
              <span className="level-step-indicator-arrow">→</span>
              <button 
                className={`level-step-indicator-btn ${sequenceLevelIndex === 1 ? 'active' : ''}`}
                onClick={() => { setSequenceLevelIndex(1); setIsSequenceAutoPlaying(false); }}
              >
                <span>02</span>
                <span>Targeted Assessment</span>
              </button>
              <span className="level-step-indicator-arrow">→</span>
              <button 
                className={`level-step-indicator-btn ${sequenceLevelIndex === 2 ? 'active' : ''}`}
                onClick={() => { setSequenceLevelIndex(2); setIsSequenceAutoPlaying(false); }}
              >
                <span>03</span>
                <span>MRI Deep Learning</span>
              </button>
            </div>

            <button 
              className="level-autoplay-toggle"
              onClick={() => setIsSequenceAutoPlaying(!isSequenceAutoPlaying)}
              title="Toggle automatic sequential flow"
            >
              <span>{isSequenceAutoPlaying ? 'Auto-Cycle: Active' : 'Auto-Cycle: Paused'}</span>
            </button>
          </div>

          {/* Sequential Pipeline Cards with Escalation Conduits */}
          <div className="level-cards-pipeline-wrapper">
            {/* Card 1: Level 1 */}
            <div 
              className={`level-feature-card ${sequenceLevelIndex === 0 ? 'animating-active active-level' : ''}`}
              style={{
                '--card-accent': levelCards[0].accentColor,
                '--card-glow': levelCards[0].glowColor,
              }}
              onClick={() => { setSequenceLevelIndex(0); setIsSequenceAutoPlaying(false); }}
            >
              <div className="card-top-row">
                <span className={`level-badge ${levelCards[0].badgeClass}`}>
                  {levelCards[0].levelNum}
                </span>
                <span className="card-svg-icon">{levelCards[0].icon}</span>
              </div>

              <h3 className="card-level-title" style={{ color: levelCards[0].accentColor }}>
                {levelCards[0].title}
              </h3>

              <ul className="card-bullet-list">
                {levelCards[0].bullets.map((bullet, idx) => (
                  <li key={idx} className="card-bullet-item">
                    <span className="bullet-arrow" style={{ color: levelCards[0].accentColor }}>→</span>
                    <span className="bullet-text">{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="card-bottom-row">
                <span className="level-status-pill" style={{ borderColor: `${levelCards[0].accentColor}40`, color: levelCards[0].accentColor }}>
                  {sequenceLevelIndex === 0 ? '● Active Monitoring' : levelCards[0].footerBadge}
                </span>
              </div>

              <p className="card-clinical-note cv-numeric">
                {levelCards[0].clinicalNote}
              </p>
            </div>

            {/* Escalation Conduit 1 -> 2 */}
            <div className="pipeline-escalation-conduit">
              <div className="conduit-line-track">
                <div className="conduit-line-pulse" />
              </div>
              <div className="conduit-gate-badge cv-numeric">
                Gate: Drift &gt; 3σ or Score &lt; 60
              </div>
            </div>

            {/* Card 2: Level 2 */}
            <div 
              className={`level-feature-card ${sequenceLevelIndex === 1 ? 'animating-active active-level' : ''}`}
              style={{
                '--card-accent': levelCards[1].accentColor,
                '--card-glow': levelCards[1].glowColor,
              }}
              onClick={() => { setSequenceLevelIndex(1); setIsSequenceAutoPlaying(false); }}
            >
              <div className="card-top-row">
                <span className={`level-badge ${levelCards[1].badgeClass}`}>
                  {levelCards[1].levelNum}
                </span>
                <span className="card-svg-icon">{levelCards[1].icon}</span>
              </div>

              <h3 className="card-level-title" style={{ color: levelCards[1].accentColor }}>
                {levelCards[1].title}
              </h3>

              <ul className="card-bullet-list">
                {levelCards[1].bullets.map((bullet, idx) => (
                  <li key={idx} className="card-bullet-item">
                    <span className="bullet-arrow" style={{ color: levelCards[1].accentColor }}>→</span>
                    <span className="bullet-text">{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="card-bottom-row">
                <span className="level-status-pill" style={{ borderColor: `${levelCards[1].accentColor}40`, color: levelCards[1].accentColor }}>
                  {sequenceLevelIndex === 1 ? '● Escalation Triggered' : levelCards[1].footerBadge}
                </span>
              </div>

              <p className="card-clinical-note cv-numeric">
                {levelCards[1].clinicalNote}
              </p>
            </div>

            {/* Escalation Conduit 2 -> 3 */}
            <div className="pipeline-escalation-conduit amber">
              <div className="conduit-line-track">
                <div className="conduit-line-pulse" />
              </div>
              <div className="conduit-gate-badge cv-numeric">
                Gate: High Clinical Risk Confirmed
              </div>
            </div>

            {/* Card 3: Level 3 */}
            <div 
              className={`level-feature-card ${sequenceLevelIndex === 2 ? 'animating-active active-level' : ''}`}
              style={{
                '--card-accent': levelCards[2].accentColor,
                '--card-glow': levelCards[2].glowColor,
              }}
              onClick={() => { setSequenceLevelIndex(2); setIsSequenceAutoPlaying(false); }}
            >
              <div className="card-top-row">
                <span className={`level-badge ${levelCards[2].badgeClass}`}>
                  {levelCards[2].levelNum}
                </span>
                <span className="card-svg-icon">{levelCards[2].icon}</span>
              </div>

              <h3 className="card-level-title" style={{ color: levelCards[2].accentColor }}>
                {levelCards[2].title}
              </h3>

              <ul className="card-bullet-list">
                {levelCards[2].bullets.map((bullet, idx) => (
                  <li key={idx} className="card-bullet-item">
                    <span className="bullet-arrow" style={{ color: levelCards[2].accentColor }}>→</span>
                    <span className="bullet-text">{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="card-bottom-row">
                <span className="level-status-pill" style={{ borderColor: `${levelCards[2].accentColor}40`, color: levelCards[2].accentColor }}>
                  {sequenceLevelIndex === 2 ? '● Structural Imaging Active' : levelCards[2].footerBadge}
                </span>
              </div>

              <p className="card-clinical-note cv-numeric">
                {levelCards[2].clinicalNote}
              </p>
            </div>
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
              <span className="section-kicker">Interactive In-Browser Demo</span>
              <h2 className="challenge-title">Test your cognitive reaction agility</h2>
              <p className="challenge-body">
                Experience how CogniVeil's Level 1 Active Psychometric micro-battery captures millisecond response latencies and inhibition control during everyday tasks.
              </p>
              <div className="challenge-tags cv-numeric">
                <span>Sub-millisecond timing</span>
                <span>Stroop inhibition measurement</span>
                <span>Zero private data logged</span>
              </div>
            </div>

            <div className="challenge-interactive-widget">
              {challengeState === 'idle' && (
                <div className="challenge-state-box idle">
                  <div className="challenge-stimulus-display">
                    <span className="stimulus-placeholder">Press start to begin</span>
                  </div>
                  <button className="cv-btn-primary" onClick={startChallenge}>
                    <span>Test Reaction</span>
                  </button>
                </div>
              )}

              {challengeState === 'waiting' && (
                <div className="challenge-state-box waiting" onClick={handleChallengeClick}>
                  <div className="challenge-stimulus-display">
                    <span className="stimulus-alert">Wait for stimulus...</span>
                  </div>
                  <p className="stimulus-instruction">Do not click until the stimulus appears.</p>
                </div>
              )}

              {challengeState === 'ready' && (
                <div className="challenge-state-box ready" onClick={handleChallengeClick}>
                  <div className="challenge-stimulus-display" style={{ color: stimulusWord.color }}>
                    <span className="stimulus-target-word">{stimulusWord.text}</span>
                  </div>
                  <p className="stimulus-instruction active">Click Now!</p>
                </div>
              )}

              {challengeState === 'result' && (
                <div className="challenge-state-box result">
                  <span className="result-label">Your Latency</span>
                  <div className="result-number-row cv-numeric">
                    <span className="result-number">{reactionTime}</span>
                    <span className="result-unit">ms</span>
                  </div>
                  <p className="result-commentary">
                    {reactionTime < 300 
                      ? 'Exceptional neuromuscular speed! Faster than 92% of calibrated baseline.' 
                      : reactionTime < 450 
                      ? 'Normal, healthy neuromuscular reaction latency within baseline envelope.' 
                      : 'Mild latency hesitation detected. In clinical screening, repeated drift triggers Level 2.'}
                  </p>
                  <button className="cv-btn-secondary" onClick={startChallenge}>
                    Test Again
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION: INTERACTIVE CLINICAL FLOWCHART (4 Independent Vectors)
         ===================================================================== */}
      <section id="vectors" className="landing-vectors-section">
        <div className="landing-container">
          <div className="section-head-left">
            <span className="section-kicker">Interactive Clinical Flowchart</span>
            <h2 className="section-heading">Four independent clinical vectors into calibrated consensus</h2>
            <p className="section-desc">
              Digital biomarkers are captured across isolated physiological and behavioral channels, passing through privacy enclaves into explainable clinical consensus. Click any vector or simulation scenario to trace the data flow.
            </p>
          </div>

          {/* Flowchart Simulation Scenarios Bar */}
          <div className="flowchart-simulation-bar">
            <div className="flowchart-sim-label">
              <span className="kicker-dot" />
              <span>Patient Simulation Scenario:</span>
            </div>
            <div className="flowchart-sim-buttons">
              <button 
                className={`flowchart-sim-btn ${flowScenario === 'baseline' ? 'active' : ''}`}
                onClick={() => setFlowScenario('baseline')}
              >
                Normal Baseline (Score: 93.4)
              </button>
              <button 
                className={`flowchart-sim-btn ${flowScenario === 'drift' ? 'active' : ''}`}
                onClick={() => setFlowScenario('drift')}
              >
                Mild Cognitive Drift (Score: 71.2)
              </button>
              <button 
                className={`flowchart-sim-btn ${flowScenario === 'high_risk' ? 'active' : ''}`}
                onClick={() => setFlowScenario('high_risk')}
              >
                High Risk Escalation (Score: 44.8)
              </button>
            </div>
          </div>

          {/* The Interactive Flowchart Architecture Board */}
          <div className="clinical-flowchart-board">
            {/* Column 1: 4 Vector Source Nodes */}
            <div className="flowchart-sources-col">
              {signalSources.map((s) => {
                const metric = currentScenarioData.vectorMetrics[s.id];
                const isSelected = selectedFlowVector === s.id;
                return (
                  <div
                    key={s.id}
                    className={`flow-source-node ${isSelected ? 'active-node' : ''}`}
                    style={{
                      '--node-color': s.color,
                      '--node-glow': s.glow
                    }}
                    onClick={() => setSelectedFlowVector(s.id)}
                  >
                    <div className="flow-node-content">
                      <span className="flow-node-domain">{s.tag}</span>
                      <span className="flow-node-title">{s.title}</span>
                      <span className="flow-node-metric-preview">
                        {s.id === 'speech' && `WPM: ${metric.wpm} · Pause: ${metric.pauseRate}`}
                        {s.id === 'telemetry' && `Latency: ${metric.latency} · Drift: ${metric.hesitation}`}
                        {s.id === 'psychometrics' && `Stroop: ${metric.stroopDelay} · Recall: ${metric.recall}`}
                        {s.id === 'neuroimaging' && `CDR: ${metric.cdr} · Hippocampus: ${metric.hippocampalVol}`}
                      </span>
                    </div>
                    <div className="flow-node-icon-box">
                      {s.icon}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conduits 1 -> 2 */}
            <div className="flow-conduit-channel">
              <svg className="flow-pipe-svg" viewBox="0 0 44 240">
                <path d="M 0 35 C 22 35, 22 80, 44 80" stroke="rgba(34, 211, 238, 0.4)" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                <path d="M 0 95 C 22 95, 22 95, 44 95" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                <path d="M 0 155 C 22 155, 22 145, 44 145" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                <path d="M 0 215 C 22 215, 22 160, 44 160" stroke="rgba(244, 63, 94, 0.4)" strokeWidth="2" fill="none" strokeDasharray="4 4" />
              </svg>
            </div>

            {/* Column 2: Central Signal Processing Core */}
            <div className="flowchart-processing-col">
              <div className="flow-processing-card">
                <div className="flow-card-badge-row">
                  <span className="cv-ai-tag"><span className="cv-ai-dot" /> Privacy Enclave</span>
                  <span className="cv-numeric" style={{ fontSize: '11px', color: '#64748b' }}>SHA-256</span>
                </div>
                <h4 className="flow-processing-title">Zero Raw Storage Protocol</h4>
                <p className="flow-processing-desc">
                  Transforms live keystroke timing and vocal audio into differential mathematical matrices without storing raw voice or keystroke content.
                </p>
              </div>

              <div className="flow-processing-card">
                <div className="flow-card-badge-row">
                  <span className="cv-ai-tag" style={{ color: '#22d3ee', borderColor: 'rgba(34, 211, 238, 0.3)' }}>
                    <span className="cv-ai-dot" style={{ backgroundColor: '#22d3ee' }} /> EWMA &amp; CUSUM
                  </span>
                  <span className="cv-numeric" style={{ fontSize: '11px', color: '#64748b' }}>λ=0.20</span>
                </div>
                <h4 className="flow-processing-title">Longitudinal Drift Accumulator</h4>
                <p className="flow-processing-desc">
                  Separates episodic fatigue from genuine cognitive deceleration using statistical quality control thresholding.
                </p>
              </div>
            </div>

            {/* Conduits 2 -> 3 */}
            <div className="flow-conduit-channel">
              <svg className="flow-pipe-svg" viewBox="0 0 44 240">
                <path d="M 0 80 C 22 80, 22 120, 44 120" stroke="rgba(34, 211, 238, 0.5)" strokeWidth="2.5" fill="none" />
                <path d="M 0 160 C 22 160, 22 120, 44 120" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="2.5" fill="none" />
              </svg>
            </div>

            {/* Column 3: 10-Agent Consensus & Calibrated CogniScore */}
            <div className="flowchart-output-col">
              <div className="flow-score-card">
                <span className="cv-ai-tag" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                  <span className="cv-ai-dot" /> 10-Agent Consensus
                </span>
                <div className="flow-score-val cv-numeric" style={{ color: currentScenarioData.statusColor }}>
                  {currentScenarioData.score}
                </div>
                <div className="flow-score-status cv-numeric" style={{ color: currentScenarioData.statusColor, borderColor: `${currentScenarioData.statusColor}50` }}>
                  {currentScenarioData.status}
                </div>
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b' }} className="cv-numeric">
                  Trajectory Drift: <span style={{ color: currentScenarioData.statusColor }}>{currentScenarioData.drift}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Flowchart Vector Inspector Drawer */}
          <div className="flowchart-inspector-drawer">
            <div className="inspector-drawer-left">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ color: activeFlowObj.color }}>{activeFlowObj.icon}</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: activeFlowObj.color }}>
                  {activeFlowObj.title}
                </h3>
                <span className="level-status-pill cv-numeric" style={{ marginLeft: 'auto', fontSize: '10px', borderColor: `${activeFlowObj.color}40`, color: activeFlowObj.color }}>
                  {activeFlowObj.tag}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--cv-fog-muted)', lineHeight: '1.6', margin: '0 0 14px 0' }}>
                {activeFlowObj.desc}
              </p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b' }} className="cv-numeric">
                {activeFlowObj.specs.map((spec, idx) => (
                  <span key={idx} style={{ color: '#cbd5e1' }}>&bull; {spec}</span>
                ))}
              </div>
            </div>

            <div className="inspector-drawer-right cv-numeric">
              <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.08em' }}>
                Simulated Biomarker Value
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: activeFlowObj.color, marginBottom: '4px' }}>
                {activeFlowObj.id === 'speech' && `${currentScenarioData.vectorMetrics.speech.wpm} WPM · ${currentScenarioData.vectorMetrics.speech.pauseRate} Pause`}
                {activeFlowObj.id === 'telemetry' && `${currentScenarioData.vectorMetrics.telemetry.latency} Latency · ${currentScenarioData.vectorMetrics.telemetry.hesitation} Drift`}
                {activeFlowObj.id === 'psychometrics' && `${currentScenarioData.vectorMetrics.psychometrics.stroopDelay} Stroop · ${currentScenarioData.vectorMetrics.psychometrics.recall} Recall`}
                {activeFlowObj.id === 'neuroimaging' && `CDR: ${currentScenarioData.vectorMetrics.neuroimaging.cdr} · ${currentScenarioData.vectorMetrics.neuroimaging.hippocampalVol}`}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Status: {currentScenarioData.vectorMetrics[activeFlowObj.id].status}
              </div>
            </div>
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
              {pipelineSteps.map((step, idx) => {
                const isCompleted = idx < activeStep;
                const isCurrent = idx === activeStep;
                const isPending = idx > activeStep;

                return (
                  <button
                    key={idx}
                    className={`node-button ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''}`}
                    onClick={() => {
                      setActiveStep(idx);
                      setIsPipelineAutoPlaying(false);
                    }}
                    title={`Click to inspect Step ${step.num}: ${step.name}`}
                  >
                    <span className="node-dot">
                      {isCompleted ? '✓' : ''}
                    </span>
                    <span className="node-id cv-numeric">{step.num}</span>
                    <span className="node-title">{step.name.replace('Agent', '').replace('+', ' ')}</span>
                  </button>
                );
              })}
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

              <div className="inspector-status-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="cv-ai-tag"><span className="cv-ai-dot" /> Verified deterministic rule</span>
                <button
                  className="pipeline-auto-advance-btn cv-numeric"
                  onClick={() => setIsPipelineAutoPlaying(!isPipelineAutoPlaying)}
                  title="Toggle automatic agent advancement"
                >
                  {isPipelineAutoPlaying ? 'Auto-Advance: ON' : 'Auto-Advance: OFF'}
                </button>
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

            {/* Pipeline Execution Progress Bar */}
            <div className="pipeline-execution-progress-bar">
              <div 
                className="pipeline-execution-progress-fill" 
                style={{ width: `${((activeStep + 1) / pipelineSteps.length) * 100}%` }} 
              />
            </div>

            {/* Interactive Pipeline Navigation Footer */}
            <div className="pipeline-navigation-footer">
              <button 
                className="pipeline-nav-btn prev"
                onClick={handlePrevStage}
                disabled={activeStep === 0}
                title="Return to previous clinical stage"
              >
                ← Previous Stage
              </button>

              <div className="pipeline-stage-tracker cv-numeric">
                <span>Stage {pipelineSteps[activeStep].num} of 10 &bull; {pipelineSteps[activeStep].name}</span>
              </div>

              <button 
                className="pipeline-nav-btn next cv-btn-primary"
                onClick={handleNextStage}
                title={activeStep < pipelineSteps.length - 1 ? `Execute Step ${pipelineSteps[activeStep + 1].num}` : 'Restart sequence at Step 01'}
              >
                {activeStep < pipelineSteps.length - 1 ? (
                  <>
                    <span>Execute Next Stage: {pipelineSteps[activeStep + 1].num} {pipelineSteps[activeStep + 1].name.replace('Agent', '')}</span>
                    <span className="arrow">→</span>
                  </>
                ) : (
                  <>
                    <span>Pipeline Completed &bull; Restart at Step 01</span>
                    <span className="arrow">↺</span>
                  </>
                )}
              </button>
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

          <div className="shap-interactive-grid">
            <div className="shap-selector-col">
              {Object.entries(shapScenarios).map(([key, item]) => (
                <button
                  key={key}
                  className={`shap-factor-btn ${selectedShap === key ? 'active' : ''}`}
                  onClick={() => setSelectedShap(key)}
                  style={{ '--factor-color': item.color }}
                >
                  <div className="factor-btn-top">
                    <span className="factor-type cv-numeric">{item.type}</span>
                    <span className="factor-shap cv-numeric" style={{ color: item.color }}>{item.shap}</span>
                  </div>
                  <div className="factor-label">{item.label}</div>
                </button>
              ))}
            </div>

            <div className="shap-detail-card">
              <div className="shap-detail-top">
                <span className="cv-ai-tag" style={{ color: shapScenarios[selectedShap].color, borderColor: `${shapScenarios[selectedShap].color}40` }}>
                  {shapScenarios[selectedShap].type}
                </span>
                <span className="shap-impact cv-numeric" style={{ color: shapScenarios[selectedShap].color }}>
                  SHAP Attribution: {shapScenarios[selectedShap].shap}
                </span>
              </div>

              <h3 className="shap-detail-title">{shapScenarios[selectedShap].label}</h3>
              <p className="shap-impact-text cv-numeric">{shapScenarios[selectedShap].impact}</p>
              
              <div className="shap-clinical-note-box">
                <div className="note-label cv-numeric">Clinical Pathophysiology</div>
                <p className="note-body">{shapScenarios[selectedShap].note}</p>
              </div>

              <div className="shap-card-footer cv-numeric">
                <span>CatBoost TreeSHAP exact computation</span>
                <span>·</span>
                <span>OASIS-3 &amp; ADNI validated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION: CLINICAL DISCLAIMER & FOOTER
         ===================================================================== */}
      <footer className="landing-footer">
        <div className="landing-container">
          {/* Clinical Decision Support Disclaimer Card */}
          <div className="landing-disclaimer-card">
            <div className="disclaimer-title cv-numeric">CLINICAL DECISION SUPPORT DISCLAIMER</div>
            <p className="disclaimer-text">
              CogniVeil is a digital clinical decision-support and screening platform designed to assist qualified healthcare professionals.{' '}
              <strong>CogniVeil does not provide a definitive diagnosis of Alzheimer's disease, dementia, or Mild Cognitive Impairment (MCI).</strong>{' '}
              All calculated risk scores, trajectory metrics, and synthesized reports must be interpreted in conjunction with comprehensive clinical examination, patient medical history, and formal laboratory diagnostics.
            </p>
          </div>

          {/* Bottom Bar */}
          <div className="landing-footer-bottom-bar cv-numeric">
            <div className="footer-copyright-group">
              <span className="footer-brand-title">CogniVeil</span>
              <span className="footer-copyright-text">&copy; 2026 Clinical Intelligence Platform</span>
            </div>

            <div className="footer-action-links">
              <span onClick={() => navigate('/login')}>Informed consent &amp; privacy</span>
              <span onClick={() => navigate('/login')}>Clinician portal</span>
              <span onClick={() => navigate('/login')}>Register patient</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;