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

  const demoAccounts = [
    { 
      id: 'riya',
      name: 'Dr. Riya Mehta', 
      role: 'Clinical Supervisor & Caregiver', 
      email: 'riyamehta55@gmail.com', 
      tag: 'Supervisor', 
      tagBg: 'rgba(99, 102, 241, 0.2)', 
      tagColor: '#818cf8',
      icon: '🩺'
    },
    { 
      id: 'rajan',
      name: 'Rajan Pillai', 
      role: 'Tier 3 MCI · Statistical Drift', 
      email: 'rajan@demo.com', 
      tag: 'High Risk', 
      tagBg: 'rgba(239, 68, 68, 0.2)', 
      tagColor: '#f87171',
      icon: '⚠️'
    },
    { 
      id: 'meena',
      name: 'Meena Krishnan', 
      role: 'Tier 2 · Prodromal Fluency Drift', 
      email: 'meena@demo.com', 
      tag: 'Moderate', 
      tagBg: 'rgba(245, 158, 11, 0.2)', 
      tagColor: '#fbbf24',
      icon: '🟡'
    },
    { 
      id: 'arjun',
      name: 'Arjun Sharma', 
      role: 'Tier 1 Baseline · Intact Normal', 
      email: 'arjun@demo.com', 
      tag: 'Stable', 
      tagBg: 'rgba(16, 185, 129, 0.2)', 
      tagColor: '#34d399',
      icon: '🟢'
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      backgroundColor: isDark ? '#070b14' : '#f8fafc',
      color: isDark ? '#f8fafc' : '#0f172a',
      fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden'
    }}>
      
      {/* ── LEFT HERO BRANDING & INTELLIGENCE SHOWCASE (52% WIDTH) ── */}
      <div style={{
        flex: '1.15',
        minHeight: '100vh',
        padding: '3.5rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        background: isDark
          ? 'radial-gradient(ellipse at 15% 15%, rgba(67, 56, 202, 0.35) 0%, transparent 60%), radial-gradient(ellipse at 85% 85%, rgba(6, 182, 212, 0.18) 0%, transparent 65%), linear-gradient(135deg, #070b14 0%, #0d1527 100%)'
          : 'radial-gradient(ellipse at 15% 15%, rgba(67, 56, 202, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 85% 85%, rgba(6, 182, 212, 0.1) 0%, transparent 65%), linear-gradient(135deg, #eef2ff 0%, #ffffff 100%)',
        borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
        boxSizing: 'border-box'
      }}>
        
        {/* Top Header Badge */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4338CA 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(67, 56, 202, 0.35)'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: '900', letterSpacing: '-0.02em', color: isDark ? '#ffffff' : '#0f172a' }}>
                Cogni<span style={{ color: '#06b6d4' }}>Veil</span>
              </div>
              <span style={{ 
                fontSize: '0.68rem', 
                fontWeight: '800', 
                letterSpacing: '0.08em', 
                color: isDark ? '#94a3b8' : '#64748b' 
              }}>
                CLINICAL INTELLIGENCE PLATFORM · V2.4
              </span>
            </div>
          </div>

          {/* Hero Narrative Reframe */}
          <div style={{ marginTop: '3.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#818cf8',
              fontSize: '0.74rem',
              fontWeight: '800',
              marginBottom: '1rem'
            }}>
              <span>🛡️</span>
              <span>EARLY LONGITUDINAL COGNITIVE SURVEILLANCE</span>
            </div>

            <h1 style={{
              fontSize: '2.4rem',
              fontWeight: '900',
              lineHeight: '1.2',
              letterSpacing: '-0.03em',
              margin: '0 0 1.25rem 0',
              color: isDark ? '#ffffff' : '#0f172a'
            }}>
              CogniVeil doesn't just screen.<br />
              <span style={{ 
                background: 'linear-gradient(90deg, #6366f1, #06b6d4)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent' 
              }}>
                It buys care teams critical time.
              </span>
            </h1>

            <p style={{
              fontSize: '1.02rem',
              lineHeight: '1.65',
              color: isDark ? '#94a3b8' : '#475569',
              maxWidth: '560px',
              margin: 0
            }}>
              Detecting subtle neuromotor, acoustic, and psychometric drift 
              <strong> 6–8 months</strong> before symptoms trigger a hospital visit. Powered by a 10-agent autonomous clinical cascade.
            </p>
          </div>

          {/* 3 Prominent Metric Pillars */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginTop: '2.5rem',
            maxWidth: '580px'
          }}>
            <div style={{
              padding: '1rem',
              borderRadius: '14px',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#6366f1' }}>6–8 Mos</div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: isDark ? '#cbd5e1' : '#475569', marginTop: '2px' }}>Clinical Lead Time</div>
              <div style={{ fontSize: '0.68rem', color: isDark ? '#64748b' : '#94a3b8' }}>Early window gained</div>
            </div>

            <div style={{
              padding: '1rem',
              borderRadius: '14px',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#06b6d4' }}>10 Agents</div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: isDark ? '#cbd5e1' : '#475569', marginTop: '2px' }}>Autonomous Pipeline</div>
              <div style={{ fontSize: '0.68rem', color: isDark ? '#64748b' : '#94a3b8' }}>EWMA change-point</div>
            </div>

            <div style={{
              padding: '1rem',
              borderRadius: '14px',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10b981' }}>Tri-Tier</div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: isDark ? '#cbd5e1' : '#475569', marginTop: '2px' }}>Diagnostic Cascade</div>
              <div style={{ fontSize: '0.68rem', color: isDark ? '#64748b' : '#94a3b8' }}>Passive, ML & MRI</div>
            </div>
          </div>
        </div>

        {/* Footer Badges */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          paddingTop: '1.5rem',
          marginTop: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: isDark ? '#94a3b8' : '#64748b' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span>Operational Production Workstation · HIPAA & WCAG 2.1 AA</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: isDark ? '#475569' : '#94a3b8' }}>© 2026 CogniVeil</span>
        </div>

      </div>

      {/* ── RIGHT AUTHENTICATION STATION (48% WIDTH) ── */}
      <div style={{
        flex: '0.95',
        minHeight: '100vh',
        padding: '3rem 3.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxSizing: 'border-box',
        backgroundColor: isDark ? '#090d16' : '#ffffff'
      }}>
        
        <div style={{ maxWidth: '460px', width: '100%', margin: '0 auto' }}>
          
          {/* Top Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: '800',
              letterSpacing: '0.06em',
              color: '#4338CA',
              backgroundColor: isDark ? 'rgba(67, 56, 202, 0.2)' : '#e0e7ff',
              padding: '3px 10px',
              borderRadius: '20px'
            }}>
              AUTHORIZED WORKSTATION ACCESS
            </span>
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                color: isDark ? '#cbd5e1' : '#475569'
              }}
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-0.02em', margin: '0 0 0.4rem 0' }}>
              Sign In to Workstation
            </h2>
            <p style={{ fontSize: '0.88rem', color: isDark ? '#94a3b8' : '#64748b', margin: 0 }}>
              Select a pre-verified evaluation role or enter clinical credentials.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '6px', color: isDark ? '#cbd5e1' : '#334155' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clinician@hospital.org"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: isDark ? '#111827' : '#f8fafc',
                  border: `1px solid ${isDark ? '#1e293b' : '#cbd5e1'}`,
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: isDark ? '#cbd5e1' : '#334155' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                >
                  {showPass ? 'Hide password' : 'Show password'}
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
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: isDark ? '#111827' : '#f8fafc',
                  border: `1px solid ${isDark ? '#1e293b' : '#cbd5e1'}`,
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s'
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                fontSize: '0.82rem',
                fontWeight: '600'
              }}>
                ✕ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4338CA 0%, #3730A3 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.92rem',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(67, 56, 202, 0.3)',
                transition: 'all 0.15s',
                marginTop: '0.35rem'
              }}
            >
              {loading ? 'Authenticating Workstation...' : 'Sign In to Workstation →'}
            </button>
          </form>

          {/* 1-Click Demo Evaluation Roles */}
          <div style={{ marginTop: '2rem', borderTop: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: isDark ? '#94a3b8' : '#64748b' }}>
                ⚡ 1-CLICK DEMO EVALUATION ROLES
              </span>
              <span style={{ fontSize: '0.7rem', color: isDark ? '#64748b' : '#94a3b8' }}>
                password: demo1234
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
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
                      padding: '0.7rem 0.9rem',
                      borderRadius: '10px',
                      backgroundColor: isSelected 
                        ? (isDark ? 'rgba(67, 56, 202, 0.2)' : '#e0e7ff') 
                        : (isDark ? '#111827' : '#f8fafc'),
                      border: `1px solid ${isSelected ? '#6366f1' : (isDark ? '#1e293b' : '#e2e8f0')}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{d.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a' }}>
                          {d.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                          {d.role}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      backgroundColor: d.tagBg,
                      color: d.tagColor
                    }}>
                      {d.tag}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enroll Link */}
          <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b' }}>
            <span>Need to enroll a new cohort patient? </span>
            <Link to="/register" style={{ color: '#6366f1', fontWeight: '800', textDecoration: 'none' }}>
              Register patient →
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;