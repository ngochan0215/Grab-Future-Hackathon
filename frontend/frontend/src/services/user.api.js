import api, { unwrap } from './api';

// PATCH /api/users/me → { user }
export const updateProfile = (patch) =>
  api.patch('/users/me', patch).then(unwrap);
