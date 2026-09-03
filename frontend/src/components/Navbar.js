import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const renderNavIcon = (path) => {
    switch (path) {
      case '/dashboard':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
        );
      case '/tests':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" />
          </svg>
        );
      case '/voice':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        );
      case '/care-circle':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case '/level2':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        );
      case '/level3':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
          </svg>
        );
      default:
        return null;
    }
  };

  const navLinks = [
    { path: '/dashboard', label: 'Workstation' },
    { path: '/tests', label: 'Daily Tests' },
    { path: '/voice', label: 'Voice Journal' },
    { path: '/care-circle', label: 'Care Circle' },
    { path: '/level2', label: 'Tier 2 Biomarkers' },
    { path: '/level3', label: 'Tier 3 MRI' },
  ];

  return (
    <nav style={{
      ...styles.nav,
      backgroundColor: theme.topHeaderBg,
      borderBottom: `1px solid ${theme.topHeaderBorder}`,
      boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.03)'
    }}>
      <div style={styles.inner}>
        <div style={styles.logo} onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}>
          <div style={{ ...styles.logoBadge, backgroundColor: isDark ? '#1e1b4b' : '#E0F2FE', borderColor: isDark ? '#312e81' : '#BAE6FD' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#818cf8' : '#0284C7'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z"></path>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z"></path>
            </svg>
          </div>
          <span style={{ ...styles.logoText, color: isDark ? '#818cf8' : '#1C1917' }}>CogniVeil</span>
        </div>

        {/* Desktop links */}
        {user && (
          <div className="desktop-links" style={styles.links}>
            {navLinks.map((item) => {
              const active = isActive(item.path);
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  style={{
                    ...styles.link,
                    color: active ? (isDark ? '#818cf8' : '#0284C7') : theme.subtext,
                    backgroundColor: active ? (isDark ? '#1e1b4b' : '#E0F2FE') : 'transparent',
                    fontWeight: active ? '700' : '600',
                  }}
                >
                  <span style={styles.linkIcon}>{renderNavIcon(item.path)}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Desktop right */}
        <div className="desktop-links" style={styles.right}>
          {/* Dark / Light Mode Toggle Button */}
          <button 
            style={{ 
              ...styles.themeToggleBtn, 
              backgroundColor: isDark ? '#18223a' : '#FFFFFF', 
              border: `1px solid ${theme.border}`,
            }}
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDark ? (
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          {user ? (
            <>
              <div style={{ ...styles.userBadge, backgroundColor: isDark ? '#18223a' : '#FFFFFF', border: `1px solid ${theme.border}` }}>
                <div style={{ ...styles.userAvatar, backgroundColor: isDark ? '#4338CA' : '#FED7AA', color: isDark ? '#FFFFFF' : '#9A3412' }}>
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <div style={styles.userInfo}>
                  <span style={{ ...styles.userName, color: theme.text }}>{user.name || user.email.split('@')[0]}</span>
                  <span style={{ ...styles.userRole, color: theme.subtext }}>{user.is_caregiver ? 'Caregiver' : 'Patient'}</span>
                </div>
              </div>
              <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ ...styles.loginLink, color: isDark ? '#818cf8' : '#0284C7' }}>Sign In</Link>
              <Link to="/register" style={{ ...styles.registerLink, backgroundColor: isDark ? '#0284C7' : '#56B4D3', color: isDark ? '#FFFFFF' : '#0F2942' }}>
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="hamburger-btn" style={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div style={{ ...styles.mobileMenu, backgroundColor: theme.cardBg, borderTop: `1px solid ${theme.border}` }}>
          {user && navLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              style={{
                ...styles.mobileLink,
                color: isActive(item.path) ? (isDark ? '#818cf8' : '#0284C7') : theme.subtext,
                backgroundColor: isActive(item.path) ? (isDark ? '#1e1b4b' : '#E0F2FE') : 'transparent',
              }}
            >
              {renderNavIcon(item.path)}
              {item.label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} style={styles.mobileLogout}>Sign Out</button>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} style={styles.mobileLink}>Sign In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} style={styles.mobileLink}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    width: '100%',
    backdropFilter: 'blur(12px)',
    transition: 'all 0.2s ease',
  },
  inner: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0.65rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    userSelect: 'none',
  },
  logoBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '1.15rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    textDecoration: 'none',
    padding: '0.45rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    transition: 'all 0.15s ease',
  },
  linkIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  themeToggleBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    padding: '0.35rem 0.75rem',
    borderRadius: '10px',
  },
  userAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    fontSize: '0.78rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '0.82rem',
    fontWeight: '700',
    lineHeight: 1.2,
  },
  userRole: {
    fontSize: '0.68rem',
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    color: '#E11D48',
    border: '1.5px solid rgba(225, 29, 72, 0.3)',
    padding: '0.45rem 0.9rem',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  loginLink: {
    textDecoration: 'none',
    fontSize: '0.88rem',
    fontWeight: '700',
  },
  registerLink: {
    textDecoration: 'none',
    padding: '0.5rem 1.1rem',
    borderRadius: '8px',
    fontSize: '0.88rem',
    fontWeight: '700',
  },
  hamburger: {
    display: 'none',
    backgroundColor: 'transparent',
    border: '1px solid #EAE2D8',
    color: '#1C1917',
    fontSize: '1.2rem',
    padding: '0.4rem 0.6rem',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  mobileMenu: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  mobileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    textDecoration: 'none',
    fontSize: '0.92rem',
    fontWeight: '600',
    padding: '0.75rem',
    borderRadius: '8px',
  },
  mobileLogout: {
    backgroundColor: '#FFE4E6',
    color: '#BE123C',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '8px',
    fontSize: '0.88rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
};

export default Navbar;
