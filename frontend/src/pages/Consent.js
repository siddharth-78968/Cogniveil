import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { grantConsent } from '../utils/api';

const Consent = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [agreedPassive, setAgreedPassive] = useState(true);
  const [agreedVoice, setAgreedVoice] = useState(true);
  const [agreedCalib, setAgreedCalib] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const allChecked = agreedPassive && agreedVoice && agreedCalib;

  const handleGrantConsent = async () => {
    if (!allChecked) {
      setError('Please review and acknowledge all consent items to proceed.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await grantConsent(true);
      if (refreshUser) await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to record consent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.bgGrid} />

      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.badge}>ETHICAL AI & TRANSPARENCY PROTOCOL</div>
          <h1 style={styles.title}>Informed Consent & Privacy</h1>
          <p style={styles.subtitle}>
            CogniVeil is designed with transparent digital biomarker tracking. 
            Before daily screening begins, please review how your data is collected, calibrated, and protected.
          </p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.cardsGrid}>
          {/* Card 1 */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>1. Passive Digital Biomarkers</h3>
            </div>
            <p style={styles.cardText}>
              When you use CogniVeil, background timing metrics (typing speed intervals, backspace correction rate, and scroll hesitation) are measured to evaluate fine motor stability.
            </p>
            <div style={styles.privacyHighlight}>
              <strong>Privacy Guarantee:</strong> We <u>never</u> record typed text or key content. Only millisecond intervals are computed.
            </div>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={agreedPassive}
                onChange={(e) => setAgreedPassive(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxLabel}>I consent to passive motor timing collection</span>
            </label>
          </div>

          {/* Card 2 */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>2. Acoustic & Speech Biomarkers</h3>
            </div>
            <p style={styles.cardText}>
              Voice Journal recordings analyze pause duration, speech activity ratio, and rhythm indicators in your vernacular language.
            </p>
            <div style={styles.privacyHighlight}>
              <strong>Zero Audio Retention:</strong> Raw voice audio is processed on-device / in-memory and discarded after acoustic biomarker extraction.
            </div>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={agreedVoice}
                onChange={(e) => setAgreedVoice(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxLabel}>I consent to voice biomarker analysis</span>
            </label>
          </div>

          {/* Card 3 */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>3. 7-Day Baseline Calibration Week</h3>
            </div>
            <p style={styles.cardText}>
              Cognitive monitoring compares your performance strictly against your <strong>own established baseline</strong>, not an arbitrary population average.
            </p>
            <div style={styles.privacyHighlight}>
              <strong>False-Alarm Shield:</strong> During your first 7 days, drift alerts are muted while your personalized baseline is established.
            </div>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={agreedCalib}
                onChange={(e) => setAgreedCalib(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxLabel}>I understand the 7-day calibration requirement</span>
            </label>
          </div>
        </div>

        {/* Action Row */}
        <div style={styles.actionBox}>
          <div style={styles.actionInfo}>
            <span style={styles.actionInfoTitle}>Ready to begin your baseline week</span>
            <span style={styles.actionInfoSub}>You can revoke consent or request data export at any time in Settings.</span>
          </div>
          <button
            onClick={handleGrantConsent}
            disabled={!allChecked || submitting}
            style={{
              ...styles.submitBtn,
              opacity: !allChecked || submitting ? 0.6 : 1,
              cursor: !allChecked || submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Recording Consent...' : 'Confirm & Begin Baseline Week →'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f4f6fc',
    padding: '3rem 1.5rem',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    color: '#1e293b',
  },
  container: {
    maxWidth: '780px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#f5f3ff',
    color: '#4338CA',
    border: '1px solid #c7d2fe',
    padding: '0.35rem 0.9rem',
    borderRadius: '20px',
    fontSize: '0.72rem',
    fontWeight: '800',
    letterSpacing: '0.08em',
    marginBottom: '0.75rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: '-0.02em',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '0.92rem',
    lineHeight: '1.6',
    maxWidth: '650px',
    margin: '0 auto',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    marginBottom: '1.5rem',
    fontSize: '0.88rem',
    fontWeight: '600',
  },
  cardsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    marginBottom: '2rem',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #eef2f6',
    borderRadius: '20px',
    padding: '1.75rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  cardIcon: {
    fontSize: '1.4rem',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: 0,
  },
  cardText: {
    fontSize: '0.88rem',
    color: '#475569',
    lineHeight: '1.6',
    margin: '0 0 1rem 0',
  },
  privacyHighlight: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0.65rem 0.9rem',
    fontSize: '0.82rem',
    color: '#4338CA',
    marginBottom: '1rem',
    fontWeight: '600',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkbox: {
    accentColor: '#4338CA',
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  actionBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #c7d2fe',
    borderRadius: '20px',
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    boxShadow: '0 4px 20px rgba(67, 56, 202, 0.06)',
  },
  actionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  actionInfoTitle: {
    color: '#1e293b',
    fontSize: '0.95rem',
    fontWeight: '800',
  },
  actionInfoSub: {
    color: '#64748b',
    fontSize: '0.78rem',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#4338CA',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.85rem 1.75rem',
    fontSize: '0.92rem',
    fontWeight: '800',
    transition: 'all 0.2s',
    boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
  },
};

export default Consent;
