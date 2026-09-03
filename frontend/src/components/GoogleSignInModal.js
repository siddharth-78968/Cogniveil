import React, { useState, useEffect, useCallback } from 'react';
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

const GoogleSignInModal = ({ isOpen, onClose, defaultRole = 'patient', onSuccess }) => {
  const { googleLogin } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [clientId, setClientId] = useState(() => {
    return process.env.REACT_APP_GOOGLE_CLIENT_ID || localStorage.getItem('COGNIVEIL_GOOGLE_CLIENT_ID') || '';
  });
  const [inputClientId, setInputClientId] = useState(clientId);
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [activeTab, setActiveTab] = useState(() => (clientId ? 'oauth' : 'setup'));

  useEffect(() => {
    if (clientId) {
      setActiveTab('oauth');
    } else {
      setActiveTab('setup');
    }
  }, [clientId, isOpen]);

  // Launch the REAL Google Identity Services OAuth 2.0 Popup
  const launchRealGoogleOAuth = useCallback(async (activeClientId = clientId) => {
    if (!activeClientId) {
      setError('Please provide a Google OAuth Client ID to connect with accounts.google.com.');
      setActiveTab('setup');
      return;
    }

    if (!window.google || !window.google.accounts) {
      setError('Google Identity Services SDK is still loading. Please check your internet connection and try again.');
      return;
    }

    setError('');
    setLoading(true);
    setStatusMsg('Opening official Google OAuth popup (accounts.google.com)...');

    try {
      // Use Google Identity Services Token Client for popup OAuth flow
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: activeClientId.trim(),
        scope: 'openid email profile',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setError(`Google OAuth error: ${tokenResponse.error_description || tokenResponse.error}`);
            setLoading(false);
            return;
          }

          setStatusMsg('Verifying Google credentials with CogniVeil clinical server...');
          try {
            // Fetch verified user profile directly from Google
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });
            const googleProfile = await userInfoRes.json();

            if (!googleProfile.email) {
              throw new Error('Could not retrieve verified email from Google.');
            }

            // Authenticate with CogniVeil backend
            const res = await googleLogin({
              email: googleProfile.email,
              name: googleProfile.name || googleProfile.email.split('@')[0],
              role: selectedRole,
              credential: tokenResponse.access_token
            });

            const userObj = res.data?.user;
            onClose();

            if (onSuccess) {
              onSuccess(userObj);
            } else if (userObj && userObj.consent_granted === false) {
              // Direct user to Terms of Service & Informed Consent page
              navigate('/consent');
            } else {
              navigate('/dashboard');
            }
          } catch (loginErr) {
            const detail = loginErr.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Failed to finalize session with CogniVeil.');
          } finally {
            setLoading(false);
            setStatusMsg('');
          }
        }
      });

      tokenClient.requestAccessToken();
    } catch (err) {
      setError(`Failed to initialize Google Sign-In: ${err.message}`);
      setLoading(false);
    }
  }, [clientId, selectedRole, googleLogin, navigate, onClose, onSuccess]);

  const handleSaveClientIdAndLaunch = (e) => {
    e.preventDefault();
    const cleanId = inputClientId.trim();
    if (!cleanId || !cleanId.includes('.apps.googleusercontent.com')) {
      setError('A valid Google Client ID must end with .apps.googleusercontent.com');
      return;
    }
    localStorage.setItem('COGNIVEIL_GOOGLE_CLIENT_ID', cleanId);
    setClientId(cleanId);
    setError('');
    launchRealGoogleOAuth(cleanId);
  };

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText('http://localhost:3000');
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(5, 10, 6, 0.76)',
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
          maxWidth: '520px',
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
        {/* Top Header */}
        <div style={{
          padding: '24px 28px 16px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f0f4ef'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: isDark ? '#1c251e' : '#f8fbf7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${isDark ? '#2d3d2c' : '#e4ece1'}`
            }}>
              <GoogleIcon size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>
                Real Google Sign-In
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: isDark ? '#98ab94' : '#5a7056' }}>
                Official Google Identity Services (OAuth 2.0)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: isDark ? '#8ca088' : '#70886c',
              cursor: 'pointer',
              fontSize: '1.3rem',
              lineHeight: 1,
              padding: '6px 8px',
              borderRadius: '8px'
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f0f4ef'}`,
          backgroundColor: isDark ? '#0d130e' : '#f8fbf7'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('oauth')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'oauth' ? '2.5px solid #10b981' : 'none',
              color: activeTab === 'oauth' ? (isDark ? '#4ade80' : '#15803d') : (isDark ? '#8ba087' : '#697f66'),
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            1. Launch Google Login
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('setup')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'setup' ? '2.5px solid #10b981' : 'none',
              color: activeTab === 'setup' ? (isDark ? '#4ade80' : '#15803d') : (isDark ? '#8ba087' : '#697f66'),
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            2. Google Cloud Setup Guide (2 min)
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px 26px' }}>
          {error && (
            <div style={{
              marginBottom: '14px',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
              border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`,
              color: isDark ? '#fca5a5' : '#b91c1c',
              fontSize: '0.84rem'
            }}>
              {error}
            </div>
          )}

          {statusMsg && (
            <div style={{
              marginBottom: '14px',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
              border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0'}`,
              color: isDark ? '#6ee7b7' : '#047857',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '14px',
                height: '14px',
                border: '2px solid rgba(16, 185, 129, 0.2)',
                borderTopColor: '#10b981',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span>{statusMsg}</span>
            </div>
          )}

          {activeTab === 'oauth' ? (
            <div>
              {/* Role Selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: isDark ? '#a8bfa4' : '#475d41',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Select Your Clinical Telemetry Role
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('patient')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: selectedRole === 'patient'
                        ? '2px solid #10b981'
                        : `1px solid ${isDark ? '#2c3b2a' : '#d5e0d3'}`,
                      backgroundColor: selectedRole === 'patient'
                        ? (isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
                        : (isDark ? '#171f18' : '#f9fbf8'),
                      color: selectedRole === 'patient' ? '#10b981' : (isDark ? '#b8c9b4' : '#576c52'),
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    👤 Patient (Monitoring)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('clinician')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: selectedRole === 'clinician'
                        ? '2px solid #0ea5e9'
                        : `1px solid ${isDark ? '#2c3b2a' : '#d5e0d3'}`,
                      backgroundColor: selectedRole === 'clinician'
                        ? (isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.1)')
                        : (isDark ? '#171f18' : '#f9fbf8'),
                      color: selectedRole === 'clinician' ? '#0ea5e9' : (isDark ? '#b8c9b4' : '#576c52'),
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    🩺 Clinician / Supervisor
                  </button>
                </div>
              </div>

              {/* Status of Client ID */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: isDark ? '#161e17' : '#f4f8f2',
                border: `1px solid ${isDark ? '#283827' : '#e0ebdd'}`,
                marginBottom: '16px',
                fontSize: '0.82rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '700', color: isDark ? '#c2d4be' : '#3d5238' }}>
                    Google OAuth Client ID:
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('setup')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284C7',
                      fontSize: '0.76rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {clientId ? 'Edit Client ID' : 'Add Client ID'}
                  </button>
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.74rem',
                  color: clientId ? (isDark ? '#6ee7b7' : '#059669') : (isDark ? '#f87171' : '#dc2626'),
                  wordBreak: 'break-all'
                }}>
                  {clientId ? `Active: ${clientId.substring(0, 24)}...apps.googleusercontent.com` : '⚠️ No Client ID configured yet'}
                </div>
              </div>

              {/* Main Action: Launch Real Google Popup */}
              {clientId ? (
                <button
                  type="button"
                  onClick={() => launchRealGoogleOAuth(clientId)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    backgroundColor: isDark ? '#ffffff' : '#141e13',
                    color: isDark ? '#141e13' : '#ffffff',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '1rem',
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <GoogleIcon size={22} />
                  <span>{loading ? 'Opening accounts.google.com...' : 'Open Official Google Sign-In'}</span>
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('setup')}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: '12px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: '800',
                      fontSize: '0.94rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px'
                    }}
                  >
                    <span>⚙️ Configure Free Google Client ID (2 min)</span>
                  </button>
                  <p style={{
                    margin: 0,
                    fontSize: '0.76rem',
                    textAlign: 'center',
                    color: isDark ? '#8ba087' : '#697f66',
                    lineHeight: 1.4
                  }}>
                    Real Google Sign-In with accounts.google.com security popups requires a Google OAuth Client ID for localhost:3000.
                  </p>
                </div>
              )}

              {/* What Happens Next Reassurance */}
              <div style={{
                marginTop: '18px',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: isDark ? '#0c120d' : '#f8fbf6',
                border: `1px solid ${isDark ? '#1f2d1e' : '#e6eee3'}`,
                fontSize: '0.76rem',
                color: isDark ? '#98ab94' : '#577052',
                lineHeight: 1.5
              }}>
                <strong>What happens when you click:</strong>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                  <li>Official <code>accounts.google.com</code> popup opens in your browser.</li>
                  <li>You select your real Google account & accept Google's consent screen.</li>
                  <li>Google sends a security alert email to your Gmail address.</li>
                  <li>CogniVeil redirects you to the <strong>Terms & Informed Consent Protocol</strong>.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Setup Guide Tab */
            <div>
              <div style={{
                fontSize: '0.82rem',
                color: isDark ? '#cbd8c7' : '#354b32',
                lineHeight: 1.5,
                marginBottom: '14px'
              }}>
                To allow your local website to open real Google login popups and send Google security emails, create an OAuth 2.0 Web Client in Google Cloud:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: isDark ? '#171f18' : '#f4f8f2',
                  border: `1px solid ${isDark ? '#2b3b29' : '#d8e4d5'}`,
                  fontSize: '0.8rem'
                }}>
                  <strong>Step 1:</strong> Open{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#0284C7', fontWeight: '700' }}
                  >
                    Google Cloud Console Credentials ↗
                  </a>
                  <div style={{ color: isDark ? '#8ba087' : '#697f66', fontSize: '0.74rem', marginTop: '2px' }}>
                    Create a project named <em>CogniVeil</em> if you don't have one.
                  </div>
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: isDark ? '#171f18' : '#f4f8f2',
                  border: `1px solid ${isDark ? '#2b3b29' : '#d8e4d5'}`,
                  fontSize: '0.8rem'
                }}>
                  <strong>Step 2:</strong> Under <strong>OAuth consent screen</strong>, select <strong>External</strong> and enter App Name: <em>CogniVeil</em>.
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: isDark ? '#171f18' : '#f4f8f2',
                  border: `1px solid ${isDark ? '#2b3b29' : '#d8e4d5'}`,
                  fontSize: '0.8rem'
                }}>
                  <strong>Step 3:</strong> Click <strong>+ CREATE CREDENTIALS → OAuth client ID</strong>.
                  <div style={{ marginTop: '4px' }}>
                    Type: <strong>Web application</strong>
                  </div>
                  <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Authorized JavaScript origins:</span>
                    <code style={{
                      backgroundColor: isDark ? '#222f22' : '#e6ede4',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.76rem'
                    }}>
                      http://localhost:3000
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyOrigin}
                      style={{
                        padding: '2px 6px',
                        fontSize: '0.7rem',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: copiedOrigin ? '#10b981' : '#0284C7',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedOrigin ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Paste Form */}
              <form onSubmit={handleSaveClientIdAndLaunch}>
                <label style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: isDark ? '#a8bfa4' : '#475d41',
                  marginBottom: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Step 4: Paste Your Google Client ID
                </label>
                <input
                  type="text"
                  value={inputClientId}
                  onChange={(e) => setInputClientId(e.target.value)}
                  placeholder="e.g. 1029384756-xxxxxxxx.apps.googleusercontent.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: isDark ? '#182119' : '#f9fbf8',
                    border: `1px solid ${isDark ? '#2e3f2c' : '#d2dfd0'}`,
                    color: isDark ? '#f1f5ee' : '#141e13',
                    fontSize: '0.84rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '12px'
                  }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: isDark ? '#233821' : '#273822',
                      border: `1px solid ${isDark ? '#3d5939' : '#1e2d1a'}`,
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <GoogleIcon size={16} />
                    <span>Save & Launch Real Google OAuth</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Security / Compliance Notice Footer */}
        <div style={{
          padding: '12px 24px',
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
