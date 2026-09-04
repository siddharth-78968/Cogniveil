import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DoctorLayout from '../components/DoctorLayout';
import { 
  getAppointments, 
  createAppointment, 
  updateAppointmentStatus, 
  getClinicians, 
  getClinicianPatients 
} from '../utils/api';

const Appointments = () => {
  const { isClinician } = useAuth();
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'Due', 'Accepted', 'Finished', 'Rejected'
  const [showModal, setShowModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null); // For Details Modal
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Dynamic Options for Selectors
  const [availableClinicians, setAvailableClinicians] = useState([]);
  const [availablePatients, setAvailablePatients] = useState([]);

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedClinicianId, setSelectedClinicianId] = useState('');
  const [appointmentType, setAppointmentType] = useState('Neurological Evaluation');
  const [scheduledDate, setScheduledDate] = useState('2026-09-10');
  const [scheduledTime, setScheduledTime] = useState('10:30 AM');
  const [locationType, setLocationType] = useState('Memory & Cognitive Health Clinic - Suite 402');
  const [notes, setNotes] = useState('');

  const fetchAppointmentsList = async () => {
    try {
      setLoading(true);
      setActionError(null);
      const res = await getAppointments();
      if (Array.isArray(res.data)) {
        setAppointments(res.data);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err.message);
      setActionError('Failed to load appointments from server.');
    } finally {
      setLoading(false);
    }
  };

  // Sync with URL query parameters (?tab=Due or ?action=new)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setFilter(tabParam);
    }
    const actionParam = params.get('action');
    if (actionParam === 'new') {
      setShowModal(true);
    }
  }, [location.search]);

  useEffect(() => {
    fetchAppointmentsList();

    if (isClinician) {
      getClinicianPatients().then(res => {
        if (Array.isArray(res.data)) {
          setAvailablePatients(res.data);
          if (res.data.length > 0) setSelectedPatientId(String(res.data[0].id));
        }
      }).catch(err => console.error('Error fetching clinician patients:', err));
    } else {
      getClinicians().then(res => {
        if (Array.isArray(res.data)) {
          setAvailableClinicians(res.data);
          if (res.data.length > 0) setSelectedClinicianId(String(res.data[0].id));
        }
      }).catch(err => console.error('Error fetching available clinicians:', err));
    }
  }, [isClinician]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      setActionError(null);
      await updateAppointmentStatus(id, newStatus);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
      if (selectedAppt && selectedAppt.id === id) {
        setSelectedAppt((prev) => ({ ...prev, status: newStatus }));
      }
      setActionSuccess(`Appointment #${id} updated to ${newStatus}`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error('Error updating status:', err);
      const errMsg = err.response?.data?.detail || err.message || 'Failed to update appointment status.';
      setActionError(errMsg);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setActionError(null);
      
      const payload = isClinician
        ? {
            patient_id: selectedPatientId ? parseInt(selectedPatientId, 10) : undefined,
            appointment_type: appointmentType,
            scheduled_time: `${scheduledDate} - ${scheduledTime}`,
            location: locationType,
            notes: notes.trim()
          }
        : {
            clinician_id: selectedClinicianId ? parseInt(selectedClinicianId, 10) : undefined,
            appointment_type: appointmentType,
            scheduled_time: `${scheduledDate} - ${scheduledTime}`,
            location: locationType,
            notes: notes.trim()
          };

      const res = await createAppointment(payload);
      if (res.data) {
        setAppointments((prev) => [res.data, ...prev]);
        setShowModal(false);
        setNotes('');
        setActionSuccess(isClinician ? 'New consultation scheduled successfully.' : 'Consultation request submitted successfully.');
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Error creating appointment:', err.message);
      setActionError('Failed to create appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'Due') return a.status === 'Due' || a.status === 'Pending';
    if (filter === 'Rejected') return a.status === 'Rejected' || a.status === 'Cancelled';
    return a.status?.toLowerCase() === filter.toLowerCase();
  });

  const dueCount = appointments.filter((a) => a.status === 'Due' || a.status === 'Pending').length;
  const acceptedCount = appointments.filter((a) => a.status === 'Accepted').length;
  const completedCount = appointments.filter((a) => a.status === 'Finished').length;
  const rejectedCount = appointments.filter((a) => a.status === 'Rejected' || a.status === 'Cancelled').length;

  return (
    <DoctorLayout
      activeTitle="Appointments"
      actionButton={
        <button
          onClick={() => setShowModal(true)}
          style={{
            ...styles.newApptBtn,
            backgroundColor: theme.primaryTeal,
            color: '#FFFFFF'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {isClinician ? 'New Consultation' : 'Request Consultation'}
        </button>
      }
    >
      <div style={styles.container}>
        {/* Alerts */}
        {actionSuccess && (
          <div style={{ ...styles.alertBox, backgroundColor: 'rgba(47, 125, 91, 0.12)', borderColor: '#2F7D5B', color: '#2F7D5B' }}>
            <span>✓ {actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div style={{ ...styles.alertBox, backgroundColor: 'rgba(201, 76, 76, 0.12)', borderColor: '#C94C4C', color: '#C94C4C' }}>
            <span>⚠️ {actionError}</span>
          </div>
        )}

        {/* Page Header */}
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.eyebrowBox}>
              <span style={styles.eyebrowDot} />
              <span style={styles.eyebrowText}>
                {isClinician ? 'CLINICAL WORKSPACE · CONSULTATIONS' : 'PATIENT WORKSPACE · APPOINTMENTS'}
              </span>
            </div>
            <h1 style={{ ...styles.pageTitle, color: theme.text }}>
              {isClinician ? 'Clinical Consultations & Review Schedule' : 'My Scheduled Consultations'}
            </h1>
            <p style={{ ...styles.pageSubtitle, color: theme.subtext }}>
              {isClinician 
                ? 'Manage and review multi-disciplinary clinical evaluations, triage cognitive consultation requests, and inspect patient screening dossiers.'
                : 'View your upcoming neurological evaluations, check doctor notes, and request a clinical consultation with your medical specialist.'}
            </p>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <span style={{ ...styles.statLabel, color: theme.subtext }}>TOTAL SESSIONS</span>
            <div style={{ ...styles.statValue, color: theme.text }}>{appointments.length}</div>
            <span style={{ ...styles.statSub, color: theme.subtext }}>All consultations in registry</span>
          </div>

          <div style={{ ...styles.statCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <span style={{ ...styles.statLabel, color: theme.subtext }}>DUE / PENDING REVIEW</span>
            <div style={{ ...styles.statValue, color: '#D97745' }}>{dueCount}</div>
            <span style={{ ...styles.statSub, color: theme.subtext }}>Requires clinician triage</span>
          </div>

          <div style={{ ...styles.statCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <span style={{ ...styles.statLabel, color: theme.subtext }}>CONFIRMED & ACCEPTED</span>
            <div style={{ ...styles.statValue, color: '#2F7D5B' }}>{acceptedCount}</div>
            <span style={{ ...styles.statSub, color: theme.subtext }}>Active confirmed consultations</span>
          </div>

          <div style={{ ...styles.statCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <span style={{ ...styles.statLabel, color: theme.subtext }}>COMPLETED / ARCHIVED</span>
            <div style={{ ...styles.statValue, color: '#53B7C5' }}>{completedCount}</div>
            <span style={{ ...styles.statSub, color: theme.subtext }}>Evaluations finalized</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ ...styles.filterBar, borderBottom: `1px solid ${theme.border}` }}>
          <div style={styles.filterGroup}>
            {[
              { key: 'all', label: `All (${appointments.length})` },
              { key: 'Due', label: `Due / Pending (${dueCount})` },
              { key: 'Accepted', label: `Accepted (${acceptedCount})` },
              { key: 'Finished', label: `Completed (${completedCount})` },
              { key: 'Rejected', label: `Rejected (${rejectedCount})` }
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                style={{
                  ...styles.filterTab,
                  color: filter === t.key ? (isDark ? '#53B7C5' : '#0F4C4A') : theme.subtext,
                  borderBottom: filter === t.key ? `2px solid ${isDark ? '#53B7C5' : '#0F4C4A'}` : '2px solid transparent'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List Grid */}
        {loading ? (
          <div style={{ ...styles.loadingBox, color: theme.subtext }}>Loading clinical consultations...</div>
        ) : filteredAppointments.length === 0 ? (
          <div style={{ ...styles.emptyBox, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
            <h3 style={{ color: theme.text, margin: '0 0 0.25rem 0' }}>
              {appointments.length === 0 ? 'No appointments yet.' : 'No Consultations Found'}
            </h3>
            <p style={{ color: theme.subtext, margin: 0, fontSize: '0.88rem' }}>
              {appointments.length === 0 
                ? (isClinician ? 'No clinical consultations in schedule.' : 'You have no scheduled clinical consultations yet. Click "Request Consultation" above to book an evaluation.')
                : `No appointments matching the "${filter}" filter.`}
            </p>
          </div>
        ) : (
          <div style={styles.appointmentsGrid}>
            {filteredAppointments.map((appt) => {
              const isAccepted = appt.status === 'Accepted';
              const isDue = appt.status === 'Due' || appt.status === 'Pending';
              const isFinished = appt.status === 'Finished';
              const isRejected = appt.status === 'Rejected' || appt.status === 'Cancelled';

              const badgeBg = isAccepted
                ? 'rgba(47, 125, 91, 0.15)'
                : isDue
                ? 'rgba(217, 119, 69, 0.15)'
                : isFinished
                ? 'rgba(83, 183, 197, 0.15)'
                : 'rgba(201, 76, 76, 0.15)';

              const badgeColor = isAccepted
                ? '#2F7D5B'
                : isDue
                ? '#D97745'
                : isFinished
                ? '#53B7C5'
                : '#C94C4C';

              return (
                <div
                  key={appt.id}
                  style={{
                    ...styles.apptCard,
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border
                  }}
                >
                  <div style={styles.apptCardTop}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ ...styles.patientAvatar, backgroundColor: isDark ? '#162B3D' : '#E8F5EE', color: '#0F4C4A' }}>
                        {isClinician 
                          ? (appt.patient_name ? appt.patient_name.charAt(0).toUpperCase() : 'P')
                          : '👨‍⚕️'}
                      </div>
                      <div>
                        <h3 style={{ ...styles.apptPatientName, color: theme.text }}>
                          {isClinician ? appt.patient_name : appt.appointment_type}
                        </h3>
                        <span style={{ ...styles.apptClinician, color: theme.subtext }}>
                          {isClinician 
                            ? `Attending: ${appt.clinician_name || 'Clinician not assigned'}`
                            : `Specialist: ${appt.clinician_name || 'Clinician not assigned'}`}
                        </span>
                      </div>
                    </div>

                    <span style={{ ...styles.statusBadge, backgroundColor: badgeBg, color: badgeColor }}>
                      {appt.status}
                    </span>
                  </div>

                  <div style={{ ...styles.apptDetailsBox, backgroundColor: isDark ? '#081119' : '#F7F9F8', borderColor: theme.borderSubtle }}>
                    <div style={styles.apptDetailItem}>
                      <span style={{ ...styles.detailLabel, color: theme.subtext }}>Consultation Type</span>
                      <strong style={{ color: theme.text, fontSize: '0.85rem' }}>{appt.appointment_type}</strong>
                    </div>
                    <div style={styles.apptDetailItem}>
                      <span style={{ ...styles.detailLabel, color: theme.subtext }}>Scheduled Time</span>
                      <strong style={{ color: theme.text, fontSize: '0.85rem' }}>{appt.scheduled_time}</strong>
                    </div>
                    <div style={{ ...styles.apptDetailItem, gridColumn: 'span 2' }}>
                      <span style={{ ...styles.detailLabel, color: theme.subtext }}>Location</span>
                      <span style={{ color: theme.subtext, fontSize: '0.8rem' }}>{appt.location}</span>
                    </div>
                  </div>

                  {appt.notes && (
                    <p style={{ ...styles.apptNotes, color: theme.subtext }}>
                      <strong>{isClinician ? 'Clinical Notes:' : 'Patient Notes / Reason:'}</strong> {appt.notes}
                    </p>
                  )}

                  <div style={styles.cardActions}>
                    {isClinician ? (
                      <>
                        {!isAccepted && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'Accepted')}
                            style={{ ...styles.actionBtn, backgroundColor: '#0F4C4A', color: '#FFFFFF' }}
                            title="Accept and confirm session"
                          >
                            ✓ Accept
                          </button>
                        )}
                        {!isRejected && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'Rejected')}
                            style={{ ...styles.actionBtn, backgroundColor: 'rgba(201, 76, 76, 0.15)', color: '#C94C4C', border: '1px solid rgba(201, 76, 76, 0.3)' }}
                            title="Reject consultation request"
                          >
                            ✕ Reject
                          </button>
                        )}
                        {!isFinished && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'Finished')}
                            style={{ ...styles.actionBtnSecondary, borderColor: theme.border, color: theme.text }}
                            title="Mark session as completed"
                          >
                            Mark Completed
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {appt.status !== 'Cancelled' && appt.status !== 'Finished' && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'Cancelled')}
                            style={{ ...styles.actionBtnSecondary, borderColor: 'rgba(201, 76, 76, 0.3)', color: '#C94C4C' }}
                            title="Cancel appointment request"
                          >
                            Cancel Request
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => setSelectedAppt(appt)}
                      style={{ ...styles.actionBtnSecondary, borderColor: theme.border, color: isDark ? '#53B7C5' : '#0F4C4A', marginLeft: 'auto', fontWeight: '700' }}
                      title="Inspect full appointment details"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Appointment Details */}
        {selectedAppt && (
          <div style={styles.modalOverlay} onClick={() => setSelectedAppt(null)}>
            <div
              style={{
                ...styles.modalContent,
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                maxWidth: '620px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: `1px solid ${theme.border}`, paddingBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, color: theme.text, fontSize: '1.2rem', fontWeight: '800' }}>
                      {selectedAppt.patient_name}
                    </h3>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: selectedAppt.status === 'Accepted' ? 'rgba(47, 125, 91, 0.15)' : selectedAppt.status === 'Due' || selectedAppt.status === 'Pending' ? 'rgba(217, 119, 69, 0.15)' : selectedAppt.status === 'Finished' ? 'rgba(83, 183, 197, 0.15)' : 'rgba(201, 76, 76, 0.15)',
                      color: selectedAppt.status === 'Accepted' ? '#2F7D5B' : selectedAppt.status === 'Due' || selectedAppt.status === 'Pending' ? '#D97745' : selectedAppt.status === 'Finished' ? '#53B7C5' : '#C94C4C',
                    }}>
                      {selectedAppt.status}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: theme.subtext }}>
                    Consultation ID #{selectedAppt.id} · Created {new Date(selectedAppt.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <button style={styles.modalCloseBtn} onClick={() => setSelectedAppt(null)}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ ...styles.apptDetailsBox, backgroundColor: isDark ? '#081119' : '#F7F9F8', borderColor: theme.borderSubtle }}>
                  <div style={styles.apptDetailItem}>
                    <span style={{ ...styles.detailLabel, color: theme.subtext }}>Modality / Battery</span>
                    <strong style={{ color: theme.text, fontSize: '0.9rem' }}>{selectedAppt.appointment_type}</strong>
                  </div>
                  <div style={styles.apptDetailItem}>
                    <span style={{ ...styles.detailLabel, color: theme.subtext }}>Scheduled Date & Time</span>
                    <strong style={{ color: theme.text, fontSize: '0.9rem' }}>{selectedAppt.scheduled_time}</strong>
                  </div>
                  <div style={styles.apptDetailItem}>
                    <span style={{ ...styles.detailLabel, color: theme.subtext }}>Attending Clinician</span>
                    <span style={{ color: theme.text, fontSize: '0.85rem', fontWeight: '700' }}>
                      {selectedAppt.clinician_name || 'Clinician not assigned'}
                    </span>
                  </div>
                  <div style={styles.apptDetailItem}>
                    <span style={{ ...styles.detailLabel, color: theme.subtext }}>Location / Channel</span>
                    <span style={{ color: theme.text, fontSize: '0.85rem' }}>{selectedAppt.location}</span>
                  </div>
                </div>

                {selectedAppt.notes ? (
                  <div style={{ padding: '0.75rem', borderRadius: '8px', border: `1px solid ${theme.borderSubtle}`, backgroundColor: isDark ? '#0f172a' : '#ffffff' }}>
                    <span style={{ ...styles.detailLabel, color: theme.subtext, display: 'block', marginBottom: '4px' }}>
                      {isClinician ? 'CLINICAL NOTES & INSTRUCTIONS' : 'PATIENT REASON / NOTES'}
                    </span>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: theme.text, lineHeight: '1.45' }}>{selectedAppt.notes}</p>
                  </div>
                ) : (
                  <div style={{ padding: '0.75rem', borderRadius: '8px', border: `1px dashed ${theme.borderSubtle}`, color: theme.subtext, fontSize: '0.82rem' }}>
                    No specific notes attached to this consultation.
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ ...styles.detailLabel, color: theme.subtext }}>
                    {isClinician ? 'CLINICAL TRIAGE ACTIONS' : 'APPOINTMENT ACTIONS'}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {isClinician ? (
                      <>
                        <button
                          onClick={() => handleStatusChange(selectedAppt.id, 'Accepted')}
                          style={{
                            ...styles.actionBtn,
                            backgroundColor: selectedAppt.status === 'Accepted' ? '#2F7D5B' : '#0F4C4A',
                            color: '#FFFFFF'
                          }}
                        >
                          {selectedAppt.status === 'Accepted' ? '✓ Accepted' : 'Confirm & Accept'}
                        </button>
                        <button
                          onClick={() => handleStatusChange(selectedAppt.id, 'Rejected')}
                          style={{
                            ...styles.actionBtn,
                            backgroundColor: selectedAppt.status === 'Rejected' ? '#C94C4C' : 'rgba(201, 76, 76, 0.15)',
                            color: selectedAppt.status === 'Rejected' ? '#FFFFFF' : '#C94C4C',
                            border: '1px solid rgba(201, 76, 76, 0.3)'
                          }}
                        >
                          {selectedAppt.status === 'Rejected' ? '✕ Rejected' : 'Reject Request'}
                        </button>
                        <button
                          onClick={() => handleStatusChange(selectedAppt.id, 'Finished')}
                          style={{
                            ...styles.actionBtnSecondary,
                            borderColor: theme.border,
                            color: theme.text
                          }}
                        >
                          {selectedAppt.status === 'Finished' ? '✓ Completed' : 'Mark Completed'}
                        </button>
                      </>
                    ) : (
                      selectedAppt.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleStatusChange(selectedAppt.id, 'Cancelled')}
                          style={{
                            ...styles.actionBtnSecondary,
                            borderColor: 'rgba(201, 76, 76, 0.3)',
                            color: '#C94C4C'
                          }}
                        >
                          Cancel Appointment Request
                        </button>
                      )
                    )}
                  </div>
                </div>

                {isClinician && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${theme.border}` }}>
                    <button
                      onClick={() => {
                        setSelectedAppt(null);
                        navigate('/patients');
                      }}
                      style={{ ...styles.actionBtnSecondary, borderColor: theme.border, color: theme.text }}
                    >
                      👤 View Patients Directory
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAppt(null);
                        navigate('/referral');
                      }}
                      style={{ ...styles.actionBtn, backgroundColor: theme.primaryTeal, color: '#FFFFFF' }}
                    >
                      📑 View Clinical Referral Dossier
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: New Consultation */}
        {showModal && (
          <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div
              style={{
                ...styles.modalContent,
                backgroundColor: theme.cardBg,
                borderColor: theme.border
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: `1px solid ${theme.border}`, paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, color: theme.text, fontSize: '1.15rem' }}>
                  {isClinician ? 'Schedule Clinical Consultation' : 'Book / Request Clinical Consultation'}
                </h3>
                <button style={styles.modalCloseBtn} onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleCreateAppointment} style={styles.form}>
                {isClinician ? (
                  <div style={styles.formGroup}>
                    <label style={{ ...styles.formLabel, color: theme.text }}>Select Monitored Patient</label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      required
                      style={{ ...styles.formInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                    >
                      {availablePatients.length > 0 ? (
                        availablePatients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (ID: P{p.id}) — Age: {p.age || 'N/A'}, Gender: {p.gender || 'N/A'}
                          </option>
                        ))
                      ) : (
                        <option value="">No patients available in registry</option>
                      )}
                    </select>
                  </div>
                ) : (
                  <div style={styles.formGroup}>
                    <label style={{ ...styles.formLabel, color: theme.text }}>Select Attending Specialist / Neurologist</label>
                    <select
                      value={selectedClinicianId}
                      onChange={(e) => setSelectedClinicianId(e.target.value)}
                      style={{ ...styles.formInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                    >
                      <option value="">— Unassigned (Clinic General Triage) —</option>
                      {availableClinicians.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.specialty || 'Cognitive Neurologist & Supervisor'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={styles.formGroup}>
                  <label style={{ ...styles.formLabel, color: theme.text }}>Consultation / Battery Modality</label>
                  <select
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value)}
                    style={{ ...styles.formInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                  >
                    <option value="Neurological Evaluation">Neurological Evaluation (Comprehensive)</option>
                    <option value="Acoustic Fluency Review">Acoustic Fluency & Speech Pause Review</option>
                    <option value="Stroop & Executive Battery">Stroop & Executive Function Battery</option>
                    <option value="Episodic Memory Assessment">Episodic Memory & Pattern Recall Battery</option>
                    <option value="Tier 2 Biomarker Review">Tier 2 CatBoost & TreeSHAP Review</option>
                    <option value="Tier 3 Structural MRI Consultation">Tier 3 Structural MRI & Hippocampal Review</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={styles.formGroup}>
                    <label style={{ ...styles.formLabel, color: theme.text }}>Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      style={{ ...styles.formInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={{ ...styles.formLabel, color: theme.text }}>Time</label>
                    <select
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      style={{ ...styles.formInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:30 PM">03:30 PM</option>
                      <option value="05:00 PM">05:00 PM</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={{ ...styles.formLabel, color: theme.text }}>Location / Channel</label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    style={{ ...styles.formInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                  >
                    <option value="Memory & Cognitive Health Clinic - Suite 402">Memory & Cognitive Health Clinic - Suite 402</option>
                    <option value="Virtual Tele-Neurology Video Consultation">Virtual Tele-Neurology Video Consultation</option>
                    <option value="Neuropsychology Testing Suite - Room 108">Neuropsychology Testing Suite - Room 108</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={{ ...styles.formLabel, color: theme.text }}>Clinical Notes / Instructions</label>
                  <textarea
                    rows={3}
                    placeholder="Caregiver collateral history, fasting instructions, prior battery drift notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ ...styles.formInput, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ ...styles.cancelBtn, borderColor: theme.border, color: theme.subtext }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ ...styles.submitBtn, backgroundColor: theme.primaryTeal, color: '#FFFFFF' }}
                  >
                    {submitting ? 'Processing...' : isClinician ? 'Schedule Appointment' : 'Submit Consultation Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  alertBox: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.84rem',
    fontWeight: '700',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrowBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '0.35rem',
  },
  eyebrowDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#0F4C4A',
  },
  eyebrowText: {
    fontSize: '0.72rem',
    fontWeight: '800',
    letterSpacing: '0.08em',
    color: '#287C78',
  },
  pageTitle: {
    fontSize: '1.6rem',
    fontWeight: '800',
    margin: '0 0 0.4rem 0',
    letterSpacing: '-0.02em',
  },
  pageSubtitle: {
    fontSize: '0.88rem',
    margin: 0,
    maxWidth: '780px',
    lineHeight: '1.45',
  },
  newApptBtn: {
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'opacity 0.2s',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
  },
  statCard: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '1.1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statLabel: {
    fontSize: '0.68rem',
    fontWeight: '800',
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: '800',
    lineHeight: '1.1',
  },
  statSub: {
    fontSize: '0.74rem',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '0.25rem',
  },
  filterGroup: {
    display: 'flex',
    gap: '1.25rem',
  },
  filterTab: {
    background: 'none',
    border: 'none',
    padding: '0.5rem 0.25rem',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  loadingBox: {
    padding: '3rem',
    textAlign: 'center',
    fontSize: '0.95rem',
  },
  emptyBox: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '3rem',
    textAlign: 'center',
  },
  appointmentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.25rem',
  },
  apptCard: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  apptCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '1rem',
  },
  apptPatientName: {
    margin: 0,
    fontSize: '0.98rem',
    fontWeight: '800',
  },
  apptClinician: {
    fontSize: '0.76rem',
    display: 'block',
    marginTop: '2px',
  },
  statusBadge: {
    fontSize: '0.7rem',
    fontWeight: '800',
    padding: '3px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  apptDetailsBox: {
    border: '1px solid',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
  },
  apptDetailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  detailLabel: {
    fontSize: '0.68rem',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  apptNotes: {
    margin: 0,
    fontSize: '0.78rem',
    lineHeight: '1.4',
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    marginTop: 'auto',
    flexWrap: 'wrap',
  },
  actionBtn: {
    border: 'none',
    borderRadius: '6px',
    padding: '0.45rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  actionBtnSecondary: {
    background: 'none',
    border: '1px solid',
    borderRadius: '6px',
    padding: '0.45rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modalContent: {
    width: '540px',
    borderRadius: '14px',
    border: '1px solid',
    padding: '1.5rem',
    boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.1rem',
    cursor: 'pointer',
    color: '#829ab1',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  formLabel: {
    fontSize: '0.76rem',
    fontWeight: '700',
  },
  formInput: {
    padding: '0.55rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.85rem',
    outline: 'none',
  },
  cancelBtn: {
    background: 'none',
    border: '1px solid',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  submitBtn: {
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1.25rem',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
  }
};

export default Appointments;
