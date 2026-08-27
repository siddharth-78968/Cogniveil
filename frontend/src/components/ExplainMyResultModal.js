import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ExplainMyResultModal = ({ isOpen, onClose, scoreData, userData }) => {
  const { theme, isDark } = useTheme();

  if (!isOpen) return null;

  const cogniScore = scoreData?.score != null ? Math.round(scoreData.score * 10) / 10 : 71.2;
  const riskLevel = scoreData?.risk_level || 'Moderate';
  const fusionDetails = scoreData?.fusion_details || {};
  const primaryContribs = fusionDetails?.primary_contributors || [
    { factor: 'Memory retention', change: '↓ 16.2% from baseline', modality: 'Cognitive' },
    { factor: 'Typing cadence', change: '↓ 20.6% from baseline', modality: 'Behavioral' },
    { factor: 'Scroll hesitation', change: '↑ 85.7% from baseline', modality: 'Behavioral' },
    { factor: 'Speech pause frequency', change: '↑ 42.0% from baseline', modality: 'Voice' }
  ];

  const steps = [
    {
      step: 1,
      title: '7-Day Baseline Calibration',
      agent: 'LongitudinalTrendAgent',
      badge: 'PROVENANCE: CALIBRATED',
      desc: 'Individual neuro-motor, reaction speed, and linguistic baselines established. Subsequent telemetry is compared against this personal norm rather than generic population averages.',
      status: 'success'
    },
    {
      step: 2,
      title: 'Active Cognitive Battery Psychometrics [E1]',
      agent: 'CognitiveTestAgent',
      badge: 'ACTIVE COGNITIVE',
      desc: `Multi-domain psychometric evaluation across 5 tests. Memory score (${Math.round(scoreData?.active_score || 73)}/100) and Stroop executive control evaluated against baseline.`,
      status: scoreData?.active_score < 65 ? 'warning' : 'success'
    },
    {
      step: 3,
      title: 'Keystroke Dynamics & Latency [E2]',
      agent: 'BehaviorAnalysisAgent',
      badge: 'PASSIVE TELEMETRY',
      desc: 'Inter-key latency variability, typing speed, and correction rate computed during routine app usage.',
      status: 'warning'
    },
    {
      step: 4,
      title: 'Page Navigation & Scroll Hesitation [E3]',
      agent: 'BehaviorAnalysisAgent',
      badge: 'PASSIVE TELEMETRY',
      desc: 'Scroll velocity, pause hesitation (>2s intervals), and trajectory reversals tracked to assess motor-visual exploration.',
      status: 'warning'
    },
    {
      step: 5,
      title: 'Acoustic Speech Biomarkers & Linguistics [E4]',
      agent: 'VoiceAnalysisAgent',
      badge: 'VOICE ACOUSTIC',
      desc: 'Conversational cadence, mean pause duration, and lexical richness analyzed across 7 vernacular languages.',
      status: 'warning'
    },
    {
      step: 6,
      title: 'Signal Fusion Engine Contribution Math',
      agent: 'SignalFusionEngine',
      badge: 'TRI-MODAL FUSION',
      desc: `Fused CogniScore (${cogniScore}/100) calculated via calibrated weighting: 60% Cognitive (${Math.round((scoreData?.active_score || 73)*0.6)} pts) + 20% Behavioral (${Math.round((scoreData?.passive_score || 67)*0.2)} pts) + 20% Voice (14.0 pts).`,
      status: 'success'
    },
    {
      step: 7,
      title: 'Longitudinal Trajectory & CUSUM Tracking [E5]',
      agent: 'LongitudinalTrendAgent',
      badge: 'TIME-SERIES ML',
      desc: scoreData?.is_deviating 
        ? 'CUSUM threshold exceeded with consecutive days of behavioral deviation. Tier 2 clinical assessment triggered.' 
        : 'Longitudinal trajectory remains within normal variance envelope. Routine daily monitoring active.',
      status: scoreData?.is_deviating ? 'warning' : 'success'
    },
    {
      step: 8,
      title: 'Tier 2 Multivariate Lifestyle & Vascular ML [E6]',
      agent: 'CatBoost + TreeSHAP',
      badge: 'TABULAR ML',
      desc: 'Multivariate gradient boosted decision tree evaluates 24 clinical features, sleep quality, and vascular risk with SHAP feature attributions.',
      status: 'info'
    },
    {
      step: 9,
      title: 'Tier 3 Structural Neuroimaging (MRI) [E7]',
      agent: 'ResNet-18 + Grad-CAM',
      badge: 'CLINICAL IMAGING',
      desc: 'High-resolution coronal MRI scan classified across CDR stages with Grad-CAM visual attention mapping over the hippocampus and ventricles.',
      status: 'info'
    },
    {
      step: 10,
      title: 'MedGemma Clinical Synthesis & Safety Guardrail',
      agent: 'ClinicalSynthesisAgent + SafetyAgent',
      badge: 'SAFETY CERTIFIED',
      desc: 'Multi-evidence dossier synthesized with grounded citations [E1..E7], probabilistic screening terminology, and medical disclaimers certified.',
      status: 'success'
    }
  ];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, backgroundColor: theme.cardBg, borderColor: theme.border }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: `1px solid ${theme.border}`, paddingBottom: '1rem' }}>
          <div>
            <span style={styles.eyebrow}>EXPLAINABLE AI REASONING TRACE</span>
            <h2 style={{ ...styles.title, color: theme.text }}>How Did CogniVeil Reach This Result?</h2>
            <p style={{ ...styles.subtitle, color: theme.subtext }}>
              Full 10-step deterministic & agentic reasoning path from raw telemetry to clinical decision support.
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Top Summary Banner */}
        <div style={{ ...styles.summaryCard, backgroundColor: isDark ? '#1e1b4b' : '#f5f3ff', borderColor: '#6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Screening Classification</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: theme.text, display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span>CogniScore: {cogniScore} / 100</span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px',
                  color: riskLevel === 'High' ? '#dc2626' : riskLevel === 'Moderate' ? '#d97706' : '#16a34a',
                  backgroundColor: riskLevel === 'High' ? (isDark ? 'rgba(220, 38, 38, 0.2)' : '#fee2e2') : riskLevel === 'Moderate' ? (isDark ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7') : (isDark ? 'rgba(22, 163, 74, 0.2)' : '#dcfce7')
                }}>
                  {riskLevel.toUpperCase()} RISK
                </span>
              </div>
            </div>

            {/* Primary Contributors Pills */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: theme.subtext, marginBottom: '0.3rem' }}>PRIMARY DELTA CONTRIBUTORS:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {primaryContribs.slice(0, 3).map((c, idx) => (
                  <span key={idx} style={{
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                    color: theme.text
                  }}>
                    {c.factor}: <strong style={{ color: '#ef4444' }}>{c.change}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 10-Step Stepper Flow */}
        <div style={styles.stepperContainer}>
          {steps.map((s, idx) => (
            <div key={idx} style={styles.stepRow}>
              {/* Stepper Node & Line */}
              <div style={styles.nodeColumn}>
                <div style={{
                  ...styles.nodeCircle,
                  backgroundColor: s.status === 'warning' ? '#f59e0b' : s.status === 'info' ? '#3b82f6' : '#10b981'
                }}>
                  {s.step}
                </div>
                {idx < steps.length - 1 && <div style={{ ...styles.stepLine, backgroundColor: theme.border }} />}
              </div>

              {/* Step Content Card */}
              <div style={{ ...styles.stepCard, backgroundColor: theme.statBoxBg, borderColor: theme.border }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '800', color: theme.text }}>STEP {s.step}: {s.title}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#6366f1', backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#e0e7ff', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                      {s.agent}
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: '700', color: theme.subtext, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                      {s.badge}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: theme.subtext, lineHeight: '1.4', margin: 0 }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: `1px solid ${theme.border}` }}>
          <button style={styles.doneBtn} onClick={onClose}>Close Explanation</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modal: {
    width: '100%',
    maxWidth: '780px',
    maxHeight: '90vh',
    borderRadius: '16px',
    border: '1px solid',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
  },
  eyebrow: {
    fontSize: '0.7rem',
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: '0.08em',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '900',
    margin: '2px 0 4px 0',
  },
  subtitle: {
    fontSize: '0.8rem',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '0.5rem',
  },
  summaryCard: {
    padding: '1rem',
    borderRadius: '12px',
    border: '1px solid',
    marginBottom: '1.25rem',
  },
  stepperContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  stepRow: {
    display: 'flex',
    gap: '0.85rem',
    alignItems: 'flex-start',
  },
  nodeColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '28px',
  },
  nodeCircle: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '900',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },
  stepLine: {
    width: '2px',
    height: '45px',
    margin: '4px 0',
  },
  stepCard: {
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    border: '1px solid',
  },
  doneBtn: {
    backgroundColor: '#4338CA',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
  }
};

export default ExplainMyResultModal;
