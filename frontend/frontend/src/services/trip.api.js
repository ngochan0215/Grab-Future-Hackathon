import api, { unwrap } from './api';

// GET /api/trips → { trips }
export const listTrips = () =>
  api.get('/trips').then(unwrap).then((d) => d.trips);

// POST /api/trips/start → { trip }
export const startTrip = (payload) =>
  api.post('/trips/start', payload).then(unwrap).then((d) => d.trip);

// POST /api/trips/:id/finish → { trip }
export const finishTrip = (id, payload = {}) =>
  api.post(`/trips/${id}/finish`, payload).then(unwrap).then((d) => d.trip);
