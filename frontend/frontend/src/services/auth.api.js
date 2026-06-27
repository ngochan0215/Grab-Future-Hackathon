import api, { unwrap } from './api';

// POST /api/auth/register → { token, user }
export const register = (payload) =>
  api.post('/auth/register', payload).then(unwrap);

// POST /api/auth/login → { token, user }
export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then(unwrap);

// GET /api/auth/me → { user }
export const getMe = () => api.get('/auth/me').then(unwrap);
