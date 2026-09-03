import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { requestVerificationCode } from '../utils/api';

const ProfileEditModal = ({ isOpen, onClose }) => {
  const { user, updateProfile, isClinician } = useAuth();
  const { isDark, theme } = useTheme();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: 'Not specified',
    current_password: '',
    new_password: '',
    verification_code: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [codeSuccessMsg, setCodeSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        age: user.age != null ? String(user.age) : '',
        gender: user.gender || 'Not specified',
        current_password: '',
        new_password: '',
        verification_code: '',
      });
      setErrorMsg('');
      setSuccessMsg('');
      setGeneratedCode(null);
      setCodeSuccessMsg('');
      setChangePasswordOpen(false);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleRequestCode = async () => {
    try {
      setRequestingCode(true);
      setErrorMsg('');
      const res = await requestVerificationCode();
      if (res?.data?.verification_code) {
        setGeneratedCode(res.data.verification_code);
        setFormData((prev) => ({ ...prev, verification_code: res.data.verification_code }));
        setCodeSuccessMsg(`Security PIN issued: ${res.data.verification_code} (valid for 5 mins)`);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to generate verification PIN.');
    } finally {
      setRequestingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMsg('Email address is required.');
      return;
    }
    if (!formData.current_password) {
      setErrorMsg('Identity Verification: Please enter your current password to authorize changes.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        age: formData.age ? parseInt(formData.age, 10) : null,
        gender: formData.gender,
        current_password: formData.current_password,
        new_password: formData.new_password ? formData.new_password.trim() : null,
        verification_code: formData.verification_code || null,
      };

      const result = await updateProfile(payload);
      setSuccessMsg(result?.message || 'Profile successfully updated with verification!');
      
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update profile. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div 
        style={{
          ...styles.modalContainer,
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
          color: theme.text
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ ...styles.modalHeader, borderBottom: `1px solid ${theme.border}` }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: '800',
                fontFamily: "'JetBrains Mono', monospace",
                color: isDark ? '#a3b18a' : '#273822',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                Identity & Access Management
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '700',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: isDark ? 'rgba(163, 177, 138, 0.14)' : '#e8efe6',
                color: isDark ? '#a3b18a' : '#273822',
                border: `1px solid ${isDark ? '#3d5236' : '#d2ded0'}`
              }}>
                {isClinician ? 'Clinician Account' : 'Patient Record'}
              </span>
            </div>
            <h2 style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: '1.6rem',
              fontWeight: '400',
              margin: '0.35rem 0 0 0',
              color: theme.text,
              letterSpacing: '-0.02em'
            }}>
              Edit Profile Details
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: theme.subtext }}>
              Modify your account credentials, clinical records name, and contact details with verification.
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ ...styles.closeBtn, color: theme.subtext }} 
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={styles.formContent}>
          {/* Notifications */}
          {errorMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              backgroundColor: isDark ? 'rgba(217, 119, 127, 0.14)' : '#faebec',
              border: `1px solid ${isDark ? 'rgba(217, 119, 127, 0.3)' : '#f0ccd0'}`,
              color: isDark ? '#d9777f' : '#943840',
              fontSize: '0.82rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              backgroundColor: isDark ? 'rgba(163, 177, 138, 0.14)' : '#e8efe6',
              border: `1px solid ${isDark ? '#3d5236' : '#d2ded0'}`,
              color: isDark ? '#a3b18a' : '#273822',
              fontSize: '0.82rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Core Demographic Information */}
          <div style={styles.inputRow}>
            <div style={styles.inputGroup}>
              <label style={{ ...styles.label, color: theme.text }}>
                Full Name <span style={{ color: '#d9777f' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Meena Krishnan"
                required
                style={{
                  ...styles.input,
                  backgroundColor: theme.inputBg || (isDark ? '#0e140f' : '#ffffff'),
                  borderColor: theme.inputBorder || theme.border,
                  color: theme.text
                }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={{ ...styles.label, color: theme.text }}>
                Email Address <span style={{ color: '#d9777f' }}>*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="meena@demo.com"
                required
                style={{
                  ...styles.input,
                  backgroundColor: theme.inputBg || (isDark ? '#0e140f' : '#ffffff'),
                  borderColor: theme.inputBorder || theme.border,
                  color: theme.text
                }}
              />
            </div>
          </div>

          <div style={styles.inputRow}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={{ ...styles.label, color: theme.text }}>Age (Years)</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g. 68"
                min="18"
                max="120"
                style={{
                  ...styles.input,
                  backgroundColor: theme.inputBg || (isDark ? '#0e140f' : '#ffffff'),
                  borderColor: theme.inputBorder || theme.border,
                  color: theme.text
                }}
              />
            </div>

            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={{ ...styles.label, color: theme.text }}>Biological Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  backgroundColor: theme.inputBg || (isDark ? '#0e140f' : '#ffffff'),
                  borderColor: theme.inputBorder || theme.border,
                  color: theme.text
                }}
              >
                <option value="Not specified">Not specified</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Verification Box */}
          <div style={{
            padding: '1.1rem 1.25rem',
            borderRadius: '14px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8faf7',
            border: `1.5px solid ${isDark ? '#3d5236' : '#d2ded0'}`,
            marginTop: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#a3b18a' : '#273822'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span style={{ fontSize: '0.86rem', fontWeight: '800', color: theme.text }}>
                  Authorization & Identity Verification
                </span>
              </div>
              
              <button
                type="button"
                onClick={handleRequestCode}
                disabled={requestingCode}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${isDark ? '#3d5236' : '#d2ded0'}`,
                  backgroundColor: isDark ? '#1a261b' : '#e8efe6',
                  color: isDark ? '#a3b18a' : '#273822',
                  fontSize: '0.72rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: '700',
                  cursor: requestingCode ? 'wait' : 'pointer'
                }}
              >
                {requestingCode ? 'Issuing PIN...' : 'Issue Security PIN'}
              </button>
            </div>

            <p style={{ fontSize: '0.76rem', color: theme.subtext, margin: '0.4rem 0 0.85rem 0', lineHeight: '1.4' }}>
              To ensure HIPAA and clinical data confidentiality, confirm your current password to authorize updates to this profile record.
            </p>

            {codeSuccessMsg && (
              <div style={{
                marginBottom: '0.75rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                backgroundColor: isDark ? 'rgba(163, 177, 138, 0.14)' : '#e8efe6',
                color: isDark ? '#a3b18a' : '#273822',
                fontSize: '0.76rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '700'
              }}>
                {codeSuccessMsg}
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={{ ...styles.label, color: theme.text }}>
                Current Password <span style={{ color: '#d9777f' }}>* (Required to authorize)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  required
                  style={{
                    ...styles.input,
                    paddingRight: '2.5rem',
                    backgroundColor: theme.inputBg || (isDark ? '#0e140f' : '#ffffff'),
                    borderColor: theme.inputBorder || theme.border,
                    color: theme.text
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Optional Verification PIN field */}
            {generatedCode && (
              <div style={{ ...styles.inputGroup, marginTop: '0.65rem' }}>
                <label style={{ ...styles.label, color: theme.text }}>
                  Clinical Security PIN (Autofilled)
                </label>
                <input
                  type="text"
                  name="verification_code"
                  value={formData.verification_code}
                  onChange={handleChange}
                  placeholder="6-digit PIN"
                  style={{
                    ...styles.input,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.12em',
                    backgroundColor: theme.inputBg || (isDark ? '#0e140f' : '#ffffff'),
                    borderColor: theme.inputBorder || theme.border,
                    color: theme.text
                  }}
                />
              </div>
            )}
          </div>

          {/* Optional Password Update Toggle */}
          <div style={{ marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setChangePasswordOpen(!changePasswordOpen)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: isDark ? '#a3b18a' : '#273822',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{changePasswordOpen ? '− Hide password change option' : '+ Change account password'}</span>
            </button>

            {changePasswordOpen && (
              <div style={{ ...styles.inputGroup, marginTop: '0.65rem' }}>
                <label style={{ ...styles.label, color: theme.text }}>New Password (optional)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="new_password"
                    value={formData.new_password}
                    onChange={handleChange}
                    placeholder="Enter at least 6 characters"
                    style={{
                      ...styles.input,
                      paddingRight: '2.5rem',
                      backgroundColor: theme.inputBg || (isDark ? '#0e140f' : '#ffffff'),
                      borderColor: theme.inputBorder || theme.border,
                      color: theme.text
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeBtn}
                    tabIndex="-1"
                  >
                    {showNewPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div style={{ ...styles.modalFooter, borderTop: `1px solid ${theme.border}` }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...styles.secondaryBtn,
                borderColor: theme.border,
                color: theme.text
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.primaryBtn,
                backgroundColor: isDark ? '#3d5236' : '#273822',
                color: '#ffffff',
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'wait' : 'pointer'
              }}
            >
              {submitting ? 'Verifying & Saving...' : 'Authorize & Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(11, 16, 12, 0.72)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalContainer: {
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: '20px',
    border: '1px solid',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    padding: '1.5rem 1.75rem 1.25rem 1.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: {
    padding: '1.5rem 1.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  inputGroup: {
    flex: 1,
    minWidth: '220px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  label: {
    fontSize: '0.78rem',
    fontWeight: '700',
    fontFamily: "'Mulish', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  input: {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '0.85rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Mulish', -apple-system, BlinkMacSystemFont, sans-serif",
    transition: 'border-color 0.2s',
  },
  eyeBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#829AB1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    paddingTop: '1.25rem',
    marginTop: '0.5rem',
  },
  secondaryBtn: {
    padding: '0.65rem 1.25rem',
    borderRadius: '10px',
    border: '1px solid',
    background: 'transparent',
    fontSize: '0.84rem',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: "'Mulish', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  primaryBtn: {
    padding: '0.65rem 1.5rem',
    borderRadius: '10px',
    border: 'none',
    fontSize: '0.84rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
    fontFamily: "'Mulish', -apple-system, BlinkMacSystemFont, sans-serif",
  },
};

export default ProfileEditModal;
