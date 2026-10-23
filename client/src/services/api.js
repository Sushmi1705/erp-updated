/**
 * Centralized Axios API client with:
 * - Request interceptor (adds auth token from cookie automatically via withCredentials)
 * - Response interceptor (handles 401 with token refresh, prevents infinite loops)
 * - Consistent error normalization
 */
import axios from 'axios';
import { getApiBaseUrl } from '../contexts/AuthContext';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,   // Send cookies automatically (HttpOnly JWT)
  timeout: 30000,
});

// Request interceptor: attach Authorization header if token exists in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = () => {
  refreshSubscribers.forEach(cb => cb());
  refreshSubscribers = [];
};

const subscribeToRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

// Response interceptor: handle 401 with token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    const isAuthEndpoint = url.includes('/auth/me') || url.includes('/auth/login') || url.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue this request to retry after refresh completes
        return new Promise((resolve, reject) => {
          subscribeToRefresh(() => {
            resolve(api(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Attempt token refresh (sends refreshToken cookie automatically)
        await axios.post(
          `${getApiBaseUrl()}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        onRefreshed();
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        return Promise.reject(refreshError);
      }
    }
    
    // Normalize error message
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject({ ...error, userMessage: message });
  }
);

export default api;
