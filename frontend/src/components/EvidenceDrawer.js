import React from 'react';
import { useTheme } from '../context/ThemeContext';

const EvidenceDrawer = ({ isOpen, onClose, evidenceId, evidenceData }) => {
  const { theme, isDark } = useTheme();

  if (!isOpen || !evidenceData) return null;

  const defaultDetails = {
    E1: {
      title: 'Cognitive Battery Psychometrics',
      provenance: 'active_cognitive_test',
      source: 'CognitiveTestAgent / Interactive Battery',
      observation: 'Delayed word recall and pattern reconstruction exhibited 16.0% accuracy drop relative to baseline.',
      baseline: '81.0 pts',
      current: '68.0 pts',
      duration: '4 sessions',
      confidence: '92%',
      agent: 'CognitiveTestAgent v2026.1',
      clinicalNote: 'Indicates selective hippocampal episodic retrieval slowing with preserved simple motor reaction speed.'
    },
    E2: {
      title: 'Digital Keystroke Telemetry',
      provenance: 'passive_telemetry',
      source: 'PassiveTracker / Keystroke Engine',
      observation: 'Typing cadence decreased by 20.6% alongside a 78.4% increase in backspace correction rate.',
      baseline: '34.0 WPM',
      current: '27.0 WPM',
      duration: '6 consecutive sessions',
      confidence: '86%',
      agent: 'BehaviorAnalysisAgent v2026.1',
      clinicalNote: 'Fine motor control and lexical access latency during routine device interaction.'
    },
    E3: {
      title: 'Page Navigation & Exploration Hesitation',
      provenance: 'passive_telemetry',
      source: 'PassiveTracker / Scroll Velocity Engine',
      observation: 'Navigation pause hesitation (>2s) increased 85.7% with 8 directional trajectory reversals.',
      baseline: '2.8 hesitations/min',
      current: '5.2 hesitations/min',
      duration: '6 consecutive sessions',
      confidence: '79%',
      agent: 'BehaviorAnalysisAgent v2026.1',
      clinicalNote: 'Visual-spatial exploration hesitation and uncertainty during interface reading.'
    },
    E4: {
      title: 'Acoustic Speech Biomarkers & Linguistics',
      provenance: 'voice_derived',
      source: 'VoiceAnalysisAgent / Whisper Multilingual',
      observation: 'Inter-phrase pause frequency increased 42.0% (18.6/min) with conversational cadence slowing to 88 WPM.',
      baseline: '125.0 WPM',
      current: '88.0 WPM',
      duration: 'Single-session & longitudinal',
      confidence: '81%',
      agent: 'VoiceAnalysisAgent v2026.1',
      clinicalNote: 'Word-finding search pauses observed while syntactic coherence remained intact.'
    },
    E5: {
      title: 'Longitudinal Trajectory Drift & CUSUM',
      provenance: 'time_series_trajectory',
      source: 'LongitudinalTrendAgent / EWMA Filter',
      observation: 'CUSUM score reached 13.4 exceeding critical threshold with 6 consecutive days of downward deviation.',
      baseline: '82.0 mean score',
      current: '68.0 current score',
      duration: '7–14 days',
      confidence: '88%',
      agent: 'LongitudinalTrendAgent v2026.1',
      clinicalNote: 'Rules out single-day acute stress or transient fatigue; confirms persistent trajectory shift.'
    },
    E6: {
      title: 'Multivariate Tabular ML & TreeSHAP Attribution',
      provenance: 'multivariate_tabular_ml',
      source: 'CatBoost Risk Classifier',
      observation: 'Model probability 74.0% (Elevated Risk). Primary drivers: Sleep Disruption (+0.28), Sedentary Profile (+0.19), Age (+0.31).',
      baseline: 'Population normative risk 18.0%',
      current: '74.0% estimated probability',
      duration: 'Cross-sectional tabular evaluation',
      confidence: '92%',
      agent: 'RiskOrchestrationAgent v2026.1',
      clinicalNote: 'Identifies addressable lifestyle risk targets alongside non-modifiable genetic/age risk.'
    },
    E7: {
      title: 'Structural Neuroimaging & Grad-CAM Attention',
      provenance: 'clinical_imaging',
      source: 'PyTorch ResNet-18 Neuroimaging CNN',
      observation: 'Coronal T1 scan classified as Very Mild Cognitive Impairment (CDR 0.5) with bilateral medial temporal attention.',
      baseline: 'CDR 0 (Non-Demented)',
      current: 'CDR 0.5 (Very Mild Impairment)',
      duration: 'Clinical structural MRI scan',
      confidence: '88%',
      agent: 'ClinicalSynthesisAgent v2026.1',
      clinicalNote: 'Brain Parenchymal Fraction: 0.78, Ventricular Ratio: 0.14. Grad-CAM visualizes model attention.'
    }
  };

  const item = defaultDetails[evidenceId] || evidenceData || defaultDetails['E1'];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div 
        style={{ ...styles.drawer, backgroundColor: theme.cardBg, borderColor: theme.border }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${theme.border}`, paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={styles.evidenceBadge}>EVIDENCE {evidenceId}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#627D98', textTransform: 'uppercase' }}>
                {item.provenance}
              </span>
            </div>
            <h2 style={{ ...styles.title, color: theme.text }}>{item.title}</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Observation Card */}
        <div style={{ ...styles.sectionBox, backgroundColor: theme.statBoxBg, border: `1px solid ${theme.border}` }}>
          <h4 style={{ ...styles.boxHeader, color: theme.text }}>CLINICAL OBSERVATION</h4>
          <p style={{ ...styles.bodyText, color: theme.text }}>{item.observation}</p>
        </div>

        {/* Metrics Grid */}
        <div style={styles.grid2}>
          <div style={{ ...styles.metricBox, backgroundColor: theme.statBoxBg, border: `1px solid ${theme.border}` }}>
            <span style={styles.metricLabel}>PERSONAL BASELINE</span>
            <span style={{ ...styles.metricValue, color: theme.text }}>{item.baseline}</span>
          </div>

          <div style={{ ...styles.metricBox, backgroundColor: theme.statBoxBg, border: `1px solid ${theme.border}` }}>
            <span style={styles.metricLabel}>CURRENT OBSERVATION</span>
            <span style={{ ...styles.metricValue, color: '#D97745' }}>{item.current}</span>
          </div>

          <div style={{ ...styles.metricBox, backgroundColor: theme.statBoxBg, border: `1px solid ${theme.border}` }}>
            <span style={styles.metricLabel}>OBSERVED DURATION</span>
            <span style={{ ...styles.metricValue, color: theme.text }}>{item.duration}</span>
          </div>

          <div style={{ ...styles.metricBox, backgroundColor: theme.statBoxBg, border: `1px solid ${theme.border}` }}>
            <span style={styles.metricLabel}>MODEL CONFIDENCE</span>
            <span style={{ ...styles.metricValue, color: '#2F7D5B' }}>{item.confidence}</span>
          </div>
        </div>

        {/* Source & Provenance Metadata */}
        <div style={{ ...styles.sectionBox, backgroundColor: theme.statBoxBg, border: `1px solid ${theme.border}`, marginTop: '1rem' }}>
          <h4 style={{ ...styles.boxHeader, color: theme.text }}>PROVENANCE & AGENT ATTRIBUTION</h4>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>Telemetry Source:</span>
            <span style={{ ...styles.metaVal, color: theme.text }}>{item.source}</span>
          </div>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>Responsible Agent:</span>
            <span style={{ ...styles.metaVal, color: '#0F4C4A' }}>{item.agent}</span>
          </div>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>Data Integrity:</span>
            <span style={{ ...styles.metaVal, color: '#2F7D5B' }}>Passed DataQualityAgent v2026.1</span>
          </div>
        </div>

        {/* Clinical Note */}
        <div style={{ ...styles.callout, backgroundColor: isDark ? 'rgba(83,183,197,0.1)' : '#F0F5F4', borderLeft: '4px solid #0F4C4A' }}>
          <h5 style={{ margin: '0 0 4px 0', fontSize: '0.78rem', fontWeight: '800', color: '#0F4C4A' }}>DECISION SUPPORT NOTE</h5>
          <p style={{ margin: 0, fontSize: '0.8rem', color: theme.text, lineHeight: '1.4' }}>
            {item.clinicalNote}
          </p>
        </div>

        {/* Close Button */}
        <button style={styles.doneBtn} onClick={onClose}>
          Done Inspecting
        </button>
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
    backgroundColor: 'rgba(16, 42, 67, 0.45)',
    backdropFilter: 'blur(4px)',
    zIndex: 10000,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: '100%',
    maxWidth: '460px',
    height: '100%',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
    borderLeft: '1px solid',
    animation: 'slideIn 0.25s ease-out',
  },
  evidenceBadge: {
    backgroundColor: '#0F4C4A',
    color: '#ffffff',
    fontSize: '0.7rem',
    fontWeight: '800',
    padding: '0.15rem 0.5rem',
    borderRadius: '6px',
    letterSpacing: '0.05em',
  },
  title: {
    fontSize: '1.15rem',
    fontWeight: '800',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#627D98',
    padding: '0.25rem',
  },
  sectionBox: {
    padding: '1rem',
    borderRadius: '12px',
    marginBottom: '1rem',
  },
  boxHeader: {
    fontSize: '0.72rem',
    fontWeight: '800',
    letterSpacing: '0.08em',
    margin: '0 0 6px 0',
  },
  bodyText: {
    fontSize: '0.84rem',
    lineHeight: '1.45',
    margin: 0,
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  metricBox: {
    padding: '0.75rem',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metricLabel: {
    fontSize: '0.68rem',
    fontWeight: '700',
    color: '#627D98',
  },
  metricValue: {
    fontSize: '0.95rem',
    fontWeight: '800',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.78rem',
    padding: '3px 0',
  },
  metaLabel: {
    color: '#627D98',
    fontWeight: '600',
  },
  metaVal: {
    fontWeight: '700',
  },
  callout: {
    padding: '0.85rem',
    borderRadius: '8px',
    marginTop: '1rem',
  },
  doneBtn: {
    marginTop: 'auto',
    padding: '0.75rem',
    backgroundColor: '#0F4C4A',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '0.88rem',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(15, 76, 74, 0.2)',
  }
};

export default EvidenceDrawer;
