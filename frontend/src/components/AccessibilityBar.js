import React from 'react';
import { useTheme } from '../context/ThemeContext';

const AccessibilityBar = () => {
  const { 
    fontSizeScale, 
    setFontSizeScale, 
    reducedMotion, 
    toggleReducedMotion,
    theme 
  } = useTheme();

  return (
    <div style={{ ...styles.container, backgroundColor: theme.topHeaderBg, borderColor: theme.border }}>
      <div style={styles.leftLabel}>
        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: theme.subtext, letterSpacing: '0.05em' }}>
          ACCESSIBILITY CONTROLS
        </span>
      </div>

      <div style={styles.controlsGroup}>
        {/* Font Sizing */}
        <div style={styles.fontScaleBox}>
          <span style={{ fontSize: '0.72rem', color: theme.subtext, marginRight: '4px' }}>Text Size:</span>
          <button 
            style={{ ...styles.btn, backgroundColor: fontSizeScale === 'sm' ? '#0F4C4A' : 'transparent', color: fontSizeScale === 'sm' ? '#ffffff' : theme.text }}
            onClick={() => setFontSizeScale('sm')}
            title="Small text"
          >
            A-
          </button>
          <button 
            style={{ ...styles.btn, backgroundColor: fontSizeScale === 'md' ? '#0F4C4A' : 'transparent', color: fontSizeScale === 'md' ? '#ffffff' : theme.text }}
            onClick={() => setFontSizeScale('md')}
            title="Default text"
          >
            A
          </button>
          <button 
            style={{ ...styles.btn, backgroundColor: fontSizeScale === 'lg' ? '#0F4C4A' : 'transparent', color: fontSizeScale === 'lg' ? '#ffffff' : theme.text }}
            onClick={() => setFontSizeScale('lg')}
            title="Large text"
          >
            A+
          </button>
        </div>

        {/* Reduced Motion Toggle */}
        <button 
          style={{ ...styles.toggleBtn, backgroundColor: reducedMotion ? '#0F4C4A' : 'transparent', color: reducedMotion ? '#ffffff' : theme.text, borderColor: theme.border }}
          onClick={toggleReducedMotion}
          title="Toggle reduced animations"
        >
          <span>⏸️ Reduced Motion {reducedMotion ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.4rem 1.25rem',
    borderBottom: '1px solid',
    fontSize: '0.78rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  leftLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  controlsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    flexWrap: 'wrap',
  },
  fontScaleBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    backgroundColor: 'rgba(16, 42, 67, 0.04)',
    padding: '2px 4px',
    borderRadius: '6px',
  },
  btn: {
    border: 'none',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '0.75rem',
    fontWeight: '800',
    cursor: 'pointer',
    minWidth: '24px',
    minHeight: '24px',
  },
  toggleBtn: {
    border: '1px solid',
    borderRadius: '6px',
    padding: '3px 8px',
    fontSize: '0.72rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  }
};

export default AccessibilityBar;
