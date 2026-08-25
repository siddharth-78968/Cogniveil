import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { pingBackend } from '../utils/api';
import './Landing.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Ping backend on mount
  React.useEffect(() => {
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
        setError('Cannot connect to backend server. Please ensure the Python backend is running.');
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
      .catch(() => setError('Failed to login with demo account.'));
  };

  return (
    <div className="landing-page" style={styles.pageWrapper}>
      
      {/* ══ Fixed video BG (Exact same URL as Landing page) ══ */}
      <div className="lbg">
        <video className="lbg-video" autoPlay muted loop playsInline>
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* ══ Ambient Holographic Glow Overlay ══ */}
      <div style={styles.ambientGlow} />

      {/* ══ Fixed Header matching Landing Page ══ */}
      <header className="lheader">
        <button className="llogo-btn" onClick={() => navigate('/')} title="CogniVeil Home">
          <span className="llogo-text">CV</span>
        </button>
        <nav className="lnav-pill">
          <button className="lnav-link" onClick={() => navigate('/')}>Home</button>
          <button className="lnav-link" onClick={() => navigate('/#product')}>Product</button>
          <button className="lnav-link" onClick={() => navigate('/#case-studies')}>Case Studies</button>
          <button className="lnav-link" onClick={() => navigate('/#contact')}>Contact</button>
        </nav>
        <button className="lbtn-signin" onClick={() => navigate('/register')}>
          Get Started
        </button>
      </header>

      {/* ══ Centered Ultra-Glassmorphic 2-Column Auth Card ══ */}
      <div style={styles.contentContainer}>
        <div style={styles.authCard}>
          
          {/* Left Hero Branding Column */}
          <div style={styles.leftCol}>
            <div style={styles.brandRow} onClick={() => navigate('/')}>
              <span style={{ fontSize: '1.4rem' }}>🧠</span>
              <span style={styles.brandTitle}>CogniVeil</span>
            </div>

            <h1 style={styles.heroTitle}>
              Early detection<br />saves lives.
            </h1>

            <p style={styles.heroSub}>
              AI-powered passive + active cognitive monitoring. Catch dementia signals months before clinical symptoms appear.
            </p>

            {/* Stats Row matching Landing Page */}
            <div style={styles.statsRow}>
              <div style={styles.statBox}>
                <span style={styles.statNum}>25.5M</span>
                <span style={styles.statLabel}>projected dementia cases in India by 2050</span>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statBox}>
                <span style={styles.statNum}>3 min</span>
                <span style={styles.statLabel}>daily check-in is all it takes</span>
              </div>
            </div>

            {/* 3 Clinical Tier Pills */}
            <div style={styles.tiersList}>
              <div style={{ ...styles.tierPill, borderColor: 'rgba(0, 212, 170, 0.4)', color: '#00d4aa' }}>
                <span style={{ color: '#00d4aa' }}>→</span>
                <span>Level 1: Passive Screening</span>
              </div>
              <div style={{ ...styles.tierPill, borderColor: 'rgba(167, 139, 250, 0.3)', color: '#a78bfa' }}>
                <span style={{ color: '#a78bfa' }}>→</span>
                <span>Level 2: Deep Assessment</span>
              </div>
              <div style={{ ...styles.tierPill, borderColor: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b' }}>
                <span style={{ color: '#f59e0b' }}>→</span>
                <span>Level 3: MRI Deep Learning</span>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div style={styles.rightCol}>
            <span style={styles.formEyebrow}>SIGN IN</span>
            <h2 style={styles.formHeading}>Welcome back</h2>
            <p style={styles.formSub}>Continue monitoring your cognitive health</p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.passwordWrapper}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...styles.input, paddingRight: '2.8rem' }}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    style={styles.eyeBtn}
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && (
                <div style={styles.errorBox}>
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={styles.submitBtn}
              >
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </form>

            {/* Quick Demo One-Click Accounts */}
            <div style={styles.demoSection}>
              <div style={styles.demoDivider}>
                <span>DEMO ACCOUNTS</span>
              </div>
              <div style={styles.demoGrid}>
                <div 
                  style={{ ...styles.demoCard, borderColor: 'rgba(0, 212, 170, 0.35)' }}
                  onClick={() => handleDemoLogin('arjun@demo.com')}
                >
                  <span style={{ fontSize: '0.68rem', color: '#00d4aa', fontWeight: '700' }}>Low Risk (Healthy)</span>
                  <span style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: '600' }}>arjun@demo.com</span>
                </div>
                <div 
                  style={{ ...styles.demoCard, borderColor: 'rgba(245, 158, 11, 0.35)' }}
                  onClick={() => handleDemoLogin('meena@demo.com')}
                >
                  <span style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: '700' }}>Moderate (Prodromal)</span>
                  <span style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: '600' }}>meena@demo.com</span>
                </div>
                <div 
                  style={{ ...styles.demoCard, borderColor: 'rgba(239, 68, 68, 0.35)' }}
                  onClick={() => handleDemoLogin('rajan@demo.com')}
                >
                  <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: '700' }}>High Risk (MCI Drift)</span>
                  <span style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: '600' }}>rajan@demo.com</span>
                </div>
              </div>
            </div>

            <p style={styles.footerLink}>
              New user? <Link to="/register" style={styles.createLink}>Create account</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '90px 1.5rem 2.5rem 1.5rem',
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    overflowX: 'hidden',
  },
  ambientGlow: {
    position: 'fixed',
    inset: 0,
    background: 'radial-gradient(ellipse at 50% 40%, rgba(20, 20, 35, 0.35) 0%, rgba(0, 0, 0, 0.82) 100%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  contentContainer: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '1060px',
    margin: 'auto 0',
  },
  authCard: {
    display: 'grid',
    gridTemplateColumns: '1.08fr 1fr',
    backgroundColor: 'rgba(15, 17, 26, 0.72)',
    backdropFilter: 'blur(36px)',
    WebkitBackdropFilter: 'blur(36px)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    borderRadius: '28px',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.75)',
    overflow: 'hidden',
  },
  leftCol: {
    padding: '3.2rem 2.75rem',
    borderRight: '1px solid rgba(255, 255, 255, 0.09)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(0, 0, 0, 0.3) 100%)',
  },
  brandRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.65rem',
    cursor: 'pointer',
    marginBottom: '1.5rem',
  },
  brandTitle: {
    fontSize: '1.45rem',
    fontWeight: '800',
    color: '#00d4aa',
    fontFamily: '"BubbledotICG-FinePos", monospace',
    letterSpacing: '0.04em',
  },
  heroTitle: {
    fontSize: 'clamp(2.1rem, 3.4vw, 2.6rem)',
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 1.15,
    margin: '0 0 1rem 0',
    letterSpacing: '-0.02em',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
  },
  heroSub: {
    fontSize: '0.92rem',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 1.6,
    margin: '0 0 2rem 0',
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    padding: '1.25rem',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.09)',
    borderRadius: '16px',
    marginBottom: '1.75rem',
  },
  statBox: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  statNum: {
    fontSize: '1.45rem',
    fontWeight: '800',
    color: '#00d4aa',
    fontFamily: '"BubbledotICG-FinePos", monospace',
  },
  statLabel: {
    fontSize: '0.72rem',
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: '2px',
    lineHeight: 1.3,
  },
  statDivider: {
    width: '1px',
    height: '42px',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  tiersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  tierPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    padding: '0.7rem 1.1rem',
    borderRadius: '12px',
    border: '1px solid',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    fontSize: '0.84rem',
    fontWeight: '600',
  },

  // Right Form Column
  rightCol: {
    padding: '3.2rem 2.75rem',
    display: 'flex',
    flexDirection: 'column',
  },
  formEyebrow: {
    fontSize: '0.72rem',
    fontWeight: '800',
    color: '#00d4aa',
    letterSpacing: '0.12em',
    marginBottom: '0.4rem',
    display: 'block',
  },
  formHeading: {
    fontSize: '1.85rem',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0 0 0.35rem 0',
    letterSpacing: '-0.02em',
  },
  formSub: {
    fontSize: '0.86rem',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: '0 0 1.5rem 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.78rem',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  input: {
    width: '100%',
    padding: '0.85rem 1.1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.9rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    opacity: 0.75,
    padding: 0,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: '10px',
    padding: '0.75rem',
    fontSize: '0.82rem',
    color: '#fca5a5',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  submitBtn: {
    marginTop: '0.5rem',
    padding: '0.85rem',
    borderRadius: '999px',
    backgroundColor: '#ffffff',
    color: '#080c14',
    border: 'none',
    fontSize: '0.92rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255, 255, 255, 0.25)',
    transition: 'transform 0.15s ease, box-shadow 0.2s ease',
  },
  demoSection: {
    marginTop: '1.5rem',
  },
  demoDivider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.1em',
    marginBottom: '0.75rem',
  },
  demoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  demoCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.7rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  footerLink: {
    marginTop: '1.5rem',
    textAlign: 'center',
    fontSize: '0.84rem',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  createLink: {
    color: '#00d4aa',
    textDecoration: 'none',
    fontWeight: '700',
    marginLeft: '0.35rem',
  },
};

export default Login;