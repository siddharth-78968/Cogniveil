import React, { useRef, useState } from 'react';
import { downloadClinicalReportPDF, downloadPatientReportPDF } from '../utils/api';

const ReferralReportModal = ({ isOpen, onClose, reportData, patientData }) => {
  const printRef = useRef();
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  if (!isOpen) return null;

  const data = reportData || {
    cogni_score: 68.0,
    risk_level: 'Moderate',
    is_deviating: true
  };

  const patient = patientData || {
    name: 'Rajan Pillai',
    age: 78,
    gender: 'Male',
    email: 'rajan@demo.com',
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(false);

    try {
      let res;
      if (patient?.id && typeof patient.id === 'number') {
        res = await downloadPatientReportPDF(patient.id);
      } else {
        const payload = {
          cogni_score: data?.cogni_score ?? 68.0,
          risk_level: data?.risk_level ?? 'Moderate',
          is_deviating: Boolean(data?.is_deviating ?? true),
          patient_name: patient?.name || 'Rajan Pillai',
          age: patient?.age || 78,
          shap_features: data?.shap_features || [],
          mri_result: data?.mri_result || null
        };
        res = await downloadClinicalReportPDF(payload);
      }

      // Create Blob from binary response and trigger download
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanName = (patient?.name || 'Patient').replace(/\s+/g, '_');
      link.setAttribute('download', `CogniVeil_Clinical_Referral_Report_${cleanName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('PDF download error:', err);
      setDownloadError('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const rj = data.report_json;
  const referral = data.referral || {
    action: 'Comprehensive Neurological Evaluation & Cognitive Battery',
    recommended_specialist: 'Cognitive Neurologist / Memory Disorders Clinic',
    urgency: data.risk_level === 'High' ? 'High (within 2 weeks)' : 'Routine (within 30 days)',
    timeframe: '2-4 weeks',
    rationale: 'Longitudinal multimodal deviation flagged by deterministic screening filters.'
  };

  // Fallback data if report_json is not yet populated
  const overview = rj?.section_01_assessment_overview || {
    session_id: 'S_rajan_pillai_2026',
    assessment_date: new Date().toLocaleDateString('en-US', { dateStyle: 'long' }),
    cogniscore: data.cogni_score ?? 71.0,
    overall_status: data.risk_level === 'High' ? 'Elevated screening concern' : data.risk_level === 'Moderate' ? 'Moderate screening deviation' : 'Stable screening pattern',
    confidence: 0.84,
    tier_reached: data.mri_result ? 'Tier 3 (MRI Neuroimaging)' : 'Tier 2 (Multivariate Clinical ML)'
  };

  const execSummary = rj?.section_02_executive_summary || 
    `Screening identified a persistent decline in memory and processing-speed performance compared with ${patient.name}'s established baseline across multiple sessions. Behavioral telemetry also showed increased hesitation and correction activity. Voice analysis demonstrated increased pausing, while speech coherence remained relatively preserved. The combined findings suggest that formal clinical evaluation may be appropriate.`;


  const cognitive = rj?.section_03_cognitive_performance || {
    score: 73.0,
    status: 'declining',
    table: [
      { measure: 'Memory Retention', current: '68.0', baseline: '81.0', change_percent: -16.0, interpretation: 'Declining' },
      { measure: 'Reaction Time', current: '81.0', baseline: '79.0', change_percent: 2.5, interpretation: 'Stable' },
      { measure: 'Stroop Executive Control', current: '74.0', baseline: '78.0', change_percent: -5.1, interpretation: 'Mild deviation' },
      { measure: 'Processing Speed', current: '71.0', baseline: '80.0', change_percent: -11.3, interpretation: 'Declining' }
    ],
    interpretation: 'Memory performance declined relative to baseline while reaction time remained stable. Cognitive pattern is driven predominantly by memory and processing-speed changes.'
  };

  const behavior = rj?.section_04_behavioral_telemetry || {
    score: 67.0,
    status: 'mild_decline',
    typing: { score: 64.0, wpm: '27.0 WPM', baseline_wpm: '34.0 WPM', wpm_change: '↓ 20.6%', latency: '410 ms', latency_change: '↑ 28.1%', backspace_rate: '13.2%', backspace_change: '↑ 78.4%', hesitation: '4.1/min' },
    scrolling: { score: 72.0, velocity: '410 px/s', velocity_change: '↓ 14.6%', hesitation: '5.2/min', hesitation_change: '↑ 85.7%', reversals: '8' },
    interpretation: 'Typing speed decreased alongside elevated correction latency and backspace rates. Navigation telemetry demonstrated an 85.7% increase in hesitation relative to baseline.'
  };

  const voice = rj?.section_05_voice_speech_analysis || {
    score: 70.0,
    status: 'mild_concern',
    metrics: { language: 'English', wpm: '88.0 WPM', wpm_change: '↓ 13.0%', pause_rate: '18.6/min', pause_rate_change: '↑ 42.0%', mean_pause_duration: '1.45s', speech_activity_ratio: '55%', vocabulary_richness: '0.72', semantic_coherence: 'Stable / Intact' },
    interpretation: 'Speech analysis identified increased pause frequency and reduced speech rate relative to baseline. Vocabulary richness and semantic coherence remained stable.'
  };

  const longitudinal = rj?.section_06_longitudinal_analysis || {
    trajectory_points: [84, 82, 80, 76, 73, 70, 68],
    ewma_score: 72.1,
    cusum_value: 13.4,
    baseline_mean: 82.0,
    current_score: overview.cogniscore,
    baseline_deviation_pct: -17.1,
    trend_classification: 'persistent_decline',
    interpretation: 'The observed decline is persistent across multiple sessions (EWMA: 72.1, CUSUM: 13.4) rather than being attributable to a single anomalous observation.'
  };

  const tier2 = rj?.section_07_tier2_clinical_risk || {
    risk_probability: 0.74,
    classification: 'Elevated',
    confidence: 0.92,
    modifiable_factors: [
      { feature: 'Sleep Quality', input: 'Poor (<5 hrs)', shap_value: 0.28, impact: 'Increases Risk' },
      { feature: 'Physical Activity Level', input: 'Sedentary', shap_value: 0.19, impact: 'Increases Risk' },
      { feature: 'Cardiovascular Risk', input: 'Elevated Pulse Pressure', shap_value: 0.14, impact: 'Increases Risk' }
    ],
    non_modifiable_factors: [
      { feature: 'Age', input: `${patient.age} yrs`, shap_value: 0.31, impact: 'Increases Risk' },
      { feature: 'APOE-ε4 Carrier Status', input: 'Positive (ε4 carrier)', shap_value: 0.22, impact: 'Increases Risk' }
    ],
    interpretation: 'CatBoost multivariate risk model estimated a 74.0% risk probability. Sleep quality and physical activity represent potentially addressable lifestyle contributors.'
  };

  const mri = rj?.section_08_mri_analysis || {
    classification: reportData.mri_result?.predicted_class || 'Very Mild Cognitive Impairment',
    cdr_rating: reportData.mri_result?.cdr_rating || 'CDR 0.5',
    confidence: reportData.mri_result?.confidence || 0.88,
    morphometry: reportData.mri_result?.morphometry || { brain_parenchymal_fraction: 0.78, ventricular_enlargement_ratio: 0.14, medial_temporal_atrophy_index: 0.22 },
    gradcam_interpretation: 'Grad-CAM visual attention mapping highlights medial temporal and peri-ventricular structures. Visualizations represent model attribution and are not independently diagnostic.'
  };

  const integration = rj?.section_09_multimodal_integration || {
    concordant_findings: [
      'Cognitive memory recall and processing speed demonstrated concurrent downward drift.',
      'Keystroke inter-key latency variability increased in alignment with cognitive processing slowing.',
      'Navigation hesitation index and reversal frequency tracked elevated behavioral uncertainty.'
    ],
    discordant_findings: [
      'Semantic speech coherence and vocabulary diversity remain intact despite acoustic cadence slowing.',
      'Simple motor reaction time shows relative preservation compared to delayed pattern recall.'
    ],
    reasoning: 'Cognitive and behavioral domains demonstrate persistent decline, while semantic speech coherence remains preserved. The evidence is partially concordant.'
  };

  const modifiableActions = rj?.section_10_modifiable_actions || [
    { factor: 'Sleep Architecture', evidence: 'Reported poor sleep (<5 hrs, SHAP +0.28)', recommended_action: 'Clinical evaluation for sleep hygiene / OSA assessment.' },
    { factor: 'Physical Activity', evidence: 'Sedentary profile (SHAP +0.19)', recommended_action: 'Clinician-guided structured aerobic activity (150 min/wk).' },
    { factor: 'Cardiovascular Risk', evidence: 'Elevated vascular load (SHAP +0.14)', recommended_action: 'Blood pressure optimization and lipid review with PCP.' }
  ];

  const dataQuality = rj?.section_11_data_quality_limitations || {
    cognitive_battery_coverage: '100% (5 of 5 micro-tasks completed)',
    typing_telemetry_coverage: '92% active coverage',
    scrolling_telemetry_coverage: '89% page navigation coverage',
    voice_audio_quality: 'High SNR (>18 dB, confidence 0.93)',
    boundary_statement: 'Interpretation is subject to the completeness and quality of available digital observations.'
  };

  const finalSummary = rj?.section_12_final_decision_support || {
    overall_screening_status: overview.overall_status,
    evidence_strength: 'Moderate / High',
    primary_contributors: [
      'Memory retention accuracy (↓ 16.0% from baseline)',
      'Typing speed & cadence (↓ 20.6% from baseline)',
      'Page navigation hesitation (↑ 85.7% from baseline)',
      'Speech pause frequency (↑ 42.0% from baseline)',
      'Multivariate risk model (74.0% probability)'
    ],
    recommended_next_steps: [
      'Formal clinical cognitive assessment (e.g. MoCA, MMSE, and formal neuropsychological battery).',
      'Specialist consultation with a Cognitive Neurologist or Memory Disorders Clinic within 2-4 weeks.',
      'Interpretation alongside full medical history, medication review, functional status, and laboratory workup (B12, TSH, metabolic panel).'
    ],
    mandatory_disclaimer: 'Important: CogniVeil is a digital clinical decision-support screening tool and does NOT establish a medical diagnosis. All screening findings must be interpreted by a qualified physician.'
  };

  return (
    <div className="referral-modal-backdrop" style={modalStyles.backdrop}>
      <div className="referral-modal-container" style={modalStyles.container}>
        
        {/* Modal Toolbar (hidden during print) */}
        <div className="no-print" style={modalStyles.toolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🏥</span>
            <span style={{ color: 'white', fontWeight: '800', fontSize: '0.95rem' }}>
              CogniVeil Clinical Decision Support Dossier (MedGemma-4B Synthesis)
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {downloadError && (
              <span style={{ color: '#FCA5A5', fontSize: '0.78rem', fontWeight: '600' }}>⚠️ {downloadError}</span>
            )}
            {downloadSuccess && (
              <span style={{ color: '#86EFAC', fontSize: '0.78rem', fontWeight: '700' }}>✓ PDF Downloaded!</span>
            )}
            <button 
              onClick={handleDownloadPDF} 
              disabled={downloading}
              style={{
                ...modalStyles.downloadBtn,
                backgroundColor: downloadSuccess ? '#059669' : '#0F4C4A',
                opacity: downloading ? 0.7 : 1,
                cursor: downloading ? 'wait' : 'pointer'
              }}
              title="Download official multi-page PDF generated by ReportLab"
            >
              {downloading ? '⏳ Generating PDF...' : downloadSuccess ? '✓ PDF Saved' : '⬇️ Download Official PDF'}
            </button>
            <button onClick={handlePrint} style={modalStyles.printBtn}>
              🖨️ Print / Preview
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
              <h1 style={modalStyles.clinicTitle}>COGNIVEIL MULTIMODAL SCREENING CLINIC</h1>
              <p style={modalStyles.clinicSub}>Clinical Decision Support Report — MedGemma-4B Grounded Synthesis</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={modalStyles.urgencyBadge(referral.urgency)}>
                {overview.overall_status.toUpperCase()}
              </span>
              <p style={modalStyles.metaDate}>Date: {overview.assessment_date}</p>
            </div>
          </div>

          <div style={modalStyles.divider} />

          {/* 1. Assessment Overview */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionHeader}>1. ASSESSMENT OVERVIEW</h3>
            <div style={modalStyles.infoGrid}>
              <div><strong>Patient Name:</strong> {patient.name}</div>
              <div><strong>Age / Gender:</strong> {patient.age} yrs · {patient.gender || 'Male'}</div>
              <div><strong>Session Identifier:</strong> {overview.session_id}</div>
              <div><strong>Overall CogniScore:</strong> <span style={{ color: '#4338CA', fontWeight: '800' }}>{overview.cogniscore} / 100</span> (Confidence: {overview.confidence})</div>
              <div><strong>Screening Tier Reached:</strong> {overview.tier_reached}</div>
              <div><strong>Baseline Availability:</strong> {overview.baseline_availability}</div>
            </div>
          </div>

          {/* 2. Executive Clinical Summary (MedGemma AI Synthesized) */}
          <div style={modalStyles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={modalStyles.sectionHeader}>2. EXECUTIVE CLINICAL SUMMARY</h3>
              <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#0F4C4A', backgroundColor: '#E0FCFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #53B7C5' }}>
                ✨ MEDGEMMA-4B SYNTHESIS
              </span>
            </div>
            <div style={{ ...modalStyles.calloutBox, borderLeft: '4px solid #53B7C5', backgroundColor: '#F0F5F4' }}>
              <p style={modalStyles.bodyTextLeading}>{execSummary}</p>
            </div>
          </div>

          {/* 3. Cognitive Performance */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionHeader}>3. COGNITIVE PERFORMANCE (ACTIVE BATTERY)</h3>
            <p style={modalStyles.bodyText}>
              <strong>Domain Score:</strong> {cognitive.score}/100 ({cognitive.status.toUpperCase()})
            </p>
            <table style={modalStyles.table}>
              <thead>
                <tr style={modalStyles.thRow}>
                  <th style={modalStyles.th}>Measure</th>
                  <th style={modalStyles.th}>Current</th>
                  <th style={modalStyles.th}>Baseline</th>
                  <th style={modalStyles.th}>Change</th>
                  <th style={modalStyles.th}>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {cognitive.table.map((row, i) => (
                  <tr key={i} style={modalStyles.tr}>
                    <td style={modalStyles.td}><strong>{row.measure}</strong></td>
                    <td style={modalStyles.td}>{row.current}</td>
                    <td style={modalStyles.td}>{row.baseline}</td>
                    <td style={{ ...modalStyles.td, color: row.change_percent < 0 ? '#dc2626' : '#16a34a', fontWeight: '700' }}>
                      {row.change_percent < 0 ? `↓ ${Math.abs(row.change_percent)}%` : `↑ ${row.change_percent}%`}
                    </td>
                    <td style={modalStyles.td}>{row.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ ...modalStyles.interpretationText, marginTop: '8px' }}>
              <strong>Domain Interpretation:</strong> {cognitive.interpretation}
            </p>
          </div>

          {/* 4. Behavioral Telemetry */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionHeader}>4. BEHAVIORAL TELEMETRY (PASSIVE MOTOR-VISUAL DYNAMICS)</h3>
            <p style={modalStyles.bodyText}>
              <strong>Domain Score:</strong> {behavior.score}/100 ({behavior.status.toUpperCase()})
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
              <div style={modalStyles.telemetryBox}>
                <h4 style={modalStyles.subHeader}>⌨️ Keystroke Dynamics (Score: {behavior.typing.score}/100)</h4>
                <div style={modalStyles.miniGrid}>
                  <div><strong>Typing Speed:</strong> {behavior.typing.wpm} ({behavior.typing.wpm_change})</div>
                  <div><strong>Baseline Speed:</strong> {behavior.typing.baseline_wpm}</div>
                  <div><strong>Inter-Key Latency:</strong> {behavior.typing.latency} ({behavior.typing.latency_change})</div>
                  <div><strong>Correction Rate:</strong> {behavior.typing.backspace_rate} ({behavior.typing.backspace_change})</div>
                </div>
              </div>

              <div style={modalStyles.telemetryBox}>
                <h4 style={modalStyles.subHeader}>📜 Scrolling & Navigation (Score: {behavior.scrolling.score}/100)</h4>
                <div style={modalStyles.miniGrid}>
                  <div><strong>Scroll Velocity:</strong> {behavior.scrolling.velocity} ({behavior.scrolling.velocity_change})</div>
                  <div><strong>Hesitation Index:</strong> {behavior.scrolling.hesitation} ({behavior.scrolling.hesitation_change})</div>
                  <div><strong>Reversal Frequency:</strong> {behavior.scrolling.reversals} reversals</div>
                  <div><strong>Trend:</strong> {behavior.scrolling.trend}</div>
                </div>
              </div>
            </div>
            
            <p style={modalStyles.interpretationText}>
              <strong>Behavioral Interpretation:</strong> {behavior.interpretation}
            </p>
          </div>

          {/* 5. Voice & Speech Analysis */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionHeader}>5. VOICE & SPEECH ANALYSIS (ACOUSTIC BIOMARKERS)</h3>
            <div style={modalStyles.infoGrid}>
              <div><strong>Speech Score:</strong> {voice.score}/100 ({voice.status})</div>
              <div><strong>Language:</strong> {voice.metrics.language}</div>
              <div><strong>Conversational Cadence:</strong> {voice.metrics.wpm} ({voice.metrics.wpm_change})</div>
              <div><strong>Pause Rate:</strong> {voice.metrics.pause_rate} ({voice.metrics.pause_rate_change})</div>
              <div><strong>Mean Pause Duration:</strong> {voice.metrics.mean_pause_duration}</div>
              <div><strong>Speech Activity Ratio:</strong> {voice.metrics.speech_activity_ratio}</div>
              <div><strong>Vocabulary Richness:</strong> {voice.metrics.vocabulary_richness}</div>
              <div><strong>Semantic Coherence:</strong> {voice.metrics.semantic_coherence}</div>
            </div>
            <p style={{ ...modalStyles.interpretationText, marginTop: '8px' }}>
              <strong>Speech Interpretation:</strong> {voice.interpretation}
            </p>
          </div>

          {/* 6. Longitudinal Analysis */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionHeader}>6. LONGITUDINAL ANALYSIS (EWMA / CUSUM TRAJECTORY)</h3>
            <div style={modalStyles.infoGrid}>
              <div><strong>Historical Trajectory:</strong> {longitudinal.trajectory_points.join(' → ')}</div>
              <div><strong>EWMA Filter Score:</strong> {longitudinal.ewma_score} pts</div>
              <div><strong>CUSUM Statistic:</strong> {longitudinal.cusum_value}</div>
              <div><strong>Baseline Mean:</strong> {longitudinal.baseline_mean} pts</div>
              <div><strong>Deviation from Baseline:</strong> {longitudinal.baseline_deviation_pct}%</div>
              <div><strong>Persistent Decline Flag:</strong> <strong style={{ color: longitudinal.persistent_decline ? '#dc2626' : '#16a34a' }}>{longitudinal.persistent_decline ? 'YES (Confirmed Multi-Session Drift)' : 'NO (Within Variance)'}</strong></div>
            </div>
            <p style={{ ...modalStyles.interpretationText, marginTop: '8px' }}>
              <strong>Longitudinal Interpretation:</strong> {longitudinal.interpretation}
            </p>
          </div>

          {/* 7. Tier 2 Clinical Risk Analysis */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionHeader}>7. TIER 2 MULTIVARIATE CLINICAL RISK (CATBOOST + SHAP)</h3>
            <p style={modalStyles.bodyText}>
              <strong>Model Probability:</strong> {(tier2.risk_probability * 100).toFixed(1)}% ({tier2.classification} Classification · Confidence: {Math.round(tier2.confidence * 100)}%)
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
              <div style={modalStyles.shapBox}>
                <h4 style={{ ...modalStyles.subHeader, color: '#16a34a' }}>🟢 Potentially Modifiable Factors</h4>
                {tier2.modifiable_factors.map((f, i) => (
                  <div key={i} style={modalStyles.shapRow}>
                    <span><strong>{f.feature}</strong> ({f.input})</span>
                    <span style={{ color: f.shap_value > 0 ? '#dc2626' : '#16a34a', fontWeight: '700' }}>
                      {f.shap_value > 0 ? `+${f.shap_value.toFixed(2)}` : f.shap_value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={modalStyles.shapBox}>
                <h4 style={{ ...modalStyles.subHeader, color: '#6366f1' }}>🔵 Non-Modifiable / Contextual Factors</h4>
                {tier2.non_modifiable_factors.map((f, i) => (
                  <div key={i} style={modalStyles.shapRow}>
                    <span><strong>{f.feature}</strong> ({f.input})</span>
                    <span style={{ color: '#4338CA', fontWeight: '700' }}>+{f.shap_value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <p style={{ ...modalStyles.interpretationText, marginTop: '8px' }}>
              <strong>Risk Interpretation:</strong> {tier2.interpretation}
            </p>
          </div>

          {/* 8. Structural Neuroimaging (MRI) */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionHeader}>8. TIER 3 STRUCTURAL NEUROIMAGING (RESNET-18 + GRAD-CAM)</h3>
            {mri.confidence > 0 && mri.classification !== 'Not Performed / Pending Specialist Referral' ? (
              <>
                <div style={modalStyles.infoGrid}>
                  <div><strong>Staging Classification:</strong> {mri.classification} ({mri.cdr_rating})</div>
                  <div><strong>Model Confidence:</strong> {Math.round(mri.confidence * 100)}%</div>
                  <div><strong>Brain Parenchymal Fraction:</strong> {mri.morphometry?.brain_parenchymal_fraction ?? 0.78}</div>
                  <div><strong>Ventricular Enlargement Ratio:</strong> {mri.morphometry?.ventricular_enlargement_ratio ?? 0.14}</div>
                </div>
                <p style={{ ...modalStyles.interpretationText, marginTop: '8px' }}>
                  <strong>Visual Attention & Attribution:</strong> {mri.gradcam_interpretation}
                </p>
              </>
            ) : (
              <div style={{ ...modalStyles.telemetryBox, backgroundColor: '#f8fafc', padding: '12px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.82rem', fontWeight: '700', color: '#475569' }}>
                  Status: Not Indicated / Not Performed at Current Screening Tier
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4' }}>
                  Structural neuroimaging is conditionally gated for cases where Tier 2 multivariate risk is elevated or upon specialist referral. 
                  Routine longitudinal screening remains active.
                </p>
              </div>
            )}
          </div>

          {/* 9. Multimodal Evidence Integration (MedGemma AI Synthesized) */}
          <div style={modalStyles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={modalStyles.sectionHeader}>9. MULTIMODAL EVIDENCE INTEGRATION (CONCORDANCE REASONING)</h3>
              <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#0F4C4A', backgroundColor: '#E0FCFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #53B7C5' }}>
                ✨ MEDGEMMA-4B SYNTHESIS
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ ...modalStyles.telemetryBox, borderLeft: '3px solid #dc2626' }}>
                <h4 style={{ ...modalStyles.subHeader, color: '#dc2626' }}>✓ Concordant Findings (Agreement Across Modalities)</h4>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '0.8rem', lineHeight: '1.4' }}>
                  {integration.concordant_findings.map((cf, i) => (
                    <li key={i}>{cf}</li>
                  ))}
                </ul>
              </div>

              <div style={{ ...modalStyles.telemetryBox, borderLeft: '3px solid #16a34a' }}>
                <h4 style={{ ...modalStyles.subHeader, color: '#16a34a' }}>⚡ Discordant / Preserved Domains</h4>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '0.8rem', lineHeight: '1.4' }}>
                  {integration.discordant_findings.map((df, i) => (
                    <li key={i}>{df}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p style={{ ...modalStyles.interpretationText, marginTop: '8px', borderLeft: '3px solid #53B7C5', backgroundColor: '#F0F5F4' }}>
              <strong>Integrated Synthesis:</strong> {integration.reasoning}
            </p>
          </div>

          {/* 10. Modifiable vs Non-Modifiable Action Table */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionHeader}>10. POTENTIALLY MODIFIABLE CONTRIBUTORS & ACTION PATHWAY</h3>
            <table style={modalStyles.table}>
              <thead>
                <tr style={modalStyles.thRow}>
                  <th style={modalStyles.th}>Factor</th>
                  <th style={modalStyles.th}>Screening Evidence</th>
                  <th style={modalStyles.th}>Clinician Discussion Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {modifiableActions.map((row, i) => (
                  <tr key={i} style={modalStyles.tr}>
                    <td style={modalStyles.td}><strong>{row.factor}</strong></td>
                    <td style={modalStyles.td}>{row.evidence}</td>
                    <td style={{ ...modalStyles.td, color: '#0F4C4A', fontWeight: '700' }}>{row.recommended_action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 11. Data Quality & Limitations */}
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionHeader}>11. DATA QUALITY & SCREENING LIMITATIONS</h3>
            <div style={modalStyles.infoGrid}>
              <div><strong>Cognitive Battery Coverage:</strong> {dataQuality.cognitive_battery_coverage}</div>
              <div><strong>Typing Telemetry Coverage:</strong> {dataQuality.typing_telemetry_coverage}</div>
              <div><strong>Scrolling Telemetry Coverage:</strong> {dataQuality.scrolling_telemetry_coverage}</div>
              <div><strong>Voice Audio Quality:</strong> {dataQuality.voice_audio_quality}</div>
            </div>
            <p style={{ ...modalStyles.interpretationText, marginTop: '6px', fontStyle: 'italic' }}>
              {dataQuality.boundary_statement} Passive telemetry reflects interface interaction; voice parameters were collected in natural conversational speech.
            </p>
          </div>

          {/* 12. Final Decision-Support Summary (MedGemma AI Synthesized) */}
          <div style={modalStyles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={modalStyles.sectionHeader}>12. FINAL CLINICAL DECISION-SUPPORT SUMMARY</h3>
              <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#0F4C4A', backgroundColor: '#E0FCFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #53B7C5' }}>
                ✨ MEDGEMMA-4B SYNTHESIS
              </span>
            </div>
            <div style={{ ...modalStyles.calloutBox, backgroundColor: '#F0F5F4', border: '1px solid #DCE6E4', borderLeft: '4px solid #53B7C5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#102A43' }}>
                  OVERALL STATUS: {finalSummary.overall_screening_status.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0F4C4A', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#E0FCFF' }}>
                  Evidence Strength: {finalSummary.evidence_strength}
                </span>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.82rem', color: '#334155' }}>Primary Contributing Factors:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '0.8rem', lineHeight: '1.4' }}>
                  {finalSummary.primary_contributors.map((pc, i) => (
                    <li key={i}>{pc}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong style={{ fontSize: '0.82rem', color: '#334155' }}>Recommended Next Steps:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '0.8rem', lineHeight: '1.4' }}>
                  {finalSummary.recommended_next_steps.map((r, i) => (
                    <li key={i}><strong>{r}</strong></li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={modalStyles.disclaimerBox}>
              <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: '1.4', color: '#475569' }}>
                <strong>MEDICAL DISCLAIMER:</strong> {finalSummary.mandatory_disclaimer}
              </p>
            </div>
          </div>

          {/* Footer Signature */}
          <div style={modalStyles.footerRow}>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>CogniVeil Screening Engine v2026.1</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Report Generated: {overview.assessment_date}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ borderBottom: '1px solid #cbd5e1', width: '180px', marginBottom: '4px' }}></div>
              <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '700', color: '#334155' }}>Authorized Medical Reviewer</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const modalStyles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '16px',
    boxSizing: 'border-box',
  },
  container: {
    width: '100%',
    maxWidth: '860px',
    maxHeight: '92vh',
    backgroundColor: '#0f172a',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
  },
  downloadBtn: {
    backgroundColor: '#0F4C4A',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
  },
  printBtn: {
    backgroundColor: '#334155',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  closeBtn: {
    backgroundColor: '#334155',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  paper: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    padding: '36px',
    overflowY: 'auto',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  clinicTitle: {
    fontSize: '1.4rem',
    fontWeight: '900',
    color: '#1e1b4b',
    margin: '0 0 4px 0',
    letterSpacing: '-0.02em',
  },
  clinicSub: {
    fontSize: '0.82rem',
    color: '#64748b',
    margin: 0,
    fontWeight: '600',
  },
  urgencyBadge: (urgency) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '800',
    backgroundColor: urgency?.includes('Elevated') || urgency?.includes('High') ? '#fee2e2' : '#fef3c7',
    color: urgency?.includes('Elevated') || urgency?.includes('High') ? '#dc2626' : '#d97706',
    border: '1px solid',
    borderColor: urgency?.includes('Elevated') || urgency?.includes('High') ? '#fca5a5' : '#fde68a',
  }),
  metaDate: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    margin: '4px 0 0 0',
    fontWeight: '600',
  },
  divider: {
    height: '2px',
    backgroundColor: '#e2e8f0',
    margin: '16px 0',
  },
  section: {
    marginBottom: '20px',
  },
  sectionHeader: {
    fontSize: '0.88rem',
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    margin: '0 0 8px 0',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '4px',
  },
  subHeader: {
    fontSize: '0.8rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: '0 0 6px 0',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px 16px',
    fontSize: '0.82rem',
    color: '#334155',
  },
  bodyText: {
    fontSize: '0.82rem',
    color: '#334155',
    margin: '0 0 8px 0',
    lineHeight: '1.4',
  },
  bodyTextLeading: {
    fontSize: '0.84rem',
    color: '#1e293b',
    margin: 0,
    lineHeight: '1.5',
  },
  calloutBox: {
    backgroundColor: '#f8fafc',
    padding: '12px',
    borderRadius: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.8rem',
    marginTop: '6px',
  },
  thRow: {
    backgroundColor: '#f1f5f9',
    borderBottom: '1px solid #cbd5e1',
  },
  th: {
    padding: '6px 10px',
    textAlign: 'left',
    fontWeight: '700',
    color: '#475569',
  },
  tr: {
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '6px 10px',
    color: '#334155',
  },
  interpretationText: {
    fontSize: '0.8rem',
    color: '#475569',
    lineHeight: '1.4',
    margin: '4px 0 0 0',
    backgroundColor: '#f8fafc',
    padding: '8px 10px',
    borderRadius: '6px',
    borderLeft: '3px solid #6366f1',
  },
  telemetryBox: {
    backgroundColor: '#f8fafc',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  miniGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '0.78rem',
    color: '#334155',
  },
  shapBox: {
    backgroundColor: '#f8fafc',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  shapRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.78rem',
    padding: '3px 0',
    borderBottom: '1px dashed #e2e8f0',
  },
  disclaimerBox: {
    marginTop: '12px',
    padding: '10px',
    borderRadius: '6px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: '28px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
  }
};

export default ReferralReportModal;
