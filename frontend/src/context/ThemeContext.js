import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cogniveil_theme');
    return saved ? saved === 'dark' : false;
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
    } else {
      document.documentElement.classList.remove('dark-mode');
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
    bg: isDark ? '#0A141D' : '#F7F9F8',
    cardBg: isDark ? '#10202E' : '#FFFFFF',
    cardHeaderBg: isDark ? '#162B3D' : '#FFFFFF',
    border: isDark ? '#1E3A52' : '#DCE6E4',
    borderSubtle: isDark ? '#172D40' : '#E8F0EE',
    text: isDark ? '#F0F4F8' : '#102A43',
    subtext: isDark ? '#9FB3C8' : '#627D98',
    statBoxBg: isDark ? '#162B3D' : '#F0F5F4',
    inputBg: isDark ? '#162B3D' : '#FFFFFF',
    inputBorder: isDark ? '#1E3A52' : '#DCE6E4',
    topHeaderBg: isDark ? '#10202E' : '#FFFFFF',
    topHeaderBorder: isDark ? '#1E3A52' : '#DCE6E4',
    tableTh: isDark ? '#9FB3C8' : '#627D98',
    tableTrBorder: isDark ? '#172D40' : '#E8F0EE',
    tableTd: isDark ? '#E0FCFF' : '#102A43',
    chartGrid: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E8F0EE',
    chartText: isDark ? '#9FB3C8' : '#627D98',
    sidebarBg: isDark ? '#081119' : '#0F4C4A',
    primaryTeal: '#0F4C4A',
    secondaryTeal: '#287C78',
    aiCyan: '#53B7C5',
    statusNormal: '#2F7D5B',
    statusMonitor: '#C8922E',
    statusElevated: '#D97745',
    statusHighRisk: '#C94C4C',
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
