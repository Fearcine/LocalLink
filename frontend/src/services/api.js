/**
 * services/api.js
 * Centralised Axios instance with JWT injection and error normalisation.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ll_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ─── Response interceptor — normalise errors ──────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.message || error.message;

    // Token expired / invalid — force logout
    if (status === 401) {
      localStorage.removeItem('ll_token');
      // Let the AuthContext listener handle redirect
      window.dispatchEvent(new Event('ll:unauthorized'));
    }

    // Normalise error so callers can always do: err.message
    const normalised = new Error(message);
    normalised.status  = status;
    normalised.data    = error.response?.data;
    return Promise.reject(normalised);
  }
);

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export const authApi = {
  /** Send OTP to a phone number */
  sendOtp: (phone) =>
    api.post('/auth/send-otp', { phone }),

  /** Verify OTP — returns { token, user } */
  verifyOtp: (phone, otp) =>
    api.post('/auth/verify-otp', { phone, otp }),

  /** Fetch current user profile */
  getMe: () =>
    api.get('/auth/me'),
};

// ─── Freelancer endpoints ─────────────────────────────────────────────────────

export const freelancerApi = {
  /**
   * Submit freelancer application.
   * `formData` must be a FormData instance (multipart).
   */
  register: (formData) =>
    api.post('/freelancers/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** Verify OTP after registration */
  verifyOtp: (phone, otp) =>
    api.post('/freelancers/verify-otp', { phone, otp }),

  /** Search approved freelancers */
  search: (params) =>
    api.get('/freelancers/search', { params }),

  /** Public freelancer profile */
  getProfile: (id) =>
    api.get(`/freelancers/${id}`),

  /** Own profile (requires auth) */
  getMyProfile: () =>
    api.get('/freelancers/my-profile'),

  /** Update own profile */
  updateProfile: (data) =>
    api.put('/freelancers/my-profile', data),

  /** Masked contact info (requires auth) */
  getContact: (id) =>
    api.get(`/freelancers/${id}/contact`),

  /** Top-rated freelancers */
  getTop: () =>
    api.get('/freelancers/top'),
};

// ─── Admin endpoints ──────────────────────────────────────────────────────────

export const adminApi = {
  getStats: () =>
    api.get('/admin/stats'),

  getUsers: (params) =>
    api.get('/admin/users', { params }),

  banUser: (id, reason) =>
    api.put(`/admin/users/${id}/ban`, { reason }),

  unbanUser: (id) =>
    api.put(`/admin/users/${id}/unban`),

  getPendingFreelancers: (params) =>
    api.get('/admin/freelancers/pending', { params }),

  getAllFreelancers: (params) =>
    api.get('/admin/freelancers', { params }),

  approveFreelancer: (id) =>
    api.put(`/admin/freelancers/${id}/approve`),

  rejectFreelancer: (id, reason) =>
    api.put(`/admin/freelancers/${id}/reject`, { reason }),
};

// ─── Category endpoints ───────────────────────────────────────────────────────

export const categoryApi = {
  getAll: () =>
    api.get('/categories'),

  getGrouped: () =>
    api.get('/categories/grouped'),
};

export default api;
