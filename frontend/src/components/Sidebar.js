import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ onOpenReferral }) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'grid' },
    { label: 'Daily Tests', path: '/tests', icon: 'appointment' },
    { label: 'Care Circle', path: '/care-circle', icon: 'patients' },
    { label: 'Voice Journal', path: '/voice', icon: 'messages' },
    { label: 'Tier 2 Biomarkers', path: '/level2', icon: 'medications' },
    { label: 'Tier 3 MRI Scans', path: '/level3', icon: 'documents' },
    { label: 'Informed Consent', path: '/consent', icon: 'settings' },
  ];

  const renderIcon = (type) => {
    switch (type) {
      case 'grid':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
          </svg>
        );
      case 'appointment':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        );
      case 'patients':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      case 'messages':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        );
      case 'medications':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path>
            <path d="m8.5 8.5 7 7"></path>
          </svg>
        );
      case 'documents':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        );
      case 'settings':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <aside style={{ ...styles.sidebar, backgroundColor: theme.sidebarBg }}>
      {/* Brand Header */}
      <div style={styles.brandBox} onClick={() => navigate('/dashboard')}>
        <div style={styles.brandIconWrapper}>
          {/* Crisp Vector Brain / Neural Node Icon (No Emoji) */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z"></path>
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z"></path>
          </svg>
        </div>
        <div style={styles.brandText}>
          <h2 style={styles.brandTitle}>Doctor App</h2>
          <span style={styles.brandSub}>CogniVeil Clinical</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              style={{
                ...styles.navItem,
                backgroundColor: active ? '#ffffff' : 'transparent',
                color: active ? '#4338CA' : '#ffffffcc',
                fontWeight: active ? '700' : '500',
                boxShadow: active ? '0 4px 15px rgba(0, 0, 0, 0.12)' : 'none',
              }}
              onClick={() => navigate(item.path)}
            >
              <span style={{
                ...styles.navIcon,
                color: active ? '#4338CA' : '#ffffffaa'
              }}>
                {renderIcon(item.icon)}
              </span>
              <span style={styles.navLabel}>{item.label}</span>
              {active && <span style={styles.activeIndicator} />}
            </button>
          );
        })}
      </nav>

      {/* Referral Quick Action */}
      {onOpenReferral && (
        <div style={styles.referralCallout}>
          <button style={styles.referralBtn} onClick={onOpenReferral}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <span>Export Referral PDF</span>
          </button>
        </div>
      )}

      {/* Footer / User Profile & Logout */}
      <div style={styles.footer}>
        <div style={styles.userProfileRow}>
          <div style={styles.avatar}>
            {user?.name ? user.name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'U')}
          </div>
          <div style={styles.userInfo}>
            <p style={styles.userName}>{user?.name || user?.email?.split('@')[0] || 'Clinician'}</p>
            <p style={styles.userRole}>{user?.is_caregiver ? 'Caregiver' : 'Patient / Doctor'}</p>
          </div>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout} title="Sign Out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '250px',
    minWidth: '250px',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    padding: '1.5rem 1.1rem',
    color: '#ffffff',
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
    zIndex: 50,
    transition: 'background-color 0.25s ease',
  },
  brandBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0.5rem 1.75rem 0.5rem',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
    marginBottom: '1.25rem',
  },
  brandIconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  brandText: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  brandSub: {
    fontSize: '0.72rem',
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    flex: 1,
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.88rem',
    textAlign: 'left',
    position: 'relative',
    transition: 'all 0.2s ease',
    width: '100%',
  },
  navIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease',
  },
  navLabel: {
    flex: 1,
    letterSpacing: '0.01em',
  },
  activeIndicator: {
    width: '4px',
    height: '18px',
    borderRadius: '4px',
    backgroundColor: '#4338CA',
  },
  referralCallout: {
    margin: '1rem 0',
  },
  referralBtn: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    color: '#ffffff',
    borderRadius: '10px',
    padding: '0.65rem 0.85rem',
    fontSize: '0.8rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  footer: {
    borderTop: '1px solid rgba(255, 255, 255, 0.12)',
    paddingTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  userProfileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.25rem',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.95rem',
    border: '1.5px solid rgba(255, 255, 255, 0.3)',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  userName: {
    margin: 0,
    fontSize: '0.84rem',
    fontWeight: '700',
    color: '#ffffff',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  userRole: {
    margin: 0,
    fontSize: '0.7rem',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    border: 'none',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.85)',
    padding: '0.5rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }
};

export default Sidebar;
