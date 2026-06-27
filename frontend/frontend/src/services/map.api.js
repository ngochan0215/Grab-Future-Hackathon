import api, { unwrap } from './api';

// GET /api/places (?ramp=true&accessible_toilet=true) → { places }
export const getPlaces = (params = {}) =>
  api.get('/places', { params }).then(unwrap).then((d) => d.places);

// GET /api/places/:id/reviews → { reviews }
export const getPlaceReviews = (placeId) =>
  api.get(`/places/${placeId}/reviews`).then(unwrap).then((d) => d.reviews);

// POST /api/places/:id/reviews → { review }
export const reviewPlace = (placeId, payload) =>
  api.post(`/places/${placeId}/reviews`, payload).then(unwrap).then((d) => d.review);

// GET /api/segments → { segments }
export const getSegments = () =>
  api.get('/segments').then(unwrap).then((d) => d.segments);

// GET /api/alerts (?status=active&issue_type=...) → { alerts }
export const getAlerts = (params = {}) =>
  api.get('/alerts', { params }).then(unwrap).then((d) => d.alerts);

// POST /api/alerts → { alert }
export const reportAlert = (payload) =>
  api.post('/alerts', payload).then(unwrap).then((d) => d.alert);

// GET /api/bus/lines → { bus_lines }
export const getBusLines = () =>
  api.get('/bus/lines').then(unwrap).then((d) => d.bus_lines);

// GET /api/bus/stops → { bus_stops }
export const getBusStops = () =>
  api.get('/bus/stops').then(unwrap).then((d) => d.bus_stops);
