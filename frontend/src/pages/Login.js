import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { pingBackend } from '../utils/api';
import { triggerGoogleSignIn, GoogleIcon } from '../utils/googleAuth';

const Login = () => {
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('rememberMe') === 'true';
  });
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('rememberedEmail') || '';
  });
  const [password, setPassword] = useState(() => {
    return localStorage.getItem('rememberedPassword') || '';
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [googleRole, setGoogleRole] = useState('patient');
  const [notRegisteredGoogleEmail, setNotRegisteredGoogleEmail] = useState('');
  const { login, loginDemo, googleLogin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    pingBackend().catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setNotRegisteredGoogleEmail('');
    try {
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedEmail', email.trim().toLowerCase());
        localStorage.setItem('rememberedPassword', password);
        localStorage.setItem('remember_device_choice', 'remembered');
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
        // Prompt user right after entering inside if they want to remember on this workstation
        sessionStorage.setItem('just_logged_in_prompt', 'true');
        sessionStorage.setItem('candidate_remember_email', email.trim().toLowerCase());
        sessionStorage.setItem('candidate_remember_password', password);
      }
      const res = await login(email.trim().toLowerCase(), password);
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

  const handleGoogleSignIn = () => {
    setLoading(true);
    setError('');
    setNotRegisteredGoogleEmail('');
    triggerGoogleSignIn({
      role: googleRole,
      onSuccess: async (googleData) => {
        try {
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('rememberedEmail', googleData.email);
            localStorage.setItem('remember_device_choice', 'remembered');
          } else {
            sessionStorage.setItem('just_logged_in_prompt', 'true');
            sessionStorage.setItem('candidate_remember_email', googleData.email);
          }
          const res = await googleLogin({
            ...googleData,
            mode: 'login'
          });
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
          const detail = err.response?.data?.detail;
          const errMsg = typeof detail === 'string' ? detail : 'Google sign-in failed.';
          setError(errMsg);
          if (err.response?.status === 404 || errMsg.toLowerCase().includes('no cogniveil account') || errMsg.toLowerCase().includes('enroll on the register page')) {
            setNotRegisteredGoogleEmail(googleData.email);
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

  const handleDemoLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('demo1234');
    setLoading(true);
    setError('');
    try {
      let res;
      if (typeof loginDemo === 'function') {
        res = await loginDemo(demoEmail);
      } else {
        res = await login(demoEmail, 'demo1234');
      }
      const userObj = res.data?.user;
      const isClinician = userObj?.role === 'clinician' || userObj?.is_caregiver || demoEmail === 'riyamehta55@gmail.com';
      if (isClinician) {
        navigate('/patients');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      try {
        const res2 = await login(demoEmail, 'demo1234');
        const userObj2 = res2.data?.user;
        const isClinician2 = userObj2?.role === 'clinician' || userObj2?.is_caregiver || demoEmail === 'riyamehta55@gmail.com';
        if (isClinician2) {
          navigate('/patients');
        } else {
          navigate('/dashboard');
        }
      } catch (err2) {
        if (err2.code === 'ERR_NETWORK' || !err2.response) {
          setError('Cannot connect to backend server. Please ensure the Python backend is running on port 8000.');
        } else if (err2.response?.data?.detail) {
          const detail = err2.response.data.detail;
          setError(typeof detail === 'string' ? detail : 'Failed to login with demo account.');
        } else {
          setError('Failed to login with demo account. Ensure the backend is running.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { 
      id: 'riya',
      name: 'Dr. Riya Mehta', 
      role: 'Clinical Supervisor', 
      email: 'riyamehta55@gmail.com', 
      code: 'SUPERVISOR'
    },
    { 
      id: 'rajan',
      name: 'Rajan Pillai', 
      role: 'Tier 3 Volumetric', 
      email: 'rajan@demo.com', 
      code: 'TIER 3'
    },
    { 
      id: 'meena',
      name: 'Meena Krishnan', 
      role: 'Tier 2 Biomarker', 
      email: 'meena@demo.com', 
      code: 'TIER 2'
    },
    { 
      id: 'arjun',
      name: 'Arjun Sharma', 
      role: 'Tier 1 Baseline', 
      email: 'arjun@demo.com', 
      code: 'TIER 1'
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      backgroundColor: isDark ? '#0b100c' : '#f2f6f1',
      color: isDark ? '#f1f5ee' : '#141e13',
      fontFamily: "'Mulish', 'Inter', -apple-system, sans-serif",
      overflowX: 'hidden'
    }}>
      
      {/* ── LEFT EDITORIAL BRAND HERO (52% WIDTH) ── */}
      <div style={{
        flex: '1.15',
        minHeight: '100vh',
        padding: '4rem 4.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        background: isDark
          ? 'radial-gradient(ellipse at 12% 18%, rgba(68, 88, 56, 0.32) 0%, transparent 60%), radial-gradient(ellipse at 88% 82%, rgba(42, 56, 36, 0.25) 0%, transparent 65%), #0b100c'
          : 'radial-gradient(ellipse at 12% 18%, rgba(138, 168, 130, 0.22) 0%, transparent 60%), radial-gradient(ellipse at 88% 82%, rgba(162, 186, 154, 0.16) 0%, transparent 65%), #eaf1e8',
        borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#dce6d8'}`,
        boxSizing: 'border-box'
      }}>
        
        {/* Architectural 3D Minimal Cubes (Olive & Pastel Sage Tones) */}
        <div style={{
          position: 'absolute',
          right: '5%',
          bottom: '12%',
          pointerEvents: 'none',
          opacity: isDark ? 0.22 : 0.09,
          zIndex: 0
        }}>
          <svg width="340" height="340" viewBox="0 0 340 340" fill="none">
            <rect x="90" y="40" width="120" height="120" transform="rotate(45 90 40)" fill={isDark ? '#3d5236' : '#2b3b27'} fillOpacity="0.85"/>
            <rect x="190" y="160" width="90" height="90" transform="rotate(45 190 160)" fill={isDark ? '#2a3826' : '#3f533a'} fillOpacity="0.6"/>
            <rect x="40" y="210" width="70" height="70" transform="rotate(45 40 210)" fill={isDark ? '#536d4b' : '#577051'} fillOpacity="0.45"/>
          </svg>
        </div>

        {/* Brand Header (Clickable Return to Landing Page) */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div 
            onClick={() => navigate('/')}
            title="← Return to Landing Page"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/'); }}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '6px 10px',
              marginLeft: '-10px',
              borderRadius: '8px',
              transition: 'background-color 0.15s ease, transform 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: isDark ? '#e3ece0' : '#273822',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '1rem',
              color: isDark ? '#0b100c' : '#ffffff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}>
              C
            </div>
            <div>
              <span style={{ 
                fontSize: '1.25rem', 
                fontWeight: '900', 
                letterSpacing: '-0.02em', 
                color: isDark ? '#f1f5ee' : '#141e13' 
              }}>
                CogniVeil
              </span>
              <span style={{
                marginLeft: '8px',
                fontSize: '0.68rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '700',
                color: isDark ? '#7a8e74' : '#546b4f',
                letterSpacing: '0.08em'
              }}>
                CLINICAL INTELLIGENCE
              </span>
            </div>
          </div>

          {/* Hero Typography with Pastel Green & Editorial Newsreader Italic */}
          <div style={{ marginTop: '4rem', maxWidth: '620px' }}>
            <p style={{
              fontSize: '0.72rem',
              fontWeight: '800',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontFamily: "'JetBrains Mono', monospace",
              color: isDark ? '#98ab92' : '#4e6648',
              margin: '0 0 1.25rem 0'
            }}>
              FROM STRATEGY TO CLINICAL EXECUTION
            </p>

            <h1 style={{
              fontSize: '3.1rem',
              fontWeight: '800',
              lineHeight: '1.14',
              letterSpacing: '-0.035em',
              margin: '0 0 1.5rem 0',
              color: isDark ? '#f1f5ee' : '#141e13'
            }}>
              Surveillance. Telemetry. Governance. The{' '}
              <span style={{
                fontFamily: "'Newsreader', 'Georgia', serif",
                fontStyle: 'italic',
                fontWeight: '400',
                letterSpacing: '0.01em',
                color: isDark ? '#cdd8c5' : '#273822'
              }}>
                Future of Cognitive Care,
              </span>{' '}
              Delivered.
            </h1>

            <p style={{
              fontSize: '1rem',
              lineHeight: '1.65',
              fontWeight: '500',
              color: isDark ? '#9ab095' : '#3f533a',
              margin: '0 0 2.5rem 0',
              maxWidth: '540px'
            }}>
              Born agentic-first, CogniVeil continuously monitors longitudinal neuromotor, acoustic, and psychometric signals to detect sub-clinical drift <strong>6–8 months</strong> before symptoms trigger a hospital visit.
            </p>

            {/* Editorial Executive Metric Rows */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.5rem',
              paddingTop: '2rem',
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#dce6d8'}`
            }}>
              <div>
                <div style={{
                  fontSize: '1.85rem',
                  fontWeight: '900',
                  letterSpacing: '-0.03em',
                  color: isDark ? '#f1f5ee' : '#141d13',
                  fontFamily: "'Mulish', sans-serif"
                }}>
                  6–8 Mos
                </div>
                <div style={{ fontSize: '0.74rem', fontWeight: '700', color: isDark ? '#cdd8c5' : '#2d3e28', marginTop: '2px' }}>
                  Clinical Lead Time
                </div>
                <div style={{ fontSize: '0.7rem', color: isDark ? '#7a8e74' : '#5b7156', marginTop: '2px' }}>
                  Early window gained
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '1.85rem',
                  fontWeight: '900',
                  letterSpacing: '-0.03em',
                  color: isDark ? '#f1f5ee' : '#141d13',
                  fontFamily: "'Mulish', sans-serif"
                }}>
                  10 Agents
                </div>
                <div style={{ fontSize: '0.74rem', fontWeight: '700', color: isDark ? '#cdd8c5' : '#2d3e28', marginTop: '2px' }}>
                  Autonomous Pipeline
                </div>
                <div style={{ fontSize: '0.7rem', color: isDark ? '#7a8e74' : '#5b7156', marginTop: '2px' }}>
                  EWMA change-point
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '1.85rem',
                  fontWeight: '900',
                  letterSpacing: '-0.03em',
                  color: isDark ? '#f1f5ee' : '#141d13',
                  fontFamily: "'Mulish', sans-serif"
                }}>
                  Tri-Tier
                </div>
                <div style={{ fontSize: '0.74rem', fontWeight: '700', color: isDark ? '#cdd8c5' : '#2d3e28', marginTop: '2px' }}>
                  Diagnostic Cascade
                </div>
                <div style={{ fontSize: '0.7rem', color: isDark ? '#7a8e74' : '#5b7156', marginTop: '2px' }}>
                  Passive, ML & MRI
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Specification */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '1.5rem',
          borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#dce6d8'}`,
          fontSize: '0.75rem',
          fontFamily: "'JetBrains Mono', monospace",
          color: isDark ? '#7a8e74' : '#5b7156'
        }}>
          <div>COGNIVEIL CLINICAL INTELLIGENCE · ISO/DIS 13485 COMPLIANT</div>
          <div>EST. 2026</div>
        </div>

      </div>

      {/* ── RIGHT AUTHENTICATION STATION (48% WIDTH) — CLAUDE.AI STYLE ── */}
      <div style={{
        flex: '0.95',
        minHeight: '100vh',
        padding: '3.5rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box',
        backgroundColor: isDark ? '#080d09' : '#f5f8f3'
      }}>
        
        <div style={{ maxWidth: '520px', width: '100%' }}>
          
          {/* Top Bar with Back to Landing & Theme Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <button
              onClick={() => navigate('/')}
              title="Return to Home Landing Page"
              style={{
                background: 'none',
                border: `1px solid ${isDark ? '#233222' : '#d2ded0'}`,
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '700',
                cursor: 'pointer',
                color: isDark ? '#cdd8c5' : '#3f533a',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = isDark ? '#34d399' : '#273822';
                e.currentTarget.style.color = isDark ? '#34d399' : '#273822';
                e.currentTarget.style.transform = 'translateX(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDark ? '#233222' : '#d2ded0';
                e.currentTarget.style.color = isDark ? '#cdd8c5' : '#3f533a';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <span style={{ fontSize: '1rem', lineHeight: '1' }}>←</span>
              <span>Back to Home</span>
            </button>

            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: `1px solid ${isDark ? '#233222' : '#d2ded0'}`,
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '700',
                cursor: 'pointer',
                color: isDark ? '#cdd8c5' : '#3f533a',
                transition: 'all 0.15s ease'
              }}
            >
              {isDark ? 'LIGHT MODE' : 'DARK MODE'}
            </button>
          </div>

          {/* Claude-Style Editorial Title & Subtitle */}
          <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
            <h2 style={{
              fontFamily: "'Newsreader', 'Georgia', serif",
              fontSize: '2.8rem',
              fontWeight: '400',
              letterSpacing: '-0.025em',
              margin: '0 0 0.6rem 0',
              color: isDark ? '#f1f5ee' : '#141e13'
            }}>
              Sign in to workstation
            </h2>
            <p style={{
              fontSize: '1.02rem',
              color: isDark ? '#98ab92' : '#576c52',
              margin: 0,
              fontWeight: '400',
              lineHeight: '1.5'
            }}>
              Your clinical intelligence partner for early detection
            </p>
          </div>

          {/* Claude-Style Rounded Auth Container */}
          <div style={{
            borderRadius: '26px',
            backgroundColor: isDark ? '#121813' : '#ffffff',
            border: `1px solid ${isDark ? '#222f22' : '#d8e4d6'}`,
            padding: '34px 30px',
            boxShadow: isDark ? '0 16px 44px rgba(0,0,0,0.4)' : '0 10px 36px rgba(0,0,0,0.05)'
          }}>

            {/* 1. Email & Password Input Fields at TOP */}
            <form onSubmit={handleSubmit} method="post" action="#" autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="email"
                name="email"
                id="login-email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{
                  width: '100%',
                  padding: '0.9rem 1.15rem',
                  borderRadius: '12px',
                  backgroundColor: isDark ? '#182119' : '#f8faf6',
                  border: `1px solid ${isDark ? '#293928' : '#ccd9ca'}`,
                  color: isDark ? '#f1f5ee' : '#141e13',
                  fontSize: '0.94rem',
                  fontFamily: "'Mulish', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s'
                }}
              />

              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  id="login-password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.15rem',
                    paddingRight: '3.8rem',
                    borderRadius: '12px',
                    backgroundColor: isDark ? '#182119' : '#f8faf6',
                    border: `1px solid ${isDark ? '#293928' : '#ccd9ca'}`,
                    color: isDark ? '#f1f5ee' : '#141e13',
                    fontSize: '0.94rem',
                    fontFamily: "'Mulish', sans-serif",
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: isDark ? '#98ab92' : '#4e6648',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showPass ? 'HIDE' : 'SHOW'}
                </button>
              </div>

              {/* Remember Me Checkbox */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '2px 0'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontSize: '0.82rem',
                  color: isDark ? '#a8bda3' : '#4d6547',
                  fontWeight: '600'
                }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                  <span>Remember me on this workstation</span>
                </label>
              </div>

              {error && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: isDark ? 'rgba(140, 50, 40, 0.2)' : '#FDF2F0',
                  border: '1px solid #A84236',
                  color: isDark ? '#fca5a5' : '#A84236',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  fontFamily: "'Mulish', sans-serif"
                }}>
                  {error}
                </div>
              )}

              {/* Continue with Email Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.95rem',
                  borderRadius: '12px',
                  backgroundColor: isDark ? '#ffffff' : '#223320',
                  color: isDark ? '#121813' : '#ffffff',
                  border: 'none',
                  fontSize: '0.92rem',
                  fontWeight: '800',
                  fontFamily: "'Mulish', sans-serif",
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                  marginTop: '4px'
                }}
              >
                {loading ? 'Signing in...' : 'Continue with email'}
              </button>
            </form>

            {/* 2. OR Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1.4rem 0 1.1rem 0',
              gap: '14px'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: isDark ? '#233022' : '#dce5da' }} />
              <span style={{
                fontSize: '0.72rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '700',
                color: isDark ? '#6f8269' : '#889e83',
                letterSpacing: '0.04em'
              }}>
                OR SIGN IN WITH GOOGLE
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: isDark ? '#233022' : '#dce5da' }} />
            </div>

            {/* 3. Role Selector for Google Sign-In */}
            <div style={{ marginBottom: '10px' }}>
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
                  Sign in / Enroll as:
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  color: googleRole === 'patient' ? '#10b981' : '#0ea5e9',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: '700'
                }}>
                  {googleRole === 'patient' ? '● PATIENT MODE' : '● CLINICIAN MODE'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setGoogleRole('patient')}
                  style={{
                    padding: '0.65rem 0.9rem',
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
                  onClick={() => setGoogleRole('clinician')}
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

            {/* 4. Continue with Google Button (AT THE BOTTOM) */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.92rem 1.25rem',
                borderRadius: '12px',
                backgroundColor: isDark ? '#19241b' : '#ffffff',
                border: `1.5px solid ${isDark ? '#364b34' : '#c7d5c4'}`,
                color: isDark ? '#f4f8f1' : '#141e13',
                fontSize: '0.95rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease',
                marginBottom: '14px'
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

            {notRegisteredGoogleEmail && (
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
                    No CogniVeil Profile Found
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', color: isDark ? '#fecaca' : '#7f1d1d', lineHeight: '1.45' }}>
                  No account exists for <strong>{notRegisteredGoogleEmail}</strong> yet. You must complete enrollment once before logging in.
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  style={{
                    marginTop: '4px',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#0284C7',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  <span>Go to Register / Enroll Profile →</span>
                </button>
              </div>
            )}

            {/* 5. Fast Presets (Subtle shortcuts at the very bottom) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleDemoLogin('riyamehta55@gmail.com', 'demo1234')}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: isDark ? '#141c15' : '#f0f5ee',
                  border: `1px solid ${isDark ? '#263624' : '#cdd8cb'}`,
                  color: isDark ? '#dce6d8' : '#2b3b27',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.15s'
                }}
              >
                <span>Demo Supervisor: Dr. Riya Mehta</span>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  color: isDark ? '#cdd8c5' : '#475a42',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.04em'
                }}>
                  SUPERVISOR
                </span>
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {demoAccounts.filter(d => d.id !== 'riya').map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleDemoLogin(d.email, 'demo1234')}
                    style={{
                      padding: '7px 4px',
                      borderRadius: '8px',
                      backgroundColor: isDark ? '#161e17' : '#f7faf5',
                      border: `1px solid ${isDark ? '#263525' : '#dbe5d8'}`,
                      color: isDark ? '#b8c7b4' : '#455641',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s'
                    }}
                  >
                    {d.name.split(' ')[0]} ({d.code})
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Claude-Style Floating Bottom Pill Button & Return Link */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
            <Link
              to="/register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                backgroundColor: isDark ? '#141c14' : '#eaf2e8',
                border: `1px solid ${isDark ? '#263725' : '#d1dfcf'}`,
                color: isDark ? '#dbe5d8' : '#273822',
                fontSize: '0.84rem',
                fontWeight: '700',
                textDecoration: 'none',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>+</span>
              <span>Enroll new patient record</span>
            </Link>

            <Link
              to="/"
              style={{
                fontSize: '0.82rem',
                fontFamily: "'JetBrains Mono', monospace",
                color: isDark ? '#7a8e74' : '#546b4f',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = isDark ? '#34d399' : '#273822'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? '#7a8e74' : '#546b4f'; }}
            >
              <span>←</span>
              <span>Return to Public Landing Page</span>
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;