import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { triggerGoogleSignIn, GoogleIcon } from '../utils/googleAuth';

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
  const { register, login, googleLogin } = useAuth();
  const { isDark, toggleTheme, theme } = useTheme();
  const navigate = useNavigate();

  const handleGoogleSignUp = () => {
    setLoading(true);
    setError('');
    triggerGoogleSignIn({
      role: isCaregiver ? 'clinician' : 'patient',
      onSuccess: async (googleData) => {
        try {
          const res = await googleLogin(googleData);
          const userObj = res.data?.user;
          if (userObj && userObj.consent_granted === false) {
            navigate('/consent');
          } else {
            navigate('/dashboard');
          }
        } catch (err) {
          const detail = err.response?.data?.detail;
          setError(typeof detail === 'string' ? detail : 'Google sign-up failed.');
        } finally {
          setLoading(false);
        }
      },
      onError: (errMsg) => {
        setError(errMsg);
        setLoading(false);
      }
    });
  };

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
    <div style={{ ...styles.pageWrapper, backgroundColor: theme.bg, color: theme.text }}>
      {/* Top Navigation */}
      <header style={{ ...styles.header, backgroundColor: theme.topHeaderBg, borderBottom: `1px solid ${theme.border}` }}>
        <div 
          style={{ ...styles.brandBox, cursor: 'pointer' }} 
          onClick={() => navigate('/')}
          title="← Return to Landing Page"
        >
          <div style={{
            width: '28px',
            height: '28px',
            backgroundColor: isDark ? '#e3ece0' : '#273822',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontSize: '0.92rem',
            color: isDark ? '#0b100c' : '#ffffff',
            marginRight: '6px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.12)'
          }}>
            C
          </div>
          <span style={{ ...styles.brandTitle, color: theme.text }}>CogniVeil</span>
          <span style={{ ...styles.brandPipe, color: theme.border }}>/</span>
          <span style={{ ...styles.brandSub, color: theme.subtext }}>Patient onboarding & enrollment</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/')}
            title="Return to Landing Page"
            style={{
              background: 'none',
              border: `1px solid ${theme.border}`,
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: '700',
              cursor: 'pointer',
              color: theme.text,
              backgroundColor: theme.cardBg,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>←</span>
            <span>Back to Home</span>
          </button>
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
            onClick={() => navigate('/login')}
          >
            Sign in to existing record
          </button>
        </div>
      </header>

      {/* Main Registration Card */}
      <div style={styles.centerContainer}>
        <div style={{ ...styles.authCard, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
          
          <div style={styles.cardHeader}>
            <span style={{ ...styles.kicker, color: isDark ? '#94a3b8' : '#0284C7' }}>Baseline profile registration</span>
            <h1 style={{ ...styles.cardTitle, color: theme.text }}>Create Patient Profile</h1>
            <p style={{ ...styles.cardSub, color: theme.subtext }}>
              Establish a baseline profile for longitudinal cognitive telemetry and multimodal screening.
            </p>
          </div>

          {/* 1-Click Fast Enrollment with Google */}
          <div style={{ marginBottom: '1.4rem' }}>
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.9rem 1.25rem',
                borderRadius: '10px',
                backgroundColor: isDark ? '#19241b' : '#ffffff',
                border: `1.5px solid ${isDark ? '#364b34' : '#c7d5c4'}`,
                color: isDark ? '#f4f8f1' : '#141e13',
                fontSize: '0.94rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = isDark ? '#4ade80' : '#2e7d32';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDark ? '#364b34' : '#c7d5c4';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <GoogleIcon size={20} />
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1.25rem 0 0.4rem 0',
              gap: '14px'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: theme.border }} />
              <span style={{
                fontSize: '0.72rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '700',
                color: theme.subtext,
                letterSpacing: '0.04em'
              }}>
                OR ENROLL WITH EMAIL
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: theme.border }} />
            </div>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={{ ...styles.label, color: theme.text }}>Full legal name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ 
                  ...styles.input, 
                  backgroundColor: theme.inputBg, 
                  borderColor: theme.inputBorder,
                  color: theme.text
                }}
                placeholder="Rajan Pillai"
                required
              />
            </div>

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
                placeholder="rajan@example.com"
                required
              />
            </div>

            <div style={styles.rowGroup}>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={{ ...styles.label, color: theme.text }}>Age (years)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  style={{ 
                    ...styles.input, 
                    backgroundColor: theme.inputBg, 
                    borderColor: theme.inputBorder,
                    color: theme.text
                  }}
                  placeholder="68"
                  required
                />
              </div>

              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={{ ...styles.label, color: theme.text }}>Biological sex</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{ 
                    ...styles.select, 
                    backgroundColor: theme.inputBg, 
                    borderColor: theme.inputBorder,
                    color: theme.text
                  }}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ ...styles.label, color: theme.text }}>Secure password</label>
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

            <div style={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="isCaregiver"
                checked={isCaregiver}
                onChange={(e) => setIsCaregiver(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#0284C7', cursor: 'pointer' }}
              />
              <label htmlFor="isCaregiver" style={{ fontSize: '13px', color: theme.subtext, cursor: 'pointer' }}>
                I am a clinical supervisor / healthcare caregiver enrolling a patient
              </label>
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
              {loading ? 'Enrolling profile...' : 'Complete profile enrollment'}
            </button>
          </form>

          <div style={{ ...styles.footerNote, color: theme.subtext, textAlign: 'center' }}>
            <div>
              <span>Already have an active profile? </span>
              <Link to="/login" style={{ color: isDark ? '#22d3ee' : '#0284C7', fontWeight: '600' }}>Sign in to workspace</Link>
            </div>
            <div style={{ marginTop: '10px' }}>
              <Link 
                to="/" 
                style={{ 
                  color: theme.subtext, 
                  fontSize: '0.82rem', 
                  fontFamily: "'JetBrains Mono', monospace", 
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>←</span>
                <span>Return to Public Landing Page</span>
              </Link>
            </div>
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
    maxWidth: '540px',
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
  rowGroup: {
    display: 'flex',
    gap: '1rem',
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
  select: {
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
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    padding: '0.25rem 0',
  },
  errorBox: {
    backgroundColor: 'rgba(184, 92, 74, 0.15)',
    border: '1px solid #B85C4A',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '13px',
    color: '#B85C4A',
  },
  footerNote: {
    marginTop: '1.75rem',
    textAlign: 'center',
    fontSize: '13px',
  },
};

export default Register;
