import api, { unwrap } from './api';

// GET /api/saved-routes → { routes }
export const listSavedRoutes = () =>
  api.get('/saved-routes').then(unwrap).then((d) => d.routes);

// GET /api/saved-routes/:id → { route }
export const getSavedRoute = (id) =>
  api.get(`/saved-routes/${id}`).then(unwrap).then((d) => d.route);

// POST /api/saved-routes → { route }
export const createSavedRoute = (payload) =>
  api.post('/saved-routes', payload).then(unwrap).then((d) => d.route);

// DELETE /api/saved-routes/:id
export const deleteSavedRoute = (id) =>
  api.delete(`/saved-routes/${id}`).then(unwrap);
