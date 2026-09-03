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
    <div style={{ ...styles.container, backgroundColor: isDark ? '#0c1322' : '#f8fafc', borderColor: theme.border }}>
      <div style={styles.leftLabel}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.7rem',
          fontWeight: '700',
          color: isDark ? '#94a3b8' : '#64748b',
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }}>
          <span style={{ fontSize: '0.85rem' }}>♿</span>
          Clinical Accessibility · WCAG 2.1 AA
        </span>
      </div>

      <div style={styles.controlsGroup}>
        {/* Font Sizing */}
        <div style={{
          ...styles.fontScaleBox,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          border: `1px solid ${theme.borderSubtle || 'rgba(255,255,255,0.08)'}`
        }}>
          <span style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b', marginRight: '6px', fontWeight: '600' }}>
            Text Size:
          </span>
          <button 
            style={{ 
              ...styles.btn, 
              backgroundColor: (fontSizeScale === 'sm' || fontSizeScale === 'xs') ? '#4338CA' : 'transparent', 
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
              backgroundColor: fontSizeScale === 'md' ? '#4338CA' : 'transparent', 
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
              backgroundColor: (fontSizeScale === 'lg' || fontSizeScale === 'xl') ? '#4338CA' : 'transparent', 
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
            fontSize: '0.68rem', 
            fontWeight: '800', 
            color: '#06b6d4', 
            marginLeft: '6px', 
            minWidth: '32px', 
            textAlign: 'center',
            fontFamily: 'monospace'
          }}>
            {fontSizePercent || '100%'}
          </span>
        </div>

        {/* Reduced Motion Toggle */}
        <button 
          style={{ 
            ...styles.toggleBtn, 
            backgroundColor: reducedMotion ? (isDark ? '#1e1b4b' : '#e0e7ff') : 'transparent', 
            color: reducedMotion ? '#4338CA' : theme.text, 
            borderColor: reducedMotion ? '#6366f1' : theme.border 
          }}
          onClick={toggleReducedMotion}
          title="Toggle reduced animations"
        >
          <span>{reducedMotion ? '⏸️ Motion Reduced' : '▶️ Motion Standard'}</span>
        </button>

        {/* Light / Dark Mode Toggle */}
        <button 
          style={{ 
            ...styles.toggleBtn, 
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', 
            color: theme.text, 
            borderColor: theme.border 
          }}
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
