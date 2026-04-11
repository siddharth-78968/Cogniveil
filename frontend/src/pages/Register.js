import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(name, email, password, parseInt(age));
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColor = ['transparent', '#ef4444', '#f59e0b', '#00d4aa'][strength];
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][strength];

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.bgGrid} />

      <div style={styles.wrapper}>
        {/* Left panel */}
        <div style={styles.leftPanel}>
          <div style={styles.brandRow}>
            <span style={styles.brandIcon}>🧠</span>
            <span style={styles.brandName}>CogniVeil</span>
          </div>
          <h1 style={styles.tagline}>Your brain<br/>deserves care.</h1>
          <p style={styles.taglineSub}>
            Join thousands monitoring their cognitive health passively. 
            No clinic visits. No long tests. Just 3 minutes a day.
          </p>
          <div style={styles.stepsList}>
            {[
              { icon: '📝', title: 'Create account', desc: 'Takes 30 seconds' },
              { icon: '🧪', title: 'Take daily tests', desc: '3 short cognitive checks' },
              { icon: '👁️', title: 'Passive monitoring begins', desc: 'Runs silently in background' },
              { icon: '📊', title: 'Get your CogniScore', desc: 'AI-fused risk assessment' },
            ].map((s, i) => (
              <div key={i} style={styles.stepItem}>
                <div style={styles.stepIconBox}>{s.icon}</div>
                <div>
                  <p style={styles.stepTitle}>{s.title}</p>
                  <p style={styles.stepDesc}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={styles.formPanel}>
          <p style={styles.formLabel}>GET STARTED</p>
          <h2 style={styles.formTitle}>Create account</h2>
          <p style={styles.formSub}>Free forever. No credit card required.</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                style={styles.input}
                placeholder="e.g. Arjun Sharma"
                required
              />
            </div>

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
                  placeholder="Min 6 characters"
                  required
                />
                <button type="button" style={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {password.length > 0 && (
                <div style={styles.strengthRow}>
                  <div style={styles.strengthBar}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{
                        ...styles.strengthSegment,
                        backgroundColor: i <= strength ? strengthColor : '#ffffff10',
                      }}/>
                    ))}
                  </div>
                  <span style={{ color: strengthColor, fontSize: '0.72rem', fontWeight: '600' }}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Age</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                style={styles.input}
                placeholder="e.g. 65"
                min="18"
                max="120"
                required
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>

          <p style={styles.loginText}>
            Already have an account?{' '}
            <Link to="/login" style={styles.loginLink}>Sign in</Link>
          </p>

          <p style={styles.disclaimer}>
            By registering you agree that this is a screening tool only and does not replace clinical diagnosis.
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
    width: '600px', height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)',
    top: '-200px', left: '-100px',
    pointerEvents: 'none',
    animation: 'glow 6s ease-in-out infinite',
  },
  bgGlow2: {
    position: 'fixed',
    width: '500px', height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)',
    bottom: '-150px', right: '-100px',
    pointerEvents: 'none',
    animation: 'glow 8s ease-in-out infinite reverse',
  },
  bgGrid: {
    position: 'fixed', inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
  },
  wrapper: {
    display: 'flex',
    width: '100%',
    maxWidth: '1000px',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid #ffffff10',
    position: 'relative',
    zIndex: 1,
    animation: 'fadeUp 0.6s ease',
  },
  leftPanel: {
    flex: 1,
    backgroundColor: '#0d1117',
    padding: '3rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    borderRight: '1px solid #ffffff08',
  },
  brandRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  brandIcon: { fontSize: '1.8rem' },
  brandName: { color: '#a78bfa', fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em' },
  tagline: { color: 'white', fontSize: '2.2rem', fontWeight: '800', lineHeight: 1.2, letterSpacing: '-0.03em' },
  taglineSub: { color: '#ffffff50', fontSize: '0.9rem', lineHeight: 1.6 },
  stepsList: { display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' },
  stepItem: { display: 'flex', alignItems: 'center', gap: '1rem' },
  stepIconBox: {
    width: '40px', height: '40px',
    backgroundColor: '#ffffff08',
    borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.2rem', flexShrink: 0,
  },
  stepTitle: { color: 'white', fontSize: '0.9rem', fontWeight: '600', marginBottom: '2px' },
  stepDesc: { color: '#ffffff35', fontSize: '0.78rem' },
  formPanel: {
    width: '380px',
    backgroundColor: '#080c14',
    padding: '3rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  formLabel: { color: '#ffffff25', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.15em' },
  formTitle: { color: 'white', fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em' },
  formSub: { color: '#ffffff35', fontSize: '0.85rem', marginBottom: '0.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '0.25rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { color: '#ffffff50', fontSize: '0.78rem', fontWeight: '500', letterSpacing: '0.03em' },
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
  passWrapper: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: '0.75rem', top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
  },
  strengthRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' },
  strengthBar: { display: 'flex', gap: '4px', flex: 1 },
  strengthSegment: { flex: 1, height: '3px', borderRadius: '2px', transition: 'background-color 0.3s' },
  errorBox: {
    backgroundColor: '#ef444415',
    border: '1px solid #ef444430',
    borderRadius: '8px',
    padding: '0.65rem 1rem',
    color: '#ef4444',
    fontSize: '0.85rem',
    display: 'flex', alignItems: 'center', gap: '0.5rem',
  },
  submitBtn: {
    backgroundColor: '#a78bfa',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '0.85rem',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '0.25rem',
    letterSpacing: '0.02em',
  },
  loginText: { color: '#ffffff30', fontSize: '0.82rem', textAlign: 'center', marginTop: '0.5rem' },
  loginLink: { color: '#a78bfa', textDecoration: 'none', fontWeight: '600' },
  disclaimer: { color: '#ffffff18', fontSize: '0.7rem', textAlign: 'center', lineHeight: 1.5, marginTop: '0.5rem' },
};

export default Register;