import React, { useEffect, useState } from 'react';
import { invitePatient, getCaregiverPatients, getSharingRequests, acceptSharingRequest, revokeSharingRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';

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

  return <main style={styles.page}>
    <section style={styles.card}>
      <p style={styles.eyebrow}>CONSENT-BASED SHARING</p>
      <h1 style={styles.title}>{user?.is_caregiver ? 'Care Circle' : 'Sharing permissions'}</h1>
      <p style={styles.copy}>Only the patient can approve or revoke access to screening trends. CogniVeil does not share raw recordings.</p>
      {message && <p style={styles.message}>{message}</p>}
      {user?.is_caregiver ? <>
        <form onSubmit={sendInvite} style={styles.form}>
          <input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Patient email address" style={styles.input} />
          <button style={styles.button}>Request access</button>
        </form>
        <div style={styles.list}>{patients.length ? patients.map(patient => <article key={patient.access_id} style={styles.item}>
          <div><strong>{patient.name}</strong><p>{patient.email} · Age {patient.age}</p></div>
          <div style={styles.score}>{patient.latest_score ?? '—'}<small>{patient.risk_level || 'No session yet'}{patient.is_deviating ? ' · deviation flagged' : ''}</small></div>
        </article>) : <p>No patients have granted access yet.</p>}</div>
      </> : <div style={styles.list}>{requests.length ? requests.map(request => <article key={request.id} style={styles.item}>
        <div><strong>{request.caregiver_name}</strong><p>{request.caregiver_email}</p></div>
        {request.status === 'pending' ? <button onClick={() => accept(request.id)} style={styles.button}>Grant access</button> : <button onClick={() => revoke(request.id)} style={styles.secondary}>Revoke access</button>}
      </article>) : <p>You do not have any caregiver-sharing requests.</p>}</div>}
    </section>
  </main>;
};

const styles = {
  page: { minHeight: '100vh', background: '#080c14', color: 'white', padding: '6rem 1.5rem 2rem', fontFamily: 'Segoe UI, sans-serif' },
  card: { maxWidth: 760, margin: 'auto', background: '#0d1117', border: '1px solid #ffffff12', borderRadius: 20, padding: '2rem' },
  eyebrow: { color: '#00d4aa', fontSize: '.7rem', letterSpacing: '.14em', fontWeight: 700 }, title: { margin: '.4rem 0', fontSize: '2rem' },
  copy: { color: '#94a3b8', lineHeight: 1.6 }, message: { color: '#a78bfa' },
  form: { display: 'flex', gap: '.75rem', margin: '1.5rem 0' }, input: { flex: 1, padding: '.8rem', borderRadius: 10, border: '1px solid #ffffff22', background: '#080c14', color: 'white' },
  button: { border: 0, borderRadius: 10, padding: '.8rem 1rem', background: '#00d4aa', color: '#080c14', fontWeight: 700, cursor: 'pointer' }, secondary: { border: '1px solid #ef444466', borderRadius: 10, padding: '.8rem 1rem', background: 'transparent', color: '#fca5a5', cursor: 'pointer' },
  list: { display: 'grid', gap: '.75rem', marginTop: '1.25rem' }, item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: 12, background: '#ffffff06' }, score: { textAlign: 'right', color: '#00d4aa', fontSize: '1.4rem', fontWeight: 700 },
};
export default CareCircle;
