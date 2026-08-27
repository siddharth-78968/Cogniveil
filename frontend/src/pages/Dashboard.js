import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  getScore, 
  getScoreHistory, 
  calculateScore, 
  getTodaySignals,
  getClinicalReport
} from '../utils/api';
import ReferralReportModal from '../components/ReferralReportModal';
import ExplainMyResultModal from '../components/ExplainMyResultModal';
import AuditTimelineWidget from '../components/AuditTimelineWidget';
import DoctorLayout from '../components/DoctorLayout';
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
  const [referralPayload, setReferralPayload] = useState(null);

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

  // 12 data points for smooth spline matching the mock in Image 1
  const activityData = history.length >= 12 ? history.slice(-12) : [
    { month: 'Jan', score: 145, baseline: 120, date: '01 Jan' },
    { month: 'Feb', score: 165, baseline: 155, date: '01 Feb' },
    { month: 'Mar', score: 150, baseline: 152, date: '01 Mar' },
    { month: 'Apr', score: 180, baseline: 160, date: '01 Apr' },
    { month: 'May', score: 175, baseline: 190, date: '01 May' },
    { month: 'Jun', score: 210, baseline: 180, date: '01 Jun' },
    { month: 'Jul', score: 220, baseline: 195, date: '01 Jul' },
    { month: 'Aug', score: 195, baseline: 210, date: '01 Aug' },
    { month: 'Sep', score: 240, baseline: 200, date: '01 Sep' },
    { month: 'Oct', score: 230, baseline: 225, date: '01 Oct' },
    { month: 'Nov', score: 260, baseline: 240, date: '01 Nov' },
    { month: 'Dec', score: 280, baseline: 250, date: '01 Dec' },
  ];

  // Request items matching "Appointment Request"
  const testRequests = [
    {
      name: 'Lucile Crawford',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      condition: 'Acoustic Fluency',
      time: '18/03/2026 - 10 AM',
      status: 'Accepted',
      path: '/voice'
    },
    {
      name: 'Amy Jacobs',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      condition: 'Stroop Reaction Test',
      time: '18/03/2026 - 12 PM',
      status: 'Accepted',
      path: '/tests'
    },
    {
      name: 'Adele Gross',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      condition: 'Episodic Memory',
      time: '19/03/2026 - 3 PM',
      status: 'Due',
      path: '/tests'
    },
    {
      name: 'Acoustic Voice Journal',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      condition: 'Speech Biomarker',
      time: '24/03/2026 - 7 AM',
      status: 'Due',
      path: '/voice'
    },
  ];

  // Schedule items matching "Appointment"
  const scheduleItems = [
    {
      name: 'Mable Clarke',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      condition: 'Passive Telemetry Sync',
      statusPill: 'Finished',
      time: null,
    },
    {
      name: 'Ray Clayton',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
      condition: 'Cognitive Battery',
      statusPill: null,
      time: '12:00',
    },
    {
      name: 'Cornelia Holland',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      condition: 'Tier 2 Biomarkers',
      statusPill: null,
      time: '14:00',
    },
    {
      name: 'Brett Olson',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
      condition: 'MRI ResNet Review',
      statusPill: null,
      time: '16:00',
    },
  ];

  // Recent Patient rows matching "Recent Patients" table
  const recentPatients = [
    {
      name: 'Lucile Crawford',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      gender: 'Female',
      weight: '78.5 pts',
      disease: '82.0 pts',
      date: 'Today',
      heartRate: '78.2 EWMA',
      bloodType: 'CUSUM 0.4',
      status: 'Accepted',
      statusColor: '#6366f1',
      statusBg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff',
    },
    {
      name: 'Amy Jacobs',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      gender: 'Female',
      weight: '64.0 pts',
      disease: '71.5 pts',
      date: 'Today',
      heartRate: '68.0 EWMA',
      bloodType: 'CUSUM 3.8',
      status: 'Checkup',
      statusColor: '#06b6d4',
      statusBg: isDark ? 'rgba(6, 182, 212, 0.15)' : '#ecfeff',
    },
    {
      name: 'Adele Gross',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      gender: 'Female',
      weight: '45.0 pts',
      disease: '42.0 pts',
      date: 'Yesterday',
      heartRate: '48.5 EWMA',
      bloodType: 'CUSUM 14.2',
      status: 'Follow Up',
      statusColor: '#ef4444',
      statusBg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
    },
    {
      name: 'Ray Clayton',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
      gender: 'Male',
      weight: '88.0 pts',
      disease: '85.0 pts',
      date: 'Yesterday',
      heartRate: '86.4 EWMA',
      bloodType: 'CUSUM 0.2',
      status: 'Completed',
      statusColor: '#10b981',
      statusBg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
    },
    {
      name: 'Arjun Sharma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      gender: 'Male',
      weight: '92.0 pts',
      disease: '95.0 pts',
      date: '24 Aug',
      heartRate: '88.0 EWMA',
      bloodType: 'CUSUM 1.2',
      status: 'Accepted',
      statusColor: '#6366f1',
      statusBg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff',
    }
  ];

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
      actionButton={
        <button 
          style={styles.headerPrimaryBtn}
          onClick={() => navigate('/tests')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>{user?.is_caregiver ? 'Make Appointment' : 'Take Daily Test'}</span>
        </button>
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
              <button style={styles.startTestsBtn} onClick={() => navigate('/tests')}>
                <span>Take Today's Tests</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
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
                <span style={styles.patientBigScore}>{score?.score != null ? Math.round(score.score * 10) / 10 : '—'}</span>
                <span style={{ color: theme.subtext, fontSize: '0.85rem', fontWeight: '600' }}>/ 100</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  color: score?.risk_level === 'High' ? '#dc2626' : score?.risk_level === 'Moderate' ? '#d97706' : '#16a34a',
                  backgroundColor: score?.risk_level === 'High' ? (isDark ? 'rgba(220, 38, 38, 0.2)' : '#fee2e2') : score?.risk_level === 'Moderate' ? (isDark ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7') : (isDark ? 'rgba(22, 163, 74, 0.2)' : '#dcfce7'),
                }}>
                  {score?.risk_level || 'Awaiting Tests'}
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
              <p style={{ ...styles.patientCardValue, color: theme.text }}>5 Micro-Tests</p>
              <p style={{ ...styles.patientCardSub, color: theme.subtext }}>Pattern, Digit, Word, Stroop, Reaction</p>
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
              <p style={{ ...styles.patientCardValue, color: theme.text }}>7 Languages</p>
              <p style={{ ...styles.patientCardSub, color: theme.subtext }}>Whisper speech biomarker routing</p>
            </div>

            <div style={{ ...styles.patientStatCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ ...styles.statCardLabel, color: theme.subtext }}>CARE CIRCLE</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <p style={{ ...styles.patientCardValue, color: theme.text }}>Telemetry Sync</p>
              <p style={{ ...styles.patientCardSub, color: theme.subtext }}>Consent-gated sharing with family/doctor</p>
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
            </div>

            {/* Main 2-Column Grid: Modality Contribution Bars & Primary Contributors Box */}
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
                    <span style={{ color: '#4338CA' }}>{Math.round(score?.active_score || 73)} / 100 <strong style={{ color: theme.subtext, fontSize: '0.72rem' }}>({((score?.active_score || 73) * 0.6).toFixed(1)} pts)</strong></span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(score?.active_score || 73, 100)}%`, height: '100%', backgroundColor: '#4338CA', borderRadius: '4px' }} />
                  </div>
                </div>

                {/* Behavioral Modality with Typing & Scrolling Sub-chips */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                    <span style={{ color: theme.text }}>Behavioral Telemetry (20%)</span>
                    <span style={{ color: '#06b6d4' }}>{Math.round(score?.passive_score || 67)} / 100 <strong style={{ color: theme.subtext, fontSize: '0.72rem' }}>({((score?.passive_score || 67) * 0.2).toFixed(1)} pts)</strong></span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(score?.passive_score || 67, 100)}%`, height: '100%', backgroundColor: '#06b6d4', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.45rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '6px', backgroundColor: isDark ? 'rgba(6,182,212,0.15)' : '#ecfeff', color: '#0891b2' }}>
                      ⌨️ Typing: {Math.round(score?.typing_score || score?.passive_score || 64)}/100
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '6px', backgroundColor: isDark ? 'rgba(6,182,212,0.15)' : '#ecfeff', color: '#0891b2' }}>
                      📜 Scrolling: {Math.round(score?.scrolling_score || score?.passive_score || 72)}/100
                    </span>
                  </div>
                </div>

                {/* Voice Modality */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                    <span style={{ color: theme.text }}>Acoustic Voice Biomarkers (20%)</span>
                    <span style={{ color: '#10b981' }}>{Math.round(score?.voice_score || 70)} / 100 <strong style={{ color: theme.subtext, fontSize: '0.72rem' }}>({((score?.voice_score || 70) * 0.2).toFixed(1)} pts)</strong></span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(score?.voice_score || 70, 100)}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>

              {/* Right Column: Why? PRIMARY CONTRIBUTORS */}
              <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: theme.statBoxBg, border: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800', color: theme.text }}>WHY? PRIMARY DELTA CONTRIBUTORS</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: theme.subtext }}>VS PERSONAL BASELINE</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.65rem', borderRadius: '8px', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem' }}>🧠</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: theme.text }}>1. Memory retention accuracy</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#dc2626' }}>↓ 16.2% from baseline</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.65rem', borderRadius: '8px', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem' }}>⌨️</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: theme.text }}>2. Typing speed & cadence</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#dc2626' }}>↓ 20.6% from baseline</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.65rem', borderRadius: '8px', backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem' }}>📜</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: theme.text }}>3. Navigation pause hesitation</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#d97706' }}>↑ 85.7% from baseline</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.65rem', borderRadius: '8px', backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem' }}>🎙️</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: theme.text }}>4. Speech inter-phrase pause rate</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#d97706' }}>↑ 42.0% from baseline</span>
                  </div>
                </div>
              </div>
            </div>
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
          </div>

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
        /* ── CAREGIVER / DOCTOR SUPERVISOR DASHBOARD ── */
        <div style={styles.dashboardGrid}>
          
          {/* ── LEFT & CENTER MAIN WORKSPACE ── */}
          <div style={styles.leftCol}>
            
            {/* 1. Welcome Banner */}
            <div style={styles.welcomeBanner}>
              <div style={styles.welcomeContent}>
                <h2 style={styles.welcomeTitle}>
                  Hello {user?.name ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`) : `Dr. Jackson Santos`}
                </h2>
                <p style={styles.welcomeSub}>
                  Here are your patient telemetry logs and clinical reports. Please review the pending screening alerts.
                </p>
              </div>
              {/* Subtle medical backdrop illustration */}
              <div style={styles.welcomeDecor}>
                <svg width="140" height="90" viewBox="0 0 200 120" fill="none" opacity="0.35">
                  <path d="M10 60 Q 50 10, 90 60 T 170 60 T 250 60" stroke="#ffffff" strokeWidth="4" fill="none"/>
                  <circle cx="90" cy="60" r="12" fill="#ffffff" fillOpacity="0.4"/>
                  <circle cx="170" cy="60" r="16" fill="#ffffff" fillOpacity="0.3"/>
                </svg>
              </div>
            </div>

            {/* 2. Activity Dual Spline Wave Chart */}
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={{ ...styles.cardTitle, color: theme.text }}>Activity</h3>
                </div>
                <div 
                  style={{ 
                    ...styles.dropdownSelector, 
                    backgroundColor: theme.statBoxBg, 
                    borderColor: theme.border,
                    color: theme.text,
                    cursor: 'pointer' 
                  }}
                  onClick={() => setChartTimeframe(prev => prev === 'This Year' ? 'Past 7 Days' : 'This Year')}
                  title="Click to toggle timeframe"
                >
                  <span>{chartTimeframe}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              {/* Spline Chart */}
              <div style={{ width: '100%', height: 230, marginTop: '0.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="consultGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4338CA" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#4338CA" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="patientGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} vertical={false} />
                    <XAxis dataKey="month" stroke={theme.chartText} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={theme.chartText} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="natural" 
                      dataKey="score" 
                      stroke="#4338CA" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#consultGrad)" 
                      name="Consultations" 
                    />
                    <Area 
                      type="natural" 
                      dataKey="baseline" 
                      stroke="#06b6d4" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#patientGrad)" 
                      name="Patients" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend */}
              <div style={{ ...styles.chartLegend, borderTop: `1px solid ${theme.borderSubtle}` }}>
                <div style={styles.legendItem}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: '#4338CA', borderRadius: '3px' }} />
                  <span style={{ color: theme.subtext }}>Consultations</span>
                </div>
                <div style={styles.legendItem}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: '#06b6d4', borderRadius: '3px' }} />
                  <span style={{ color: theme.subtext }}>Patients</span>
                </div>
              </div>
            </div>

            {/* 3. Middle 2-Column Row: Appointment Request & Appointment */}
            <div style={styles.middleTwoCol}>
              
              {/* Left: Appointment Request */}
              <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <div style={styles.cardHeader}>
                  <h3 style={{ ...styles.cardTitle, color: theme.text }}>Appointment Request</h3>
                  <span style={styles.seeAllLink} onClick={() => navigate('/tests')}>See All</span>
                </div>
                <div style={styles.requestList}>
                  {testRequests.map((req, idx) => (
                    <div key={idx} style={styles.requestRow}>
                      <img src={req.avatar} alt={req.name} style={styles.personAvatar} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ ...styles.personName, color: theme.text }}>{req.name}</p>
                        <p style={{ ...styles.personSub, color: theme.subtext }}>{req.condition}</p>
                      </div>
                      <span style={{ ...styles.requestTime, color: theme.subtext }}>{req.time}</span>
                      {req.status === 'Accepted' ? (
                        <span style={styles.acceptedPill}>Accepted</span>
                      ) : (
                        <div style={styles.actionCircles}>
                          <button 
                            style={styles.checkCircle} 
                            title="Take test now"
                            onClick={() => navigate(req.path)}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </button>
                          <button style={styles.crossCircle} title="Dismiss">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Appointment Schedule */}
              <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <div style={styles.cardHeader}>
                  <h3 style={{ ...styles.cardTitle, color: theme.text }}>Appointment</h3>
                  <div style={{ ...styles.dropdownSelector, backgroundColor: theme.statBoxBg, borderColor: theme.border, color: theme.text }}>
                    <span>Today</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
                <div style={styles.requestList}>
                  {scheduleItems.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        ...styles.requestRow,
                        backgroundColor: item.statusPill === 'Finished' ? (isDark ? '#1e1b4b' : '#f5f3ff') : 'transparent',
                        borderRadius: '10px',
                        padding: item.statusPill === 'Finished' ? '0.6rem 0.75rem' : '0.6rem 0'
                      }}
                    >
                      <img src={item.avatar} alt={item.name} style={styles.personAvatar} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ ...styles.personName, color: item.statusPill === 'Finished' ? '#4338CA' : theme.text }}>
                          {item.name}
                        </p>
                        <p style={{ ...styles.personSub, color: theme.subtext }}>{item.condition}</p>
                      </div>
                      {item.statusPill ? (
                        <span style={styles.finishedPill}>{item.statusPill}</span>
                      ) : (
                        <span style={{ ...styles.timeLabel, color: theme.text }}>{item.time}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* 4. Bottom Table: Recent Patients */}
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={styles.cardHeader}>
                <h3 style={{ ...styles.cardTitle, color: theme.text }}>Recent Patients</h3>
              </div>
              <div style={styles.tableWrapper}>
                <table style={styles.patientTable}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, color: theme.tableTh }}>Name</th>
                      <th style={{ ...styles.th, color: theme.tableTh }}>Gender</th>
                      <th style={{ ...styles.th, color: theme.tableTh }}>Weight</th>
                      <th style={{ ...styles.th, color: theme.tableTh }}>Disease</th>
                      <th style={{ ...styles.th, color: theme.tableTh }}>Date</th>
                      <th style={{ ...styles.th, color: theme.tableTh }}>Heart Rate</th>
                      <th style={{ ...styles.th, color: theme.tableTh }}>Blood Type</th>
                      <th style={{ ...styles.th, color: theme.tableTh }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPatients.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${theme.tableTrBorder}` }}>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <img src={p.avatar} alt={p.name} style={styles.smallAvatar} />
                            <span style={{ fontWeight: '700', color: theme.text }}>{p.name}</span>
                          </div>
                        </td>
                        <td style={{ ...styles.td, color: theme.tableTd }}>{p.gender}</td>
                        <td style={{ ...styles.td, color: theme.tableTd }}>{p.weight}</td>
                        <td style={{ ...styles.td, color: theme.tableTd }}>{p.disease}</td>
                        <td style={{ ...styles.td, color: theme.tableTd }}>{p.date}</td>
                        <td style={{ ...styles.td, color: theme.tableTd }}>{p.heartRate}</td>
                        <td style={{ ...styles.td, color: theme.tableTd }}>{p.bloodType}</td>
                        <td style={styles.td}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            color: p.statusColor,
                            backgroundColor: p.statusBg,
                            display: 'inline-block'
                          }}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>


          {/* ── RIGHT PROFILE & METRICS SIDE PANEL ── */}
          <div style={styles.rightCol}>
            
            {/* Profile Card with Professional Monogram Avatar (Photo Removed) */}
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={styles.profileWrapper}>
                <div style={{ ...styles.profileAvatarBox, backgroundColor: isDark ? '#1e1b4b' : '#f5f3ff', borderColor: isDark ? '#312e81' : '#c7d2fe' }}>
                  <div style={styles.doctorMonogram}>
                    {(user?.name || user?.email || 'D')[0].toUpperCase()}
                  </div>
                </div>
                <h3 style={styles.doctorName}>
                  {user?.name ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`) : `Dr. Jackson Santos`}
                </h3>
                <p style={{ ...styles.doctorSpecialty, color: theme.subtext }}>
                  {user?.is_caregiver ? 'Caregiver Supervisor' : 'Clinical Cognitive Supervisor'}
                </p>
              </div>

              {/* Limit Progress Bar */}
              <div style={{ ...styles.limitBox, backgroundColor: theme.statBoxBg, borderColor: theme.border }}>
                <div style={styles.limitHeader}>
                  <span style={{ ...styles.limitTitle, color: theme.text }}>150 People</span>
                  <span style={{ ...styles.limitFraction, color: theme.subtext }}>150/300</span>
                </div>
                <p style={{ ...styles.limitSub, color: theme.subtext }}>Appointments Limit</p>
                <div style={styles.progressBarTrack}>
                  <div style={styles.progressBarFill} />
                </div>
              </div>

              {/* 4 Stat Counters Grid */}
              <div style={styles.statsGrid}>
                <div style={{ ...styles.statBox, backgroundColor: theme.statBoxBg, borderColor: theme.border }}>
                  <p style={{ ...styles.statNumber, color: theme.text }}>2.543</p>
                  <p style={{ ...styles.statLabel, color: theme.subtext }}>Appointments</p>
                </div>
                <div style={{ ...styles.statBox, backgroundColor: theme.statBoxBg, borderColor: theme.border }}>
                  <p style={{ ...styles.statNumber, color: theme.text }}>3.567</p>
                  <p style={{ ...styles.statLabel, color: theme.subtext }}>Total Patients</p>
                </div>
                <div style={{ ...styles.statBox, backgroundColor: theme.statBoxBg, borderColor: theme.border }}>
                  <p style={{ ...styles.statNumber, color: theme.text }}>13.078</p>
                  <p style={{ ...styles.statLabel, color: theme.subtext }}>Consultations</p>
                </div>
                <div style={{ ...styles.statBox, backgroundColor: theme.statBoxBg, borderColor: theme.border }}>
                  <p style={{ ...styles.statNumber, color: theme.text }}>{score ? `${score.score}` : '2.736'}</p>
                  <p style={{ ...styles.statLabel, color: theme.subtext }}>Return Patients</p>
                </div>
              </div>

              {/* Action Buttons (No Emojis, Clean Vector SVGs) */}
              <div style={styles.actionButtonsGrid}>
                <button style={styles.missedCallBtn} onClick={() => alert('Caregiver emergency dispatch contacted.')}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>18</span>
                  <span style={{ fontSize: '0.74rem' }}>Missed Call</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '2px' }}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </button>
                <button 
                  style={{ 
                    ...styles.newMessagesBtn, 
                    backgroundColor: theme.cardBg, 
                    borderColor: '#4338CA', 
                    color: '#4338CA' 
                  }} 
                  onClick={() => navigate('/voice')}
                >
                  <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>9</span>
                  <span style={{ fontSize: '0.74rem' }}>New Messages</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '2px' }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </button>
              </div>
            </div>

            {/* Incomes & Clinical Risk Card */}
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={styles.cardHeader}>
                <h4 style={{ ...styles.cardTitle, color: theme.text }}>Incomes</h4>
                <div style={{ ...styles.dropdownSelector, backgroundColor: theme.statBoxBg, borderColor: theme.border, color: theme.text }}>
                  <span>February</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
              
              <div style={styles.incomeRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ ...styles.incomeValue, color: theme.text }}>$2.857,15</span>
                  <span style={styles.growthPill}>+56%</span>
                </div>
                <p style={{ ...styles.incomeSub, color: theme.subtext }}>From last month</p>
              </div>

              <div style={{ marginTop: '1rem', borderTop: `1px solid ${theme.borderSubtle}`, paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: theme.subtext, fontWeight: '600' }}>CogniScore Risk:</span>
                  <span style={{ 
                    fontSize: '0.82rem', 
                    fontWeight: '800',
                    color: score?.risk_level === 'High' ? '#ef4444' : '#10b981' 
                  }}>
                    {score?.risk_level || 'Low'} Risk Category
                  </span>
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
                  {calculating ? 'Calculating...' : 'Recalculate Live Metrics'}
                </button>
              </div>
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
    color: '#4338CA',
    lineHeight: 1,
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
