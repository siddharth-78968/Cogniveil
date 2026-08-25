import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser, getProfile } from '../utils/api';

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
    setToken(accessToken);

    let userData = { email, is_caregiver: false };
    try {
      const meRes = await getCurrentUser();
      userData = meRes.data;
    } catch (_) {
      try {
        const profRes = await getProfile();
        userData = profRes.data;
      } catch (err) {
        // fallback
      }
    }
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userEmail', userData.email || email);
    setUser(userData);
    return res;
  };

  const refreshUser = async () => {
    try {
      const meRes = await getCurrentUser();
      const userData = meRes.data;
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userEmail', userData.email);
      setUser(userData);
      return userData;
    } catch (_) {
      return null;
    }
  };

  const register = async (name, email, password, age, gender = 'Not specified', isCaregiver = false) => {
    const res = await registerUser({ name, email, password, age, gender, is_caregiver: isCaregiver });
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
    <AuthContext.Provider value={{ user, token, login, register, refreshUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
