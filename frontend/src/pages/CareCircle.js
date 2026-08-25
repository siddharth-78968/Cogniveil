import React, { useEffect, useState } from 'react';
import { invitePatient, getCaregiverPatients, getSharingRequests, acceptSharingRequest, revokeSharingRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import DoctorLayout from '../components/DoctorLayout';

const CareCircle = () => {
  const { user } = useAuth();
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
      <div style={styles.container}>
        <section style={styles.card}>
          <p style={styles.eyebrow}>CONSENT-BASED TELEMETRY SHARING</p>
          <h1 style={styles.title}>{user?.is_caregiver ? 'Care Circle Patients' : 'Sharing & Access Permissions'}</h1>
          <p style={styles.copy}>Only the patient can approve or revoke access to screening trends. CogniVeil never shares unconsented raw data.</p>
          {message && <p style={styles.message}>{message}</p>}
          {user?.is_caregiver ? (
            <>
              <form onSubmit={sendInvite} style={styles.form}>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="Enter patient email address"
                  style={styles.input}
                />
                <button style={styles.button}>Request Access</button>
              </form>
              <div style={styles.list}>
                {patients.length ? (
                  patients.map(patient => (
                    <article key={patient.access_id} style={styles.item}>
                      <div>
                        <strong style={{ color: '#1e293b', fontSize: '1.05rem' }}>{patient.name}</strong>
                        <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '4px 0 0 0' }}>{patient.email} · Age {patient.age}</p>
                      </div>
                      <div style={styles.score}>
                        {patient.latest_score ?? '—'}
                        <small style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                          {patient.risk_level || 'No session yet'}{patient.is_deviating ? ' · ⚠️ Deviation Flagged' : ''}
                        </small>
                      </div>
                    </article>
                  ))
                ) : (
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No patients have granted access yet.</p>
                )}
              </div>
            </>
          ) : (
            <div style={styles.list}>
              {requests.length ? (
                requests.map(request => (
                  <article key={request.id} style={styles.item}>
                    <div>
                      <strong style={{ color: '#1e293b', fontSize: '1.05rem' }}>{request.caregiver_name}</strong>
                      <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '4px 0 0 0' }}>{request.caregiver_email}</p>
                    </div>
                    {request.status === 'pending' ? (
                      <button onClick={() => accept(request.id)} style={styles.button}>Grant Access</button>
                    ) : (
                      <button onClick={() => revoke(request.id)} style={styles.secondary}>Revoke Access</button>
                    )}
                  </article>
                ))
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>You do not have any pending caregiver-sharing requests.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </DoctorLayout>
  );
};

const styles = {
  container: { maxWidth: 850, margin: '0 auto' },
  card: {
    background: '#ffffff',
    border: '1px solid #eef2f6',
    borderRadius: 20,
    padding: '2.5rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  },
  eyebrow: { color: '#4338CA', fontSize: '.72rem', letterSpacing: '.1em', fontWeight: 800, margin: '0 0 0.25rem 0' },
  title: { margin: '0 0 .5rem 0', fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' },
  copy: { color: '#64748b', lineHeight: 1.5, fontSize: '0.9rem', margin: '0 0 1.5rem 0' },
  message: { color: '#4338CA', backgroundColor: '#f5f3ff', border: '1px solid #c7d2fe', padding: '0.75rem 1rem', borderRadius: 10, fontSize: '0.88rem', fontWeight: '700' },
  form: { display: 'flex', gap: '.75rem', margin: '1.5rem 0' },
  input: {
    flex: 1,
    padding: '.8rem 1rem',
    borderRadius: 10,
    border: '1.5px solid #e2e8f0',
    background: '#ffffff',
    color: '#1e293b',
    fontSize: '0.9rem',
    fontWeight: '600',
    outline: 'none',
  },
  button: {
    border: 0,
    borderRadius: 10,
    padding: '.8rem 1.5rem',
    background: '#4338CA',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
  },
  secondary: {
    border: '1.5px solid #ef4444',
    borderRadius: 10,
    padding: '.8rem 1.2rem',
    background: 'transparent',
    color: '#ef4444',
    fontWeight: 700,
    cursor: 'pointer',
  },
  list: { display: 'grid', gap: '.85rem', marginTop: '1.5rem' },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.25rem 1.5rem',
    borderRadius: 14,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  score: { textAlign: 'right', color: '#4338CA', fontSize: '1.5rem', fontWeight: 800 },
};

export default CareCircle;
