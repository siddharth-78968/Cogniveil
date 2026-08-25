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
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const renderNavIcon = (path) => {
    switch (path) {
      case '/dashboard':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
          </svg>
        );
      case '/tests':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        );
      case '/voice':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        );
      case '/care-circle':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      case '/level2':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path>
            <path d="m8.5 8.5 7 7"></path>
          </svg>
        );
      case '/level3':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        );
      default:
        return null;
    }
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
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
      boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.03)'
    }}>
      <div style={styles.inner}>
        <div style={styles.logo} onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}>
          <div style={{ ...styles.logoBadge, backgroundColor: isDark ? '#1e1b4b' : '#f5f3ff', borderColor: isDark ? '#312e81' : '#c7d2fe' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z"></path>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z"></path>
            </svg>
          </div>
          <span style={{ ...styles.logoText, color: isDark ? '#818cf8' : '#4338CA' }}>CogniVeil</span>
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
                    color: active ? (isDark ? '#818cf8' : '#4338CA') : theme.subtext,
                    backgroundColor: active ? (isDark ? '#1e1b4b' : '#f5f3ff') : 'transparent',
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
              backgroundColor: isDark ? '#18223a' : '#f8fafc', 
              border: `1px solid ${theme.border}`,
            }}
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          {user ? (
            <>
              <div style={{ ...styles.userBadge, backgroundColor: isDark ? '#18223a' : '#f8fafc', border: `1px solid ${theme.border}` }}>
                <div style={styles.userAvatar}>{(user.name || user.email)[0].toUpperCase()}</div>
                <div style={styles.userInfo}>
                  <span style={{ ...styles.userName, color: theme.text }}>{user.name || user.email.split('@')[0]}</span>
                  <span style={styles.userRole}>{user.is_caregiver ? 'Caregiver' : 'Patient'}</span>
                </div>
              </div>
              <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.loginLink}>Sign In</Link>
              <Link to="/register" style={styles.registerLink}>Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="hamburger-btn" style={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ ...styles.mobileMenu, backgroundColor: theme.cardBg }}>
          {user ? (
            <>
              {navLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    ...styles.mobileLink,
                    color: isActive(item.path) ? '#4338CA' : theme.text,
                    backgroundColor: isActive(item.path) ? (isDark ? '#1e1b4b' : '#f5f3ff') : 'transparent',
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{renderNavIcon(item.path)}</span> {item.label}
                </Link>
              ))}
              <button onClick={handleLogout} style={styles.mobileLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" style={{ ...styles.mobileLink, color: '#4338CA' }} onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .desktop-links { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
        @media (min-width: 861px) {
          .hamburger-btn { display: none !important; }
        }
      `}</style>
    </nav>
  );
};

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    transition: 'background-color 0.25s ease, border-color 0.25s ease',
  },
  inner: {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '0 1.5rem',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    cursor: 'pointer',
    flexShrink: 0,
  },
  logoBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    textDecoration: 'none',
    fontSize: '0.86rem',
    padding: '0.5rem 0.85rem',
    borderRadius: '8px',
    transition: 'all 0.2s',
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
    backgroundColor: '#4338CA',
    color: 'white',
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
    color: '#64748b',
    fontSize: '0.68rem',
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    color: '#ef4444',
    border: '1.5px solid rgba(239, 68, 68, 0.3)',
    padding: '0.45rem 0.9rem',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  loginLink: {
    color: '#4338CA',
    textDecoration: 'none',
    fontSize: '0.88rem',
    fontWeight: '700',
  },
  registerLink: {
    backgroundColor: '#4338CA',
    color: 'white',
    textDecoration: 'none',
    padding: '0.5rem 1.1rem',
    borderRadius: '8px',
    fontSize: '0.88rem',
    fontWeight: '700',
  },
  hamburger: {
    display: 'none',
    backgroundColor: 'transparent',
    border: '1px solid #e2e8f0',
    color: '#1e293b',
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
    backgroundColor: '#fee2e2',
    color: '#dc2626',
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
