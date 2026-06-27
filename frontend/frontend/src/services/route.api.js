import api, { unwrap } from './api';

// POST /api/routes/search → { origin, destination, count, routes }
export const searchRoutes = (payload) =>
  api.post('/routes/search', payload).then(unwrap);

// POST /api/routes/compare → { optimized, normal, difference }
export const compareRoutes = (payload) =>
  api.post('/routes/compare', payload).then(unwrap);

// POST /api/routes/:id/review → { review }
export const reviewRoute = (routeId, payload) =>
  api.post(`/routes/${routeId}/review`, payload).then(unwrap).then((d) => d.review);

// GET /api/routes/:id/reviews → { reviews }
export const getRouteReviews = (routeId) =>
  api.get(`/routes/${routeId}/reviews`).then(unwrap).then((d) => d.reviews);
