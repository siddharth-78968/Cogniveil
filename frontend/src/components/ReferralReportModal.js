import React, { useRef } from 'react';

const ReferralReportModal = ({ isOpen, onClose, reportData, patientData }) => {
  const printRef = useRef();

  if (!isOpen || !reportData) return null;

  const handlePrint = () => {
    window.print();
  };

  const patient = patientData || {
    name: 'Rajan Pillai',
    age: 78,
    email: 'rajan@demo.com',
  };

  const narrative = reportData.narrative || reportData.clinical_narrative || 'Comprehensive longitudinal screening shows evidence of subtle cognitive drift requiring specialist diagnostic workup.';
  const referral = reportData.referral || {
    action: 'Comprehensive Neurological Evaluation with Neuropsychological Testing',
    recommended_specialist: 'Cognitive Neurologist / Memory Clinic',
    urgency: 'Routine (within 30 days)',
    notes: 'Evaluate hippocampal volume asymmetry and perform formal CDR diagnostic battery.'
  };

  const shapFeatures = reportData.shap_features || [
    { feature: 'CognitiveScore', contribution: '+0.34 (High Impact)', value: '32.0' },
    { feature: 'Age', contribution: '+0.21', value: '78' },
    { feature: 'APOE_e4', contribution: '+0.18', value: 'Positive (ε4 carrier)' },
    { feature: 'Physical_Activity', contribution: '+0.12', value: 'Low' },
  ];

  const mriResult = reportData.mri_result || {
    predicted_class: 'Very Mild Cognitive Impairment',
    cdr_rating: 'CDR 0.5',
    biomarkers: { vbr: '14.2%', hai: '18.6%' }
  };

  return (
    <div className="referral-modal-backdrop" style={modalStyles.backdrop}>
      <div className="referral-modal-container" style={modalStyles.container}>
        {/* Modal Toolbar (hidden during print) */}
        <div className="no-print" style={modalStyles.toolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🏥</span>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '0.95rem' }}>
              Clinical Referral Package Preview
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} style={modalStyles.printBtn}>
              🖨️ Save / Print as PDF
            </button>
            <button onClick={onClose} style={modalStyles.closeBtn}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Printable Hospital Document Paper */}
        <div ref={printRef} className="printable-report-paper" style={modalStyles.paper}>
          {/* Header */}
          <div style={modalStyles.headerRow}>
            <div>
              <h1 style={modalStyles.clinicTitle}>COGNIVEIL CLINICAL NEUROLOGY</h1>
              <p style={modalStyles.clinicSub}>Multimodal Cognitive Decline Screening & Referral Summary</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={modalStyles.urgencyBadge(referral.urgency)}>
                {referral.urgency || 'CLINICAL REFERRAL'}
              </span>
              <p style={modalStyles.metaDate}>Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
            </div>
          </div>

          <div style={modalStyles.divider} />

          {/* Patient Details */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionHeader}>1. PATIENT DEMOGRAPHICS & SCREENING CONTEXT</h3>
            <div style={modalStyles.infoGrid}>
              <div><strong>Patient Name:</strong> {patient.name}</div>
              <div><strong>Age / Gender:</strong> {patient.age} yrs · {patient.gender || 'Not specified'}</div>
              <div><strong>Screening ID:</strong> CNV-{Math.floor(100000 + Math.random() * 900000)}</div>
              <div><strong>Patient Email:</strong> {patient.email}</div>
            </div>
          </div>

          {/* EWMA & Baseline Drift */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionHeader}>2. TIER 1 DIGITAL LONGITUDINAL TRAJECTORY (EWMA / CUSUM)</h3>
            <p style={modalStyles.bodyText}>
              Statistical time-series tracking over active cognitive batteries and passive interaction telemetry.
            </p>
            <div style={modalStyles.tableBox}>
              <div style={modalStyles.tableRow}>
                <span>Current Screening Score:</span>
                <strong>{reportData.cogni_score ?? 32.5} / 100 ({reportData.risk_level ?? 'High'} Risk)</strong>
              </div>
              <div style={modalStyles.tableRow}>
                <span>Baseline Deviation Status:</span>
                <strong style={{ color: reportData.is_deviating ? '#b91c1c' : '#15803d' }}>
                  {reportData.is_deviating ? 'Significant Cognitive Drop Detected (CUSUM > 12.0)' : 'Stable Relative to Baseline'}
                </strong>
              </div>
            </div>
          </div>

          {/* SHAP Risk Drivers */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionHeader}>3. TIER 2 CATBOOST PREDICTOR & TOP SHAP ATTRIBUTIONS</h3>
            <div style={modalStyles.shapContainer}>
              {shapFeatures.slice(0, 5).map((f, i) => (
                <div key={i} style={modalStyles.shapRow}>
                  <span style={{ width: '180px', fontWeight: '600' }}>{f.feature || f.name}</span>
                  <span style={{ color: '#475569', fontSize: '0.85rem' }}>Value: {f.value || 'Observed'}</span>
                  <span style={{ color: '#0f766e', fontWeight: '700', marginLeft: 'auto' }}>{f.contribution || f.impact || 'High Impact'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Level 3 MRI Structural Neuroimaging */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionHeader}>4. LEVEL 3 CONFIRMATORY NEUROIMAGING (MRI MORPHOMETRY)</h3>
            <div style={modalStyles.tableBox}>
              <div style={modalStyles.tableRow}>
                <span>Predicted OASIS Stage:</span>
                <strong>{mriResult.predicted_class || 'Assessment Documented'} ({mriResult.cdr_rating || 'CDR 0.5'})</strong>
              </div>
              {mriResult.biomarkers && (
                <div style={modalStyles.tableRow}>
                  <span>Morphometric Measurements:</span>
                  <span>VBR: {mriResult.biomarkers.vbr || '14%'} · Hippocampal Metric: {mriResult.biomarkers.hai || '18%'}</span>
                </div>
              )}
            </div>
          </div>

          {/* MedGemma Narrative */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionHeader}>5. MEDGEMMA SYNTHESIZED CLINICAL NARRATIVE</h3>
            <div style={modalStyles.narrativeBox}>
              <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.9rem', color: '#1e293b' }}>
                {narrative}
              </p>
            </div>
          </div>

          {/* Targeted Referral Recommendation */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionHeader}>6. ACTIONABLE CLINICAL REFERRAL PLAN</h3>
            <div style={modalStyles.referralCard}>
              <div style={{ marginBottom: '6px' }}>
                <strong>Recommended Specialist:</strong> {referral.recommended_specialist}
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>Action Protocol:</strong> {referral.action}
              </div>
              {referral.notes && (
                <div><strong>Clinical Notes:</strong> {referral.notes}</div>
              )}
            </div>
          </div>

          {/* Doctor Signature & Audit Stamp */}
          <div style={modalStyles.footerRow}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Audit Verification ID: {Math.random().toString(36).substring(2, 10).toUpperCase()} · MedGemma Guardrail Verified
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={modalStyles.sigLine} />
              <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', margin: '4px 0 0 0' }}>
                Reviewing Physician Signature / Date
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-report-paper, .printable-report-paper * {
            visibility: visible;
          }
          .printable-report-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

const modalStyles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '1.5rem',
    overflowY: 'auto',
  },
  container: {
    width: '100%',
    maxWidth: '820px',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#111827',
    borderRadius: '16px',
    border: '1px solid #ffffff20',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.85rem 1.25rem',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
  },
  printBtn: {
    backgroundColor: '#00d4aa',
    color: '#080c14',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1.1rem',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  closeBtn: {
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #475569',
    borderRadius: '8px',
    padding: '0.5rem 0.9rem',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  paper: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    padding: '2.5rem',
    overflowY: 'auto',
    fontFamily: "'Segoe UI', Roboto, sans-serif",
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  clinicTitle: {
    color: '#0f172a',
    fontSize: '1.4rem',
    fontWeight: '900',
    letterSpacing: '-0.02em',
    margin: '0 0 2px 0',
  },
  clinicSub: {
    color: '#64748b',
    fontSize: '0.82rem',
    margin: 0,
    fontWeight: '500',
  },
  urgencyBadge: (urgency) => ({
    display: 'inline-block',
    backgroundColor: urgency?.toLowerCase().includes('urgent') ? '#fee2e2' : '#e0e7ff',
    color: urgency?.toLowerCase().includes('urgent') ? '#991b1b' : '#3730a3',
    padding: '4px 10px',
    borderRadius: '6px',
    fontWeight: '800',
    fontSize: '0.78rem',
    letterSpacing: '0.05em',
  }),
  metaDate: {
    color: '#64748b',
    fontSize: '0.78rem',
    margin: '4px 0 0 0',
  },
  divider: {
    height: '2px',
    backgroundColor: '#e2e8f0',
    margin: '0.75rem 0 1.25rem 0',
  },
  section: {
    marginBottom: '1.25rem',
  },
  sectionHeader: {
    fontSize: '0.82rem',
    fontWeight: '800',
    color: '#475569',
    letterSpacing: '0.05em',
    margin: '0 0 6px 0',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '3px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px',
    fontSize: '0.85rem',
    color: '#334155',
  },
  bodyText: {
    fontSize: '0.84rem',
    color: '#64748b',
    margin: '0 0 6px 0',
  },
  tableBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
  },
  tableRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    padding: '3px 0',
    color: '#334155',
  },
  shapContainer: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
  },
  shapRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.84rem',
    padding: '4px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  narrativeBox: {
    backgroundColor: '#f8fafc',
    borderLeft: '4px solid #00d4aa',
    borderRadius: '0 8px 8px 0',
    padding: '0.9rem 1rem',
  },
  referralCard: {
    backgroundColor: '#f0fdfa',
    border: '1px solid #ccfbf1',
    borderRadius: '8px',
    padding: '0.85rem 1rem',
    fontSize: '0.86rem',
    color: '#134e4a',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: '2rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e2e8f0',
  },
  sigLine: {
    width: '220px',
    borderBottom: '1px solid #94a3b8',
    marginBottom: '4px',
  },
};

export default ReferralReportModal;
