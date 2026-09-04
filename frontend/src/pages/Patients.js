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
              <span style={{ ...styles.eyebrowDot, backgroundColor: isDark ? '#a3b18a' : '#273822' }} />
              <span style={{ ...styles.eyebrowText, color: isDark ? '#a3b89d' : '#3d5438' }}>CLINICAL DIRECTORY · MONITORED COHORT</span>
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
            <div style={{ ...styles.statValue, color: isDark ? '#a3b18a' : '#273822' }}>{registeredCount}</div>
            <span style={{ ...styles.statSub, color: theme.subtext }}>Authentic enrolled accounts</span>
          </div>

          <div style={{ ...styles.statCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <span style={{ ...styles.statLabel, color: theme.subtext }}>DEMO PATIENTS</span>
            <div style={{ ...styles.statValue, color: isDark ? '#cdd8c5' : '#5c7557' }}>{demoCount}</div>
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
              { key: 'deviating', label: 'Active Drift' },
              { key: 'High', label: 'High Risk' },
              { key: 'Moderate', label: 'Moderate' },
              { key: 'Low', label: 'Low Risk' }
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setRiskFilter(t.key)}
                style={{
                  ...styles.filterBtn,
                  backgroundColor: riskFilter === t.key ? (isDark ? '#273822' : '#273822') : 'transparent',
                  color: riskFilter === t.key ? '#ffffff' : (isDark ? '#a3b89d' : '#3d5438'),
                  borderColor: riskFilter === t.key ? (isDark ? '#3d5236' : '#273822') : 'transparent'
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
                      backgroundColor: isSelected ? (isDark ? '#172418' : '#eaf1e8') : theme.cardBg,
                      borderColor: isSelected ? (isDark ? '#3d5236' : '#273822') : theme.border,
                      boxShadow: isSelected ? (isDark ? '0 4px 16px rgba(0, 0, 0, 0.4)' : '0 4px 16px rgba(39, 56, 34, 0.08)') : 'none'
                    }}
                  >
                    <div style={styles.cardHeaderRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ ...styles.avatar, backgroundColor: isDark ? '#162018' : '#eaf1e8', color: isDark ? '#a3b18a' : '#273822' }}>
                          {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h3 style={{ ...styles.patientName, color: theme.text, margin: 0 }}>{p.name}</h3>
                            {p.is_demo ? (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                letterSpacing: '0.03em',
                                color: isDark ? '#cdd8c5' : '#3d5438',
                                backgroundColor: isDark ? '#202e21' : '#eaf1e8',
                                padding: '2px 6px',
                                borderRadius: '5px',
                                border: `1px solid ${isDark ? '#3d5236' : '#d2ded0'}`,
                                fontFamily: "Inter, system-ui, sans-serif"
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
                        <strong style={{ ...styles.scoreNum, color: theme.text }}>{p.latest_score} <span style={{ fontSize: '11px', fontWeight: 400, color: theme.subtext }}>/ 100</span></strong>
                      </div>
                      <div style={styles.scoreItem}>
                        <span style={{ ...styles.scoreLabel, color: theme.subtext }}>Active Battery</span>
                        <strong style={{ ...styles.scoreNum, color: isDark ? '#a3b18a' : '#273822' }}>{p.active_score}</strong>
                      </div>
                      <div style={styles.scoreItem}>
                        <span style={{ ...styles.scoreLabel, color: theme.subtext }}>Behavioral</span>
                        <strong style={{ ...styles.scoreNum, color: isDark ? '#cdd8c5' : '#3d5438' }}>{p.passive_score}</strong>
                      </div>
                      <div style={styles.scoreItem}>
                        <span style={{ ...styles.scoreLabel, color: theme.subtext }}>Drift State</span>
                        <span style={{ ...styles.driftFlag, color: p.is_deviating ? '#C94C4C' : '#2F7D5B' }}>
                          {p.is_deviating ? 'Deviating' : 'Calibrated'}
                        </span>
                      </div>
                    </div>

                    <div style={styles.cardFooterRow}>
                      <span style={{ fontSize: '11px', lineHeight: '18px', color: theme.subtext, fontFamily: "Inter, system-ui, sans-serif" }}>
                        {p.total_tests} test sessions · {p.total_signals} telemetry packets
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#a3b18a' : '#273822', fontFamily: "Inter, system-ui, sans-serif" }}>
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
              <div style={{ padding: '32px', textAlign: 'center', color: theme.subtext, fontSize: '13px' }}>Loading patient clinical dossier...</div>
            ) : patientDetail ? (
              <div style={styles.inspectorContent}>
                <div style={styles.inspectorTop}>
                  <div>
                    <span style={{ ...styles.inspectorEyebrow, color: isDark ? '#a3b18a' : '#3d5438' }}>PATIENT DOSSIER INSPECTOR</span>
                    <h2 style={{ ...styles.inspectorTitle, color: theme.text }}>{patientDetail.patient.name}</h2>
                    <span style={{ fontSize: '12px', lineHeight: '18px', color: theme.subtext, fontFamily: "Inter, system-ui, sans-serif" }}>
                      {patientDetail.patient.email} · Age: {patientDetail.patient.age} · Gender: {patientDetail.patient.gender}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => navigate('/tests')}
                      style={{ ...styles.navActionBtn, backgroundColor: '#273822', color: '#FFFFFF' }}
                    >
                      Cognitive Tests
                    </button>
                    <button
                      onClick={() => navigate('/voice')}
                      style={{ ...styles.navActionBtn, backgroundColor: isDark ? '#3d5236' : '#3d5236', color: '#FFFFFF' }}
                    >
                      Voice Analysis
                    </button>
                    <button
                      onClick={() => navigate('/level2')}
                      style={{ ...styles.navActionBtn, backgroundColor: isDark ? '#5c4838' : '#704c32', color: '#FFFFFF' }}
                    >
                      Tier 2 ML
                    </button>
                    <button
                      onClick={() => navigate('/level3')}
                      style={{ ...styles.navActionBtn, backgroundColor: isDark ? '#233240' : '#2d4559', color: '#FFFFFF' }}
                    >
                      Tier 3 MRI
                    </button>
                  </div>
                </div>

                {/* Patient CogniScore Overview Banner */}
                {patientDetail.latest_score ? (
                  <div style={{ ...styles.cogniBanner, backgroundColor: isDark ? '#162018' : '#eaf1e8', borderColor: theme.borderSubtle }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', color: theme.subtext, textTransform: 'uppercase', fontFamily: "Inter, system-ui, sans-serif" }}>Current CogniScore</span>
                      <div style={{ fontSize: '32px', fontWeight: 600, color: theme.text, lineHeight: 1.1, letterSpacing: '-0.02em', fontFamily: "Inter, system-ui, sans-serif" }}>
                        {patientDetail.latest_score.score} <span style={{ fontSize: '14px', fontWeight: 400, color: theme.subtext }}>/ 100</span>
                      </div>
                      <span style={{ fontSize: '11px', color: getRiskColor(patientDetail.latest_score.risk_level), fontWeight: 600, letterSpacing: '0.03em', fontFamily: "Inter, system-ui, sans-serif" }}>
                        {patientDetail.latest_score.risk_level} Risk Category
                      </span>
                    </div>

                    <div style={{ ...styles.bannerDivider, backgroundColor: isDark ? '#202e21' : '#d2ded0' }} />

                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', color: theme.subtext, textTransform: 'uppercase', fontFamily: "Inter, system-ui, sans-serif" }}>EWMA & CUSUM Tracking</span>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: theme.text, marginTop: '2px', fontFamily: "var(--cv-font-mono, monospace)" }}>
                        EWMA: {patientDetail.latest_score.ewma_score} · CUSUM: {patientDetail.latest_score.cusum_value}
                      </div>
                      <span style={{ fontSize: '12px', lineHeight: '18px', color: patientDetail.latest_score.is_deviating ? '#C94C4C' : '#2F7D5B', fontWeight: 500, fontFamily: "Inter, system-ui, sans-serif" }}>
                        {patientDetail.latest_score.is_deviating ? 'Statistically Significant Change-Point Drift' : 'Trajectory within calibrated baseline confidence interval'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ ...styles.cogniBanner, backgroundColor: isDark ? '#162018' : '#eaf1e8', borderColor: theme.borderSubtle }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', color: theme.subtext, textTransform: 'uppercase', fontFamily: "Inter, system-ui, sans-serif" }}>Current CogniScore</span>
                      <div style={{ fontSize: '20px', fontWeight: 600, color: theme.subtext, lineHeight: 1.2, marginTop: '4px', fontFamily: "Inter, system-ui, sans-serif" }}>
                        Not available
                      </div>
                      <span style={{ fontSize: '12px', color: theme.subtext, fontWeight: 500, fontFamily: "Inter, system-ui, sans-serif" }}>
                        Awaiting initial cognitive battery
                      </span>
                    </div>

                    <div style={{ ...styles.bannerDivider, backgroundColor: isDark ? '#202e21' : '#d2ded0' }} />

                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', color: theme.subtext, textTransform: 'uppercase', fontFamily: "Inter, system-ui, sans-serif" }}>Surveillance Status</span>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: theme.text, marginTop: '2px', fontFamily: "Inter, system-ui, sans-serif" }}>
                        Enrolled in Active Cohort
                      </div>
                      <span style={{ fontSize: '12px', lineHeight: '18px', color: theme.subtext, fontFamily: "Inter, system-ui, sans-serif" }}>
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
                      <div key={testKey} style={{ ...styles.subtestBox, backgroundColor: isDark ? '#141c15' : '#f8faf7', borderColor: theme.borderSubtle }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', color: theme.subtext, textTransform: 'uppercase', fontFamily: "Inter, system-ui, sans-serif" }}>
                          {testKey.replace('_', ' ')}
                        </span>
                        <strong style={{ fontSize: '16px', fontWeight: 600, color: theme.text, fontFamily: "Inter, system-ui, sans-serif" }}>{val} <span style={{ fontSize: '11px', fontWeight: 400 }}>pts</span></strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderRadius: '8px', border: `1px dashed ${theme.borderSubtle}`, color: theme.subtext, fontSize: '13px' }}>
                    No psychometric domain assessments recorded yet.
                  </div>
                )}

                {/* Tier 2 CatBoost SHAP Attribution */}
                {patientDetail.tier2_risk && (
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ ...styles.sectionHeading, color: theme.text }}>
                      Tier 2 Multivariate CatBoost Risk Assessment (Probability: {Math.round(patientDetail.tier2_risk.probability * 100)}%)
                    </h4>
                    <div style={{ ...styles.shapCard, backgroundColor: isDark ? '#141c15' : '#f8faf7', borderColor: theme.borderSubtle }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', color: theme.subtext, display: 'block', marginBottom: '8px', textTransform: 'uppercase', fontFamily: "Inter, system-ui, sans-serif" }}>
                        TOP SHAP RISK CONTRIBUTORS & MODIFIABLE DRIVERS:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {patientDetail.tier2_risk.top_features?.map((f, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                            <span style={{ color: theme.text, fontWeight: 500 }}>{f.feature} ({String(f.value)})</span>
                            <span style={{ color: f.importance > 0 ? '#C94C4C' : '#2F7D5B', fontWeight: 600, fontFamily: "var(--cv-font-mono, monospace)" }}>
                              {f.importance > 0 ? `+${f.importance.toFixed(2)} Risk` : `${f.importance.toFixed(2)} Protective`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* DEMENTIA TYPE PROFILING (Summary Widget & Shortcut to Dedicated Workspace) */}
                <div style={{ marginTop: '24px', borderTop: `1px solid ${theme.borderSubtle}`, paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isDark ? '#a3b18a' : '#273822' }} />
                        <h4 style={{ ...styles.sectionHeading, color: theme.text, margin: 0, fontSize: '16px' }}>
                          Dementia Type Profiling (Decision Support)
                        </h4>
                      </div>
                      <span style={{ fontSize: '12px', lineHeight: '18px', color: theme.subtext, fontFamily: "Inter, system-ui, sans-serif" }}>
                        Cross-cutting pattern estimator combining Level 1 psychometrics/telemetry & Level 2 clinical biomarkers
                      </span>
                    </div>

                    <button
                      onClick={() => navigate(`/dementia-profiling?patientId=${patientDetail.patient.id}`)}
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        lineHeight: '18px',
                        color: isDark ? '#f1f5ee' : '#273822',
                        backgroundColor: isDark ? '#1e2d1f' : '#eaf1e8',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${isDark ? '#3d5236' : '#d2ded0'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontFamily: "Inter, system-ui, sans-serif"
                      }}
                    >
                      Open Full Profiling Workspace →
                    </button>
                  </div>

                  {loadingProfile ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: theme.subtext, fontSize: '13px' }}>
                      Evaluating cross-cutting multimodal pattern profile...
                    </div>
                  ) : dementiaProfile?.status === 'insufficient_data' ? (
                    <div style={{
                      padding: '16px 20px',
                      backgroundColor: isDark ? '#141c15' : '#f8faf7',
                      border: `1px dashed ${theme.borderSubtle}`,
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <strong style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>Insufficient Screening Data</strong>
                        <p style={{ fontSize: '12px', lineHeight: '18px', color: theme.subtext, margin: '2px 0 0 0' }}>
                          {dementiaProfile.message}
                        </p>
                      </div>
                      <span style={{ fontSize: '12px', color: isDark ? '#a3b18a' : '#273822', fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif" }}>
                        {dementiaProfile.recommended_action}
                      </span>
                    </div>
                  ) : dementiaProfile?.status === 'completed' ? (
                    <div style={{
                      backgroundColor: isDark ? '#141c15' : '#f8faf7',
                      border: `1px solid ${theme.borderSubtle}`,
                      borderRadius: '10px',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', color: theme.subtext, textTransform: 'uppercase', fontFamily: "Inter, system-ui, sans-serif" }}>
                          Most Consistent Pattern
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '18px', fontWeight: 600, color: theme.text, fontFamily: "Inter, system-ui, sans-serif" }}>
                            {dementiaProfile.most_consistent_pattern}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.03em',
                            padding: '2px 8px',
                            borderRadius: '5px',
                            backgroundColor: isDark ? 'rgba(163, 177, 138, 0.16)' : '#eaf1e8',
                            color: isDark ? '#a3b18a' : '#273822',
                            border: `1px solid ${isDark ? '#3d5236' : '#d2ded0'}`,
                            fontFamily: "Inter, system-ui, sans-serif"
                          }}>
                            {Math.round((dementiaProfile.confidence_score || 0) * 100)}% Consistency
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', lineHeight: '18px', color: theme.subtext, display: 'block', fontFamily: "Inter, system-ui, sans-serif" }}>
                          Top Signal: <strong style={{ color: theme.text }}>{dementiaProfile.key_contributing_signals?.[0]?.signal_name || 'Psychometrics'}</strong>
                        </span>
                        <button
                          onClick={() => navigate(`/dementia-profiling?patientId=${patientDetail.patient.id}`)}
                          style={{
                            marginTop: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            lineHeight: '18px',
                            color: isDark ? '#a3b18a' : '#273822',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0,
                            fontFamily: "Inter, system-ui, sans-serif"
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
              <div style={{ padding: '32px', textAlign: 'center', color: theme.subtext, fontSize: '13px' }}>Select a patient on the left to view clinical dossier.</div>
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
    gap: '20px',
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  eyebrowBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px'
  },
  eyebrowDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  eyebrowText: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    fontFamily: "Inter, system-ui, sans-serif"
  },
  pageTitle: {
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '28px',
    fontWeight: 600,
    lineHeight: '36px',
    letterSpacing: '-0.02em',
    margin: '0 0 6px 0'
  },
  pageSubtitle: {
    fontSize: '14px',
    lineHeight: '21px',
    fontWeight: 400,
    margin: 0,
    maxWidth: '850px',
    fontFamily: "Inter, system-ui, sans-serif"
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px'
  },
  statCard: {
    border: '1px solid',
    borderRadius: '10px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    fontFamily: "Inter, system-ui, sans-serif"
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 600,
    lineHeight: '26px',
    fontFamily: "Inter, system-ui, sans-serif"
  },
  statSub: {
    fontSize: '12px',
    lineHeight: '18px',
    fontWeight: 400,
    fontFamily: "Inter, system-ui, sans-serif"
  },
  toolbar: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px'
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid',
    width: '320px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '13px',
    fontWeight: 400,
    width: '100%',
    fontFamily: "Inter, system-ui, sans-serif"
  },
  filterTabs: {
    display: 'flex',
    gap: '8px'
  },
  filterBtn: {
    border: '1px solid',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: '18px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: "Inter, system-ui, sans-serif"
  },
  twoColumnLayout: {
    display: 'grid',
    gridTemplateColumns: '440px 1fr',
    gap: '20px',
    alignItems: 'start'
  },
  patientListCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: 'calc(100vh - 360px)',
    overflowY: 'auto'
  },
  patientCard: {
    border: '1px solid',
    borderRadius: '10px',
    padding: '16px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'all 0.15s ease'
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '15px'
  },
  patientName: {
    margin: 0,
    fontSize: '17px',
    lineHeight: '24px',
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 700
  },
  patientMeta: {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 400,
    display: 'block',
    marginTop: '3px',
    fontFamily: "Inter, system-ui, sans-serif"
  },
  riskBadge: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid',
    textTransform: 'uppercase',
    fontFamily: "Inter, system-ui, sans-serif"
  },
  scoreRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    borderTop: '1px solid rgba(128,128,128,0.15)',
    borderBottom: '1px solid rgba(128,128,128,0.15)',
    padding: '14px 0'
  },
  scoreItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  scoreLabel: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    fontFamily: "Inter, system-ui, sans-serif"
  },
  scoreNum: {
    fontSize: '15.5px',
    fontWeight: 700,
    fontFamily: "Inter, system-ui, sans-serif"
  },
  driftFlag: {
    fontSize: '12.5px',
    fontWeight: 600,
    fontFamily: "Inter, system-ui, sans-serif"
  },
  cardFooterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailInspectorCol: {
    border: '1px solid',
    borderRadius: '16px',
    padding: '28px',
    position: 'sticky',
    top: '80px'
  },
  inspectorContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  inspectorTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(128,128,128,0.15)',
    paddingBottom: '20px'
  },
  inspectorEyebrow: {
    fontSize: '12.5px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    fontFamily: "Inter, system-ui, sans-serif"
  },
  inspectorTitle: {
    margin: '6px 0 6px 0',
    fontSize: '28px',
    lineHeight: '34px',
    letterSpacing: '-0.015em',
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 700
  },
  navActionBtn: {
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13.5px',
    fontWeight: 600,
    lineHeight: '20px',
    cursor: 'pointer',
    fontFamily: "Inter, system-ui, sans-serif",
    transition: 'opacity 0.15s ease'
  },
  cogniBanner: {
    border: '1px solid',
    borderRadius: '14px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '28px'
  },
  bannerDivider: {
    width: '1px',
    height: '52px',
  },
  sectionHeading: {
    margin: '0 0 10px 0',
    fontSize: '18px',
    lineHeight: '26px',
    letterSpacing: '-0.01em',
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 700
  },
  subtestGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px'
  },
  subtestBox: {
    border: '1px solid',
    borderRadius: '10px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  shapCard: {
    border: '1px solid',
    borderRadius: '14px',
    padding: '20px'
  },
  loadingBox: {
    padding: '36px',
    textAlign: 'center',
    fontSize: '15px',
    fontFamily: "Inter, system-ui, sans-serif"
  },
  emptyBox: {
    border: '1px solid',
    borderRadius: '14px',
    padding: '36px',
    textAlign: 'center',
    fontSize: '15px',
    fontFamily: "Inter, system-ui, sans-serif"
  }
};

export default Patients;
