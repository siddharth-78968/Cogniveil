import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser, getProfile, loginWithGoogle, demoAuth } from '../utils/api';

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

    let userData = { email, role: 'patient', is_caregiver: false };
    if (res.data && res.data.user) {
      userData = res.data.user;
    } else {
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
    }
    // Normalize role
    if (!userData.role) {
      userData.role = userData.is_caregiver ? 'clinician' : 'patient';
    }
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userEmail', userData.email || email);
    setUser(userData);
    return res;
  };

  const loginDemo = async (email) => {
    const res = await demoAuth(email);
    const accessToken = res.data.access_token;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);

    let userData = { 
      email, 
      role: (email === 'riyamehta55@gmail.com' ? 'clinician' : 'patient'), 
      is_caregiver: (email === 'riyamehta55@gmail.com') 
    };
    if (res.data && res.data.user) {
      userData = res.data.user;
    } else {
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
    }
    // Normalize role
    if (!userData.role) {
      userData.role = (email === 'riyamehta55@gmail.com' || userData.is_caregiver) ? 'clinician' : 'patient';
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
      if (!userData.role) {
        userData.role = userData.is_caregiver ? 'clinician' : 'patient';
      }
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userEmail', userData.email);
      setUser(userData);
      return userData;
    } catch (_) {
      return null;
    }
  };

  const register = async (name, email, password, age, gender = 'Not specified', isCaregiver = false, role = null) => {
    const assignedRole = role || (isCaregiver ? 'clinician' : 'patient');
    const res = await registerUser({ 
      name, 
      email, 
      password, 
      age, 
      gender, 
      is_caregiver: isCaregiver || assignedRole === 'clinician',
      role: assignedRole
    });
    return res;
  };

  const updateProfile = async (profileData) => {
    const { updateUserProfile } = await import('../utils/api');
    const res = await updateUserProfile(profileData);
    if (res.data?.access_token) {
      localStorage.setItem('token', res.data.access_token);
      setToken(res.data.access_token);
    }
    if (res.data?.user) {
      const updatedUser = {
        ...user,
        ...res.data.user,
        role: res.data.user.role || (res.data.user.is_caregiver ? 'clinician' : 'patient')
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('userEmail', updatedUser.email);
      setUser(updatedUser);
    }
    return res.data;
  };

  const googleLogin = async (googleData) => {
    const res = await loginWithGoogle(googleData);
    const accessToken = res.data.access_token;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);

    let userData = res.data.user || {
      email: googleData.email,
      name: googleData.name || 'Google User',
      role: googleData.role || 'patient'
    };
    if (!userData.role) {
      userData.role = userData.is_caregiver ? 'clinician' : 'patient';
    }
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userEmail', userData.email);
    setUser(userData);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    setToken(null);
    setUser(null);
  };

  const isClinician = user?.role === 'clinician' || Boolean(user?.is_caregiver);
  const isPatient = !isClinician;

  return (
    <AuthContext.Provider value={{ user, token, login, loginDemo, googleLogin, register, refreshUser, updateProfile, logout, loading, isClinician, isPatient }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
