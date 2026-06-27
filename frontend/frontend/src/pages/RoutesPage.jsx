import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { searchRoutes } from '../services/route.api';
import RouteCard from '../components/RouteCard';
import MapView from '../components/map/MapView';
import { Spinner, ErrorMsg, EmptyState } from '../components/ui';
import { routePath } from '../utils/geo';
import { PRIORITIES } from '../constants/labels';

export default function RoutesPage() {
  const navigate = useNavigate();
  const origin = useAppStore((s) => s.origin);
  const destination = useAppStore((s) => s.destination);
  const transportMode = useAppStore((s) => s.transportMode);
  const priority = useAppStore((s) => s.priority);
  const setSelectedRoute = useAppStore((s) => s.setSelectedRoute);

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!origin || !destination) {
      navigate('/search', { replace: true });
      return;
    }
    setLoading(true);
    searchRoutes({
      origin: origin.label,
      destination: destination.label,
      transport_mode: transportMode,
      priority,
    })
      .then((d) => setRoutes(d.routes || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [origin, destination, transportMode, priority, navigate]);

  function pick(route) {
    setSelectedRoute(route);
    navigate('/compare');
  }

  const priLabel = PRIORITIES.find((p) => p.id === priority)?.label || priority;

  const polylines = routes.map((r) => ({
    coords: routePath(r),
    color: r.route_type === 'normal' ? '#9ca3af' : '#16a34a',
    dashArray: r.route_type === 'normal' ? '6 8' : undefined,
    weight: r.route_type === 'normal' ? 4 : 6,
  }));
  const ref = routes[0] ? routePath(routes[0]) : [];
  const markers = ref.length
    ? [
        { position: ref[0], emoji: '🟢', label: origin?.label },
        { position: ref[ref.length - 1], emoji: '🏁', label: destination?.label },
      ]
    : [];

  return (
    <main className="page">
      <header className="pageHeader">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/options')}>←</button>
        <div className="col">
          <h1>Tuyến gợi ý</h1>
          <span className="sub">Ưu tiên: {priLabel} · {origin?.label} → {destination?.label}</span>
        </div>
      </header>

      <ErrorMsg>{error}</ErrorMsg>

      {loading ? (
        <Spinner />
      ) : routes.length === 0 ? (
        <EmptyState icon="🚫">Không tìm được tuyến phù hợp.</EmptyState>
      ) : (
        <>
          <MapView height={240} polylines={polylines} markers={markers} />
          {routes.map((r) => (
            <RouteCard key={r.route_id} route={r} onClick={() => pick(r)} />
          ))}
        </>
      )}
    </main>
  );
}
