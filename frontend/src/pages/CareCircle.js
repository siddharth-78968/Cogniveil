import React, { useEffect, useState } from 'react';
import { invitePatient, getCaregiverPatients, getSharingRequests, acceptSharingRequest, revokeSharingRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DoctorLayout from '../components/DoctorLayout';

const CareCircle = () => {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [patients, setPatients] = useState([]);
  const [requests, setRequests] = useState([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [simulatedAlertActive, setSimulatedAlertActive] = useState(false);

  const load = async () => {
    try {
      if (user?.is_caregiver) setPatients((await getCaregiverPatients()).data);
      else setRequests((await getSharingRequests()).data);
    } catch (error) { setMessage(error.response?.data?.detail || 'Unable to load sharing information.'); }
  };
  useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendInvite = async (event) => {
    event.preventDefault();
    try { setMessage((await invitePatient({ patient_email: email })).data.message); setEmail(''); }
    catch (error) { setMessage(error.response?.data?.detail || 'Invitation failed.'); }
  };
  const accept = async (id) => { await acceptSharingRequest(id); setMessage('Access granted.'); load(); };
  const revoke = async (id) => { await revokeSharingRequest(id); setMessage('Access removed.'); load(); };

  return (
    <DoctorLayout activeTitle="Care Circle">
      <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '3rem' }}>
        <section style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: '24px',
          padding: '3rem 3.25rem',
          boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.35)' : '0 6px 24px rgba(0,0,0,0.04)'
        }}>
          <p style={{ color: isDark ? '#a3b18a' : '#273822', fontSize: '0.85rem', letterSpacing: '0.08em', fontWeight: 800, margin: '0 0 0.5rem 0', fontFamily: "'JetBrains Mono', monospace" }}>
            CONSENT-BASED TELEMETRY SHARING
          </p>
          <h1 style={{ margin: '0 0 0.75rem 0', fontSize: '2.4rem', fontWeight: 800, color: theme.text, letterSpacing: '-0.025em' }}>
            {user?.is_caregiver ? 'Care Circle Patients' : 'Sharing & Access Permissions'}
          </h1>
          <p style={{ color: theme.subtext, lineHeight: 1.65, fontSize: '1.05rem', margin: '0 0 2rem 0', maxWidth: '760px' }}>
            Only the patient can approve or revoke access to screening trends. CogniVeil never shares unconsented raw data.
          </p>

          {/* ── WINNING STRATEGY: CAREGIVER ALERT PAYOFF SIMULATOR (RAJAN PILLAI CASE) ── */}
          <div style={{
            marginBottom: '2.5rem',
            padding: '1.75rem 2rem',
            backgroundColor: isDark ? 'rgba(52, 211, 153, 0.06)' : '#f0fdf4',
            border: `1.5px solid ${isDark ? 'rgba(52, 211, 153, 0.3)' : '#86efac'}`,
            borderRadius: '18px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🔔</span>
                  <span style={{ fontSize: '0.78rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: isDark ? '#34d399' : '#166534', letterSpacing: '0.06em' }}>
                    WINNING STRATEGY DEMO: CAREGIVER ALERT PAYOFF
                  </span>
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 800, color: theme.text }}>
                  Rajan Pillai CUSUM Threshold Payoff ($H = 14.2 > 12.0$)
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: theme.subtext, lineHeight: 1.5, maxWidth: '650px' }}>
                  When Rajan's statistical change-point threshold triggers, CogniVeil does not alarm the patient. Instead, it sends an empathetic nudge to his daughter, Priya Pillai, buying 6–8 critical months.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSimulatedAlertActive(!simulatedAlertActive)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  backgroundColor: isDark ? '#10b981' : '#15803d',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{simulatedAlertActive ? '✕ Close Preview' : '⚡ Simulate Live Push Nudge'}</span>
              </button>
            </div>

            {/* Live Caregiver Notification Preview */}
            {simulatedAlertActive && (
              <div style={{
                marginTop: '1.25rem',
                padding: '1.25rem 1.5rem',
                backgroundColor: isDark ? '#182219' : '#ffffff',
                border: `1.5px solid ${isDark ? '#2e422f' : '#bbf7d0'}`,
                borderRadius: '14px',
                animation: 'fadeIn 0.25s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.74rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#10b981' }}>
                    📱 CAREGIVER PUSH NOTIFICATION (SENT TO PRIYA PILLAI)
                  </span>
                  <span style={{ fontSize: '0.72rem', color: theme.subtext }}>Just now</span>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 700, color: theme.text, lineHeight: 1.45 }}>
                  "CogniVeil Care Circle: A gentle wellness check-in with Dr. Evelyn's neurology clinic is suggested for Rajan this month."
                </p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: theme.subtext, flexWrap: 'wrap' }}>
                  <span>🛡️ <strong>Zero Raw Data:</strong> Audio and raw keystrokes remain strictly private</span>
                  <span>⏱️ <strong>Clinical Gain:</strong> 6–8 Months of early intervention lead time</span>
                </div>
              </div>
            )}
          </div>
          {message && (
            <p style={{
              color: isDark ? '#a3b18a' : '#273822',
              backgroundColor: isDark ? 'rgba(163, 177, 138, 0.12)' : '#f2f7f0',
              border: `1px solid ${isDark ? 'rgba(163, 177, 138, 0.3)' : '#d2ded0'}`,
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: '700'
            }}>
              {message}
            </p>
          )}
          {user?.is_caregiver ? (
            <>
              <form onSubmit={sendInvite} style={{ display: 'flex', gap: '1rem', margin: '2rem 0', flexWrap: 'wrap' }}>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="Enter patient email address"
                  style={{
                    flex: 1,
                    minWidth: '280px',
                    padding: '1rem 1.35rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${theme.border}`,
                    background: theme.inputBg,
                    color: theme.text,
                    fontSize: '1.05rem',
                    fontWeight: '600',
                    outline: 'none',
                  }}
                />
                <button style={{
                  border: 0,
                  borderRadius: '12px',
                  padding: '1rem 2rem',
                  background: isDark ? '#ffffff' : '#273822',
                  color: isDark ? '#0b100c' : '#ffffff',
                  fontWeight: 700,
                  fontSize: '1.02rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(39, 56, 34, 0.25)',
                }}>
                  Request Access
                </button>
              </form>
              <div style={{ display: 'grid', gap: '1.25rem', marginTop: '2rem' }}>
                {patients.length ? (
                  patients.map(patient => (
                    <article key={patient.access_id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1.5rem',
                      padding: '1.65rem 2rem',
                      borderRadius: '18px',
                      background: isDark ? 'rgba(255,255,255,0.03)' : '#f8faf7',
                      border: `1px solid ${theme.border}`,
                    }}>
                      <div>
                        <strong style={{ color: theme.text, fontSize: '1.25rem', display: 'block' }}>{patient.name}</strong>
                        <p style={{ color: theme.subtext, fontSize: '0.96rem', margin: '6px 0 0 0' }}>{patient.email} · Age {patient.age}</p>
                      </div>
                      <div style={{ textAlign: 'right', color: isDark ? '#a3b18a' : '#273822', fontSize: '1.85rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                        {patient.latest_score ?? '—'}
                        <small style={{ display: 'block', fontSize: '0.85rem', color: theme.subtext, fontWeight: '600', marginTop: '4px' }}>
                          {patient.risk_level || 'No session yet'}{patient.is_deviating ? ' · Deviation Flagged' : ''}
                        </small>
                      </div>
                    </article>
                  ))
                ) : (
                  <p style={{ color: theme.subtext, fontSize: '1.02rem' }}>No patients have granted access yet.</p>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gap: '1.25rem', marginTop: '2rem' }}>
              {requests.length ? (
                requests.map(request => (
                  <article key={request.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1.5rem',
                    padding: '1.65rem 2rem',
                    borderRadius: '18px',
                    background: isDark ? 'rgba(255,255,255,0.03)' : '#f8faf7',
                    border: `1px solid ${theme.border}`,
                  }}>
                    <div>
                      <strong style={{ color: theme.text, fontSize: '1.25rem', display: 'block' }}>{request.caregiver_name}</strong>
                      <p style={{ color: theme.subtext, fontSize: '0.96rem', margin: '6px 0 0 0' }}>{request.caregiver_email}</p>
                    </div>
                    {request.status === 'pending' ? (
                      <button onClick={() => accept(request.id)} style={{
                        border: 0,
                        borderRadius: '12px',
                        padding: '0.85rem 1.75rem',
                        background: isDark ? '#ffffff' : '#273822',
                        color: isDark ? '#0b100c' : '#ffffff',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(39, 56, 34, 0.25)',
                      }}>
                        Grant Access
                      </button>
                    ) : (
                      <button onClick={() => revoke(request.id)} style={{
                        border: '1.5px solid #ef4444',
                        borderRadius: '12px',
                        padding: '0.85rem 1.5rem',
                        background: 'transparent',
                        color: '#ef4444',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                      }}>
                        Revoke Access
                      </button>
                    )}
                  </article>
                ))
              ) : (
                <p style={{ color: theme.subtext, fontSize: '1.02rem' }}>You do not have any pending caregiver-sharing requests.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </DoctorLayout>
  );
};

export default CareCircle;
