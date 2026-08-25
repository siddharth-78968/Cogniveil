import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DoctorLayout = ({ children, activeTitle = 'Dashboard', actionButton, onOpenReferral }) => {
  const { user } = useAuth();
  const { isDark, toggleTheme, theme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // If normal user (patient), show standard clean top navigation without sidebar
  if (!user?.is_caregiver) {
    return (
      <div style={{ ...styles.patientWrapper, backgroundColor: theme.bg, color: theme.text }}>
        <Navbar />
        <main style={styles.patientContentContainer}>
          {children}
        </main>
      </div>
    );
  }

  // Caregiver / Doctor supervisor view with the royal indigo Sidebar
  return (
    <div style={{ ...styles.layoutWrapper, backgroundColor: theme.bg, color: theme.text }}>
      {/* 1. Left Sidebar */}
      <Sidebar onOpenReferral={onOpenReferral} />

      {/* 2. Main Viewport */}
      <div style={styles.mainViewport}>
        {/* Top Header Bar */}
        <header style={{ ...styles.topHeader, backgroundColor: theme.topHeaderBg, borderBottom: `1px solid ${theme.topHeaderBorder}` }}>
          {/* Search Input */}
          <div style={{ ...styles.searchBox, backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search patient records, biomarkers, cognitive tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...styles.searchInput, color: theme.text }}
            />
          </div>

          {/* Top Actions: Theme Toggle + Notifications + Primary Button */}
          <div style={styles.headerRightActions}>
            
            {/* Dark / Light Mode Toggle Button (Vector SVG, No Emoji) */}
            <button 
              style={{ 
                ...styles.themeToggleBtn, 
                backgroundColor: theme.cardBg, 
                border: `1px solid ${theme.border}`,
                color: isDark ? '#fbbf24' : '#4338CA'
              }}
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                /* Sun SVG */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                /* Moon SVG */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>

            {/* Notification Bell */}
            <button 
              style={{ ...styles.notificationBtn, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }} 
              title="Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span style={styles.notificationDot} />
            </button>

            {/* Make Appointment / Primary CTA */}
            {actionButton ? (
              actionButton
            ) : (
              <button 
                style={styles.primaryActionButton}
                onClick={() => navigate('/tests')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Take Daily Test</span>
              </button>
            )}
          </div>
        </header>

        {/* Page Content Container */}
        <main style={styles.contentContainer}>
          {children}
        </main>
      </div>
    </div>
  );
};

const styles = {
  layoutWrapper: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
    overflowX: 'hidden',
    transition: 'background-color 0.25s ease, color 0.25s ease',
  },
  mainViewport: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  topHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.1rem 2rem',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    gap: '1.5rem',
    transition: 'background-color 0.25s ease, border-color 0.25s ease',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderRadius: '12px',
    padding: '0.65rem 1.1rem',
    width: '100%',
    maxWidth: '460px',
    transition: 'all 0.2s ease',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.86rem',
    width: '100%',
    fontFamily: 'inherit',
  },
  headerRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexShrink: 0,
  },
  themeToggleBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  notificationBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
  },
  notificationDot: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
  },
  primaryActionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#4338CA', // Royal Indigo CTA
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '0.65rem 1.25rem',
    fontSize: '0.86rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
    transition: 'transform 0.15s ease, background-color 0.2s ease',
  },
  contentContainer: {
    padding: '1.75rem 2rem 3rem 2rem',
    flex: 1,
  },
  patientWrapper: {
    minHeight: '100vh',
    fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
    transition: 'background-color 0.25s ease, color 0.25s ease',
  },
  patientContentContainer: {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '2rem 1.5rem 4rem 1.5rem',
  },
};

export default DoctorLayout;
