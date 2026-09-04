import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { triggerGoogleSignIn, GoogleIcon } from '../utils/googleAuth';
import './Register.css';

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
  const [googleRole, setGoogleRole] = useState('patient');
  const [alreadyRegisteredEmail, setAlreadyRegisteredEmail] = useState('');
  const { register, login, googleLogin } = useAuth();
  const { isDark, toggleTheme, theme } = useTheme();
  const navigate = useNavigate();

  const handleGoogleSignUp = () => {
    setLoading(true);
    setError('');
    setAlreadyRegisteredEmail('');
    triggerGoogleSignIn({
      role: googleRole,
      onSuccess: async (googleData) => {
        try {
          const res = await googleLogin({
            ...googleData,
            mode: 'register',
            password: password ? password.trim() : undefined
          });

          // Save credentials upon registration for seamless next login
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('rememberedEmail', googleData.email);
          if (password && password.trim()) {
            localStorage.setItem('rememberedPassword', password.trim());
            sessionStorage.setItem('candidate_remember_password', password.trim());
          }
          localStorage.setItem('remember_device_choice', 'remembered');
          sessionStorage.setItem('candidate_remember_email', googleData.email);

          const userObj = res.data?.user;
          const isClinician = userObj?.role === 'clinician' || userObj?.is_caregiver;
          if (isClinician) {
            navigate('/patients');
          } else if (userObj && userObj.consent_granted === false) {
            navigate('/consent');
          } else {
            navigate('/dashboard');
          }
        } catch (err) {
          let errMsg = 'Google sign-up failed.';
          if (err.code === 'ERR_NETWORK' || !err.response) {
            errMsg = 'Cannot connect to backend server. Please ensure the Python backend is running on port 8000.';
          } else if (err.response?.data?.detail) {
            const detail = err.response.data.detail;
            if (typeof detail === 'string') {
              errMsg = detail;
            } else if (Array.isArray(detail)) {
              errMsg = detail.map(d => d.msg || d.detail).join(', ');
            }
          }
          setError(errMsg);
          if (errMsg.toLowerCase().includes('already registered')) {
            setAlreadyRegisteredEmail(googleData.email);
          }
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
    setAlreadyRegisteredEmail('');
    
    const parsedAge = parseInt(age, 10);
    if (!parsedAge || isNaN(parsedAge)) {
      setError('Please enter a valid age (e.g. 65).');
      setLoading(false);
      return;
    }

    const assignedRole = isCaregiver ? 'clinician' : 'patient';

    try {
      await register(name, email, password, parsedAge, gender, isCaregiver, assignedRole);
      
      // Save credentials upon registration for seamless next login
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberedEmail', email.trim().toLowerCase());
      localStorage.setItem('rememberedPassword', password);
      localStorage.setItem('remember_device_choice', 'remembered');
      sessionStorage.setItem('candidate_remember_email', email.trim().toLowerCase());
      sessionStorage.setItem('candidate_remember_password', password);

      try {
        const loginRes = await login(email, password);
        const loggedUser = loginRes.data?.user;
        const isClin = loggedUser?.role === 'clinician' || isCaregiver;
        if (isClin) {
          navigate('/patients');
        } else {
          navigate('/consent');
        }
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
      if (errMsg.toLowerCase().includes('already registered')) {
        setAlreadyRegisteredEmail(email.trim().toLowerCase());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cv-reg-root" style={{ ...styles.pageWrapper, backgroundColor: theme.bg, color: theme.text }}>
      {/* Top Navigation */}
      <header className="cv-reg-header" style={{ ...styles.header, backgroundColor: theme.topHeaderBg, borderBottom: `1px solid ${theme.border}` }}>
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
          <span className="cv-reg-brand-pipe" style={{ ...styles.brandPipe, color: theme.border }}>/</span>
          <span className="cv-reg-brand-sub" style={{ ...styles.brandSub, color: theme.subtext }}>Patient onboarding & enrollment</span>
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
      <div className="cv-reg-container" style={styles.centerContainer}>
        <div className="cv-reg-card" style={{ ...styles.authCard, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }}>
          
          <div style={styles.cardHeader}>
            <span style={{ ...styles.kicker, color: isDark ? '#94a3b8' : '#0284C7' }}>Baseline profile registration</span>
            <h1 className="cv-reg-title" style={{ ...styles.cardTitle, color: theme.text }}>Create Patient Profile</h1>
            <p style={{ ...styles.cardSub, color: theme.subtext }}>
              Establish a baseline profile for longitudinal cognitive telemetry and multimodal screening.
            </p>
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

            <div className="cv-reg-row" style={styles.rowGroup}>
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
                onChange={(e) => {
                  setIsCaregiver(e.target.checked);
                  setGoogleRole(e.target.checked ? 'clinician' : 'patient');
                }}
                style={{ width: '16px', height: '16px', accentColor: '#0284C7', cursor: 'pointer' }}
              />
              <label htmlFor="isCaregiver" style={{ fontSize: '13px', color: theme.subtext, cursor: 'pointer' }}>
                I am a clinical supervisor / healthcare caregiver enrolling a patient
              </label>
            </div>

            {alreadyRegisteredEmail ? (
              <div style={{
                margin: '10px 0 14px 0',
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
                border: `1.5px solid ${isDark ? '#7f1d1d' : '#fecaca'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                animation: 'fadeIn 0.25s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <div style={{ fontWeight: '800', fontSize: '0.88rem', color: isDark ? '#fca5a5' : '#991b1b' }}>
                    Account Already Exists (One Registration Per Gmail)
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', color: isDark ? '#fecaca' : '#7f1d1d', lineHeight: '1.45' }}>
                  The account <strong>{alreadyRegisteredEmail}</strong> is already registered. Each account can only be enrolled once. Please log in to access your dashboard.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('rememberedEmail', alreadyRegisteredEmail);
                    navigate('/login');
                  }}
                  style={{
                    marginTop: '4px',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#10b981',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <span>Proceed to Login with this Account →</span>
                </button>
              </div>
            ) : (
              error && (
                <div style={styles.errorBox}>
                  <span>{error}</span>
                </div>
              )
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

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.5rem 0 1.1rem 0',
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
              OR ENROLL FAST WITH GOOGLE
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: theme.border }} />
          </div>

          {/* Role Selector for Google Sign-In */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px'
            }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: '700',
                color: isDark ? '#8ca086' : '#627a5d',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                Enroll Google Account as:
              </span>
              <span style={{
                fontSize: '0.7rem',
                color: googleRole === 'patient' ? '#10b981' : '#0ea5e9',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '700'
              }}>
                {googleRole === 'patient' ? '● PATIENT PROFILE' : '● CLINICIAN / DOCTOR'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setGoogleRole('patient');
                  setIsCaregiver(false);
                }}
                style={{
                  padding: '9px 10px',
                  borderRadius: '10px',
                  border: googleRole === 'patient'
                    ? '1.5px solid #10b981'
                    : `1px solid ${isDark ? '#253524' : '#d5e0d3'}`,
                  backgroundColor: googleRole === 'patient'
                    ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#eaf6ec')
                    : (isDark ? '#141c14' : '#f7faf5'),
                  color: googleRole === 'patient' ? (isDark ? '#34d399' : '#059669') : (isDark ? '#9db099' : '#576c52'),
                  fontSize: '0.86rem',
                  fontWeight: '600',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  letterSpacing: '0.015em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  transition: 'all 0.15s ease'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: googleRole === 'patient' ? 1 : 0.75, flexShrink: 0 }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Patient</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setGoogleRole('clinician');
                  setIsCaregiver(true);
                }}
                style={{
                  padding: '0.65rem 0.9rem',
                  borderRadius: '10px',
                  border: googleRole === 'clinician'
                    ? '1.5px solid #0ea5e9'
                    : `1px solid ${isDark ? '#253524' : '#d5e0d3'}`,
                  backgroundColor: googleRole === 'clinician'
                    ? (isDark ? 'rgba(14, 165, 233, 0.15)' : '#eaf4fa')
                    : (isDark ? '#141c14' : '#f7faf5'),
                  color: googleRole === 'clinician' ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#9db099' : '#576c52'),
                  fontSize: '0.86rem',
                  fontWeight: '600',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  letterSpacing: '0.015em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  transition: 'all 0.15s ease'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: googleRole === 'clinician' ? 1 : 0.75, flexShrink: 0 }}>
                  <path d="M4.5 3v5a6 6 0 0 0 12 0V3" />
                  <line x1="3" y1="3" x2="6" y2="3" />
                  <line x1="15" y1="13" x2="18" y2="13" />
                  <path d="M10.5 14v4a4 4 0 0 0 8 0v-2" />
                  <circle cx="18.5" cy="16" r="2" />
                </svg>
                <span>Clinician / Doctor</span>
              </button>
            </div>
          </div>

          {/* 1-Click Fast Enrollment with Google (AT THE BOTTOM) */}
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
              transition: 'all 0.15s ease',
              marginBottom: '1rem'
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

          {alreadyRegisteredEmail && (
            <div style={{
              margin: '0 0 16px 0',
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
              border: `1.5px solid ${isDark ? '#7f1d1d' : '#fecaca'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              animation: 'fadeIn 0.25s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: isDark ? '#fca5a5' : '#991b1b' }}>
                  Google Account Already Enrolled
                </div>
              </div>
              <div style={{ fontSize: '0.82rem', color: isDark ? '#fecaca' : '#7f1d1d', lineHeight: '1.45' }}>
                The Google account <strong>{alreadyRegisteredEmail}</strong> is already registered. Each account can only be enrolled once. You can now log in directly.
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('rememberedEmail', alreadyRegisteredEmail);
                  navigate('/login');
                }}
                style={{
                  marginTop: '4px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                }}
              >
                <span>Proceed to Login with this Account →</span>
              </button>
            </div>
          )}

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
    padding: '3rem 1.5rem',
  },
  authCard: {
    width: '100%',
    maxWidth: '580px',
    borderRadius: '20px',
    padding: '2.75rem 2.5rem',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.06)',
  },
  cardHeader: {
    marginBottom: '2rem',
  },
  kicker: {
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', monospace",
    display: 'block',
    marginBottom: '6px',
    fontWeight: '700',
  },
  cardTitle: {
    fontFamily: "'Newsreader', Georgia, serif",
    fontSize: '2.4rem',
    fontWeight: '400',
    letterSpacing: '-0.02em',
    margin: '0 0 10px 0',
  },
  cardSub: {
    fontSize: '15px',
    lineHeight: '1.65',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.35rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  rowGroup: {
    display: 'flex',
    gap: '1.25rem',
  },
  label: {
    fontSize: '14.5px',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    padding: '0.95rem 1.15rem',
    border: '1px solid',
    borderRadius: '10px',
    fontSize: '15.5px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '0.95rem 1.15rem',
    border: '1px solid',
    borderRadius: '10px',
    fontSize: '15.5px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  textBtn: {
    background: 'none',
    border: 'none',
    fontSize: '13.5px',
    cursor: 'pointer',
    padding: 0,
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.35rem 0',
  },
  errorBox: {
    backgroundColor: 'rgba(184, 92, 74, 0.15)',
    border: '1px solid #B85C4A',
    borderRadius: '8px',
    padding: '0.9rem 1.15rem',
    fontSize: '14px',
    color: '#B85C4A',
  },
  footerNote: {
    marginTop: '2rem',
    textAlign: 'center',
    fontSize: '14.5px',
  },
};

export default Register;
