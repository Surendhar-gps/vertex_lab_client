import axios from 'axios';
import { loadingBus } from '../context/loadingBus';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request, and kick off the global page-morph
// loading effect for every API call (unless explicitly opted out).
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cad_lab_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (!config.skipGlobalLoading) {
      loadingBus.start();
    }
    return config;
  },
  (error) => {
    loadingBus.stop();
    return Promise.reject(error);
  }
);

// Handle expired tokens globally, and always stop the global loading
// effect once a request settles (success or failure).
api.interceptors.response.use(
  (response) => {
    if (!response.config?.skipGlobalLoading) {
      loadingBus.stop();
    }
    return response;
  },
  (error) => {
    if (!error.config?.skipGlobalLoading) {
      loadingBus.stop();
    }
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      // Token expired or invalid — clear storage and redirect to login
      const role = localStorage.getItem('cad_lab_role') || 'student';
      localStorage.removeItem('cad_lab_token');
      localStorage.removeItem('cad_lab_user');
      localStorage.removeItem('cad_lab_role');
      window.location.href = `/${role}/login`;
    }
    return Promise.reject(error);
  }
);

export default api;