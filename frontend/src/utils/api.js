import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Attach token if present
const token = localStorage.getItem('ll_token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Response interceptor for global error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ll_token');
      delete api.defaults.headers.common['Authorization'];
      // Let individual components handle redirect
    }
    return Promise.reject(error);
  }
);

export default api;
