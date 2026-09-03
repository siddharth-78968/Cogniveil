import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const FONT_SCALES = ['xs', 'sm', 'md', 'lg', 'xl'];

const FONT_SIZES_PX = {
  xs: 12,
  sm: 13.5,
  md: 15,
  lg: 17.5,
  xl: 20.5
};

const FONT_PERCENTAGES = {
  xs: '80%',
  sm: '90%',
  md: '100%',
  lg: '115%',
  xl: '135%'
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cogniveil_theme');
    return saved ? saved === 'dark' : true; // default
  });

  const [fontSizeScale, setFontSizeScale] = useState(() => {
    return localStorage.getItem('cogniveil_font_scale') || 'md';
  });

  const decreaseFontSize = () => {
    setFontSizeScale(prev => {
      const idx = FONT_SCALES.indexOf(prev);
      if (idx > 0) return FONT_SCALES[idx - 1];
      return FONT_SCALES[0];
    });
  };

  const increaseFontSize = () => {
    setFontSizeScale(prev => {
      const idx = FONT_SCALES.indexOf(prev);
      if (idx !== -1 && idx < FONT_SCALES.length - 1) return FONT_SCALES[idx + 1];
      if (idx === -1) return 'lg';
      return FONT_SCALES[FONT_SCALES.length - 1];
    });
  };

  const resetFontSize = () => {
    setFontSizeScale('md');
  };

  const fontSizePercent = FONT_PERCENTAGES[fontSizeScale] || '100%';

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
    const targetPx = FONT_SIZES_PX[fontSizeScale] || 15;
    document.documentElement.style.fontSize = `${targetPx}px`;
    document.body.style.fontSize = `${targetPx}px`;
    document.documentElement.style.setProperty('--cv-base-font-size', `${targetPx}px`);
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

  const theme = highContrast ? {
    isDark: true,
    highContrast: true,
    reducedMotion,
    fontSizeScale,
    bg: '#000000',
    cardBg: '#0D0D0D',
    cardHeaderBg: '#171717',
    border: '#FFFFFF',
    borderSubtle: '#FFFFFF',
    text: '#FFFFFF',
    subtext: '#FFFF00',
    statBoxBg: '#000000',
    inputBg: '#000000',
    inputBorder: '#FFFFFF',
    topHeaderBg: '#000000',
    topHeaderBorder: '#FFFFFF',
    tableTh: '#FFFF00',
    tableTrBorder: '#FFFFFF',
    tableTd: '#FFFFFF',
    chartGrid: '#FFFFFF',
    chartText: '#FFFFFF',
    sidebarBg: '#000000',
    primaryTeal: '#00FFFF',
    secondaryTeal: '#FFFF00',
    aiCyan: '#00FFFF',
    statusNormal: '#00FF00',
    statusMonitor: '#FFFF00',
    statusElevated: '#FFA500',
    statusHighRisk: '#FF3333',
  } : {
    isDark,
    highContrast: false,
    reducedMotion,
    fontSizeScale,
    bg: isDark ? '#0b100c' : '#f2f6f1',
    cardBg: isDark ? '#121813' : '#ffffff',
    cardHeaderBg: isDark ? '#162018' : '#eaf1e8',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#d2ded0',
    borderSubtle: isDark ? 'rgba(255, 255, 255, 0.04)' : '#e2ece0',
    text: isDark ? '#f1f5ee' : '#0d170e',
    subtext: isDark ? '#a3b18a' : '#475e43',
    statBoxBg: isDark ? '#141c15' : '#f8faf7',
    inputBg: isDark ? '#0e140f' : '#ffffff',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : '#d2ded0',
    topHeaderBg: isDark ? 'rgba(11, 16, 12, 0.95)' : 'rgba(242, 246, 241, 0.95)',
    topHeaderBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#d2ded0',
    tableTh: isDark ? '#a3b18a' : '#475e43',
    tableTrBorder: isDark ? 'rgba(255, 255, 255, 0.06)' : '#d2ded0',
    tableTd: isDark ? '#f1f5ee' : '#0d170e',
    chartGrid: isDark ? 'rgba(255, 255, 255, 0.05)' : '#d2ded0',
    chartText: isDark ? '#a3b18a' : '#475e43',
    sidebarBg: isDark ? '#0b100c' : '#e9efe8',
    primaryTeal: isDark ? '#3d5236' : '#273822',
    secondaryTeal: isDark ? '#526e49' : '#3d5236',
    aiCyan: isDark ? '#a3b18a' : '#273822',
    statusNormal: isDark ? '#a3b18a' : '#3d5236',
    statusNormalBg: isDark ? 'rgba(163, 177, 138, 0.14)' : '#e8efe6',
    statusMonitor: isDark ? '#c5b083' : '#705c30',
    statusMonitorBg: isDark ? 'rgba(197, 176, 131, 0.14)' : '#f5f0e4',
    statusElevated: isDark ? '#d48b70' : '#8c4b32',
    statusElevatedBg: isDark ? 'rgba(212, 139, 112, 0.14)' : '#f7ede8',
    statusHighRisk: isDark ? '#d9777f' : '#943840',
    statusHighRiskBg: isDark ? 'rgba(217, 119, 127, 0.14)' : '#faebec',
    recalculateBtnBg: isDark ? '#273822' : '#eaf1e8',
    recalculateBtnBorder: isDark ? '#3d5236' : '#d2ded0',
    recalculateBtnText: isDark ? '#f1f5ee' : '#0d170e',
  };


  return (
    <ThemeContext.Provider value={{
      isDark,
      toggleTheme,
      fontSizeScale,
      setFontSizeScale,
      decreaseFontSize,
      increaseFontSize,
      resetFontSize,
      fontSizePercent,
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
