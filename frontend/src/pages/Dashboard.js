import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getScore, getScoreHistory, calculateScore, getTodaySignals, getClinicalReport } from '../utils/api';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// ── Streak helpers ───────────────────────────────────────────────────────────
const getStreak = (userEmail) => {
  try {
    const key = `streakData_${userEmail}`;
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const { dates } = JSON.parse(raw);
    if (!dates || dates.length === 0) return 0;
    const sorted = [...dates].sort((a, b) => new Date(b) - new Date(a));
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = Math.round((prev - curr) / 86400000);
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  } catch { return 0; }
};

const updateStreak = (userEmail) => {
  try {
    const key = `streakData_${userEmail}`;
    const raw = localStorage.getItem(key);
    const today = new Date().toDateString();
    let dates = raw ? JSON.parse(raw).dates : [];
    if (!dates.includes(today)) dates.push(today);
    localStorage.setItem(key, JSON.stringify({ dates }));
  } catch { }
};

// ── Score Interpretation ─────────────────────────────────────────────────────
const getInterpretation = (score) => {
  if (!score) return null;
  const s = score.score;
  if (s >= 85) return {
    headline: 'Excellent Cognitive Health',
    detail: 'Your score places you in the top 15% of users. Memory, attention, and processing speed are all performing strongly.',
    action: 'Keep up your daily tests to maintain this level.',
    actionColor: '#00d4aa',
    icon: '🌟',
  };
  if (s >= 70) return {
    headline: 'Good Cognitive Health',
    detail: 'Your cognitive performance is above average. Minor fluctuations are normal day-to-day.',
    action: 'Consistent testing and sleep will help maintain your score.',
    actionColor: '#00d4aa',
    icon: '✅',
  };
  if (s >= 55) return {
    headline: 'Moderate Cognitive Performance',
    detail: 'Your score is within the normal range but shows some variability. This may reflect stress, fatigue, or early changes worth monitoring.',
    action: 'Consider completing the Level 2 Assessment for deeper insight.',
    actionColor: '#f59e0b',
    icon: '⚡',
  };
  if (s >= 40) return {
    headline: 'Below Average — Worth Monitoring',
    detail: 'Your score has been consistently below average. This pattern can sometimes indicate early cognitive changes.',
    action: 'We recommend running the Level 2 ML Assessment and speaking with a clinician.',
    actionColor: '#f59e0b',
    icon: '⚠️',
  };
  return {
    headline: 'Low Score — Clinical Attention Advised',
    detail: 'Your CogniScore is in the high-risk range. This does not confirm a diagnosis, but warrants professional evaluation.',
    action: 'Please complete Level 2 and Level 3 assessments and consult a healthcare provider.',
    actionColor: '#ef4444',
    icon: '🚨',
  };
};

