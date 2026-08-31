import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';
import AccessibilityBar from './AccessibilityBar';
import EvidenceGraphModal from './EvidenceGraphModal';
import AgentPipelineModal from './AgentPipelineModal';
import ReferralReportModal from './ReferralReportModal';
import { searchApi, getNotifications, markNotificationRead, clearNotifications } from '../utils/api';

const DoctorLayout = ({
  children,
  activeTitle = 'Dashboard',
  actionButton,
  onOpenReferral,
  onOpenEvidenceGraph,
  onOpenAgentPipeline
}) => {
  const { isDark, theme } = useTheme();
  const navigate = useNavigate();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // Fallback Internal Modals (if not handled by parent page)
  const [internalEvidenceGraphOpen, setInternalEvidenceGraphOpen] = useState(false);
  const [internalAgentPipelineOpen, setInternalAgentPipelineOpen] = useState(false);
  const [internalReferralOpen, setInternalReferralOpen] = useState(false);

  // Modal Handlers
  const handleEvidenceGraphClick = () => {
    if (onOpenEvidenceGraph) {
      onOpenEvidenceGraph();
    } else {
      setInternalEvidenceGraphOpen(true);
    }
  };

  const handleAgentPipelineClick = () => {
    if (onOpenAgentPipeline) {
      onOpenAgentPipeline();
    } else {
      setInternalAgentPipelineOpen(true);
    }
  };

  const handleReferralClick = () => {
    if (onOpenReferral) {
      onOpenReferral();
    } else {
      navigate('/referral');
    }
  };


  // Load Notifications
  const loadNotifications = () => {
    getNotifications()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setNotifications(res.data);
        }
      })
      .catch((err) => {
        console.log('Error fetching notifications:', err.message);
      });
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Debounced Search Effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(() => {
      searchApi(searchQuery)
        .then((res) => {
          if (res?.data?.results) {
            setSearchResults(res.data.results);
          }
        })
        .catch((err) => {
          console.log('Search error:', err.message);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 250);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click Outside Popover Closes
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id, link) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.log('Error marking notification read:', e.message);
    }
    if (link) {
      setShowNotifications(false);
      navigate(link);
    }
  };

  const handleClearAllNotifs = async () => {
    try {
      await clearNotifications();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.log('Error clearing notifications:', e.message);
    }
  };

  const handleSearchResultClick = (item) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div style={{ ...styles.layoutWrapper, backgroundColor: theme.bg, color: theme.text }}>
      {/* 1. Left Clinical Sidebar (Grouped Navigation) */}
      <Sidebar
        onOpenReferral={handleReferralClick}
        onOpenEvidenceGraph={handleEvidenceGraphClick}
        onOpenAgentPipeline={handleAgentPipelineClick}
      />

      {/* 2. Main Viewport */}
      <div style={styles.mainViewport}>
        {/* Accessibility Bar */}
        <AccessibilityBar />

        {/* Top Header Bar */}
        <header
          style={{
            ...styles.topHeader,
            backgroundColor: theme.topHeaderBg,
            borderBottom: `1px solid ${theme.topHeaderBorder}`
          }}
        >
          {/* Search Input Container */}
          <div style={{ position: 'relative' }} ref={searchRef}>
            <div
              style={{
                ...styles.searchBox,
                backgroundColor: theme.inputBg,
                border: `1px solid ${theme.inputBorder}`
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isDark ? '#9FB3C8' : '#627D98'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search patient records, biomarkers, cognitive tests, appointments..."
                value={searchQuery}
                onFocus={() => setShowSearchDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                style={{ ...styles.searchInput, color: theme.text }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Dropdown */}
            {showSearchDropdown && (
              <div
                style={{
                  ...styles.searchDropdown,
                  backgroundColor: theme.cardBg,
                  borderColor: theme.border,
                  boxShadow: isDark
                    ? '0 10px 30px rgba(0,0,0,0.7)'
                    : '0 10px 30px rgba(0,0,0,0.12)'
                }}
              >
                <div style={styles.dropdownHeader}>
                  <span style={styles.dropdownTitle}>
                    {isSearching ? 'SEARCHING ARCHIVE...' : searchQuery ? `RESULTS FOR "${searchQuery}"` : 'QUICK NAVIGATION'}
                  </span>
                  <span style={styles.dropdownCount}>{searchResults.length} matches</span>
                </div>

                <div style={styles.dropdownList}>
                  {searchResults.length > 0 ? (
                    searchResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSearchResultClick(item)}
                        style={{
                          ...styles.searchItem,
                          borderBottom: `1px solid ${theme.borderSubtle}`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#162B3D' : '#F0F5F4';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              ...styles.categoryBadge,
                              backgroundColor:
                                item.category === 'patient'
                                  ? '#0F4C4A'
                                  : item.category === 'biomarker'
                                  ? '#D97745'
                                  : item.category === 'test'
                                  ? '#287C78'
                                  : '#10202E',
                              color: '#FFFFFF'
                            }}
                          >
                            {item.badge || item.category}
                          </span>
                          <strong style={{ fontSize: '0.88rem', color: theme.text }}>
                            {item.title}
                          </strong>
                        </div>
                        <span style={{ fontSize: '0.76rem', color: theme.subtext, marginTop: '2px' }}>
                          {item.subtitle}
                        </span>
                      </div>
                    ))
                  ) : searchQuery ? (
                    <div style={styles.emptyState}>No records found matching "{searchQuery}"</div>
                  ) : (
                    <div style={styles.emptyState}>Type above to search across patients, biomarkers, and tests.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Top Actions */}
          <div style={styles.headerRightActions}>
            <button
              onClick={handleEvidenceGraphClick}
              style={{
                ...styles.graphBtn,
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                color: theme.primaryTeal
              }}
              title="View Multimodal Signal Topology"
            >
              🕸️ Evidence Graph
            </button>

            <button
              onClick={handleAgentPipelineClick}
              style={{
                ...styles.graphBtn,
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                color: theme.secondaryTeal
              }}
              title="View 10-Node Agent Execution Pipeline"
            >
              ⚡ 10-Agent Pipeline
            </button>

            {/* Notification Bell Container */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                style={{
                  ...styles.notificationBtn,
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.border}`
                }}
                title="Clinical Priority Notifications"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isDark ? '#9FB3C8' : '#627D98'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && <span style={styles.notificationBadge}>{unreadCount}</span>}
              </button>

              {/* Notification Popover Drawer */}
              {showNotifications && (
                <div
                  style={{
                    ...styles.notificationDrawer,
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                    boxShadow: isDark
                      ? '0 12px 36px rgba(0,0,0,0.8)'
                      : '0 12px 36px rgba(0,0,0,0.15)'
                  }}
                >
                  <div
                    style={{
                      ...styles.notifHeader,
                      borderBottom: `1px solid ${theme.border}`
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: theme.text }}>
                        Clinical Alerts & Notifications
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: theme.subtext }}>
                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={handleClearAllNotifs} style={styles.markAllBtn}>
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div style={styles.notifList}>
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkRead(n.id, n.link)}
                          style={{
                            ...styles.notifItem,
                            backgroundColor: !n.is_read
                              ? isDark
                                ? 'rgba(83, 183, 197, 0.08)'
                                : '#F0F9F8'
                              : 'transparent',
                            borderBottom: `1px solid ${theme.borderSubtle}`
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong style={{ fontSize: '0.84rem', color: theme.text }}>
                              {n.title}
                            </strong>
                            {!n.is_read && <span style={styles.unreadDot} />}
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: theme.subtext, lineHeight: '1.3' }}>
                            {n.message}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                            <span
                              style={{
                                ...styles.typeTag,
                                backgroundColor:
                                  n.type === 'alert'
                                    ? 'rgba(201, 76, 76, 0.15)'
                                    : n.type === 'reminder'
                                    ? 'rgba(217, 119, 69, 0.15)'
                                    : 'rgba(47, 125, 91, 0.15)',
                                color:
                                  n.type === 'alert'
                                    ? '#C94C4C'
                                    : n.type === 'reminder'
                                    ? '#D97745'
                                    : '#2F7D5B'
                              }}
                            >
                              {n.type.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#829ab1' }}>
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={styles.emptyState}>No notifications right now.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {actionButton ? actionButton : null}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main style={styles.mainContent}>{children}</main>
      </div>

      {/* Centralized Modals (available on every page) */}
      <EvidenceGraphModal
        isOpen={internalEvidenceGraphOpen}
        onClose={() => setInternalEvidenceGraphOpen(false)}
      />
      <AgentPipelineModal
        isOpen={internalAgentPipelineOpen}
        onClose={() => setInternalAgentPipelineOpen(false)}
      />
      <ReferralReportModal
        isOpen={internalReferralOpen}
        onClose={() => setInternalReferralOpen(false)}
      />
    </div>
  );
};

const styles = {
  layoutWrapper: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
    overflowX: 'hidden'
  },
  mainViewport: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflowY: 'auto'
  },
  topHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 2rem',
    position: 'sticky',
    top: 0,
    zIndex: 40
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    padding: '0.5rem 1rem',
    borderRadius: '10px',
    width: '440px',
    position: 'relative'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '0.84rem',
    width: '100%'
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    color: '#829ab1',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: '0 4px'
  },
  searchDropdown: {
    position: 'absolute',
    top: '46px',
    left: 0,
    width: '520px',
    borderRadius: '12px',
    border: '1px solid',
    zIndex: 100,
    overflow: 'hidden'
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.6rem 1rem',
    borderBottom: '1px solid rgba(128,128,128,0.2)',
    fontSize: '0.7rem',
    fontWeight: '700',
    letterSpacing: '0.05em'
  },
  dropdownTitle: {
    color: '#53B7C5'
  },
  dropdownCount: {
    color: '#829ab1'
  },
  dropdownList: {
    maxHeight: '340px',
    overflowY: 'auto'
  },
  searchItem: {
    padding: '0.75rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  },
  categoryBadge: {
    fontSize: '0.65rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.04em'
  },
  headerRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
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
    gap: '4px'
  },
  notificationBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative'
  },
  notificationBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#C94C4C',
    color: '#FFFFFF',
    fontSize: '0.65rem',
    fontWeight: '800',
    borderRadius: '10px',
    padding: '1px 5px',
    minWidth: '16px',
    textAlign: 'center'
  },
  notificationDrawer: {
    position: 'absolute',
    top: '46px',
    right: 0,
    width: '360px',
    borderRadius: '12px',
    border: '1px solid',
    zIndex: 100,
    overflow: 'hidden'
  },
  notifHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem'
  },
  markAllBtn: {
    background: 'none',
    border: 'none',
    color: '#53B7C5',
    fontSize: '0.72rem',
    fontWeight: '700',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  notifList: {
    maxHeight: '360px',
    overflowY: 'auto'
  },
  notifItem: {
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  },
  unreadDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#53B7C5',
    marginTop: '4px'
  },
  typeTag: {
    fontSize: '0.62rem',
    fontWeight: '800',
    padding: '2px 5px',
    borderRadius: '3px'
  },
  emptyState: {
    padding: '1.5rem',
    textAlign: 'center',
    fontSize: '0.8rem',
    color: '#829ab1'
  },
  mainContent: {
    flex: 1,
    padding: '2rem',
    maxWidth: '1320px',
    width: '100%'
  }
};

export default DoctorLayout;

