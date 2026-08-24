import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, registerUser, getProfile } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    const accessToken = res.data.access_token;
    localStorage.setItem('token', accessToken);
    let userData = { email, is_caregiver: false };
    try { userData = (await getProfile()).data; } catch (_) { /* dashboard remains usable if profile fetch is unavailable */ }
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userEmail', email);
    setToken(accessToken);
    setUser(userData);
    return res;
  };

  const register = async (name, email, password, age, consentGiven, isCaregiver = false) => {
    const res = await registerUser({ name, email, password, age, is_caregiver: isCaregiver, consent_given: consentGiven });
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
