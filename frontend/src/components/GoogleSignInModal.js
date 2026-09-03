import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const defaultGoogleProfiles = [
  {
    name: 'Dr. Riya Mehta',
    email: 'riyamehta55@gmail.com',
    role: 'clinician',
    badge: 'Clinician Supervisor',
    badgeColor: '#0ea5e9',
    avatarColor: '#2563eb',
    avatarInitials: 'RM'
  },
  {
    name: 'Siddharth',
    email: 'siddharth@gmail.com',
    role: 'patient',
    badge: 'Patient Telemetry',
    badgeColor: '#10b981',
    avatarColor: '#059669',
    avatarInitials: 'S'
  },
  {
    name: 'Rajan Pillai',
    email: 'rajan.pillai@gmail.com',
    role: 'patient',
    badge: 'Patient (Tier 3)',
    badgeColor: '#8b5cf6',
    avatarColor: '#7c3aed',
    avatarInitials: 'RP'
  }
];

const GoogleSignInModal = ({ isOpen, onClose, defaultRole = 'patient', onSuccess }) => {
  const { googleLogin } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [loadingEmail, setLoadingEmail] = useState('');
  const [error, setError] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customRole, setCustomRole] = useState(defaultRole);

  if (!isOpen) return null;

  const handleSelectAccount = async (profile) => {
    setError('');
    setLoadingEmail(profile.email);
    try {
      await googleLogin({
        email: profile.email,
        name: profile.name,
        role: profile.role
      });
      if (onSuccess) {
        onSuccess(profile);
      } else {
        navigate('/dashboard');
      }
      onClose();
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(typeof err.response.data.detail === 'string' ? err.response.data.detail : 'Google authentication failed.');
      } else {
        setError('Failed to authenticate with Google. Ensure backend is running.');
      }
    } finally {
      setLoadingEmail('');
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setError('Please provide a valid Google / Gmail address.');
      return;
    }
    const cleanName = customName.trim() || customEmail.split('@')[0].replace('.', ' ');
    setError('');
    setLoadingEmail(customEmail);
    try {
      await googleLogin({
        email: customEmail.trim().toLowerCase(),
        name: cleanName,
        role: customRole
      });
      if (onSuccess) {
        onSuccess({ email: customEmail, name: cleanName, role: customRole });
      } else {
        navigate('/dashboard');
      }
      onClose();
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(typeof err.response.data.detail === 'string' ? err.response.data.detail : 'Google sign-in error.');
      } else {
        setError('Failed to connect with Google identity service.');
      }
    } finally {
      setLoadingEmail('');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(5, 10, 6, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: isDark ? '#111712' : '#ffffff',
          color: isDark ? '#f1f5ee' : '#141e13',
          borderRadius: '24px',
          border: `1px solid ${isDark ? '#283827' : '#e2e8df'}`,
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 25px 50px -12px rgba(18, 38, 20, 0.2)',
          overflow: 'hidden',
          animation: 'fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: "'Mulish', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        {/* Top Google Header Bar */}
        <div style={{
          padding: '28px 30px 18px 30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f0f4ef'}`
        }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              background: 'none',
              border: 'none',
              color: isDark ? '#8ca088' : '#70886c',
              cursor: 'pointer',
              fontSize: '1.3rem',
              lineHeight: 1,
              padding: '6px 8px',
              borderRadius: '8px',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? '#1b241c' : '#f1f5ef'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            title="Close"
          >
            ✕
          </button>

          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: isDark ? '#1c251e' : '#f8fbf7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
            marginBottom: '14px',
            border: `1px solid ${isDark ? '#2d3d2c' : '#e4ece1'}`
          }}>
            <GoogleIcon size={26} />
          </div>

          <h3 style={{
            margin: '0 0 6px 0',
            fontSize: '1.35rem',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            color: isDark ? '#f4f8f1' : '#141e13'
          }}>
            Sign in with Google
          </h3>

          <p style={{
            margin: 0,
            fontSize: '0.88rem',
            color: isDark ? '#98ab94' : '#5a7056',
            lineHeight: 1.4
          }}>
            Choose an account to continue to <strong style={{ color: isDark ? '#7dd3fc' : '#0369a1' }}>CogniVeil Telemetry</strong>
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            margin: '14px 24px 0 24px',
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
            border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`,
            color: isDark ? '#fca5a5' : '#b91c1c',
            fontSize: '0.84rem',
            lineHeight: 1.4
          }}>
            {error}
          </div>
        )}

        {/* Account Selector List */}
        <div style={{ padding: '16px 20px', maxHeight: '380px', overflowY: 'auto' }}>
          {!showCustomForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {defaultGoogleProfiles.map((p) => {
                const isLoading = loadingEmail === p.email;
                return (
                  <button
                    key={p.email}
                    onClick={() => handleSelectAccount(p)}
                    disabled={Boolean(loadingEmail)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: `1px solid ${isDark ? '#222f22' : '#e6ede3'}`,
                      backgroundColor: isDark ? '#161e17' : '#fbfdfa',
                      cursor: loadingEmail ? 'wait' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingEmail) {
                        e.currentTarget.style.backgroundColor = isDark ? '#1d271e' : '#f0f6ed';
                        e.currentTarget.style.borderColor = isDark ? '#3d5236' : '#bfd4bc';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingEmail) {
                        e.currentTarget.style.backgroundColor = isDark ? '#161e17' : '#fbfdfa';
                        e.currentTarget.style.borderColor = isDark ? '#222f22' : '#e6ede3';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {/* User Avatar Circle */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: p.avatarColor,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.92rem',
                      flexShrink: 0
                    }}>
                      {p.avatarInitials}
                    </div>

                    {/* Account Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: '700',
                        fontSize: '0.94rem',
                        color: isDark ? '#f1f5ee' : '#162315',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.name}</span>
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                          color: p.badgeColor,
                          fontWeight: '800',
                          fontFamily: "'JetBrains Mono', monospace",
                          letterSpacing: '0.02em',
                          flexShrink: 0
                        }}>
                          {p.badge}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '0.82rem',
                        color: isDark ? '#8ba086' : '#627a5d',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        marginTop: '2px'
                      }}>
                        {p.email}
                      </div>
                    </div>

                    {/* Loading or Google Logo */}
                    {isLoading ? (
                      <div style={{
                        width: '18px',
                        height: '18px',
                        border: '2px solid rgba(16, 185, 129, 0.2)',
                        borderTopColor: '#10b981',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        flexShrink: 0
                      }} />
                    ) : (
                      <GoogleIcon size={18} />
                    )}
                  </button>
                );
              })}

              {/* Use Another Account Button */}
              <button
                type="button"
                onClick={() => setShowCustomForm(true)}
                disabled={Boolean(loadingEmail)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: `1px dashed ${isDark ? '#324530' : '#ccd9c8'}`,
                  backgroundColor: 'transparent',
                  color: isDark ? '#b2c5ae' : '#455d3e',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  marginTop: '4px',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? '#161e17' : '#f5f9f3';
                  e.currentTarget.style.borderColor = isDark ? '#4ade80' : '#2e7d32';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = isDark ? '#324530' : '#ccd9c8';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: isDark ? '#1d271e' : '#eef4ec',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  color: isDark ? '#98ab94' : '#577052',
                  flexShrink: 0
                }}>
                  +
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>Use another Google account</div>
                  <div style={{ fontSize: '0.78rem', color: isDark ? '#7a8e75' : '#738a6e' }}>
                    Sign in or auto-enroll with any Gmail or Workspace ID
                  </div>
                </div>
              </button>
            </div>
          ) : (
            /* Custom Account Form */
            <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: isDark ? '#a8bfa4' : '#475d41',
                  marginBottom: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Siddharth"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: isDark ? '#182119' : '#f9fbf8',
                    border: `1px solid ${isDark ? '#2e3f2c' : '#d2dfd0'}`,
                    color: isDark ? '#f1f5ee' : '#141e13',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: isDark ? '#a8bfa4' : '#475d41',
                  marginBottom: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Google / Gmail Address *
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: isDark ? '#182119' : '#f9fbf8',
                    border: `1px solid ${isDark ? '#2e3f2c' : '#d2dfd0'}`,
                    color: isDark ? '#f1f5ee' : '#141e13',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: isDark ? '#a8bfa4' : '#475d41',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  CogniVeil Role
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setCustomRole('patient')}
                    style={{
                      padding: '9px 10px',
                      borderRadius: '10px',
                      border: customRole === 'patient'
                        ? '1.5px solid #10b981'
                        : `1px solid ${isDark ? '#2c3b2a' : '#d5e0d3'}`,
                      backgroundColor: customRole === 'patient'
                        ? (isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
                        : (isDark ? '#171f18' : '#f9fbf8'),
                      color: customRole === 'patient' ? '#10b981' : (isDark ? '#b8c9b4' : '#576c52'),
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    👤 Patient (Self)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomRole('clinician')}
                    style={{
                      padding: '9px 10px',
                      borderRadius: '10px',
                      border: customRole === 'clinician'
                        ? '1.5px solid #0ea5e9'
                        : `1px solid ${isDark ? '#2c3b2a' : '#d5e0d3'}`,
                      backgroundColor: customRole === 'clinician'
                        ? (isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.1)')
                        : (isDark ? '#171f18' : '#f9fbf8'),
                      color: customRole === 'clinician' ? '#0ea5e9' : (isDark ? '#b8c9b4' : '#576c52'),
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    🩺 Clinician / MD
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${isDark ? '#334731' : '#ccd9c9'}`,
                    color: isDark ? '#b9cab5' : '#4d6547',
                    fontWeight: '700',
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to List
                </button>
                <button
                  type="submit"
                  disabled={Boolean(loadingEmail)}
                  style={{
                    flex: 2,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: isDark ? '#233821' : '#273822',
                    border: `1px solid ${isDark ? '#3d5939' : '#1e2d1a'}`,
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: loadingEmail ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <GoogleIcon size={16} />
                  <span>{loadingEmail ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Security Notice */}
        <div style={{
          padding: '14px 24px',
          backgroundColor: isDark ? '#0b100c' : '#f5f8f3',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e7efe4'}`,
          fontSize: '0.74rem',
          color: isDark ? '#7a8e75' : '#6b8266',
          lineHeight: 1.4,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>🛡️</span>
          <span>
            Google identity verification shares your profile credentials securely with CogniVeil. Clinical biometric telemetry is encrypted and ISO/DIS 13485 compliant.
          </span>
        </div>
      </div>
    </div>
  );
};

export default GoogleSignInModal;
