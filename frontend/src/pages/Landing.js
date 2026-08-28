import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedShap, setSelectedShap] = useState('sleep');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const signalSources = [
    {
      title: 'Acoustic Speech',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#53B7C5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 11v2"></path>
        </svg>
      ),
      metrics: 'WPM Cadence · Pause Rate · Lexical Richness',
      desc: 'Conversational acoustic biomarkers analyzed across 7 vernacular languages with privacy-preserving feature extraction.'
    },
    {
      title: 'Interaction Telemetry',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#287C78" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="2"></circle>
          <circle cx="18" cy="18" r="2"></circle>
          <path d="m8 8 8 8M14 6h4v4M10 18H6v-4"></path>
        </svg>
      ),
      metrics: 'Inter-Key Latency · Backspace Rate · Scroll Hesitation',
      desc: 'Passive background timing measurement during everyday app usage. Keystroke content is never recorded or stored.'
    },
    {
      title: 'Active Psychometrics',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F4C4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          <path d="m9 14 2 2 4-4"></path>
        </svg>
      ),
      metrics: 'Delayed Recall · Stroop Inhibition · Reaction Speed',
      desc: '3-minute daily micro-battery decomposing episodic retrieval and visual-spatial executive control.'
    },
    {
      title: 'Neuroimaging (Conditional)',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#102A43" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"></path>
          <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="2 2"></line>
        </svg>
      ),
      metrics: 'ResNet-18 CDR Staging · Morphometry (BPF/VBR) · Grad-CAM',
      desc: 'Gated tier triggered only when Tier 2 risk is elevated. Identifies hippocampal atrophy and ventricular enlargement.'
    }
  ];

  const pipelineSteps = [
    { num: '01', name: 'DataQualityAgent', desc: 'Validates keystroke volume, SNR, and session duration thresholds.' },
    { num: '02', name: 'CognitiveTestAgent', desc: 'Decomposes active micro-task scores into Memory, Reaction, and Speed subdomains.' },
    { num: '03', name: 'BehaviorAnalysisAgent', desc: 'Computes explicit Typing and Scrolling sub-scores with non-diagnostic reasoning.' },
    { num: '04', name: 'VoiceAnalysisAgent', desc: 'Extracts acoustic biomarkers across 7 vernacular languages via Whisper.' },
    { num: '05', name: 'SignalFusionEngine', desc: 'Computes exact 60/20/20 weighted contributions and ranks primary delta drivers.' },
    { num: '06', name: 'LongitudinalTrendAgent', desc: 'Applies EWMA smoothing and CUSUM accumulation to detect persistent trajectory drift.' },
    { num: '07', name: 'RiskOrchestrator', desc: 'Governs conditional state-aware tier escalation (Tier 1 ──► 2 ──► 3).' },
    { num: '08', name: 'CatBoost + TreeSHAP', desc: 'Evaluates 24 clinical features with modifiable vs non-modifiable risk attributions.' },
    { num: '09', name: 'ResNet-18 + Grad-CAM', desc: 'Performs volumetric brain morphometry and visual attention localization.' },
    { num: '10', name: 'MedGemma + Safety', desc: 'Synthesizes grounded 12-section evidence dossier with deterministic regex guardrails.' },
  ];

  const shapScenarios = {
    sleep: {
      label: 'Poor Sleep Architecture (<5 hrs/night)',
      shap: '+0.28',
      type: 'Modifiable Factor',
      impact: 'Increases Risk',
      color: '#D97745',
      note: 'Sleep fragmentation directly accelerates neuro-motor and memory retrieval latency.'
    },
    exercise: {
      label: 'Regular Aerobic Conditioning (150 min/wk)',
      shap: '-0.19',
      type: 'Modifiable Factor',
      impact: 'Protective / Reduces Risk',
      color: '#2F7D5B',
      note: 'Cardiovascular fitness provides proven neuroprotective buffering against trajectory drift.'
    },
    apoe: {
      label: 'APOE-ε4 Carrier (Heterozygous)',
      shap: '+0.22',
      type: 'Non-Modifiable Factor',
      impact: 'Increases Baseline Risk',
      color: '#102A43',
      note: 'Genetic susceptibility factor evaluated strictly for baseline clinical context.'
    }
  };

  return (
    <div className="landing-page-root">
      {/* 72px Fixed Clinical Navigation Bar */}
      <header className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-container">
          <div className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="brand-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#53B7C5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"></path>
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"></path>
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-title">COGNIVEIL</span>
              <span className="brand-sub">Clinical Intelligence</span>
            </div>
          </div>

          <div className="landing-nav-actions">
            <button className="nav-btn-secondary" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button className="nav-btn-primary" onClick={() => navigate('/login')}>
              Start Screening →
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with Signature Waveform-Resolves-to-Data Motif */}
      <section className="landing-hero">
        <div className="landing-hero-container">
          <div className="hero-copy">
            <div className="hero-eyebrow">
              <span className="eyebrow-pill">CLINICAL DECISION SUPPORT</span>
              <span className="eyebrow-text">Deterministic Multimodal Screening</span>
            </div>

            <h1 className="hero-headline">
              Early cognitive change, <br />
              <span>caught in conversation.</span>
            </h1>

            <p className="hero-description">
              CogniVeil combines longitudinal behavioral telemetry, active psychometrics, acoustic speech biomarkers, and structural neuroimaging into an explainable clinical screening workflow. 
              <strong> Never a definitive diagnosis — always a defensible screening decision.</strong>
            </p>

            <div className="hero-cta-group">
              <button className="cta-primary" onClick={() => navigate('/login')}>
                Start Screening Session
              </button>
              <a href="#how-it-reasons" className="cta-secondary">
                See How It Reasons ↓
              </a>
            </div>

            <div className="hero-trust-bar">
              <div className="trust-item">
                <span className="trust-val cv-numeric">10</span>
                <span className="trust-lbl">Specialized Agents</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <span className="trust-val cv-numeric">3-Tier</span>
                <span className="trust-lbl">Gated Escalation</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <span className="trust-val cv-numeric">100%</span>
                <span className="trust-lbl">Provenance Grounded</span>
              </div>
            </div>
          </div>

          {/* Right Visual: Signature Waveform Resolving to Clean Number */}
          <div className="hero-visual-card">
            <div className="waveform-container">
              <div className="waveform-header">
                <span className="cv-ai-tag"><span className="cv-ai-dot" /> SIGNAL ACQUISITION</span>
                <span className="signal-status">Sampling Live Dynamics</span>
              </div>

              {/* Waveform Animation SVG */}
              <svg className="waveform-svg" viewBox="0 0 340 100" preserveAspectRatio="none">
                <path 
                  className="noisy-waveform" 
                  d="M0,50 Q15,10 30,65 T60,20 T90,80 T120,30 T150,70 T180,40 T210,60 T240,48 T270,52 T300,50 L340,50" 
                />
                <path 
                  className="resolved-line" 
                  d="M0,50 L180,50 L240,50 L340,50" 
                />
              </svg>

              {/* Resolved Data Metric Card */}
              <div className="resolved-metric-card">
                <div className="metric-header">
                  <span className="metric-title">CALIBRATED COGNISCORE</span>
                  <span className="metric-badge">ELEVATED CONCERN</span>
                </div>
                <div className="metric-row">
                  <span className="metric-big-num cv-numeric">71.2</span>
                  <span className="metric-unit">/ 100</span>
                  <span className="metric-delta">↓ 8.4% from personal baseline</span>
                </div>
                <div className="metric-breakdown">
                  <span>Memory: ↓16.2%</span>
                  <span>Typing: ↓20.6%</span>
                  <span>Pause: ↑42.0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Signal Sources Strip */}
      <section className="landing-section bg-surface">
        <div className="section-container">
          <div className="section-header-center">
            <span className="section-eyebrow">MULTIMODAL TELEMETRY</span>
            <h2 className="section-title">Cognitive decline rarely appears as a single number.</h2>
            <p className="section-subtitle">
              CogniVeil captures fine-grained digital biomarkers across four independent observational channels to construct a complete longitudinal picture.
            </p>
          </div>

          <div className="signal-sources-grid">
            {signalSources.map((s, idx) => (
              <div key={idx} className="signal-card">
                <div className="signal-icon">{s.icon}</div>
                <h3 className="signal-title">{s.title}</h3>
                <div className="signal-metrics cv-numeric">{s.metrics}</div>
                <p className="signal-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: How It Reasons (10-Step Deterministic Pipeline) */}
      <section id="how-it-reasons" className="landing-section">
        <div className="section-container">
          <div className="section-header-center">
            <span className="section-eyebrow">DETERMINISTIC AGENT PIPELINE</span>
            <h2 className="section-title">How CogniVeil Reasons Over Evidence</h2>
            <p className="section-subtitle">
              Every screening session executes a fixed, verifiable sequence of specialized agent tools — no black-box hallucinations.
            </p>
          </div>

          {/* 10-Step Stepper Bar */}
          <div className="pipeline-stepper-bar">
            {pipelineSteps.map((step, idx) => (
              <button
                key={idx}
                className={`pipeline-step-btn ${activeStep === idx ? 'active' : ''}`}
                onClick={() => setActiveStep(idx)}
              >
                <span className="step-num cv-numeric">{step.num}</span>
                <span className="step-name">{step.name.replace('Agent', '')}</span>
              </button>
            ))}
          </div>

          {/* Active Step Details Box */}
          <div className="pipeline-step-detail-card">
            <div className="step-detail-header">
              <span className="step-detail-badge cv-numeric">STEP {pipelineSteps[activeStep].num} OF 10</span>
              <h3 className="step-detail-title">{pipelineSteps[activeStep].name}</h3>
            </div>
            <p className="step-detail-desc">{pipelineSteps[activeStep].desc}</p>
            <div className="step-meta-row">
              <span>Deterministic Rule Execution</span>
              <span>•</span>
              <span>Provenance Metadata Logged</span>
              <span>•</span>
              <span>Safety Guardrail Certified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Three-Tier Branch Gating (Show the true branches, not flat 3-up) */}
      <section className="landing-section bg-surface">
        <div className="section-container">
          <div className="section-header-center">
            <span className="section-eyebrow">STATE-AWARE GATING</span>
            <h2 className="section-title">Escalates Only When Evidence Warrants</h2>
            <p className="section-subtitle">
              CogniVeil prevents unnecessary alarm by enforcing strict conditional gates before triggering clinical questionnaires or neuroimaging.
            </p>
          </div>

          <div className="gated-flow-wrapper">
            <div className="gate-card tier1-card">
              <div className="gate-tag">TIER 1: DAILY SCREENING</div>
              <h4>Active Battery + Keystroke Dynamics + Voice Acoustics</h4>
              <p>Continuous daily interaction establishes a personal calibrated baseline envelope.</p>
            </div>

            <div className="gate-connector">
              <div className="gate-line" />
              <div className="gate-decision-badge">EWMA & CUSUM Drift Check</div>
            </div>

            <div className="gate-split-row">
              <div className="gate-branch no-escalation">
                <span className="branch-status">✓ No Persistent Drift</span>
                <h5>Routine Baseline Monitoring</h5>
                <p>Remains at Tier 1. Zero alarm or unnecessary clinical burden.</p>
              </div>

              <div className="gate-branch escalation">
                <span className="branch-status">⚠️ Persistent Drift Confirmed</span>
                <h5>Tier 2: Multivariate Clinical ML</h5>
                <p>Triggers CatBoost 24-feature health & sleep questionnaire with TreeSHAP attributions.</p>
              </div>
            </div>

            <div className="gate-connector">
              <div className="gate-line" />
              <div className="gate-decision-badge">Multivariate Risk &gt; 65%</div>
            </div>

            <div className="gate-card tier3-card">
              <div className="gate-tag">TIER 3: STRUCTURAL NEUROIMAGING</div>
              <h4>ResNet-18 CDR Staging + Morphometry + Grad-CAM</h4>
              <p>Clinical structural MRI scan evaluated for hippocampal volume loss and ventricular enlargement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Live SHAP Explainability Demo */}
      <section className="landing-section">
        <div className="section-container">
          <div className="section-header-center">
            <span className="section-eyebrow">TRANSPARENT EXPLAINABILITY</span>
            <h2 className="section-title">This is not a black box.</h2>
            <p className="section-subtitle">
              Every recommendation decomposes into quantifiable modifiable lifestyle targets and non-modifiable clinical factors.
            </p>
          </div>

          <div className="shap-demo-card">
            <div className="shap-scenario-selector">
              {Object.keys(shapScenarios).map((k) => (
                <button
                  key={k}
                  className={`shap-tab-btn ${selectedShap === k ? 'active' : ''}`}
                  onClick={() => setSelectedShap(k)}
                >
                  {shapScenarios[k].label}
                </button>
              ))}
            </div>

            <div className="shap-result-box">
              <div className="shap-stat-row">
                <div>
                  <span className="shap-type">{shapScenarios[selectedShap].type}</span>
                  <h4 className="shap-label">{shapScenarios[selectedShap].label}</h4>
                </div>
                <div className="shap-num-box">
                  <span className="shap-val cv-numeric" style={{ color: shapScenarios[selectedShap].color }}>
                    {shapScenarios[selectedShap].shap}
                  </span>
                  <span className="shap-impact">{shapScenarios[selectedShap].impact}</span>
                </div>
              </div>
              <p className="shap-note">{shapScenarios[selectedShap].note}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Prominent Non-Diagnostic Medical Disclaimer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="disclaimer-banner">
            <h4 className="disclaimer-title">IMPORTANT MEDICAL DISCLAIMER</h4>
            <p className="disclaimer-text">
              CogniVeil is a digital clinical decision-support screening platform and does <strong>NOT</strong> provide a definitive medical diagnosis of Alzheimer's disease, dementia, or Mild Cognitive Impairment (MCI). 
              All calculated risk scores and synthesized reports are intended to assist healthcare professionals and must be interpreted in conjunction with comprehensive clinical examination, patient medical history, and formal laboratory evaluations.
            </p>
          </div>

          <div className="footer-bottom-row">
            <span className="footer-copy">© 2026 CogniVeil Clinical Intelligence Platform. All rights reserved.</span>
            <div className="footer-links">
              <span onClick={() => navigate('/consent')}>Informed Consent & Privacy</span>
              <span>•</span>
              <span onClick={() => navigate('/login')}>Clinician Portal</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;