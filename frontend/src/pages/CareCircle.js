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
