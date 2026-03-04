/**
 * context/AuthContext.jsx
 * Provides authentication state and actions app-wide.
 *
 * Flow summary:
 *  - Normal user  → /login → OTP verify → auto-creates account → /dashboard
 *  - Freelancer   → /freelancer-apply → form + OTP → /freelancer/dashboard
 *  - Admin        → /login → OTP verify (admin already exists in DB) → /admin
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true while fetching initial /me
  const navigate = useNavigate();

  // ── Bootstrap: rehydrate from stored token ──────────────────────────────────
  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem('ll_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.getMe();
      setUser(data.user);
    } catch {
      // Token invalid or expired — clear silently
      localStorage.removeItem('ll_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();

    // Listen for 401 responses dispatched by the API interceptor
    const handleUnauthorized = () => {
      setUser(null);
      navigate('/login', { replace: true });
    };
    window.addEventListener('ll:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('ll:unauthorized', handleUnauthorized);
  }, [bootstrap, navigate]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Called after OTP verification succeeds.
   * Stores the token, sets user, and redirects based on role.
   */
  const loginSuccess = useCallback(
    (token, userData) => {
      localStorage.setItem('ll_token', token);
      setUser(userData);

      switch (userData.role) {
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'freelancer':
          navigate('/freelancer/dashboard', { replace: true });
          break;
        default:
          navigate('/dashboard', { replace: true });
      }
    },
    [navigate]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('ll_token');
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const updateUser = useCallback((updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  // ── Context value ────────────────────────────────────────────────────────────
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    loginSuccess,
    logout,
    updateUser,
    refreshUser: bootstrap,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
