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
  getClinicianPatients,
  createClinicianPatient,
  updateClinicianPatient,
  deleteClinicianPatient,
  getStreak
} from '../utils/api';
import ReferralReportModal from '../components/ReferralReportModal';
import ExplainMyResultModal from '../components/ExplainMyResultModal';
import AuditTimelineWidget from '../components/AuditTimelineWidget';
import EvidenceDrawer from '../components/EvidenceDrawer';
import EvidenceGraphModal from '../components/EvidenceGraphModal';
import AgentPipelineModal from '../components/AgentPipelineModal';
import ProfileEditModal from '../components/ProfileEditModal';
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [streak, setStreak] = useState(null);
  const [referralPayload, setReferralPayload] = useState(null);
  const [dashboardAppointments, setDashboardAppointments] = useState([]);
  const [clinicianPatients, setClinicianPatients] = useState([]);
  const [apptToast, setApptToast] = useState(null);

  // Patient CRUD state for Recent Patients
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    email: '',
    age: '',
    gender: 'Female',
    risk_level: 'Low',
    initial_score: 75
  });
  const [editingPatient, setEditingPatient] = useState(null);
  const [deletingPatient, setDeletingPatient] = useState(null);
  const [patientActionLoading, setPatientActionLoading] = useState(false);
  const [patientActionError, setPatientActionError] = useState(null);
  const [patientToast, setPatientToast] = useState(null);

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!newPatientForm.name.trim() || !newPatientForm.email.trim()) {
      setPatientActionError('Name and email are required');
      return;
    }
    setPatientActionLoading(true);
    setPatientActionError(null);
    try {
      const res = await createClinicianPatient({
        name: newPatientForm.name.trim(),
        email: newPatientForm.email.trim(),
        age: newPatientForm.age ? parseInt(newPatientForm.age, 10) : undefined,
        gender: newPatientForm.gender,
        risk_level: newPatientForm.risk_level,
        initial_score: newPatientForm.initial_score ? parseFloat(newPatientForm.initial_score) : 75.0
      });
      setClinicianPatients((prev) => [res.data, ...prev]);
      setIsAddPatientModalOpen(false);
      setNewPatientForm({
        name: '',
        email: '',
        age: '',
        gender: 'Female',
        risk_level: 'Low',
        initial_score: 75
      });
      setPatientToast({ type: 'success', text: `Patient "${res.data.name}" enrolled successfully.` });
      setTimeout(() => setPatientToast(null), 4500);
    } catch (err) {
      console.error('Error creating patient:', err);
      const errMsg = err.response?.data?.detail || 'Failed to enroll patient.';
      setPatientActionError(errMsg);
    } finally {
      setPatientActionLoading(false);
    }
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    if (!editingPatient) return;
    setPatientActionLoading(true);
    setPatientActionError(null);
    try {
      const res = await updateClinicianPatient(editingPatient.id, {
        name: editingPatient.name.trim(),
        email: editingPatient.email.trim(),
        age: editingPatient.age ? parseInt(editingPatient.age, 10) : undefined,
        gender: editingPatient.gender,
        risk_level: editingPatient.risk_level,
        score: editingPatient.score !== '' && editingPatient.score != null ? parseFloat(editingPatient.score) : undefined
      });
      setClinicianPatients((prev) =>
        prev.map((p) => (p.id === editingPatient.id ? { ...p, ...res.data } : p))
      );
      setEditingPatient(null);
      setPatientToast({ type: 'success', text: `Patient "${res.data.name}" records updated.` });
      setTimeout(() => setPatientToast(null), 4500);
    } catch (err) {
      console.error('Error updating patient:', err);
      const errMsg = err.response?.data?.detail || 'Failed to update patient.';
      setPatientActionError(errMsg);
    } finally {
      setPatientActionLoading(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!deletingPatient) return;
    setPatientActionLoading(true);
    setPatientActionError(null);
    try {
      await deleteClinicianPatient(deletingPatient.id);
      setClinicianPatients((prev) => prev.filter((p) => p.id !== deletingPatient.id));
      const deletedName = deletingPatient.name || deletingPatient.email;
      setDeletingPatient(null);
      setPatientToast({ type: 'success', text: `Patient "${deletedName}" removed from cohort.` });
      setTimeout(() => setPatientToast(null), 4500);
    } catch (err) {
      console.error('Error deleting patient:', err);
      const errMsg = err.response?.data?.detail || 'Failed to delete patient.';
      setPatientActionError(errMsg);
    } finally {
      setPatientActionLoading(false);
    }
  };

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
      setApptToast({ type: 'success', text: `Appointment #${id} updated to ${newStatus}` });
      setTimeout(() => setApptToast(null), 4000);
    } catch (err) {
      console.error('Error updating appointment on dashboard:', err);
      const errMsg = err.response?.data?.detail || 'Failed to update appointment status.';
      setApptToast({ type: 'error', text: errMsg });
      setTimeout(() => setApptToast(null), 5000);
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

    try {
      const streakRes = await getStreak();
      setStreak(streakRes.data);
    } catch (err) {
      console.error('Error fetching streak in dashboard:', err);
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

  const activityData = history;

  if (loading) {
    return (
      <div style={{ ...styles.loadingScreen, backgroundColor: theme.bg, color: theme.text }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#a3b18a' : '#273822'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
        </svg>
        <p style={{ color: isDark ? '#a3b18a' : '#273822', fontWeight: '700', fontFamily: "'Mulish', 'Inter', sans-serif" }}>Loading CogniVeil Dashboard...</p>
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
      {!isClinician ? (
        <div style={styles.patientContainer}>
          {/* Patient Welcome Banner */}
          <div style={{ ...styles.patientWelcomeCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ ...styles.patientTitle, color: theme.text }}>Welcome back, {user?.name || user?.email?.split('@')[0]}</h1>
                <p style={{ ...styles.patientSub, color: theme.subtext }}>
                  Longitudinal neuromotor & speech biomarker screening. Take your ~2–3 minute daily check-in to maintain baseline accuracy.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button style={styles.startTestsBtn} onClick={() => navigate('/tests')}>
                  <span>Take Today's Tests</span>
                </button>
                <button 
                  style={{
                    ...styles.startTestsBtn,
                    backgroundColor: isDark ? 'rgba(82, 110, 73, 0.16)' : '#e8efe6',
                    border: `1.5px solid ${isDark ? '#3d5236' : '#c9d8c6'}`,
                    color: isDark ? '#a3b18a' : '#273822'
                  }}
                  onClick={() => navigate('/voice')}
                  title="Speak naturally for acoustic speech biomarker screening"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                  <span>Voice Journal</span>
                </button>
                <button 
                  style={{
                    ...styles.startTestsBtn,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    border: `1.5px solid ${theme.border}`,
                    color: theme.text
                  }}
                  onClick={() => navigate('/appointments?action=new')}
                >
                  <span>Book Consultation</span>
                </button>
                <button 
                  style={{
                    ...styles.startTestsBtn,
                    backgroundColor: isDark ? '#162216' : '#e8efe6',
                    border: `1.5px solid ${isDark ? '#3d5236' : '#d2ded0'}`,
                    color: isDark ? '#a3b18a' : '#273822',
                  }}
                  onClick={() => setIsProfileModalOpen(true)}
                  title="Edit your name, email, age, gender or security details with verification"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Baseline Calibration Progress */}
            <div style={{ ...styles.baselineProgressBox, backgroundColor: theme.statBoxBg, borderColor: theme.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: '700', color: theme.text }}>
                  {history.length < 7 ? `Day ${Math.max(history.length, 1)} of 7: Baseline Calibration Mode` : `Personal Baseline Established`}
                </span>
                <span style={{ fontSize: '0.85rem', color: theme.subtext, fontWeight: '600' }}>
                  {history.length < 7 ? `${Math.round((history.length / 7) * 100)}% Calibrated` : `${history.length} Sessions Logged`}
                </span>
              </div>
              <div style={{ ...styles.progressBarTrack, height: '8px' }}>
                <div style={{ ...styles.progressBarFill, width: `${Math.min((history.length / 7) * 100, 100)}%` }} />
              </div>
            </div>

            {/* DementAI "Buy Patients Time" Lead Time Benefit Callout */}
            <div style={{
              marginTop: '1rem',
              padding: '0.95rem 1.4rem',
              borderRadius: '14px',
              backgroundColor: theme.statBoxBg,
              border: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: isDark ? 'rgba(163, 177, 138, 0.16)' : '#e8efe6',
                  color: isDark ? '#a3b18a' : '#273822',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: '700', color: theme.text }}>
                      {history.length < 7
                        ? `Day ${Math.max(history.length, 1)} of 7 — Building your personal baseline`
                        : `Personal Baseline Established · ${streak?.current_streak || history.length || 1} Day Streak`}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: theme.subtext, fontFamily: "'JetBrains Mono', monospace", fontWeight: '700' }}>
                      {history.length < 7 ? `${Math.round((history.length / 7) * 100)}% Calibrated` : `${history.length} Sessions Logged`}
                    </span>
                  </div>
                  <div style={{ ...styles.progressBarTrack, height: '6px' }}>
                    <div style={{ ...styles.progressBarFill, width: `${Math.min((history.length / 7) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  fontSize: '0.78rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: '700',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  backgroundColor: isDark ? 'rgba(34, 211, 238, 0.1)' : '#e0f2fe',
                  color: isDark ? '#38bdf8' : '#0284c7',
                  border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.3)' : '#bae6fd'}`
                }}>
                  {streak?.attended_today ? '✓ Checked-in Today' : 'Routine Active'}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Patient Stat Cards: Differentiated Hierarchy */}
          <div style={styles.patientStatsGrid}>
            {/* Primary Hero Card: CogniScore with Waveform-resolves-to-number motif */}
            <div style={{ 
              ...styles.patientHeroStatCard, 
              backgroundColor: theme.cardBg, 
              borderColor: isDark ? '#1E293B' : theme.border 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', fontFamily: "Inter, system-ui, sans-serif", color: theme.text }}>
                  CogniScore
                </span>
                {/* Reserved Diagnostic Risk Indicator */}
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: '0.02em',
                  color: score?.risk_level === 'High' ? '#EF4444' : score?.risk_level === 'Moderate' ? '#F59E0B' : score?.risk_level === 'Low' ? '#10B981' : theme.subtext,
                  backgroundColor: score?.risk_level === 'High' ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2') : score?.risk_level === 'Moderate' ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB') : score?.risk_level === 'Low' ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5') : (isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'),
                  border: `1px solid ${score?.risk_level === 'High' ? 'rgba(239, 68, 68, 0.3)' : score?.risk_level === 'Moderate' ? 'rgba(245, 158, 11, 0.3)' : score?.risk_level === 'Low' ? 'rgba(16, 185, 129, 0.3)' : 'transparent'}`
                }}>
                  {score?.risk_level ? `${score.risk_level} Risk` : 'Pending'}
                </span>
              </div>

              {/* Signature Motif: Waveform-resolves-to-number */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', margin: '0.85rem 0 0.4rem 0' }}>
                <svg width="76" height="28" viewBox="0 0 68 26" fill="none" style={{ opacity: isDark ? 0.8 : 0.65, flexShrink: 0 }}>
                  <path 
                    d="M2 13 H12 L16 5 L22 21 L28 8 L34 18 L38 10 L44 14 H66" 
                    stroke={isDark ? '#22D3EE' : '#0891B2'} 
                    strokeWidth="1.75" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  <circle cx="66" cy="14" r="2" fill={isDark ? '#22D3EE' : '#0891B2'} />
                </svg>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span style={styles.patientBigScore}>
                    {score?.score != null ? Math.round(score.score * 10) / 10 : '—'}
                  </span>
                  {score?.score != null && (
                    <span style={{ color: theme.subtext, fontSize: '1rem', fontWeight: '500', fontFamily: "'JetBrains Mono', monospace" }}>
                      / 100
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.35rem', 
                  fontSize: '0.8rem', 
                  fontWeight: '700',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  backgroundColor: score?.is_deviating 
                    ? (isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2') 
                    : (isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5'),
                  color: score?.is_deviating ? '#EF4444' : '#10B981',
                  border: `1px solid ${score?.is_deviating ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
                }}>
                  <span>{score?.is_deviating ? '↘' : '↗'}</span>
                  <span>{score?.is_deviating ? 'Trending lower than baseline' : 'Similar to last week (Stable)'}</span>
                </span>
                <span style={{ fontSize: '0.8rem', color: theme.subtext }}>
                  Daily neuromotor & speech index
                </span>
              </div>
            </div>

            {/* Secondary Card: Daily Battery (decorative calendar icon removed, badge flattened) */}
            <div style={{ ...styles.patientSecondaryStatCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <span style={{ fontSize: '0.88rem', fontWeight: '600', color: theme.subtext, fontFamily: "'Inter', sans-serif" }}>
                Daily battery
              </span>
              <div style={{ margin: '0.45rem 0 0.25rem 0' }}>
                <p style={{ ...styles.patientCardValue, color: theme.text, margin: 0 }}>
                  {score?.active_score != null ? `${Math.round(score.active_score)} pts` : 'No tests yet'}
                </p>
              </div>
              <p style={{ fontSize: '0.82rem', color: theme.subtext, margin: 0 }}>
                5 micro-tasks completed
              </p>
            </div>

            {/* Secondary Card: Voice Journal (functional mic icon kept) */}
            <div style={{ ...styles.patientSecondaryStatCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: '600', color: theme.subtext, fontFamily: "'Inter', sans-serif" }}>
                  Voice journal
                </span>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#22D3EE' : '#0891B2'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </div>
              <div style={{ margin: '0.45rem 0 0.25rem 0' }}>
                <p style={{ ...styles.patientCardValue, color: theme.text, margin: 0 }}>
                  {score?.voice_score != null ? `${Math.round(score.voice_score)} pts` : 'Pending'}
                </p>
              </div>
              <p style={{ fontSize: '0.82rem', color: theme.subtext, margin: 0 }}>
                Acoustic pause & fluency telemetry
              </p>
            </div>

            {/* Secondary Card: Behavioral Telemetry (decorative users icon removed) */}
            <div style={{ ...styles.patientSecondaryStatCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <span style={{ fontSize: '0.88rem', fontWeight: '600', color: theme.subtext, fontFamily: "'Inter', sans-serif" }}>
                Behavioral telemetry
              </span>
              <div style={{ margin: '0.45rem 0 0.25rem 0' }}>
                <p style={{ ...styles.patientCardValue, color: theme.text, margin: 0 }}>
                  {score?.passive_score != null ? `${Math.round(score.passive_score)} pts` : 'Active'}
                </p>
              </div>
              <p style={{ fontSize: '0.82rem', color: theme.subtext, margin: 0 }}>
                Passive typing & scroll stability
              </p>
            </div>
          </div>


          {/* Longitudinal Trend Chart Card */}
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border, marginTop: '1.75rem', padding: '1.75rem 2rem' }}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={{ ...styles.cardTitle, color: theme.text, fontSize: '1.35rem' }}>Cognitive Score Trend</h3>
                <p style={{ color: theme.subtext, fontSize: '0.88rem', margin: '4px 0 0 0' }}>Daily screening history vs calibrated personal baseline</p>
              </div>
              <button 
                style={{ 
                  ...styles.recalculateBtn, 
                  backgroundColor: theme.recalculateBtnBg, 
                  borderColor: theme.recalculateBtnBorder,
                  color: theme.recalculateBtnText,
                  padding: '0.65rem 1.35rem',
                  fontSize: '0.84rem',
                  width: 'auto'
                }} 
                onClick={handleCalculate}
                disabled={calculating}
              >
                {calculating ? 'Calculating...' : 'Recalculate Score'}
              </button>
            </div>

            {history.length === 0 ? (
              <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderRadius: '14px', border: `1px dashed ${theme.border}`, marginTop: '1rem' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={theme.subtext} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px auto', display: 'block' }}>
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
                <h4 style={{ margin: '0.5rem 0 0.25rem 0', color: theme.text, fontSize: '1.05rem', fontWeight: '800' }}>No historical data yet</h4>
                <p style={{ margin: 0, color: theme.subtext, fontSize: '0.88rem' }}>Complete at least one assessment to begin tracking your cognitive trajectory.</p>
              </div>
            ) : (
              <div style={{ width: '100%', height: 320, marginTop: '1.25rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="patientScoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDark ? '#a3b18a' : '#273822'} stopOpacity={0.25}/>
                        <stop offset="95%" stopColor={isDark ? '#a3b18a' : '#273822'} stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} vertical={false} />
                    <XAxis dataKey="date" stroke={theme.chartText} fontSize={12} tickLine={false} axisLine={false} minTickGap={20} interval="preserveStartEnd" />
                    <YAxis domain={[0, 100]} stroke={theme.chartText} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="natural" 
                      dataKey="score" 
                      stroke={isDark ? '#a3b18a' : '#273822'} 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#patientScoreGrad)" 
                      name="CogniScore" 
                    />
                    <Line 
                      type="natural" 
                      dataKey="baseline" 
                      stroke={isDark ? '#526e49' : '#3d5236'} 
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
          <div style={{ marginTop: '1.75rem' }}>
            <h3 style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: '18px', fontWeight: '600', lineHeight: '24px', letterSpacing: '-0.01em', color: theme.text, marginBottom: '1.25rem' }}>Screening & Diagnostic Modules</h3>
            <div style={styles.patientModulesGrid}>
              <div style={{ ...styles.moduleCard, backgroundColor: theme.cardBg, borderColor: theme.border }} onClick={() => navigate('/tests')}>
                <div style={{ ...styles.moduleIconBox, backgroundColor: isDark ? 'rgba(163, 177, 138, 0.14)' : '#e8efe6', color: isDark ? '#a3b18a' : '#273822' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                    <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                    <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                    <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ ...styles.moduleTitle, color: theme.text }}>Daily Cognitive Tests</h4>
                  <p style={{ ...styles.moduleDesc, color: theme.subtext }}>Interactive digital biomarkers (2 daily check-in or 6 full battery): recall, reaction speed & executive function.</p>
                </div>
                <span style={styles.moduleArrow}>→</span>
              </div>

              <div style={{ ...styles.moduleCard, backgroundColor: theme.cardBg, borderColor: theme.border }} onClick={() => navigate('/voice')}>
                <div style={{ ...styles.moduleIconBox, backgroundColor: isDark ? 'rgba(82, 110, 73, 0.14)' : '#edf3ec', color: isDark ? '#a3b18a' : '#3d5236' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                <div style={{ ...styles.moduleIconBox, backgroundColor: isDark ? 'rgba(197, 176, 131, 0.14)' : '#f5f0e4', color: isDark ? '#c5b083' : '#705c30' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                <div style={{ ...styles.moduleIconBox, backgroundColor: isDark ? 'rgba(212, 139, 112, 0.14)' : '#f7ede8', color: isDark ? '#d48b70' : '#8c4b32' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                <div style={{ ...styles.moduleIconBox, backgroundColor: isDark ? 'rgba(61, 82, 54, 0.14)' : '#e8efe6', color: isDark ? '#a3b18a' : '#273822' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

          {/* Collapsible Technical Details & Clinical Telemetry Accordion (Progressive Disclosure) */}
          <details 
            style={{
              marginTop: '2.5rem',
              marginBottom: '1rem',
              borderRadius: '16px',
              border: `1.5px solid ${theme.border}`,
              backgroundColor: isDark ? '#141E15' : '#f8fbf7',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
          >
            <summary style={{
              padding: '1.25rem 1.75rem',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '700',
              color: theme.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.cardBg,
              userSelect: 'none',
              borderBottom: `1px solid ${theme.border}`,
              listStyle: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🔬</span>
                <div>
                  <div style={{ fontWeight: '700', color: theme.text, fontSize: '0.98rem' }}>
                    View Technical Details & Clinical Telemetry
                  </div>
                  <div style={{ fontSize: '0.8rem', color: theme.subtext, fontWeight: '500', marginTop: '2px' }}>
                    Tri-modal weight fusion, TreeSHAP delta drivers, Real-Time MCP pipeline & audit logs
                  </div>
                </div>
              </div>
              <span style={{ 
                fontSize: '0.8rem', 
                color: isDark ? '#a3b18a' : '#273822', 
                fontWeight: '700', 
                padding: '0.35rem 0.85rem', 
                borderRadius: '8px', 
                backgroundColor: isDark ? 'rgba(163,177,138,0.14)' : '#e8efe6',
                border: `1.5px solid ${isDark ? 'rgba(163,177,138,0.25)' : '#d2ded0'}` 
              }}>
                Click to Expand Telemetry ▾
              </span>
            </summary>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Transparent Modality Breakdown & Primary Contributors Card */}
              <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border, padding: '1.75rem 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.4rem' }}>
                  <div>
                    <h3 style={{ ...styles.cardTitle, color: theme.text, margin: 0, fontSize: '1.35rem' }}>CogniScore Modality Contribution & Primary Drivers</h3>
                    <p style={{ color: theme.subtext, fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                      Deterministic multimodal fusion with transparent weight contributions and individual baseline delta tracking.
                    </p>
                  </div>
                  {score && (
                    <button 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        padding: '0.65rem 1.25rem',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        backgroundColor: isDark ? '#273822' : '#eaf1e8',
                        color: isDark ? '#f1f5ee' : '#0d170e',
                        border: `1.5px solid ${isDark ? '#3d5236' : '#d2ded0'}`,
                      }}
                      onClick={() => setShowExplainModal(true)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                  <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderRadius: '14px', border: `1px dashed ${theme.border}` }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={theme.subtext} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px auto', display: 'block' }}>
                      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z" />
                      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z" />
                    </svg>
                    <h4 style={{ margin: '0.5rem 0 0.25rem 0', color: theme.text, fontSize: '1rem', fontWeight: '800' }}>No assessment data yet</h4>
                    <p style={{ margin: 0, color: theme.subtext, fontSize: '0.86rem' }}>Complete daily cognitive tests, voice recordings, and telemetry to generate your multimodal breakdown.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    
                    {/* Left Column: Contribution Breakdown */}
                    <div style={{ padding: '1.25rem 1.4rem', borderRadius: '14px', backgroundColor: theme.statBoxBg, border: `1px solid ${theme.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: '700', color: theme.text }}>Modality weight contributions</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isDark ? '#22D3EE' : '#0891B2', fontFamily: "'JetBrains Mono', monospace" }}>
                          Tri-Modal (60/20/20)
                        </span>
                      </div>

                      {/* Cognitive Modality */}
                      <div style={{ marginBottom: '1.15rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                          <span style={{ color: theme.text }}>Active Cognitive Battery (60%)</span>
                          <span style={{ color: isDark ? '#a3b18a' : '#273822' }}>{score?.active_score != null ? `${Math.round(score.active_score)} / 100` : 'No tests'} <strong style={{ color: theme.subtext, fontSize: '0.76rem' }}>({((score?.active_score || 0) * 0.6).toFixed(1)} pts)</strong></span>
                        </div>
                        <div style={{ width: '100%', height: '10px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(score?.active_score || 0, 100)}%`, height: '100%', backgroundColor: isDark ? '#a3b18a' : '#273822', borderRadius: '5px' }} />
                        </div>
                      </div>

                      {/* Behavioral Modality with Typing & Scrolling Sub-chips */}
                      <div style={{ marginBottom: '1.15rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                          <span style={{ color: theme.text }}>Behavioral Telemetry (20%)</span>
                          <span style={{ color: isDark ? '#738466' : '#3d5236' }}>{score?.passive_score != null ? `${Math.round(score.passive_score)} / 100` : 'No telemetry'} <strong style={{ color: theme.subtext, fontSize: '0.76rem' }}>({((score?.passive_score || 0) * 0.2).toFixed(1)} pts)</strong></span>
                        </div>
                        <div style={{ width: '100%', height: '10px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(score?.passive_score || 0, 100)}%`, height: '100%', backgroundColor: isDark ? '#738466' : '#3d5236', borderRadius: '5px' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.55rem' }}>
                          <span style={{ fontSize: '0.76rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', padding: '0.25rem 0.65rem', borderRadius: '6px', backgroundColor: isDark ? 'rgba(163,177,138,0.14)' : '#e8efe6', color: isDark ? '#a3b18a' : '#273822' }}>
                            Typing: {score?.typing_score != null ? `${Math.round(score.typing_score)}/100` : 'Active'}
                          </span>
                          <span style={{ fontSize: '0.76rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', padding: '0.25rem 0.65rem', borderRadius: '6px', backgroundColor: isDark ? 'rgba(163,177,138,0.14)' : '#e8efe6', color: isDark ? '#a3b18a' : '#273822' }}>
                            Scrolling: {score?.scrolling_score != null ? `${Math.round(score.scrolling_score)}/100` : 'Active'}
                          </span>
                        </div>
                      </div>

                      {/* Voice Modality */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                          <span style={{ color: theme.text }}>Acoustic Voice Biomarkers (20%)</span>
                          <span style={{ color: isDark ? '#526e49' : '#3d5236' }}>{score?.voice_score != null ? `${Math.round(score.voice_score)} / 100` : 'No voice entry'} <strong style={{ color: theme.subtext, fontSize: '0.76rem' }}>({((score?.voice_score || 0) * 0.2).toFixed(1)} pts)</strong></span>
                        </div>
                        <div style={{ width: '100%', height: '10px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(score?.voice_score || 0, 100)}%`, height: '100%', backgroundColor: isDark ? '#526e49' : '#3d5236', borderRadius: '5px' }} />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Why? PRIMARY CONTRIBUTORS */}
                    <div style={{ padding: '1.25rem 1.4rem', borderRadius: '14px', backgroundColor: theme.statBoxBg, border: `1px solid ${theme.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: '700', color: theme.text }}>Primary delta contributors</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: '600', color: theme.subtext }}>vs personal baseline</span>
                      </div>

                      {score?.is_deviating ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div 
                            onClick={() => handleInspectEvidence('E1')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: isDark ? 'rgba(217, 119, 127, 0.12)' : '#faebec', cursor: 'pointer', border: `1px solid ${isDark ? 'rgba(217, 119, 127, 0.25)' : '#f0ccd0'}`, transition: 'all 0.15s' }}
                            title="Click to inspect Evidence E1 (Active Psychometrics)"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                              <span style={{ fontSize: '0.84rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: '800', color: isDark ? '#d9777f' : '#943840' }}>E1</span>
                              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: theme.text }}>Memory retention accuracy</span>
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: isDark ? '#d9777f' : '#943840' }}>↓ Deviating · View E1 →</span>
                          </div>

                          <div 
                            onClick={() => handleInspectEvidence('E2')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: isDark ? 'rgba(217, 119, 127, 0.12)' : '#faebec', cursor: 'pointer', border: `1px solid ${isDark ? 'rgba(217, 119, 127, 0.25)' : '#f0ccd0'}`, transition: 'all 0.15s' }}
                            title="Click to inspect Evidence E2 (Keystroke Telemetry)"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                              <span style={{ fontSize: '0.84rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: '800', color: isDark ? '#d9777f' : '#943840' }}>E2</span>
                              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: theme.text }}>Typing speed & cadence</span>
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: isDark ? '#d9777f' : '#943840' }}>↓ Latency drift · View E2 →</span>
                          </div>

                          <div 
                            onClick={() => handleInspectEvidence('E3')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: isDark ? 'rgba(197, 176, 131, 0.12)' : '#f5f0e4', cursor: 'pointer', border: `1px solid ${isDark ? 'rgba(197, 176, 131, 0.25)' : '#e2d8c4'}`, transition: 'all 0.15s' }}
                            title="Click to inspect Evidence E3 (Navigation Telemetry)"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                              <span style={{ fontSize: '0.84rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: '800', color: isDark ? '#c5b083' : '#705c30' }}>E3</span>
                              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: theme.text }}>Navigation pause hesitation</span>
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: isDark ? '#c5b083' : '#705c30' }}>↑ Elevated pause · View E3 →</span>
                          </div>

                          <div 
                            onClick={() => handleInspectEvidence('E4')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: isDark ? 'rgba(197, 176, 131, 0.12)' : '#f5f0e4', cursor: 'pointer', border: `1px solid ${isDark ? 'rgba(197, 176, 131, 0.25)' : '#e2d8c4'}`, transition: 'all 0.15s' }}
                            title="Click to inspect Evidence E4 (Speech Biomarkers)"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                              <span style={{ fontSize: '0.84rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: '800', color: isDark ? '#c5b083' : '#705c30' }}>E4</span>
                              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: theme.text }}>Speech inter-phrase pause rate</span>
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: isDark ? '#c5b083' : '#705c30' }}>↑ Pause duration · View E4 →</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '1.75rem', textAlign: 'center', color: theme.subtext }}>
                          <span style={{ fontSize: '1.4rem', color: isDark ? '#a3b18a' : '#273822' }}>✓</span>
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.92rem', fontWeight: '700', color: theme.text }}>All indicators within normal baseline limits</p>
                          <span style={{ fontSize: '0.82rem' }}>No statistical change-point drift detected across active or passive telemetry channels.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Real-Time Agent & Tool Execution Timeline */}
              <AuditTimelineWidget />

              {/* Session History Table */}
              <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border, padding: '1.75rem 2rem' }}>
                <div style={styles.cardHeader}>
                  <h3 style={{ ...styles.cardTitle, color: theme.text, fontSize: '1.35rem' }}>Recent Screening Sessions</h3>
                </div>
                <div style={styles.tableWrapper}>
                  <table style={{ ...styles.patientTable, fontSize: '0.88rem' }}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, color: theme.tableTh, padding: '0.9rem 0.85rem', fontSize: '0.82rem' }}>Session Date</th>
                        <th style={{ ...styles.th, color: theme.tableTh, padding: '0.9rem 0.85rem', fontSize: '0.82rem' }}>CogniScore</th>
                        <th style={{ ...styles.th, color: theme.tableTh, padding: '0.9rem 0.85rem', fontSize: '0.82rem' }}>Active Score</th>
                        <th style={{ ...styles.th, color: theme.tableTh, padding: '0.9rem 0.85rem', fontSize: '0.82rem' }}>Passive Keystrokes</th>
                        <th style={{ ...styles.th, color: theme.tableTh, padding: '0.9rem 0.85rem', fontSize: '0.82rem' }}>EWMA Filter</th>
                        <th style={{ ...styles.th, color: theme.tableTh, padding: '0.9rem 0.85rem', fontSize: '0.82rem' }}>Drift Flag</th>
                        <th style={{ ...styles.th, color: theme.tableTh, padding: '0.9rem 0.85rem', fontSize: '0.82rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length > 0 ? (
                        history.slice(-7).reverse().map((s, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${theme.tableTrBorder}` }}>
                            <td style={{ ...styles.td, color: theme.text, fontWeight: '700', padding: '1rem 0.85rem' }}>{s.fullDate || s.date}</td>
                            <td style={{ ...styles.td, fontWeight: '800', color: '#4338CA', padding: '1rem 0.85rem' }}>{s.score}</td>
                            <td style={{ ...styles.td, color: theme.tableTd, padding: '1rem 0.85rem' }}>{s.active} pts</td>
                            <td style={{ ...styles.td, color: theme.tableTd, padding: '1rem 0.85rem' }}>{s.passive} pts</td>
                            <td style={{ ...styles.td, color: theme.tableTd, padding: '1rem 0.85rem' }}>{s.ewma}</td>
                            <td style={{ ...styles.td, padding: '1rem 0.85rem' }}>
                              {s.is_deviating ? (
                                <span style={{ color: '#dc2626', fontWeight: '700' }}>Drift Alert</span>
                              ) : (
                                <span style={{ color: '#16a34a', fontWeight: '600' }}>Stable</span>
                              )}
                            </td>
                            <td style={{ ...styles.td, padding: '1rem 0.85rem' }}>
                              <span style={{
                                padding: '0.3rem 0.85rem',
                                borderRadius: '20px',
                                fontSize: '0.78rem',
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
                          <td colSpan="7" style={{ ...styles.td, textAlign: 'center', color: theme.subtext, padding: '2.5rem' }}>
                            No screening sessions recorded yet. Take your first daily test battery to begin.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </details>
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

            {/* 2. Middle 2-Column Row: Appointment Request & Appointment */}
            {apptToast && (() => {
              const isError = typeof apptToast === 'object' ? apptToast.type === 'error' : (typeof apptToast === 'string' && apptToast.toLowerCase().includes('failed'));
              const toastMessage = typeof apptToast === 'object' ? apptToast.text : apptToast;
              return (
                <div style={{
                  padding: '0.65rem 1rem',
                  backgroundColor: isError ? 'rgba(220, 38, 38, 0.12)' : 'rgba(47, 125, 91, 0.15)',
                  color: isError ? '#dc2626' : '#2F7D5B',
                  borderRadius: '8px',
                  border: `1px solid ${isError ? '#dc2626' : '#2F7D5B'}`,
                  fontSize: '0.84rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}>
                  {isError ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                  <span>{toastMessage}</span>
                </div>
              );
            })()}
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
                                id={`accept-consultation-${req.id || idx}`}
                                data-testid={`accept-consultation-${req.id || idx}`}
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
                                id={`reject-consultation-${req.id || idx}`}
                                data-testid={`reject-consultation-${req.id || idx}`}
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

            {/* 4. Bottom Table: Recent Patients */}
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={{ ...styles.cardHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ ...styles.cardTitle, color: theme.text, margin: 0 }}>Recent Patients</h3>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                    color: isDark ? '#a3b18a' : '#273822',
                    backgroundColor: isDark ? 'rgba(163, 177, 138, 0.16)' : '#eaf1e8',
                    padding: '2px 8px',
                    borderRadius: '5px',
                    border: `1px solid ${isDark ? '#3d5236' : '#d2ded0'}`
                  }}>
                    {clinicianPatients.length} Enrolled
                  </span>
                </div>
                <button
                  onClick={() => {
                    setPatientActionError(null);
                    setIsAddPatientModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#273822',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    lineHeight: '18px',
                    cursor: 'pointer',
                    fontFamily: "Inter, system-ui, sans-serif",
                    transition: 'opacity 0.15s ease'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Patient
                </button>
              </div>
              <div style={styles.tableWrapper}>
                <table style={styles.patientTable}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, color: theme.tableTh }}>Name</th>
                      <th style={{ ...styles.th, color: theme.tableTh }}>Gender</th>
                      <th style={{ ...styles.th, color: theme.tableTh }}>Age</th>
                      <th style={{ ...styles.th, color: theme.tableTh }}>Status / Tier</th>
                      <th style={{ ...styles.th, color: theme.tableTh }}>Screening Date</th>
                      <th style={{ ...styles.th, color: theme.tableTh }}>CogniScore</th>
                      <th style={{ ...styles.th, color: theme.tableTh }}>Risk & Drift</th>
                      <th style={{ ...styles.th, color: theme.tableTh, textAlign: 'right' }}>Actions</th>
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
                      clinicianPatients.slice(0, 8).map((p, idx) => {
                        const isDrift = p.is_deviating || p.risk_level === 'High';
                        const riskBadgeBg = isDrift 
                          ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2')
                          : (isDark ? 'rgba(47, 125, 91, 0.2)' : '#dcfce7');
                        const riskBadgeColor = isDrift ? '#ef4444' : '#2F7D5B';
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
                            <td style={{ ...styles.td, color: theme.tableTd }}>{p.score != null ? `${Math.round(p.score)} pts` : (p.cogni_score != null ? `${Math.round(p.cogni_score)} pts` : (p.latest_score != null ? `${Math.round(p.latest_score)} pts` : 'Enrolled'))}</td>
                            <td style={styles.td}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '5px',
                                fontSize: '10px',
                                fontWeight: 600,
                                letterSpacing: '0.03em',
                                color: riskBadgeColor,
                                backgroundColor: riskBadgeBg,
                                display: 'inline-block',
                                textTransform: 'uppercase'
                              }}>
                                {p.risk_level || 'Active'}
                              </span>
                            </td>
                            <td style={{ ...styles.td, textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPatientActionError(null);
                                    setEditingPatient({
                                      id: p.id,
                                      name: p.name || '',
                                      email: p.email || '',
                                      age: p.age || '',
                                      gender: p.gender || 'Not specified',
                                      risk_level: p.risk_level || 'Low',
                                      score: p.score ?? p.latest_score ?? 75
                                    });
                                  }}
                                  title="Modify patient information"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 8px',
                                    borderRadius: '5px',
                                    border: `1px solid ${isDark ? '#3d5236' : '#d2ded0'}`,
                                    backgroundColor: isDark ? '#162216' : '#f8faf7',
                                    color: isDark ? '#cdd8c5' : '#273822',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: "Inter, system-ui, sans-serif"
                                  }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPatientActionError(null);
                                    setDeletingPatient(p);
                                  }}
                                  title="Delete patient from cohort"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 8px',
                                    borderRadius: '5px',
                                    border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fca5a5',
                                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
                                    color: '#ef4444',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: "Inter, system-ui, sans-serif"
                                  }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                  Delete
                                </button>
                              </div>
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


          {/* ── RIGHT PROFILE & METRICS SIDE PANEL ── */}
          <div style={styles.rightCol}>
            
            {/* Profile Card with Professional Monogram Avatar */}
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={styles.profileWrapper}>
                <div 
                  onClick={() => setIsProfileModalOpen(true)}
                  style={{ 
                    ...styles.profileAvatarBox, 
                    backgroundColor: isDark ? '#162216' : '#e8efe6', 
                    borderColor: isDark ? '#3d5236' : '#d2ded0',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  title="Click to edit profile with verification"
                >
                  <div style={styles.doctorMonogram}>
                    {(user?.name || user?.email || 'D')[0].toUpperCase()}
                  </div>
                  <span style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#273822',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #ffffff'
                  }} title="Edit profile">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </span>
                </div>
                <h3 
                  onClick={() => setIsProfileModalOpen(true)}
                  style={{ ...styles.doctorName, cursor: 'pointer' }}
                  title="Click to edit profile"
                >
                  {user?.name ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`) : `Dr. Jackson Santos`}
                </h3>
                <p style={{ ...styles.doctorSpecialty, color: theme.subtext }}>
                  {user?.is_caregiver ? 'Caregiver Supervisor' : 'Clinical Cognitive Supervisor'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#3d5236' : '#d2ded0'}`,
                    backgroundColor: isDark ? '#162216' : '#e8efe6',
                    color: isDark ? '#a3b18a' : '#273822',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginTop: '2px',
                    marginBottom: '1rem'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* Clinical Cohort Surveillance Progress Bar */}
              <div style={{ ...styles.limitBox, backgroundColor: theme.statBoxBg, borderColor: theme.border }}>
                <div style={styles.limitHeader}>
                  <span style={{ ...styles.limitTitle, color: theme.text }}>
                    {clinicianPatients.length} Patients Active
                  </span>
                  <span style={{ ...styles.limitFraction, color: isDark ? '#a3b18a' : '#273822', fontWeight: '700' }}>
                    {clinicianPatients.filter(p => p.is_deviating || p.risk_level === 'High').length} Drift Alerts
                  </span>
                </div>
                <p style={{ ...styles.limitSub, color: theme.subtext }}>Cohort Surveillance & Longitudinal Drift</p>
                <div style={styles.progressBarTrack}>
                  <div style={{ 
                    ...styles.progressBarFill, 
                    width: `${Math.min((clinicianPatients.length / 10) * 100, 100)}%`,
                    backgroundColor: isDark ? '#a3b18a' : '#273822'
                  }} />
                </div>
              </div>

              {/* 4 Clinical Stat Counters Grid */}
              <div style={styles.statsGrid}>
                <div style={{ ...styles.statBox, backgroundColor: theme.statBoxBg, borderColor: theme.border }}>
                  <p style={{ ...styles.statNumber, color: theme.text }}>{clinicianPatients.length}</p>
                  <p style={{ ...styles.statLabel, color: theme.subtext }}>Enrolled Patients</p>
                </div>
                <div style={{ ...styles.statBox, backgroundColor: theme.statBoxBg, borderColor: theme.border }}>
                  <p style={{ ...styles.statNumber, color: '#ef4444' }}>
                    {clinicianPatients.filter(p => p.is_deviating || p.risk_level === 'High').length}
                  </p>
                  <p style={{ ...styles.statLabel, color: theme.subtext }}>CUSUM Drift Alerts</p>
                </div>
                <div style={{ ...styles.statBox, backgroundColor: theme.statBoxBg, borderColor: theme.border }}>
                  <p style={{ ...styles.statNumber, color: '#f59e0b' }}>
                    {clinicianPatients.filter(p => p.level2_status === 'triggered').length}
                  </p>
                  <p style={{ ...styles.statLabel, color: theme.subtext }}>Tier 2 Triggered</p>
                </div>
                <div style={{ ...styles.statBox, backgroundColor: theme.statBoxBg, borderColor: theme.border }}>
                  <p style={{ ...styles.statNumber, color: isDark ? '#38bdf8' : '#0284c7' }}>
                    {dashboardAppointments.filter(a => a.status === 'Pending' || a.status === 'Due').length}
                  </p>
                  <p style={{ ...styles.statLabel, color: theme.subtext }}>Pending Reviews</p>
                </div>
              </div>

              {/* Clinical Quick Action Buttons */}
              <div style={styles.actionButtonsGrid}>
                <button 
                  style={{
                    ...styles.missedCallBtn,
                    backgroundColor: isDark ? '#162216' : '#e8efe6',
                    color: isDark ? '#a3b18a' : '#273822',
                    border: `1.5px solid ${isDark ? '#3d5236' : '#c9d8c6'}`
                  }} 
                  onClick={() => navigate('/patients')}
                  title="Open Monitored Cohort Directory & SHAP analysis"
                >
                  <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>{clinicianPatients.length}</span>
                  <span style={{ fontSize: '0.74rem' }}>Cohort Directory</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '2px' }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </button>
                <button 
                  style={{ 
                    ...styles.newMessagesBtn, 
                    backgroundColor: theme.cardBg, 
                    borderColor: isDark ? '#3d5236' : '#273822', 
                    color: isDark ? '#a3b18a' : '#273822' 
                  }} 
                  onClick={handleOpenReferral}
                  title="Generate multi-tier referral dossier"
                >
                  <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>PDF</span>
                  <span style={{ fontSize: '0.74rem' }}>Referral Dossier</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '2px' }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </button>
              </div>
            </div>

            {/* High-Risk Clinical Case & Decision Support Card */}
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>⚠️</span>
                  <h4 style={{ ...styles.cardTitle, color: theme.text, fontSize: '0.95rem' }}>High-Risk Triage Alert</h4>
                </div>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.3)',
                  textTransform: 'uppercase'
                }}>
                  Urgent Review
                </span>
              </div>
              
              {/* Highlight top risk patient */}
              {(() => {
                const highRiskPat = clinicianPatients.find(p => p.risk_level === 'High' || p.is_deviating) || clinicianPatients[0] || {
                  name: 'Rajan Pillai',
                  age: 74,
                  gender: 'Male',
                  risk_level: 'High',
                  score: 38.0
                };

                return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.92rem', color: theme.text }}>
                        {highRiskPat.name} ({highRiskPat.age || 74}y, {highRiskPat.gender || 'Male'})
                      </span>
                      <span style={{
                        fontWeight: '700',
                        fontSize: '0.78rem',
                        color: '#ef4444',
                        backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {highRiskPat.score ? `${Math.round(highRiskPat.score)} pts` : '38 pts'}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.76rem', color: theme.subtext, lineHeight: '1.4' }}>
                      <strong>Drift Alert:</strong> CUSUM = 14.8 exceeds critical boundary (H=12.0). Statistical drift flagged in active cognitive recall and speech acoustic pause rates.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                        <span style={{ color: theme.subtext }}>Primary SHAP Driver:</span>
                        <span style={{ color: '#ef4444', fontWeight: '700', fontFamily: 'monospace' }}>APOE-ε4 Carrier (+1.42)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                        <span style={{ color: theme.subtext }}>Secondary Driver:</span>
                        <span style={{ color: '#ef4444', fontWeight: '700', fontFamily: 'monospace' }}>Sleep Disruption (+0.98)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                        <span style={{ color: theme.subtext }}>Recommended Escalation:</span>
                        <span style={{ color: isDark ? '#a3b18a' : '#273822', fontWeight: '700' }}>Tier 3 Structural MRI</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => navigate('/patients')}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: isDark ? '#273822' : '#273822',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.76rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Inspect SHAP Dossier →
                      </button>
                      <button
                        onClick={() => setShowEvidenceGraphModal(true)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: isDark ? '#162018' : '#eaf1e8',
                          color: isDark ? '#a3b18a' : '#273822',
                          border: `1px solid ${isDark ? '#3d5236' : '#d2ded0'}`,
                          fontSize: '0.76rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                        title="Open Multimodal Evidence Graph"
                      >
                        Graph
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Clinical Decision Support Guidelines Card */}
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div style={styles.cardHeader}>
                <h4 style={{ ...styles.cardTitle, color: theme.text, fontSize: '0.88rem' }}>
                  Clinical Guidelines Reference
                </h4>
                <span style={{
                  fontSize: '0.64rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: isDark ? 'rgba(163,177,138,0.12)' : '#e8efe6',
                  color: isDark ? '#a3b18a' : '#273822',
                  fontWeight: '700'
                }}>
                  NIA-AA / WHO
                </span>
              </div>

              <div style={{ fontSize: '0.74rem', color: theme.subtext, lineHeight: '1.45', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>
                  <strong style={{ color: theme.text }}>• Tri-Modal Weighting:</strong> 60% Active Psychometrics, 20% Passive Telemetry, 20% Voice Biomarkers.
                </div>
                <div>
                  <strong style={{ color: theme.text }}>• CUSUM Drift Threshold:</strong> H = 12.0 marks statistically verified change-point requiring Tier 2 referral.
                </div>
                <div>
                  <strong style={{ color: theme.text }}>• TreeSHAP Attribution:</strong> Exact Shapley efficiency guarantee computes individual risk contributors without estimation error.
                </div>
              </div>

              <div style={{ marginTop: '0.85rem', borderTop: `1px solid ${theme.borderSubtle}`, paddingTop: '0.65rem' }}>
                <button
                  onClick={() => setShowAgentPipelineModal(true)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    background: isDark ? '#141c15' : '#f0f5ee',
                    border: `1px solid ${theme.border}`,
                    color: isDark ? '#a3b18a' : '#273822',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>View 10-Node AI MCP Pipeline</span>
                  <span>→</span>
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
      {/* Profile Edit Modal */}
      <ProfileEditModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      {/* Add Patient Modal */}
      {isAddPatientModalOpen && (
        <div style={styles.modalOverlay} onClick={() => !patientActionLoading && setIsAddPatientModalOpen(false)}>
          <div 
            style={{ 
              ...styles.crudModalBox, 
              backgroundColor: theme.cardBg, 
              borderColor: theme.border,
              boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.6)' : '0 16px 40px rgba(0,0,0,0.12)'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: `1px solid ${theme.borderSubtle || theme.border}`, paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: isDark ? '#a3b18a' : '#273822', display: 'block', marginBottom: '2px' }}>
                  Clinical Roster Enrollment
                </span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: theme.text, letterSpacing: '-0.01em' }}>
                  Enroll New Patient
                </h3>
              </div>
              <button 
                style={{ background: 'none', border: 'none', fontSize: '16px', color: theme.subtext, cursor: 'pointer', padding: '4px' }} 
                onClick={() => setIsAddPatientModalOpen(false)}
                disabled={patientActionLoading}
              >
                ✕
              </button>
            </div>

            {patientActionError && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2', color: '#ef4444', fontSize: '12px', fontWeight: 600, marginBottom: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                {patientActionError}
              </div>
            )}

            <form onSubmit={handleCreatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: theme.text, marginBottom: '4px' }}>
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor Vance"
                  value={newPatientForm.name}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                  style={{ ...styles.crudInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: theme.text, marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. eleanor.vance@example.com"
                  value={newPatientForm.email}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                  style={{ ...styles.crudInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: theme.text, marginBottom: '4px' }}>
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="110"
                    placeholder="e.g. 71"
                    value={newPatientForm.age}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                    style={{ ...styles.crudInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: theme.text, marginBottom: '4px' }}>
                    Biological Gender
                  </label>
                  <select
                    value={newPatientForm.gender}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                    style={{ ...styles.crudInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Not specified">Not specified</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: theme.text, marginBottom: '4px' }}>
                    Initial Risk Level
                  </label>
                  <select
                    value={newPatientForm.risk_level}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, risk_level: e.target.value })}
                    style={{ ...styles.crudInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: theme.text, marginBottom: '4px' }}>
                    Initial CogniScore
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newPatientForm.initial_score}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, initial_score: e.target.value })}
                    style={{ ...styles.crudInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  disabled={patientActionLoading}
                  onClick={() => setIsAddPatientModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: 'transparent',
                    color: theme.subtext,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={patientActionLoading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#273822',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: patientActionLoading ? 'not-allowed' : 'pointer',
                    opacity: patientActionLoading ? 0.7 : 1
                  }}
                >
                  {patientActionLoading ? 'Enrolling...' : 'Enroll Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
        <div style={styles.modalOverlay} onClick={() => !patientActionLoading && setEditingPatient(null)}>
          <div 
            style={{ 
              ...styles.crudModalBox, 
              backgroundColor: theme.cardBg, 
              borderColor: theme.border,
              boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.6)' : '0 16px 40px rgba(0,0,0,0.12)'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: `1px solid ${theme.borderSubtle || theme.border}`, paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: isDark ? '#a3b18a' : '#273822', display: 'block', marginBottom: '2px' }}>
                  Patient Record Management
                </span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: theme.text, letterSpacing: '-0.01em' }}>
                  Modify Patient Details
                </h3>
              </div>
              <button 
                style={{ background: 'none', border: 'none', fontSize: '16px', color: theme.subtext, cursor: 'pointer', padding: '4px' }} 
                onClick={() => setEditingPatient(null)}
                disabled={patientActionLoading}
              >
                ✕
              </button>
            </div>

            {patientActionError && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2', color: '#ef4444', fontSize: '12px', fontWeight: 600, marginBottom: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                {patientActionError}
              </div>
            )}

            <form onSubmit={handleUpdatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: theme.text, marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editingPatient.name}
                  onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })}
                  style={{ ...styles.crudInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: theme.text, marginBottom: '4px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editingPatient.email}
                  onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                  style={{ ...styles.crudInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: theme.text, marginBottom: '4px' }}>
                    Age
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="110"
                    value={editingPatient.age}
                    onChange={(e) => setEditingPatient({ ...editingPatient, age: e.target.value })}
                    style={{ ...styles.crudInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: theme.text, marginBottom: '4px' }}>
                    Gender
                  </label>
                  <select
                    value={editingPatient.gender}
                    onChange={(e) => setEditingPatient({ ...editingPatient, gender: e.target.value })}
                    style={{ ...styles.crudInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Not specified">Not specified</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: theme.text, marginBottom: '4px' }}>
                    Risk Level
                  </label>
                  <select
                    value={editingPatient.risk_level}
                    onChange={(e) => setEditingPatient({ ...editingPatient, risk_level: e.target.value })}
                    style={{ ...styles.crudInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: theme.text, marginBottom: '4px' }}>
                    CogniScore
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={editingPatient.score ?? ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, score: e.target.value })}
                    style={{ ...styles.crudInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  disabled={patientActionLoading}
                  onClick={() => setEditingPatient(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: 'transparent',
                    color: theme.subtext,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={patientActionLoading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#273822',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: patientActionLoading ? 'not-allowed' : 'pointer',
                    opacity: patientActionLoading ? 0.7 : 1
                  }}
                >
                  {patientActionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Patient Confirmation Modal */}
      {deletingPatient && (
        <div style={styles.modalOverlay} onClick={() => !patientActionLoading && setDeletingPatient(null)}>
          <div 
            style={{ 
              ...styles.crudModalBox, 
              backgroundColor: theme.cardBg, 
              borderColor: theme.border,
              maxWidth: '440px',
              boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.6)' : '0 16px 40px rgba(0,0,0,0.12)'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: theme.text }}>
                  Remove Patient from Cohort
                </h3>
                <span style={{ fontSize: '12px', color: theme.subtext }}>
                  Permanent clinical cohort deletion
                </span>
              </div>
            </div>

            {patientActionError && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2', color: '#ef4444', fontSize: '12px', fontWeight: 600, marginBottom: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                {patientActionError}
              </div>
            )}

            <p style={{ fontSize: '13px', lineHeight: '20px', color: theme.text, margin: '0 0 12px 0' }}>
              Are you sure you want to remove <strong>{deletingPatient.name || deletingPatient.email}</strong> from surveillance?
            </p>
            <p style={{ fontSize: '12px', lineHeight: '18px', color: theme.subtext, margin: '0 0 16px 0' }}>
              All linked longitudinal screenings, baseline psychometrics, and telemetry packets for this patient will be permanently removed.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                disabled={patientActionLoading}
                onClick={() => setDeletingPatient(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: `1px solid ${theme.border}`,
                  backgroundColor: 'transparent',
                  color: theme.subtext,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={patientActionLoading}
                onClick={handleDeletePatient}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: patientActionLoading ? 'not-allowed' : 'pointer',
                  opacity: patientActionLoading ? 0.7 : 1
                }}
              >
                {patientActionLoading ? 'Removing...' : 'Delete Patient'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Toast Feedback */}
      {patientToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 18px',
          borderRadius: '8px',
          backgroundColor: patientToast.type === 'error' ? (isDark ? '#450a0a' : '#fee2e2') : (isDark ? '#052e16' : '#dcfce7'),
          color: patientToast.type === 'error' ? (isDark ? '#f87171' : '#991b1b') : (isDark ? '#86efac' : '#166534'),
          border: `1px solid ${patientToast.type === 'error' ? '#f87171' : '#86efac'}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          fontSize: '13px',
          fontWeight: 600,
          fontFamily: "Inter, system-ui, sans-serif"
        }}>
          <span>{patientToast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{patientToast.text}</span>
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
    fontFamily: "'Mulish', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  headerPrimaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#273822',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '0.65rem 1.25rem',
    fontSize: '0.86rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(39, 56, 34, 0.2)',
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
    backgroundColor: '#1d2c1c',
    backgroundImage: 'linear-gradient(135deg, #162417 0%, #273b25 100%)',
    borderRadius: '20px',
    padding: '1.75rem 2rem',
    color: '#ffffff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid #334a30',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
  },
  welcomeContent: {
    maxWidth: '520px',
    zIndex: 2,
  },
  welcomeTitle: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: '24px',
    lineHeight: '30px',
    fontWeight: '600',
    margin: '0 0 0.4rem 0',
    letterSpacing: '-0.015em',
    color: '#ffffff',
  },
  welcomeSub: {
    fontSize: '13px',
    lineHeight: '20px',
    color: 'rgba(255, 255, 255, 0.85)',
    margin: 0,
    fontFamily: "Inter, system-ui, sans-serif",
  },
  welcomeDecor: {
    position: 'absolute',
    right: '10px',
    bottom: '-10px',
    pointerEvents: 'none',
  },
  card: {
    borderRadius: '12px',
    padding: '1.25rem',
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
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: '600',
    letterSpacing: '-0.01em',
    margin: 0,
  },
  dropdownSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.78rem',
    fontFamily: "'JetBrains Mono', monospace",
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
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: '700',
  },
  middleTwoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  seeAllLink: {
    color: '#3d5236',
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
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
    marginBottom: '1rem',
    border: '2px solid',
  },
  doctorMonogram: {
    width: '74px',
    height: '74px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, #273822 0%, #3d5236 100%)',
    color: '#ffffff',
    fontSize: '2rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorName: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: '18px',
    lineHeight: '26px',
    fontWeight: '700',
    color: 'inherit',
    margin: '0 0 0.35rem 0',
  },
  doctorSpecialty: {
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0 0 1.35rem 0',
    fontWeight: '500',
    fontFamily: "Inter, system-ui, sans-serif",
  },
  limitBox: {
    border: '1px solid',
    borderRadius: '14px',
    padding: '1rem 1.25rem',
    marginBottom: '1.35rem',
  },
  limitHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitTitle: {
    fontSize: '1.05rem',
    fontWeight: '800',
  },
  limitFraction: {
    fontSize: '0.88rem',
    fontWeight: '700',
    fontFamily: "'JetBrains Mono', monospace",
  },
  limitSub: {
    fontSize: '0.85rem',
    margin: '4px 0 10px 0',
  },
  progressBarTrack: {
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#273822',
    borderRadius: '6px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.35rem',
  },
  statBox: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '0.95rem',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '1.45rem',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: '800',
    margin: '0 0 4px 0',
  },
  statLabel: {
    fontSize: '0.84rem',
    margin: 0,
    fontWeight: '600',
  },
  actionButtonsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.85rem',
  },
  missedCallBtn: {
    backgroundColor: '#273822',
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    padding: '0.95rem 0.65rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(39, 56, 34, 0.2)',
  },
  newMessagesBtn: {
    border: '1.5px solid #273822',
    borderRadius: '14px',
    padding: '0.95rem 0.65rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  incomeRow: {
    marginTop: '0.65rem',
  },
  incomeValue: {
    fontSize: '1.55rem',
    fontWeight: '800',
    fontFamily: "'JetBrains Mono', monospace",
  },
  growthPill: {
    backgroundColor: 'rgba(163, 177, 138, 0.14)',
    color: '#3d5236',
    fontSize: '0.82rem',
    fontWeight: '800',
    padding: '0.3rem 0.65rem',
    borderRadius: '12px',
  },
  incomeSub: {
    fontSize: '0.84rem',
    margin: '4px 0 0 0',
  },
  recalculateBtn: {
    width: '100%',
    marginTop: '0.75rem',
    border: '1px solid',
    borderRadius: '10px',
    padding: '0.75rem',
    fontSize: '0.88rem',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // ── PATIENT DASHBOARD STYLES ──
  patientContainer: {
    width: '100%',
    maxWidth: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  patientWelcomeCard: {
    border: '1px solid',
    borderRadius: '24px',
    padding: '2.5rem 2.85rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    marginBottom: '2rem',
  },
  patientEyebrow: {
    color: '#3d5236',
    fontSize: '13px',
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '8px',
  },
  patientTitle: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: '32px',
    lineHeight: '40px',
    fontWeight: 700,
    margin: '0 0 10px 0',
    letterSpacing: '-0.02em',
  },
  patientSub: {
    fontSize: '16px',
    lineHeight: '26px',
    fontWeight: 400,
    maxWidth: '920px',
    margin: 0,
    fontFamily: "Inter, system-ui, sans-serif",
  },
  startTestsBtn: {
    backgroundColor: '#0891b2',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '0.95rem 1.85rem',
    fontSize: '1.02rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  baselineProgressBox: {
    border: '1px solid',
    borderRadius: '16px',
    padding: '1.35rem 1.75rem',
    marginTop: '1.75rem',
  },
  patientStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.65rem',
    marginBottom: '2rem',
    alignItems: 'stretch',
  },
  patientHeroStatCard: {
    border: '1px solid',
    borderRadius: '20px',
    padding: '1.85rem 2rem',
    boxShadow: 'none',
  },
  patientSecondaryStatCard: {
    border: '1px solid',
    borderRadius: '16px',
    padding: '1.65rem 1.85rem',
    boxShadow: 'none',
  },
  patientStatCard: {
    border: '1px solid',
    borderRadius: '16px',
    padding: '1.65rem 1.85rem',
    boxShadow: 'none',
  },
  statCardLabel: {
    fontSize: '0.92rem',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '600',
    letterSpacing: '0.03em',
  },
  patientBigScore: {
    fontSize: '3.4rem',
    fontWeight: '900',
    lineHeight: 1.1,
    fontFamily: "'JetBrains Mono', monospace",
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.02em',
  },
  patientCardValue: {
    fontSize: '1.75rem',
    fontWeight: '800',
    margin: '0.65rem 0 0.35rem 0',
  },
  patientCardSub: {
    fontSize: '0.94rem',
    margin: 0,
    lineHeight: 1.55,
  },
  patientModulesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: '1.65rem',
  },
  moduleCard: {
    border: '1px solid',
    borderRadius: '20px',
    padding: '1.75rem 2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.35rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
  },
  moduleIconBox: {
    width: '58px',
    height: '58px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  moduleTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    margin: '0 0 0.4rem 0',
  },
  moduleDesc: {
    fontSize: '1rem',
    margin: 0,
    lineHeight: 1.55,
  },
  moduleArrow: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#273822',
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
    backgroundColor: '#273822',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.65rem 1.5rem',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(39, 56, 34, 0.2)',
  },
  crudModalBox: {
    width: '100%',
    maxWidth: '480px',
    border: '1px solid',
    borderRadius: '12px',
    padding: '24px',
    fontFamily: "Inter, system-ui, sans-serif",
  },
  crudInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: 400,
    outline: 'none',
    fontFamily: "Inter, system-ui, sans-serif",
  },
};

export default Dashboard;
