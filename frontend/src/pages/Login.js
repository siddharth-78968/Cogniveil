import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { pingBackend } from '../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
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

  const handleDemoLogin = (demoEmail, demoPass = 'password123') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    login(demoEmail, demoPass)
      .then(() => navigate('/dashboard'))
      .catch(() => setError('Failed to login with demo account. Ensure the backend is running.'));
  };

  const demoAccounts = [
    { label: 'Rajan Pillai (Elevated Risk / MCI Drift)', email: 'rajan@demo.com', color: '#D97745', bg: '#FFF0E8' },
    { label: 'Meena Iyer (Moderate / Prodromal)', email: 'meena@demo.com', color: '#C8922E', bg: '#FEF7EA' },
    { label: 'Arjun Sharma (Normal / Baseline)', email: 'arjun@demo.com', color: '#2F7D5B', bg: '#E8F5EE' },
  ];

  return (
    <div style={styles.pageWrapper}>
      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.brandBox} onClick={() => navigate('/')}>
          <div style={styles.brandIconWrapper}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#53B7C5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"></path>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"></path>
            </svg>
          </div>
          <div style={styles.brandTextGroup}>
            <span style={styles.brandTitle}>COGNIVEIL</span>
            <span style={styles.brandSub}>Clinical Intelligence</span>
          </div>
        </div>

        <button style={styles.navLinkBtn} onClick={() => navigate('/register')}>
          Create Patient Account →
        </button>
      </header>

      {/* Main Form Container */}
      <div style={styles.centerContainer}>
        <div style={styles.authCard}>
          
          {/* Header */}
          <div style={styles.cardHeader}>
            <span style={styles.eyebrow}>CLINICAL WORKSTATION AUTHENTICATION</span>
            <h1 style={styles.cardTitle}>Sign in to CogniVeil</h1>
            <p style={styles.cardSub}>
              Access longitudinal cognitive telemetry, active assessments, and multimodal clinical reports.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="clinician@hospital.org or patient@example.com"
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Password</label>
                <button
                  type="button"
                  style={styles.textBtn}
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? 'Hide password' : 'Show password'}
                </button>
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••••••"
                required
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace →'}
            </button>
          </form>

          {/* Quick Demo Pre-filled Account Chips */}
          <div style={styles.demoSection}>
            <div style={styles.demoDivider}>
              <span>PRE-CONFIGURED DEMO PROFILES</span>
            </div>
            <div style={styles.demoGrid}>
              {demoAccounts.map((d, i) => (
                <div
                  key={i}
                  style={{ ...styles.demoChip, borderColor: d.color, backgroundColor: d.bg }}
                  onClick={() => handleDemoLogin(d.email)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: '800', color: d.color }}>{d.label}</span>
                    <span style={{ fontSize: '0.78rem', color: '#102A43', fontWeight: '600' }}>{d.email}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: d.color }}>Launch →</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.footerNote}>
            <span>Need a new account? </span>
            <Link to="/register" style={styles.link}>Register patient record</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#F7F9F8',
    color: '#102A43',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    height: '72px',
    padding: '0 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #DCE6E4',
    backgroundColor: '#FFFFFF',
  },
  brandBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    cursor: 'pointer',
  },
  brandIconWrapper: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#E0FCFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: '0.95rem',
    fontWeight: '900',
    color: '#102A43',
    letterSpacing: '0.08em',
  },
  brandSub: {
    fontSize: '0.65rem',
    color: '#287C78',
    fontWeight: '700',
  },
  navLinkBtn: {
    background: 'none',
    border: '1px solid #DCE6E4',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#0F4C4A',
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
    backgroundColor: '#FFFFFF',
    border: '1px solid #DCE6E4',
    borderRadius: '16px',
    padding: '2.25rem',
    boxShadow: '0 4px 20px rgba(16, 42, 67, 0.05)',
  },
  cardHeader: {
    marginBottom: '1.5rem',
  },
  eyebrow: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#0F4C4A',
    letterSpacing: '0.08em',
    display: 'block',
    marginBottom: '4px',
  },
  cardTitle: {
    fontSize: '1.65rem',
    fontWeight: '800',
    color: '#102A43',
    letterSpacing: '-0.02em',
    margin: '0 0 6px 0',
  },
  cardSub: {
    fontSize: '0.86rem',
    color: '#627D98',
    lineHeight: '1.45',
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
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#102A43',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #DCE6E4',
    borderRadius: '8px',
    fontSize: '0.88rem',
    color: '#102A43',
    backgroundColor: '#F0F5F4',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  textBtn: {
    background: 'none',
    border: 'none',
    color: '#287C78',
    fontSize: '0.74rem',
    fontWeight: '700',
    cursor: 'pointer',
    padding: 0,
  },
  errorBox: {
    backgroundColor: '#FFF0E8',
    border: '1px solid #D97745',
    borderRadius: '8px',
    padding: '0.75rem',
    fontSize: '0.8rem',
    color: '#D97745',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  submitBtn: {
    backgroundColor: '#0F4C4A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '0.85rem',
    fontSize: '0.92rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '0.4rem',
    boxShadow: '0 2px 8px rgba(15, 76, 74, 0.2)',
  },
  demoSection: {
    marginTop: '1.75rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #DCE6E4',
  },
  demoDivider: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#627D98',
    letterSpacing: '0.08em',
    marginBottom: '0.75rem',
    textAlign: 'center',
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
    padding: '0.65rem 1rem',
    borderRadius: '10px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
  },
  footerNote: {
    marginTop: '1.5rem',
    textAlign: 'center',
    fontSize: '0.82rem',
    color: '#627D98',
  },
  link: {
    color: '#0F4C4A',
    fontWeight: '700',
    textDecoration: 'none',
  }
};

export default Login;