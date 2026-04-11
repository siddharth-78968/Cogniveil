import axios from 'axios';

const API = axios.create({
 baseURL: 'https://cogniveil-backend.onrender.com',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  config.headers['Content-Type'] = 'application/json';
  return config;
}, (error) => {
  return Promise.reject(error);
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const registerUser = (data) => API.post('/register', data);
export const loginUser = (data) => API.post('/login', data);
export const getScore = () => API.get('/score');
export const getScoreHistory = () => API.get('/scores/history');
export const calculateScore = () => API.post('/score/calculate');
export const saveSignal = (data) => API.post('/signals', data);
export const saveTestResult = (data) => API.post('/tests', data);
export const getTodaySignals = () => API.get('/signals/today');