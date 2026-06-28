import api, { unwrap } from './api';

// GET /api/addresses → { addresses }
export const listAddresses = () =>
  api.get('/addresses').then(unwrap).then((d) => d.addresses);

// POST /api/addresses → { address }
export const createAddress = (payload) =>
  api.post('/addresses', payload).then(unwrap).then((d) => d.address);

// DELETE /api/addresses/:id
export const deleteAddress = (id) => api.delete(`/addresses/${id}`).then(unwrap);
