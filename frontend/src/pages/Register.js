import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

        <button style={styles.navLinkBtn} onClick={() => navigate('/login')}>
          Sign In to Existing Record →
        </button>
      </header>

      {/* Main Registration Card */}
      <div style={styles.centerContainer}>
        <div style={styles.authCard}>
          
          <div style={styles.cardHeader}>
            <span style={styles.eyebrow}>PATIENT ONBOARDING & ENROLLMENT</span>
            <h1 style={styles.cardTitle}>Create Patient Profile</h1>
            <p style={styles.cardSub}>
              Establish a baseline profile for longitudinal cognitive telemetry and multimodal screening.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Legal Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                placeholder="Rajan Pillai"
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
                placeholder="rajan@example.com"
                required
              />
            </div>

            <div style={styles.rowGroup}>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Age (Years)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  style={styles.input}
                  placeholder="68"
                  required
                />
              </div>

              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Biological Sex</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={styles.input}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Secure Password</label>
                <button
                  type="button"
                  style={styles.textBtn}
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? 'Hide' : 'Show'}
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

            <div style={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="isCaregiver"
                checked={isCaregiver}
                onChange={(e) => setIsCaregiver(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#0F4C4A' }}
              />
              <label htmlFor="isCaregiver" style={{ fontSize: '0.82rem', color: '#102A43', cursor: 'pointer' }}>
                I am a clinical supervisor / healthcare caregiver enrolling a patient
              </label>
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
              {loading ? 'Enrolling Profile...' : 'Complete Profile Enrollment →'}
            </button>
          </form>

          <div style={styles.footerNote}>
            <span>Already have an active profile? </span>
            <Link to="/login" style={styles.link}>Sign in to workspace</Link>
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
    maxWidth: '540px',
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
    gap: '1rem',
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
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.25rem 0',
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

export default Register;
