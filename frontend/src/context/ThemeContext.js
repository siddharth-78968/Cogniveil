import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cogniveil_theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    localStorage.setItem('cogniveil_theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const theme = {
    isDark,
    bg: isDark ? '#0b0f19' : '#f4f6fc',
    cardBg: isDark ? '#131b2e' : '#ffffff',
    cardHeaderBg: isDark ? '#172138' : '#ffffff',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#eef2f6',
    borderSubtle: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
    text: isDark ? '#f8fafc' : '#1e293b',
    subtext: isDark ? '#94a3b8' : '#64748b',
    statBoxBg: isDark ? '#18223a' : '#f8fafc',
    inputBg: isDark ? '#18223a' : '#f8fafc',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
    topHeaderBg: isDark ? '#131b2e' : '#ffffff',
    topHeaderBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#eef2f6',
    tableTh: isDark ? '#64748b' : '#94a3b8',
    tableTrBorder: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
    tableTd: isDark ? '#cbd5e1' : '#475569',
    chartGrid: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
    chartText: isDark ? '#64748b' : '#94a3b8',
    sidebarBg: isDark ? '#1e1b4b' : '#4338CA',
    recalculateBtnBg: isDark ? '#1e293b' : '#f5f3ff',
    recalculateBtnBorder: isDark ? '#312e81' : '#c7d2fe',
    recalculateBtnText: isDark ? '#818cf8' : '#4338CA',
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
