import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <div style={styles.logo} onClick={() => navigate('/')} >
          <span style={styles.logoBrain}>🧠</span>
          <span style={styles.logoText}>CogniVeil</span>
        </div>

        {/* Links */}
        {user && (
          <div style={styles.links}>
            {[
              { path: '/dashboard', label: 'Dashboard', icon: '📊' },
              { path: '/tests', label: 'Daily Tests', icon: '🧪' },
              { path: '/voice', label: 'Voice Journal', icon: '🎙️' },
              { path: '/level2', label: 'Level 2', icon: '🔬' },
              { path: '/level3', label: 'Level 3 MRI', icon: '🧠' },
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...styles.link,
                  color: isActive(item.path) ? '#00d4aa' : '#ffffff50',
                  borderBottom: isActive(item.path) ? '2px solid #00d4aa' : '2px solid transparent',
                }}
              >
                <span style={styles.linkIcon}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={styles.right}>
          {user ? (
            <>
              <div style={styles.userBadge}>
                <div style={styles.userAvatar}>
                  {user.email[0].toUpperCase()}
                </div>
                <span style={styles.userEmail}>{user.email.split('@')[0]}</span>
              </div>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.loginLink}>Sign In</Link>
              <Link to="/register" style={styles.registerLink}>Get Started</Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes navFade {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: '#0d1117',
    borderBottom: '1px solid #ffffff08',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    animation: 'navFade 0.4s ease',
    backdropFilter: 'blur(10px)',
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoBrain: { fontSize: '1.4rem' },
  logoText: {
    color: '#00d4aa',
    fontSize: '1.2rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    fontFamily: "'Segoe UI', sans-serif",
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flex: 1,
    justifyContent: 'center',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0 1rem',
    height: '60px',
    textDecoration: 'none',
    fontSize: '0.88rem',
    fontWeight: '500',
    fontFamily: "'Segoe UI', sans-serif",
    transition: 'color 0.2s',
    whiteSpace: 'nowrap',
  },
  linkIcon: { fontSize: '0.95rem' },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexShrink: 0,
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#00d4aa22',
    border: '1px solid #00d4aa44',
    color: '#00d4aa',
    fontSize: '0.85rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', sans-serif",
  },
  userEmail: {
    color: '#ffffff40',
    fontSize: '0.82rem',
    fontFamily: "'Segoe UI', sans-serif",
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    color: '#ffffff30',
    border: '1px solid #ffffff10',
    borderRadius: '8px',
    padding: '0.4rem 0.9rem',
    fontSize: '0.82rem',
    cursor: 'pointer',
    fontFamily: "'Segoe UI', sans-serif",
    transition: 'all 0.2s',
  },
  loginLink: {
    color: '#ffffff50',
    textDecoration: 'none',
    fontSize: '0.88rem',
    fontFamily: "'Segoe UI', sans-serif",
  },
  registerLink: {
    backgroundColor: '#00d4aa',
    color: '#080c14',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: '700',
    padding: '0.45rem 1rem',
    borderRadius: '8px',
    fontFamily: "'Segoe UI', sans-serif",
  },
};

export default Navbar;