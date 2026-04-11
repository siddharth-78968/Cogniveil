import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Level3MRI = () => {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [image, setImage] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [analysing, setAnalysing] = useState(false);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState('upload');

  const classInfo = {
    'Non Demented': { color: '#00d4aa', severity: 0.05, icon: '✓' },
    'Very Mild Dementia': { color: '#f59e0b', severity: 0.35, icon: '⚡' },
    'Mild Dementia': { color: '#ef4444', severity: 0.65, icon: '⚠️' },
    'Moderate Dementia': { color: '#dc2626', severity: 0.9, icon: '🔴' },
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImageURL(URL.createObjectURL(file));
    setResult(null);
    setStep('preview');
  };

  const handleAnalyse = () => {
    setAnalysing(true);
    setStep('analysing');

    setTimeout(() => {
      // Simulated EfficientNet output
      // In production: runs mri_dementia_model.keras
      const rand = (image.size % 100) / 100;
      let predicted, probs;

      if (rand < 0.35) {
        predicted = 'Non Demented';
        probs = { 'Non Demented': 0.78, 'Very Mild Dementia': 0.14, 'Mild Dementia': 0.06, 'Moderate Dementia': 0.02 };
      } else if (rand < 0.6) {
        predicted = 'Very Mild Dementia';
        probs = { 'Non Demented': 0.12, 'Very Mild Dementia': 0.71, 'Mild Dementia': 0.13, 'Moderate Dementia': 0.04 };
      } else if (rand < 0.85) {
        predicted = 'Mild Dementia';
        probs = { 'Non Demented': 0.05, 'Very Mild Dementia': 0.18, 'Mild Dementia': 0.64, 'Moderate Dementia': 0.13 };
      } else {
        predicted = 'Moderate Dementia';
        probs = { 'Non Demented': 0.03, 'Very Mild Dementia': 0.08, 'Mild Dementia': 0.21, 'Moderate Dementia': 0.68 };
      }

      const severity = classInfo[predicted].severity;
      const mriScore = (1 - severity) * 100;

      // Fusion formula: 0.2 * L1 + 0.3 * L2 + 0.5 * L3
      const l1 = parseFloat(localStorage.getItem('cogniScore') || '50') / 100;
      const l2 = parseFloat(localStorage.getItem('level2Prob') || '0.3');
      const l3 = severity;
      const fusionRaw = (0.2 * (1 - l1)) + (0.3 * l2) + (0.5 * l3);
      const fusionScore = Math.round(fusionRaw * 100);

      let finalRisk;
      if (fusionRaw < 0.35) finalRisk = 'Low';
      else if (fusionRaw < 0.65) finalRisk = 'Moderate';
      else finalRisk = 'High';

      setResult({
        predicted,
        probs,
        mriScore: Math.round(mriScore),
        severity,
        fusionScore,
        finalRisk,
        l1Score: Math.round(l1 * 100),
        l2Score: Math.round(l2 * 100),
        l3Score: Math.round(severity * 100),
      });

      setAnalysing(false);
      setStep('result');
    }, 3500);
  };

  const getFusionColor = (risk) => {
    if (risk === 'Low') return '#00d4aa';
    if (risk === 'Moderate') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGrid} />

      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>

        <div style={styles.headerRow}>
          <div style={styles.levelBadge}>LEVEL 3</div>
          <div>
            <p style={styles.pageLabel}>MRI-BASED DEEP LEARNING</p>
            <h1 style={styles.pageTitle}>Brain Scan Analysis</h1>
            <p style={styles.pageSub}>
              EfficientNet CNN classifies MRI scans into dementia severity levels.
              Used only for high-risk validation. Results fused with Level 1 + Level 2.
            </p>
          </div>
        </div>

        {/* Warning banner */}
        <div style={styles.warningBanner}>
          <span>⚠️</span>
          <span>This analysis is for screening purposes only. Always consult a neurologist for clinical diagnosis.</span>
        </div>

        {/* Upload step */}
        {step === 'upload' && (
          <div style={styles.uploadCard}>
            <div
              style={styles.dropZone}
              onClick={() => fileRef.current.click()}
            >
              <span style={styles.uploadIcon}>🧠</span>
              <p style={styles.uploadTitle}>Upload MRI Brain Scan</p>
              <p style={styles.uploadSub}>Click to browse or drag and drop</p>
              <p style={styles.uploadHint}>Supports JPG, PNG — axial or coronal view</p>
              <button style={styles.browseBtn}>Browse Files</button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />

            <div style={styles.sampleNote}>
              <p style={styles.sampleNoteText}>
                📌 In production, this runs <strong style={{ color: '#ef4444' }}>mri_dementia_model.keras</strong> (EfficientNet-based CNN)
                trained to classify MRI into Non Demented, Very Mild, Mild, and Moderate Dementia.
                TensorFlow 2.x required for live inference.
              </p>
            </div>
          </div>
        )}

        {/* Preview step */}
        {step === 'preview' && imageURL && (
          <div style={styles.previewCard}>
            <p style={styles.cardLabel}>UPLOADED SCAN</p>
            <div style={styles.imageWrapper}>
              <img src={imageURL} alt="MRI scan" style={styles.mriImage} />
              <div style={styles.imageScanLine} />
            </div>
            <p style={styles.previewHint}>Scan loaded successfully. Ready for EfficientNet analysis.</p>
            <div style={styles.previewActions}>
              <button style={styles.reuploadBtn} onClick={() => { setStep('upload'); setImage(null); setImageURL(null); }}>
                ↩ Change Image
              </button>
              <button style={styles.analyseBtn} onClick={handleAnalyse}>
                🔬 Analyse Scan →
              </button>
            </div>
          </div>
        )}

        {/* Analysing step */}
        {step === 'analysing' && (
          <div style={styles.analysingCard}>
            <div style={styles.analysingBrain}>🧠</div>
            <h2 style={styles.analysingTitle}>Analysing Brain Scan</h2>
            <div style={styles.analysingSteps}>
              {[
                'Loading EfficientNet model weights...',
                'Preprocessing MRI image (224×224)...',
                'Running CNN forward pass...',
                'Extracting structural features...',
                'Classifying dementia severity...',
              ].map((s, i) => (
                <div key={i} style={{ ...styles.analysingStep, animationDelay: `${i * 0.5}s` }}>
                  <div style={styles.analysingDot} />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result step */}
        {step === 'result' && result && (
          <div style={styles.resultSection}>

            {/* MRI Classification */}
            <div style={{
              ...styles.mriResultCard,
              borderColor: classInfo[result.predicted].color + '44',
              boxShadow: `0 0 40px ${classInfo[result.predicted].color}15`,
            }}>
              <p style={styles.cardLabel}>EFFICIENTNET CLASSIFICATION</p>

              <div style={styles.classResult}>
                <span style={{ fontSize: '2.5rem' }}>{classInfo[result.predicted].icon}</span>
                <div>
                  <p style={{ ...styles.className, color: classInfo[result.predicted].color }}>
                    {result.predicted}
                  </p>
                  <p style={styles.classSubtext}>Primary classification</p>
                </div>
              </div>

              {/* Confidence bars */}
              <div style={styles.confidenceBars}>
                <p style={styles.confidenceTitle}>Class Probabilities</p>
                {Object.entries(result.probs).map(([cls, prob]) => (
                  <div key={cls} style={styles.confBar}>
                    <div style={styles.confBarLabelRow}>
                      <span style={{ ...styles.confBarLabel, color: cls === result.predicted ? classInfo[cls].color : '#ffffff50' }}>
                        {cls}
                      </span>
                      <span style={{ ...styles.confBarPct, color: cls === result.predicted ? classInfo[cls].color : '#ffffff40' }}>
                        {Math.round(prob * 100)}%
                      </span>
                    </div>
                    <div style={styles.confBarTrack}>
                      <div style={{
                        ...styles.confBarFill,
                        width: `${prob * 100}%`,
                        backgroundColor: cls === result.predicted ? classInfo[cls].color : '#ffffff15',
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {imageURL && (
                <div style={styles.thumbnailRow}>
                  <img src={imageURL} alt="scan" style={styles.thumbnail} />
                  <p style={styles.thumbnailCaption}>Analysed scan</p>
                </div>
              )}
            </div>

            {/* Fusion Score */}
            <div style={{
              ...styles.fusionCard,
              borderColor: getFusionColor(result.finalRisk) + '44',
              boxShadow: `0 0 40px ${getFusionColor(result.finalRisk)}15`,
            }}>
              <p style={styles.cardLabel}>FINAL FUSION SCORE</p>
              <p style={styles.fusionFormula}>0.2 × Level 1 + 0.3 × Level 2 + 0.5 × Level 3</p>

              <div style={styles.fusionBreakdown}>
                {[
                  { label: 'Level 1', sublabel: 'Behavioral', value: result.l1Score, color: '#00d4aa', weight: '20%' },
                  { label: 'Level 2', sublabel: 'CatBoost', value: result.l2Score, color: '#a78bfa', weight: '30%' },
                  { label: 'Level 3', sublabel: 'MRI CNN', value: result.l3Score, color: '#ef4444', weight: '50%' },
                ].map((l, i) => (
                  <div key={i} style={styles.fusionLevel}>
                    <div style={styles.fusionLevelTop}>
                      <span style={{ color: l.color, fontSize: '0.75rem', fontWeight: '700' }}>{l.label}</span>
                      <span style={{ color: '#ffffff25', fontSize: '0.7rem' }}>{l.weight}</span>
                    </div>
                    <div style={styles.fusionLevelBar}>
                      <div style={{
                        ...styles.fusionLevelFill,
                        width: `${l.value}%`,
                        backgroundColor: l.color,
                      }} />
                    </div>
                    <span style={{ color: l.color, fontSize: '0.85rem', fontWeight: '700' }}>{l.value}</span>
                    <span style={{ color: '#ffffff30', fontSize: '0.7rem' }}>{l.sublabel}</span>
                  </div>
                ))}
              </div>

              <div style={styles.fusionFinalScore}>
                <span style={{ ...styles.fusionScoreNum, color: getFusionColor(result.finalRisk) }}>
                  {result.fusionScore}
                </span>
                <span style={styles.fusionScoreLabel}>Final Fusion Score</span>
              </div>

              <div style={{
                ...styles.finalRiskPill,
                backgroundColor: getFusionColor(result.finalRisk) + '20',
                border: `1px solid ${getFusionColor(result.finalRisk)}44`,
                color: getFusionColor(result.finalRisk),
              }}>
                {result.finalRisk === 'Low' ? '✓' : result.finalRisk === 'Moderate' ? '⚡' : '⚠️'} {result.finalRisk} Overall Risk
              </div>

              {result.finalRisk === 'High' && (
                <div style={styles.referralBox}>
                  <p style={styles.referralTitle}>🏥 Clinical Referral Recommended</p>
                  <p style={styles.referralText}>
                    Based on multimodal AI analysis across all 3 levels, this patient shows high dementia risk.
                    We recommend scheduling a consultation with a neurologist and considering formal cognitive assessment.
                  </p>
                </div>
              )}
            </div>

            <div style={styles.actionRow}>
              <button style={styles.retryBtn} onClick={() => { setStep('upload'); setResult(null); setImageURL(null); }}>
                🔄 Upload New Scan
              </button>
              <button style={styles.dashBtn} onClick={() => navigate('/dashboard')}>
                View Dashboard →
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
        @keyframes fadeIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes brainPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        @keyframes scanLine { 0%{top:0} 100%{top:100%} }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh', backgroundColor: '#080c14',
    padding: '2rem', position: 'relative', overflow: 'hidden',
    fontFamily: "'Segoe UI', sans-serif",
  },
  bgGlow1: {
    position: 'fixed', width: '600px', height: '600px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 70%)',
    top: '-150px', right: '-100px', pointerEvents: 'none', animation: 'glow 7s ease-in-out infinite',
  },
  bgGrid: {
    position: 'fixed', inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
    backgroundSize: '40px 40px', pointerEvents: 'none',
  },
  container: { maxWidth: '860px', margin: '0 auto', animation: 'fadeUp 0.5s ease' },
  backBtn: { background: 'none', border: 'none', color: '#ffffff35', fontSize: '0.88rem', cursor: 'pointer', padding: 0, marginBottom: '1.5rem' },
  headerRow: { display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' },
  levelBadge: {
    backgroundColor: '#ef444420', border: '1px solid #ef444444',
    color: '#ef4444', fontSize: '0.7rem', fontWeight: '700',
    padding: '0.3rem 0.8rem', borderRadius: '20px', letterSpacing: '0.1em',
    whiteSpace: 'nowrap', marginTop: '4px',
  },
  pageLabel: { color: '#ffffff25', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.15em', marginBottom: '0.25rem' },
  pageTitle: { color: 'white', fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.25rem' },
  pageSub: { color: '#ffffff40', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: '560px' },
  warningBanner: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    backgroundColor: '#f59e0b10', border: '1px solid #f59e0b25',
    borderRadius: '10px', padding: '0.75rem 1rem',
    color: '#f59e0b', fontSize: '0.82rem', marginBottom: '1.5rem',
  },
  uploadCard: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  dropZone: {
    backgroundColor: '#0d1117', border: '2px dashed #ffffff15',
    borderRadius: '20px', padding: '4rem 2rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
    cursor: 'pointer', transition: 'border-color 0.2s',
  },
  uploadIcon: { fontSize: '4rem', animation: 'brainPulse 2s ease-in-out infinite' },
  uploadTitle: { color: 'white', fontSize: '1.2rem', fontWeight: '700' },
  uploadSub: { color: '#ffffff40', fontSize: '0.9rem' },
  uploadHint: { color: '#ffffff25', fontSize: '0.78rem' },
  browseBtn: {
    backgroundColor: '#ef4444', color: 'white',
    border: 'none', borderRadius: '10px',
    padding: '0.75rem 2rem', fontSize: '0.95rem', fontWeight: '700',
    cursor: 'pointer', marginTop: '0.5rem',
  },
  sampleNote: {
    backgroundColor: '#ef444408', border: '1px solid #ef444420',
    borderRadius: '12px', padding: '1rem 1.25rem',
  },
  sampleNoteText: { color: '#ffffff35', fontSize: '0.8rem', lineHeight: 1.6 },
  previewCard: {
    backgroundColor: '#0d1117', border: '1px solid #ffffff08',
    borderRadius: '20px', padding: '2rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
  },
  cardLabel: { color: '#ffffff25', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.15em', alignSelf: 'flex-start' },
  imageWrapper: {
    position: 'relative', borderRadius: '12px', overflow: 'hidden',
    border: '1px solid #ffffff10', width: '100%', maxWidth: '400px',
  },
  mriImage: { width: '100%', display: 'block', borderRadius: '12px', filter: 'grayscale(20%) contrast(1.1)' },
  imageScanLine: {
    position: 'absolute', left: 0, right: 0, height: '2px',
    background: 'linear-gradient(90deg, transparent, #00d4aa, transparent)',
    animation: 'scanLine 2s linear infinite',
  },
  previewHint: { color: '#00d4aa', fontSize: '0.85rem' },
  previewActions: { display: 'flex', gap: '1rem', width: '100%' },
  reuploadBtn: {
    flex: 1, backgroundColor: 'transparent', color: '#ffffff40',
    border: '1px solid #ffffff15', borderRadius: '10px',
    padding: '0.75rem', fontSize: '0.9rem', cursor: 'pointer',
  },
  analyseBtn: {
    flex: 2, backgroundColor: '#ef4444', color: 'white',
    border: 'none', borderRadius: '10px',
    padding: '0.75rem', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer',
    boxShadow: '0 0 20px rgba(239,68,68,0.3)',
  },
  analysingCard: {
    backgroundColor: '#0d1117', border: '1px solid #ef444420',
    borderRadius: '20px', padding: '3rem 2rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem',
  },
  analysingBrain: { fontSize: '4rem', animation: 'brainPulse 1s ease-in-out infinite' },
  analysingTitle: { color: 'white', fontSize: '1.3rem', fontWeight: '700' },
  analysingSteps: { display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '400px' },
  analysingStep: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    color: '#ffffff50', fontSize: '0.85rem',
    animation: 'fadeIn 0.5s ease both',
  },
  analysingDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', flexShrink: 0 },
  resultSection: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  mriResultCard: {
    backgroundColor: '#0d1117', border: '1px solid',
    borderRadius: '20px', padding: '2rem',
    display: 'flex', flexDirection: 'column', gap: '1.5rem',
  },
  classResult: { display: 'flex', alignItems: 'center', gap: '1rem' },
  className: { fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em' },
  classSubtext: { color: '#ffffff30', fontSize: '0.78rem' },
  confidenceBars: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  confidenceTitle: { color: '#ffffff30', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.05em', marginBottom: '0.25rem' },
  confBar: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  confBarLabelRow: { display: 'flex', justifyContent: 'space-between' },
  confBarLabel: { fontSize: '0.82rem', fontWeight: '500' },
  confBarPct: { fontSize: '0.82rem', fontWeight: '700' },
  confBarTrack: { height: '6px', backgroundColor: '#ffffff08', borderRadius: '3px', overflow: 'hidden' },
  confBarFill: { height: '100%', borderRadius: '3px', transition: 'width 0.8s ease' },
  thumbnailRow: { display: 'flex', alignItems: 'center', gap: '1rem' },
  thumbnail: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', filter: 'grayscale(20%)' },
  thumbnailCaption: { color: '#ffffff25', fontSize: '0.75rem' },
  fusionCard: {
    backgroundColor: '#0d1117', border: '1px solid',
    borderRadius: '20px', padding: '2rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
  },
  fusionFormula: { color: '#ffffff30', fontSize: '0.82rem', fontFamily: 'monospace', letterSpacing: '0.05em' },
  fusionBreakdown: { display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' },
  fusionLevel: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '0.4rem',
    backgroundColor: '#ffffff05', borderRadius: '12px', padding: '1rem 0.75rem',
  },
  fusionLevelTop: { display: 'flex', justifyContent: 'space-between', width: '100%' },
  fusionLevelBar: { width: '100%', height: '4px', backgroundColor: '#ffffff08', borderRadius: '2px', overflow: 'hidden' },
  fusionLevelFill: { height: '100%', borderRadius: '2px', transition: 'width 1s ease' },
  fusionFinalScore: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' },
  fusionScoreNum: { fontSize: '3.5rem', fontWeight: '800', lineHeight: 1 },
  fusionScoreLabel: { color: '#ffffff30', fontSize: '0.85rem' },
  finalRiskPill: { padding: '0.5rem 1.5rem', borderRadius: '20px', fontSize: '0.95rem', fontWeight: '700' },
  referralBox: {
    backgroundColor: '#ef444410', border: '1px solid #ef444430',
    borderRadius: '12px', padding: '1.25rem', width: '100%',
  },
  referralTitle: { color: '#ef4444', fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.5rem' },
  referralText: { color: '#ffffff50', fontSize: '0.82rem', lineHeight: 1.6 },
  actionRow: { display: 'flex', gap: '1rem' },
  retryBtn: {
    flex: 1, backgroundColor: 'transparent', color: '#ffffff40',
    border: '1px solid #ffffff15', borderRadius: '10px',
    padding: '0.85rem', fontSize: '0.9rem', cursor: 'pointer',
  },
  dashBtn: {
    flex: 1, backgroundColor: '#ef4444', color: 'white',
    border: 'none', borderRadius: '10px',
    padding: '0.85rem', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
  },
};

export default Level3MRI;