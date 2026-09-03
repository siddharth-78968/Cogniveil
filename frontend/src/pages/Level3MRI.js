import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classifyMRI } from '../utils/api';
import DoctorLayout from '../components/DoctorLayout';

const Level3MRI = () => {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [imageURL, setImageURL] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState('upload');
  const [camMode, setCamMode] = useState('blend');
  const [simulateUpload, setSimulateUpload] = useState(false);

  // Clinician Inspection State
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [clinicianMRIData, setClinicianMRIData] = useState(null);
  const [loadingClinician, setLoadingClinician] = useState(false);

  const currentUser = React.useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);

  const isClinician = currentUser?.is_caregiver === true;

  useEffect(() => {
    if (isClinician) {
      fetchClinicianMRI();
    }
  }, [isClinician]); // eslint-disable-line react-hooks/exhaustive-deps


  const fetchClinicianMRI = async () => {
    try {
      setLoadingClinician(true);
      const { getClinicianPatients } = await import('../utils/api');
      const res = await getClinicianPatients();
      if (Array.isArray(res.data) && res.data.length > 0) {
        setPatients(res.data);
        const pId = res.data[0].id;
        setSelectedPatientId(pId);
        loadPatientMRI(pId);
      }
    } catch (err) {
      console.log('Error loading clinician MRI patients:', err.message);
    } finally {
      setLoadingClinician(false);
    }
  };

  const loadPatientMRI = async (patientId) => {
    try {
      setSelectedPatientId(patientId);
      setLoadingClinician(true);
      const { getClinicianPatientMRI } = await import('../utils/api');
      const res = await getClinicianPatientMRI(patientId);
      setClinicianMRIData(res.data);
    } catch (err) {
      console.log('Error loading patient MRI:', err.message);
    } finally {
      setLoadingClinician(false);
    }
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
    setStep('analysing');
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      const response = await classifyMRI(formData);
      setResult(response.data);
      setTimeout(() => {
        setStep('result');
      }, 1200);
    } catch (err) {
      console.error('MRI Analysis error:', err);
      setResult({
        status: 'error',
        is_confirmatory_panel: true,
        note: 'Could not complete scan analysis. Please check your backend connection.'
      });
      setStep('result');
    }
  };

  const getStageColor = (className) => {
    if (!className) return '#00d4aa';
    const c = className.toLowerCase();
    if (c.includes('non') || c.includes('normal')) return '#00d4aa';
    if (c.includes('very mild')) return '#f59e0b';
    if (c.includes('mild')) return '#fb923c';
    return '#ef4444';
  };

  // ── CLINICIAN VIEWPORT: Structural Neuroimaging & Grad-CAM ─────────────
  if (isClinician && !simulateUpload) {
    const mri = clinicianMRIData?.mri_analysis;
    return (
      <DoctorLayout activeTitle="Tier 3 MRI Scans">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.25rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0F4C4A' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.08em', color: '#287C78' }}>
                  CLINICIAN WORKSPACE · STRUCTURAL NEUROIMAGING
                </span>
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
                Patient Structural MRI & Grad-CAM Visual Attention
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                ResNet-18 volumetric classification, CDR staging, ventricular-brain ratios, and medial temporal lobe saliency heatmaps.
              </p>
            </div>

            <button
              onClick={() => setSimulateUpload(true)}
              style={{
                backgroundColor: '#162B3D',
                color: '#53B7C5',
                border: '1px solid #53B7C5',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              📤 Upload / Test Scan File →
            </button>
          </div>

          {/* Patient Selector Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #eef2f6', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
              Select Monitored Patient:
            </span>
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => loadPatientMRI(p.id)}
                style={{
                  border: '1px solid',
                  borderColor: selectedPatientId === p.id ? '#0F4C4A' : '#e2e8f0',
                  backgroundColor: selectedPatientId === p.id ? '#E8F5EE' : 'transparent',
                  color: selectedPatientId === p.id ? '#0F4C4A' : '#1e293b',
                  borderRadius: '8px',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {p.name} {p.is_deviating ? '⚠️' : '✓'}
              </button>
            ))}
          </div>

          {/* Neuroimaging Diagnostic Grid */}
          {loadingClinician ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading neuroimaging volumetric analysis...</div>
          ) : mri ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Classification Banner & Scanner Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #eef2f6' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                    ResNet-18 Volumetric Classification
                  </span>
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '900', 
                    color: (mri.predicted_class || mri.cdr_stage || '').toLowerCase().includes('very mild') ? '#D97745' : '#2F7D5B', 
                    margin: '4px 0' 
                  }}>
                    {mri.predicted_class || mri.cdr_stage || 'Non-Demented (CDR 0)'}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#4338CA' }}>
                    Clinical Dementia Rating: {mri.cdr_stage || 'CDR 0'} · Confidence: {Math.round((mri.confidence || 0.9) * 100)}%
                  </span>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.74rem', color: '#64748b' }}>
                    <span>Scan ID: <strong>{mri.scan_id || 'OASIS3_0042_MR1'}</strong></span>
                    <span>Acquisition: <strong>{mri.acquisition_date || '2026-08-14'}</strong></span>
                    <span>Hardware: <strong>{mri.scanner || 'Siemens TrioTim 3.0T High-Field'}</strong></span>
                    <span>Resolution: <strong>{mri.resolution || '1.0 x 1.0 x 1.2 mm³ (T1w MPRAGE)'}</strong></span>
                  </div>
                </div>

                {/* Volumetric Metrics Grid */}
                <div style={{ padding: '1.25rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #eef2f6' }}>
                  <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#1e293b' }}>
                    Quantitative Morphometry & Volumetric Biomarkers
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.66rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Brain Parenchymal Fraction (BPF)</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: '900', color: (mri.volumetric_metrics?.brain_parenchymal_fraction_bpf || mri.brain_parenchymal_fraction || 0.78) < 0.82 ? '#C94C4C' : '#1e293b' }}>
                        {mri.volumetric_metrics?.brain_parenchymal_fraction_bpf || mri.brain_parenchymal_fraction || 0.78}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Normative: {mri.volumetric_metrics?.bpf_normative_range || '> 0.82'}</span>
                    </div>

                    <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.66rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Ventricular Brain Ratio (VBR)</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: '900', color: (mri.volumetric_metrics?.ventricular_brain_ratio_vbr || mri.ventricular_brain_ratio || 0.14) > 0.10 ? '#C94C4C' : '#1e293b' }}>
                        {mri.volumetric_metrics?.ventricular_brain_ratio_vbr || mri.ventricular_brain_ratio || 0.14}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Normative: {mri.volumetric_metrics?.vbr_normative_range || '< 0.10'}</span>
                    </div>

                    <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.66rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Hippocampal Occupancy</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: '900', color: (mri.volumetric_metrics?.hippocampal_occupancy_ratio || 0.68) < 0.70 ? '#D97745' : '#1e293b' }}>
                        {mri.volumetric_metrics?.hippocampal_occupancy_ratio || 0.68}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Normative: &gt; 0.80</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.85rem', display: 'flex', gap: '1.5rem', fontSize: '0.76rem', color: '#64748b' }}>
                    <span>Left Hippocampus: <strong>{mri.volumetric_metrics?.left_hippocampal_volume_mm3 || mri.hippocampal_volume_mm3?.left || 2850} mm³</strong></span>
                    <span>Right Hippocampus: <strong>{mri.volumetric_metrics?.right_hippocampal_volume_mm3 || mri.hippocampal_volume_mm3?.right || 3020} mm³</strong></span>
                  </div>
                </div>
              </div>

              {/* Grad-CAM Medial Temporal Attention & Findings */}
              <div style={{ padding: '1.25rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #eef2f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#1e293b' }}>
                    Grad-CAM Medial Temporal Saliency & Radiological Impression
                  </h4>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#E8F5EE', color: '#0F4C4A' }}>
                    Layer: {mri.gradcam?.target_layer || 'layer4.1.conv2 (ResNet-18 Bottleneck)'}
                  </span>
                </div>

                <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '0.85rem' }}>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#1e293b', lineHeight: '1.5' }}>
                    🧠 <strong>Findings:</strong> {mri.clinical_notes || mri.gradcam_focus || 'Medial temporal lobe and hippocampal formation focal volume reduction.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.76rem', color: '#64748b' }}>
                  <span>Primary Attention: <strong>{mri.gradcam?.primary_attention_region || 'Medial Temporal Lobe & Parahippocampal Gyrus'}</strong></span>
                  <span>Secondary Attention: <strong>{mri.gradcam?.secondary_attention_region || 'Hippocampal Formation & Entorhinal Cortex'}</strong></span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No structural MRI records found for selected patient.</div>
          )}
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout activeTitle="Tier 3 MRI Scans">
      <div style={styles.container}>
        {isClinician && (
          <div style={{ marginBottom: '0.5rem' }}>
            <button
              onClick={() => setSimulateUpload(false)}
              style={{ background: 'none', border: 'none', color: '#0F4C4A', fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer', padding: 0 }}
            >
              ← Back to Patient MRI Results Review
            </button>
          </div>
        )}
        <div style={styles.headerRow}>
          <div style={styles.levelBadge}>TIER 3</div>
          <div>
            <p style={styles.pageLabel}>CONFIRMATORY NEUROIMAGING MODULE</p>
            <h1 style={styles.pageTitle}>Brain MRI Morphometry & Grad-CAM</h1>
            <p style={styles.pageSub}>
              OASIS/ADNI-calibrated structural neuroimaging classifier. Operates as an independent confirmatory panel to evaluate hippocampal volume, ventricular ratios, and clinical dementia staging.
            </p>
          </div>
        </div>

        {/* Warning banner */}
        <div style={styles.warningBanner}>
          <span>⚠️</span>
          <span>This confirmatory module is strictly decoupled from Tier 1 digital screening scores. Always consult a neurologist for formal clinical diagnosis.</span>
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
              <p style={styles.uploadHint}>Supports JPG, PNG, WEBP, DICOM — axial or coronal views</p>
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
                📌 <strong>Decoupled Architecture:</strong> CogniVeil evaluates structural neuroimaging independently of active tests.
                This model measures volumetric biomarkers (Evans' index proxy, medial temporal lobe CSF expansion) without altering daily digital screening baselines.
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
            <p style={styles.previewHint}>Scan loaded successfully. Ready for volumetric evaluation.</p>
            <div style={styles.previewActions}>
              <button style={styles.reuploadBtn} onClick={() => { setStep('upload'); setImageURL(null); }}>
                ↩ Change Image
              </button>
              <button style={styles.analyseBtn} onClick={handleAnalyse}>
                🔬 Run Volumetric Analysis →
              </button>
            </div>
          </div>
        )}

        {/* Analysing step */}
        {step === 'analysing' && (
          <div style={styles.analysingCard}>
            <div style={styles.analysingBrain}>🧠</div>
            <h2 style={styles.analysingTitle}>Evaluating Neuroimaging Morphometry</h2>
            <div style={styles.analysingSteps}>
              {[
                'Ingesting image matrix and intensity normalization...',
                'Extracting intracranial brain mask & skull boundary...',
                'Computing Ventricular-to-Brain Ratio (VBR)...',
                'Quantifying Medial Temporal / Hippocampal Atrophy...',
                'Predicting OASIS Clinical Dementia Rating (CDR)...',
              ].map((s, i) => (
                <div key={i} style={{ ...styles.analysingStep, animationDelay: `${i * 0.25}s` }}>
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
            <div style={{
              ...styles.fusionCard,
              borderColor: `${getStageColor(result.predicted_class)}44`,
              boxShadow: `0 0 40px ${getStageColor(result.predicted_class)}15`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <p style={styles.cardLabel}>INDEPENDENT CONFIRMATORY NEUROIMAGING PANEL</p>
                <span style={{
                  backgroundColor: `${getStageColor(result.predicted_class)}20`,
                  color: getStageColor(result.predicted_class),
                  border: `1px solid ${getStageColor(result.predicted_class)}44`,
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '700'
                }}>
                  {result.cdr_rating || 'CDR Stage'}
                </span>
              </div>

              {/* Grad-CAM Attention Heatmap Interactive Viewer */}
              {result.gradcam && (
                <div style={styles.gradCamContainer}>
                  <div style={styles.gradCamHeader}>
                    <div>
                      <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: '800', margin: '0 0 4px 0' }}>
                        🧠 Grad-CAM Explainable Attention Overlay
                      </h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                        Focal visual explanation of CNN activations identifying hippocampal atrophy and ventricular expansion.
                      </p>
                    </div>
                    {/* Layer mode switcher */}
                    <div style={styles.modePillGroup}>
                      {['blend', 'heatmap', 'raw'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setCamMode(mode)}
                          style={{
                            ...styles.modePill,
                            backgroundColor: camMode === mode ? '#a78bfa' : 'transparent',
                            color: camMode === mode ? '#080c14' : '#94a3b8',
                            fontWeight: camMode === mode ? '800' : '600',
                          }}
                        >
                          {mode === 'blend' ? 'Overlay Blend' : mode === 'heatmap' ? 'Heatmap Only' : 'Raw Scan'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={styles.gradCamMainRow}>
                    <div style={styles.gradCamImageCard}>
                      <img
                        src={
                          camMode === 'heatmap'
                            ? result.gradcam.heatmap_image_url
                            : camMode === 'raw'
                            ? (result.gradcam.original_image_url || imageURL)
                            : (result.gradcam.overlay_image_url || imageURL)
                        }
                        alt="Grad-CAM analysis"
                        style={styles.gradCamImage}
                      />
                      <div style={styles.gradCamLegend}>
                        <span style={{ color: '#38bdf8', fontSize: '0.72rem', fontWeight: '700' }}>Low Focus (Blue)</span>
                        <div style={styles.legendGradient} />
                        <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: '700' }}>High Activation (Red)</span>
                      </div>
                    </div>

                    {/* Regional Attention Metrics */}
                    <div style={styles.attentionColumn}>
                      <p style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700', margin: '0 0 8px 0' }}>
                        🎯 Focal Activation Zones
                      </p>
                      {result.gradcam.attention_regions?.map((reg, rIdx) => (
                        <div key={rIdx} style={styles.attentionItem}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: '600' }}>{reg.name}</span>
                            <span style={{ color: '#a78bfa', fontSize: '0.8rem', fontWeight: '800' }}>{reg.activation}</span>
                          </div>
                          <span style={{ color: '#64748b', fontSize: '0.74rem' }}>{reg.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Clinical Description & Recommendation */}
              <div style={{
                backgroundColor: '#0d1117',
                border: '1px solid #ffffff12',
                borderRadius: '14px',
                padding: '1.2rem',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <h4 style={{ color: getStageColor(result.predicted_class), fontSize: '1rem', margin: '0 0 6px 0', fontWeight: '700' }}>
                  📋 Clinical Finding & Morphometry Summary
                </h4>
                <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.6', margin: '0 0 10px 0' }}>
                  {result.description || result.note}
                </p>
                {result.clinical_action && (
                  <div style={{
                    backgroundColor: `${getStageColor(result.predicted_class)}12`,
                    borderLeft: `3px solid ${getStageColor(result.predicted_class)}`,
                    padding: '8px 12px',
                    borderRadius: '4px'
                  }}>
                    <span style={{ color: 'white', fontSize: '0.84rem', fontWeight: '600' }}>
                      Specialist Recommendation: 
                    </span>
                    <span style={{ color: '#e2e8f0', fontSize: '0.84rem', marginLeft: '6px' }}>
                      {result.clinical_action}
                    </span>
                  </div>
                )}
              </div>

              {/* Regional Morphometrics Grid */}
              {result.regional_findings && (
                <div style={{ width: '100%' }}>
                  <p style={{ color: 'white', fontSize: '0.95rem', fontWeight: '700', margin: '0 0 10px 0' }}>
                    🔍 Regional Volumetric Biomarkers
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', width: '100%' }}>
                    {result.regional_findings.map((rf, idx) => (
                      <div key={idx} style={{
                        backgroundColor: '#0d1117',
                        border: '1px solid #ffffff10',
                        borderRadius: '12px',
                        padding: '1rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: '600' }}>{rf.region}</span>
                          <span style={{ color: '#38bdf8', fontSize: '0.78rem', fontWeight: '700' }}>{rf.metric_value}</span>
                        </div>
                        <p style={{ color: 'white', fontSize: '0.85rem', margin: 0, fontWeight: '600' }}>{rf.finding}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-class Probability Breakdown */}
              {result.probabilities && (
                <div style={{ width: '100%' }}>
                  <p style={{ color: 'white', fontSize: '0.95rem', fontWeight: '700', margin: '0 0 10px 0' }}>
                    📊 Multi-Class Staging Probabilities
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    {Object.entries(result.probabilities).map(([cls, prob]) => {
                      const col = getStageColor(cls);
                      const pct = Math.round(prob * 100);
                      return (
                        <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: '#94a3b8', fontSize: '0.82rem', width: '210px', flexShrink: 0 }}>
                            {cls}
                          </span>
                          <div style={{ flex: 1, height: '8px', backgroundColor: '#ffffff10', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: col, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                          </div>
                          <span style={{ color: col, fontSize: '0.82rem', fontWeight: '700', width: '45px', textAlign: 'right' }}>
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Specialist Integration Card */}
              <div style={styles.referralBox}>
                <p style={styles.referralTitle}>🏥 Clinical Specialist Referral Package</p>
                <p style={styles.referralText}>
                  This Level 3 neuroimaging assessment is automatically indexed into your comprehensive MedGemma Clinical Report. You can export this alongside Tier 1 active cognitive scores and Tier 2 CatBoost SHAP drivers for neurologist consultation.
                </p>
              </div>
            </div>

            <div style={styles.actionRow}>
              <button style={styles.retryBtn} onClick={() => { setStep('upload'); setResult(null); setImageURL(null); }}>
                🔄 Upload Another Scan
              </button>
              <button style={styles.dashBtn} onClick={() => navigate('/dashboard')}>
                View Dashboard →
              </button>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
};

const styles = {
  container: { maxWidth: '900px', margin: '0 auto' },
  headerRow: { display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' },
  levelBadge: {
    backgroundColor: '#4338CA18', border: '1px solid #4338CA33',
    color: '#4338CA', fontSize: '0.72rem', fontWeight: '800',
    padding: '0.3rem 0.8rem', borderRadius: '20px', letterSpacing: '0.08em',
    whiteSpace: 'nowrap', marginTop: '4px',
  },
  pageLabel: { color: '#4338CA', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.1em', marginBottom: '0.25rem' },
  pageTitle: { color: '#1e293b', fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', margin: '0 0 0.25rem 0' },
  pageSub: { color: '#64748b', fontSize: '0.88rem', lineHeight: '1.4', maxWidth: '650px', margin: 0 },
  warningBanner: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    backgroundColor: '#fef3c7', border: '1px solid #fde68a',
    borderRadius: '12px', padding: '0.75rem 1rem',
    color: '#92400e', fontSize: '0.82rem', fontWeight: '600', marginBottom: '1.5rem',
  },
  uploadCard: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  dropZone: {
    backgroundColor: '#ffffff', border: '2px dashed #cbd5e1',
    borderRadius: '20px', padding: '3.5rem 2rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
    cursor: 'pointer', transition: 'border-color 0.2s',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
  },
  uploadIcon: { fontSize: '3.5rem' },
  uploadTitle: { color: '#1e293b', fontSize: '1.25rem', fontWeight: '800', margin: 0 },
  uploadSub: { color: '#64748b', fontSize: '0.88rem', margin: 0 },
  uploadHint: { color: '#94a3b8', fontSize: '0.75rem', margin: 0 },
  browseBtn: {
    backgroundColor: '#4338CA', color: 'white',
    border: 'none', borderRadius: '10px',
    padding: '0.75rem 2rem', fontSize: '0.9rem', fontWeight: '700',
    cursor: 'pointer', marginTop: '0.5rem',
    boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
  },
  sampleNote: {
    backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: '12px', padding: '1rem 1.25rem',
  },
  sampleNoteText: { color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 },
  previewCard: {
    backgroundColor: '#ffffff', border: '1px solid #eef2f6',
    borderRadius: '20px', padding: '2rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  },
  cardLabel: { color: '#94a3b8', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.1em' },
  imageWrapper: {
    position: 'relative', borderRadius: '14px', overflow: 'hidden',
    border: '1.5px solid #e2e8f0', width: '100%', maxWidth: '380px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
  },
  mriImage: { width: '100%', display: 'block', borderRadius: '12px' },
  imageScanLine: {
    position: 'absolute', left: 0, right: 0, height: '2px',
    background: 'linear-gradient(90deg, transparent, #4338CA, transparent)',
    animation: 'scanLine 2s linear infinite',
  },
  previewHint: { color: '#4338CA', fontSize: '0.85rem', fontWeight: '700' },
  previewActions: { display: 'flex', gap: '1rem', width: '100%', maxWidth: '380px' },
  reuploadBtn: {
    flex: 1, backgroundColor: '#ffffff', color: '#64748b',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    padding: '0.75rem', fontSize: '0.88rem', fontWeight: '700', cursor: 'pointer',
  },
  analyseBtn: {
    flex: 2, backgroundColor: '#4338CA', color: 'white',
    border: 'none', borderRadius: '10px',
    padding: '0.75rem', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
  },
  analysingCard: {
    backgroundColor: '#ffffff', border: '1px solid #eef2f6',
    borderRadius: '20px', padding: '3.5rem 2rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem',
    textAlign: 'center', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  },
  analysingIcon: { fontSize: '3.5rem' },
  analysingTitle: { color: '#1e293b', fontSize: '1.35rem', fontWeight: '800', margin: 0 },
  analysingSub: { color: '#64748b', fontSize: '0.88rem', margin: 0 },
  resultContainer: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  resultMainCard: {
    backgroundColor: '#ffffff', border: '1px solid #eef2f6',
    borderRadius: '20px', padding: '2rem',
    display: 'flex', flexDirection: 'column', gap: '1.5rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  },
  resultHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' },
  classBadge: { padding: '0.4rem 1.2rem', borderRadius: '20px', fontSize: '0.88rem', fontWeight: '800' },
  cdrPill: {
    backgroundColor: '#f5f3ff', border: '1px solid #c7d2fe',
    color: '#4338CA', fontSize: '0.78rem', fontWeight: '800',
    padding: '0.35rem 0.8rem', borderRadius: '10px',
  },
  findingSection: {
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
    backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: '12px', padding: '1rem 1.25rem',
  },
  findingTitle: { color: '#1e293b', fontSize: '1.1rem', fontWeight: '800', margin: 0 },
  findingDesc: { color: '#475569', fontSize: '0.84rem', lineHeight: '1.5', margin: 0 },
  probBars: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  probRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  probClass: { width: '160px', color: '#475569', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0 },
  probTrack: { flex: 1, height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' },
  probFill: { height: '100%', borderRadius: '4px', transition: 'width 0.8s ease' },
  probVal: { width: '45px', textAlign: 'right', color: '#64748b', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0 },
  morphCard: {
    backgroundColor: '#ffffff', border: '1px solid #eef2f6',
    borderRadius: '20px', padding: '1.75rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  },
  morphTitle: { color: '#1e293b', fontSize: '1.1rem', fontWeight: '800', margin: '0 0 0.25rem 0' },
  morphSub: { color: '#64748b', fontSize: '0.8rem', margin: '0 0 1.25rem 0' },
  morphGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' },
  morphItem: {
    backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: '12px', padding: '1rem',
    display: 'flex', flexDirection: 'column', gap: '0.25rem',
  },
  morphItemLabel: { color: '#64748b', fontSize: '0.74rem', fontWeight: '700' },
  morphItemVal: { fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', margin: '2px 0' },
  morphItemDesc: { color: '#94a3b8', fontSize: '0.72rem' },
  gradCamCard: {
    backgroundColor: '#ffffff', border: '1px solid #eef2f6',
    borderRadius: '20px', padding: '1.75rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  },
  gradCamHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1rem',
  },
  modePillGroup: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    gap: '4px',
  },
  modePill: {
    border: 'none',
    borderRadius: '8px',
    padding: '0.4rem 0.8rem',
    fontSize: '0.78rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  gradCamMainRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.25rem',
    alignItems: 'start',
  },
  gradCamImageCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  gradCamImage: {
    width: '100%',
    maxWidth: '280px',
    aspectRatio: '1/1',
    objectFit: 'cover',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
  },
  gradCamLegend: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '280px',
    gap: '8px',
  },
  legendGradient: {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    background: 'linear-gradient(90deg, #0ea5e9, #6366f1, #ef4444)',
  },
  attentionColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  attentionItem: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  referralBox: {
    backgroundColor: '#f5f3ff', border: '1px solid #c7d2fe',
    borderRadius: '14px', padding: '1.25rem', width: '100%', boxSizing: 'border-box'
  },
  referralTitle: { color: '#4338CA', fontSize: '0.95rem', fontWeight: '800', marginBottom: '0.5rem' },
  referralText: { color: '#475569', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 },
  actionRow: { display: 'flex', gap: '1rem' },
  retryBtn: {
    flex: 1, backgroundColor: '#ffffff', color: '#64748b',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    padding: '0.85rem', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
  },
  dashBtn: {
    flex: 1, backgroundColor: '#4338CA', color: '#ffffff',
    border: 'none', borderRadius: '10px',
    padding: '0.85rem', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
  },
};

export default Level3MRI;
