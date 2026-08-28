import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';
import AccessibilityBar from './AccessibilityBar';

const DoctorLayout = ({ children, activeTitle = 'Dashboard', actionButton, onOpenReferral, onOpenEvidenceGraph, onOpenAgentPipeline }) => {
  const { isDark, theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Unified Clinical Intelligence Workstation Shell for all authenticated users
  return (
    <div style={{ ...styles.layoutWrapper, backgroundColor: theme.bg, color: theme.text }}>
      {/* 1. Left Clinical Sidebar (Grouped Navigation) */}
      <Sidebar 
        onOpenReferral={onOpenReferral} 
        onOpenEvidenceGraph={onOpenEvidenceGraph} 
        onOpenAgentPipeline={onOpenAgentPipeline} 
      />

      {/* 2. Main Viewport */}
      <div style={styles.mainViewport}>
        {/* Accessibility Bar */}
        <AccessibilityBar />

        {/* Top Header Bar */}
        <header style={{ ...styles.topHeader, backgroundColor: theme.topHeaderBg, borderBottom: `1px solid ${theme.topHeaderBorder}` }}>
          {/* Search Input */}
          <div style={{ ...styles.searchBox, backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#9FB3C8' : '#627D98'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

          {/* Top Actions */}
          <div style={styles.headerRightActions}>
            <button 
              onClick={onOpenEvidenceGraph}
              style={{ ...styles.graphBtn, backgroundColor: theme.cardBg, borderColor: theme.border, color: '#0F4C4A' }}
              title="View Multimodal Signal Topology"
            >
              🕸️ Evidence Graph
            </button>

            <button 
              onClick={onOpenAgentPipeline}
              style={{ ...styles.graphBtn, backgroundColor: theme.cardBg, borderColor: theme.border, color: '#287C78' }}
              title="View 10-Node Agent Execution Pipeline"
            >
              ⚡ 10-Agent Pipeline
            </button>

            {/* Notification Bell */}
            <button 
              style={{ ...styles.notificationBtn, backgroundColor: theme.cardBg, border: `1px solid ${theme.border}` }} 
              title="Clinical Priority Notifications"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#9FB3C8' : '#627D98'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span style={styles.notificationDot} />
            </button>

            {actionButton ? actionButton : null}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main style={styles.mainContent}>
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
    width: '100vw',
    overflowX: 'hidden',
  },
  mainViewport: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflowY: 'auto',
  },
  topHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 2rem',
    position: 'sticky',
    top: 0,
    zIndex: 40,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    padding: '0.5rem 1rem',
    borderRadius: '10px',
    width: '420px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '0.84rem',
    width: '100%',
  },
  headerRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  graphBtn: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '0.45rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  notificationBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: '7px',
    right: '8px',
    width: '7px',
    height: '7px',
    backgroundColor: '#D97745',
    borderRadius: '50%',
  },
  mainContent: {
    flex: 1,
    padding: '2rem',
    maxWidth: '1320px',
    width: '100%',
  }
};

export default DoctorLayout;
