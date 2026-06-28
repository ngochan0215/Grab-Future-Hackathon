import axios from 'axios';

const TOKEN_KEY = 'accessroute_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

const api = axios.create({
  // Backend mounts everything under /api (see backend/server.js)
  baseURL: `${import.meta.env.VITE_API_URL || 'https://grab-future-hackathon.onrender.com'}/api`,
  timeout: 10000,
});

// Attach JWT to every request when present
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise errors + handle expired sessions
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const hadToken = !!getToken();

    // Session expired / invalidated while authenticated → bounce to login.
    // (A 401 on the login request itself shouldn't redirect — there's no token yet.)
    if (status === 401 && hadToken) {
      setToken(null);
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    // Surface the backend's message ({ success, message }) to callers.
    const message =
      error.response?.data?.message ||
      error.message ||
      'Đã xảy ra lỗi. Vui lòng thử lại.';
    return Promise.reject(new Error(message));
  }
);

// Helper: unwrap the standard { success, message, data } envelope.
export const unwrap = (res) => res.data?.data ?? res.data;

export default api;
