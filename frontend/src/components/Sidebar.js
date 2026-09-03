import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ onOpenReferral, onOpenEvidenceGraph, onOpenAgentPipeline }) => {
  const { user, logout, isClinician } = useAuth();
  const { isDark, theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Role-Specific Navigation Groups
  const clinicianNavGroups = [
    {
      group: 'CLINICAL OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: 'grid' },
        { label: 'Patients Directory', path: '/patients', icon: 'patients' },
        { label: 'Appointments', path: '/appointments', icon: 'calendar' },
      ]
    },
    {
      group: 'ASSESSMENT & SCREENING',
      items: [
        { label: 'Tier 2 Clinical ML', path: '/level2', icon: 'stethoscope' },
        { label: 'Tier 3 MRI Scans', path: '/level3', icon: 'mri' },
        { label: 'Dementia Type Profiling', path: '/dementia-profiling', icon: 'profiling', isAi: true },
      ]
    },
    {
      group: 'INTELLIGENCE & EVIDENCE',
      items: [
        { label: 'Multimodal Evidence Graph', action: 'evidence_graph', icon: 'graph', isAi: true },
        { label: 'AI Agent Pipeline (10 Nodes)', action: 'agent_pipeline', icon: 'pipeline', isAi: true },
        { label: 'Clinical Referral Report', path: '/referral', icon: 'report', isAi: true },
      ]
    },
    {
      group: 'GOVERNANCE & CARE CIRCLE',
      items: [
        { label: 'Care Circle & Telemetry', path: '/care-circle', icon: 'caregivers' },
        { label: 'Consent & Privacy', path: '/consent', icon: 'shield_check' },
      ]
    }
  ];

  const patientNavGroups = [
    {
      group: 'MY OVERVIEW',
      items: [
        { label: 'My Dashboard', path: '/dashboard', icon: 'grid' },
        { label: 'My Appointments', path: '/appointments', icon: 'calendar' },
      ]
    },
    {
      group: 'DAILY SCREENING & HEALTH',
      items: [
        { label: 'Daily Cognitive Battery', path: '/tests', icon: 'battery' },
        { label: 'Acoustic Voice Journal', path: '/voice', icon: 'waveform' },
        { label: 'Health Assessment (Tier 2)', path: '/level2', icon: 'stethoscope' },
        { label: 'My MRI Results (Tier 3)', path: '/level3', icon: 'mri' },
      ]
    },
    {
      group: 'CARE & PRIVACY',
      items: [
        { label: 'Care Circle & Telemetry', path: '/care-circle', icon: 'caregivers' },
        { label: 'Consent & Privacy', path: '/consent', icon: 'shield_check' },
      ]
    }
  ];

  const navGroups = isClinician ? clinicianNavGroups : patientNavGroups;


  // 1.5px single-weight stroke outline pictogram system inside 24x24 viewBox
  const renderIcon = (type, isAi) => {
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {(() => {
          switch (type) {
            case 'grid':
              return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.25"></rect>
                </svg>
              );
            case 'patients':
              return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              );
            case 'calendar':
              return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              );


            case 'battery':
              return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="m9 14 2 2 4-4"></path>
                </svg>
              );
            case 'waveform':
              return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10v4"></path>
                  <path d="M8 6v12"></path>
                  <path d="M12 3v18"></path>
                  <path d="M16 7v10"></path>
                  <path d="M20 11v2"></path>
                </svg>
              );
            case 'stethoscope':
              return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3v6a6 6 0 0 0 12 0V3"></path>
                  <path d="M12 15v4a3 3 0 0 0 6 0v-2"></path>
                  <circle cx="18" cy="17" r="2" fill="currentColor" fillOpacity="0.2"></circle>
                </svg>
              );
            case 'mri':
              return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"></path>
                  <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="2 2"></line>
                </svg>
              );
            case 'profiling':
              return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9"></circle>
                  <path d="M12 3v9l6 3"></path>
                  <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.3"></circle>
                </svg>
              );
            case 'graph':
              return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              );
            case 'pipeline':
              return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              );
            case 'report':
              return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              );
            case 'caregivers':
              return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              );
            case 'shield_check':
              return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              );
            default:
              return null;
          }
        })()}
        {/* Subtle AI-provenance dot */}
        {isAi && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: isDark ? '#a3b18a' : '#273822',
            boxShadow: isDark ? '0 0 4px #a3b18a' : '0 0 4px #273822'
          }} />
        )}
      </div>
    );
  };

  const handleItemClick = (item) => {
    if (item.action === 'referral_modal') {
      if (onOpenReferral) onOpenReferral();
    } else if (item.action === 'evidence_graph') {
      if (onOpenEvidenceGraph) onOpenEvidenceGraph();
    } else if (item.action === 'agent_pipeline') {
      if (onOpenAgentPipeline) onOpenAgentPipeline();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <aside style={{ 
      ...styles.sidebar, 
      backgroundColor: isDark ? '#0b100c' : '#f2f6f1',
      borderRight: `1px solid ${theme.border}`
    }}>
      {/* Brand Header */}
      <div style={{ ...styles.brandBox, borderBottom: `1px solid ${theme.border}` }} onClick={() => navigate('/dashboard')}>
        <div style={{
          ...styles.brandIconWrapper,
          backgroundColor: isDark ? 'rgba(163, 177, 138, 0.14)' : 'rgba(39, 56, 34, 0.08)'
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#a3b18a' : '#273822'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"></path>
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"></path>
          </svg>
        </div>
        <div style={styles.brandTextGroup}>
          <span style={{ ...styles.brandTitle, color: theme.text }}>COGNIVEIL</span>
          <span style={{ ...styles.brandSub, color: theme.subtext }}>Clinical Intelligence</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div style={styles.navScrollArea}>
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} style={styles.groupContainer}>
            <div style={{ ...styles.groupHeader, color: theme.subtext }}>{group.group}</div>
            <nav style={styles.navLinks}>
              {group.items.map((item, iIdx) => {
                const active = item.path ? isActive(item.path) : false;
                return (
                  <button
                    key={iIdx}
                    onClick={() => handleItemClick(item)}
                    style={{
                      ...styles.navItem,
                      backgroundColor: active 
                        ? (isDark ? 'rgba(163, 177, 138, 0.14)' : 'rgba(39, 56, 34, 0.08)') 
                        : 'transparent',
                      color: active 
                        ? (isDark ? '#f1f5ee' : '#142213') 
                        : (isDark ? '#a3b18a' : '#3d5236'),
                      borderLeft: active 
                        ? (isDark ? '3px solid #a3b18a' : '3px solid #273822') 
                        : '3px solid transparent',
                    }}
                  >
                    <span style={{ 
                      ...styles.iconSpan, 
                      color: active 
                        ? (isDark ? '#a3b18a' : '#273822') 
                        : (isDark ? '#5c7057' : '#5e7458') 
                    }}>
                      {renderIcon(item.icon, item.isAi)}
                    </span>
                    <span style={{ 
                      fontSize: '0.82rem', 
                      fontWeight: active ? '700' : '500',
                      fontFamily: "'Mulish', -apple-system, BlinkMacSystemFont, sans-serif"
                    }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User Profile & Sign Out */}
      <div style={{ ...styles.userSection, borderTop: `1px solid ${theme.border}` }}>
        <div style={styles.userCard}>
          <div style={{
            ...styles.userAvatar,
            backgroundColor: isDark ? 'rgba(163, 177, 138, 0.15)' : '#e2ece0',
            color: isDark ? '#f1f5ee' : '#1a2919',
            border: `1px solid ${theme.border}`
          }}>
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div style={styles.userInfo}>
            <span style={{ ...styles.userName, color: theme.text }}>{user?.name || user?.email?.split('@')[0]}</span>
            <span style={{ ...styles.userRole, color: theme.subtext }}>
              {isClinician ? 'Clinician / Neurologist' : 'Monitored Patient'}
            </span>
          </div>
          <button 
            onClick={handleLogout} 
            style={{ ...styles.logoutBtn, color: theme.subtext }} 
            title="Sign Out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  brandBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1.25rem 1.25rem 1rem 1.25rem',
    cursor: 'pointer',
  },
  brandIconWrapper: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: '1rem',
    fontWeight: '900',
    letterSpacing: '0.08em',
  },
  brandSub: {
    fontSize: '0.68rem',
    fontWeight: '600',
    letterSpacing: '0.02em',
  },
  navScrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.75rem 0',
  },
  groupContainer: {
    marginBottom: '1rem',
  },
  groupHeader: {
    fontSize: '0.65rem',
    fontWeight: '800',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.08em',
    padding: '0 1.25rem',
    marginBottom: '0.35rem',
    textTransform: 'uppercase',
  },
  navLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.55rem 1.25rem',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  iconSpan: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userSection: {
    padding: '0.85rem 1.25rem',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    fontWeight: '800',
    fontSize: '0.82rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'JetBrains Mono', monospace",
  },
  userInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  userName: {
    fontSize: '0.78rem',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: '0.68rem',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};

export default Sidebar;
