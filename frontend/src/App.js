import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import PassiveTracker from './components/PassiveTracker';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tests from './pages/Tests';
import Landing from './pages/Landing';
import Level2Assessment from './pages/Level2Assessment';
import Level3MRI from './pages/Level3MRI';
import VoiceJournal from './pages/VoiceJournal';
import CareCircle from './pages/CareCircle';
import { pingBackend } from './utils/api';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const { user } = useAuth();

  React.useEffect(() => {
    pingBackend().catch(() => {});
  }, []);

  return (
    <>
      <Navbar />
      {user && <PassiveTracker />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
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
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
