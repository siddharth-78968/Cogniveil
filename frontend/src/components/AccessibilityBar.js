import React from 'react';
import { useTheme } from '../context/ThemeContext';

const AccessibilityBar = () => {
  const { 
    fontSizeScale, 
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
    <div style={{ ...styles.container, backgroundColor: isDark ? '#0b100c' : '#f2f6f1', borderColor: theme.border }}>
      <div style={styles.leftLabel}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.74rem',
          fontWeight: '600',
          fontFamily: "'Inter', system-ui, sans-serif",
          color: theme.subtext,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>
          Accessibility options <span style={{ opacity: 0.75, fontSize: '0.7rem', fontWeight: '400' }}>(WCAG 2.1 AA)</span>
        </span>
      </div>

      <div style={styles.controlsGroup}>
        {/* Font Sizing */}
        <div style={{
          ...styles.fontScaleBox,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          border: `1px solid ${theme.borderSubtle || 'rgba(255,255,255,0.08)'}`
        }}>
          <span style={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", color: theme.subtext, marginRight: '6px', fontWeight: '700' }}>
            Text Size:
          </span>
          <button 
            style={{ 
              ...styles.btn, 
              backgroundColor: (fontSizeScale === 'sm' || fontSizeScale === 'xs') ? (isDark ? '#3d5236' : '#273822') : 'transparent', 
              color: (fontSizeScale === 'sm' || fontSizeScale === 'xs') ? '#ffffff' : theme.text,
              opacity: fontSizeScale === 'xs' ? 0.4 : 1,
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
              backgroundColor: fontSizeScale === 'md' ? (isDark ? '#3d5236' : '#273822') : 'transparent', 
              color: fontSizeScale === 'md' ? '#ffffff' : theme.text 
            }}
            onClick={resetFontSize}
            title="Reset text size to standard (100%)"
            aria-label="Reset text size"
          >
            A
          </button>
          <button 
            style={{ 
              ...styles.btn, 
              backgroundColor: (fontSizeScale === 'lg' || fontSizeScale === 'xl') ? (isDark ? '#3d5236' : '#273822') : 'transparent', 
              color: (fontSizeScale === 'lg' || fontSizeScale === 'xl') ? '#ffffff' : theme.text,
              opacity: fontSizeScale === 'xl' ? 0.4 : 1,
              cursor: fontSizeScale === 'xl' ? 'not-allowed' : 'pointer',
            }}
            onClick={increaseFontSize}
            title={fontSizeScale === 'xl' ? "Maximum text size reached (135%)" : "Increase text size (A+)"}
            aria-label="Increase text size"
          >
            A+
          </button>
          <span style={{ 
            fontSize: '0.72rem', 
            fontWeight: '700', 
            color: theme.subtext, 
            marginLeft: '6px', 
            minWidth: '32px', 
            textAlign: 'center',
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            {fontSizePercent || '100%'}
          </span>
        </div>

        {/* Reduced Motion Toggle */}
        <button 
          style={{ 
            ...styles.toggleBtn, 
            backgroundColor: reducedMotion ? (isDark ? '#1a241b' : '#e8efe6') : 'transparent', 
            color: reducedMotion ? (isDark ? '#a3b18a' : '#273822') : theme.text, 
            borderColor: reducedMotion ? (isDark ? '#3d5236' : '#d2ded0') : theme.border,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.72rem',
            fontWeight: '700'
          }}
          onClick={toggleReducedMotion}
          title="Toggle reduced animations"
        >
          <span>{reducedMotion ? 'Motion: Reduced' : 'Motion: Standard'}</span>
        </button>

        {/* Light / Dark Mode Toggle */}
        <button 
          style={{ 
            ...styles.toggleBtn, 
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', 
            color: theme.text, 
            borderColor: theme.border,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.72rem',
            fontWeight: '700'
          }}
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
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
    padding: '0.45rem 1.5rem',
    borderBottom: '1px solid',
    fontSize: '0.78rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
    transition: 'background-color 0.2s ease',
  },
  leftLabel: {
    display: 'flex',
    alignItems: 'center',
  },
  controlsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  fontScaleBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    padding: '2px 6px',
    borderRadius: '8px',
  },
  btn: {
    border: 'none',
    borderRadius: '6px',
    padding: '2px 7px',
    fontSize: '0.72rem',
    fontWeight: '800',
    cursor: 'pointer',
    minWidth: '22px',
    minHeight: '22px',
    transition: 'all 0.15s ease',
  },
  toggleBtn: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '4px 10px',
    fontSize: '0.72rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.15s ease',
  }
};

export default AccessibilityBar;
