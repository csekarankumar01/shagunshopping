import axios from 'axios';

// In dev, Vite proxies /api to the Express server (see vite.config.js).
// In production, set VITE_API_URL to the deployed API origin, e.g.
// https://your-api.onrender.com
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  withCredentials: true, // send/receive the httpOnly auth cookie (fallback)
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getErrorMessage = (err) =>
  err?.response?.data?.message || 'Something went wrong, please try again';

export default api;
