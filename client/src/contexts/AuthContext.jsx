import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { recordFailedRequest } from '../utils/diagnostics';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (window.location.hostname.includes('onrender.com') && window.location.hostname.includes('-frontend')) {
      return `https://${window.location.hostname.replace('-frontend', '-backend')}/api`;
    }
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:5000/api';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup Axios defaults with live fallback resolution
  axios.defaults.baseURL = getApiBaseUrl();
  axios.defaults.withCredentials = true;

  const storedToken = localStorage.getItem('token');
  if (storedToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
  }

  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        // Kept for the problem report, so a user who writes "it won't save"
        // still arrives with the call that failed attached.
        recordFailedRequest({
          method: originalRequest?.method,
          url: originalRequest?.url,
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
        const url = originalRequest?.url || '';
        // Only the login and the refresh call itself sit outside the refresh
        // path. /auth/me used to be excluded too — and /auth/me is the first
        // request every page load makes, so anyone reloading more than fifteen
        // minutes after signing in was sent to the login screen while holding
        // a refresh token good for a week.
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          originalRequest._retry = true;
          try {
            const refreshRes = await axios.post('/auth/refresh', {
              refreshToken: localStorage.getItem('refreshToken')
            });
            if (refreshRes.data?.token) {
              localStorage.setItem('token', refreshRes.data.token);
              axios.defaults.headers.common['Authorization'] = `Bearer ${refreshRes.data.token}`;
              originalRequest.headers.Authorization = `Bearer ${refreshRes.data.token}`;
            }
            return axios(originalRequest);
          } catch (refreshError) {
            // The session cannot be recovered — clear it and send the user to log
            // in, rather than leaving them clicking a button that keeps failing.
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
              window.location.assign('/login?expired=1');
            }
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    fetchUser();

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get('/auth/me', { timeout: 8000 });
      setUser(res.data.data);
    } catch (error) {
      // A rejected identity must end the session. This previously fabricated a
      // Super Admin whenever any string sat in localStorage, which made the app
      // look signed in while every subsequent request failed — and it only
      // appeared to work because the server authenticated everyone anyway.
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      } else {
        // No response at all (server down, timeout, offline). The token may still
        // be perfectly good, so keep it and let the user retry rather than
        // signing them out on a transient network fault.
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', { email, password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const setSession = (token, newUser, refreshToken) => {
    if (token) {
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    if (newUser) setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
};
