import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PassiveTracker from './components/PassiveTracker';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tests from './pages/Tests';
import Landing from './pages/Landing';
import Level2Assessment from './pages/Level2Assessment';
import Level3MRI from './pages/Level3MRI';
import VoiceJournal from './pages/VoiceJournal';
import Consent from './pages/Consent';
import CareCircle from './pages/CareCircle';
import Appointments from './pages/Appointments';
import Patients from './pages/Patients';
import ReferralReport from './pages/ReferralReport';
import DementiaProfiling from './pages/DementiaProfiling';
import { pingBackend } from './utils/api';


const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.consent_granted === false && window.location.pathname !== '/consent') {
    return <Navigate to="/consent" replace />;
  }
  return children;
};

const RoleProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isClinician } = useAuth();
  if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (requiredRole === 'clinician' && !isClinician) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppContent = () => {
  const { user } = useAuth();

  React.useEffect(() => {
    pingBackend().catch(() => {});
  }, []);

  return (
    <>
      {user && <PassiveTracker />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/consent" element={
          <ProtectedRoute><Consent /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/patients" element={
          <RoleProtectedRoute requiredRole="clinician"><Patients /></RoleProtectedRoute>
        } />
        <Route path="/tests" element={
          <ProtectedRoute><Tests /></ProtectedRoute>
        } />
        <Route path="/voice" element={
          <ProtectedRoute><VoiceJournal /></ProtectedRoute>
        } />
        <Route path="/" element={<Landing />} />
        <Route path="/level2" element={
          <ProtectedRoute><Level2Assessment /></ProtectedRoute>
        } />
        <Route path="/level3" element={
          <ProtectedRoute><Level3MRI /></ProtectedRoute>
        } />
        <Route path="/care-circle" element={
          <ProtectedRoute><CareCircle /></ProtectedRoute>
        } />
        <Route path="/appointments" element={
          <ProtectedRoute><Appointments /></ProtectedRoute>
        } />
        <Route path="/referral" element={
          <RoleProtectedRoute requiredRole="clinician"><ReferralReport /></RoleProtectedRoute>
        } />
        <Route path="/dementia-profiling" element={
          <RoleProtectedRoute requiredRole="clinician"><DementiaProfiling /></RoleProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </>
  );
};


const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
