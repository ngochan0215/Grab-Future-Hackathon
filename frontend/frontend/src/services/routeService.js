import api from './api';
import { mockRoutes } from './mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export async function getRoute(params) {
  if (USE_MOCK) return mockRoutes;
  const { data } = await api.post('/route', params);
  return data;
}
