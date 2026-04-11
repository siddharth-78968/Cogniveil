import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Animated background */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.bgGrid} />

      <div style={styles.wrapper}>
        {/* Left panel */}
        <div className="left-panel" style={styles.leftPanel}>
          <div style={styles.brandRow}>
            <span style={styles.brandIcon}>🧠</span>
            <span style={styles.brandName}>CogniVeil</span>
          </div>
          <h1 style={styles.tagline}>Early detection<br/>saves lives.</h1>
          <p style={styles.taglineSub}>
            AI-powered passive + active cognitive monitoring. 
            Catch dementia signals months before clinical symptoms appear.
          </p>
          <div style={styles.statsRow}>
            <div style={styles.statItem}>
              <span style={styles.statNum}>25.5M</span>
              <span style={styles.statLabel}>projected dementia cases in India by 2050</span>
            </div>
            <div style={styles.statDivider}/>
            <div style={styles.statItem}>
              <span style={styles.statNum}>3 min</span>
              <span style={styles.statLabel}>daily check-in is all it takes</span>
            </div>
          </div>
          <div style={styles.levelPills}>
            {['Level 1: Passive Screening', 'Level 2: Deep Assessment', 'Level 3: MRI Deep Learning'].map((l, i) => (
              <div key={i} style={{
                ...styles.levelPill,
                opacity: 1 - i * 0.2,
                borderColor: i === 0 ? '#00d4aa55' : '#ffffff15',
                color: i === 0 ? '#00d4aa' : '#ffffff50',
              }}>
                <span style={{ color: i === 0 ? '#00d4aa' : '#ffffff30' }}>{'→'}</span> {l}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="form-panel" style={styles.formPanel}>
          <p style={styles.formLabel}>SIGN IN</p>
          <h2 style={styles.formTitle}>Welcome back</h2>
          <p style={styles.formSub}>Continue monitoring your cognitive health</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={styles.input}
                placeholder="you@example.com"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <div style={styles.passWrapper}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ ...styles.input, paddingRight: '3rem' }}
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

            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <span>Sign In →</span>
              )}
            </button>
          </form>

          <div style={styles.divider}>
            <div style={styles.dividerLine}/>
            <span style={styles.dividerText}>demo accounts</span>
            <div style={styles.dividerLine}/>
          </div>

          <div style={styles.demoAccounts}>
            {[
              { label: 'Low Risk', email: 'arjun@demo.com', color: '#00d4aa' },
              { label: 'Moderate', email: 'meena@demo.com', color: '#f59e0b' },
              { label: 'High Risk', email: 'rajan@demo.com', color: '#ef4444' },
            ].map((d, i) => (
              <button
                key={i}
                style={{ ...styles.demoBtn, borderColor: d.color + '44', color: d.color }}
                onClick={() => { setEmail(d.email); setPassword('demo1234'); }}
              >
                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{d.label}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: '600' }}>{d.email}</span>
              </button>
            ))}
          </div>

          <p style={styles.registerText}>
            New user?{' '}
            <Link to="/register" style={styles.registerLink}>Create account</Link>
          </p>
        </div>
      </div>


      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
input:focus {
          outline: none !important;
          border-color: #00d4aa55 !important;
          box-shadow: 0 0 0 3px rgba(0,212,170,0.1) !important;
        }
        @media (max-width: 640px) {
          .left-panel { display: none !important; }
          .form-panel { width: 100% !important; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#080c14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', sans-serif",
  },
  bgGlow1: {
    position: 'fixed',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,212,170,0.07) 0%, transparent 70%)',
    top: '-200px',
    left: '-100px',
    pointerEvents: 'none',
    animation: 'glow 6s ease-in-out infinite',
  },
  bgGlow2: {
    position: 'fixed',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)',
    bottom: '-150px',
    right: '-100px',
    pointerEvents: 'none',
    animation: 'glow 8s ease-in-out infinite reverse',
  },
  bgGrid: {
    position: 'fixed',
    inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
  },
 wrapper: {
    display: 'flex',
    width: '100%',
    maxWidth: '1000px',
    minHeight: '600px',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid #ffffff10',
    position: 'relative',
    zIndex: 1,
    animation: 'fadeUp 0.6s ease',
    flexWrap: 'wrap',
  },
leftPanel: {
    flex: 1,
    minWidth: '280px',
    backgroundColor: '#0d1117',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    borderRight: '1px solid #ffffff08',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  brandIcon: { fontSize: '1.8rem' },
  brandName: {
    color: '#00d4aa',
    fontSize: '1.4rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
  },
  tagline: {
    color: 'white',
    fontSize: '2.2rem',
    fontWeight: '800',
    lineHeight: 1.2,
    letterSpacing: '-0.03em',
    marginTop: '0.5rem',
  },
  taglineSub: {
    color: '#ffffff50',
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1.25rem',
    backgroundColor: '#ffffff05',
    borderRadius: '12px',
    border: '1px solid #ffffff08',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statNum: {
    color: '#00d4aa',
    fontSize: '1.4rem',
    fontWeight: '800',
  },
  statLabel: {
    color: '#ffffff40',
    fontSize: '0.75rem',
    lineHeight: 1.4,
    maxWidth: '120px',
  },
  statDivider: {
    width: '1px',
    height: '40px',
    backgroundColor: '#ffffff10',
  },
  levelPills: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: 'auto',
  },
  levelPill: {
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.82rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
formPanel: {
    width: '380px',
    backgroundColor: '#080c14',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    minWidth: '280px',
    flex: 1,
  },
  formLabel: {
    color: '#ffffff25',
    fontSize: '0.68rem',
    fontWeight: '700',
    letterSpacing: '0.15em',
  },
  formTitle: {
    color: 'white',
    fontSize: '1.6rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    marginBottom: '0',
  },
  formSub: {
    color: '#ffffff35',
    fontSize: '0.85rem',
    marginBottom: '0.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '0.5rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    color: '#ffffff50',
    fontSize: '0.78rem',
    fontWeight: '500',
    letterSpacing: '0.03em',
  },
  input: {
    backgroundColor: '#0d1117',
    border: '1px solid #ffffff12',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    color: 'white',
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  passWrapper: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0',
  },
  errorBox: {
    backgroundColor: '#ef444415',
    border: '1px solid #ef444430',
    borderRadius: '8px',
    padding: '0.65rem 1rem',
    color: '#ef4444',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  submitBtn: {
    backgroundColor: '#00d4aa',
    color: '#080c14',
    border: 'none',
    borderRadius: '10px',
    padding: '0.85rem',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '0.25rem',
    letterSpacing: '0.02em',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.25rem',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#ffffff10',
  },
  dividerText: {
    color: '#ffffff25',
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
  },
  demoAccounts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  demoBtn: {
    backgroundColor: 'transparent',
    border: '1px solid',
    borderRadius: '8px',
    padding: '0.6rem 1rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    transition: 'background 0.2s',
    textAlign: 'left',
  },
  registerText: {
    color: '#ffffff30',
    fontSize: '0.82rem',
    textAlign: 'center',
    marginTop: '0.5rem',
  },
  registerLink: {
    color: '#00d4aa',
    textDecoration: 'none',
    fontWeight: '600',
  },
};

export default Login;