import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { classifyMRI } from '../utils/api';

const Level3MRI = () => {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [imageURL, setImageURL] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
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
    setSelectedFile(file);
    setImageURL(URL.createObjectURL(file));
    setResult(null);
    setStep('preview');
  };

  const handleAnalyse = async () => {
    setAnalysing(true);
    setStep('analysing');
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      const response = await classifyMRI(formData);
      setResult(response.data);
      setTimeout(() => {
        setAnalysing(false);
        setStep('result');
      }, 1500);
    } catch (err) {
      console.error('MRI Analysis error:', err);
      setAnalysing(false);
      setResult({
        status: 'unavailable',
        is_confirmatory_panel: true,
        note: 'MRI output is intentionally unavailable in this screening release. Clinical neuroimaging requires an independently evaluated CNN checkpoint and is never algebraically fused with CogniScore.'
      });
      setStep('result');
    }
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
            <p style={styles.pageLabel}>OPTIONAL CONFIRMATORY MODULE</p>
            <h1 style={styles.pageTitle}>Brain Scan Analysis</h1>
            <p style={styles.pageSub}>
              MRI is never fused with CogniVeil's screening score. This module is an independent confirmatory panel designed to accompany specialist referral.
            </p>
          </div>
        </div>

        {/* Warning banner */}
        <div style={styles.warningBanner}>
          <span>⚠️</span>
          <span>This confirmatory module is strictly decoupled from Tier 1 screening scores. Always consult a neurologist for clinical diagnosis.</span>
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
              <p style={styles.uploadHint}>Supports JPG, PNG, DICOM — axial or coronal view</p>
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
                📌 <strong>Confirmatory Architecture:</strong> CogniVeil evaluates structural neuroimaging independently of active tests.
                In production deployments, this hooks to an EfficientNet CNN checkpoint without altering daily digital screening baselines.
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
            <p style={styles.previewHint}>Scan loaded successfully. Ready for confirmatory evaluation.</p>
            <div style={styles.previewActions}>
              <button style={styles.reuploadBtn} onClick={() => { setStep('upload'); setImageURL(null); }}>
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
            <h2 style={styles.analysingTitle}>Evaluating Neuroimaging Evidence</h2>
            <div style={styles.analysingSteps}>
              {[
                'Verifying clinical image headers...',
                'Preprocessing scan dimensions (224×224)...',
                'Checking structural model verification...',
                'Running decoupled confirmatory assessment...',
                'Preparing non-fused referral documentation...',
              ].map((s, i) => (
                <div key={i} style={{ ...styles.analysingStep, animationDelay: `${i * 0.3}s` }}>
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
            {/* Confirmatory Neuroimaging Panel */}
            <div style={{
              ...styles.fusionCard,
              borderColor: '#a78bfa44',
              boxShadow: '0 0 40px rgba(167,139,250,0.15)',
            }}>
              <p style={styles.cardLabel}>INDEPENDENT CONFIRMATORY PANEL</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ backgroundColor: '#a78bfa22', color: '#a78bfa', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '700' }}>
                  CONDITIONAL LEVEL 3 MRI SCAN
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>• Decoupled from digital screening score</span>
              </div>

              {imageURL && (
                <div style={styles.thumbnailRow}>
                  <img src={imageURL} alt="scan" style={styles.thumbnail} />
                  <div>
                    <p style={{ color: 'white', fontSize: '0.9rem', fontWeight: '600', margin: '0 0 4px 0' }}>
                      {selectedFile ? selectedFile.name : 'Uploaded Brain Scan'}
                    </p>
                    <p style={styles.thumbnailCaption}>Confirmatory scan registered to audit trail</p>
                  </div>
                </div>
              )}

              <div style={{
                backgroundColor: '#0d1117',
                border: '1px solid #ffffff12',
                borderRadius: '12px',
                padding: '1.2rem',
                margin: '1rem 0',
                width: '100%'
              }}>
                <h4 style={{ color: '#00d4aa', fontSize: '1.1rem', margin: '0 0 6px 0' }}>
                  ✓ Screening-Decoupled Confirmatory Gate Active
                </h4>
                <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                  {result.note || 'No validated MRI model is bundled with this deployment. MRI output is intentionally unavailable rather than simulated.'}
                </p>
              </div>

              <div style={styles.referralBox}>
                <p style={styles.referralTitle}>🏥 Clinical Specialist Integration</p>
                <p style={styles.referralText}>
                  CogniVeil maintains strict clinical separation between primary digital screening (Tier 1 tests & passive EWMA drift) and secondary neuroimaging. Download your comprehensive PDF Clinical Report from the Dashboard to share this confirmatory scan alongside your CatBoost Tier 2 SHAP risk factors with your healthcare provider.
                </p>
              </div>
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
  thumbnailRow: { display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' },
  thumbnail: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', filter: 'grayscale(20%)' },
  thumbnailCaption: { color: '#ffffff25', fontSize: '0.75rem' },
  fusionCard: {
    backgroundColor: '#0d1117', border: '1px solid',
    borderRadius: '20px', padding: '2rem',
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1.5rem',
  },
  referralBox: {
    backgroundColor: '#a78bfa10', border: '1px solid #a78bfa30',
    borderRadius: '12px', padding: '1.25rem', width: '100%',
  },
  referralTitle: { color: '#a78bfa', fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.5rem' },
  referralText: { color: '#ffffff50', fontSize: '0.82rem', lineHeight: 1.6 },
  actionRow: { display: 'flex', gap: '1rem' },
  retryBtn: {
    flex: 1, backgroundColor: 'transparent', color: '#ffffff40',
    border: '1px solid #ffffff15', borderRadius: '10px',
    padding: '0.85rem', fontSize: '0.9rem', cursor: 'pointer',
  },
  dashBtn: {
    flex: 1, backgroundColor: '#00d4aa', color: '#080c14',
    border: 'none', borderRadius: '10px',
    padding: '0.85rem', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
  },
};

export default Level3MRI;
