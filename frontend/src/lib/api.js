import axios from 'axios';

export const API_SERVER = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
  : (import.meta.env.DEV ? 'http://localhost:5000' : '');

const api = axios.create({ baseURL: `${API_SERVER}/api` });


api.interceptors.request.use(config => {
  const token = localStorage.getItem('cbl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
