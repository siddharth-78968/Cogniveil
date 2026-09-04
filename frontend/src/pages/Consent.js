import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { grantConsent } from '../utils/api';
import AccessibilityBar from '../components/AccessibilityBar';

const Consent = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [hasConsented, setHasConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleGrantConsent = async () => {
    if (!hasConsented) {
      setError('Please review and acknowledge the consent agreement to proceed.');
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

  const styles = {
    wrapper: {
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.text,
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      transition: 'background-color 0.25s ease, color 0.25s ease',
      display: 'flex',
      flexDirection: 'column',
    },
    page: {
      flex: 1,
      padding: '2.5rem 1.5rem 4rem 1.5rem',
      maxWidth: '820px',
      width: '100%',
      margin: '0 auto',
      boxSizing: 'border-box',
      position: 'relative',
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem',
      position: 'relative',
    },
    topActions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: isDark ? 'rgba(163, 177, 138, 0.16)' : '#e8efe6',
      color: isDark ? '#a3b18a' : '#273822',
      border: `1px solid ${isDark ? '#526e49' : '#b8cab5'}`,
      padding: '0.4rem 0.95rem',
      borderRadius: '20px',
      fontSize: '0.72rem',
      fontWeight: '800',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    themeToggleBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '0.38rem 0.85rem',
      borderRadius: '20px',
      border: `1px solid ${theme.border}`,
      backgroundColor: theme.cardBg,
      color: theme.text,
      fontSize: '0.76rem',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    title: {
      fontSize: '2.1rem',
      fontWeight: '800',
      color: theme.text,
      letterSpacing: '-0.025em',
      margin: '0 0 0.65rem 0',
      lineHeight: '1.2',
    },
    subtitle: {
      color: theme.subtext,
      fontSize: '0.94rem',
      lineHeight: '1.6',
      maxWidth: '650px',
      margin: '0 auto',
    },
    errorBox: {
      backgroundColor: isDark ? 'rgba(217, 119, 127, 0.15)' : '#faebec',
      border: `1px solid ${isDark ? '#d9777f' : '#fecaca'}`,
      color: isDark ? '#fca5a5' : '#943840',
      padding: '0.85rem 1.1rem',
      borderRadius: '12px',
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
      backgroundColor: theme.cardBg,
      border: `1px solid ${theme.border}`,
      borderRadius: '18px',
      padding: '1.75rem',
      boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 4px 20px rgba(39, 56, 34, 0.05)',
      transition: 'all 0.2s ease',
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '0.75rem',
    },
    cardTitle: {
      fontSize: '1.15rem',
      fontWeight: '800',
      color: theme.text,
      margin: 0,
      letterSpacing: '-0.01em',
    },
    cardText: {
      fontSize: '0.9rem',
      color: isDark ? '#c8d4c2' : '#334730',
      lineHeight: '1.65',
      margin: '0 0 1rem 0',
    },
    privacyHighlight: {
      backgroundColor: isDark ? '#162018' : '#eaf1e8',
      border: `1px solid ${isDark ? 'rgba(163, 177, 138, 0.2)' : '#d2ded0'}`,
      borderRadius: '10px',
      padding: '0.75rem 1rem',
      fontSize: '0.84rem',
      color: isDark ? '#a3b18a' : '#273822',
      fontWeight: '600',
      lineHeight: '1.5',
    },
    actionBox: {
      backgroundColor: theme.cardBg,
      border: `1.5px solid ${isDark ? '#3d5236' : '#b8cab5'}`,
      borderRadius: '18px',
      padding: '1.65rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1.25rem',
      boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.45)' : '0 4px 24px rgba(39, 56, 34, 0.08)',
    },
    actionInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      flex: 1,
      minWidth: '280px',
    },
    checkboxRow: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      cursor: 'pointer',
      userSelect: 'none',
    },
    checkbox: {
      accentColor: isDark ? '#a3b18a' : '#273822',
      width: '20px',
      height: '20px',
      cursor: 'pointer',
      marginTop: '2px',
      flexShrink: 0,
    },
    checkboxLabel: {
      fontSize: '0.92rem',
      fontWeight: '700',
      color: theme.text,
      lineHeight: '1.5',
    },
    actionInfoSub: {
      color: theme.subtext,
      fontSize: '0.8rem',
      fontWeight: '600',
      paddingLeft: '2.1rem',
    },
    submitBtn: {
      backgroundColor: isDark ? '#3d5236' : '#273822',
      color: '#ffffff',
      border: `1px solid ${isDark ? '#526e49' : '#1b2818'}`,
      borderRadius: '12px',
      padding: '0.9rem 1.85rem',
      fontSize: '0.95rem',
      fontWeight: '800',
      transition: 'all 0.2s ease',
      boxShadow: isDark ? '0 4px 14px rgba(61, 82, 54, 0.4)' : '0 4px 14px rgba(39, 56, 34, 0.25)',
      fontFamily: "'Inter', sans-serif",
    },
  };

  return (
    <div style={styles.wrapper}>
      {/* Top Accessibility & Theme Control Bar */}
      <AccessibilityBar />

      <div style={styles.page}>
        <div style={styles.header}>
          <div style={styles.topActions}>
            <div style={styles.badge}>Ethical AI & Transparency Protocol</div>
            <button 
              onClick={toggleTheme} 
              style={styles.themeToggleBtn}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>

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
          </div>
        </div>

        {/* Action Row with Single Unified Consent Checkbox */}
        <div style={styles.actionBox}>
          <div style={styles.actionInfo}>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={hasConsented}
                onChange={(e) => setHasConsented(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxLabel}>
                I consent to passive motor timing collection, voice biomarker analysis, and the 7-day baseline calibration protocol.
              </span>
            </label>
            <span style={styles.actionInfoSub}>
              You can revoke consent or request data export at any time in Settings.
            </span>
          </div>
          <button
            onClick={handleGrantConsent}
            disabled={!hasConsented || submitting}
            style={{
              ...styles.submitBtn,
              opacity: !hasConsented || submitting ? 0.6 : 1,
              cursor: !hasConsented || submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Recording Consent...' : 'I Consent and Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Consent;
