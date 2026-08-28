import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const AgentPipelineModal = ({ isOpen, onClose }) => {
  const { theme, isDark } = useTheme();
  const [selectedAgent, setSelectedAgent] = useState(0);

  if (!isOpen) return null;

  const agents = [
    {
      name: 'DataQualityAgent',
      role: 'Telemetry & Acoustic Sufficiency',
      status: 'Passed',
      time: '12ms',
      confidence: '100%',
      input: '{ total_keys: 45, session_duration: 60.0s, voice_snr: 22dB }',
      output: '{ is_sufficient: true, quality_score: 0.95, issues: [] }',
      desc: 'Validates keystroke volume, session duration, and microphone SNR before admitting telemetry into the scoring engine.'
    },
    {
      name: 'CognitiveTestAgent',
      role: 'Active Psychometric Battery',
      status: 'Completed',
      time: '45ms',
      confidence: '92%',
      input: '{ tests: [pattern_recall, word_span, stroop, flanker, digit_span] }',
      output: '{ score: 73.0/100, memory: declining (-16%), reaction: stable (+2.5%) }',
      desc: 'Decomposes active micro-task scores into Memory, Reaction, Speed, and Executive Stroop subdomains with baseline delta comparisons.'
    },
    {
      name: 'BehaviorAnalysisAgent',
      role: 'Keystroke Dynamics & Navigation',
      status: 'Completed',
      time: '18ms',
      confidence: '86%',
      input: '{ typing_wpm: 27, latency: 410ms, scroll_hesitation: 5.2/min, reversals: 8 }',
      output: '{ typing_score: 64/100, scroll_score: 72/100, behavior_score: 67/100 }',
      desc: 'Calculates explicit Typing and Scrolling sub-scores and synthesizes a 60/40 composite behavioral score with non-diagnostic reasoning.'
    },
    {
      name: 'VoiceAnalysisAgent',
      role: 'Speech Biomarkers & Linguistics',
      status: 'Completed',
      time: '62ms',
      confidence: '81%',
      input: '{ duration: 45s, pause_rate: 18.6/min, words: 66, language: "en" }',
      output: '{ voice_score: 70/100, cadence: below_baseline, pause_pattern: elevated }',
      desc: 'Extracts objective acoustic biomarkers (pause rate, mean pause duration, speech activity, lexical diversity) across 7 supported vernacular languages.'
    },
    {
      name: 'SignalFusionEngine',
      role: 'Dynamic Multimodal Fusion',
      status: 'Completed',
      time: '8ms',
      confidence: '88%',
      input: '{ cog: 73.0 (60%), beh: 67.0 (20%), voice: 70.0 (20%) }',
      output: '{ cogni_score: 71.2/100, numeric_contribs: [43.8, 13.4, 14.0] }',
      desc: 'Computes exact weighted numeric contributions and ranks primary baseline delta drivers.'
    },
    {
      name: 'LongitudinalTrendAgent',
      role: 'Trajectory & CUSUM Filtering',
      status: 'Drift Flagged',
      time: '15ms',
      confidence: '88%',
      input: '{ history: [84, 82, 80, 76, 73, 70, 68], current: 68.0 }',
      output: '{ ewma: 72.1, cusum: 13.4, persistent_decline: true, trend: persistent_decline }',
      desc: 'Tracks multi-session trajectory to distinguish persistent cognitive/neuromotor decline from acute transient stress.'
    },
    {
      name: 'RiskOrchestrationAgent',
      role: 'State Gating & Tool Dispatcher',
      status: 'Tier 2 Triggered',
      time: '10ms',
      confidence: '95%',
      input: '{ baseline_status: established, is_deviating: true, level2_status: completed }',
      output: '{ next_stage: catboost_ml_prediction, mri_conditional: true }',
      desc: 'Governs multi-tier screening lifecycle gating: Baseline -> Screening -> Level 2 -> Level 3.'
    },
    {
      name: 'CatBoost + SHAP Model',
      role: 'Tier 2 Multivariate Tabular ML',
      status: 'Completed',
      time: '28ms',
      confidence: '92%',
      input: '{ 24 clinical features, sleep_quality: poor, physical_activity: sedentary }',
      output: '{ probability: 0.74, modifiable: [sleep, activity], non_modifiable: [age, apoe] }',
      desc: 'Evaluates lifestyle, sleep, cardiovascular, and genetic factors with TreeSHAP feature attributions.'
    },
    {
      name: 'ResNet-18 + Grad-CAM',
      role: 'Tier 3 Structural Neuroimaging',
      status: 'Classified',
      time: '110ms',
      confidence: '88%',
      input: '{ scan: coronal_t1_mri.dcm, target: resnet18_mri_backbone }',
      output: '{ class: "Very Mild Cognitive Impairment", cdr: "CDR 0.5", bpf: 0.78, vbr: 0.14 }',
      desc: 'Performs volumetric brain morphometry and visual attention heatmap localization over the hippocampus and ventricles.'
    },
    {
      name: 'ClinicalSynthesis & Safety',
      role: 'MedGemma-4B Narrative & Guardrail',
      status: 'Safety Certified',
      time: '85ms',
      confidence: '94%',
      input: '{ evidence: [E1..E7], guidelines: [nice_cg42, who_icope] }',
      output: '{ report_json: 12_sections, guardrail_passed: true, disclaimer: attached }',
      desc: 'Synthesizes the complete 12-section evidence dossier, enforces non-diagnostic probabilistic phrasing, and appends certified medical disclaimers.'
    }
  ];

  const current = agents[selectedAgent];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, backgroundColor: theme.cardBg, borderColor: theme.border }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: `1px solid ${theme.border}`, paddingBottom: '0.75rem' }}>
          <div>
            <span style={styles.eyebrow}>AI MULTI-AGENT ORCHESTRATION</span>
            <h2 style={{ ...styles.title, color: theme.text }}>10-Node Autonomous Execution Pipeline</h2>
            <p style={{ ...styles.subtitle, color: theme.subtext }}>
              Deterministic model execution coordinated by specialized agents with explicit tool dispatching and audit logging.
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Horizontal Pipeline Steps */}
        <div style={styles.pipelineBar}>
          {agents.map((ag, idx) => {
            const isSel = selectedAgent === idx;
            return (
              <button 
                key={idx}
                style={{
                  ...styles.stepBtn,
                  backgroundColor: isSel ? '#0F4C4A' : theme.statBoxBg,
                  color: isSel ? '#ffffff' : theme.text,
                  borderColor: isSel ? '#53B7C5' : theme.border,
                }}
                onClick={() => setSelectedAgent(idx)}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: '800', opacity: 0.8 }}>0{idx + 1}</span>
                <strong style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{ag.name.split(' ')[0]}</strong>
              </button>
            );
          })}
        </div>

        {/* Selected Agent Inspector Card */}
        <div style={{ ...styles.inspectorCard, backgroundColor: theme.statBoxBg, borderColor: theme.border }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0F4C4A' }}>AGENT NODE 0{selectedAgent + 1} OF 10</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: theme.text, margin: '2px 0 0 0' }}>{current.name}</h3>
              <p style={{ fontSize: '0.8rem', color: theme.subtext, margin: 0 }}>{current.role}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', backgroundColor: '#E8F5EE', color: '#2F7D5B', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                {current.status}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E8F0EE', color: theme.text, padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                ⏱️ {current.time}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E8F0EE', color: theme.text, padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                🎯 Conf: {current.confidence}
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.84rem', color: theme.text, lineHeight: '1.45', marginBottom: '1rem' }}>
            {current.desc}
          </p>

          <div style={styles.codeGrid}>
            <div style={{ ...styles.codeBox, backgroundColor: isDark ? '#081119' : '#FFFFFF', border: `1px solid ${theme.border}` }}>
              <span style={styles.codeLbl}>INPUT PAYLOAD</span>
              <pre style={{ ...styles.pre, color: theme.text }}>{current.input}</pre>
            </div>

            <div style={{ ...styles.codeBox, backgroundColor: isDark ? '#081119' : '#FFFFFF', border: `1px solid ${theme.border}` }}>
              <span style={styles.codeLbl}>OUTPUT RESULT</span>
              <pre style={{ ...styles.pre, color: '#0F4C4A' }}>{current.output}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
          <button 
            style={{ ...styles.navBtn, borderColor: theme.border, color: theme.text }}
            disabled={selectedAgent === 0}
            onClick={() => setSelectedAgent(prev => Math.max(0, prev - 1))}
          >
            ← Previous Agent
          </button>
          <button 
            style={{ ...styles.navBtn, borderColor: theme.border, color: theme.text }}
            disabled={selectedAgent === agents.length - 1}
            onClick={() => setSelectedAgent(prev => Math.min(agents.length - 1, prev + 1))}
          >
            Next Agent →
          </button>
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
  pipelineBar: {
    display: 'flex',
    gap: '0.4rem',
    overflowX: 'auto',
    paddingBottom: '0.75rem',
    marginBottom: '1rem',
  },
  stepBtn: {
    flex: '1 0 auto',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
  },
  inspectorCard: {
    padding: '1.25rem',
    borderRadius: '12px',
    border: '1px solid',
  },
  codeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  codeBox: {
    padding: '0.75rem',
    borderRadius: '8px',
  },
  codeLbl: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#627D98',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '4px',
  },
  pre: {
    margin: 0,
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  navBtn: {
    backgroundColor: 'transparent',
    border: '1px solid',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
  }
};

export default AgentPipelineModal;
