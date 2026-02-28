import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import UserDashboard from './pages/UserDashboard';
import FreelancerListPage from './pages/FreelancerListPage';
import FreelancerProfilePage from './pages/FreelancerProfilePage';
import FreelancerSignupPage from './pages/FreelancerSignupPage';
import FreelancerDashboard from './pages/FreelancerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';

// Route guards
const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'freelancer') return <Navigate to="/freelancer/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/freelancers" element={<FreelancerListPage />} />
      <Route path="/freelancers/:id" element={<FreelancerProfilePage />} />

      {/* Complete profile (new users) */}
      <Route path="/complete-profile" element={<PrivateRoute><CompleteProfilePage /></PrivateRoute>} />

      {/* User */}
      <Route path="/dashboard" element={<PrivateRoute roles={['user']}><UserDashboard /></PrivateRoute>} />

      {/* Freelancer */}
      <Route path="/freelancer/signup" element={<PrivateRoute><FreelancerSignupPage /></PrivateRoute>} />
      <Route path="/freelancer/dashboard" element={<PrivateRoute roles={['freelancer']}><FreelancerDashboard /></PrivateRoute>} />

      {/* Admin */}
      <Route path="/admin/*" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
