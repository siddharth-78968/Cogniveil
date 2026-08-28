import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const EvidenceGraphModal = ({ isOpen, onClose, onSelectEvidence }) => {
  const { theme, isDark } = useTheme();
  const [activeNode, setActiveNode] = useState('longitudinal');

  if (!isOpen) return null;

  const nodes = {
    cognitive: {
      id: 'E1',
      title: 'Active Cognitive Battery',
      modality: 'Psychometrics',
      score: '73/100',
      status: 'Declining',
      delta: '↓ 16.0% Memory Retention',
      color: '#0F4C4A',
      summary: '5 micro-tests: Pattern Recall, Word Span, Stroop Inhibition, Flanker Reaction, and Digit Span.'
    },
    typing: {
      id: 'E2',
      title: 'Digital Keystroke Telemetry',
      modality: 'Passive Interaction',
      score: '64/100',
      status: 'Declining',
      delta: '↓ 20.6% Typing Cadence',
      color: '#287C78',
      summary: 'Continuous background monitoring of inter-key latency variability, typing pauses, and backspaces.'
    },
    scrolling: {
      id: 'E3',
      title: 'Navigation Exploration',
      modality: 'Passive Interaction',
      score: '72/100',
      status: 'Elevated Hesitation',
      delta: '↑ 85.7% Pause Hesitation',
      color: '#53B7C5',
      summary: 'Scroll velocity trajectory, pauses >2s during page reading, and spatial exploration reversals.'
    },
    voice: {
      id: 'E4',
      title: 'Acoustic Speech Biomarkers',
      modality: 'Voice Linguistics',
      score: '70/100',
      status: 'Mild Deviation',
      delta: '↑ 42.0% Pause Rate',
      color: '#2F7D5B',
      summary: 'Conversational speech cadence, mean pause duration, lexical richness across 7 vernacular languages.'
    },
    longitudinal: {
      id: 'E5',
      title: 'Signal Fusion & Longitudinal Trajectory',
      modality: 'CUSUM / EWMA Filter',
      score: '71.2 / 100',
      status: 'Persistent Drift',
      delta: 'CUSUM: 13.4 (Exceeded)',
      color: '#D97745',
      summary: 'Tracks 7–30 day trend stability to rule out single-day transient fatigue and confirm persistent decline.'
    },
    tier2: {
      id: 'E6',
      title: 'Tier 2 Multivariate ML (CatBoost)',
      modality: 'Tabular SHAP',
      score: '74% Risk',
      status: 'Elevated',
      delta: 'Top: Sleep (+0.28), Sedentary (+0.19)',
      color: '#C94C4C',
      summary: 'Evaluates 24 clinical, lifestyle, and vascular factors with TreeSHAP feature attributions.'
    },
    mri: {
      id: 'E7',
      title: 'Tier 3 Neuroimaging (ResNet-18)',
      modality: 'Structural MRI',
      score: 'CDR 0.5',
      status: 'Confirmed Staging',
      delta: 'BPF: 0.78 · VBR: 0.14',
      color: '#102A43',
      summary: 'PyTorch ResNet-18 volumetric classification with Grad-CAM medial temporal visual attention overlay.'
    }
  };

  const selected = nodes[activeNode] || nodes.longitudinal;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, backgroundColor: theme.cardBg, borderColor: theme.border }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: `1px solid ${theme.border}`, paddingBottom: '0.75rem' }}>
          <div>
            <span style={styles.eyebrow}>MULTIMODAL SIGNAL GRAPH</span>
            <h2 style={{ ...styles.title, color: theme.text }}>Cognitive Intelligence Evidence Network</h2>
            <p style={{ ...styles.subtitle, color: theme.subtext }}>
              Interactive graph topology illustrating how independent active, passive, acoustic, and neuroimaging modalities converge into clinical decisions.
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 2-Column: Left Graph Node Map / Right Node Details */}
        <div style={styles.graphLayout}>
          {/* Node Map */}
          <div style={{ ...styles.canvasBox, backgroundColor: isDark ? '#081119' : '#F0F5F4', borderColor: theme.border }}>
            <div style={styles.nodesGrid}>
              <div style={styles.layerTitle}>TIER 1 SCREENING MODALITIES</div>
              <div style={styles.layerRow}>
                {['cognitive', 'typing', 'scrolling', 'voice'].map((k) => {
                  const n = nodes[k];
                  const isActive = activeNode === k;
                  return (
                    <div 
                      key={k} 
                      style={{
                        ...styles.nodeCard,
                        backgroundColor: isActive ? '#0F4C4A' : theme.cardBg,
                        color: isActive ? '#ffffff' : theme.text,
                        borderColor: isActive ? '#53B7C5' : theme.border,
                        boxShadow: isActive ? '0 0 15px rgba(83, 183, 197, 0.35)' : 'none'
                      }}
                      onClick={() => setActiveNode(k)}
                    >
                      <span style={{ fontSize: '0.68rem', fontWeight: '800', opacity: 0.8 }}>{n.id}</span>
                      <strong style={{ fontSize: '0.8rem' }}>{n.title}</strong>
                      <span style={{ fontSize: '0.72rem', color: isActive ? '#E0FCFF' : '#627D98' }}>{n.score}</span>
                    </div>
                  );
                })}
              </div>

              <div style={styles.arrowDown}>↓ Multi-Signal Convergence ↓</div>

              <div style={styles.layerTitle}>LONGITUDINAL REASONING & FUSION</div>
              <div style={styles.layerRowSingle}>
                <div 
                  style={{
                    ...styles.nodeCardLarge,
                    backgroundColor: activeNode === 'longitudinal' ? '#0F4C4A' : theme.cardBg,
                    color: activeNode === 'longitudinal' ? '#ffffff' : theme.text,
                    borderColor: activeNode === 'longitudinal' ? '#53B7C5' : theme.border,
                    boxShadow: activeNode === 'longitudinal' ? '0 0 18px rgba(83, 183, 197, 0.4)' : 'none'
                  }}
                  onClick={() => setActiveNode('longitudinal')}
                >
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#53B7C5' }}>E5 · SIGNAL FUSION & TRAJECTORY</span>
                  <strong style={{ fontSize: '0.9rem' }}>LongitudinalTrendAgent (EWMA & CUSUM)</strong>
                  <span style={{ fontSize: '0.78rem' }}>CogniScore: 71.2 / 100 · Persistent Drift Flag: YES</span>
                </div>
              </div>

              <div style={styles.arrowDown}>↓ Conditional State-Aware Escalation ↓</div>

              <div style={styles.layerTitle}>TIER 2 & TIER 3 CONFIRMATORY CLINICAL TIERS</div>
              <div style={styles.layerRow}>
                {['tier2', 'mri'].map((k) => {
                  const n = nodes[k];
                  const isActive = activeNode === k;
                  return (
                    <div 
                      key={k} 
                      style={{
                        ...styles.nodeCard,
                        backgroundColor: isActive ? '#0F4C4A' : theme.cardBg,
                        color: isActive ? '#ffffff' : theme.text,
                        borderColor: isActive ? '#53B7C5' : theme.border,
                        boxShadow: isActive ? '0 0 15px rgba(83, 183, 197, 0.35)' : 'none'
                      }}
                      onClick={() => setActiveNode(k)}
                    >
                      <span style={{ fontSize: '0.68rem', fontWeight: '800', opacity: 0.8 }}>{n.id}</span>
                      <strong style={{ fontSize: '0.8rem' }}>{n.title}</strong>
                      <span style={{ fontSize: '0.72rem', color: isActive ? '#E0FCFF' : '#627D98' }}>{n.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Node Details Inspector */}
          <div style={{ ...styles.inspector, backgroundColor: theme.statBoxBg, borderColor: theme.border }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={styles.badge}>{selected.id}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#627D98', textTransform: 'uppercase' }}>{selected.modality}</span>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: theme.text, margin: '0 0 0.5rem 0' }}>{selected.title}</h3>
            
            <div style={styles.statGrid}>
              <div style={styles.statCell}>
                <span style={styles.statLbl}>Domain Score</span>
                <strong style={{ fontSize: '1rem', color: theme.text }}>{selected.score}</strong>
              </div>
              <div style={styles.statCell}>
                <span style={styles.statLbl}>Status</span>
                <strong style={{ fontSize: '0.85rem', color: '#D97745' }}>{selected.status}</strong>
              </div>
            </div>

            <div style={{ marginTop: '0.75rem', padding: '0.65rem', borderRadius: '8px', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF', border: `1px solid ${theme.border}` }}>
              <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#627D98', display: 'block', marginBottom: '2px' }}>KEY DELTA DRIVER:</span>
              <strong style={{ fontSize: '0.85rem', color: '#C94C4C' }}>{selected.delta}</strong>
            </div>

            <p style={{ fontSize: '0.8rem', color: theme.subtext, lineHeight: '1.4', margin: '0.75rem 0' }}>
              {selected.summary}
            </p>

            <button 
              style={styles.inspectBtn} 
              onClick={() => {
                if (onSelectEvidence) onSelectEvidence(selected.id);
                onClose();
              }}
            >
              Inspect Complete Evidence Dossier [{selected.id}] →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(16, 42, 67, 0.65)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modal: {
    width: '100%',
    maxWidth: '860px',
    maxHeight: '90vh',
    borderRadius: '16px',
    border: '1px solid',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
  },
  eyebrow: {
    fontSize: '0.7rem',
    fontWeight: '800',
    color: '#0F4C4A',
    letterSpacing: '0.08em',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '900',
    margin: '2px 0',
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
    color: '#627D98',
    padding: '0.5rem',
  },
  graphLayout: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '1rem',
  },
  canvasBox: {
    padding: '1rem',
    borderRadius: '12px',
    border: '1px solid',
  },
  nodesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  layerTitle: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#627D98',
    letterSpacing: '0.08em',
    textAlign: 'center',
  },
  layerRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.5rem',
  },
  layerRowSingle: {
    display: 'flex',
    justifyContent: 'center',
  },
  nodeCard: {
    padding: '0.6rem',
    borderRadius: '8px',
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  nodeCardLarge: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '10px',
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  arrowDown: {
    textAlign: 'center',
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#627D98',
    margin: '2px 0',
  },
  inspector: {
    padding: '1.25rem',
    borderRadius: '12px',
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
  },
  badge: {
    backgroundColor: '#0F4C4A',
    color: '#ffffff',
    fontSize: '0.7rem',
    fontWeight: '800',
    padding: '0.15rem 0.45rem',
    borderRadius: '6px',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  statCell: {
    display: 'flex',
    flexDirection: 'column',
  },
  statLbl: {
    fontSize: '0.68rem',
    color: '#627D98',
    fontWeight: '600',
  },
  inspectBtn: {
    marginTop: 'auto',
    backgroundColor: '#0F4C4A',
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
  }
};

export default EvidenceGraphModal;
