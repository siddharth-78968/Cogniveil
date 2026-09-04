import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getApiBaseUrl, setApiBaseUrl, pingBackend } from '../utils/api';

const ServerConfigModal = ({ isOpen, onClose }) => {
  const { theme, isDark } = useTheme();
  const [currentUrl, setCurrentUrl] = useState(getApiBaseUrl());
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // { success: boolean, message: string }

  if (!isOpen) return null;

  const handleTest = async (urlToTest = currentUrl) => {
    setTesting(true);
    setTestStatus(null);
    try {
      // Temporarily store URL to test
      setApiBaseUrl(urlToTest);
      const res = await pingBackend();
      if (res && res.data) {
        setTestStatus({
          success: true,
          message: `Connected successfully! (Status: ${res.data.status || 'OK'})`
        });
      } else {
        setTestStatus({
          success: true,
          message: 'Connected to backend server!'
        });
      }
    } catch (err) {
      setTestStatus({
        success: false,
        message: err.message || 'Cannot reach server at this address.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setApiBaseUrl(currentUrl);
    onClose();
    window.location.reload();
  };

  const applyPreset = (presetUrl) => {
    setCurrentUrl(presetUrl);
    handleTest(presetUrl);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(6px)',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        borderRadius: '20px',
        backgroundColor: theme.cardBg,
        border: `1px solid ${theme.border}`,
        padding: '2rem',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{
              fontSize: '0.78rem',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: '700',
              color: isDark ? '#a3b18a' : '#273822',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}>
              MOBILE & NETWORK SETTINGS
            </span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: '800', margin: '4px 0 0 0', color: theme.text }}>
              Backend Server Connection
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: theme.subtext,
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.92rem', color: theme.subtext, lineHeight: '1.5', margin: 0 }}>
          When running CogniVeil on an Android phone via the APK, connect to your PC's local Wi-Fi address so clinical assessments and AI inference can communicate with the Python backend.
        </p>

        {/* Input Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.86rem', fontWeight: '700', color: theme.text }}>
            Backend API Server URL:
          </label>
          <input
            type="text"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            placeholder="http://10.152.1.187:8000"
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.inputBg,
              color: theme.text,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.94rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.76rem', color: theme.subtext, fontWeight: '700', textTransform: 'uppercase' }}>
            Quick Presets:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => applyPreset('http://10.152.1.187:8000')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '600',
                border: `1px solid ${theme.border}`,
                backgroundColor: isDark ? '#1a241b' : '#eaf2e8',
                color: theme.text,
                cursor: 'pointer'
              }}
            >
              Local Wi-Fi PC (10.152.1.187:8000)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('http://10.0.2.2:8000')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '600',
                border: `1px solid ${theme.border}`,
                backgroundColor: isDark ? '#1a241b' : '#eaf2e8',
                color: theme.text,
                cursor: 'pointer'
              }}
            >
              Android Emulator (10.0.2.2:8000)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('http://localhost:8000')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '600',
                border: `1px solid ${theme.border}`,
                backgroundColor: isDark ? '#1a241b' : '#eaf2e8',
                color: theme.text,
                cursor: 'pointer'
              }}
            >
              Desktop Localhost (localhost:8000)
            </button>
          </div>
        </div>

        {/* Status Box */}
        {testStatus && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: '600',
            backgroundColor: testStatus.success
              ? (isDark ? 'rgba(34, 197, 94, 0.15)' : '#ecfdf5')
              : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2'),
            color: testStatus.success ? '#10b981' : '#ef4444',
            border: `1px solid ${testStatus.success ? '#10b981' : '#ef4444'}`
          }}>
            {testStatus.success ? '✓ ' : '⚠️ '}
            {testStatus.message}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => handleTest()}
            disabled={testing}
            style={{
              flex: 1,
              padding: '0.85rem',
              borderRadius: '10px',
              border: `1.5px solid ${isDark ? '#3d5236' : '#273822'}`,
              backgroundColor: 'transparent',
              color: isDark ? '#a3b18a' : '#273822',
              fontWeight: '700',
              fontSize: '0.94rem',
              cursor: 'pointer'
            }}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              flex: 1.2,
              padding: '0.85rem',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: isDark ? '#ffffff' : '#273822',
              color: isDark ? '#0b100c' : '#ffffff',
              fontWeight: '700',
              fontSize: '0.94rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(39, 56, 34, 0.25)'
            }}
          >
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerConfigModal;
