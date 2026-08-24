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
  if (!config.headers['Content-Type']) {
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
export const getScore = () => API.get('/score');
export const getScoreHistory = () => API.get('/scores/history');
export const calculateScore = () => API.post('/score/calculate');
export const saveSignal = (data) => API.post('/signals', data);
export const saveTestResult = (data) => API.post('/tests', data);
export const getTodaySignals = () => API.get('/signals/today');
export const predictLevel2 = (data) => API.post('/predict/level2', data);

// MCP Tool API Exports
export const detectLanguage = (data) => API.post('/api/detect-language', data);
export const analyseVoice = (formData) => API.post('/api/voice/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const generateReferral = (data) => API.post('/api/generate-referral', data);
export const classifyMRI = (formData) => API.post('/api/classify-mri', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getClinicalReport = (data) => API.post('/api/clinical-report', data);
export const getAuditLogs = () => API.get('/api/audit-logs');
export const invitePatient = (data) => API.post('/caregiver/invites', data);
export const getCaregiverPatients = () => API.get('/caregiver/patients');
export const getSharingRequests = () => API.get('/sharing/requests');
export const acceptSharingRequest = (id) => API.post(`/sharing/requests/${id}/accept`);
export const revokeSharingRequest = (id) => API.delete(`/sharing/requests/${id}`);

// Ping backend endpoint
export const pingBackend = () => API.get('/');
