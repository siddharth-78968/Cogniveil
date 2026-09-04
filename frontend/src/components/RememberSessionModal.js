import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const RememberSessionModal = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    // Check if the user just signed in via email and hasn't dismissed yet
    const justLoggedIn = sessionStorage.getItem('just_logged_in_prompt');
    const deviceChoice = localStorage.getItem('remember_device_choice');

    if (justLoggedIn === 'true' && user && deviceChoice !== 'remembered') {
      // Slight delay so page transitions smoothly
      const timer = setTimeout(() => {
        setVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (!visible) return null;

  const handleRemember = () => {
    if (user?.email) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberedEmail', user.email);
      const candPass = sessionStorage.getItem('candidate_remember_password');
      if (candPass) {
        localStorage.setItem('rememberedPassword', candPass);
      }
      localStorage.setItem('remember_device_choice', 'remembered');
    }
    setConfirmed(true);
    setTimeout(() => {
      sessionStorage.removeItem('just_logged_in_prompt');
      setVisible(false);
    }, 1200);
  };

  const handleDismiss = () => {
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPassword');
    localStorage.setItem('remember_device_choice', 'dismissed');
    sessionStorage.removeItem('just_logged_in_prompt');
    setVisible(false);
  };

  const emailDisplay = user?.email || sessionStorage.getItem('candidate_remember_email') || 'your account';

  return (
    <div style={{
      position: 'fixed',
      bottom: '28px',
      right: '28px',
      zIndex: 9999,
      maxWidth: '420px',
      width: 'calc(100vw - 40px)',
      boxSizing: 'border-box',
      animation: 'slideUpFade 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>
        {`
          @keyframes slideUpFade {
            from {
              opacity: 0;
              transform: translateY(18px) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>

      <div style={{
        borderRadius: '18px',
        backgroundColor: isDark ? '#141c15' : '#ffffff',
        border: `1.5px solid ${isDark ? '#2e422c' : '#c9dac6'}`,
        boxShadow: isDark
          ? '0 20px 48px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255,255,255,0.05)'
          : '0 16px 40px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.04)',
        padding: '22px 24px',
        color: isDark ? '#f1f5ee' : '#141e13',
        fontFamily: "'Mulish', 'Inter', -apple-system, sans-serif",
        backdropFilter: 'blur(12px)'
      }}>

        {confirmed ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#10b981',
            padding: '6px 0'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              fontWeight: '900'
            }}>
              ✓
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>Workstation Remembered</div>
              <div style={{ fontSize: '0.78rem', color: isDark ? '#a0b49c' : '#576c52' }}>
                Your credentials are saved on this browser for quick access.
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#e8f5e9',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem'
                }}>
                  🔐
                </div>
                <div>
                  <h4 style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: '800',
                    color: isDark ? '#f1f5ee' : '#141e13',
                    letterSpacing: '-0.01em'
                  }}>
                    Remember this workstation?
                  </h4>
                  <span style={{
                    fontSize: '0.72rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: isDark ? '#849c80' : '#60795c'
                  }}>
                    {emailDisplay}
                  </span>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDark ? '#849c80' : '#889e84',
                  fontSize: '1.2rem',
                  lineHeight: '1',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '6px'
                }}
                title="Dismiss"
              >
                ×
              </button>
            </div>

            <p style={{
              fontSize: '0.84rem',
              lineHeight: '1.45',
              color: isDark ? '#a8bfa4' : '#52674e',
              margin: '12px 0 16px 0'
            }}>
              Stay securely remembered on this device so you don't have to re-enter your email and password on your next clinical session.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleRemember}
                style={{
                  flex: '1.3',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#10b981',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontFamily: "'Mulish', sans-serif",
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'opacity 0.15s'
                }}
              >
                Remember me
              </button>

              <button
                onClick={handleDismiss}
                style={{
                  flex: '1',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${isDark ? '#334731' : '#c3d4c0'}`,
                  color: isDark ? '#c5d6c2' : '#495f45',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: "'Mulish', sans-serif",
                  transition: 'background-color 0.15s'
                }}
              >
                Not now
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default RememberSessionModal;
