import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  getScore, 
  getScoreHistory, 
  calculateScore, 
  getTodaySignals,
  getClinicalReport,
  getAppointments,
  updateAppointmentStatus,
  getClinicianPatients
} from '../utils/api';
import ReferralReportModal from '../components/ReferralReportModal';
import ExplainMyResultModal from '../components/ExplainMyResultModal';
import AuditTimelineWidget from '../components/AuditTimelineWidget';
import EvidenceDrawer from '../components/EvidenceDrawer';
import EvidenceGraphModal from '../components/EvidenceGraphModal';
import AgentPipelineModal from '../components/AgentPipelineModal';
import DoctorLayout from '../components/DoctorLayout';
import ChatWidget from '../components/ChatWidget';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Line
} from 'recharts';

// Custom Tooltip matching modern medical UI kit
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#1e293b',
        color: '#ffffff',
        padding: '0.6rem 0.9rem',
        borderRadius: '10px',
        fontSize: '0.78rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <p style={{ margin: '0 0 4px 0', fontWeight: '700', color: '#94a3b8' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: '2px 0', color: p.color, fontWeight: '700' }}>
            {p.name}: {p.value} {p.name.includes('Score') || p.name.includes('Consultations') ? 'pts' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const isClinician = Boolean(user?.is_caregiver || user?.role === 'clinician' || user?.role === 'doctor');
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState('This Year');
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showTriggeredModal, setShowTriggeredModal] = useState(false);
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState('E1');
  const [showEvidenceGraphModal, setShowEvidenceGraphModal] = useState(false);
  const [showAgentPipelineModal, setShowAgentPipelineModal] = useState(false);
  const [referralPayload, setReferralPayload] = useState(null);
  const [dashboardAppointments, setDashboardAppointments] = useState([]);
  const [clinicianPatients, setClinicianPatients] = useState([]);
  const [apptToast, setApptToast] = useState(null);

  const handleInspectEvidence = (eId) => {
    setSelectedEvidenceId(eId);
    setShowEvidenceDrawer(true);
  };

  const handleDashboardStatusChange = async (id, newStatus) => {
    try {
      await updateAppointmentStatus(id, newStatus);
      setDashboardAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
      setApptToast(`Appointment #${id} updated to ${newStatus}`);
      setTimeout(() => setApptToast(null), 3500);
    } catch (err) {
      console.error('Error updating appointment on dashboard:', err);
      setApptToast('Failed to update appointment status.');
      setTimeout(() => setApptToast(null), 3500);
    }
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user && user.consent_granted === false) { navigate('/consent'); return; }
    fetchData();
  }, [user, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    try {
      const scoreRes = await getScore();
      setScore(scoreRes.data);
      if (scoreRes.data.trigger_level2 || scoreRes.data.level2_status === 'triggered' || user?.level2_status === 'triggered') {
        setShowTriggeredModal(true);
      }
    } catch (err) { setScore(null); }

    try {
      const historyRes = await getScoreHistory();
      const rawHistory = historyRes.data || [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const formatted = rawHistory.map((s, i) => {
        const dateObj = new Date(s.created_at || Date.now() - (rawHistory.length - 1 - i) * 86400000);
        return {
          day: `D${i + 1}`,
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          month: months[i % 12],
          weekday: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
          score: Math.round(s.score * 10) / 10,
          active: Math.round((s.active_score || s.score) * 10) / 10,
          passive: Math.round((s.passive_score || s.score) * 10) / 10,
          ewma: Math.round((s.ewma_score || s.score) * 10) / 10,
          baseline: Math.round((s.baseline_mean || s.score) * 10) / 10,
          cusum: Math.round((s.cusum_value || 0) * 10) / 10,
          is_deviating: Boolean(s.is_deviating),
          risk_level: s.risk_level || (s.score >= 65 ? 'Low' : s.score >= 40 ? 'Moderate' : 'High'),
          fullDate: dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
        };
      });
      setHistory(formatted);
    } catch (err) { setHistory([]); }

    try {
      await getTodaySignals();
    } catch (err) {}

    try {
      const apptsRes = await getAppointments();
      if (Array.isArray(apptsRes.data)) {
        setDashboardAppointments(apptsRes.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard appointments:', err);
    }

    if (isClinician) {
      try {
        const patRes = await getClinicianPatients();
        if (Array.isArray(patRes.data)) {
          setClinicianPatients(patRes.data);
        }
      } catch (err) {
        console.error('Error fetching clinician patients for dashboard:', err);
      }
    }

    setLoading(false);
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const res = await calculateScore();
      setScore(res.data);
      await fetchData();
    } catch (err) {
      alert('Please complete at least one cognitive test first.');
    } finally { setCalculating(false); }
  };

  const handleOpenReferral = async () => {
    try {
      const res = await getClinicalReport({
        cogni_score: score?.score || 75.0,
        risk_level: score?.risk_level || 'Moderate',
        is_deviating: Boolean(score?.is_deviating),
        patient_name: user?.name || user?.email?.split('@')[0] || 'Patient',
        age: user?.age || 65,
      });
      setReferralPayload(res.data);
      setShowReferralModal(true);
    } catch (err) {
      setReferralPayload({
        cogni_score: score?.score || 75.0,
        risk_level: score?.risk_level || 'Moderate',
        is_deviating: Boolean(score?.is_deviating),
        narrative: 'Longitudinal screening indicates consistent baseline monitoring. Specialist consultation recommended upon drift.',
        referral: {
          action: 'Comprehensive Neurological Evaluation & Cognitive Battery',
          recommended_specialist: 'Cognitive Neurologist / Memory Clinic',
          urgency: 'Routine Clinical Evaluation'
        }
      });
      setShowReferralModal(true);
    }
  };

  const defaultClinicianTrend = [
    { month: 'Sep', consultations: 16, patients: 42, score: 78, baseline: 82, fullDate: 'Sep 2026' },
    { month: 'Oct', consultations: 24, patients: 55, score: 73, baseline: 80, fullDate: 'Oct 2026' },
    { month: 'Nov', consultations: 35, patients: 68, score: 68, baseline: 78, fullDate: 'Nov 2026' },
    { month: 'Dec', consultations: 28, patients: 59, score: 71, baseline: 77, fullDate: 'Dec 2026' },
    { month: 'Jan', consultations: 44, patients: 76, score: 64, baseline: 75, fullDate: 'Jan 2026' },
    { month: 'Feb', consultations: 52, patients: 84, score: 60, baseline: 74, fullDate: 'Feb 2026' },
    { month: 'Mar', consultations: 49, patients: 81, score: 65, baseline: 75, fullDate: 'Mar 2026' }
  ];

  const activityData = (isClinician && (!history || history.length === 0)) ? defaultClinicianTrend : history;

  if (loading) {
    return (
      <div style={{ ...styles.loadingScreen, backgroundColor: theme.bg, color: theme.text }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
        </svg>
        <p style={{ color: '#4338CA', fontWeight: '700' }}>Loading CogniVeil Dashboard...</p>
      </div>
    );
  }

  return (
    <DoctorLayout 
      activeTitle="Dashboard"
      onOpenReferral={handleOpenReferral}
      onOpenEvidenceGraph={() => setShowEvidenceGraphModal(true)}
      onOpenAgentPipeline={() => setShowAgentPipelineModal(true)}
      actionButton={
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isClinician ? (
            <button 
              style={styles.headerPrimaryBtn}
              onClick={() => navigate('/appointments?action=new')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Schedule Appointment</span>
            </button>
          ) : (
            <button 
              style={styles.headerPrimaryBtn}
              onClick={() => navigate('/tests')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Take Daily Test</span>
            </button>
          )}
        </div>
      }
    >
      {/* ── PATIENT DASHBOARD (For normal users) ── */}
      {!user?.is_caregiver ? (
        <div style={styles.patientContainer}>
          {/* Patient Welcome Banner */}
          <div style={{ ...styles.patientWelcomeCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={styles.patientEyebrow}>PERSONAL COGNITIVE MONITORING</span>
                <h1 style={{ ...styles.patientTitle, color: theme.text }}>Welcome back, {user?.name || user?.email?.split('@')[0]}</h1>
                <p style={{ ...styles.patientSub, color: theme.subtext }}>
                  Longitudinal neuromotor & speech biomarker screening. Take your 3-minute daily tests to maintain baseline accuracy.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button style={styles.startTestsBtn} onClick={() => navigate('/tests')}>
                  <span>Take Today's Tests</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
                <button 
                  style={{
                    ...styles.startTestsBtn,
                    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                    border: `1.5px solid ${theme.border}`,
                    color: theme.text
                  }}
                  onClick={() => navigate('/appointments?action=new')}
                >
                  <span>Book Consultation</span>
                </button>
              </div>
            </div>

            {/* Baseline Calibration Progress */}
            <div style={{ ...styles.baselineProgressBox, backgroundColor: theme.statBoxBg, borderColor: theme.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: theme.text }}>
                  {history.length < 7 ? `Day ${Math.max(history.length, 1)} of 7: Baseline Calibration Mode` : `Personal Baseline Established`}
                </span>
                <span style={{ fontSize: '0.78rem', color: theme.subtext, fontWeight: '600' }}>
                  {history.length < 7 ? `${Math.round((history.length / 7) * 100)}% Calibrated` : `${history.length} Sessions Logged`}
                </span>
              </div>
              <div style={styles.progressBarTrack}>
                <div style={{ ...styles.progressBarFill, width: `${Math.min((history.length / 7) * 100, 100)}%` }} />
              </div>
            </div>

            {/* DementAI "Buy Patients Time" Lead Time Benefit Callout */}
            <div style={{
              marginTop: '0.85rem',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              backgroundColor: score?.is_deviating ? (isDark ? 'rgba(217, 119, 6, 0.15)' : '#fef3c7') : (isDark ? 'rgba(67, 56, 202, 0.12)' : '#eef2ff'),
              border: `1px solid ${score?.is_deviating ? (isDark ? '#d97706' : '#fde68a') : (isDark ? '#4338ca' : '#c7d2fe')}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⏱️</span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: score?.is_deviating ? (isDark ? '#fbbf24' : '#92400e') : (isDark ? '#a5b4fc' : '#3730a3') }}>
                    CLINICAL LEAD TIME WINDOW: {score?.is_deviating ? '6–8 MONTHS EARLY DRIFT DETECTED' : 'ACTIVE BASELINE SURVEILLANCE'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: theme.subtext, marginTop: '2px' }}>
                    CogniVeil does not diagnose — it buys care teams and families precious time by detecting subtle drift months before symptoms prompt a clinic visit.
                  </div>
                </div>
              </div>
              <button
                onClick={handleOpenReferral}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: score?.is_deviating ? '#d97706' : '#4338ca',
                  color: '#ffffff'
                }}
              >
                View Decision Support Dossier
              </button>
            </div>
          </div>

          {/* 4 Patient Stat Cards */}
          <div style={styles.patientStatsGrid}>
            <div style={{ ...styles.patientStatCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ ...styles.statCardLabel, color: theme.subtext }}>COGNISCORE</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.5rem 0 0.25rem 0' }}>
                <span style={styles.patientBigScore}>{score?.score != null ? Math.round(score.score * 10) / 10 : 'Not available'}</span>
                {score?.score != null && <span style={{ color: theme.subtext, fontSize: '0.85rem', fontWeight: '600' }}>/ 100</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  color: score?.risk_level === 'High' ? '#dc2626' : score?.risk_level === 'Moderate' ? '#d97706' : score?.risk_level === 'Low' ? '#16a34a' : theme.subtext,
                  backgroundColor: score?.risk_level === 'High' ? (isDark ? 'rgba(220, 38, 38, 0.2)' : '#fee2e2') : score?.risk_level === 'Moderate' ? (isDark ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7') : score?.risk_level === 'Low' ? (isDark ? 'rgba(22, 163, 74, 0.2)' : '#dcfce7') : (isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'),
                }}>
                  {score?.risk_level ? `${score.risk_level} Risk` : 'No assessments yet'}
                </span>
                {score?.is_deviating && (
                  <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: '700' }}>Drift Alert</span>
                )}
              </div>
            </div>

            <div style={{ ...styles.patientStatCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ ...styles.statCardLabel, color: theme.subtext }}>DAILY BATTERY</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <p style={{ ...styles.patientCardValue, color: theme.text }}>
                {score?.active_score != null ? `${Math.round(score.active_score)} pts` : 'No tests yet'}
              </p>
              <p style={{ ...styles.patientCardSub, color: theme.subtext }}>5 Micro-Tasks: Pattern, Digit, Word, Stroop, Reaction</p>
            </div>

            <div style={{ ...styles.patientStatCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ ...styles.statCardLabel, color: theme.subtext }}>VOICE JOURNAL</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </div>
              <p style={{ ...styles.patientCardValue, color: theme.text }}>
                {score?.voice_score != null ? `${Math.round(score.voice_score)} pts` : 'No voice recordings yet'}
              </p>
              <p style={{ ...styles.patientCardSub, color: theme.subtext }}>Vernacular speech biomarker routing</p>
            </div>

            <div style={{ ...styles.patientStatCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ ...styles.statCardLabel, color: theme.subtext }}>BEHAVIORAL TELEMETRY</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <p style={{ ...styles.patientCardValue, color: theme.text }}>
                {score?.passive_score != null ? `${Math.round(score.passive_score)} pts` : 'No data yet'}
              </p>
              <p style={{ ...styles.patientCardSub, color: theme.subtext }}>Passive typing & navigation telemetry</p>
            </div>
          </div>

          {/* Transparent Modality Breakdown & Primary Contributors Card */}
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border, marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#6366f1', letterSpacing: '0.08em' }}>TRANSPARENT SIGNAL FUSION</span>
                <h3 style={{ ...styles.cardTitle, color: theme.text, margin: '2px 0 0 0' }}>CogniScore Modality Contribution & Primary Drivers</h3>
                <p style={{ color: theme.subtext, fontSize: '0.8rem', margin: '2px 0 0 0' }}>
                  Deterministic multimodal fusion with transparent weight contributions and individual baseline delta tracking.
                </p>
              </div>
              {score && (
                <button 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: isDark ? '#312e81' : '#e0e7ff',
                    color: '#4338CA',
                    border: '1px solid #6366f1',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.15)'
                  }}
                  onClick={() => setShowExplainModal(true)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>How did CogniVeil reach this result?</span>
                </button>
              )}
            </div>

            {/* Main 2-Column Grid: Modality Contribution Bars & Primary Contributors Box */}
            {!score ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderRadius: '12px', border: `1px dashed ${theme.border}` }}>
                <span style={{ fontSize: '1.8rem' }}>🧠</span>
                <h4 style={{ margin: '0.5rem 0 0.25rem 0', color: theme.text, fontSize: '0.95rem', fontWeight: '800' }}>No assessment data yet</h4>
                <p style={{ margin: 0, color: theme.subtext, fontSize: '0.82rem' }}>Complete daily cognitive tests, voice recordings, and telemetry to generate your multimodal breakdown.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                
                {/* Left Column: Contribution Breakdown */}
                <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: theme.statBoxBg, border: `1px solid ${theme.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: theme.text }}>MODALITY WEIGHT CONTRIBUTIONS</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6366f1' }}>
                      {score?.voice_score ? 'Tri-Modal (60/20/20)' : 'Bi-Modal (80/20)'}
                    </span>
                  </div>

                  {/* Cognitive Modality */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                      <span style={{ color: theme.text }}>Active Cognitive Battery (60%)</span>
                      <span style={{ color: '#4338CA' }}>{score?.active_score != null ? `${Math.round(score.active_score)} / 100` : 'No tests'} <strong style={{ color: theme.subtext, fontSize: '0.72rem' }}>({((score?.active_score || 0) * 0.6).toFixed(1)} pts)</strong></span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(score?.active_score || 0, 100)}%`, height: '100%', backgroundColor: '#4338CA', borderRadius: '4px' }} />
                    </div>
                  </div>

                  {/* Behavioral Modality with Typing & Scrolling Sub-chips */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                      <span style={{ color: theme.text }}>Behavioral Telemetry (20%)</span>
                      <span style={{ color: '#06b6d4' }}>{score?.passive_score != null ? `${Math.round(score.passive_score)} / 100` : 'No telemetry'} <strong style={{ color: theme.subtext, fontSize: '0.72rem' }}>({((score?.passive_score || 0) * 0.2).toFixed(1)} pts)</strong></span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(score?.passive_score || 0, 100)}%`, height: '100%', backgroundColor: '#06b6d4', borderRadius: '4px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.45rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '6px', backgroundColor: isDark ? 'rgba(6,182,212,0.15)' : '#ecfeff', color: '#0891b2' }}>
                        ⌨️ Typing: {score?.typing_score != null ? `${Math.round(score.typing_score)}/100` : 'Active'}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '6px', backgroundColor: isDark ? 'rgba(6,182,212,0.15)' : '#ecfeff', color: '#0891b2' }}>
                        📜 Scrolling: {score?.scrolling_score != null ? `${Math.round(score.scrolling_score)}/100` : 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Voice Modality */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                      <span style={{ color: theme.text }}>Acoustic Voice Biomarkers (20%)</span>
                      <span style={{ color: '#10b981' }}>{score?.voice_score != null ? `${Math.round(score.voice_score)} / 100` : 'No voice entry'} <strong style={{ color: theme.subtext, fontSize: '0.72rem' }}>({((score?.voice_score || 0) * 0.2).toFixed(1)} pts)</strong></span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(score?.voice_score || 0, 100)}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>

                {/* Right Column: Why? PRIMARY CONTRIBUTORS */}
                <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: theme.statBoxBg, border: `1px solid ${theme.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: theme.text }}>WHY? PRIMARY DELTA CONTRIBUTORS</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: theme.subtext }}>VS PERSONAL BASELINE</span>
                  </div>

                  {score?.is_deviating ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div 
                        onClick={() => handleInspectEvidence('E1')}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.75rem', borderRadius: '8px', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.15s' }}
                        title="Click to inspect Evidence E1 (Active Psychometrics)"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem' }}>🧠</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: theme.text }}>1. Memory retention accuracy</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#dc2626' }}>↓ Deviating · View E1 →</span>
                      </div>

                      <div 
                        onClick={() => handleInspectEvidence('E2')}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.75rem', borderRadius: '8px', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.15s' }}
                        title="Click to inspect Evidence E2 (Keystroke Telemetry)"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem' }}>⌨️</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: theme.text }}>2. Typing speed & cadence</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#dc2626' }}>↓ Latency drift · View E2 →</span>
                      </div>

                      <div 
                        onClick={() => handleInspectEvidence('E3')}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.75rem', borderRadius: '8px', backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.15s' }}
                        title="Click to inspect Evidence E3 (Navigation Telemetry)"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem' }}>📜</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: theme.text }}>3. Navigation pause hesitation</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#d97706' }}>↑ Elevated pause · View E3 →</span>
                      </div>

                      <div 
                        onClick={() => handleInspectEvidence('E4')}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.75rem', borderRadius: '8px', backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.15s' }}
                        title="Click to inspect Evidence E4 (Speech Biomarkers)"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem' }}>🎙️</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: theme.text }}>4. Speech inter-phrase pause rate</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#d97706' }}>↑ Pause duration · View E4 →</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: theme.subtext }}>
                      <span style={{ fontSize: '1.5rem', color: '#2F7D5B' }}>✓</span>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', fontWeight: '700', color: theme.text }}>All indicators within normal baseline limits</p>
                      <span style={{ fontSize: '0.75rem' }}>No statistical change-point drift detected across active or passive telemetry channels.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Longitudinal Trend Chart Card */}
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={{ ...styles.cardTitle, color: theme.text }}>Cognitive Score Trend</h3>
                <p style={{ color: theme.subtext, fontSize: '0.8rem', margin: '2px 0 0 0' }}>Daily screening history vs calibrated personal baseline</p>
              </div>
              <button 
                style={{ 
                  ...styles.recalculateBtn, 
                  backgroundColor: theme.recalculateBtnBg, 
                  borderColor: theme.recalculateBtnBorder,
                  color: theme.recalculateBtnText
                }} 
                onClick={handleCalculate}
                disabled={calculating}
              >
                {calculating ? 'Calculating...' : 'Recalculate Score'}
              </button>
            </div>

            {history.length === 0 ? (
              <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderRadius: '12px', border: `1px dashed ${theme.border}`, marginTop: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>📈</span>
                <h4 style={{ margin: '0.5rem 0 0.25rem 0', color: theme.text, fontSize: '1rem', fontWeight: '800' }}>No historical data yet</h4>
                <p style={{ margin: 0, color: theme.subtext, fontSize: '0.85rem' }}>Complete at least one assessment to begin tracking your cognitive trajectory.</p>
              </div>
            ) : (
              <div style={{ width: '100%', height: 260, marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="patientScoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4338CA" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#4338CA" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} vertical={false} />
                    <XAxis dataKey="date" stroke={theme.chartText} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke={theme.chartText} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="natural" 
                      dataKey="score" 
                      stroke="#4338CA" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#patientScoreGrad)" 
                      name="CogniScore" 
                    />
                    <Line 
                      type="natural" 
                      dataKey="baseline" 
                      stroke="#06b6d4" 
                      strokeWidth={2} 
                      strokeDasharray="4 4" 
                      dot={false}
                      name="Personal Baseline" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Ask Assistant — Inline Read-Only Q&A Results Widget */}
          <ChatWidget user={user} />

          {/* 5 Primary Modules Grid */}
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: theme.text, marginBottom: '1rem' }}>Screening & Diagnostic Modules</h3>
            <div style={styles.patientModulesGrid}>
              <div style={{ ...styles.moduleCard, backgroundColor: theme.cardBg, borderColor: theme.border }} onClick={() => navigate('/tests')}>
                <div style={{ ...styles.moduleIconBox, backgroundColor: isDark ? '#1e1b4b' : '#f5f3ff', color: '#4338CA' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                    <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                    <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                    <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ ...styles.moduleTitle, color: theme.text }}>Daily Cognitive Tests</h4>
                  <p style={{ ...styles.moduleDesc, color: theme.subtext }}>5 interactive digital biomarkers: recall, reaction speed & executive function.</p>
                </div>
                <span style={styles.moduleArrow}>→</span>
              </div>

              <div style={{ ...styles.moduleCard, backgroundColor: theme.cardBg, borderColor: theme.border }} onClick={() => navigate('/voice')}>
                <div style={{ ...styles.moduleIconBox, backgroundColor: isDark ? '#064e3b' : '#ecfdf5', color: '#10b981' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ ...styles.moduleTitle, color: theme.text }}>Voice Journal</h4>
                  <p style={{ ...styles.moduleDesc, color: theme.subtext }}>Speak naturally in 7 vernacular languages with AI speech biomarker scoring.</p>
                </div>
                <span style={styles.moduleArrow}>→</span>
              </div>

              <div style={{ ...styles.moduleCard, backgroundColor: theme.cardBg, borderColor: theme.border }} onClick={() => navigate('/level2')}>
                <div style={{ ...styles.moduleIconBox, backgroundColor: isDark ? '#581c87' : '#fdf4ff', color: '#c026d3' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path>
                    <path d="m8.5 8.5 7 7"></path>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ ...styles.moduleTitle, color: theme.text }}>Tier 2 Biomarkers</h4>
                  <p style={{ ...styles.moduleDesc, color: theme.subtext }}>CatBoost ML model analyzing 24 multi-domain lifestyle & clinical factors.</p>
                </div>
                <span style={styles.moduleArrow}>→</span>
              </div>

              <div style={{ ...styles.moduleCard, backgroundColor: theme.cardBg, borderColor: theme.border }} onClick={() => navigate('/level3')}>
                <div style={{ ...styles.moduleIconBox, backgroundColor: isDark ? '#1e3a8a' : '#eff6ff', color: '#2563eb' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ ...styles.moduleTitle, color: theme.text }}>Tier 3 MRI Scans</h4>
                  <p style={{ ...styles.moduleDesc, color: theme.subtext }}>PyTorch ResNet-18 neuroimaging classifier with Grad-CAM heatmap overlay.</p>
                </div>
                <span style={styles.moduleArrow}>→</span>
              </div>

              <div style={{ ...styles.moduleCard, backgroundColor: theme.cardBg, borderColor: theme.border }} onClick={handleOpenReferral}>
                <div style={{ ...styles.moduleIconBox, backgroundColor: isDark ? '#78350f' : '#fef3c7', color: '#d97706' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ ...styles.moduleTitle, color: theme.text }}>Referral PDF Report</h4>
                  <p style={{ ...styles.moduleDesc, color: theme.subtext }}>One-click clinical report package for physician & neurologist consults.</p>
                </div>
                <span style={styles.moduleArrow}>→</span>
              </div>
            </div>
          </div>

          {/* Real-Time Agent & Tool Execution Timeline */}
          <AuditTimelineWidget />

          {/* Session History Table */}
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border, marginTop: '1.5rem' }}>
            <div style={styles.cardHeader}>
              <h3 style={{ ...styles.cardTitle, color: theme.text }}>Recent Screening Sessions</h3>
            </div>
            <div style={styles.tableWrapper}>
              <table style={styles.patientTable}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, color: theme.tableTh }}>Session Date</th>
                    <th style={{ ...styles.th, color: theme.tableTh }}>CogniScore</th>
                    <th style={{ ...styles.th, color: theme.tableTh }}>Active Score</th>
                    <th style={{ ...styles.th, color: theme.tableTh }}>Passive Keystrokes</th>
                    <th style={{ ...styles.th, color: theme.tableTh }}>EWMA Filter</th>
                    <th style={{ ...styles.th, color: theme.tableTh }}>Drift Flag</th>
                    <th style={{ ...styles.th, color: theme.tableTh }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length > 0 ? (
                    history.slice(-7).reverse().map((s, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${theme.tableTrBorder}` }}>
                        <td style={{ ...styles.td, color: theme.text, fontWeight: '700' }}>{s.fullDate || s.date}</td>
                        <td style={{ ...styles.td, fontWeight: '800', color: '#4338CA' }}>{s.score}</td>
                        <td style={{ ...styles.td, color: theme.tableTd }}>{s.active} pts</td>
                        <td style={{ ...styles.td, color: theme.tableTd }}>{s.passive} pts</td>
                        <td style={{ ...styles.td, color: theme.tableTd }}>{s.ewma}</td>
                        <td style={styles.td}>
                          {s.is_deviating ? (
                            <span style={{ color: '#dc2626', fontWeight: '700' }}>Drift Alert</span>
                          ) : (
                            <span style={{ color: '#16a34a', fontWeight: '600' }}>Stable</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            color: s.risk_level === 'High' ? '#dc2626' : s.risk_level === 'Moderate' ? '#d97706' : '#16a34a',
                            backgroundColor: s.risk_level === 'High' ? (isDark ? 'rgba(220, 38, 38, 0.2)' : '#fee2e2') : s.risk_level === 'Moderate' ? (isDark ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7') : (isDark ? 'rgba(22, 163, 74, 0.2)' : '#dcfce7'),
                            display: 'inline-block'
                          }}>
                            {s.risk_level || 'Recorded'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ ...styles.td, textAlign: 'center', color: theme.subtext, padding: '2rem' }}>
                        No screening sessions recorded yet. Take your first daily test battery to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ── CLINICIAN SUPERVISOR WORKSTATION (FULL-WIDTH BALANCED DASHBOARD) ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
          
          {/* 1. Welcome Banner */}
          <div style={{
            ...styles.welcomeBanner,
            background: isDark 
              ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #1e293b 100%)' 
              : 'linear-gradient(135deg, #4338CA 0%, #3730A3 70%, #1e1b4b 100%)',
            border: `1px solid ${isDark ? '#4338CA' : 'transparent'}`,
            boxShadow: '0 10px 30px rgba(67, 56, 202, 0.25)',
            padding: '1.75rem 2.25rem',
            borderRadius: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}>
            <div style={styles.welcomeContent}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: '800', 
                  letterSpacing: '0.08em', 
                  backgroundColor: 'rgba(255, 255, 255, 0.18)', 
                  color: '#ffffff', 
                  padding: '3px 12px', 
                  borderRadius: '20px',
                  backdropFilter: 'blur(6px)'
                }}>
                  CLINICAL COGNITIVE SUPERVISOR · MEMORY CLINIC WORKSTATION
                </span>
              </div>
              <h2 style={{ ...styles.welcomeTitle, fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                Welcome, {user?.name ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`) : `Dr. Sham`}
              </h2>
              <p style={{ ...styles.welcomeSub, maxWidth: '680px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
                Continuous neuromotor, acoustic, and psychometric screening intelligence. <strong>{clinicianPatients.filter(p => p.is_deviating || p.risk_level === 'High').length || 1} cohort patient</strong> currently exhibits active statistical baseline drift requiring clinical review.
              </p>
            </div>

            {/* Supervisor Profile Chip */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              padding: '0.85rem 1.25rem',
              borderRadius: '16px',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                color: '#4338CA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '1.25rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                {(user?.name || user?.email || 'D')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ color: '#ffffff', fontWeight: '800', fontSize: '0.95rem' }}>
                  {user?.name ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`) : `Dr. Sham`}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.74rem' }}>
                  {user?.is_caregiver ? 'Caregiver Supervisor' : 'Clinical Cognitive Supervisor'}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Executive Cohort Status Cards (4-Column Balanced Grid across 100% width) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem'
          }}>
            {/* Card 1: Active Monitored Cohort */}
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border, padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: theme.subtext, letterSpacing: '0.05em' }}>ACTIVE COHORT</span>
                <span style={{ fontSize: '1.1rem' }}>👥</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: theme.text }}>
                {clinicianPatients.length || 7} <span style={{ fontSize: '0.85rem', fontWeight: '600', color: theme.subtext }}>Patients</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: '#10b981', fontWeight: '700' }}>
                ✓ 100% active passive/active telemetry stream
              </p>
            </div>

            {/* Card 2: Cohort Drift Triage */}
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border, padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#ef4444', letterSpacing: '0.05em' }}>COHORT RISK & DRIFT</span>
                <span style={{ fontSize: '1.1rem' }}>⚠️</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ef4444' }}>
                  {clinicianPatients.filter(p => p.is_deviating || p.risk_level === 'High').length || 1}
                </span>
                <span style={{ fontSize: '0.78rem', color: theme.subtext, fontWeight: '700' }}>High Risk Alert Awaiting Review</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: theme.subtext }}>
                {clinicianPatients.filter(p => p.risk_level === 'Moderate').length || 1} Moderate · {clinicianPatients.filter(p => p.risk_level === 'Low').length || 5} Stable
              </p>
            </div>

            {/* Card 3: Clinical Lead Time Window */}
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border, padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#6366f1', letterSpacing: '0.05em' }}>CLINICAL LEAD TIME</span>
                <span style={{ fontSize: '1.1rem' }}>⏱️</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#4338CA' }}>
                6–8 <span style={{ fontSize: '0.85rem', fontWeight: '700', color: theme.subtext }}>Months Gained</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: theme.subtext }}>
                Catches drift months before standard clinical visits
              </p>
            </div>

            {/* Card 4: Multi-Tier Diagnostic Cascade */}
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border, padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#06b6d4', letterSpacing: '0.05em' }}>DIAGNOSTIC CASCADE</span>
                <span style={{ fontSize: '1.1rem' }}>🔬</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#e0e7ff', color: '#4338CA', fontWeight: '800' }}>T1: 7</span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', backgroundColor: isDark ? 'rgba(217,119,6,0.2)' : '#fef3c7', color: '#d97706', fontWeight: '800' }}>T2: 2</span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', backgroundColor: isDark ? 'rgba(6,182,212,0.2)' : '#ecfeff', color: '#0891b2', fontWeight: '800' }}>T3: 1</span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.74rem', color: theme.subtext }}>
                Tri-modal passive/active, ML risk & MRI Grad-CAM
              </p>
            </div>
          </div>

          {/* 3. Clinical Decision Fast-Action Tools (Full-Width Symmetrical Bar) */}
          <div style={{
            ...styles.card,
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
            padding: '1.15rem 1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                backgroundColor: isDark ? '#1e1b4b' : '#f5f3ff',
                border: '1px solid #6366f1',
                color: isDark ? '#c7d2fe' : '#4338CA',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
              onClick={() => setShowAgentPipelineModal(true)}
            >
              <span style={{ fontSize: '1.25rem' }}>⚡</span>
              <div>
                <div style={{ fontWeight: '800' }}>10-Agent Pipeline</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>View multi-agent execution pipeline</div>
              </div>
            </button>

            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                backgroundColor: isDark ? '#083344' : '#ecfeff',
                border: '1px solid #06b6d4',
                color: isDark ? '#a5f3fc' : '#0891b2',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
              onClick={() => setShowEvidenceGraphModal(true)}
            >
              <span style={{ fontSize: '1.25rem' }}>📊</span>
              <div>
                <div style={{ fontWeight: '800' }}>Evidence Graph Topology</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Multimodal signal correlation view</div>
              </div>
            </button>

            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                backgroundColor: isDark ? '#064e3b' : '#ecfdf5',
                border: '1px solid #10b981',
                color: isDark ? '#a7f3d0' : '#059669',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
              onClick={() => navigate('/referral')}
            >
              <span style={{ fontSize: '1.25rem' }}>📋</span>
              <div>
                <div style={{ fontWeight: '800' }}>MedGemma Clinical Dossier</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Plain language & specialist view</div>
              </div>
            </button>

            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                backgroundColor: isDark ? '#312e81' : '#4338CA',
                border: '1px solid #6366f1',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
              onClick={fetchData}
              disabled={calculating}
            >
              <span style={{ fontSize: '1.25rem' }}>🔄</span>
              <div>
                <div style={{ fontWeight: '800' }}>Sync Clinical Roster</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Real-time database refresh</div>
              </div>
            </button>
          </div>

          {/* 4. Middle 2-Column Row: Appointment Request & Appointment Schedule */}
          {apptToast && (
            <div style={{
              padding: '0.6rem 1rem',
              backgroundColor: 'rgba(47, 125, 91, 0.15)',
              color: '#2F7D5B',
              borderRadius: '8px',
              border: '1px solid #2F7D5B',
              fontSize: '0.8rem',
              fontWeight: '700'
            }}>
              ✓ {apptToast}
            </div>
          )}

          <div style={styles.middleTwoCol}>
            
            {/* Left: Appointment Request */}
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={styles.cardHeader}>
                <h3 style={{ ...styles.cardTitle, color: theme.text }}>Appointment Request</h3>
                <span style={styles.seeAllLink} onClick={() => navigate('/appointments?tab=Due')}>See All</span>
              </div>
              <div style={styles.requestList}>
                {(() => {
                  const requests = dashboardAppointments.filter(a => a.status === 'Due' || a.status === 'Pending' || a.status === 'Rejected');
                  
                  if (requests.length === 0) {
                    return (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: theme.subtext, fontSize: '0.82rem' }}>
                        No pending appointment requests at this time.
                      </div>
                    );
                  }
                  
                  return requests.slice(0, 4).map((req, idx) => {
                    const patientDisplay = req.patient_name || req.name || 'Patient';
                    const conditionDisplay = req.appointment_type || req.condition || 'Neurological Evaluation';
                    const timeDisplay = req.scheduled_time || req.time || 'Upcoming';
                    const statusDisplay = req.status || 'Pending';
                    const isAccepted = statusDisplay === 'Accepted';
                    const isRejected = statusDisplay === 'Rejected';

                    return (
                      <div 
                        key={req.id || idx} 
                        style={{ ...styles.requestRow, cursor: 'pointer' }}
                        onClick={() => navigate('/appointments?tab=Due')}
                      >
                        <div style={{ ...styles.personAvatar, backgroundColor: isDark ? '#162B3D' : '#E8F5EE', color: '#0F4C4A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
                          {patientDisplay.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, marginLeft: '8px' }}>
                          <p style={{ ...styles.personName, color: theme.text }}>{patientDisplay}</p>
                          <p style={{ ...styles.personSub, color: theme.subtext }}>{conditionDisplay}</p>
                        </div>
                        <span style={{ ...styles.requestTime, color: theme.subtext, fontSize: '0.74rem' }}>{timeDisplay}</span>
                        
                        {isAccepted ? (
                          <span style={styles.acceptedPill}>Accepted</span>
                        ) : isRejected ? (
                          <span style={{ ...styles.acceptedPill, backgroundColor: 'rgba(201, 76, 76, 0.15)', color: '#C94C4C' }}>Rejected</span>
                        ) : (
                          <div style={styles.actionCircles} onClick={(e) => e.stopPropagation()}>
                            <button 
                              style={styles.checkCircle} 
                              title="Accept Consultation"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (req.id) handleDashboardStatusChange(req.id, 'Accepted');
                                else navigate('/appointments?tab=Due');
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>
                            <button 
                              style={styles.crossCircle} 
                              title="Reject Consultation" 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (req.id) handleDashboardStatusChange(req.id, 'Rejected');
                                else navigate('/appointments?tab=Due');
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Right: Appointment Schedule */}
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={styles.cardHeader}>
                <h3 style={{ ...styles.cardTitle, color: theme.text }}>Appointment Schedule</h3>
                <span style={styles.seeAllLink} onClick={() => navigate('/appointments?tab=Accepted')}>View All</span>
              </div>
              <div style={styles.requestList}>
                {(() => {
                  const scheduled = dashboardAppointments.filter(a => a.status === 'Accepted' || a.status === 'Finished');
                  
                  if (scheduled.length === 0) {
                    return (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: theme.subtext, fontSize: '0.82rem' }}>
                        No confirmed appointments scheduled.
                      </div>
                    );
                  }

                  return scheduled.slice(0, 4).map((item, idx) => {
                    const patientDisplay = item.patient_name || item.name || 'Patient';
                    const conditionDisplay = item.appointment_type || item.condition || 'Clinical Consultation';
                    const isFinished = item.status === 'Finished' || item.statusPill === 'Finished';
                    const timeDisplay = item.scheduled_time || item.time || '10:00 AM';

                    return (
                      <div 
                        key={item.id || idx} 
                        style={{
                          ...styles.requestRow,
                          backgroundColor: isFinished ? (isDark ? '#1e1b4b' : '#f5f3ff') : 'transparent',
                          borderRadius: '10px',
                          padding: isFinished ? '0.6rem 0.75rem' : '0.6rem 0',
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate('/appointments?tab=Accepted')}
                      >
                        <div style={{ ...styles.personAvatar, backgroundColor: isDark ? '#162B3D' : '#E8F5EE', color: '#0F4C4A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
                          {patientDisplay.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, marginLeft: '8px' }}>
                          <p style={{ ...styles.personName, color: isFinished ? '#4338CA' : theme.text }}>
                            {patientDisplay}
                          </p>
                          <p style={{ ...styles.personSub, color: theme.subtext }}>{conditionDisplay}</p>
                        </div>
                        {isFinished ? (
                          <span style={styles.finishedPill}>Completed</span>
                        ) : (
                          <span style={{ ...styles.timeLabel, color: theme.text, fontSize: '0.74rem' }}>{timeDisplay}</span>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

          </div>

          {/* 5. Bottom Full-Width Table: Recent Patients */}
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={{ ...styles.cardTitle, color: theme.text }}>Monitored Clinical Cohort Directory</h3>
                <p style={{ color: theme.subtext, fontSize: '0.8rem', margin: '2px 0 0 0' }}>
                  Real-time psychometric, acoustic, and neuromotor screening trajectories across all enrolled cohort patients.
                </p>
              </div>
              <span style={styles.seeAllLink} onClick={() => navigate('/patients')}>Open Full Directory →</span>
            </div>
            <div style={styles.tableWrapper}>
              <table style={styles.patientTable}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, color: theme.tableTh }}>Name</th>
                    <th style={{ ...styles.th, color: theme.tableTh }}>Gender</th>
                    <th style={{ ...styles.th, color: theme.tableTh }}>Age</th>
                    <th style={{ ...styles.th, color: theme.tableTh }}>Diagnostic Tier</th>
                    <th style={{ ...styles.th, color: theme.tableTh }}>Screening Date</th>
                    <th style={{ ...styles.th, color: theme.tableTh }}>CogniScore</th>
                    <th style={{ ...styles.th, color: theme.tableTh }}>Risk & Drift</th>
                    <th style={{ ...styles.th, color: theme.tableTh }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clinicianPatients.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ ...styles.td, textAlign: 'center', color: theme.subtext, padding: '2rem' }}>
                        No monitored patients available in clinical directory.
                      </td>
                    </tr>
                  ) : (
                    clinicianPatients.slice(0, 7).map((p, idx) => {
                      const isDrift = p.is_deviating || p.risk_level === 'High';
                      const riskBadgeBg = isDrift 
                        ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2')
                        : p.risk_level === 'Moderate'
                        ? (isDark ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7')
                        : (isDark ? 'rgba(47, 125, 91, 0.2)' : '#dcfce7');
                      const riskBadgeColor = isDrift ? '#ef4444' : p.risk_level === 'Moderate' ? '#d97706' : '#2F7D5B';
                      return (
                        <tr key={p.id || idx} style={{ borderBottom: `1px solid ${theme.tableTrBorder}`, cursor: 'pointer' }} onClick={() => navigate('/patients')}>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div style={{ backgroundColor: isDark ? '#162B3D' : '#E8F5EE', color: '#0F4C4A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.78rem', borderRadius: '50%', width: '28px', height: '28px', minWidth: '28px' }}>
                                {(p.name || 'P').charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontWeight: '700', color: theme.text }}>{p.name}</span>
                            </div>
                          </td>
                          <td style={{ ...styles.td, color: theme.tableTd }}>{p.gender || 'N/A'}</td>
                          <td style={{ ...styles.td, color: theme.tableTd }}>{p.age ? `${p.age} yrs` : 'N/A'}</td>
                          <td style={{ ...styles.td, color: theme.tableTd }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: p.level2_status === 'triggered' ? '#D97745' : theme.text }}>
                              {p.level2_status === 'triggered' ? '⚠️ Tier 2 Triggered' : 'Tier 1 Baseline'}
                            </span>
                          </td>
                          <td style={{ ...styles.td, color: theme.tableTd }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Active'}</td>
                          <td style={{ ...styles.td, color: theme.tableTd }}>{p.score != null ? `${Math.round(p.score)} pts` : (p.cogni_score != null ? `${Math.round(p.cogni_score)} pts` : 'Enrolled')}</td>
                          <td style={styles.td}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              color: riskBadgeColor,
                              backgroundColor: riskBadgeBg,
                              display: 'inline-block'
                            }}>
                              {p.risk_level || 'Active'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <button
                              style={{
                                padding: '0.3rem 0.65rem',
                                borderRadius: '6px',
                                backgroundColor: isDark ? '#1e1b4b' : '#f5f3ff',
                                border: '1px solid #6366f1',
                                color: isDark ? '#c7d2fe' : '#4338CA',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/patients');
                              }}
                            >
                              Inspect Dossier →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── Modals ── */}
      <ReferralReportModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        reportData={referralPayload}
        patientData={{
          name: user?.name || 'Dr. Jackson Santos',
          age: user?.age || 65,
          gender: user?.gender || 'Male',
          email: user?.email || '',
        }}
      />

      {/* 10-Step Explain-My-Result Reasoning Walkthrough Modal */}
      <ExplainMyResultModal
        isOpen={showExplainModal}
        onClose={() => setShowExplainModal(false)}
        scoreData={score}
        userData={user}
      />

      {/* Evidence Drawer for Grounded Provenance Inspection [E1..E7] */}
      <EvidenceDrawer
        isOpen={showEvidenceDrawer}
        onClose={() => setShowEvidenceDrawer(false)}
        evidenceId={selectedEvidenceId}
      />

      {/* Multimodal Signal Graph Topology Modal */}
      <EvidenceGraphModal
        isOpen={showEvidenceGraphModal}
        onClose={() => setShowEvidenceGraphModal(false)}
        onSelectEvidence={(eId) => {
          setSelectedEvidenceId(eId);
          setShowEvidenceDrawer(true);
        }}
      />

      {/* 10-Node Multi-Agent Execution Pipeline Modal */}
      <AgentPipelineModal
        isOpen={showAgentPipelineModal}
        onClose={() => setShowAgentPipelineModal(false)}
      />

      {/* Triggered Questionnaire Modal */}
      {showTriggeredModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.triggeredModalBox, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <h3 style={{ color: '#4338CA', margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
                  Clinical Health Assessment Triggered
                </h3>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowTriggeredModal(false)}>✕</button>
            </div>
            <p style={{ color: theme.subtext, fontSize: '0.88rem', lineHeight: '1.5', margin: '0.75rem 0 1.25rem 0' }}>
              CogniVeil's EWMA change-point filter flagged a drop in daily motor/cognitive performance relative to personal baseline.
              Completing the <strong>Level 2 Health Questionnaire</strong> allows our CatBoost ML model to evaluate multi-domain risk factors.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button style={{ ...styles.dismissBtn, color: theme.subtext, borderColor: theme.border }} onClick={() => setShowTriggeredModal(false)}>Later</button>
              <button style={styles.modalCtaBtn} onClick={() => { setShowTriggeredModal(false); navigate('/level2'); }}>
                Complete Level 2 Form →
              </button>
            </div>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
};

const styles = {
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Inter", sans-serif',
  },
  headerPrimaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#4338CA',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '0.65rem 1.25rem',
    fontSize: '0.86rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 310px',
    gap: '1.5rem',
    alignItems: 'start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    minWidth: 0,
  },
  welcomeBanner: {
    backgroundColor: '#4c44b4',
    backgroundImage: 'linear-gradient(135deg, #4c44b4 0%, #4338CA 100%)',
    borderRadius: '20px',
    padding: '1.75rem 2rem',
    color: '#ffffff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(76, 68, 180, 0.22)',
  },
  welcomeContent: {
    maxWidth: '520px',
    zIndex: 2,
  },
  welcomeTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    margin: '0 0 0.4rem 0',
    letterSpacing: '-0.02em',
  },
  welcomeSub: {
    fontSize: '0.84rem',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: '1.4',
    margin: 0,
  },
  welcomeDecor: {
    position: 'absolute',
    right: '10px',
    bottom: '-10px',
    pointerEvents: 'none',
  },
  card: {
    borderRadius: '20px',
    padding: '1.5rem',
    border: '1px solid',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
    transition: 'background-color 0.25s ease, border-color 0.25s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  cardTitle: {
    fontSize: '1.05rem',
    fontWeight: '800',
    margin: 0,
  },
  dropdownSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.78rem',
    fontWeight: '700',
    border: '1px solid',
    borderRadius: '8px',
    padding: '0.35rem 0.65rem',
  },
  chartLegend: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginTop: '0.75rem',
    paddingTop: '0.5rem',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    fontSize: '0.78rem',
    fontWeight: '700',
  },
  middleTwoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  seeAllLink: {
    color: '#4338CA',
    fontSize: '0.78rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  requestList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    marginTop: '0.75rem',
  },
  requestRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  personAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
  },
  personName: {
    fontSize: '0.85rem',
    fontWeight: '700',
    margin: '0 0 2px 0',
  },
  personSub: {
    fontSize: '0.72rem',
    margin: 0,
  },
  requestTime: {
    fontSize: '0.72rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  acceptedPill: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#4338CA',
    fontStyle: 'italic',
  },
  actionCircles: {
    display: 'flex',
    gap: '0.4rem',
  },
  checkCircle: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    border: '1.5px solid #4338CA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  crossCircle: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    border: '1.5px solid #ef4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  finishedPill: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#4338CA',
    fontStyle: 'italic',
  },
  timeLabel: {
    fontSize: '0.82rem',
    fontWeight: '700',
  },
  tableWrapper: {
    overflowX: 'auto',
    marginTop: '0.5rem',
  },
  patientTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.82rem',
    textAlign: 'left',
  },
  th: {
    fontSize: '0.74rem',
    fontWeight: '700',
    padding: '0.75rem 0.5rem',
  },
  td: {
    padding: '0.85rem 0.5rem',
  },
  smallAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    objectFit: 'cover',
  },

  // Right Column
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  profileWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  profileAvatarBox: {
    width: '90px',
    height: '90px',
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(67, 56, 202, 0.15)',
    marginBottom: '1rem',
    border: '2px solid',
  },
  doctorMonogram: {
    width: '74px',
    height: '74px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, #4338CA 0%, #6366f1 100%)',
    color: '#ffffff',
    fontSize: '2rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: '#4338CA',
    margin: '0 0 0.25rem 0',
  },
  doctorSpecialty: {
    fontSize: '0.76rem',
    margin: '0 0 1.25rem 0',
    fontWeight: '600',
  },
  limitBox: {
    border: '1px solid',
    borderRadius: '14px',
    padding: '0.85rem 1rem',
    marginBottom: '1.25rem',
  },
  limitHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitTitle: {
    fontSize: '0.95rem',
    fontWeight: '800',
  },
  limitFraction: {
    fontSize: '0.74rem',
    fontWeight: '700',
  },
  limitSub: {
    fontSize: '0.72rem',
    margin: '2px 0 8px 0',
  },
  progressBarTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4338CA',
    borderRadius: '6px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  statBox: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '0.75rem',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '1.15rem',
    fontWeight: '800',
    margin: '0 0 2px 0',
  },
  statLabel: {
    fontSize: '0.68rem',
    margin: 0,
    fontWeight: '600',
  },
  actionButtonsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  missedCallBtn: {
    backgroundColor: '#4338CA',
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    padding: '0.85rem 0.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
  },
  newMessagesBtn: {
    border: '1.5px solid #4338CA',
    borderRadius: '14px',
    padding: '0.85rem 0.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
  },
  incomeRow: {
    marginTop: '0.5rem',
  },
  incomeValue: {
    fontSize: '1.4rem',
    fontWeight: '800',
  },
  growthPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
    fontSize: '0.72rem',
    fontWeight: '800',
    padding: '0.2rem 0.5rem',
    borderRadius: '12px',
  },
  incomeSub: {
    fontSize: '0.72rem',
    margin: '2px 0 0 0',
  },
  recalculateBtn: {
    width: '100%',
    marginTop: '0.6rem',
    border: '1px solid',
    borderRadius: '10px',
    padding: '0.6rem',
    fontSize: '0.78rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // ── PATIENT DASHBOARD STYLES ──
  patientContainer: {
    maxWidth: '1240px',
    margin: '0 auto',
  },
  patientWelcomeCard: {
    border: '1px solid',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    marginBottom: '1.5rem',
  },
  patientEyebrow: {
    color: '#4338CA',
    fontSize: '0.72rem',
    fontWeight: '800',
    letterSpacing: '0.1em',
    display: 'block',
    marginBottom: '0.35rem',
  },
  patientTitle: {
    fontSize: '1.85rem',
    fontWeight: '800',
    margin: '0 0 0.5rem 0',
    letterSpacing: '-0.02em',
  },
  patientSub: {
    fontSize: '0.92rem',
    lineHeight: '1.5',
    maxWidth: '680px',
    margin: 0,
  },
  startTestsBtn: {
    backgroundColor: '#4338CA',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '0.85rem 1.5rem',
    fontSize: '0.92rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  baselineProgressBox: {
    border: '1px solid',
    borderRadius: '14px',
    padding: '1rem 1.25rem',
    marginTop: '1.25rem',
  },
  patientStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.25rem',
    marginBottom: '1.5rem',
  },
  patientStatCard: {
    border: '1px solid',
    borderRadius: '20px',
    padding: '1.5rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
  },
  statCardLabel: {
    fontSize: '0.72rem',
    fontWeight: '800',
    letterSpacing: '0.08em',
  },
  patientBigScore: {
    fontSize: '2.4rem',
    fontWeight: '900',
    color: '#102A43',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.02em',
  },
  patientCardValue: {
    fontSize: '1.2rem',
    fontWeight: '800',
    margin: '0.5rem 0 0.2rem 0',
  },
  patientCardSub: {
    fontSize: '0.78rem',
    margin: 0,
    lineHeight: 1.4,
  },
  patientModulesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1rem',
  },
  moduleCard: {
    border: '1px solid',
    borderRadius: '16px',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
  },
  moduleIconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  moduleTitle: {
    fontSize: '0.98rem',
    fontWeight: '700',
    margin: '0 0 0.25rem 0',
  },
  moduleDesc: {
    fontSize: '0.78rem',
    margin: 0,
    lineHeight: 1.4,
  },
  moduleArrow: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#4338CA',
    marginLeft: 'auto',
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  triggeredModalBox: {
    borderRadius: '20px',
    maxWidth: '520px',
    width: '100%',
    padding: '2rem',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
    border: '1px solid',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: 0,
  },
  dismissBtn: {
    backgroundColor: 'transparent',
    border: '1px solid',
    borderRadius: '10px',
    padding: '0.65rem 1.25rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalCtaBtn: {
    backgroundColor: '#4338CA',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.65rem 1.5rem',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
  },
};

export default Dashboard;
