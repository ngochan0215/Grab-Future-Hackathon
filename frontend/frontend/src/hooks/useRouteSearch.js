import { useState } from 'react';
import { getRoute } from '../services/routeService';

export function useRouteSearch() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function search(params) {
    setLoading(true);
    setError(null);
    try {
      const data = await getRoute(params);
      setRoutes(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return { routes, loading, error, search };
}
