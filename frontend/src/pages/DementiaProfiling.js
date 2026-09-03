import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import DoctorLayout from '../components/DoctorLayout';
import { getClinicianPatients, getClinicianPatientDementiaProfile } from '../utils/api';

const DementiaProfiling = () => {
  const { theme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Patients Roster State
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Patient State
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Dementia Profile State
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Read ?patientId= query parameter on mount if present
  useEffect(() => {
    fetchCohort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCohort = async () => {
    try {
      setLoadingPatients(true);
      const res = await getClinicianPatients();
      if (Array.isArray(res.data)) {
        setPatients(res.data);
        
        // Check query param
        const params = new URLSearchParams(location.search);
        const qPid = params.get('patientId');
        
        if (qPid) {
          const targetId = parseInt(qPid, 10);
          const found = res.data.find(p => p.id === targetId);
          if (found) {
            handleSelectPatient(found);
            return;
          }
        }
        
        // Default to first patient if none specified
        if (res.data.length > 0 && !selectedPatientId) {
          handleSelectPatient(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching clinician patient cohort:', err.message);
      setErrorMsg('Unable to retrieve authorized patient list.');
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleSelectPatient = async (patient) => {
    if (!patient) return;
    setSelectedPatientId(patient.id);
    setSelectedPatient(patient);
    setErrorMsg(null);
    setLoadingProfile(true);
    
    try {
      const res = await getClinicianPatientDementiaProfile(patient.id);
      setProfile(res.data);
    } catch (err) {
      console.error('Error loading dementia pattern profile:', err.message);
      if (err.response && err.response.status === 403) {
        setErrorMsg('Access Forbidden: Clinician authorization required to view this patient profile.');
      } else {
        setErrorMsg('Failed to load dementia pattern profile for the selected patient.');
      }
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      String(p.id).includes(q)
    );
  });

  const getPatternColor = (key) => {
    switch (key) {
      case 'Alzheimers_like':
        return '#8B5CF6';
      case 'Vascular_like':
        return '#EF4444';
      case 'Lewy_Body_like':
        return '#F59E0B';
      case 'FTD_like':
        return '#06B6D4';
      default:
        return '#10B981';
    }
  };

  const getRiskBadgeColor = (risk) => {
    if (risk === 'High') return '#C94C4C';
    if (risk === 'Moderate') return '#D97745';
    return '#2F7D5B';
  };

  return (
    <DoctorLayout activeTitle="Dementia Type Profiling">
      <div style={styles.container}>
        {/* Header Banner */}
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrowBox}>
              <span style={styles.eyebrowDot} />
              <span style={styles.eyebrowText}>CLINICAL DECISION SUPPORT · LEVEL 1 + LEVEL 2 FUSION</span>
            </div>
            <h1 style={{ ...styles.pageTitle, color: theme.text }}>
              Dementia Type Profiling Workspace
            </h1>
            <p style={{ ...styles.pageSubtitle, color: theme.subtext }}>
              Cross-cutting pattern estimator evaluating Level 1 active psychometrics & passive telemetry alongside Level 2 clinical and genetic biomarkers. Model-estimated decision support only — not an autonomous clinical diagnosis.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: '800',
              color: isDark ? '#53B7C5' : '#0F4C4A',
              backgroundColor: isDark ? '#0A222B' : '#E0FCFF',
              padding: '6px 12px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? '#53B7C540' : '#0F4C4A30'}`
            }}>
              CROSS-CUTTING ANALYSIS (NOT TIER 4)
            </span>
          </div>
        </div>

        {/* Patient Selection Toolbar & Search Box */}
        <div style={{ ...styles.selectionCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
          <div style={styles.selectionCardHeader}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: theme.subtext, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                STEP 1: SELECT AUTHORIZED PATIENT
              </span>
              <div style={{ fontSize: '0.92rem', fontWeight: '800', color: theme.text, marginTop: '2px' }}>
                Monitored Cohort Directory ({patients.length} active patients)
              </div>
            </div>

            {/* Quick Search */}
            <div style={{ ...styles.searchWrapper, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.subtext} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search patient by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ ...styles.searchInput, color: theme.text }}
              />
            </div>
          </div>

          {/* Patient Selector Pills Grid */}
          {loadingPatients ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: theme.subtext, fontSize: '0.85rem' }}>
              Loading authorized patient cohort...
            </div>
          ) : (
            <div style={styles.patientPillsGrid}>
              {filteredPatients.map((p) => {
                const isSelected = selectedPatientId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    style={{
                      ...styles.patientPill,
                      backgroundColor: isSelected ? (isDark ? '#162B3D' : '#E0FCFF') : (isDark ? '#081119' : '#F9FAFB'),
                      borderColor: isSelected ? (isDark ? '#53B7C5' : '#0F4C4A') : theme.borderSubtle,
                      boxShadow: isSelected ? '0 2px 8px rgba(83, 183, 197, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? '#0F4C4A' : (isDark ? '#142533' : '#E2E8F0'),
                        color: isSelected ? '#FFFFFF' : theme.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '0.78rem'
                      }}>
                        {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: '800', color: theme.text }}>
                            {p.name}
                          </span>
                          {p.is_demo ? (
                            <span style={{
                              fontSize: '0.58rem',
                              fontWeight: '800',
                              letterSpacing: '0.04em',
                              color: isDark ? '#A78BFA' : '#6D28D9',
                              backgroundColor: isDark ? '#2E106540' : '#EDE9FE',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              border: `1px solid ${isDark ? '#A78BFA40' : '#C4B5FD'}`
                            }}>
                              DEMO
                            </span>
                          ) : null}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: theme.subtext }}>
                          {p.gender} · {p.age} yrs · ID #{p.id}
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: `${getRiskBadgeColor(p.risk_level)}20`,
                      color: getRiskBadgeColor(p.risk_level),
                      border: `1px solid ${getRiskBadgeColor(p.risk_level)}40`
                    }}>
                      {p.risk_level || 'Low'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* STEP 2: PROFILE DISPLAY SECTION */}
        {errorMsg ? (
          <div style={{
            padding: '1.5rem',
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
            border: '1px solid #EF444440',
            borderRadius: '12px',
            color: '#EF4444'
          }}>
            <strong>Error:</strong> {errorMsg}
          </div>
        ) : loadingProfile ? (
          <div style={{
            padding: '4rem',
            textAlign: 'center',
            backgroundColor: theme.cardBg,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            color: theme.subtext
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: theme.text, marginBottom: '6px' }}>
              Evaluating Multimodal Feature Schema for {selectedPatient?.name || 'Patient'}...
            </div>
            <div style={{ fontSize: '0.82rem' }}>
              Extracting Level 1 cognitive & behavioral metrics + Level 2 clinical biomarkers, calculating CatBoost multiclass probabilities and computing TreeSHAP attributions.
            </div>
          </div>
        ) : !profile ? (
          <div style={{
            padding: '3.5rem',
            textAlign: 'center',
            backgroundColor: theme.cardBg,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            color: theme.subtext
          }}>
            <h3 style={{ color: theme.text, margin: '0 0 0.5rem 0' }}>Select a Patient to Review Dementia Pattern Profile</h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Choose any patient from the authorized roster above to compute their cross-cutting dementia type profile.
            </p>
          </div>
        ) : profile.status === 'insufficient_data' ? (
          <div style={{
            padding: '2rem',
            backgroundColor: theme.cardBg,
            border: `1px dashed ${theme.borderSubtle}`,
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>⚠️</span>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: theme.text }}>
                Insufficient Screening Data for {profile.patient_name}
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: theme.subtext, lineHeight: '1.5', margin: '0 0 12px 0' }}>
              {profile.message}
            </p>
            <div style={{
              display: 'inline-block',
              padding: '6px 12px',
              backgroundColor: isDark ? '#0A222B' : '#E0FCFF',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: '700',
              color: isDark ? '#53B7C5' : '#0F4C4A'
            }}>
              Recommended Action: {profile.recommended_action}
            </div>
          </div>
        ) : (
          /* Profile Completed View */
          <div style={{ ...styles.profileCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            {/* Top Patient Summary Banner */}
            <div style={styles.profileBanner}>
              <div>
                <span style={styles.eyebrowText}>CLINICAL DECISION SUPPORT REPORT</span>
                <h2 style={{ ...styles.patientHeaderName, color: theme.text }}>
                  {profile.patient_name} · Patient ID #{profile.patient_id}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: theme.subtext }}>
                    Age: {selectedPatient?.age || 'N/A'} · Gender: {selectedPatient?.gender || 'N/A'} · Status: Active Monitored
                  </span>
                  <button
                    onClick={() => navigate(`/patients`)}
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      color: isDark ? '#53B7C5' : '#0F4C4A',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    View Complete Dossier in Directory →
                  </button>
                </div>
              </div>

              {/* Prominent Most Consistent Pattern Box */}
              <div style={{
                padding: '0.85rem 1.25rem',
                backgroundColor: isDark ? '#081119' : '#F0F9FF',
                borderRadius: '10px',
                border: `1px solid ${isDark ? '#53B7C540' : '#BAE6FD'}`,
                textAlign: 'right'
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: theme.subtext, textTransform: 'uppercase' }}>
                  Most Consistent Pattern
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: '900', color: isDark ? '#53B7C5' : '#0F4C4A', marginTop: '2px' }}>
                  {profile.most_consistent_pattern}
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: '700', color: theme.subtext }}>
                  Model Consistency: <strong>{Math.round((profile.confidence_score || 0) * 100)}%</strong>
                </span>
              </div>
            </div>

            {/* 2-Column Grid: Multiclass Probability Bars & SHAP Feature Attributions */}
            <div style={styles.profileGrid}>
              {/* Left Column: Multiclass Distribution */}
              <div style={{
                backgroundColor: isDark ? '#081119' : '#F8FAFC',
                borderRadius: '10px',
                padding: '1.25rem',
                border: `1px solid ${theme.borderSubtle}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '800', color: theme.text }}>
                    Pattern Probability Distribution
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: theme.subtext }}>Multiclass CatBoost Model</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {profile.pattern_probabilities?.map((p) => {
                    const pColor = getPatternColor(p.pattern_key);
                    const isTop = p.pattern_name === profile.most_consistent_pattern;

                    return (
                      <div key={p.pattern_key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                          <span style={{ color: theme.text, fontWeight: isTop ? '800' : '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: pColor }} />
                            {p.pattern_name} {isTop && <span style={{ fontSize: '0.7rem', color: isDark ? '#53B7C5' : '#0F4C4A', fontWeight: '800' }}>(Prominent)</span>}
                          </span>
                          <span style={{ color: pColor, fontWeight: '800' }}>
                            {p.percentage} ({p.probability.toFixed(3)})
                          </span>
                        </div>

                        <div style={{
                          width: '100%',
                          height: '9px',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                          borderRadius: '5px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.max(2, p.probability * 100)}%`,
                            height: '100%',
                            backgroundColor: pColor,
                            borderRadius: '5px',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  marginTop: '1.25rem',
                  paddingTop: '0.85rem',
                  borderTop: `1px solid ${theme.borderSubtle}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.72rem',
                  color: theme.subtext
                }}>
                  <span>Evaluated Features: <strong>{profile.evaluated_features_count || 20}</strong></span>
                  <span>Model: <strong>{profile.model_version}</strong></span>
                </div>
              </div>

              {/* Right Column: Key Contributing Signals (TreeSHAP) */}
              <div style={{
                backgroundColor: isDark ? '#081119' : '#F8FAFC',
                borderRadius: '10px',
                padding: '1.25rem',
                border: `1px solid ${theme.borderSubtle}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '800', color: theme.text }}>
                    Key Model Contributing Signals (TreeSHAP)
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: theme.subtext }}>Attribution Drivers</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {profile.key_contributing_signals?.map((sig, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: isDark ? '#142533' : '#FFFFFF',
                        borderRadius: '8px',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#E5E7EB'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: '800', color: theme.text }}>
                          {sig.signal_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: theme.subtext, marginTop: '2px' }}>
                          Domain: {sig.domain} · Measured Value: <strong>{sig.value}</strong>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: sig.impact.includes('Elevated') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: sig.impact.includes('Elevated') ? '#EF4444' : '#10B981',
                          border: `1px solid ${sig.impact.includes('Elevated') ? '#EF444430' : '#10B98130'}`
                        }}>
                          {sig.impact}
                        </span>
                        <div style={{ fontSize: '0.68rem', color: theme.subtext, marginTop: '3px' }}>
                          SHAP: {sig.shap_attribution > 0 ? `+${sig.shap_attribution.toFixed(2)}` : sig.shap_attribution.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Prominent Clinical Disclaimer Footer */}
            <div style={styles.disclaimerBox}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: theme.subtext, lineHeight: '1.5' }}>
                ⚠️ <strong>Clinical Notice & Non-Diagnostic Disclaimer:</strong> {profile.disclaimer}
              </p>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  eyebrowBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '0.25rem'
  },
  eyebrowDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#53B7C5'
  },
  eyebrowText: {
    fontSize: '0.72rem',
    fontWeight: '800',
    letterSpacing: '0.08em',
    color: '#287C78'
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    margin: '0 0 0.35rem 0',
    letterSpacing: '-0.02em'
  },
  pageSubtitle: {
    fontSize: '0.85rem',
    margin: 0,
    maxWidth: '860px',
    lineHeight: '1.4'
  },
  selectionCard: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '1.15rem'
  },
  selectionCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid',
    borderRadius: '8px',
    padding: '0.4rem 0.75rem',
    width: '320px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.78rem',
    width: '100%'
  },
  patientPillsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '0.65rem'
  },
  patientPill: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid',
    borderRadius: '8px',
    padding: '0.6rem 0.85rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  profileCard: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '1.35rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  profileBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(128,128,128,0.15)',
    paddingBottom: '1rem'
  },
  patientHeaderName: {
    fontSize: '1.25rem',
    fontWeight: '800',
    margin: '0.2rem 0 0 0'
  },
  profileGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem'
  },
  disclaimerBox: {
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(83, 183, 197, 0.08)',
    borderLeft: '4px solid #53B7C5'
  }
};

export default DementiaProfiling;
