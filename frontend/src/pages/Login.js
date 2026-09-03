import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { pingBackend } from '../utils/api';

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v2"></path>
    <path d="M12 20v2"></path>
    <path d="m4.93 4.93 1.41 1.41"></path>
    <path d="m17.66 17.66 1.41 1.41"></path>
    <path d="M2 12h2"></path>
    <path d="M20 12h2"></path>
    <path d="m6.34 17.66-1.41 1.41"></path>
    <path d="m19.07 4.93-1.41 1.41"></path>
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const { isDark, toggleTheme, theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    pingBackend().catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot connect to backend server. Please ensure the Python backend is running on port 8000.');
      } else if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        setError(typeof detail === 'string' ? detail : 'Invalid email or password.');
      } else {
        setError('Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPass = 'demo1234') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setError('');
    try {
      await login(demoEmail, demoPass);
      navigate('/dashboard');
    } catch (err) {
      try {
        await login(demoEmail, 'password123');
        navigate('/dashboard');
      } catch (err2) {
        if (err.code === 'ERR_NETWORK' || !err.response) {
          setError('Cannot connect to backend server. Please ensure the Python backend is running on port 8000.');
        } else if (err.response?.data?.detail) {
          const detail = err.response.data.detail;
          setError(typeof detail === 'string' ? detail : 'Invalid email or password.');
        } else {
          setError('Failed to login with demo account. Ensure the backend is running.');
        }
      }
    } finally {
      setLoading(false);
    }
  };


  const demoAccounts = [
    { label: 'Dr. Riya (Clinical Supervisor)', email: 'riyamehta55@gmail.com', tier: 'Clinician / Supervisor', tierClass: 'level-clinician' },
    { label: 'Rajan Pillai (MCI trajectory drift)', email: 'rajan@demo.com', tier: 'High risk (Tier 3)', tierClass: 'level-3' },
    { label: 'Meena Krishnan (Prodromal drift)', email: 'meena@demo.com', tier: 'Moderate risk (Tier 2)', tierClass: 'level-2' },
    { label: 'Arjun Sharma (Normal baseline)', email: 'arjun@demo.com', tier: 'Low risk (Tier 1)', tierClass: 'level-1' },
  ];

  return (
    <div style={{ ...styles.pageWrapper, backgroundColor: theme.bg, color: theme.text }}>
      {/* Top Navigation */}
      <header style={{ ...styles.header, backgroundColor: theme.topHeaderBg, borderBottom: `1px solid ${theme.border}` }}>
        <div style={styles.brandBox} onClick={() => navigate('/')}>
          <span style={{ ...styles.brandTitle, color: theme.text }}>CogniVeil</span>
          <span style={{ ...styles.brandPipe, color: theme.border }}>/</span>
          <span style={{ ...styles.brandSub, color: theme.subtext }}>Clinical workstation authentication</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="theme-toggle-switch" 
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button 
            style={{ 
              ...styles.navLinkBtn, 
              borderColor: theme.border, 
              color: theme.text,
              backgroundColor: theme.cardBg 
            }} 
            onClick={() => navigate('/register')}
          >
            Register patient
          </button>
        </div>
      </header>

      {/* Main Authentication Card */}
      <div style={styles.centerContainer}>
        <div style={{ ...styles.authCard, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
          
          <div style={styles.cardHeader}>
            <span style={{ ...styles.kicker, color: isDark ? '#94a3b8' : '#0284C7' }}>Authorized clinical access</span>
            <h1 style={{ ...styles.cardTitle, color: theme.text }}>Sign in to CogniVeil</h1>
            <p style={{ ...styles.cardSub, color: theme.subtext }}>
              Access longitudinal cognitive telemetry, active assessments, and multimodal clinical evidence dossiers.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={{ ...styles.label, color: theme.text }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  ...styles.input, 
                  backgroundColor: theme.inputBg, 
                  borderColor: theme.inputBorder,
                  color: theme.text
                }}
                placeholder="clinician@hospital.org or patient@example.com"
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ ...styles.label, color: theme.text }}>Password</label>
                <button
                  type="button"
                  style={{ ...styles.textBtn, color: theme.subtext }}
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? 'Hide password' : 'Show password'}
                </button>
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  ...styles.input, 
                  backgroundColor: theme.inputBg, 
                  borderColor: theme.inputBorder,
                  color: theme.text
                }}
                placeholder="••••••••••••"
                required
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cv-btn-primary"
              style={{ width: '100%', marginTop: '0.4rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign in to workstation'}
            </button>
          </form>

          {/* Pre-Configured Demo Patient Records */}
          <div style={{ ...styles.demoSection, borderTop: `1px solid ${theme.border}` }}>
            <div style={{ ...styles.demoDivider, color: theme.subtext }}>
              <span>Pre-configured demo records (password: demo1234)</span>
            </div>
            <div style={styles.demoGrid}>
              {demoAccounts.map((d, i) => (
                <div
                  key={i}
                  style={{ 
                    ...styles.demoChip, 
                    backgroundColor: isDark ? '#0a0f16' : '#FAF7F2',
                    borderColor: theme.border 
                  }}
                  onClick={() => handleDemoLogin(d.email)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>{d.label}</span>
                    <span style={{ fontSize: '12px', color: theme.subtext, fontFamily: "'JetBrains Mono', monospace" }}>{d.email}</span>
                  </div>
                  <span className={`level-badge ${d.tierClass}`}>
                    {d.tier}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...styles.footerNote, color: theme.subtext }}>
            <span>New patient record? </span>
            <Link to="/register" style={{ color: isDark ? '#22d3ee' : '#0284C7', fontWeight: '600' }}>Enroll patient</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.2s ease',
  },
  header: {
    height: '64px',
    padding: '0 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  brandBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  brandTitle: {
    fontSize: '15px',
    fontWeight: '700',
  },
  brandPipe: {
    fontSize: '14px',
  },
  brandSub: {
    fontSize: '13px',
  },
  navLinkBtn: {
    border: '1px solid',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  centerContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2.5rem 1rem',
  },
  authCard: {
    width: '100%',
    maxWidth: '520px',
    borderRadius: '16px',
    padding: '2.25rem',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
  },
  cardHeader: {
    marginBottom: '1.75rem',
  },
  kicker: {
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', monospace",
    display: 'block',
    marginBottom: '4px',
    fontWeight: '700',
  },
  cardTitle: {
    fontFamily: "'Newsreader', Georgia, serif",
    fontSize: '2rem',
    fontWeight: '400',
    letterSpacing: '-0.015em',
    margin: '0 0 8px 0',
  },
  cardSub: {
    fontSize: '13.5px',
    lineHeight: '1.55',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  label: {
    fontSize: '12.5px',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  textBtn: {
    background: 'none',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    padding: 0,
  },
  errorBox: {
    backgroundColor: 'rgba(184, 92, 74, 0.15)',
    border: '1px solid #B85C4A',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '13px',
    color: '#B85C4A',
  },
  demoSection: {
    marginTop: '1.75rem',
    paddingTop: '1.5rem',
  },
  demoDivider: {
    fontSize: '11px',
    marginBottom: '0.85rem',
    fontFamily: "'JetBrains Mono', monospace",
  },
  demoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  demoChip: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.7rem 1rem',
    borderRadius: '8px',
    border: '1px solid',
    cursor: 'pointer',
  },
  footerNote: {
    marginTop: '1.75rem',
    textAlign: 'center',
    fontSize: '13px',
  },
};

export default Login;