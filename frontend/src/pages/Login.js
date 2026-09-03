import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { pingBackend } from '../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [activeDemo, setActiveDemo] = useState(null);
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    pingBackend().catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
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

  const handleDemoLogin = async (demoEmail, demoPass = 'demo1234', demoId = '') => {
    setActiveDemo(demoId);
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

  // Cohesive clinical olive/slate hierarchy (no red, yellow, or bright green)
  const demoAccounts = [
    { 
      id: 'riya',
      name: 'Dr. Riya Mehta', 
      role: 'Clinical Supervisor & Caregiver Lead', 
      email: 'riyamehta55@gmail.com', 
      code: 'CLINICAL SUPERVISOR',
      badgeBorder: isDark ? '#475d41' : '#b8ccb5',
      badgeColor: isDark ? '#dbe5d8' : '#273822',
      badgeBg: isDark ? 'rgba(71, 93, 65, 0.25)' : '#e2ede0'
    },
    { 
      id: 'rajan',
      name: 'Rajan Pillai', 
      role: 'Tier 3 MCI · Statistical Drift Trajectory', 
      email: 'rajan@demo.com', 
      code: 'TIER 3 · VOLUMETRIC',
      badgeBorder: isDark ? '#31412e' : '#c5d7c2',
      badgeColor: isDark ? '#b8c7b4' : '#3f533a',
      badgeBg: isDark ? 'rgba(49, 65, 46, 0.2)' : '#e8f2e6'
    },
    { 
      id: 'meena',
      name: 'Meena Krishnan', 
      role: 'Tier 2 · Prodromal Fluency Drift', 
      email: 'meena@demo.com', 
      code: 'TIER 2 · BIOMARKER',
      badgeBorder: isDark ? '#31412e' : '#c5d7c2',
      badgeColor: isDark ? '#b8c7b4' : '#3f533a',
      badgeBg: isDark ? 'rgba(49, 65, 46, 0.2)' : '#e8f2e6'
    },
    { 
      id: 'arjun',
      name: 'Arjun Sharma', 
      role: 'Tier 1 Baseline · Intact Stability', 
      email: 'arjun@demo.com', 
      code: 'TIER 1 · TELEMETRY',
      badgeBorder: isDark ? '#31412e' : '#c5d7c2',
      badgeColor: isDark ? '#b8c7b4' : '#3f533a',
      badgeBg: isDark ? 'rgba(49, 65, 46, 0.2)' : '#e8f2e6'
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

        {/* Brand Header */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: isDark ? '#e3ece0' : '#273822',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '1rem',
              color: isDark ? '#0b100c' : '#ffffff'
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
                  color: isDark ? '#f1f5ee' : '#141e13',
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
                  color: isDark ? '#f1f5ee' : '#141e13',
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
                  color: isDark ? '#f1f5ee' : '#141e13',
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

      {/* ── RIGHT AUTHENTICATION STATION (48% WIDTH) ── */}
      <div style={{
        flex: '0.95',
        minHeight: '100vh',
        padding: '3.5rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxSizing: 'border-box',
        backgroundColor: isDark ? '#080d09' : '#f5f8f3'
      }}>
        
        <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
          
          {/* Top Bar with Clean Text Links */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '800',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontFamily: "'JetBrains Mono', monospace",
              color: isDark ? '#98ab92' : '#394e33'
            }}>
              [ AUTHORIZED WORKSTATION ]
            </span>
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: `1px solid ${isDark ? '#233222' : '#d2ded0'}`,
                padding: '5px 12px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '700',
                cursor: 'pointer',
                color: isDark ? '#cdd8c5' : '#3f533a'
              }}
            >
              {isDark ? 'LIGHT MODE' : 'DARK MODE'}
            </button>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '900',
              letterSpacing: '-0.03em',
              margin: '0 0 0.4rem 0',
              color: isDark ? '#f1f5ee' : '#141e13'
            }}>
              Sign in to workstation
            </h2>
            <p style={{
              fontSize: '0.88rem',
              color: isDark ? '#94a78f' : '#4e6648',
              margin: 0,
              lineHeight: '1.5'
            }}>
              Select an authorized clinical evaluation role or enter credentials.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.76rem',
                fontWeight: '800',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: '6px',
                color: isDark ? '#cdd8c5' : '#394e33'
              }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clinician@hospital.org"
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: isDark ? '#111812' : '#ffffff',
                  border: `1px solid ${isDark ? '#243324' : '#c8d6c5'}`,
                  color: isDark ? '#f1f5ee' : '#141e13',
                  fontSize: '0.9rem',
                  fontFamily: "'Mulish', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{
                  fontSize: '0.76rem',
                  fontWeight: '800',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: isDark ? '#cdd8c5' : '#394e33'
                }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isDark ? '#98ab92' : '#394e33',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPass ? '[HIDE]' : '[SHOW]'}
                </button>
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: isDark ? '#111812' : '#ffffff',
                  border: `1px solid ${isDark ? '#243324' : '#c8d6c5'}`,
                  color: isDark ? '#f1f5ee' : '#141e13',
                  fontSize: '0.9rem',
                  fontFamily: "'Mulish', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s'
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                backgroundColor: isDark ? 'rgba(120, 50, 40, 0.2)' : '#FDF2F0',
                border: '1px solid #A84236',
                color: isDark ? '#fca5a5' : '#A84236',
                fontSize: '0.8rem',
                fontWeight: '700',
                fontFamily: "'Mulish', sans-serif"
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: '6px',
                backgroundColor: isDark ? '#e3ece0' : '#273822',
                color: isDark ? '#0b100c' : '#ffffff',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: '900',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: "'Mulish', sans-serif",
                cursor: 'pointer',
                transition: 'opacity 0.15s',
                marginTop: '0.4rem'
              }}
            >
              {loading ? 'AUTHENTICATING...' : 'SIGN IN TO WORKSTATION'}
            </button>
          </form>

          {/* 1-Click Demo Evaluation Roles — Understated Olive/Slate (No Red/Yellow/Green) */}
          <div style={{ marginTop: '2.5rem', borderTop: `1px solid ${isDark ? '#1e291f' : '#dce6d8'}`, paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: '800',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
                color: isDark ? '#98ab92' : '#4e6648'
              }}>
                1-CLICK EVALUATION ROLES
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontFamily: "'JetBrains Mono', monospace",
                color: isDark ? '#6f8269' : '#738a6d'
              }}>
                pass: demo1234
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {demoAccounts.map((d) => {
                const isSelected = activeDemo === d.id || email === d.email;
                return (
                  <div
                    key={d.id}
                    onClick={() => handleDemoLogin(d.email, 'demo1234', d.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: '6px',
                      backgroundColor: isSelected 
                        ? (isDark ? 'rgba(71, 93, 65, 0.3)' : '#e2ede0') 
                        : (isDark ? '#111812' : '#ffffff'),
                      border: `1px solid ${isSelected ? (isDark ? '#536d4b' : '#394e33') : (isDark ? '#1f2c20' : '#dce6d8')}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div>
                      <div style={{
                        fontSize: '0.88rem',
                        fontWeight: '800',
                        color: isDark ? '#f1f5ee' : '#141e13'
                      }}>
                        {d.name}
                      </div>
                      <div style={{
                        fontSize: '0.74rem',
                        color: isDark ? '#94a78f' : '#4e6648',
                        marginTop: '1px'
                      }}>
                        {d.role}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.66rem',
                      fontWeight: '800',
                      letterSpacing: '0.06em',
                      fontFamily: "'JetBrains Mono', monospace",
                      backgroundColor: d.badgeBg,
                      border: `1px solid ${d.badgeBorder}`,
                      color: d.badgeColor
                    }}>
                      {d.code}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Underlined Register Link Matching Editorial Style */}
          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            fontSize: '0.78rem',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: isDark ? '#94a78f' : '#4e6648'
          }}>
            <span>ENROLL NEW PATIENT RECORD? </span>
            <Link to="/register" style={{
              color: isDark ? '#f1f5ee' : '#141e13',
              fontWeight: '800',
              textDecoration: 'underline'
            }}>
              REGISTER PATIENT
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;