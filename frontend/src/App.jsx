import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login            from './pages/Login';
import OtpVerify        from './pages/OtpVerify';
import FreelancerApply  from './pages/FreelancerApply';
import LandingPage      from './pages/LandingPage';
import UserDashboard    from './pages/UserDashboard';
import FreelancerListPage    from './pages/FreelancerListPage';
import FreelancerProfilePage from './pages/FreelancerProfilePage';
import FreelancerDashboard   from './pages/FreelancerDashboard';
import AdminDashboard        from './pages/AdminDashboard';
import NotFoundPage          from './pages/NotFoundPage';

// ─── Route guards ─────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

/** Redirect logged-in users away from public-only pages (login, apply). */
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) {
    if (user.role === 'admin')      return <Navigate to="/admin" replace />;
    if (user.role === 'freelancer') return <Navigate to="/freelancer/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/** Require authentication. Optionally restrict to certain roles. */
const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"              element={<LandingPage />} />
      <Route path="/freelancers"   element={<FreelancerListPage />} />
      <Route path="/freelancers/:id" element={<FreelancerProfilePage />} />

      {/* Auth (public-only) */}
      <Route path="/login"      element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/verify-otp" element={<OtpVerify />} />

      {/* Freelancer application — anyone can start, even if not logged in */}
      <Route path="/freelancer-apply" element={<FreelancerApply />} />

      {/* Protected — user */}
      <Route
        path="/dashboard"
        element={<PrivateRoute roles={['user']}><UserDashboard /></PrivateRoute>}
      />

      {/* Protected — freelancer */}
      <Route
        path="/freelancer/dashboard"
        element={<PrivateRoute roles={['freelancer']}><FreelancerDashboard /></PrivateRoute>}
      />

      {/* Protected — admin */}
      <Route
        path="/admin/*"
        element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>}
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
