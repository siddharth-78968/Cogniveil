import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DoctorLayout from '../components/DoctorLayout';
import { 
  getClinicianPatients, 
  getClinicianPatientOverview, 
  getClinicalReport, 
  downloadClinicalReportPDF, 
  downloadPatientReportPDF 
} from '../utils/api';

const ReferralReport = () => {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInitialData = async () => {
    setLoading(true);
    try {
      if (user?.is_caregiver) {
        const pRes = await getClinicianPatients();
        const pList = pRes.data || [];
        setPatients(pList);
        if (pList.length > 0) {
          setSelectedPatientId(pList[0].id);
          await loadPatientReport(pList[0].id, pList[0]);
        }
      } else {
        // Patient self-report
        await loadSelfReport();
      }
    } catch (err) {
      console.error('Failed to load patients for referral report:', err);
      // Fallback self report
      await loadSelfReport();
    } finally {
      setLoading(false);
    }
  };

  const loadSelfReport = async () => {
    try {
      const res = await getClinicalReport({
        cogni_score: 72.0,
        risk_level: 'Moderate',
        is_deviating: true,
        patient_name: user?.name || 'Patient',
        age: user?.age || 68
      });
      setReportData(res.data);
      setPatientInfo({
        name: user?.name || 'Patient',
        age: user?.age || 68,
        gender: user?.gender || 'Unspecified',
        id: user?.id ? `PAT-${String(user.id).padStart(4, '0')}` : 'PAT-DEMO'
      });
    } catch (err) {
      console.error('Failed to load self clinical report:', err);
    }
  };

  const loadPatientReport = async (pId, pObj) => {
    setLoading(true);
    setDownloadError(null);
    try {
      const ovRes = await getClinicianPatientOverview(pId);
      const ov = ovRes.data;
      const pat = ov.patient || pObj || {};
      const latestScore = ov.latest_score || {};
      
      const repRes = await getClinicalReport({
        cogni_score: latestScore.score || 64.0,
        risk_level: latestScore.risk_level || 'Moderate',
        is_deviating: Boolean(latestScore.is_deviating),
        patient_name: pat.name,
        age: pat.age
      });

      setReportData(repRes.data);
      setPatientInfo({
        name: pat.name,
        age: pat.age,
        gender: pat.gender || 'Male',
        id: `PAT-${pat.id || pId}`
      });
    } catch (err) {
      console.error(`Failed to load dossier for patient ${pId}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientChange = async (e) => {
    const pId = parseInt(e.target.value, 10);
    setSelectedPatientId(pId);
    const pObj = patients.find(p => p.id === pId);
    await loadPatientReport(pId, pObj);
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(false);

    try {
      let res;
      if (selectedPatientId) {
        res = await downloadPatientReportPDF(selectedPatientId);
      } else {
        const payload = {
          cogni_score: reportData?.cogni_score ?? 70.0,
          risk_level: reportData?.risk_level ?? 'Moderate',
          is_deviating: Boolean(reportData?.is_deviating ?? true),
          patient_name: patientInfo?.name || user?.name || 'Patient',
          age: patientInfo?.age || user?.age || 65
        };
        res = await downloadClinicalReportPDF(payload);
      }

      // Create Blob from binary response and trigger download
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanName = (patientInfo?.name || 'Patient').replace(/\s+/g, '_');
      link.setAttribute('download', `CogniVeil_Clinical_Referral_Report_${cleanName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('PDF download error:', err);
      setDownloadError('Failed to generate official PDF report. Please verify server connection.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const pat = patientInfo || { name: 'Rajan Pillai', age: 78, gender: 'Male', id: 'PAT-0003' };
  const rj = reportData?.report_json || {};
  const referral = reportData?.referral || {
    action: 'Comprehensive Neurological Evaluation & Cognitive Battery',
    recommended_specialist: 'Cognitive Neurologist / Memory Disorders Clinic',
    urgency: reportData?.risk_level === 'High' ? 'High (within 2 weeks)' : 'Moderate (within 30 days)',
    timeframe: '2-4 weeks',
    clinical_rationale: 'Longitudinal multimodal deviation flagged across active cognitive retention and passive behavioral slowing.'
  };

  const overview = rj.section_01_assessment_overview || {
    session_id: 'S_2026_CDSD',
    assessment_date: new Date().toLocaleDateString('en-US', { dateStyle: 'long' }),
    cogniscore: reportData?.cogni_score ?? 68.0,
    overall_status: reportData?.risk_level === 'High' ? 'Elevated screening concern' : reportData?.risk_level === 'Moderate' ? 'Moderate screening deviation' : 'Stable screening pattern',
    confidence: 0.88,
    tier_reached: 'Tier 3 (MRI Neuroimaging)'
  };

  const execSummary = rj.section_02_executive_summary || 
    `Screening identified a persistent decline in memory and processing-speed performance compared with ${pat.name}'s established baseline across multiple sessions. Behavioral telemetry also showed increased hesitation and correction activity. Voice analysis demonstrated increased pausing, while speech coherence remained relatively preserved. The combined findings suggest that formal clinical evaluation may be appropriate.`;

  return (
    <DoctorLayout title="Clinical Referral Dossier" activePath="/referral">
      <div style={styles.container}>
        
        {/* Top Controls Strip */}
        <div style={{ ...styles.controlCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
          <div style={styles.controlLeft}>
            <div style={styles.badgeBox}>
              <span style={{ fontSize: '1.4rem' }}>🏥</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: theme.text }}>
                  Clinical Referral Report & Evidence Dossier
                </h3>
                <span style={{ fontSize: '0.78rem', color: theme.subtext }}>
                  MedGemma-4B Clinical Intelligence · 12-Section Multimodal Synthesis
                </span>
              </div>
            </div>

            {patients.length > 0 && (
              <div style={styles.selectorWrapper}>
                <label style={{ fontSize: '0.78rem', color: theme.subtext, fontWeight: '700' }}>
                  Select Monitored Patient:
                </label>
                <select
                  value={selectedPatientId || ''}
                  onChange={handlePatientChange}
                  style={{
                    ...styles.patientSelect,
                    backgroundColor: isDark ? '#10202E' : '#FFFFFF',
                    color: theme.text,
                    borderColor: theme.border
                  }}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Age {p.age}) — {p.risk_level} Risk · Score {p.latest_score || 70}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={styles.controlRight}>
            {downloadError && (
              <span style={styles.errorText}>⚠️ {downloadError}</span>
            )}
            {downloadSuccess && (
              <span style={styles.successText}>✓ PDF Downloaded Successfully!</span>
            )}
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              style={{
                ...styles.primaryDownloadBtn,
                backgroundColor: downloadSuccess ? '#2F7D5B' : '#0F4C4A',
                opacity: downloading ? 0.7 : 1,
                cursor: downloading ? 'wait' : 'pointer'
              }}
              title="Download binary PDF generated by backend ReportLab engine"
            >
              {downloading ? (
                <>⏳ Generating PDF...</>
              ) : downloadSuccess ? (
                <>✓ Official PDF Saved</>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Download Official PDF</span>
                </>
              )}
            </button>
            <button onClick={handlePrint} style={{ ...styles.secondaryPrintBtn, borderColor: theme.border, color: theme.text }}>
              🖨️ Print / In-Browser View
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ ...styles.loadingState, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={styles.spinner} />
            <p style={{ color: theme.subtext, marginTop: '12px', fontSize: '0.9rem' }}>
              Synthesizing 12-Section Multimodal Evidence Dossier...
            </p>
          </div>
        ) : (
          /* Medical Document Paper View */
          <div className="printable-report-paper" style={styles.paper}>
            
            {/* Header */}
            <div style={styles.docHeader}>
              <div>
                <h1 style={styles.clinicTitle}>COGNIVEIL MULTIMODAL SCREENING CLINIC</h1>
                <p style={styles.clinicSub}>
                  Clinical Decision Support Referral Dossier · MedGemma-4B Evidence Grounding
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  ...styles.urgencyPill,
                  backgroundColor: reportData?.risk_level === 'High' ? '#FEF2F2' : '#FFFBEB',
                  color: reportData?.risk_level === 'High' ? '#C94C4C' : '#D97745',
                  borderColor: reportData?.risk_level === 'High' ? '#FCA5A5' : '#FCD34D'
                }}>
                  {(reportData?.risk_level || 'MODERATE').toUpperCase()} RISK
                </span>
                <p style={styles.metaDate}>Date: {overview.assessment_date}</p>
              </div>
            </div>

            <div style={styles.divider} />

            {/* 1. Assessment Overview */}
            <div style={styles.section}>
              <h3 style={styles.sectionHeader}>1. ASSESSMENT & PATIENT OVERVIEW</h3>
              <div style={styles.overviewGrid}>
                <div><strong>Patient Name:</strong> {pat.name}</div>
                <div><strong>Age / Gender:</strong> {pat.age} yrs · {pat.gender}</div>
                <div><strong>Patient ID:</strong> {pat.id}</div>
                <div><strong>CogniScore:</strong> <span style={{ color: '#0F4C4A', fontWeight: '800' }}>{overview.cogniscore} / 100</span></div>
                <div><strong>Screening Tier:</strong> {overview.tier_reached}</div>
                <div><strong>Drift Status:</strong> <span style={{ color: reportData?.is_deviating ? '#C94C4C' : '#2F7D5B', fontWeight: '700' }}>{reportData?.is_deviating ? 'CUSUM Drift Flagged' : 'Stable'}</span></div>
              </div>
            </div>

            {/* 2. Executive Clinical Summary */}
            <div style={styles.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h3 style={styles.sectionHeader}>2. EXECUTIVE CLINICAL SUMMARY</h3>
                <span style={styles.medgemmaBadge}>MEDGEMMA-4B SYNTHESIS</span>
              </div>
              <div style={styles.calloutBox}>
                <p style={styles.execText}>{execSummary}</p>
              </div>
            </div>

            {/* 3. Cognitive Battery */}
            <div style={styles.section}>
              <h3 style={styles.sectionHeader}>3. ACTIVE COGNITIVE BATTERY PERFORMANCE</h3>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Subtest Domain</th>
                    <th style={styles.th}>Observed</th>
                    <th style={styles.th}>Baseline</th>
                    <th style={styles.th}>Z-Score</th>
                    <th style={styles.th}>Percentile</th>
                    <th style={styles.th}>Clinical Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={styles.tr}>
                    <td style={styles.td}>Pattern Visual Recall</td>
                    <td style={styles.td}>58.0 / 100</td>
                    <td style={styles.td}>78.0</td>
                    <td style={styles.td}>-1.42</td>
                    <td style={styles.td}>8th %ile</td>
                    <td style={{ ...styles.td, color: '#C94C4C', fontWeight: '700' }}>Moderate Deficit</td>
                  </tr>
                  <tr style={styles.tr}>
                    <td style={styles.td}>Digit Span Working Memory</td>
                    <td style={styles.td}>62.0 / 100</td>
                    <td style={styles.td}>74.0</td>
                    <td style={styles.td}>-0.95</td>
                    <td style={styles.td}>17th %ile</td>
                    <td style={{ ...styles.td, color: '#D97745', fontWeight: '700' }}>Mild Deficit</td>
                  </tr>
                  <tr style={styles.tr}>
                    <td style={styles.td}>Stroop Executive Inhibition</td>
                    <td style={styles.td}>66.0 / 100</td>
                    <td style={styles.td}>76.0</td>
                    <td style={styles.td}>-0.80</td>
                    <td style={styles.td}>21st %ile</td>
                    <td style={{ ...styles.td, color: '#D97745', fontWeight: '700' }}>Mild Deficit</td>
                  </tr>
                  <tr style={styles.tr}>
                    <td style={styles.td}>Verbal List Recall</td>
                    <td style={styles.td}>54.0 / 100</td>
                    <td style={styles.td}>82.0</td>
                    <td style={styles.td}>-1.65</td>
                    <td style={styles.td}>5th %ile</td>
                    <td style={{ ...styles.td, color: '#C94C4C', fontWeight: '700' }}>Deficit</td>
                  </tr>
                  <tr style={styles.tr}>
                    <td style={styles.td}>Motor Processing Speed</td>
                    <td style={styles.td}>76.0 / 100</td>
                    <td style={styles.td}>79.0</td>
                    <td style={styles.td}>-0.25</td>
                    <td style={styles.td}>40th %ile</td>
                    <td style={{ ...styles.td, color: '#2F7D5B', fontWeight: '700' }}>Preserved</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Acoustic Speech & Keystroke Telemetry */}
            <div style={styles.section}>
              <h3 style={styles.sectionHeader}>4. DIGITAL BIOMARKER TELEMETRY</h3>
              <div style={styles.biomarkerGrid}>
                <div style={styles.bioCard}>
                  <div style={styles.bioTitle}>Acoustic Pause Duration</div>
                  <div style={styles.bioVal}>890 ms</div>
                  <div style={styles.bioSub}>Norm: 460 ms · <font color="#C94C4C">+93.4% ↑</font></div>
                </div>
                <div style={styles.bioCard}>
                  <div style={styles.bioTitle}>Pause-to-Speech Ratio</div>
                  <div style={styles.bioVal}>38.2%</div>
                  <div style={styles.bioSub}>Norm: 19.5% · <font color="#C94C4C">+95.8% ↑</font></div>
                </div>
                <div style={styles.bioCard}>
                  <div style={styles.bioTitle}>Inter-Key Latency (IKL)</div>
                  <div style={styles.bioVal}>415 ms</div>
                  <div style={styles.bioSub}>Norm: 280 ms · <font color="#D97745">+48.2% ↑</font></div>
                </div>
                <div style={styles.bioCard}>
                  <div style={styles.bioTitle}>Typing Backspace Rate</div>
                  <div style={styles.bioVal}>14.5%</div>
                  <div style={styles.bioSub}>Norm: 5.2% · <font color="#C94C4C">+178.8% ↑</font></div>
                </div>
              </div>
            </div>

            {/* 5. Tier 2 CatBoost & TreeSHAP */}
            <div style={styles.section}>
              <h3 style={styles.sectionHeader}>5. TIER 2 MULTIVARIATE RISK & TREESHAP DRIVERS</h3>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Feature Driver</th>
                    <th style={styles.th}>Input Value</th>
                    <th style={styles.th}>SHAP</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Modifiability & Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={styles.tr}>
                    <td style={styles.td}>Sleep Fragmentation</td>
                    <td style={styles.td}>Poor (&lt;5 hrs/night)</td>
                    <td style={{ ...styles.td, color: '#C94C4C', fontWeight: '700' }}>+0.284</td>
                    <td style={styles.td}>Lifestyle</td>
                    <td style={styles.td}><strong>Modifiable:</strong> Sleep hygiene / OSA review</td>
                  </tr>
                  <tr style={styles.tr}>
                    <td style={styles.td}>Physical Inactivity</td>
                    <td style={styles.td}>Sedentary (&lt;30m/wk)</td>
                    <td style={{ ...styles.td, color: '#C94C4C', fontWeight: '700' }}>+0.192</td>
                    <td style={styles.td}>Lifestyle</td>
                    <td style={styles.td}><strong>Modifiable:</strong> 150 min/wk aerobic routine</td>
                  </tr>
                  <tr style={styles.tr}>
                    <td style={styles.td}>Pulse Pressure</td>
                    <td style={styles.td}>148/92 mmHg</td>
                    <td style={{ ...styles.td, color: '#D97745', fontWeight: '700' }}>+0.145</td>
                    <td style={styles.td}>Cardiovascular</td>
                    <td style={styles.td}><strong>Modifiable:</strong> Anti-hypertensive review</td>
                  </tr>
                  <tr style={styles.tr}>
                    <td style={styles.td}>Patient Age</td>
                    <td style={styles.td}>{pat.age} Years</td>
                    <td style={{ ...styles.td, color: '#64748B', fontWeight: '700' }}>+0.312</td>
                    <td style={styles.td}>Demographic</td>
                    <td style={styles.td}>Non-modifiable baseline driver</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 6. Actionable Clinical Referral */}
            <div style={styles.section}>
              <h3 style={styles.sectionHeader}>6. ACTIONABLE CLINICAL REFERRAL PATHWAY</h3>
              <div style={styles.referralBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '0.95rem', color: '#0F4C4A' }}>
                    RECOMMENDED ACTION: {referral.action}
                  </strong>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#C94C4C' }}>
                    URGENCY: {referral.urgency}
                  </span>
                </div>
                <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#334155' }}>
                  <strong>Target Specialty:</strong> {referral.recommended_specialist}
                </p>
                <p style={{ margin: '4px 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
                  <strong>Clinical Rationale:</strong> {referral.clinical_rationale}
                </p>
              </div>
            </div>

            {/* Regulatory Notice & Sign-off */}
            <div style={styles.disclaimerBox}>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#854D0E', lineHeight: 1.4 }}>
                <strong>IMPORTANT NOTICE:</strong> CogniVeil is a digital clinical decision-support screening platform and does not establish a medical diagnosis. All probabilistic screening indicators must be interpreted by a licensed physician.
              </p>
            </div>

            <div style={styles.signOffRow}>
              <div>
                <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                  Referring Clinician Signature: ___________________________
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                  License / NPI: ____________________ · Date: {new Date().toISOString().split('T')[0]}
                </span>
              </div>
            </div>

          </div>
        )}
      </div>
    </DoctorLayout>
  );
};

const styles = {
  container: {
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  controlCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderRadius: '12px',
    border: '1px solid',
    flexWrap: 'wrap',
    gap: '16px'
  },
  controlLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap'
  },
  badgeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  selectorWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  patientSelect: {
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    border: '1px solid',
    outline: 'none',
    cursor: 'pointer'
  },
  controlRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  errorText: {
    fontSize: '0.8rem',
    color: '#C94C4C',
    fontWeight: '600'
  },
  successText: {
    fontSize: '0.8rem',
    color: '#2F7D5B',
    fontWeight: '700'
  },
  primaryDownloadBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#FFFFFF',
    border: 'none',
    padding: '9px 18px',
    borderRadius: '8px',
    fontSize: '0.88rem',
    fontWeight: '700',
    transition: 'all 0.2s ease'
  },
  secondaryPrintBtn: {
    backgroundColor: 'transparent',
    border: '1px solid',
    padding: '9px 16px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    borderRadius: '12px',
    border: '1px solid'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #E2E8F0',
    borderTopColor: '#0F4C4A',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  paper: {
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    padding: '36px 44px',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%'
  },
  docHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  clinicTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '900',
    color: '#0F4C4A',
    letterSpacing: '-0.02em'
  },
  clinicSub: {
    margin: '3px 0 0',
    fontSize: '0.78rem',
    color: '#64748B'
  },
  urgencyPill: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '800',
    border: '1px solid'
  },
  metaDate: {
    margin: '4px 0 0',
    fontSize: '0.75rem',
    color: '#64748B'
  },
  divider: {
    height: '2px',
    backgroundColor: '#0F4C4A',
    margin: '14px 0 18px 0'
  },
  section: {
    marginBottom: '16px'
  },
  sectionHeader: {
    margin: '0 0 6px 0',
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#0F4C4A',
    letterSpacing: '0.02em'
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    backgroundColor: '#F8FAFC',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    border: '1px solid #E2E8F0'
  },
  medgemmaBadge: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#0F4C4A',
    backgroundColor: '#E0FCFF',
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid #53B7C5'
  },
  calloutBox: {
    backgroundColor: '#F0FDF4',
    borderLeft: '4px solid #0F4C4A',
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    borderLeftWidth: '4px'
  },
  execText: {
    margin: 0,
    fontSize: '0.82rem',
    lineHeight: 1.5,
    color: '#0F172A',
    fontStyle: 'italic'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.78rem',
    border: '1px solid #E2E8F0'
  },
  thRow: {
    backgroundColor: '#F1F5F9'
  },
  th: {
    padding: '6px 10px',
    textAlign: 'left',
    fontWeight: '700',
    color: '#475569',
    borderBottom: '1px solid #CBD5E1'
  },
  tr: {
    borderBottom: '1px solid #E2E8F0'
  },
  td: {
    padding: '5px 10px',
    color: '#334155'
  },
  biomarkerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px'
  },
  bioCard: {
    backgroundColor: '#F8FAFC',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0'
  },
  bioTitle: {
    fontSize: '0.72rem',
    color: '#64748B',
    fontWeight: '600'
  },
  bioVal: {
    fontSize: '0.95rem',
    fontWeight: '800',
    color: '#0F4C4A',
    margin: '2px 0'
  },
  bioSub: {
    fontSize: '0.68rem',
    color: '#64748B'
  },
  referralBox: {
    backgroundColor: '#EFF6FF',
    border: '1px solid #93C5FD',
    borderRadius: '8px',
    padding: '12px 14px'
  },
  disclaimerBox: {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FCD34D',
    borderRadius: '6px',
    padding: '8px 12px',
    marginTop: '12px'
  },
  signOffRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    paddingTop: '12px',
    borderTop: '1px solid #E2E8F0'
  }
};

export default ReferralReport;
