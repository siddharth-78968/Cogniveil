import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ProfileEditModal from './ProfileEditModal';

const Sidebar = ({ onOpenReferral, onOpenEvidenceGraph, onOpenAgentPipeline }) => {
  const { user, logout, isClinician } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
        { label: 'Dementia Type Profiling', path: '/dementia-profiling', icon: 'profiling', isAi: true, badge: 'AI' },
      ]
    },
    {
      group: 'INTELLIGENCE & EVIDENCE',
      items: [
        { label: 'Multimodal Evidence Graph', action: 'evidence_graph', icon: 'graph', isAi: true, badge: 'AI' },
        { label: 'AI Agent Pipeline', action: 'agent_pipeline', icon: 'pipeline', isAi: true, badge: '10 NODES' },
        { label: 'Clinical Referral Report', path: '/referral', icon: 'report', isAi: true, badge: 'AI' },
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

  // Single-weight stroke outline pictogram system inside 24x24 viewBox
  const renderIcon = (type, active) => {
    const iconColor = active
      ? (isDark ? '#c8dbbf' : '#1e331b')
      : (isDark ? '#7a9175' : '#576f53');

    return (
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          backgroundColor: active
            ? (isDark ? 'rgba(163, 177, 138, 0.16)' : 'rgba(39, 56, 34, 0.08)')
            : 'transparent',
          color: iconColor,
          transition: 'all 0.15s ease',
        }}
      >
        {(() => {
          switch (type) {
            case 'grid':
              return (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.25"></rect>
                </svg>
              );
            case 'patients':
              return (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              );
            case 'calendar':
              return (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              );
            case 'battery':
              return (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="m9 14 2 2 4-4"></path>
                </svg>
              );
            case 'waveform':
              return (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10v4"></path>
                  <path d="M8 6v12"></path>
                  <path d="M12 3v18"></path>
                  <path d="M16 7v10"></path>
                  <path d="M20 11v2"></path>
                </svg>
              );
            case 'stethoscope':
              return (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3v6a6 6 0 0 0 12 0V3"></path>
                  <path d="M12 15v4a3 3 0 0 0 6 0v-2"></path>
                  <circle cx="18" cy="17" r="2" fill="currentColor" fillOpacity="0.2"></circle>
                </svg>
              );
            case 'mri':
              return (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"></path>
                  <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="2 2"></line>
                </svg>
              );
            case 'profiling':
              return (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9"></circle>
                  <path d="M12 3v9l6 3"></path>
                  <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.3"></circle>
                </svg>
              );
            case 'graph':
              return (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              );
            case 'pipeline':
              return (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              );
            case 'report':
              return (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              );
            case 'caregivers':
              return (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              );
            case 'shield_check':
              return (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              );
            default:
              return null;
          }
        })()}
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
    <aside
      style={{
        ...styles.sidebar,
        backgroundColor: isDark ? '#0c120d' : '#f2f6f1',
        borderRight: isDark ? '1px solid #1a261c' : '1px solid #d4dfd2',
      }}
    >
      <style>{`
        .cogniveil-sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .cogniveil-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .cogniveil-sidebar-scroll::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(163, 177, 138, 0.2)' : 'rgba(45, 90, 60, 0.16)'};
          border-radius: 4px;
        }
        .cogniveil-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(163, 177, 138, 0.35)' : 'rgba(45, 90, 60, 0.3)'};
        }
        .cogniveil-nav-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 7px 8px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: background-color 0.14s ease, border-color 0.14s ease, color 0.14s ease;
        }
        .cogniveil-nav-btn:hover:not(.active) {
          background-color: ${isDark ? 'rgba(255, 255, 255, 0.045)' : 'rgba(45, 90, 60, 0.055)'} !important;
          color: ${isDark ? '#e6efe4' : '#182916'} !important;
        }
        .cogniveil-nav-btn.active {
          background-color: ${isDark ? 'rgba(163, 177, 138, 0.14)' : 'rgba(45, 90, 60, 0.09)'};
          border-color: ${isDark ? 'rgba(163, 177, 138, 0.22)' : 'rgba(45, 90, 60, 0.14)'};
          color: ${isDark ? '#f1f6ef' : '#132212'};
        }
        .cogniveil-action-btn:hover {
          background-color: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(39, 56, 34, 0.08)'} !important;
          color: ${isDark ? '#f1f5ee' : '#111e10'} !important;
        }
        .cogniveil-logout-btn:hover {
          background-color: rgba(239, 68, 68, 0.12) !important;
          color: #ef4444 !important;
        }
      `}</style>

      {/* Brand Header */}
      <div
        style={{
          ...styles.brandBox,
          borderBottom: isDark ? '1px solid #1a261c' : '1px solid #d4dfd2',
        }}
        onClick={() => navigate('/dashboard')}
        title="CogniVeil Clinical Intelligence"
      >
        <div
          style={{
            ...styles.brandIconWrapper,
            background: isDark
              ? 'linear-gradient(135deg, rgba(163, 177, 138, 0.22) 0%, rgba(163, 177, 138, 0.08) 100%)'
              : 'linear-gradient(135deg, #dbe8d8 0%, #c4d7c0 100%)',
            border: `1px solid ${isDark ? 'rgba(163, 177, 138, 0.28)' : 'rgba(39, 56, 34, 0.2)'}`,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#a3b18a' : '#273822'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"></path>
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"></path>
          </svg>
        </div>
        <div style={styles.brandTextGroup}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ ...styles.brandTitle, color: isDark ? '#f1f5ee' : '#111d10' }}>
              CogniVeil
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: '700',
                letterSpacing: '0.06em',
                padding: '1px 5px',
                borderRadius: '4px',
                backgroundColor: isDark ? 'rgba(163, 177, 138, 0.16)' : '#dce8da',
                color: isDark ? '#c0d4bb' : '#273822',
                border: `1px solid ${isDark ? 'rgba(163, 177, 138, 0.25)' : 'rgba(39, 56, 34, 0.15)'}`,
                lineHeight: '12px',
              }}
            >
              PRO
            </span>
          </div>
          <span style={{ ...styles.brandSub, color: isDark ? '#8fa68c' : '#496345' }}>
            Clinical Intelligence
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="cogniveil-sidebar-scroll" style={styles.navScrollArea}>
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} style={styles.groupContainer}>
            <div style={{ ...styles.groupHeader, color: isDark ? '#6e876a' : '#576f53' }}>
              {group.group}
            </div>
            <nav style={styles.navLinks}>
              {group.items.map((item, iIdx) => {
                const active = item.path ? isActive(item.path) : false;
                return (
                  <button
                    key={iIdx}
                    onClick={() => handleItemClick(item)}
                    className={`cogniveil-nav-btn ${active ? 'active' : ''}`}
                    style={{
                      color: active
                        ? (isDark ? '#f1f6ef' : '#132212')
                        : (isDark ? '#95ab90' : '#455d41'),
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    {/* Active Accent Pillar Indicator */}
                    {active && (
                      <span
                        style={{
                          position: 'absolute',
                          left: '-6px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '3.5px',
                          height: '18px',
                          borderRadius: '2px',
                          backgroundColor: isDark ? '#a3b18a' : '#273822',
                          boxShadow: isDark ? '0 0 6px rgba(163, 177, 138, 0.4)' : 'none',
                        }}
                      />
                    )}

                    {renderIcon(item.icon, active)}

                    <span
                      style={{
                        fontSize: '13px',
                        lineHeight: '18px',
                        letterSpacing: '-0.005em',
                        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                      }}
                    >
                      {item.label}
                    </span>

                    {/* AI / Modality Tag */}
                    {(item.badge || item.isAi) && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: '700',
                          letterSpacing: '0.04em',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          lineHeight: '11px',
                          flexShrink: 0,
                          backgroundColor: active
                            ? (isDark ? 'rgba(163, 177, 138, 0.24)' : 'rgba(39, 56, 34, 0.12)')
                            : (isDark ? 'rgba(163, 177, 138, 0.10)' : 'rgba(39, 56, 34, 0.06)'),
                          color: active
                            ? (isDark ? '#e4ede0' : '#1b2d18')
                            : (isDark ? '#8ca388' : '#556e50'),
                          border: `1px solid ${
                            active
                              ? (isDark ? 'rgba(163,177,138,0.3)' : 'rgba(39,56,34,0.18)')
                              : (isDark ? 'rgba(163,177,138,0.12)' : 'rgba(39,56,34,0.08)')
                          }`,
                        }}
                      >
                        {item.badge || 'AI'}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User Profile & Sign Out Footer */}
      <div
        style={{
          ...styles.userSection,
          borderTop: isDark ? '1px solid #1a261c' : '1px solid #d4dfd2',
          backgroundColor: isDark ? '#0a0f0b' : '#edf3ec',
        }}
      >
        <div
          style={{
            ...styles.userCard,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(45, 90, 60, 0.05)',
            border: `1px solid ${isDark ? '#1f2e20' : 'rgba(45, 90, 60, 0.12)'}`,
          }}
        >
          {/* User Identification Block */}
          <div
            onClick={() => setIsProfileModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              flex: 1,
              minWidth: 0,
              cursor: 'pointer',
              borderRadius: '7px',
              padding: '2px',
            }}
            title="Click to edit clinical account profile"
          >
            {/* Clinician Initial Avatar with Active Surveillance Beacon */}
            <div
              style={{
                ...styles.userAvatar,
                background: isDark
                  ? 'linear-gradient(135deg, #2d3f2a 0%, #1c271b 100%)'
                  : 'linear-gradient(135deg, #273822 0%, #3e5636 100%)',
                border: `1px solid ${isDark ? '#3d5236' : '#273822'}`,
              }}
            >
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
              <span
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '8.5px',
                  height: '8.5px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  border: `2px solid ${isDark ? '#0a0f0b' : '#ffffff'}`,
                  boxShadow: '0 0 4px rgba(16, 185, 129, 0.4)',
                }}
                title="Clinical Surveillance Active"
              />
            </div>

            {/* Name & Role Info */}
            <div style={styles.userInfo}>
              <span style={{ ...styles.userName, color: isDark ? '#f1f5ee' : '#111e10' }}>
                {user?.name || user?.email?.split('@')[0]}
              </span>
              <span style={{ ...styles.userRole, color: isDark ? '#8fa68c' : '#496144' }}>
                {isClinician ? 'Clinician · Neurologist' : 'Monitored Patient'}
              </span>
            </div>
          </div>

          {/* Action Buttons: Edit Profile & Sign Out */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="cogniveil-action-btn"
              style={{
                ...styles.iconActionBtn,
                color: isDark ? '#8fa68c' : '#496144',
              }}
              title="Edit Profile"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="cogniveil-logout-btn"
              style={{
                ...styles.iconActionBtn,
                color: isDark ? '#8fa68c' : '#496144',
              }}
              title="Sign Out"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '290px',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    boxShadow: '1px 0 3px rgba(0, 0, 0, 0.02)',
    flexShrink: 0,
  },
  brandBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '18px 16px 16px 16px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  brandIconWrapper: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
  },
  brandTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  brandTitle: {
    fontSize: '15px',
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeight: '700',
    letterSpacing: '-0.01em',
    lineHeight: '18px',
  },
  brandSub: {
    fontSize: '11px',
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeight: '500',
    letterSpacing: '0.01em',
    lineHeight: '15px',
    marginTop: '1px',
  },
  navScrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 10px 18px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  groupContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  groupHeader: {
    fontSize: '10px',
    fontWeight: '700',
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    letterSpacing: '0.08em',
    padding: '4px 10px 4px 10px',
    textTransform: 'uppercase',
  },
  navLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  userSection: {
    padding: '12px 12px 14px 12px',
    flexShrink: 0,
  },
  userCard: {
    padding: '8px 10px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  userAvatar: {
    width: '35px',
    height: '35px',
    borderRadius: '9px',
    fontWeight: '600',
    fontSize: '13px',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  userInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    lineHeight: '16px',
  },
  userRole: {
    fontSize: '11px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    lineHeight: '14px',
    marginTop: '1px',
  },
  iconActionBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
};

export default Sidebar;