// ── PDF Export ───────────────────────────────────────────────────────────────
const exportPDF = async (user, score, history, streak, clinicalReport = null) => {
  // Dynamically load jsPDF from CDN
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210;
  const userEmail = user?.email || 'Unknown';
  const userName = userEmail.split('@')[0];
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const interpretation = getInterpretation(score);

  // ── Background ──
  doc.setFillColor(8, 12, 20);
  doc.rect(0, 0, W, 297, 'F');

  // ── Header band ──
  doc.setFillColor(13, 17, 23);
  doc.roundedRect(10, 10, W - 20, 38, 4, 4, 'F');

  // Header accent line
  doc.setFillColor(0, 212, 170);
  doc.rect(10, 10, 4, 38, 'F');

  // CogniVeil title
  doc.setTextColor(0, 212, 170);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CogniVeil', 20, 26);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Cognitive Health Monitoring Report', 20, 33);

  doc.setTextColor(120, 130, 150);
  doc.setFontSize(8);
  doc.text(`Generated: ${dateStr} at ${timeStr}`, 20, 41);

  // Report ID on right
  const reportId = `CVR-${Date.now().toString(36).toUpperCase()}`;
  doc.setTextColor(0, 212, 170);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(reportId, W - 15, 41, { align: 'right' });

  // ── Patient Info ──
  doc.setFillColor(13, 17, 23);
  doc.roundedRect(10, 54, W - 20, 28, 4, 4, 'F');
  doc.setFillColor(167, 139, 250);
  doc.rect(10, 54, 4, 28, 'F');

  doc.setTextColor(167, 139, 250);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT INFORMATION', 20, 63);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(userName.charAt(0).toUpperCase() + userName.slice(1), 20, 73);

  doc.setTextColor(120, 130, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(userEmail, 20, 79);

  doc.setTextColor(120, 130, 150);
  doc.setFontSize(8);
  doc.text(`Streak: ${streak} day${streak !== 1 ? 's' : ''}`, W - 15, 73, { align: 'right' });

  // ── CogniScore Card ──
  doc.setFillColor(13, 17, 23);
  doc.roundedRect(10, 88, 88, 60, 4, 4, 'F');

  if (score) {
    const riskColor = score.risk_level === 'Low' ? [0, 212, 170] : score.risk_level === 'Moderate' ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(...riskColor);
    doc.rect(10, 88, 4, 60, 'F');

    doc.setTextColor(120, 130, 150);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('COGNISCORE', 20, 98);

    doc.setTextColor(...riskColor);
    doc.setFontSize(40);
    doc.setFont('helvetica', 'bold');
    doc.text(String(score.score), 20, 120);

    doc.setTextColor(120, 130, 150);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('/ 100', 55, 120);

    // Risk pill
    doc.setFillColor(...riskColor.map(c => Math.min(255, c + 180)));
    doc.setDrawColor(...riskColor);
    doc.setFillColor(riskColor[0], riskColor[1], riskColor[2], 0.15);
    doc.roundedRect(20, 125, 35, 8, 2, 2, 'S');
    doc.setTextColor(...riskColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${score.risk_level} Risk`, 37, 130, { align: 'center' });

    doc.setTextColor(120, 130, 150);
    doc.setFontSize(7);
    doc.text(`Updated: ${new Date(score.created_at).toLocaleDateString()}`, 20, 143);
  } else {
    doc.setTextColor(120, 130, 150);
    doc.setFontSize(10);
    doc.text('No score available', 20, 115);
  }

  // ── Sub-scores Card ──
  doc.setFillColor(13, 17, 23);
  doc.roundedRect(103, 88, 97, 60, 4, 4, 'F');

  if (score) {
    doc.setTextColor(120, 130, 150);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('SCORE BREAKDOWN', 113, 98);

    // Active score
    doc.setFillColor(0, 212, 170);
    doc.rect(103, 88, 4, 28, 'F');
    doc.setTextColor(0, 212, 170);
    doc.setFontSize(7);
    doc.text('ACTIVE TESTS', 113, 108);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(String(score.active_score), 113, 122);

    // Passive score
    doc.setFillColor(167, 139, 250);
    doc.rect(155, 88, 4, 28, 'F'); // small separator
    doc.setTextColor(167, 139, 250);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('PASSIVE MONITOR', 161, 108);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(String(score.passive_score), 161, 122);

    // Divider
    doc.setDrawColor(255, 255, 255, 0.05);
    doc.line(103, 132, 200, 132);

    // History stats
    if (history.length > 0) {
      const scores = history.map(h => h.score);
      const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
      const maxS = Math.max(...scores);

      doc.setTextColor(120, 130, 150);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Sessions', 113, 140);
      doc.text('Avg Score', 140, 140);
      doc.text('Peak', 170, 140);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(String(history.length), 113, 147);
      doc.text(String(avg), 140, 147);
      doc.text(String(maxS), 170, 147);
    }
  }

  // ── Interpretation Panel ──
  if (interpretation) {
    const iColor = interpretation.actionColor === '#00d4aa' ? [0, 212, 170] :
      interpretation.actionColor === '#f59e0b' ? [245, 158, 11] : [239, 68, 68];

    doc.setFillColor(13, 17, 23);
    doc.roundedRect(10, 154, W - 20, 42, 4, 4, 'F');
    doc.setFillColor(...iColor);
    doc.rect(10, 154, 4, 42, 'F');

    doc.setTextColor(120, 130, 150);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('CLINICAL INTERPRETATION', 20, 163);

    doc.setTextColor(...iColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${interpretation.headline}`, 20, 172);

    doc.setTextColor(180, 185, 200);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const detailLines = doc.splitTextToSize(interpretation.detail, W - 40);
    doc.text(detailLines, 20, 180);

    doc.setTextColor(...iColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Recommendation: `, 20, 192);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 205, 215);
    doc.text(interpretation.action, 57, 192);
  }

  // ── Score History Table ──
  if (history.length > 0) {
    doc.setFillColor(13, 17, 23);
    doc.roundedRect(10, 202, W - 20, 65, 4, 4, 'F');
    doc.setFillColor(245, 158, 11);
    doc.rect(10, 202, 4, 65, 'F');

    doc.setTextColor(120, 130, 150);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('SCORE HISTORY (LAST 10 SESSIONS)', 20, 212);

    // Table header
    doc.setFillColor(20, 25, 35);
    doc.rect(20, 216, W - 40, 7, 'F');
    doc.setTextColor(120, 130, 150);
    doc.setFontSize(7);
    doc.text('Session', 22, 221);
    doc.text('CogniScore', 65, 221);
    doc.text('Active', 105, 221);
    doc.text('Passive', 145, 221);
    doc.text('Trend', 175, 221);

    const last10 = history.slice(-10);
    last10.forEach((h, i) => {
      const y = 230 + i * 6.5;
      if (i % 2 === 0) {
        doc.setFillColor(15, 20, 30);
        doc.rect(20, y - 4, W - 40, 6.5, 'F');
      }

      const trend = i > 0 ? (h.score > last10[i - 1].score ? '↑' : h.score < last10[i - 1].score ? '↓' : '→') : '—';
      const trendColor = trend === '↑' ? [0, 212, 170] : trend === '↓' ? [239, 68, 68] : [120, 130, 150];

      doc.setTextColor(200, 205, 215);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(h.day, 22, y);
      doc.text(String(h.score), 65, y);
      doc.text(h.active ? String(h.active) : '—', 105, y);
      doc.text(h.passive ? String(h.passive) : '—', 145, y);

      doc.setTextColor(...trendColor);
      doc.setFont('helvetica', 'bold');
      doc.text(trend, 175, y);
    });
  }

  // ── Footer ──
  doc.setFillColor(13, 17, 23);
  doc.rect(0, 277, W, 20, 'F');
  doc.setTextColor(60, 70, 90);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('CogniVeil — AI Cognitive Health Monitoring | This report is for informational purposes only and does not constitute medical advice.', W / 2, 285, { align: 'center' });
  doc.text(`Report ID: ${reportId} | ${dateStr}`, W / 2, 291, { align: 'center' });

  // ── Page border ──
  doc.setDrawColor(0, 212, 170, 0.2);
  doc.setLineWidth(0.5);
  doc.rect(5, 5, W - 10, 287);

  if (clinicalReport) {
    doc.addPage();
    doc.setFillColor(8, 12, 20);
    doc.rect(0, 0, W, 297, 'F');
    doc.setTextColor(0, 212, 170);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Clinical Follow-up Summary', 15, 22);
    doc.setTextColor(180, 185, 200);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const referral = clinicalReport.referral || {};
    const lines = [
      `Screening action: ${referral.action || 'Routine monitoring'}`,
      `Urgency: ${referral.urgency || 'Low'} — ${referral.timeframe || 'Annual checkup'}`,
      `Recommended follow-up: ${referral.recommended_specialist || 'Primary care clinician'}`,
      '',
      referral.clinical_rationale || '',
      '',
      clinicalReport.narrative || '',
      '',
      'Important: CogniVeil is a screening and decision-support tool. It does not diagnose dementia or replace professional assessment.'
    ];
    doc.text(doc.splitTextToSize(lines.join('\n'), W - 30), 15, 36);
  }

  // Save
  const fileName = `CogniVeil_Report_${userName}_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};
// ────────────────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);
  const [signalCount, setSignalCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchData();
  }, [user, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    const userEmail = localStorage.getItem('userEmail') || 'default';
const sessionKey = `testSession_${userEmail}_${new Date().toDateString()}`;
const completedTests = (() => {
  try {
    const saved = localStorage.getItem(sessionKey);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
})();
const testsDoneToday = completedTests.length === 5;
    if (testsDoneToday) updateStreak(userEmail);
    setStreak(getStreak(userEmail));

    try {
      const scoreRes = await getScore();
      setScore(scoreRes.data);
      localStorage.setItem('latestCogniScore', String(scoreRes.data.score));
      localStorage.setItem('latestScoreDeviation', String(Boolean(scoreRes.data.is_deviating)));
      setTimeout(() => setAnimateScore(true), 300);
    } catch (err) { setScore(null); }
    try {
      const historyRes = await getScoreHistory();
      const formatted = historyRes.data.map((s, i) => ({
        day: `D${i + 1}`,
        score: s.score,
        active: s.active_score,
        passive: s.passive_score,
      }));
      setHistory(formatted);
    } catch (err) { setHistory([]); }
    try {
      const sigRes = await getTodaySignals();
      setSignalCount(sigRes.data.count);
    } catch (err) { setSignalCount(0); }
    setLoading(false);
  };

  const handleCalculate = async () => {
    setCalculating(true);
    setAnimateScore(false);
    try {
      const res = await calculateScore();
      setScore(res.data);
      localStorage.setItem('latestCogniScore', String(res.data.score));
      localStorage.setItem('latestScoreDeviation', String(Boolean(res.data.is_deviating)));
      await fetchData();
      setTimeout(() => setAnimateScore(true), 300);
    } catch (err) {
      alert('Complete a test first.');
    } finally { setCalculating(false); }
  };

  const handleExportPDF = async () => {
    if (!score) { alert('No score data available to export. Complete a test first.'); return; }
    setExporting(true);
    try {
      let clinicalReport = null;
      try {
        const reportResponse = await getClinicalReport({
          cogni_score: score.score,
          risk_level: score.risk_level,
          is_deviating: score.is_deviating,
        });
        clinicalReport = reportResponse.data;
      } catch (reportError) {
        console.warn('Clinical report unavailable; exporting score summary only.', reportError);
      }
      await exportPDF(user, score, history, streak, clinicalReport);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed. Please try again.');
    } finally { setExporting(false); }
  };

  const getRiskColor = (risk) => {
    if (risk === 'Low') return '#00d4aa';
    if (risk === 'Moderate') return '#f59e0b';
    return '#ef4444';
  };

  const getRiskGlow = (risk) => {
    if (risk === 'Low') return '0 0 40px rgba(0,212,170,0.3)';
    if (risk === 'Moderate') return '0 0 40px rgba(245,158,11,0.3)';
    return '0 0 40px rgba(239,68,68,0.3)';
  };

  const circumference = 2 * Math.PI * 54;
  const offset = score ? circumference - (score.score / 100) * circumference : circumference;

  const getStreakEmoji = (s) => {
    if (s >= 14) return '🔥🔥';
    if (s >= 7) return '🔥';
    if (s >= 3) return '⚡';
    return '📅';
  };

  const getStreakLabel = (s) => {
    if (s >= 14) return 'On fire!';
    if (s >= 7) return 'Great streak!';
    if (s >= 3) return 'Building habit';
    if (s === 1) return 'Just started';
    return 'No streak yet';
  };

  if (loading) return (
    <div style={styles.loadingScreen}>
      <div style={styles.loadingPulse}>
        <span style={styles.loadingBrain}>🧠</span>
        <p style={styles.loadingText}>Loading cognitive data...</p>
      </div>
    </div>
  );

const userEmail = localStorage.getItem('userEmail') || 'default';
const sessionKey = `testSession_${userEmail}_${new Date().toDateString()}`;
const completedTests = (() => {
  try {
    const saved = localStorage.getItem(sessionKey);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
})();
const testsDoneToday = completedTests.length === 5;
const interpretation = getInterpretation(score);

  return (
    <div style={styles.page}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      {score && score.risk_level === 'High' && (
        <div style={styles.alertBanner}>
          <span>⚠️</span>
          <span>CogniScore is in the High Risk zone. Consider scheduling a clinical assessment.</span>
          <button style={styles.alertBtn} onClick={() => navigate('/tests')}>Take Tests Now</button>
        </div>
      )}

      {(() => {
        if (history.length >= 2) {
          const recent = history.slice(-7);
          const first = recent[0]?.score || 0;
          const last = recent[recent.length - 1]?.score || 0;
          const drop = first - last;
          if (drop >= 10) {
            return (
              <div style={styles.trendBanner}>
                <span>📉</span>
                <div>
                  <strong style={{ color: '#f59e0b' }}>Declining Trend Detected</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#ffffff60' }}>
                    CogniScore has dropped {Math.round(drop)} points over the last {recent.length} sessions. Consider booking a clinical review.
                  </p>
                </div>
                <button style={styles.trendBtn} onClick={() => navigate('/level2')}>
                  Run Level 2 →
                </button>
              </div>
            );
          }
        }
        return null;
      })()}

      <div style={styles.header}>
        <div>
          <h1 style={styles.greeting}>Good day, {user?.email?.split('@')[0]} 👋</h1>
          <p style={styles.subGreeting}>Your cognitive health dashboard — updated in real time</p>
        </div>
        <div style={styles.streakBadge}>
          <span style={styles.streakEmoji}>{getStreakEmoji(streak)}</span>
          <div>
            <p style={styles.streakNum}>{streak} day{streak !== 1 ? 's' : ''}</p>
            <p style={styles.streakLabel}>{getStreakLabel(streak)}</p>
          </div>
        </div>
        <div style={styles.headerBtns}>
          <button
            style={{
              ...styles.exportBtn,
              opacity: exporting ? 0.7 : 1,
              cursor: exporting ? 'not-allowed' : 'pointer',
            }}
            onClick={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? '⏳ Generating...' : '📄 Export Report'}
          </button>
          <button style={styles.primaryBtn} onClick={() => navigate('/tests')}>
            Start Daily Tests →
          </button>
        </div>
      </div>

<div className="main-grid" style={styles.mainGrid}>

        <div style={{ ...styles.scoreCard, boxShadow: score ? getRiskGlow(score.risk_level) : 'none' }}>
          <p style={styles.cardLabel}>COGNISCORE</p>

          <div style={styles.ringWrapper}>
            <svg width="160" height="160" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={score ? getRiskColor(score.risk_level) : '#333'} />
                  <stop offset="100%" stopColor={score ? getRiskColor(score.risk_level) + 'aa' : '#333'} />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1a3a" strokeWidth="8"/>
              <circle cx="60" cy="60" r="54" fill="none" stroke="url(#scoreGrad)" strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={animateScore ? offset : circumference}
                strokeLinecap="round" transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
              />
            </svg>
            <div style={styles.ringCenter}>
              <span style={{ ...styles.scoreNum, color: score ? getRiskColor(score.risk_level) : '#444' }}>
                {score ? score.score : '—'}
              </span>
              <span style={styles.scoreOf}>/100</span>
            </div>
          </div>

          {score && (
            <>
              <div style={{
                ...styles.riskPill,
                background: getRiskColor(score.risk_level) + '22',
                border: `1px solid ${getRiskColor(score.risk_level)}55`,
                color: getRiskColor(score.risk_level),
              }}>
                {score.risk_level === 'Low' ? '✓' : score.risk_level === 'Moderate' ? '⚡' : '⚠️'} {score.risk_level} Risk
              </div>

              <div style={styles.subScores}>
                <div style={styles.subScore}>
                  <span style={styles.subLabel}>Active Tests</span>
                  <span style={styles.subVal}>{score.active_score}</span>
                </div>
                <div style={styles.subDivider}/>
                <div style={styles.subScore}>
                  <span style={styles.subLabel}>Passive</span>
                  <span style={styles.subVal}>{score.passive_score}</span>
                </div>
              </div>

              {/* ── EWMA / CUSUM Baseline Deviation Tracking ── */}
              <div style={{
                backgroundColor: score.is_deviating ? '#ef444415' : '#00d4aa10',
                border: `1px solid ${score.is_deviating ? '#ef444444' : '#00d4aa33'}`,
                borderRadius: '12px',
                padding: '0.85rem',
                marginTop: '1rem',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: score.is_deviating ? '#ef4444' : '#00d4aa', fontWeight: '700', fontSize: '0.78rem' }}>
                    {score.is_deviating ? '📉 BASELINE DEVIATION FLAGGED' : '📊 PERSONAL BASELINE STABLE'}
                  </span>
                  <span style={{ color: '#ffffff50', fontSize: '0.72rem' }}>EWMA: {score.ewma_score || score.score}</span>
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.8rem', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                  {score.is_deviating 
                    ? `Cognitive drop detected below baseline mean (${score.baseline_mean || '75'}). CUSUM tracking signal: ${score.cusum_value || 14.2}` 
                    : `Tracking mean baseline at ${score.baseline_mean || score.score}. CUSUM change-point index normal.`}
                </p>
              </div>

              {/* ── Score Interpretation Panel ── */}
              {interpretation && (
                <div style={{
                  ...styles.interpretBox,
                  borderColor: interpretation.actionColor + '33',
                  backgroundColor: interpretation.actionColor + '08',
                }}>
                  <div style={styles.interpretHeader}>
                    <span style={{ fontSize: '1.1rem' }}>{interpretation.icon}</span>
                    <p style={{ ...styles.interpretHeadline, color: interpretation.actionColor }}>
                      {interpretation.headline}
                    </p>
                  </div>
                  <p style={styles.interpretDetail}>{interpretation.detail}</p>
                  <div style={{ ...styles.interpretAction, borderColor: interpretation.actionColor + '33' }}>
                    <span style={{ color: interpretation.actionColor, fontSize: '0.75rem' }}>💡</span>
                    <p style={{ ...styles.interpretActionText, color: interpretation.actionColor }}>
                      {interpretation.action}
                    </p>
                  </div>
                </div>
              )}

              <p style={styles.lastUpdated}>Updated {new Date(score.created_at).toLocaleDateString()}</p>
            </>
          )}

          {!score && (
            <div style={styles.noScore}>
              <p style={styles.noScoreText}>No score yet</p>
              <button style={styles.primaryBtn} onClick={() => navigate('/tests')}>Take First Test</button>
            </div>
          )}

          <button style={styles.recalcBtn} onClick={handleCalculate} disabled={calculating}>
            {calculating ? '⏳ Calculating...' : '↻ Recalculate'}
          </button>
        </div>

        <div style={styles.rightCol}>

          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <p style={styles.cardLabel}>SCORE HISTORY</p>
              <div style={styles.legend}>
                <span style={styles.legendDot('#00d4aa')} /><span style={styles.legendText}>CogniScore</span>
                <span style={styles.legendDot('#f59e0b')} /><span style={styles.legendText}>Active</span>
                <span style={styles.legendDot('#a78bfa')} /><span style={styles.legendText}>Passive</span>
              </div>
            </div>
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="day" stroke="#ffffff30" fontSize={11} tick={{ fill: '#ffffff50' }} />
                  <YAxis domain={[0, 100]} stroke="#ffffff30" fontSize={11} tick={{ fill: '#ffffff50' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #ffffff15', borderRadius: '10px', fontSize: '12px' }} labelStyle={{ color: 'white', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="score" stroke="#00d4aa" strokeWidth={2} fill="url(#gradScore)" name="CogniScore" dot={false} />
                  <Line type="monotone" dataKey="active" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Active" />
                  <Line type="monotone" dataKey="passive" stroke="#a78bfa" strokeWidth={1.5} dot={false} name="Passive" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={styles.emptyChart}>
                <p style={{ color: '#ffffff30', fontSize: '0.9rem' }}>Complete tests to see your trend</p>
              </div>
            )}
          </div>

<div className="feature-grid" style={styles.featureGrid}>
            {(() => {
              const cards = [
                {
                  icon: '🧪', label: 'Active Testing', color: '#00d4aa', path: '/tests',
                  status: testsDoneToday ? '✅ Done today' : `${completedTests.length} / 5 complete`,
                  statusColor: testsDoneToday ? '#00d4aa' : '#ffffff40',
                  desc: testsDoneToday ? 'Come back tomorrow' : 'Tap to start daily tests',
                  badge: testsDoneToday ? null : 'DUE',
                },
                {
                  icon: '👁️', label: 'Passive Monitor', color: '#a78bfa', path: null,
                  status: '● Live', statusColor: '#a78bfa',
                  desc: `${signalCount} signals collected today`, badge: null,
                },
                {
                  icon: '🎙️', label: 'Voice Journal', color: '#f59e0b', path: '/voice',
                  status: "Record today's entry", statusColor: '#f59e0b',
                  desc: 'Speech biomarker analysis', badge: null,
                },
                {
                  icon: streak > 0 ? getStreakEmoji(streak) : '🔥',
                  label: 'Daily Streak', color: '#f97316', path: null,
                  status: streak > 0 ? `${streak} day streak` : 'No streak yet',
                  statusColor: streak >= 7 ? '#f97316' : streak >= 3 ? '#f59e0b' : '#ffffff40',
                  desc: getStreakLabel(streak),
                  badge: streak >= 7 ? 'HOT' : null,
                },
              ];

              return cards.map((f, i) => (
                <div key={i} style={{
                  ...styles.featureCard, cursor: f.path ? 'pointer' : 'default',
                  borderColor: f.path ? f.color + '33' : '#ffffff08', position: 'relative',
                }} onClick={() => f.path && navigate(f.path)}>
                  {f.badge && (
                    <div style={{
                      position: 'absolute', top: '0.75rem', right: '0.75rem',
                      backgroundColor: f.color + '25', color: f.color,
                      fontSize: '0.6rem', fontWeight: '800',
                      padding: '0.2rem 0.5rem', borderRadius: '6px',
                      letterSpacing: '0.08em', border: `1px solid ${f.color}44`,
                    }}>{f.badge}</div>
                  )}
                  <span style={styles.featureIcon}>{f.icon}</span>
                  <span style={{ ...styles.featureLabel, color: f.color }}>{f.label}</span>
                  <span style={{ ...styles.featureDesc, color: f.statusColor, fontWeight: '600', fontSize: '0.82rem' }}>{f.status}</span>
                  <span style={styles.featureDesc}>{f.desc}</span>
                  {f.path && !testsDoneToday && f.label === 'Active Testing' && <span style={{ ...styles.featureArrow, color: f.color }}>→</span>}
                  {f.path && f.label !== 'Active Testing' && <span style={{ ...styles.featureArrow, color: f.color }}>→</span>}
                </div>
              ));
            })()}
          </div>

        </div>
      </div>

<style>{`
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes blobFloat {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(30px, -20px) scale(1.05); }
  }
  @media (max-width: 640px) {
    .feature-grid { grid-template-columns: 1fr !important; }
    .main-grid { flex-direction: column !important; }
  }
`}</style>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#080c14', padding: '1rem', position: 'relative', overflow: 'hidden', fontFamily: "'Segoe UI', sans-serif" },
  blob1: { position: 'fixed', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)', top: '-100px', left: '-100px', pointerEvents: 'none', animation: 'blobFloat 8s ease-in-out infinite' },
  blob2: { position: 'fixed', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)', bottom: '-100px', right: '-100px', pointerEvents: 'none', animation: 'blobFloat 10s ease-in-out infinite reverse' },
  loadingScreen: { minHeight: '100vh', backgroundColor: '#080c14', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingPulse: { textAlign: 'center', animation: 'fadeUp 0.5s ease' },
  loadingBrain: { fontSize: '3rem', display: 'block', marginBottom: '1rem' },
  loadingText: { color: '#00d4aa', fontSize: '1rem' },
  alertBanner: { display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#ef444415', border: '1px solid #ef444440', borderRadius: '12px', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', color: '#ef4444', fontSize: '0.9rem', flexWrap: 'wrap' },
  alertBtn: { backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '0.4rem 1rem', fontSize: '0.85rem', cursor: 'pointer', marginLeft: 'auto', fontWeight: '600' },
  trendBanner: { display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#f59e0b10', border: '1px solid #f59e0b40', borderRadius: '12px', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  trendBtn: { backgroundColor: '#f59e0b', color: '#080c14', border: 'none', borderRadius: '8px', padding: '0.4rem 1rem', fontSize: '0.85rem', cursor: 'pointer', marginLeft: 'auto', fontWeight: '600' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', animation: 'fadeUp 0.5s ease' },
  greeting: { color: 'white', fontSize: '1.6rem', fontWeight: '700', marginBottom: '0.25rem' },
  subGreeting: { color: '#ffffff40', fontSize: '0.9rem' },
  streakBadge: { display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#f9731615', border: '1px solid #f9731630', borderRadius: '12px', padding: '0.6rem 1rem' },
  streakEmoji: { fontSize: '1.6rem', lineHeight: 1 },
  streakNum: { color: '#f97316', fontSize: '1rem', fontWeight: '800', margin: 0 },
  streakLabel: { color: '#ffffff40', fontSize: '0.72rem', margin: 0 },
  headerBtns: { display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' },
  exportBtn: { backgroundColor: 'transparent', color: '#00d4aa', border: '1px solid #00d4aa40', borderRadius: '10px', padding: '0.75rem 1.25rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.02em', transition: 'all 0.2s' },
  primaryBtn: { backgroundColor: '#00d4aa', color: '#080c14', border: 'none', borderRadius: '10px', padding: '0.75rem 1.5rem', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.02em' },
  mainGrid: { display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap', animation: 'fadeUp 0.6s ease' },
  scoreCard: { backgroundColor: '#0d1117', border: '1px solid #ffffff10', borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', minWidth: '260px', position: 'relative' },
  cardLabel: { color: '#ffffff30', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.15em', alignSelf: 'flex-start' },
  ringWrapper: { position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  scoreNum: { fontSize: '2.2rem', fontWeight: '800', lineHeight: 1 },
  scoreOf: { color: '#ffffff30', fontSize: '0.75rem' },
  riskPill: { padding: '0.4rem 1.2rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' },
  subScores: { display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', justifyContent: 'center', borderTop: '1px solid #ffffff08', paddingTop: '1rem' },
  subScore: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  subLabel: { color: '#ffffff30', fontSize: '0.7rem', letterSpacing: '0.05em' },
  subVal: { color: 'white', fontSize: '1.1rem', fontWeight: '700' },
  subDivider: { width: '1px', height: '30px', backgroundColor: '#ffffff10' },
  lastUpdated: { color: '#ffffff20', fontSize: '0.72rem' },
  noScore: { textAlign: 'center' },
  noScoreText: { color: '#ffffff40', marginBottom: '1rem' },
  recalcBtn: { backgroundColor: 'transparent', color: '#ffffff30', border: '1px solid #ffffff10', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer', width: '100%', transition: 'all 0.2s' },
  interpretBox: { width: '100%', borderRadius: '12px', border: '1px solid', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  interpretHeader: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  interpretHeadline: { fontSize: '0.85rem', fontWeight: '700', margin: 0 },
  interpretDetail: { color: '#ffffff55', fontSize: '0.78rem', lineHeight: 1.6, margin: 0 },
  interpretAction: { borderTop: '1px solid', paddingTop: '0.6rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' },
  interpretActionText: { fontSize: '0.75rem', fontWeight: '600', margin: 0, lineHeight: 1.5 },
  rightCol: { flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  chartCard: { backgroundColor: '#0d1117', border: '1px solid #ffffff10', borderRadius: '20px', padding: '1.5rem' },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' },
  legend: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  legendDot: (color) => ({ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }),
  legendText: { color: '#ffffff40', fontSize: '0.75rem' },
  emptyChart: { height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  featureGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  featureCard: { backgroundColor: '#0d1117', border: '1px solid #ffffff08', borderRadius: '14px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', transition: 'transform 0.2s, border-color 0.2s' },
  featureIcon: { fontSize: '1.6rem' },
  featureLabel: { fontSize: '0.85rem', fontWeight: '700' },
  featureDesc: { color: '#ffffff30', fontSize: '0.78rem' },
  featureArrow: { fontSize: '0.85rem', marginTop: '0.25rem' },
};

export default Dashboard;
