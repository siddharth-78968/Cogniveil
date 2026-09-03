import React from 'react';
import { useTheme } from '../context/ThemeContext';

const AccessibilityBar = () => {
  const { 
    fontSizeScale, 
    setFontSizeScale, 
    decreaseFontSize,
    increaseFontSize,
    resetFontSize,
    fontSizePercent,
    reducedMotion, 
    toggleReducedMotion,
    isDark,
    toggleTheme,
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
            style={{ 
              ...styles.btn, 
              backgroundColor: (fontSizeScale === 'sm' || fontSizeScale === 'xs') ? (isDark ? '#0d9488' : '#0F4C4A') : 'transparent', 
              color: (fontSizeScale === 'sm' || fontSizeScale === 'xs') ? '#ffffff' : theme.text,
              opacity: fontSizeScale === 'xs' ? 0.5 : 1,
              cursor: fontSizeScale === 'xs' ? 'not-allowed' : 'pointer',
            }}
            onClick={decreaseFontSize}
            title={fontSizeScale === 'xs' ? "Minimum text size reached (80%)" : "Decrease text size (A-)"}
            aria-label="Decrease text size"
          >
            A-
          </button>
          <button 
            style={{ 
              ...styles.btn, 
              backgroundColor: fontSizeScale === 'md' ? (isDark ? '#0d9488' : '#0F4C4A') : 'transparent', 
              color: fontSizeScale === 'md' ? '#ffffff' : theme.text 
            }}
            onClick={resetFontSize}
            title="Default text size (100%)"
            aria-label="Reset text size to default"
          >
            A
          </button>
          <button 
            style={{ 
              ...styles.btn, 
              backgroundColor: (fontSizeScale === 'lg' || fontSizeScale === 'xl') ? (isDark ? '#0d9488' : '#0F4C4A') : 'transparent', 
              color: (fontSizeScale === 'lg' || fontSizeScale === 'xl') ? '#ffffff' : theme.text,
              opacity: fontSizeScale === 'xl' ? 0.5 : 1,
              cursor: fontSizeScale === 'xl' ? 'not-allowed' : 'pointer',
            }}
            onClick={increaseFontSize}
            title={fontSizeScale === 'xl' ? "Maximum text size reached (135%)" : "Increase text size (A+)"}
            aria-label="Increase text size"
          >
            A+
          </button>
          <span style={{ 
            fontSize: '0.68rem', 
            fontWeight: '800', 
            color: isDark ? '#22d3ee' : '#0F4C4A', 
            marginLeft: '4px', 
            minWidth: '34px', 
            textAlign: 'center',
            fontFamily: 'monospace'
          }}>
            {fontSizePercent || '100%'}
          </span>
        </div>

        {/* Reduced Motion Toggle */}
        <button 
          style={{ ...styles.toggleBtn, backgroundColor: reducedMotion ? '#0F4C4A' : 'transparent', color: theme.text, borderColor: theme.border }}
          onClick={toggleReducedMotion}
          title="Toggle reduced animations"
        >
          <span>⏸️ Reduced Motion {reducedMotion ? 'ON' : 'OFF'}</span>
        </button>

        {/* Light / Dark Mode Toggle */}
        <button 
          style={{ ...styles.toggleBtn, backgroundColor: 'transparent', color: theme.text, borderColor: theme.border }}
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          <span>{isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
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
