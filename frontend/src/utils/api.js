import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthUrl = error.config && (error.config.url?.includes('/login') || error.config.url?.includes('/register'));
    if (error.response && error.response.status === 401 && !isAuthUrl) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;

export const registerUser = (data) => API.post('/register', data);
export const loginUser = (data) => API.post('/login', data);
export const getProfile = () => API.get('/me');
export const getCurrentUser = () => API.get('/auth/me');
export const updateUserProfile = (data) => API.put('/api/user/profile', data);
export const requestVerificationCode = () => API.post('/api/user/request-verification-code');
export const getStreak = () => API.get('/api/user/streak');
export const getScore = () => API.get('/score');
export const getScoreHistory = () => API.get('/scores/history');
export const calculateScore = () => API.post('/score/calculate');
export const saveSignal = (data) => API.post('/signals', data);
export const saveTestResult = (data) => API.post('/tests', data);
export const getTodaySignals = () => API.get('/signals/today');
export const grantConsent = (consentGranted = true) => API.post('/auth/consent', { consent_granted: consentGranted });
export const submitLevel2 = (data) => API.post('/api/level2/submit', data);
export const predictLevel2 = (data) => API.post('/predict/level2', data);

// MCP Tool API Exports
export const detectLanguage = (data) => API.post('/api/detect-language', data);
export const analyseVoice = (formData) => API.post('/api/voice/analyze', formData);
export const generateReferral = (data) => API.post('/api/generate-referral', data);
export const classifyMRI = (formData) => API.post('/api/classify-mri', formData);
export const getClinicalReport = (data) => API.post('/api/clinical-report', data);
export const getAuditLogs = () => API.get('/api/audit-logs');
export const invitePatient = (data) => API.post('/caregiver/invites', data);
export const getCaregiverPatients = () => API.get('/caregiver/patients');
export const getSharingRequests = () => API.get('/sharing/requests');
export const acceptSharingRequest = (id) => API.post(`/sharing/requests/${id}/accept`);
export const revokeSharingRequest = (id) => API.delete(`/sharing/requests/${id}`);

// Evidence Graph, Notifications, Search & Appointments APIs
export const getEvidenceGraph = (patientId) => API.get(`/api/evidence-graph${patientId ? `?patient_id=${patientId}` : ''}`);
export const getNotifications = () => API.get('/api/notifications');
export const markNotificationRead = (id) => API.post(`/api/notifications/${id}/read`);
export const clearNotifications = () => API.post('/api/notifications/clear');
export const getClinicians = () => API.get('/api/clinicians');
export const getAppointments = () => API.get('/api/appointments');
export const getAppointmentById = (id) => API.get(`/api/appointments/${id}`);
export const createAppointment = (data) => API.post('/api/appointments', data);
export const updateAppointmentStatus = (id, status) => API.put(`/api/appointments/${id}/status`, { status });
export const deleteAppointment = (id) => API.delete(`/api/appointments/${id}`);
export const searchApi = (query) => API.get(`/api/search?q=${encodeURIComponent(query)}`);
export const demoAuth = (email) => API.post(`/api/auth/demo?email=${encodeURIComponent(email)}`);

// Clinician Patient Inspection APIs
export const getClinicianPatients = () => API.get('/api/clinician/patients');
export const getClinicianPatientOverview = (patientId) => API.get(`/api/clinician/patients/${patientId}/overview`);
export const getClinicianPatientTests = (patientId) => API.get(`/api/clinician/patients/${patientId}/tests`);
export const getClinicianPatientVoice = (patientId) => API.get(`/api/clinician/patients/${patientId}/voice`);
export const getClinicianPatientLevel2 = (patientId) => API.get(`/api/clinician/patients/${patientId}/level2`);
export const getClinicianPatientMRI = (patientId) => API.get(`/api/clinician/patients/${patientId}/mri`);
export const getClinicianPatientDementiaProfile = (patientId) => API.get(`/api/clinician/patients/${patientId}/dementia-profile`);

// Clinical PDF Export APIs (Binary PDF Blobs)
export const downloadClinicalReportPDF = (data) => API.post('/api/clinical-report/pdf', data, { responseType: 'blob' });
export const downloadPatientReportPDF = (patientId) => API.get(`/api/clinician/patients/${patientId}/report-pdf`, { responseType: 'blob' });

// Chatbot Assistant API
export const sendChatMessage = (question) => API.post('/chat', { question });

// Ping backend endpoint
export const pingBackend = () => API.get('/');




