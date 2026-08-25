import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCaregiver, setIsCaregiver] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const parsedAge = parseInt(age, 10);
    if (!parsedAge || isNaN(parsedAge)) {
      setError('Please enter a valid age (e.g. 65).');
      setLoading(false);
      return;
    }

    try {
      await register(name, email, password, parsedAge, gender, isCaregiver);
      try {
        await login(email, password);
        navigate('/consent');
      } catch (loginErr) {
        navigate('/login');
      }
    } catch (err) {
      let errMsg = 'Registration failed. Please check your inputs and try again.';
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errMsg = detail;
        } else if (Array.isArray(detail)) {
          errMsg = detail.map(d => d.msg || d.detail).join(', ');
        }
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
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

      {/* ══ Fixed Floating Header matching Landing Page ══ */}
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
        <button className="lbtn-signin" onClick={() => navigate('/login')}>
          Sign in
        </button>
      </header>

      {/* ══ Centered Ultra-Glassmorphic 2-Column Card ══ */}
      <div style={styles.contentContainer}>
        <div style={styles.authCard}>
          
          {/* Left Hero Branding Column */}
          <div style={styles.leftCol}>
            <div style={styles.brandRow} onClick={() => navigate('/')}>
              <span style={{ fontSize: '1.4rem' }}>🧠</span>
              <span style={styles.brandTitle}>CogniVeil</span>
            </div>

            <h1 style={styles.heroTitle}>
              Join the future of<br />cognitive health.
            </h1>

            <p style={styles.heroSub}>
              Set up continuous digital telemetry, 7-day personalized baseline calibration, and vernacular voice journals.
            </p>

            {/* Privacy & Protocol Guarantee List */}
            <div style={styles.guaranteeList}>
              <div style={styles.guaranteeItem}>
                <span style={styles.checkIcon}>✓</span>
                <div>
                  <h4 style={styles.guaranteeTitle}>7-Day Baseline Calibration</h4>
                  <p style={styles.guaranteeDesc}>No cold-start false positives; your personal baseline is built over the first week.</p>
                </div>
              </div>
              <div style={styles.guaranteeItem}>
                <span style={styles.checkIcon}>✓</span>
                <div>
                  <h4 style={styles.guaranteeTitle}>Consent-Gated Telemetry</h4>
                  <p style={styles.guaranteeDesc}>Passive typing cadence & micro-tests remain completely private under your control.</p>
                </div>
              </div>
              <div style={styles.guaranteeItem}>
                <span style={styles.checkIcon}>✓</span>
                <div>
                  <h4 style={styles.guaranteeTitle}>Family & Caregiver Circles</h4>
                  <p style={styles.guaranteeDesc}>Optional real-time drift alerts for authorized doctors and loved ones.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div style={styles.rightCol}>
            <span style={styles.formEyebrow}>GET STARTED</span>
            <h2 style={styles.formHeading}>Create account</h2>
            <p style={styles.formSub}>Takes less than 60 seconds to get calibrated</p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. Eleanor Vance"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div style={styles.twoColInputs}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Age</label>
                  <input
                    type="number"
                    min="18"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    style={styles.input}
                    placeholder="65"
                    required
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={styles.select}
                  >
                    <option value="Female" style={{ background: '#0f172a' }}>Female</option>
                    <option value="Male" style={{ background: '#0f172a' }}>Male</option>
                    <option value="Other" style={{ background: '#0f172a' }}>Other</option>
                  </select>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.passwordWrapper}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...styles.input, paddingRight: '2.8rem' }}
                    placeholder="Min. 6 characters"
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

              {/* Caregiver Account Checkbox */}
              <div 
                style={styles.caregiverRow}
                onClick={() => setIsCaregiver(!isCaregiver)}
              >
                <input
                  type="checkbox"
                  checked={isCaregiver}
                  onChange={(e) => setIsCaregiver(e.target.checked)}
                  style={styles.checkbox}
                />
                <span style={styles.caregiverLabel}>
                  I am a Doctor / Family Caregiver managing other patients
                </span>
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
                {loading ? 'Creating Account...' : 'Get Started Free →'}
              </button>
            </form>

            <p style={styles.footerLink}>
              Already have an account? <Link to="/login" style={styles.createLink}>Sign In</Link>
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
  guaranteeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  },
  guaranteeItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.85rem',
  },
  checkIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    color: '#00d4aa',
    fontSize: '0.82rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  },
  guaranteeTitle: {
    fontSize: '0.92rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 0.15rem 0',
  },
  guaranteeDesc: {
    fontSize: '0.78rem',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: 0,
    lineHeight: 1.4,
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
    margin: '0 0 1.25rem 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  twoColInputs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.85rem',
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
  select: {
    width: '100%',
    padding: '0.85rem 1.1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    cursor: 'pointer',
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
  caregiverRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    cursor: 'pointer',
    padding: '0.35rem 0',
  },
  checkbox: {
    accentColor: '#00d4aa',
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  caregiverLabel: {
    fontSize: '0.78rem',
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
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
    marginTop: '0.4rem',
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
  footerLink: {
    marginTop: '1.25rem',
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

export default Register;
