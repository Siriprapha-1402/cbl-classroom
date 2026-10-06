import axios from 'axios';
import { handleMockRequest } from './mockApi';

export const API_SERVER = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
  : (import.meta.env.DEV ? 'http://localhost:5000' : '');

const api = axios.create({ baseURL: `${API_SERVER}/api` });

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('cbl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // If no backend server URL is configured (e.g. standalone Vercel hosting)
  if (!API_SERVER) {
    try {
      const mockRes = await handleMockRequest(config);
      config.adapter = () => Promise.resolve(mockRes);
    } catch (mockErr) {
      config.adapter = () => Promise.reject(mockErr);
    }
  }
  return config;
});

api.interceptors.response.use(
  async (response) => {
    // If response returned HTML due to SPA fallback rewrite
    if (typeof response.data === 'string' && (response.data.includes('<!doctype') || response.data.includes('<!DOCTYPE'))) {
      return handleMockRequest(response.config);
    }
    return response;
  },
  async (err) => {
    // If backend connection failed (network error, connection refused, 404, or protected deployment)
    const isNetworkError = !err.response || err.code === 'ERR_NETWORK';
    const is404 = err.response?.status === 404;
    const isVercelAuth = err.response?.status === 401 && err.response?.data?.error?.message === 'Protected deployment';
    const isHtmlResponse = typeof err.response?.data === 'string' && (err.response.data.includes('<!doctype') || err.response.data.includes('<!DOCTYPE'));

    if (isNetworkError || is404 || isVercelAuth || isHtmlResponse) {
      try {
        const mockRes = await handleMockRequest(err.config);
        if (mockRes) return mockRes;
      } catch (mockErr) {
        return Promise.reject(mockErr);
      }
    }

    // Only redirect to login if 401 on protected route (not on /auth/login itself!)
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.clear();
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
