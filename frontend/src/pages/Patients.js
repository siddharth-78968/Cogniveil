import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import DoctorLayout from '../components/DoctorLayout';
import { getClinicianPatients, getClinicianPatientOverview, getClinicianPatientDementiaProfile } from '../utils/api';


const Patients = () => {
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all'); // 'all', 'High', 'Moderate', 'Low', 'deviating'
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [dementiaProfile, setDementiaProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    fetchPatientsList();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const fetchPatientsList = async () => {
    try {
      setLoading(true);
      const res = await getClinicianPatients();
      if (Array.isArray(res.data)) {
        setPatients(res.data);
        if (res.data.length > 0 && !selectedPatientId) {
          handleSelectPatient(res.data[0].id);
        }
      }
    } catch (err) {
      console.log('Error fetching patients:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patientId) => {
    setSelectedPatientId(patientId);
    setLoadingDetail(true);
    setLoadingProfile(true);
    try {
      const [overviewRes, profileRes] = await Promise.allSettled([
        getClinicianPatientOverview(patientId),
        getClinicianPatientDementiaProfile(patientId)
      ]);
      if (overviewRes.status === 'fulfilled') {
        setPatientDetail(overviewRes.value.data);
      }
      if (profileRes.status === 'fulfilled') {
        setDementiaProfile(profileRes.value.data);
      } else {
        setDementiaProfile(null);
      }
    } catch (err) {
      console.log('Error loading patient detail:', err.message);
    } finally {
      setLoadingDetail(false);
      setLoadingProfile(false);
    }
  };


  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (riskFilter === 'all') return true;
    if (riskFilter === 'deviating') return p.is_deviating;
    return p.risk_level?.toLowerCase() === riskFilter.toLowerCase();
  });

  const registeredCount = patients.filter((p) => !p.is_demo).length;
  const demoCount = patients.filter((p) => p.is_demo).length;
  const highRiskCount = patients.filter((p) => p.risk_level === 'High' || p.is_deviating).length;
  const modRiskCount = patients.filter((p) => p.risk_level === 'Moderate').length;
  const avgScore = patients.length > 0
    ? Math.round(patients.reduce((acc, curr) => acc + (curr.latest_score || 70), 0) / patients.length)
    : 72;


  const getRiskColor = (risk) => {
    if (risk === 'High') return '#C94C4C';
    if (risk === 'Moderate') return '#D97745';
    return '#2F7D5B';
  };

  return (
    <DoctorLayout activeTitle="Patients Directory">
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrowBox}>
              <span style={styles.eyebrowDot} />
              <span style={styles.eyebrowText}>CLINICAL DIRECTORY · MONITORED COHORT</span>
            </div>
            <h1 style={{ ...styles.pageTitle, color: theme.text }}>
              Patient Roster & Longitudinal Cohort
            </h1>
            <p style={{ ...styles.pageSubtitle, color: theme.subtext }}>
              Review multi-modal screening records, longitudinal change-point drift flags, and biomarker dossiers across all enrolled patients.
            </p>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <span style={{ ...styles.statLabel, color: theme.subtext }}>TOTAL MONITORED</span>
            <div style={{ ...styles.statValue, color: theme.text }}>{patients.length}</div>
            <span style={{ ...styles.statSub, color: theme.subtext }}>Active enrolled surveillance</span>
          </div>

          <div style={{ ...styles.statCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <span style={{ ...styles.statLabel, color: theme.subtext }}>REGISTERED PATIENTS</span>
            <div style={{ ...styles.statValue, color: '#10B981' }}>{registeredCount}</div>
            <span style={{ ...styles.statSub, color: theme.subtext }}>Authentic enrolled accounts</span>
          </div>

          <div style={{ ...styles.statCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <span style={{ ...styles.statLabel, color: theme.subtext }}>DEMO PATIENTS</span>
            <div style={{ ...styles.statValue, color: '#8B5CF6' }}>{demoCount}</div>
            <span style={{ ...styles.statSub, color: theme.subtext }}>Designated demo cohort</span>
          </div>

          <div style={{ ...styles.statCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <span style={{ ...styles.statLabel, color: theme.subtext }}>ELEVATED RISK / DRIFT</span>
            <div style={{ ...styles.statValue, color: '#C94C4C' }}>{highRiskCount}</div>
            <span style={{ ...styles.statSub, color: theme.subtext }}>CUSUM drift / alert triggered</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={{ ...styles.toolbar, backgroundColor: theme.cardBg, borderColor: theme.border }}>
          <div style={{ ...styles.searchWrapper, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.subtext} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search patients by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...styles.searchInput, color: theme.text }}
            />
          </div>

          <div style={styles.filterTabs}>
            {[
              { key: 'all', label: 'All Patients' },
              { key: 'deviating', label: '⚠️ Active Drift' },
              { key: 'High', label: 'High Risk' },
              { key: 'Moderate', label: 'Moderate' },
              { key: 'Low', label: 'Low Risk' }
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setRiskFilter(t.key)}
                style={{
                  ...styles.filterBtn,
                  backgroundColor: riskFilter === t.key ? (isDark ? '#162B3D' : '#E0FCFF') : 'transparent',
                  color: riskFilter === t.key ? (isDark ? '#53B7C5' : '#0F4C4A') : theme.subtext,
                  borderColor: riskFilter === t.key ? (isDark ? '#53B7C5' : '#0F4C4A') : 'transparent'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column: Left Patient Directory / Right Patient Detail Inspector */}
        <div style={styles.twoColumnLayout}>
          {/* Left Column: Patient Cards */}
          <div style={styles.patientListCol}>
            {loading ? (
              <div style={{ ...styles.loadingBox, color: theme.subtext }}>Loading patient records...</div>
            ) : filteredPatients.length === 0 ? (
              <div style={{ ...styles.emptyBox, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <p style={{ color: theme.subtext, margin: 0 }}>No patients match the search criteria.</p>
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = selectedPatientId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatient(p.id)}
                    style={{
                      ...styles.patientCard,
                      backgroundColor: isSelected ? (isDark ? '#162B3D' : '#F0F9F8') : theme.cardBg,
                      borderColor: isSelected ? (isDark ? '#53B7C5' : '#0F4C4A') : theme.border,
                      boxShadow: isSelected ? '0 4px 16px rgba(83, 183, 197, 0.15)' : 'none'
                    }}
                  >
                    <div style={styles.cardHeaderRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ ...styles.avatar, backgroundColor: isDark ? '#081119' : '#E8F5EE', color: '#0F4C4A' }}>
                          {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h3 style={{ ...styles.patientName, color: theme.text, margin: 0 }}>{p.name}</h3>
                            {p.is_demo ? (
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: '800',
                                letterSpacing: '0.04em',
                                color: isDark ? '#A78BFA' : '#6D28D9',
                                backgroundColor: isDark ? '#2E106540' : '#EDE9FE',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                border: `1px solid ${isDark ? '#A78BFA40' : '#C4B5FD'}`
                              }}>
                                DEMO
                              </span>
                            ) : null}
                          </div>
                          <span style={{ ...styles.patientMeta, color: theme.subtext }}>
                            {p.gender} · {p.age} yrs · {p.email}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            ...styles.riskBadge,
                            backgroundColor: `${getRiskColor(p.risk_level)}20`,
                            color: getRiskColor(p.risk_level),
                            borderColor: `${getRiskColor(p.risk_level)}40`
                          }}
                        >
                          {p.risk_level} Risk
                        </span>
                      </div>
                    </div>

                    <div style={styles.scoreRow}>
                      <div style={styles.scoreItem}>
                        <span style={{ ...styles.scoreLabel, color: theme.subtext }}>CogniScore</span>
                        <strong style={{ ...styles.scoreNum, color: theme.text }}>{p.latest_score} <span style={{ fontSize: '0.7rem' }}>/ 100</span></strong>
                      </div>
                      <div style={styles.scoreItem}>
                        <span style={{ ...styles.scoreLabel, color: theme.subtext }}>Active Battery</span>
                        <strong style={{ ...styles.scoreNum, color: '#4338CA' }}>{p.active_score}</strong>
                      </div>
                      <div style={styles.scoreItem}>
                        <span style={{ ...styles.scoreLabel, color: theme.subtext }}>Behavioral</span>
                        <strong style={{ ...styles.scoreNum, color: '#06b6d4' }}>{p.passive_score}</strong>
                      </div>
                      <div style={styles.scoreItem}>
                        <span style={{ ...styles.scoreLabel, color: theme.subtext }}>Drift State</span>
                        <span style={{ ...styles.driftFlag, color: p.is_deviating ? '#C94C4C' : '#2F7D5B' }}>
                          {p.is_deviating ? '⚠️ Deviating' : '✓ Calibrated'}
                        </span>
                      </div>
                    </div>

                    <div style={styles.cardFooterRow}>
                      <span style={{ fontSize: '0.72rem', color: theme.subtext }}>
                        {p.total_tests} test sessions · {p.total_signals} telemetry packets
                      </span>
                      <span style={{ fontSize: '0.74rem', fontWeight: '700', color: isDark ? '#53B7C5' : '#0F4C4A' }}>
                        Inspect Dossier →
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: In-Depth Patient Dossier Inspector */}
          <div style={{ ...styles.detailInspectorCol, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            {loadingDetail ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: theme.subtext }}>Loading patient clinical dossier...</div>
            ) : patientDetail ? (
              <div style={styles.inspectorContent}>
                <div style={styles.inspectorTop}>
                  <div>
                    <span style={styles.inspectorEyebrow}>PATIENT DOSSIER INSPECTOR</span>
                    <h2 style={{ ...styles.inspectorTitle, color: theme.text }}>{patientDetail.patient.name}</h2>
                    <span style={{ fontSize: '0.8rem', color: theme.subtext }}>
                      {patientDetail.patient.email} · Age: {patientDetail.patient.age} · Gender: {patientDetail.patient.gender}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => navigate('/tests')}
                      style={{ ...styles.navActionBtn, backgroundColor: theme.primaryTeal, color: '#FFFFFF' }}
                    >
                      Cognitive Tests
                    </button>
                    <button
                      onClick={() => navigate('/voice')}
                      style={{ ...styles.navActionBtn, backgroundColor: theme.secondaryTeal, color: '#FFFFFF' }}
                    >
                      Voice Analysis
                    </button>
                    <button
                      onClick={() => navigate('/level2')}
                      style={{ ...styles.navActionBtn, backgroundColor: '#D97745', color: '#FFFFFF' }}
                    >
                      Tier 2 ML
                    </button>
                    <button
                      onClick={() => navigate('/level3')}
                      style={{ ...styles.navActionBtn, backgroundColor: '#102A43', color: '#FFFFFF' }}
                    >
                      Tier 3 MRI
                    </button>
                  </div>
                </div>

                {/* Patient CogniScore Overview Banner */}
                {patientDetail.latest_score ? (
                  <div style={{ ...styles.cogniBanner, backgroundColor: isDark ? '#081119' : '#F0F5F4', borderColor: theme.borderSubtle }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: theme.subtext, textTransform: 'uppercase' }}>Current CogniScore</span>
                      <div style={{ fontSize: '2rem', fontWeight: '900', color: theme.text, lineHeight: '1.1' }}>
                        {patientDetail.latest_score.score} <span style={{ fontSize: '0.9rem', color: theme.subtext }}>/ 100</span>
                      </div>
                      <span style={{ fontSize: '0.76rem', color: getRiskColor(patientDetail.latest_score.risk_level), fontWeight: '800' }}>
                        {patientDetail.latest_score.risk_level} Risk Category
                      </span>
                    </div>

                    <div style={styles.bannerDivider} />

                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: theme.subtext, textTransform: 'uppercase' }}>EWMA & CUSUM Tracking</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: '800', color: theme.text, marginTop: '2px' }}>
                        EWMA: {patientDetail.latest_score.ewma_score} · CUSUM: {patientDetail.latest_score.cusum_value}
                      </div>
                      <span style={{ fontSize: '0.74rem', color: patientDetail.latest_score.is_deviating ? '#C94C4C' : '#2F7D5B', fontWeight: '700' }}>
                        {patientDetail.latest_score.is_deviating ? '⚠️ Statistically Significant Change-Point Drift' : '✓ Trajectory within calibrated baseline confidence interval'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ ...styles.cogniBanner, backgroundColor: isDark ? '#081119' : '#F0F5F4', borderColor: theme.borderSubtle }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: theme.subtext, textTransform: 'uppercase' }}>Current CogniScore</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: theme.subtext, lineHeight: '1.2', marginTop: '4px' }}>
                        Not available
                      </div>
                      <span style={{ fontSize: '0.76rem', color: theme.subtext, fontWeight: '700' }}>
                        Awaiting initial cognitive battery
                      </span>
                    </div>

                    <div style={styles.bannerDivider} />

                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: theme.subtext, textTransform: 'uppercase' }}>Surveillance Status</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: '800', color: theme.text, marginTop: '2px' }}>
                        Enrolled in Active Cohort
                      </div>
                      <span style={{ fontSize: '0.74rem', color: theme.subtext }}>
                        Baseline surveillance calibration collecting (0 of 7 sessions)
                      </span>
                    </div>
                  </div>
                )}

                {/* Subtest Averages Grid */}
                <h4 style={{ ...styles.sectionHeading, color: theme.text }}>Active Cognitive Domain Psychometrics</h4>
                {Object.keys(patientDetail.subtest_averages || {}).length > 0 ? (
                  <div style={styles.subtestGrid}>
                    {Object.entries(patientDetail.subtest_averages).map(([testKey, val]) => (
                      <div key={testKey} style={{ ...styles.subtestBox, backgroundColor: isDark ? '#10202E' : '#FFFFFF', borderColor: theme.borderSubtle }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: theme.subtext, textTransform: 'uppercase' }}>
                          {testKey.replace('_', ' ')}
                        </span>
                        <strong style={{ fontSize: '1.1rem', color: theme.text }}>{val} <span style={{ fontSize: '0.7rem' }}>pts</span></strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderRadius: '8px', border: `1px dashed ${theme.borderSubtle}`, color: theme.subtext, fontSize: '0.82rem' }}>
                    No psychometric domain assessments recorded yet.
                  </div>
                )}

                {/* Tier 2 CatBoost SHAP Attribution */}
                {patientDetail.tier2_risk && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <h4 style={{ ...styles.sectionHeading, color: theme.text }}>
                      Tier 2 Multivariate CatBoost Risk Assessment (Probability: {Math.round(patientDetail.tier2_risk.probability * 100)}%)
                    </h4>
                    <div style={{ ...styles.shapCard, backgroundColor: isDark ? '#081119' : '#FFFFFF', borderColor: theme.borderSubtle }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: theme.subtext, display: 'block', marginBottom: '8px' }}>
                        TOP SHAP RISK CONTRIBUTORS & MODIFIABLE DRIVERS:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {patientDetail.tier2_risk.top_features?.map((f, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                            <span style={{ color: theme.text, fontWeight: '600' }}>{f.feature} ({String(f.value)})</span>
                            <span style={{ color: f.importance > 0 ? '#C94C4C' : '#2F7D5B', fontWeight: '800' }}>
                              {f.importance > 0 ? `+${f.importance.toFixed(2)} Risk` : `${f.importance.toFixed(2)} Protective`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* DEMENTIA TYPE PROFILING (Summary Widget & Shortcut to Dedicated Workspace) */}
                <div style={{ marginTop: '1.5rem', borderTop: `1px solid ${theme.borderSubtle}`, paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#53B7C5' }} />
                        <h4 style={{ ...styles.sectionHeading, color: theme.text, margin: 0, fontSize: '0.96rem' }}>
                          Dementia Type Profiling (Decision Support)
                        </h4>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: theme.subtext }}>
                        Cross-cutting pattern estimator combining Level 1 psychometrics/telemetry & Level 2 clinical biomarkers
                      </span>
                    </div>

                    <button
                      onClick={() => navigate(`/dementia-profiling?patientId=${patientDetail.patient.id}`)}
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: '800',
                        color: isDark ? '#53B7C5' : '#0F4C4A',
                        backgroundColor: isDark ? '#0A222B' : '#E0FCFF',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${isDark ? '#53B7C540' : '#0F4C4A30'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Open Full Profiling Workspace →
                    </button>
                  </div>

                  {loadingProfile ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: theme.subtext, fontSize: '0.82rem' }}>
                      Evaluating cross-cutting multimodal pattern profile...
                    </div>
                  ) : dementiaProfile?.status === 'insufficient_data' ? (
                    <div style={{
                      padding: '1rem 1.25rem',
                      backgroundColor: isDark ? '#141E28' : '#F9FAFB',
                      border: `1px dashed ${theme.borderSubtle}`,
                      borderRadius: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <strong style={{ fontSize: '0.82rem', color: theme.text }}>Insufficient Screening Data</strong>
                        <p style={{ fontSize: '0.76rem', color: theme.subtext, margin: '2px 0 0 0' }}>
                          {dementiaProfile.message}
                        </p>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: isDark ? '#53B7C5' : '#0F4C4A', fontWeight: '700' }}>
                        {dementiaProfile.recommended_action}
                      </span>
                    </div>
                  ) : dementiaProfile?.status === 'completed' ? (
                    <div style={{
                      backgroundColor: isDark ? '#081119' : '#FFFFFF',
                      border: `1px solid ${theme.borderSubtle}`,
                      borderRadius: '10px',
                      padding: '1rem 1.15rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', fontWeight: '800', color: theme.subtext, textTransform: 'uppercase' }}>
                          Most Consistent Pattern
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: '900', color: theme.text }}>
                            {dementiaProfile.most_consistent_pattern}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#53B7C520',
                            color: isDark ? '#53B7C5' : '#0F4C4A',
                            border: '1px solid #53B7C540'
                          }}>
                            {Math.round((dementiaProfile.confidence_score || 0) * 100)}% Consistency
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.72rem', color: theme.subtext, display: 'block' }}>
                          Top Signal: <strong>{dementiaProfile.key_contributing_signals?.[0]?.signal_name || 'Psychometrics'}</strong>
                        </span>
                        <button
                          onClick={() => navigate(`/dementia-profiling?patientId=${patientDetail.patient.id}`)}
                          style={{
                            marginTop: '4px',
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
                          View Full Distribution & SHAP →
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: theme.subtext }}>Select a patient on the left to view clinical dossier.</div>
            )}
          </div>
        </div>
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
    backgroundColor: '#0F4C4A'
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
    maxWidth: '820px',
    lineHeight: '1.4'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem'
  },
  statCard: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '1rem 1.15rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  statLabel: {
    fontSize: '0.66rem',
    fontWeight: '800',
    letterSpacing: '0.05em'
  },
  statValue: {
    fontSize: '1.7rem',
    fontWeight: '800',
    lineHeight: '1.1'
  },
  statSub: {
    fontSize: '0.72rem'
  },
  toolbar: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem'
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0.45rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid',
    width: '320px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '0.82rem',
    width: '100%'
  },
  filterTabs: {
    display: 'flex',
    gap: '0.5rem'
  },
  filterBtn: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '0.4rem 0.8rem',
    fontSize: '0.76rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  twoColumnLayout: {
    display: 'grid',
    gridTemplateColumns: '440px 1fr',
    gap: '1.25rem',
    alignItems: 'start'
  },
  patientListCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    maxHeight: 'calc(100vh - 360px)',
    overflowY: 'auto'
  },
  patientCard: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '1rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    transition: 'all 0.15s ease'
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '0.95rem'
  },
  patientName: {
    margin: 0,
    fontSize: '0.92rem',
    fontWeight: '800'
  },
  patientMeta: {
    fontSize: '0.72rem',
    display: 'block',
    marginTop: '2px'
  },
  riskBadge: {
    fontSize: '0.68rem',
    fontWeight: '800',
    padding: '2px 7px',
    borderRadius: '6px',
    border: '1px solid',
    textTransform: 'uppercase'
  },
  scoreRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.5rem',
    borderTop: '1px solid rgba(128,128,128,0.15)',
    borderBottom: '1px solid rgba(128,128,128,0.15)',
    padding: '0.5rem 0'
  },
  scoreItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  scoreLabel: {
    fontSize: '0.64rem',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  scoreNum: {
    fontSize: '0.88rem'
  },
  driftFlag: {
    fontSize: '0.72rem',
    fontWeight: '800'
  },
  cardFooterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailInspectorCol: {
    border: '1px solid',
    borderRadius: '14px',
    padding: '1.25rem',
    position: 'sticky',
    top: '80px'
  },
  inspectorContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  inspectorTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(128,128,128,0.2)',
    paddingBottom: '0.85rem'
  },
  inspectorEyebrow: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#53B7C5',
    letterSpacing: '0.05em'
  },
  inspectorTitle: {
    margin: '3px 0 2px 0',
    fontSize: '1.3rem',
    fontWeight: '800'
  },
  navActionBtn: {
    border: 'none',
    borderRadius: '6px',
    padding: '0.35rem 0.65rem',
    fontSize: '0.72rem',
    fontWeight: '700',
    cursor: 'pointer'
  },
  cogniBanner: {
    border: '1px solid',
    borderRadius: '10px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  bannerDivider: {
    width: '1px',
    height: '45px',
    backgroundColor: 'rgba(128,128,128,0.2)'
  },
  sectionHeading: {
    margin: '0 0 0.5rem 0',
    fontSize: '0.88rem',
    fontWeight: '800'
  },
  subtestGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '0.65rem'
  },
  subtestBox: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '0.6rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  shapCard: {
    border: '1px solid',
    borderRadius: '10px',
    padding: '0.85rem'
  },
  loadingBox: {
    padding: '3rem',
    textAlign: 'center',
    fontSize: '0.88rem'
  },
  emptyBox: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '2.5rem',
    textAlign: 'center'
  }
};

export default Patients;
