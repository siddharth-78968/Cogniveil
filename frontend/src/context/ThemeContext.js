import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cogniveil_theme');
    return saved ? saved === 'dark' : true; // default
  });

  const [fontSizeScale, setFontSizeScale] = useState(() => {
    return localStorage.getItem('cogniveil_font_scale') || 'md';
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('cogniveil_high_contrast') === 'true';
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('cogniveil_reduced_motion') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('cogniveil_theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('cogniveil_font_scale', fontSizeScale);
    document.documentElement.setAttribute('data-font-scale', fontSizeScale);
  }, [fontSizeScale]);

  useEffect(() => {
    localStorage.setItem('cogniveil_high_contrast', String(highContrast));
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('cogniveil_reduced_motion', String(reducedMotion));
    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [reducedMotion]);

  const toggleTheme = () => setIsDark(prev => !prev);
  const toggleHighContrast = () => setHighContrast(prev => !prev);
  const toggleReducedMotion = () => setReducedMotion(prev => !prev);

  const theme = {
    isDark,
    highContrast,
    reducedMotion,
    fontSizeScale,
    bg: isDark ? '#0a0f16' : '#FAF7F2',
    cardBg: isDark ? '#121d2b' : '#FFFFFF',
    cardHeaderBg: isDark ? '#162436' : '#FAF7F2',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EAE2D8',
    borderSubtle: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F2EBE1',
    text: isDark ? '#f1f5f9' : '#1C1917',
    subtext: isDark ? '#94a3b8' : '#78716C',
    statBoxBg: isDark ? '#101824' : '#FFFFFF',
    inputBg: isDark ? '#0a0f16' : '#FFFFFF',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : '#EAE2D8',
    topHeaderBg: isDark ? 'rgba(10, 15, 22, 0.95)' : 'rgba(250, 247, 242, 0.95)',
    topHeaderBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EAE2D8',
    tableTh: isDark ? '#94a3b8' : '#78716C',
    tableTrBorder: isDark ? 'rgba(255, 255, 255, 0.06)' : '#EAE2D8',
    tableTd: isDark ? '#f1f5f9' : '#1C1917',
    chartGrid: isDark ? 'rgba(255, 255, 255, 0.05)' : '#EAE2D8',
    chartText: isDark ? '#94a3b8' : '#78716C',
    sidebarBg: isDark ? '#070d14' : '#FAF7F2',
    primaryTeal: isDark ? '#0d9488' : '#0284C7',
    secondaryTeal: isDark ? '#22d3ee' : '#56B4D3',
    aiCyan: isDark ? '#22d3ee' : '#0284C7',
    statusNormal: isDark ? '#10b981' : '#15803D',
    statusNormalBg: isDark ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4',
    statusMonitor: isDark ? '#f59e0b' : '#B45309',
    statusMonitorBg: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
    statusElevated: isDark ? '#f97316' : '#C2410C',
    statusElevatedBg: isDark ? 'rgba(249, 115, 22, 0.12)' : '#FFF7ED',
    statusHighRisk: isDark ? '#f43f5e' : '#BE123C',
    statusHighRiskBg: isDark ? 'rgba(244, 63, 94, 0.12)' : '#FFF1F2',
  };

  return (
    <ThemeContext.Provider value={{
      isDark,
      toggleTheme,
      fontSizeScale,
      setFontSizeScale,
      highContrast,
      toggleHighContrast,
      reducedMotion,
      toggleReducedMotion,
      theme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
