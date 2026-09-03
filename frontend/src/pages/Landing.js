import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import IntroSplash from '../components/IntroSplash';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // Intro Splash Animation State (plays on initial visit / refresh)
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  // Active states for interactive components
  const [activeStep, setActiveStep] = useState(5); // Default to LongitudinalTrendAgent (index 5)
  const [selectedShap, setSelectedShap] = useState('sleep');
  const [activeFaq, setActiveFaq] = useState(null);
  const [trendView, setTrendView] = useState('graph'); // 'graph' or 'json'

  // Interactive Topology Graph State
  const [selectedTopologyNode, setSelectedTopologyNode] = useState('keystroke'); // 'all' | 'speech' | 'keystroke' | 'psychometrics' | 'hub' | 'neuroimaging' | 'medgemma'
  const [isTopologyStreaming, setIsTopologyStreaming] = useState(true);
  const [telemetryTick, setTelemetryTick] = useState(0);

  // Periodic subtle live fluctuation for telemetry stream
  useEffect(() => {
    if (!isTopologyStreaming) return;
    const interval = setInterval(() => {
      setTelemetryTick((prev) => (prev + 1) % 100);
    }, 1800);
    return () => clearInterval(interval);
  }, [isTopologyStreaming]);

  // Comprehensive Clinical Topology Metadata & Vector Specs
  const topologyData = {
    speech: {
      id: 'speech',
      name: 'Speech Acoustics',
      sub: 'Whisper Jitter & Pause Tracking',
      domain: 'ACOUSTIC SENSOR',
      status: 'STREAMING · 16 kHz',
      activePill: '0.82ms Jitter · SNR 28.4dB',
      score: '18.4',
      drift: '-2.1%',
      driftLabel: 'Mild acoustic pause latency',
      state: 'Tier 1 Nominal',
      privacy: 'Zero Raw Audio Retained',
      badgeClass: 'nominal',
      summary: 'Whisper-derived acoustic feature extraction across spontaneous conversational speech. Evaluates fundamental frequency (F0) micro-tremors, articulation pause ratios, and phonetic latency without storing raw audio.',
      vectors: [
        { label: 'Fundamental F0 Jitter', value: `${(0.82 + (telemetryTick % 3) * 0.01).toFixed(2)} ms`, status: 'optimal' },
        { label: 'Pause-to-Speech Ratio', value: `${(18.4 + (telemetryTick % 4) * 0.1).toFixed(1)}%`, status: 'optimal' },
        { label: 'Formant Dispersion', value: '2,410 Hz', status: 'optimal' },
        { label: 'Acoustic SNR', value: '28.4 dB', status: 'high' }
      ],
      sparkline: [42, 45, 41, 48, 52, 49, 54, 51, 56]
    },
    keystroke: {
      id: 'keystroke',
      name: 'Keystroke Dynamics',
      sub: 'Sub-ms Inter-Key Latency',
      domain: 'NEUROMOTOR TELEMETRY',
      status: 'ACTIVE DRIFT · 1,000 Hz',
      activePill: '114ms Flight · 99.2% Reg',
      score: '28.6',
      drift: '-8.4%',
      driftLabel: 'Longitudinal neuromotor drift',
      state: 'Tier 2 Escalated',
      privacy: 'Zero Keylog (Timestamps Only)',
      badgeClass: 'warning',
      summary: 'Sub-millisecond passive inter-key timing and hold duration telemetry captured during routine typing. Unmasks fine neuromotor deceleration, hesitations between syllables, and backspace error burst dynamics with complete privacy assurance.',
      vectors: [
        { label: 'Mean Inter-Key Flight', value: `${(114.2 + (telemetryTick % 3) * 0.3).toFixed(1)} ms`, status: 'drift' },
        { label: 'Hold Duration Dispersion', value: '82.4 ms', status: 'drift' },
        { label: 'Backspace Correction Rate', value: '+6.8%', status: 'warning' },
        { label: 'Neuromotor Rhythm Entropy', value: '0.91 bit', status: 'optimal' }
      ],
      sparkline: [78, 76, 75, 71, 68, 64, 62, 59, 58]
    },
    psychometrics: {
      id: 'psychometrics',
      name: 'Active Psychometrics',
      sub: 'Stroop Inhibition Battery',
      domain: 'COGNITIVE DOMAIN',
      status: 'MICRO-BATTERY · 60 Hz',
      activePill: '288ms Stroop · Δ 4.1%',
      score: '24.2',
      drift: '-4.9%',
      driftLabel: 'Executive attention hesitation',
      state: 'Tier 1 Monitoring',
      privacy: 'Session Ephemeral Storage',
      badgeClass: 'info',
      summary: 'Brief 3-minute calibrated micro-tasks measuring selective attention, executive inhibition, and working memory. The Stroop interference protocol isolates frontal lobe response conflict resolution speed.',
      vectors: [
        { label: 'Congruent Latency', value: '284 ms', status: 'optimal' },
        { label: 'Incongruent Stroop Delay', value: `${(142 + (telemetryTick % 5)).toFixed(0)} ms`, status: 'drift' },
        { label: 'Digit Span Backwards', value: '5.2 items', status: 'optimal' },
        { label: 'Accuracy Under Conflict', value: '94.2%', status: 'optimal' }
      ],
      sparkline: [85, 82, 84, 80, 77, 76, 74, 72, 71]
    },
    hub: {
      id: 'hub',
      name: '10-Agent EWMA & CUSUM Core',
      sub: 'Multi-Agent Active Inference',
      domain: 'CENTRAL PROCESSING MATRIX',
      status: '10 AGENTS SYNCHRONIZED',
      activePill: 'λ=0.20 · h=3.0σ · p<0.001',
      score: '71.2',
      drift: '-8.4%',
      driftLabel: 'Confirmed Change-Point (h=3.2σ)',
      state: 'Tier 2 Escalated',
      privacy: 'Zero-Raw Vector Retention',
      badgeClass: 'core',
      summary: 'The deterministic 10-Agent processing pipeline performs continuous EWMA noise smoothing and two-sided CUSUM change-point statistical tests across all 3 sensor channels to detect true cognitive decline 6-8 months ahead of standard clinical screens.',
      vectors: [
        { label: 'Smoothing Weight (λ)', value: '0.20', status: 'optimal' },
        { label: 'CUSUM Decision Margin (h)', value: '3.0σ', status: 'optimal' },
        { label: 'Statistical Significance', value: 'p < 0.001', status: 'warning' },
        { label: 'Lead Time Advantage', value: '6–8 Months', status: 'high' }
      ],
      sparkline: [78, 77, 75, 73, 70, 68, 66, 62, 59]
    },
    neuroimaging: {
      id: 'neuroimaging',
      name: 'Tier 3 Neuroimaging',
      sub: 'ResNet-18 OASIS Volumetrics',
      domain: 'STRUCTURAL MORPHOMETRY',
      status: 'GATED ESCALATION TRIGGERED',
      activePill: 'CDR 0.5 · VBR 0.18',
      score: 'Gated',
      drift: '-4.1%',
      driftLabel: 'Hippocampal volume decrement',
      state: 'Tier 3 Protocol Active',
      privacy: 'DICOM De-identified (HIPAA)',
      badgeClass: 'warning',
      summary: 'Deep convolutional ResNet-18 volumetric neural network trained on the OASIS-3 cohort. Triggered only upon Tier 2 statistical escalation to assess hippocampal parenchymal fraction and ventricle-to-brain ratio with Grad-CAM visual heatmaps.',
      vectors: [
        { label: 'CDR Staging Prediction', value: 'CDR 0.5 (Very Mild)', status: 'drift' },
        { label: 'Hippocampal Volume', value: '3.42 cm³ (-4.1%)', status: 'drift' },
        { label: 'Ventricle-Brain Ratio', value: '0.18', status: 'warning' },
        { label: 'Grad-CAM Attention Area', value: 'Medial Temporal', status: 'optimal' }
      ],
      sparkline: [90, 89, 87, 85, 82, 79, 75, 73, 70]
    },
    medgemma: {
      id: 'medgemma',
      name: 'MedGemma Dossier',
      sub: '12-Section Clinical Synthesis',
      domain: 'CLINICAL SYNTHESIS',
      status: 'SYNTHESIS VERIFIED',
      activePill: '12 Sections · ICD-10 G31.84',
      score: '100%',
      drift: 'Actionable',
      driftLabel: 'Neurology consult recommended',
      state: 'Tier 2 Escalated',
      privacy: 'Differential Privacy (ε=0.5)',
      badgeClass: 'success',
      summary: 'Fine-tuned medical language model synthesizes multimodal biomarker evidence into an audit-ready 12-section clinical dossier with TreeSHAP feature attributions, ICD-10 billing code mappings, and verifiable citation chains.',
      vectors: [
        { label: 'Structured Sections', value: '12 of 12 Validated', status: 'optimal' },
        { label: 'Mapped ICD-10 Code', value: 'G31.84 (MCI)', status: 'optimal' },
        { label: 'Safety Guard Verification', value: 'Passed (p < 0.001)', status: 'optimal' },
        { label: 'Recommended Action', value: '30-Day Referral', status: 'warning' }
      ],
      sparkline: [70, 71, 71, 71, 72, 71, 71, 71, 71]
    }
  };

  // Smooth scroll with visual highlight for any target section
  const scrollToSection = (e, targetId) => {
    if (e) e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      const yOffset = -90; // offset for sticky pill header
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      el.classList.add('cv-highlight-pulse');
      setTimeout(() => el.classList.remove('cv-highlight-pulse'), 2200);
    }
  };

  // Web Audio Synthesizer for tactile physical micro-feedback (zero external assets)
  const playTone = (freq = 440, type = 'sine', duration = 0.15) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context silently ignored if blocked by browser autoplay policy
    }
  };

  // Floating Back to Top state
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 420);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── CARD 1: ACOUSTIC VOICE CADENCE DEMO ──
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voicePlaybackTick, setVoicePlaybackTick] = useState(0);
  const voiceTimerRef = useRef(null);

  const triggerVoiceCadenceSample = () => {
    if (isPlayingVoice) return;
    setIsPlayingVoice(true);
    setVoicePlaybackTick(1);

    // Play subtle harmonic melodic chime
    playTone(523.25, 'sine', 0.2); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.2), 200); // E5
    setTimeout(() => playTone(783.99, 'sine', 0.25), 400); // G5
    setTimeout(() => playTone(1046.50, 'sine', 0.35), 650); // C6

    let tickCount = 0;
    voiceTimerRef.current = setInterval(() => {
      tickCount += 1;
      setVoicePlaybackTick(tickCount);
      if (tickCount > 18) {
        clearInterval(voiceTimerRef.current);
        setIsPlayingVoice(false);
      }
    }, 160);
  };

  // ── CARD 2: INTERACTION KEYSTROKE TELEMETRY LIVE TEST ──
  const [keystrokeInput, setKeystrokeInput] = useState('');
  const [keystrokeFlightMs, setKeystrokeFlightMs] = useState(114);
  const [keystrokeWpm, setKeystrokeWpm] = useState(0);
  const [keystrokePulse, setKeystrokePulse] = useState(0);
  const lastKeyTimeRef = useRef(0);
  const typingStartRef = useRef(0);

  const handleKeystrokeInput = (e) => {
    const val = e.target.value;
    const now = Date.now();

    if (!typingStartRef.current) {
      typingStartRef.current = now;
    }

    if (lastKeyTimeRef.current > 0) {
      const delta = now - lastKeyTimeRef.current;
      if (delta > 30 && delta < 800) {
        setKeystrokeFlightMs(delta);
      }
    }
    lastKeyTimeRef.current = now;
    setKeystrokePulse((prev) => (prev + 1) % 4);
    setKeystrokeInput(val);

    const elapsedMinutes = (now - typingStartRef.current) / 60000;
    if (elapsedMinutes > 0.02) {
      const words = val.trim().split(/\s+/).filter(Boolean).length;
      setKeystrokeWpm(Math.round(words / elapsedMinutes));
    }
    playTone(320 + (val.length % 6) * 35, 'triangle', 0.04);
  };

  const handleResetKeystroke = () => {
    setKeystrokeInput('');
    setKeystrokeFlightMs(114);
    setKeystrokeWpm(0);
    lastKeyTimeRef.current = 0;
    typingStartRef.current = 0;
  };

  // ── CARD 3: ACTIVE PSYCHOMETRICS STROOP TEST ──
  const stroopQuestions = [
    { word: 'GREEN', ink: '#3b82f6', colorName: 'Blue', options: ['Blue', 'Green', 'Red'] },
    { word: 'RED', ink: '#10b981', colorName: 'Green', options: ['Red', 'Green', 'Amber'] },
    { word: 'YELLOW', ink: '#ef4444', colorName: 'Red', options: ['Yellow', 'Red', 'Blue'] },
    { word: 'PURPLE', ink: '#eab308', colorName: 'Amber', options: ['Purple', 'Amber', 'Green'] },
  ];
  const [stroopIndex, setStroopIndex] = useState(0);
  const [stroopStartTime, setStroopStartTime] = useState(Date.now());
  const [stroopFeedback, setStroopFeedback] = useState(null);

  const handleStroopChoice = (chosenColor) => {
    const currentQ = stroopQuestions[stroopIndex];
    const latency = Date.now() - stroopStartTime;
    const isCorrect = chosenColor === currentQ.colorName;

    if (isCorrect) {
      playTone(580, 'sine', 0.12);
      setStroopFeedback({
        correct: true,
        text: `Inhibition resolved in ${latency}ms! Frontal response conflict inhibited smoothly.`
      });
    } else {
      playTone(220, 'square', 0.15);
      setStroopFeedback({
        correct: false,
        text: `Conflict caught! Stroop interference latency demonstrated. Ink was ${currentQ.colorName}.`
      });
    }
  };

  const nextStroopQuestion = () => {
    setStroopFeedback(null);
    setStroopIndex((prev) => (prev + 1) % stroopQuestions.length);
    setStroopStartTime(Date.now());
  };

  // ── CARD 4: TIER 3 NEUROIMAGING ATROPHY COMPARISON ──
  const [mriCohortMode, setMriCohortMode] = useState('healthy'); // 'healthy' | 'atrophy'

  // ── SECTION 2: LONGITUDINAL TRAJECTORY POINT SELECTION ──
  const [selectedTrajectoryNode, setSelectedTrajectoryNode] = useState('detected');
  const trajectoryPointsData = {
    m8: {
      id: 'm8',
      month: 'Month -8',
      label: 'Baseline Calibration',
      score: '76.4',
      cusum: '0.3σ',
      leadTime: '8.2 Mo Window',
      status: 'Tier 1 Nominal',
      badgeClass: 'optimal',
      desc: 'Multimodal personal baseline established across everyday keystrokes and audio journals. Variance within 95% individual confidence interval.'
    },
    m6: {
      id: 'm6',
      month: 'Month -6',
      label: 'Homeostasis Maintained',
      score: '75.8',
      cusum: '0.8σ',
      leadTime: '7.8 Mo Window',
      status: 'Tier 1 Nominal',
      badgeClass: 'optimal',
      desc: 'No persistent deviation. Daily keystroke dwell times remain centered at 82ms with zero backspace error bursts.'
    },
    m4: {
      id: 'm4',
      month: 'Month -4',
      label: 'Micro-Drift Inception',
      score: '74.1',
      cusum: '1.7σ',
      leadTime: '7.1 Mo Window',
      status: 'Sub-Clinical Hesitation',
      badgeClass: 'info',
      desc: 'Inter-key flight times lengthen subtly (+14ms) during multi-syllable word transitions. MMSE remains 30/30 (undetected in routine screens).'
    },
    m2: {
      id: 'm2',
      month: 'Month -2',
      label: 'Drift Coherence',
      score: '72.9',
      cusum: '2.4σ',
      leadTime: '6.9 Mo Window',
      status: 'Accumulator Accelerating',
      badgeClass: 'warning',
      desc: 'Speech pause-to-vocalization ratio rises to 18.4%. CUSUM sequential statistic accelerates towards formal decision boundary.'
    },
    detected: {
      id: 'detected',
      month: 'Detection Point',
      label: '🚨 Change-Point Confirmed',
      score: '71.2',
      cusum: '3.2σ > 3.0σ (Breached)',
      leadTime: '6–8 Mo Lead Time Gained',
      status: 'Tier 2 Escalation Triggered',
      badgeClass: 'alert',
      desc: 'Two-sided sequential CUSUM crosses critical margin (h=3.0σ, p<0.001). Care team alerted 6–8 months ahead of standard clinical MMSE/MoCA drops.'
    },
    current: {
      id: 'current',
      month: 'Current Follow-up',
      label: 'Longitudinal Stabilization',
      score: '71.2',
      cusum: '3.1σ (Halted)',
      leadTime: 'Lead Time Preserved',
      status: 'Targeted Care Plan Active',
      badgeClass: 'success',
      desc: 'Targeted sleep architecture hygiene and cognitive remediation initiated. Biomarker slope stabilized with zero further decline.'
    }
  };

  // ── SECTION 3: TREESHAP THERAPEUTIC SIMULATION ──
  const [isSimulatingIntervention, setIsSimulatingIntervention] = useState(false);

  // ── IN-BROWSER REACTION AGILITY TEST STATE ──
  const [challengeState, setChallengeState] = useState('idle');
  const [challengeStartTime, setChallengeStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(null);
  const [challengeWarning, setChallengeWarning] = useState(null);
  const [stimulusWord, setStimulusWord] = useState({ text: 'EMERALD', color: '#3d5236' });
  const timerRef = useRef(null);

  const startChallenge = () => {
    setChallengeState('waiting');
    setReactionTime(null);
    setChallengeWarning(null);
    playTone(440, 'sine', 0.1);
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
      playTone(880, 'sine', 0.12); // High cue tone
    }, delay);
  };

  const handleChallengeClick = () => {
    if (challengeState === 'waiting') {
      clearTimeout(timerRef.current);
      setChallengeState('idle');
      playTone(220, 'square', 0.2);
      setChallengeWarning('⚠️ Too early! Wait for the stimulus pad to flash green.');
      setTimeout(() => setChallengeWarning(null), 3000);
    } else if (challengeState === 'ready') {
      const elapsed = Date.now() - challengeStartTime;
      setReactionTime(elapsed);
      setChallengeState('result');
      playTone(660, 'sine', 0.2);
    }
  };

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

  // TreeSHAP Scenarios (dynamically altered by isSimulatingIntervention)
  const shapScenarios = {
    sleep: isSimulatingIntervention ? {
      id: 'sleep',
      label: 'Sleep architecture restored (>7.5 hrs/night)',
      shap: '+0.04',
      rawVal: 0.04,
      type: 'INTERVENTION BENEFIT',
      color: '#34d399',
      impact: 'Stabilizes glymphatic clearance and resolves daytime cognitive fatigue',
      note: 'Restorative slow-wave sleep restores hippocampal memory consolidation and eliminates neuromuscular morning hesitation.'
    } : {
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
      shap: isSimulatingIntervention ? '+0.08' : '+0.16',
      rawVal: isSimulatingIntervention ? 0.08 : 0.16,
      type: 'MODIFIABLE VASCULAR',
      color: '#e09f3e',
      impact: 'Increases microvascular cerebral resistance',
      note: 'Elevated systolic pressure correlates with sub-second executive hesitation and neuromotor slowing.'
    },
    exercise: isSimulatingIntervention ? {
      id: 'exercise',
      label: 'Aerobic conditioning + resistance (180 min/wk)',
      shap: '-0.33',
      rawVal: -0.33,
      type: 'HIGH PROTECTIVE BUFFER',
      color: '#34d399',
      impact: 'Maximizes hippocampal BDNF neurotrophic release',
      note: 'Cardiovascular fitness directly enhances microvascular brain perfusion and anchors longitudinal neuromotor speed.'
    } : {
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

  // ── CATEGORIZED FAQ ITEMS ──
  const [faqCategory, setFaqCategory] = useState('all');
  const faqItems = [
    {
      category: 'science',
      categoryLabel: 'Clinical Science',
      q: 'How does CogniVeil detect cognitive drift before symptoms trigger a clinical visit?',
      a: 'CogniVeil measures sub-clinical deviations in neuromuscular keystroke speed, inter-key latency, pause-to-speech ratios, and active memory micro-tasks. By applying exponentially weighted moving averages (EWMA) and CUSUM change-point algorithms against a patient’s personal baseline, it flags statistically meaningful drift 6–8 months before traditional clinical observation.'
    },
    {
      category: 'privacy',
      categoryLabel: 'Privacy Enclave',
      q: 'What patient data is captured and how is privacy preserved?',
      a: 'CogniVeil is designed with zero-compromise differential privacy. It never logs keystroke characters or records raw speech audio. Only derived numerical timing features (e.g. dwell time, cadence, pitch jitter) are processed locally, ensuring full HIPAA and ISO/DIS 13485 compliance.'
    },
    {
      category: 'clinical',
      categoryLabel: 'Diagnostic Cascade',
      q: 'When does the diagnostic cascade escalate to Tier 2 or Tier 3?',
      a: 'Escalation is strictly evidence-governed. Tier 1 continuous passive monitoring runs continuously. If a patient’s personal baseline exhibits persistent negative statistical drift for over 14 days, Tier 2 targeted multidimensional assessments are triggered. Only when Tier 2 multimodal risk remains elevated is a Tier 3 structural neuroimaging review recommended.'
    },
    {
      category: 'governance',
      categoryLabel: 'Regulatory & AI',
      q: 'How are the 10 AI agents verified to prevent hallucinations?',
      a: 'CogniVeil employs a deterministic 10-agent pipeline where each agent executes a discrete, audit-logged clinical function with strict JSON output schemas. The final MedGemma synthesis agent is constrained by deterministic safety regex filters and calibrated against OASIS and ADNI clinical benchmarks.'
    },
    {
      category: 'clinical',
      categoryLabel: 'Clinical Scope',
      q: 'Does CogniVeil provide a definitive medical diagnosis?',
      a: 'No. CogniVeil is an authorized clinical decision-support and surveillance tool. It is engineered to buy care teams critical lead time, generate quantitative evidence dossiers, and support qualified neurologists in early intervention.'
    }
  ];

  const filteredFaqItems = faqCategory === 'all' 
    ? faqItems 
    : faqItems.filter(item => item.category === faqCategory);

  return (
    <div className={`cv-landing ${isDark ? 'cv-theme-dark' : 'cv-theme-light'}`}>
      
      {/* ── CLINICAL INTRO SPLASH ANIMATION ── */}
      <IntroSplash
        isOpen={showIntro}
        onClose={() => setShowIntro(false)}
        onComplete={handleIntroComplete}
      />

      {/* ── MODERN FLOATING PILL NAVBAR ── */}
      <header className="cv-floating-nav-wrapper">
        <nav className="cv-pill-nav">
          <div className="cv-pill-brand" onClick={() => navigate('/')}>
            <span className="cv-pill-mark">C</span>
            <span className="cv-pill-brand-text">CogniVeil</span>
            <span className="cv-pill-status-dot" />
          </div>

          <div className="cv-pill-links">
            <button className="cv-pill-link-btn" onClick={(e) => scrollToSection(e, 'topology')}>Architecture</button>
            <button className="cv-pill-link-btn" onClick={(e) => scrollToSection(e, 'vectors')}>Biomarkers</button>
            <button className="cv-pill-link-btn" onClick={(e) => scrollToSection(e, 'pipeline')}>Multi-Agent</button>
            <button className="cv-pill-link-btn" onClick={(e) => scrollToSection(e, 'attribution')}>TreeSHAP</button>
            <button className="cv-pill-link-btn" onClick={(e) => scrollToSection(e, 'faq')}>Governance</button>
          </div>

          <div className="cv-pill-actions">
            <button className="cv-pill-theme-btn" onClick={toggleTheme} title="Toggle theme">
              {isDark ? 'LIGHT' : 'DARK'}
            </button>
            <Link to="/login" className="cv-pill-signin">
              Sign In
            </Link>
            <button className="cv-pill-cta-btn" onClick={() => navigate('/login')}>
              Workstation →
            </button>
          </div>
        </nav>
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
            <button className="cv-hero-secondary-btn" onClick={(e) => scrollToSection(e, 'challenge')}>
              Run reaction agility test
            </button>
          </div>

          {/* ── HERO DIAGNOSTIC PIPELINE TOPOLOGY GRAPH SHOWCASE ── */}
          <div id="topology" className="cv-hero-topology-card">
            
            {/* Top Bar of Topology Card */}
            <div className="cv-topology-bar">
              <div className="cv-topology-status-group">
                <div className="cv-status-pulse-wrapper">
                  <span className={`cv-status-pulse-ring ${isTopologyStreaming ? 'active' : ''}`} />
                  <span className="cv-status-indicator active" />
                </div>
                <div className="cv-topology-status-text">
                  <span className="cv-topology-heading">EVIDENCE TOPOLOGY GRAPH: MULTI-CHANNEL ACTIVE INFERENCE</span>
                  <span className="cv-topology-subheading">
                    {selectedTopologyNode === 'all' ? 'All Channels Synchronized' : `${topologyData[selectedTopologyNode]?.name} Stream Selected`}
                  </span>
                </div>
              </div>

              {/* Channel Filter & Stream Controls */}
              <div className="cv-topology-controls">
                <div className="cv-channel-filter-pills">
                  <button 
                    className={`cv-filter-pill ${selectedTopologyNode === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedTopologyNode('all')}
                  >
                    All Channels
                  </button>
                  <button 
                    className={`cv-filter-pill ${selectedTopologyNode === 'speech' ? 'active' : ''}`}
                    onClick={() => setSelectedTopologyNode('speech')}
                  >
                    Speech
                  </button>
                  <button 
                    className={`cv-filter-pill ${selectedTopologyNode === 'keystroke' ? 'active' : ''}`}
                    onClick={() => setSelectedTopologyNode('keystroke')}
                  >
                    Keystroke
                  </button>
                  <button 
                    className={`cv-filter-pill ${selectedTopologyNode === 'psychometrics' ? 'active' : ''}`}
                    onClick={() => setSelectedTopologyNode('psychometrics')}
                  >
                    Psychometrics
                  </button>
                  <button 
                    className={`cv-filter-pill ${selectedTopologyNode === 'neuroimaging' ? 'active' : ''}`}
                    onClick={() => setSelectedTopologyNode('neuroimaging')}
                  >
                    Neuroimaging
                  </button>
                  <button 
                    className={`cv-filter-pill ${selectedTopologyNode === 'medgemma' ? 'active' : ''}`}
                    onClick={() => setSelectedTopologyNode('medgemma')}
                  >
                    MedGemma
                  </button>
                </div>

                <div className="cv-topology-meta-actions">
                  <button 
                    className={`cv-stream-toggle-btn ${isTopologyStreaming ? 'streaming' : ''}`}
                    onClick={() => setIsTopologyStreaming(!isTopologyStreaming)}
                    title={isTopologyStreaming ? 'Pause live stream simulation' : 'Resume live stream simulation'}
                  >
                    <span className="cv-stream-dot" />
                    {isTopologyStreaming ? 'LIVE 120Hz' : 'PAUSED'}
                  </button>
                  <div className="cv-topology-leadtime-badge">
                    <span>LEAD TIME GAINED: </span>
                    <strong>6–8 MONTHS</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual SVG Network DAG Graph Stage */}
            <div className="cv-topology-network-stage">
              <svg className="cv-topology-svg" viewBox="0 0 960 320" fill="none">
                <defs>
                  <linearGradient id="cvEdgeActiveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="50%" stopColor="#5eead4" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                  <filter id="cvGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Base Structural Edge Tracks */}
                <path d="M 270 52 C 305 52, 305 160, 340 160" className="cv-svg-track" />
                <path d="M 270 160 C 305 160, 305 160, 340 160" className="cv-svg-track" />
                <path d="M 270 268 C 305 268, 305 160, 340 160" className="cv-svg-track" />
                <path d="M 620 160 C 655 160, 655 100, 690 100" className="cv-svg-track" />
                <path d="M 620 160 C 655 160, 655 220, 690 220" className="cv-svg-track" />

                {/* Active Dynamic Energy Streams */}
                <path 
                  d="M 270 52 C 305 52, 305 160, 340 160" 
                  className={`cv-svg-edge ${(selectedTopologyNode === 'speech' || selectedTopologyNode === 'all') ? 'active' : ''}`} 
                />
                <path 
                  d="M 270 160 C 305 160, 305 160, 340 160" 
                  className={`cv-svg-edge ${(selectedTopologyNode === 'keystroke' || selectedTopologyNode === 'all') ? 'active' : ''}`} 
                />
                <path 
                  d="M 270 268 C 305 268, 305 160, 340 160" 
                  className={`cv-svg-edge ${(selectedTopologyNode === 'psychometrics' || selectedTopologyNode === 'all') ? 'active' : ''}`} 
                />
                <path 
                  d="M 620 160 C 655 160, 655 100, 690 100" 
                  className={`cv-svg-edge ${(selectedTopologyNode === 'neuroimaging' || selectedTopologyNode === 'all') ? 'active' : ''}`} 
                />
                <path 
                  d="M 620 160 C 655 160, 655 220, 690 220" 
                  className={`cv-svg-edge ${(selectedTopologyNode === 'medgemma' || selectedTopologyNode === 'all') ? 'active' : ''}`} 
                />

                {/* Animated Streaming Pulse Beads */}
                {isTopologyStreaming && (
                  <>
                    <circle r="4" fill="#34d399" filter="url(#cvGlowFilter)" opacity="0.9">
                      <animateMotion 
                        path={
                          selectedTopologyNode === 'speech' ? "M 270 52 C 305 52, 305 160, 340 160" :
                          selectedTopologyNode === 'psychometrics' ? "M 270 268 C 305 268, 305 160, 340 160" :
                          "M 270 160 C 305 160, 305 160, 340 160"
                        }
                        dur="1.8s" 
                        repeatCount="indefinite" 
                      />
                    </circle>
                    <circle r="4" fill="#34d399" filter="url(#cvGlowFilter)" opacity="0.9">
                      <animateMotion 
                        path={
                          selectedTopologyNode === 'neuroimaging' ? "M 620 160 C 655 160, 655 100, 690 100" :
                          "M 620 160 C 655 160, 655 220, 690 220"
                        }
                        dur="1.8s" 
                        repeatCount="indefinite" 
                      />
                    </circle>
                  </>
                )}
              </svg>

              <div className="cv-network-grid">
                
                {/* Column 1: Tier 1 Multimodal Sensor Nodes */}
                <div className="cv-net-col col-inputs">
                  
                  {/* Node 1: Speech Acoustics */}
                  <div 
                    className={`cv-net-node sensor-node ${selectedTopologyNode === 'speech' ? 'active' : ''}`}
                    onClick={() => setSelectedTopologyNode('speech')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="cv-node-icon-wrap">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" y1="19" x2="12" y2="23"/>
                        <line x1="8" y1="23" x2="16" y2="23"/>
                      </svg>
                    </div>
                    <div className="cv-node-content">
                      <div className="cv-node-header">
                        <span className="cv-node-name">Speech Acoustics</span>
                        <span className="cv-node-tag-pill">16 kHz</span>
                      </div>
                      <div className="cv-node-sub">Whisper Jitter & Pause</div>
                      <div className="cv-node-metrics-bar">
                        <span className="cv-node-metric-dot" />
                        <span>0.82ms Jitter · SNR 28dB</span>
                      </div>
                    </div>
                    <span className={`cv-node-pip ${selectedTopologyNode === 'speech' || selectedTopologyNode === 'all' ? 'active' : ''}`} />
                  </div>

                  {/* Node 2: Keystroke Dynamics */}
                  <div 
                    className={`cv-net-node sensor-node ${selectedTopologyNode === 'keystroke' ? 'active' : ''}`}
                    onClick={() => setSelectedTopologyNode('keystroke')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="cv-node-icon-wrap">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <line x1="6" y1="8" x2="6" y2="8" />
                        <line x1="10" y1="8" x2="10" y2="8" />
                        <line x1="14" y1="8" x2="14" y2="8" />
                        <line x1="18" y1="8" x2="18" y2="8" />
                        <line x1="6" y1="12" x2="6" y2="12" />
                        <line x1="18" y1="12" x2="18" y2="12" />
                        <line x1="7" y1="16" x2="17" y2="16" />
                      </svg>
                    </div>
                    <div className="cv-node-content">
                      <div className="cv-node-header">
                        <span className="cv-node-name">Keystroke Dynamics</span>
                        <span className="cv-node-tag-pill highlight">DRIFT</span>
                      </div>
                      <div className="cv-node-sub">Sub-ms Inter-Key Latency</div>
                      <div className="cv-node-metrics-bar">
                        <span className="cv-node-metric-dot active" />
                        <span>114ms Flight · 99.2% Reg</span>
                      </div>
                    </div>
                    <span className={`cv-node-pip ${selectedTopologyNode === 'keystroke' || selectedTopologyNode === 'all' ? 'active' : ''}`} />
                  </div>

                  {/* Node 3: Active Psychometrics */}
                  <div 
                    className={`cv-net-node sensor-node ${selectedTopologyNode === 'psychometrics' ? 'active' : ''}`}
                    onClick={() => setSelectedTopologyNode('psychometrics')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="cv-node-icon-wrap">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    </div>
                    <div className="cv-node-content">
                      <div className="cv-node-header">
                        <span className="cv-node-name">Active Psychometrics</span>
                        <span className="cv-node-tag-pill">60 Hz</span>
                      </div>
                      <div className="cv-node-sub">Stroop Inhibition Battery</div>
                      <div className="cv-node-metrics-bar">
                        <span className="cv-node-metric-dot" />
                        <span>288ms Stroop · Δ 4.1%</span>
                      </div>
                    </div>
                    <span className={`cv-node-pip ${selectedTopologyNode === 'psychometrics' || selectedTopologyNode === 'all' ? 'active' : ''}`} />
                  </div>

                </div>

                {/* Column 2: Central Core 10-Agent Engine Hub */}
                <div className="cv-net-col col-hub">
                  <div 
                    className={`cv-hub-node ${selectedTopologyNode === 'hub' ? 'active' : ''}`}
                    onClick={() => setSelectedTopologyNode('hub')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="cv-hub-inner">
                      <div className="cv-hub-badge-strip">
                        <span className="cv-hub-badge">CORE MULTI-AGENT ENGINE</span>
                        <span className="cv-hub-live-badge">99.4% FUSION CONF</span>
                      </div>

                      <div className="cv-hub-title">10-Agent EWMA & CUSUM Fusion</div>
                      
                      {/* Mini 10-Agent Synchronized Status Matrix */}
                      <div className="cv-hub-agents-strip">
                        {['DQA', 'SPA', 'KDA', 'PSA', 'EWM', 'CSM', 'NIA', 'SFG', 'SHP', 'MDG'].map((agent, i) => (
                          <span 
                            key={agent} 
                            className={`cv-mini-agent-pip ${(i === 2 && selectedTopologyNode === 'keystroke') || (i === 1 && selectedTopologyNode === 'speech') || (i === 3 && selectedTopologyNode === 'psychometrics') || (i === 6 && selectedTopologyNode === 'neuroimaging') || (i === 9 && selectedTopologyNode === 'medgemma') ? 'highlight' : ''}`}
                            title={`Agent ${i + 1}: ${agent}`}
                          >
                            {agent}
                          </span>
                        ))}
                      </div>

                      <div className="cv-hub-params">
                        <span>λ = 0.20</span>
                        <span className="cv-param-divider">·</span>
                        <span>h = 3.0σ</span>
                        <span className="cv-param-divider">·</span>
                        <span>p &lt; 0.001</span>
                      </div>

                      <div className="cv-hub-cta-sub">
                        <span>Click to inspect active inference matrix →</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Tier Escalation & Dossier Nodes */}
                <div className="cv-net-col col-outputs">
                  
                  {/* Node 4: Tier 3 Neuroimaging */}
                  <div 
                    className={`cv-net-node decision-node ${selectedTopologyNode === 'neuroimaging' ? 'active' : ''}`}
                    onClick={() => setSelectedTopologyNode('neuroimaging')}
                    role="button"
                    tabIndex={0}
                  >
                    <span className={`cv-node-pip-left ${selectedTopologyNode === 'neuroimaging' || selectedTopologyNode === 'all' ? 'active' : ''}`} />
                    <div className="cv-node-icon-wrap">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a9 9 0 0 0-9 9c0 3.5 2 6.5 5 8v3h8v-3c3-1.5 5-4.5 5-8a9 9 0 0 0-9-9z"/>
                        <path d="M9 10a3 3 0 0 1 6 0"/>
                      </svg>
                    </div>
                    <div className="cv-node-content">
                      <div className="cv-node-header">
                        <span className="cv-node-name">Tier 3 Neuroimaging</span>
                        <span className="cv-node-tag-pill conditional">GATED</span>
                      </div>
                      <div className="cv-node-sub">ResNet-18 OASIS Volumetrics</div>
                      <div className="cv-node-metrics-bar">
                        <span className="cv-node-metric-dot active" />
                        <span>CDR 0.5 · VBR 0.18</span>
                      </div>
                    </div>
                  </div>

                  {/* Node 5: MedGemma Dossier */}
                  <div 
                    className={`cv-net-node decision-node ${selectedTopologyNode === 'medgemma' ? 'active' : ''}`}
                    onClick={() => setSelectedTopologyNode('medgemma')}
                    role="button"
                    tabIndex={0}
                  >
                    <span className={`cv-node-pip-left ${selectedTopologyNode === 'medgemma' || selectedTopologyNode === 'all' ? 'active' : ''}`} />
                    <div className="cv-node-icon-wrap">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                    </div>
                    <div className="cv-node-content">
                      <div className="cv-node-header">
                        <span className="cv-node-name">MedGemma Dossier</span>
                        <span className="cv-node-tag-pill verified">AUDITED</span>
                      </div>
                      <div className="cv-node-sub">12-Section Clinical Synthesis</div>
                      <div className="cv-node-metrics-bar">
                        <span className="cv-node-metric-dot active" />
                        <span>12 Sections · ICD-10 G31.84</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Precision Telemetry Monitors */}
            <div className="cv-topology-telemetry">
              
              <div className="cv-telem-item">
                <div className="cv-telem-top">
                  <span className="cv-telem-label">CALIBRATED COGNISCORE</span>
                  <span className="cv-telem-badge">BASELINE: 74.6</span>
                </div>
                <div className="cv-telem-val">
                  {selectedTopologyNode === 'all' ? '71.2' : topologyData[selectedTopologyNode]?.score || '71.2'} 
                  <small>/ 100</small>
                </div>
                {/* Mini Risk Gauge Bar */}
                <div className="cv-gauge-container">
                  <div className="cv-gauge-bar">
                    <span className="cv-gauge-segment normal" title="Normal: 80-100" />
                    <span className="cv-gauge-segment warning active-zone" title="Mild Drift: 65-79" />
                    <span className="cv-gauge-segment alert" title="Tier 2 Escalation: <65" />
                  </div>
                  <div className="cv-gauge-pointer" style={{ left: '71.2%' }} />
                </div>
                <div className="cv-telem-sub">Delta: -3.4 vs 6-mo rolling baseline</div>
              </div>

              <div className="cv-telem-item">
                <div className="cv-telem-top">
                  <span className="cv-telem-label">LONGITUDINAL DRIFT</span>
                  <span className="cv-telem-badge alert">CUSUM h=3.2σ</span>
                </div>
                <div className="cv-telem-val highlight">
                  {selectedTopologyNode === 'all' ? '-8.4% drift' : topologyData[selectedTopologyNode]?.drift || '-8.4%'}
                </div>
                {/* Mini Inline Sparkline Curve */}
                <div className="cv-telem-sparkline-wrap">
                  <svg viewBox="0 0 160 26" className="cv-telem-sparkline">
                    <line x1="0" y1="14" x2="160" y2="14" stroke="currentColor" strokeDasharray="3 3" opacity="0.3" />
                    <path
                      d="M 5,6 L 28,7 L 55,9 L 85,13 L 115,18 L 140,22 L 155,23"
                      fill="none"
                      stroke="#f87171"
                      strokeWidth="2.2"
                    />
                    <circle cx="155" cy="23" r="3" fill="#f87171" />
                  </svg>
                </div>
                <div className="cv-telem-sub">{selectedTopologyNode === 'all' ? 'Two-sided CUSUM threshold exceeded' : topologyData[selectedTopologyNode]?.driftLabel}</div>
              </div>

              <div className="cv-telem-item">
                <div className="cv-telem-top">
                  <span className="cv-telem-label">DIAGNOSTIC STATE</span>
                  <span className="cv-telem-badge gated">AUTOMATED GATE</span>
                </div>
                <div className="cv-telem-val">
                  {selectedTopologyNode === 'all' ? 'Tier 2 Escalated' : topologyData[selectedTopologyNode]?.state}
                </div>
                <div className="cv-telem-pill-status">
                  <span className="cv-status-dot-pulse" />
                  <span>Conditional Tier 3 MRI Protocol Active</span>
                </div>
                <div className="cv-telem-sub">Gated access unlocked via calibrated criteria</div>
              </div>

              <div className="cv-telem-item">
                <div className="cv-telem-top">
                  <span className="cv-telem-label">PRIVACY ASSURANCE</span>
                  <span className="cv-telem-badge privacy">VERIFIED</span>
                </div>
                <div className="cv-telem-val">
                  {selectedTopologyNode === 'all' ? 'Zero-Raw Retention' : topologyData[selectedTopologyNode]?.privacy}
                </div>
                <div className="cv-telem-crypto-digest">
                  <code>SHA-256: 0x8F4A2C...E7B1</code>
                </div>
                <div className="cv-telem-sub">Local edge enclave · No keystroke/audio storage</div>
              </div>

            </div>

            {/* Interactive Biomarker Inspection Console (Expanded Telemetry Drawer) */}
            <div className="cv-topology-inspection-drawer">
              <div className="cv-drawer-header">
                <div className="cv-drawer-title-group">
                  <span className="cv-drawer-kicker">LIVE BIOMARKER SIGNAL CONSOLE</span>
                  <h4 className="cv-drawer-title">
                    {selectedTopologyNode === 'all' 
                      ? 'Multi-Channel Synchronized Fusion Stream' 
                      : `${topologyData[selectedTopologyNode]?.name} — Clinical Vector Inspection`}
                  </h4>
                </div>
                <div className="cv-drawer-tags">
                  <span className="cv-drawer-tag">{selectedTopologyNode === 'all' ? '10 AGENTS' : topologyData[selectedTopologyNode]?.domain}</span>
                  <span className="cv-drawer-tag status">{selectedTopologyNode === 'all' ? 'SYNCHRONIZED' : topologyData[selectedTopologyNode]?.status}</span>
                </div>
              </div>

              <div className="cv-drawer-body">
                {/* Left Panel: Signal Visualizer */}
                <div className="cv-drawer-viz-panel">
                  <div className="cv-viz-header">
                    <span>REAL-TIME STREAM TELEMETRY</span>
                    <span className="cv-viz-rate">120 Hz SAMPLING</span>
                  </div>

                  {/* Dynamic Visualizer based on selected node */}
                  {selectedTopologyNode === 'speech' && (
                    <div className="cv-viz-content acoustic">
                      <div className="cv-equalizer-bars">
                        {[35, 60, 45, 80, 55, 90, 70, 40, 65, 85, 50, 75, 60, 40, 30].map((h, i) => (
                          <div 
                            key={i} 
                            className="cv-eq-bar" 
                            style={{ 
                              height: `${Math.min(100, h + ((telemetryTick + i * 3) % 25))}%`,
                              animationDelay: `${i * 0.08}s` 
                            }} 
                          />
                        ))}
                      </div>
                      <div className="cv-viz-caption">Whisper Neural Spectrogram: Fundamental F0 Voice Tremor Stability</div>
                    </div>
                  )}

                  {selectedTopologyNode === 'keystroke' && (
                    <div className="cv-viz-content motor">
                      <div className="cv-histogram-bars">
                        {[
                          { label: '<80ms', height: 25 },
                          { label: '100ms', height: 45 },
                          { label: '114ms', height: 95, highlight: true },
                          { label: '140ms', height: 60 },
                          { label: '180ms', height: 35 },
                          { label: '220ms', height: 50, warning: true },
                          { label: '>300ms', height: 20 }
                        ].map((b, i) => (
                          <div key={i} className="cv-hist-col">
                            <div 
                              className={`cv-hist-bar ${b.highlight ? 'peak' : ''} ${b.warning ? 'warning' : ''}`} 
                              style={{ height: `${b.height}%` }}
                            />
                            <span className="cv-hist-label">{b.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="cv-viz-caption">Inter-Key Flight Latency Distribution: Noticeable Secondary Hesitation Peak at 220ms</div>
                    </div>
                  )}

                  {selectedTopologyNode === 'psychometrics' && (
                    <div className="cv-viz-content stroop">
                      <div className="cv-stroop-comparison">
                        <div className="cv-stroop-row">
                          <span className="cv-stroop-label">Congruent Baseline</span>
                          <div className="cv-stroop-bar-track">
                            <div className="cv-stroop-bar baseline" style={{ width: '58%' }}>284 ms</div>
                          </div>
                        </div>
                        <div className="cv-stroop-row">
                          <span className="cv-stroop-label">Conflict Incongruent</span>
                          <div className="cv-stroop-bar-track">
                            <div className="cv-stroop-bar conflict" style={{ width: '88%' }}>426 ms (+142 ms)</div>
                          </div>
                        </div>
                      </div>
                      <div className="cv-viz-caption">Stroop Interference Delay: Frontal Response Conflict Latency vs Age-Matched Normals</div>
                    </div>
                  )}

                  {selectedTopologyNode === 'neuroimaging' && (
                    <div className="cv-viz-content imaging">
                      <div className="cv-imaging-metrics-grid">
                        <div className="cv-img-metric">
                          <span className="cv-img-label">Hippocampal Volume</span>
                          <span className="cv-img-val">3.42 cm³</span>
                          <span className="cv-img-delta alert">-4.1% vs ADNI Norm</span>
                        </div>
                        <div className="cv-img-metric">
                          <span className="cv-img-label">Ventricle-Brain Ratio</span>
                          <span className="cv-img-val">0.18</span>
                          <span className="cv-img-delta warning">Mild Enlargement</span>
                        </div>
                        <div className="cv-img-metric">
                          <span className="cv-img-label">ResNet-18 CDR Score</span>
                          <span className="cv-img-val">0.50</span>
                          <span className="cv-img-delta">Very Mild Cognitive Impairment</span>
                        </div>
                      </div>
                      <div className="cv-viz-caption">OASIS-3 Trained Deep Volumetrics: Gated Triggered by Tier 2 Keystroke & Speech Drift</div>
                    </div>
                  )}

                  {selectedTopologyNode === 'medgemma' && (
                    <div className="cv-viz-content dossier">
                      <div className="cv-dossier-preview-box">
                        <div className="cv-dossier-header-line">
                          <span>SECTION 04: LONGITUDINAL TRAJECTORY SYNTHESIS</span>
                          <span>MEDGEMMA-27B CLINICAL</span>
                        </div>
                        <p className="cv-dossier-text">
                          "Patient exhibits statistically significant downward drift across neuromuscular cadence (-8.4%) and active inhibition response latency (+142 ms, p &lt; 0.001). EWMA trajectory confirms multi-modal coherence. Structural imaging corroborates mild hippocampal volume decrement. Recommending formal neurology consultation under ICD-10 G31.84."
                        </p>
                      </div>
                      <div className="cv-viz-caption">Deterministic Clinical Synthesis: 12-Section Dossier with Auditable Evidence Chains</div>
                    </div>
                  )}

                  {selectedTopologyNode === 'hub' && (
                    <div className="cv-viz-content hub">
                      <div className="cv-hub-waterfall">
                        <div className="cv-waterfall-step">
                          <span className="cv-wf-num">01</span>
                          <span className="cv-wf-agent">DataQualityAgent</span>
                          <span className="cv-wf-status pass">SNR 28.4 dB (Pass)</span>
                        </div>
                        <div className="cv-waterfall-step">
                          <span className="cv-wf-num">02</span>
                          <span className="cv-wf-agent">SpeechAcousticsAgent</span>
                          <span className="cv-wf-status pass">0.82ms Jitter (Nominal)</span>
                        </div>
                        <div className="cv-waterfall-step">
                          <span className="cv-wf-num">03</span>
                          <span className="cv-wf-agent">KeystrokeDynamicsAgent</span>
                          <span className="cv-wf-status flag">114ms Flight (Drift -8.4%)</span>
                        </div>
                        <div className="cv-waterfall-step">
                          <span className="cv-wf-num">05</span>
                          <span className="cv-wf-agent">EWMA & CUSUM Engine</span>
                          <span className="cv-wf-status escalate">h = 3.2σ &gt; 3.0σ (Escalate Tier 2)</span>
                        </div>
                      </div>
                      <div className="cv-viz-caption">Deterministic Multi-Agent Execution Pipeline: Zero-Hallucination Sequential Verification</div>
                    </div>
                  )}

                  {selectedTopologyNode === 'all' && (
                    <div className="cv-viz-content all">
                      <div className="cv-all-channels-stream">
                        <div className="cv-stream-row">
                          <span className="cv-sr-name">Speech (16 kHz)</span>
                          <div className="cv-mini-wave">
                            <span style={{ width: '60%' }} />
                          </div>
                          <span className="cv-sr-val">SNR 28.4 dB</span>
                        </div>
                        <div className="cv-stream-row">
                          <span className="cv-sr-name">Keystroke (1 kHz)</span>
                          <div className="cv-mini-wave alert">
                            <span style={{ width: '85%' }} />
                          </div>
                          <span className="cv-sr-val alert">-8.4% Drift</span>
                        </div>
                        <div className="cv-stream-row">
                          <span className="cv-sr-name">Psychometrics (60 Hz)</span>
                          <div className="cv-mini-wave">
                            <span style={{ width: '70%' }} />
                          </div>
                          <span className="cv-sr-val">288 ms Stroop</span>
                        </div>
                      </div>
                      <div className="cv-viz-caption">Simultaneous Multi-Modal Ingestion: Aggregated into Unified Longitudinal CogniScore</div>
                    </div>
                  )}
                </div>

                {/* Right Panel: Clinical Vector Specifications */}
                <div className="cv-drawer-specs-panel">
                  <div className="cv-specs-title">CALIBRATED CLINICAL VECTORS</div>
                  <div className="cv-specs-list">
                    {(selectedTopologyNode === 'all' ? topologyData.keystroke.vectors : topologyData[selectedTopologyNode]?.vectors || []).map((v, i) => (
                      <div key={i} className="cv-spec-row">
                        <div className="cv-spec-name-group">
                          <span className="cv-spec-name">{v.label}</span>
                          <span className={`cv-spec-status-pill ${v.status}`}>{v.status.toUpperCase()}</span>
                        </div>
                        <span className="cv-spec-value">{v.value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="cv-specs-narrative">
                    {selectedTopologyNode === 'all' 
                      ? 'Continuous passive telemetry across daily keystrokes and voice cadences flags sub-perceptual motor deceleration months before MMSE or MoCA scores drop.'
                      : topologyData[selectedTopologyNode]?.summary}
                  </p>

                  <div className="cv-specs-action-wrap">
                    <button className="cv-drawer-cta-btn" onClick={() => navigate('/login')}>
                      Launch Workstation with this Stream →
                    </button>
                  </div>
                </div>
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
            
            {/* ── CARD 1: ACOUSTIC SPEECH BIOMARKERS ── */}
            <div className="cv-card-4">
              <div className="cv-card-top">
                <span className="cv-card-tag">ACOUSTIC DOMAIN</span>
                <span className="cv-card-metric">WPM Cadence · Pause Rate · Lexical Richness</span>
              </div>
              <h3 className="cv-card-title">Acoustic Speech Biomarkers</h3>
              <p className="cv-card-desc">
                Whisper neural acoustic feature extraction across 7 vernacular languages. Analyzes pause-to-speech ratios and articulation latency with zero raw audio storage.
              </p>

              {/* Interactive Voice Cadence Visualizer & Sample Player */}
              <div className="cv-card-interactive-box voice-box">
                <div className="cv-interactive-top">
                  <span className="cv-int-label">ACOUSTIC CADENCE SIMULATOR</span>
                  <span className="cv-int-pill">{isPlayingVoice ? '16 kHz STREAMING' : 'AUDIO BUFFER READY'}</span>
                </div>

                <div className="cv-voice-waveform-strip">
                  {[28, 55, 42, 75, 60, 92, 68, 48, 80, 65, 38, 58].map((h, i) => (
                    <div 
                      key={i} 
                      className={`cv-voice-bar ${isPlayingVoice ? 'animating' : ''}`}
                      style={{ 
                        height: isPlayingVoice 
                          ? `${Math.min(100, Math.max(20, h + ((voicePlaybackTick * 7 + i * 9) % 50)))}%` 
                          : `${h}%`,
                        animationDelay: `${i * 0.06}s`
                      }} 
                    />
                  ))}
                </div>

                <div className="cv-voice-actions-row">
                  <button 
                    className={`cv-voice-play-btn ${isPlayingVoice ? 'playing' : ''}`}
                    onClick={triggerVoiceCadenceSample}
                    disabled={isPlayingVoice}
                  >
                    {isPlayingVoice ? '▶ Analyzing Cadence...' : '▶ Listen to 3s Cadence Sample'}
                  </button>

                  <div className="cv-voice-metrics-mini">
                    <span><strong>124</strong> WPM</span>
                    <span>·</span>
                    <span><strong>18.2%</strong> Pause</span>
                    <span>·</span>
                    <span><strong>0.81ms</strong> Jitter</span>
                  </div>
                </div>

                <div className="cv-voice-crypto-notice">
                  <span>🔒 Privacy Enclave: Zero raw audio persisted · Mathematical acoustic vectors only</span>
                </div>
              </div>

              <div className="cv-card-specs">
                <span className="cv-spec-pill">7 vernacular dialects</span>
                <span className="cv-spec-pill">Sub-second pause tracking</span>
                <span className="cv-spec-pill">Zero raw audio retention</span>
              </div>
            </div>

            {/* ── CARD 2: INTERACTION KEYSTROKE TELEMETRY ── */}
            <div className="cv-card-4">
              <div className="cv-card-top">
                <span className="cv-card-tag">MOTOR BEHAVIOR</span>
                <span className="cv-card-metric">Inter-Key Latency · Backspace Rate · Scroll Hesitation</span>
              </div>
              <h3 className="cv-card-title">Interaction Keystroke Telemetry</h3>
              <p className="cv-card-desc">
                Sub-millisecond passive timing measurement during natural daily typing. Evaluates neuromuscular hesitation and burst patterns with complete privacy preservation.
              </p>

              {/* Interactive Neuromotor Typing Cadence Sandbox */}
              <div className="cv-card-interactive-box typing-box">
                <div className="cv-interactive-top">
                  <span className="cv-int-label">LIVE KEYSTROKE CADENCE TEST</span>
                  <div className="cv-keystroke-pulse-dots">
                    {[0, 1, 2, 3].map((dot) => (
                      <span 
                        key={dot} 
                        className={`cv-k-dot ${keystrokePulse === dot ? 'active' : ''}`} 
                      />
                    ))}
                  </div>
                </div>

                <div className="cv-typing-input-wrap">
                  <input
                    type="text"
                    className="cv-typing-input"
                    value={keystrokeInput}
                    onChange={handleKeystrokeInput}
                    placeholder="Type here to test your neuromuscular flight speed live..."
                    aria-label="Interactive keystroke latency input"
                  />
                  {keystrokeInput && (
                    <button 
                      className="cv-typing-clear-btn" 
                      onClick={handleResetKeystroke}
                      title="Clear test"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="cv-typing-telemetry-row">
                  <div className="cv-tt-item">
                    <span className="cv-tt-label">INTER-KEY FLIGHT</span>
                    <span className="cv-tt-val">{keystrokeFlightMs} <small>ms</small></span>
                  </div>
                  <div className="cv-tt-item">
                    <span className="cv-tt-label">SPEED</span>
                    <span className="cv-tt-val">{keystrokeWpm || 64} <small>WPM</small></span>
                  </div>
                  <div className="cv-tt-item">
                    <span className="cv-tt-label">RHYTHM STABILITY</span>
                    <span className="cv-tt-val">99.4%</span>
                  </div>
                </div>

                <div className="cv-typing-status-pill">
                  {keystrokeFlightMs <= 145 ? (
                    <span className="optimal">✨ Optimal neuromuscular initiation (&lt;145ms) · Uniform typing cadence</span>
                  ) : (
                    <span className="drift">⚠️ Micro-hesitation latency detected ({keystrokeFlightMs}ms) · EWMA smoothing active</span>
                  )}
                </div>
              </div>

              <div className="cv-card-specs">
                <span className="cv-spec-pill">Sub-ms precision</span>
                <span className="cv-spec-pill">Zero-keylog privacy</span>
                <span className="cv-spec-pill">EWMA smoothed baseline</span>
              </div>
            </div>

            {/* ── CARD 3: ACTIVE PSYCHOMETRICS MICRO-TASKS ── */}
            <div className="cv-card-4">
              <div className="cv-card-top">
                <span className="cv-card-tag">COGNITIVE DOMAIN</span>
                <span className="cv-card-metric">Delayed Recall · Stroop Inhibition · Reaction Speed</span>
              </div>
              <h3 className="cv-card-title">Active Psychometrics Micro-Tasks</h3>
              <p className="cv-card-desc">
                3-minute daily micro-battery decomposing episodic retrieval, visual-spatial attention, and working memory into isolated validated subdomains.
              </p>

              {/* Interactive Mini Stroop Color-Word Conflict Chip */}
              <div className="cv-card-interactive-box stroop-box">
                <div className="cv-interactive-top">
                  <span className="cv-int-label">MINI STROOP CONFLICT RESOLUTION</span>
                  <span className="cv-int-pill">FRONTAL INHIBITION</span>
                </div>

                <div className="cv-stroop-stage">
                  <div className="cv-stroop-prompt-line">
                    Select the <strong>INK COLOR</strong> (ignore the written word):
                  </div>

                  <div 
                    className="cv-stroop-word-display"
                    style={{ color: stroopQuestions[stroopIndex].ink }}
                  >
                    {stroopQuestions[stroopIndex].word}
                  </div>

                  <div className="cv-stroop-btn-grid">
                    {stroopQuestions[stroopIndex].options.map((opt) => (
                      <button
                        key={opt}
                        className="cv-stroop-choice-btn"
                        onClick={() => handleStroopChoice(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {stroopFeedback && (
                    <div className={`cv-stroop-feedback-badge ${stroopFeedback.correct ? 'pass' : 'fail'}`}>
                      <span>{stroopFeedback.text}</span>
                      <button className="cv-stroop-next-btn" onClick={nextStroopQuestion}>
                        Next Word →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="cv-card-specs">
                <span className="cv-spec-pill">Standardized digit span</span>
                <span className="cv-spec-pill">Color Stroop inhibition</span>
                <span className="cv-spec-pill">Reaction decay curve</span>
              </div>
            </div>

            {/* ── CARD 4: STRUCTURAL NEUROIMAGING (TIER 3) ── */}
            <div className="cv-card-4">
              <div className="cv-card-top">
                <span className="cv-card-tag">VOLUMETRIC MORPHOMETRY</span>
                <span className="cv-card-metric">ResNet-18 CDR Staging · Morphometry (BPF/VBR) · Grad-CAM</span>
              </div>
              <h3 className="cv-card-title">Structural Neuroimaging (Tier 3)</h3>
              <p className="cv-card-desc">
                Gated conditional evaluation triggered strictly when Tier 2 risk is elevated. Identifies hippocampal volume loss and ventricular enlargement with explainable heatmaps.
              </p>

              {/* Interactive Structural Morphometry Comparison Box */}
              <div className="cv-card-interactive-box mri-box">
                <div className="cv-interactive-top">
                  <span className="cv-int-label">OASIS-3 VOLUMETRIC COMPARISON</span>
                  <div className="cv-mri-toggle-group">
                    <button
                      className={`cv-mri-mode-btn ${mriCohortMode === 'healthy' ? 'active' : ''}`}
                      onClick={() => setMriCohortMode('healthy')}
                    >
                      ADNI Control
                    </button>
                    <button
                      className={`cv-mri-mode-btn ${mriCohortMode === 'atrophy' ? 'active' : ''}`}
                      onClick={() => setMriCohortMode('atrophy')}
                    >
                      Temporal Atrophy (-4.1%)
                    </button>
                  </div>
                </div>

                <div className="cv-mri-metrics-display">
                  <div className="cv-mri-stat-card">
                    <span className="cv-mri-stat-label">HIPPOCAMPAL VOLUME</span>
                    <span className={`cv-mri-stat-val ${mriCohortMode === 'atrophy' ? 'alert' : ''}`}>
                      {mriCohortMode === 'healthy' ? '3.58 cm³' : '3.42 cm³'}
                    </span>
                    <span className="cv-mri-stat-sub">
                      {mriCohortMode === 'healthy' ? 'Normative 50th percentile' : '-4.1% bilateral volume drop'}
                    </span>
                  </div>

                  <div className="cv-mri-stat-card">
                    <span className="cv-mri-stat-label">VENTRICLE-BRAIN RATIO</span>
                    <span className={`cv-mri-stat-val ${mriCohortMode === 'atrophy' ? 'warning' : ''}`}>
                      {mriCohortMode === 'healthy' ? '0.14' : '0.18'}
                    </span>
                    <span className="cv-mri-stat-sub">
                      {mriCohortMode === 'healthy' ? 'Normal ventricular size' : 'Mild ventricular expansion'}
                    </span>
                  </div>

                  <div className="cv-mri-stat-card">
                    <span className="cv-mri-stat-label">RESNET-18 STAGING</span>
                    <span className="cv-mri-stat-val">
                      {mriCohortMode === 'healthy' ? 'CDR 0.0' : 'CDR 0.5'}
                    </span>
                    <span className="cv-mri-stat-sub">
                      {mriCohortMode === 'healthy' ? 'Healthy Cognition' : 'Very Mild Cognitive Impairment'}
                    </span>
                  </div>
                </div>

                <div className="cv-mri-gradcam-status">
                  <span className="cv-gradcam-dot" />
                  <span>
                    {mriCohortMode === 'healthy' 
                      ? 'Grad-CAM Attention: Uniform diffuse parenchymal focus' 
                      : 'Grad-CAM Attention: Focused medial temporal hippocampal atrophy'}
                  </span>
                </div>
              </div>

              <div className="cv-card-specs">
                <span className="cv-spec-pill">ResNet-18 architecture</span>
                <span className="cv-spec-pill">BPF/VBR volumetrics</span>
                <span className="cv-spec-pill">Grad-CAM attention maps</span>
              </div>
            </div>

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

                      {/* Interactive Graph Nodes along Trajectory */}
                      <g className="cv-svg-interactive-nodes">
                        {/* Node M-8 */}
                        {selectedTrajectoryNode === 'm8' && (
                          <circle cx="60" cy="45" r="9" fill="none" stroke="#34d399" strokeWidth="1.5" className="cv-pulse-halo" />
                        )}
                        <circle 
                          cx="60" cy="45" r={selectedTrajectoryNode === 'm8' ? 6 : 4.5} 
                          fill={selectedTrajectoryNode === 'm8' ? '#34d399' : '#f1f5ee'} 
                          stroke="#3d5236" strokeWidth="2" 
                          className="cv-chart-node-clickable"
                          onClick={() => { setSelectedTrajectoryNode('m8'); playTone(400, 'sine', 0.08); }}
                        >
                          <title>Month -8: Baseline Calibration</title>
                        </circle>

                        {/* Node M-6 */}
                        {selectedTrajectoryNode === 'm6' && (
                          <circle cx="140" cy="50" r="9" fill="none" stroke="#34d399" strokeWidth="1.5" className="cv-pulse-halo" />
                        )}
                        <circle 
                          cx="140" cy="50" r={selectedTrajectoryNode === 'm6' ? 6 : 4.5} 
                          fill={selectedTrajectoryNode === 'm6' ? '#34d399' : '#f1f5ee'} 
                          stroke="#3d5236" strokeWidth="2" 
                          className="cv-chart-node-clickable"
                          onClick={() => { setSelectedTrajectoryNode('m6'); playTone(460, 'sine', 0.08); }}
                        >
                          <title>Month -6: Homeostasis Maintained</title>
                        </circle>

                        {/* Node M-4 */}
                        {selectedTrajectoryNode === 'm4' && (
                          <circle cx="220" cy="62" r="9" fill="none" stroke="#eab308" strokeWidth="1.5" className="cv-pulse-halo" />
                        )}
                        <circle 
                          cx="220" cy="62" r={selectedTrajectoryNode === 'm4' ? 6 : 4.5} 
                          fill={selectedTrajectoryNode === 'm4' ? '#eab308' : '#f1f5ee'} 
                          stroke="#3d5236" strokeWidth="2" 
                          className="cv-chart-node-clickable"
                          onClick={() => { setSelectedTrajectoryNode('m4'); playTone(520, 'sine', 0.08); }}
                        >
                          <title>Month -4: Micro-Drift Inception</title>
                        </circle>

                        {/* Node M-2 */}
                        {selectedTrajectoryNode === 'm2' && (
                          <circle cx="340" cy="105" r="9" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="cv-pulse-halo" />
                        )}
                        <circle 
                          cx="340" cy="105" r={selectedTrajectoryNode === 'm2' ? 6 : 4.5} 
                          fill={selectedTrajectoryNode === 'm2' ? '#f59e0b' : '#f1f5ee'} 
                          stroke="#3d5236" strokeWidth="2" 
                          className="cv-chart-node-clickable"
                          onClick={() => { setSelectedTrajectoryNode('m2'); playTone(580, 'sine', 0.08); }}
                        >
                          <title>Month -2: Drift Coherence</title>
                        </circle>
                        
                        {/* Critical Deviation Change-Point Node (Detected) */}
                        {selectedTrajectoryNode === 'detected' && (
                          <circle cx="440" cy="152" r="12" fill="none" stroke="#f87171" strokeWidth="1.8" className="cv-pulse-halo" />
                        )}
                        <circle 
                          cx="440" cy="152" r={selectedTrajectoryNode === 'detected' ? 8.5 : 7} 
                          fill="#f87171" stroke="#ffffff" strokeWidth="2" 
                          className="cv-chart-node-clickable"
                          onClick={() => { setSelectedTrajectoryNode('detected'); playTone(660, 'sine', 0.08); }}
                        >
                          <title>Detected: Change-Point Confirmed (h=3.2σ)</title>
                        </circle>

                        {/* Node Current */}
                        {selectedTrajectoryNode === 'current' && (
                          <circle cx="500" cy="168" r="9" fill="none" stroke="#34d399" strokeWidth="1.5" className="cv-pulse-halo" />
                        )}
                        <circle 
                          cx="500" cy="168" r={selectedTrajectoryNode === 'current' ? 6.5 : 5} 
                          fill={selectedTrajectoryNode === 'current' ? '#34d399' : '#f87171'} 
                          stroke="#ffffff" strokeWidth="1.5"
                          className="cv-chart-node-clickable"
                          onClick={() => { setSelectedTrajectoryNode('current'); playTone(740, 'sine', 0.08); }}
                        >
                          <title>Current: Longitudinal Stabilization</title>
                        </circle>
                      </g>

                      {/* Change Point Callout */}
                      <rect x="330" y="165" width="180" height="34" rx="6" fill="#1b261a" stroke="#f87171" strokeWidth="1.2" />
                      <text x="340" y="180" fill="#f1f5ee" fontSize="10" fontWeight="bold" fontFamily="'Mulish', sans-serif">DRIFT FLAGGED</text>
                      <text x="340" y="193" fill="#cbd5e1" fontSize="9" fontFamily="'JetBrains Mono', monospace">6–8 Mo Lead Time Window</text>

                      {/* X-Axis Clickable Labels */}
                      <text x="60" y="200" fill={selectedTrajectoryNode === 'm8' ? '#34d399' : 'currentColor'} fillOpacity={selectedTrajectoryNode === 'm8' ? 1 : 0.6} fontSize="10" fontWeight={selectedTrajectoryNode === 'm8' ? 'bold' : 'normal'} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" className="cv-axis-label" onClick={() => setSelectedTrajectoryNode('m8')}>M-8</text>
                      <text x="140" y="200" fill={selectedTrajectoryNode === 'm6' ? '#34d399' : 'currentColor'} fillOpacity={selectedTrajectoryNode === 'm6' ? 1 : 0.6} fontSize="10" fontWeight={selectedTrajectoryNode === 'm6' ? 'bold' : 'normal'} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" className="cv-axis-label" onClick={() => setSelectedTrajectoryNode('m6')}>M-6</text>
                      <text x="220" y="200" fill={selectedTrajectoryNode === 'm4' ? '#eab308' : 'currentColor'} fillOpacity={selectedTrajectoryNode === 'm4' ? 1 : 0.6} fontSize="10" fontWeight={selectedTrajectoryNode === 'm4' ? 'bold' : 'normal'} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" className="cv-axis-label" onClick={() => setSelectedTrajectoryNode('m4')}>M-4</text>
                      <text x="340" y="200" fill={selectedTrajectoryNode === 'm2' ? '#f59e0b' : 'currentColor'} fillOpacity={selectedTrajectoryNode === 'm2' ? 1 : 0.6} fontSize="10" fontWeight={selectedTrajectoryNode === 'm2' ? 'bold' : 'normal'} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" className="cv-axis-label" onClick={() => setSelectedTrajectoryNode('m2')}>M-2</text>
                      <text x="440" y="200" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" className="cv-axis-label" onClick={() => setSelectedTrajectoryNode('detected')}>Detected</text>
                      <text x="500" y="200" fill={selectedTrajectoryNode === 'current' ? '#34d399' : 'currentColor'} fillOpacity={selectedTrajectoryNode === 'current' ? 1 : 0.6} fontSize="10" fontWeight={selectedTrajectoryNode === 'current' ? 'bold' : 'normal'} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" className="cv-axis-label" onClick={() => setSelectedTrajectoryNode('current')}>Current</text>
                    </svg>
                  </div>

                  {/* Interactive Trajectory Point Telemetry Pill */}
                  <div className="cv-trajectory-inspector">
                    <div className="cv-ti-top">
                      <div className="cv-ti-title-wrap">
                        <span className="cv-ti-month">{trajectoryPointsData[selectedTrajectoryNode]?.month}:</span>
                        <strong className="cv-ti-label">{trajectoryPointsData[selectedTrajectoryNode]?.label}</strong>
                      </div>
                      <div className="cv-ti-badges">
                        <span className="cv-ti-badge score">CogniScore: <strong>{trajectoryPointsData[selectedTrajectoryNode]?.score}</strong></span>
                        <span className="cv-ti-badge cusum">CUSUM: <strong>{trajectoryPointsData[selectedTrajectoryNode]?.cusum}</strong></span>
                        <span className="cv-ti-badge lead">{trajectoryPointsData[selectedTrajectoryNode]?.leadTime}</span>
                      </div>
                    </div>
                    <p className="cv-ti-desc">{trajectoryPointsData[selectedTrajectoryNode]?.desc}</p>
                    <div className="cv-ti-timeline-bar">
                      <span className="cv-ti-timeline-hint">Click any milestone along the 8-month curve:</span>
                      <div className="cv-ti-pills">
                        {['m8', 'm6', 'm4', 'm2', 'detected', 'current'].map((k) => (
                          <button
                            key={k}
                            className={`cv-ti-pill ${selectedTrajectoryNode === k ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedTrajectoryNode(k);
                              playTone(420 + (['m8', 'm6', 'm4', 'm2', 'detected', 'current'].indexOf(k)) * 60, 'sine', 0.08);
                            }}
                          >
                            {k === 'detected' ? '🚨 Detected' : k.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
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
                <div className="cv-shap-header-actions">
                  <button
                    className={`cv-shap-simulate-btn ${isSimulatingIntervention ? 'active' : ''}`}
                    onClick={() => {
                      setIsSimulatingIntervention(!isSimulatingIntervention);
                      playTone(isSimulatingIntervention ? 440 : 660, 'sine', 0.12);
                    }}
                  >
                    <span className="cv-sim-icon">⚡</span>
                    <span>{isSimulatingIntervention ? 'Simulating Lifestyle Intervention' : 'Simulate Lifestyle Intervention'}</span>
                  </button>
                  <span className="cv-wide-status">24-FEATURE CASCADE</span>
                </div>
              </div>

              {/* Interactive SHAP Factor Nodes Graph */}
              <div className="cv-shap-network-box">
                {isSimulatingIntervention && (
                  <div className="cv-shap-simulation-banner">
                    <span>Active Simulation: Targeted Sleep Hygiene (+2.5h) & Aerobic Conditioning</span>
                    <strong>-0.47 Net Risk Shift</strong>
                  </div>
                )}

                <div className="cv-shap-waterfall-header">
                  <span>CLINICAL BIOMARKER FACTOR</span>
                  <span>SHAP IMPACT DELTA</span>
                </div>

                <div className="cv-shap-factors-list">
                  {Object.keys(shapScenarios).map((key) => {
                    const sc = shapScenarios[key];
                    const isSelected = selectedShap === key;
                    const isPositive = sc.rawVal > 0;
                    const barWidth = Math.min(100, Math.abs(sc.rawVal) * 280);
                    return (
                      <div
                        key={key}
                        onClick={() => {
                          setSelectedShap(key);
                          playTone(500 + Object.keys(shapScenarios).indexOf(key) * 50, 'sine', 0.06);
                        }}
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
          <div className="cv-challenge-card">
            <div className="cv-challenge-info">
              <div className="cv-challenge-kicker-wrap">
                <span className="cv-challenge-kicker-dot" />
                <span className="cv-challenge-kicker">INTERACTIVE CLINICAL DEMO</span>
              </div>
              <h3 className="cv-challenge-title">Sub-Millisecond Psychomotor Agility Test</h3>
              <p className="cv-challenge-sub">
                Experience how CogniVeil's passive algorithms measure microscopic changes in neuromuscular reaction cadence. When you click start, wait for the stimulus pad to turn green, then click as fast as possible.
              </p>

              <div className="cv-challenge-clinical-context">
                <div className="cv-ctx-item">
                  <span className="cv-ctx-label">CLINICAL CORRELATION:</span>
                  <span className="cv-ctx-val">Frontal-subcortical motor initiation</span>
                </div>
                <div className="cv-ctx-item">
                  <span className="cv-ctx-label">HEALTHY BENCHMARK:</span>
                  <span className="cv-ctx-val">220 ms – 310 ms</span>
                </div>
              </div>
            </div>

            <div className="cv-challenge-interactive-stage">
              {challengeState === 'idle' && (
                <div className="cv-challenge-idle-state">
                  <div className="cv-idle-icon">
                    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <div className="cv-idle-title">Ready to Measure Reaction Cadence?</div>
                  <p className="cv-idle-sub">Calibrated to 1,000 Hz browser frame timing</p>
                  
                  {challengeWarning && (
                    <div className="cv-challenge-inline-warning">
                      {challengeWarning}
                    </div>
                  )}

                  <button className="cv-challenge-action-btn" onClick={startChallenge}>
                    Start Reaction Agility Test →
                  </button>
                </div>
              )}

              {challengeState === 'waiting' && (
                <div className="cv-challenge-stimulus waiting" onClick={handleChallengeClick}>
                  <div className="cv-stimulus-pulse-ring" />
                  <span className="cv-stimulus-icon-wait">⏳</span>
                  <span className="cv-stimulus-main-text">Hold Focus...</span>
                  <span className="cv-stimulus-hint">Click the instant this box flashes green</span>
                </div>
              )}

              {challengeState === 'ready' && (
                <div className="cv-challenge-stimulus ready" onClick={handleChallengeClick}>
                  <div className="cv-stimulus-flash-ring" />
                  <span className="cv-stimulus-icon-go">⚡</span>
                  <span className="cv-stimulus-main-text">CLICK NOW — {stimulusWord.text}</span>
                  <span className="cv-stimulus-hint">Measuring motor flight speed...</span>
                </div>
              )}

              {challengeState === 'result' && (
                <div className="cv-challenge-result-card">
                  <div className="cv-result-badge">ASSESSMENT RECORDED</div>
                  <div className="cv-result-ms">
                    {reactionTime} <span className="cv-unit">ms</span>
                  </div>
                  
                  {/* Percentile Rating Bar */}
                  <div className="cv-result-percentile-box">
                    <div className="cv-pct-track">
                      <div 
                        className="cv-pct-fill" 
                        style={{ 
                          width: `${Math.min(100, Math.max(10, 100 - (reactionTime - 180) * 0.35))}%` 
                        }} 
                      />
                    </div>
                    <div className="cv-pct-labels">
                      <span>400ms (Drift)</span>
                      <span>280ms (Normal)</span>
                      <span>200ms (Fast)</span>
                    </div>
                  </div>

                  <div className="cv-result-note">
                    {reactionTime < 260 && 'Superior psychomotor response — 95th percentile neuromuscular agility.'}
                    {reactionTime >= 260 && reactionTime <= 330 && 'Optimal reaction cadence — Consistent with healthy age-matched baseline.'}
                    {reactionTime > 330 && 'Mild hesitation latency observed — Within normal variance, continuous longitudinal tracking recommended.'}
                  </div>

                  <div className="cv-result-actions">
                    <button className="cv-challenge-retry-btn" onClick={startChallenge}>
                      ↺ Test Again
                    </button>
                    <button className="cv-challenge-portal-btn" onClick={() => navigate('/login')}>
                      Open Clinician Workstation →
                    </button>
                  </div>
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

            {/* Category Filter Pills */}
            <div className="cv-faq-category-pills">
              <button
                className={`cv-faq-cat-btn ${faqCategory === 'all' ? 'active' : ''}`}
                onClick={() => setFaqCategory('all')}
              >
                All Questions (5)
              </button>
              <button
                className={`cv-faq-cat-btn ${faqCategory === 'science' ? 'active' : ''}`}
                onClick={() => setFaqCategory('science')}
              >
                Clinical Science
              </button>
              <button
                className={`cv-faq-cat-btn ${faqCategory === 'privacy' ? 'active' : ''}`}
                onClick={() => setFaqCategory('privacy')}
              >
                Privacy Enclave
              </button>
              <button
                className={`cv-faq-cat-btn ${faqCategory === 'clinical' ? 'active' : ''}`}
                onClick={() => setFaqCategory('clinical')}
              >
                Diagnostic Cascade
              </button>
              <button
                className={`cv-faq-cat-btn ${faqCategory === 'governance' ? 'active' : ''}`}
                onClick={() => setFaqCategory('governance')}
              >
                Regulatory & AI
              </button>
            </div>
          </div>

          <div className="cv-faq-list">
            {filteredFaqItems.map((item, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className={`cv-faq-item ${isOpen ? 'open' : ''}`}>
                  <button 
                    className="cv-faq-question-btn"
                    onClick={() => {
                      setActiveFaq(isOpen ? null : idx);
                      playTone(isOpen ? 360 : 480, 'sine', 0.08);
                    }}
                  >
                    <div className="cv-faq-q-left">
                      <span className="cv-faq-cat-tag">{item.categoryLabel}</span>
                      <span className="cv-faq-q-text">{item.q}</span>
                    </div>
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

      {/* ── FLOATING BACK TO TOP BUTTON ── */}
      {showBackToTop && (
        <button 
          className="cv-floating-back-top"
          onClick={scrollToTop}
          title="Glide back to top"
          aria-label="Back to top"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
          <span>Top</span>
        </button>
      )}

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