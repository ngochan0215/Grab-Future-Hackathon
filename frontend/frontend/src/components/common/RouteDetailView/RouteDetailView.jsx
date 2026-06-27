import { useEffect, useState } from 'react';
import { searchRoutes } from '../../../services/route.api';
import { getSavedRoute } from '../../../services/savedRoute.api';
import { routePath } from '../../../utils/geo';
import MapView from '../../map/MapView';
import BackButton from '../BackButton/BackButton';
import { Spinner } from '../../ui';
import styles from './RouteDetailView.module.css';

/**
 * Shared route detail view used by RoutesPage (trip history) and SavedPage.
 *
 * stats: [{ label: string, value: string }] — shown in the gradient card footer.
 * savedRouteId: when provided, fetches coords via getSavedRoute (more accurate).
 *               Otherwise falls back to searchRoutes(origin, destination).
 */
export default function RouteDetailView({ origin, destination, stats = [], savedRouteId, onBack }) {
  const [routeCoords, setRouteCoords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = savedRouteId
      ? getSavedRoute(savedRouteId).then((r) => routePath(r))
      : searchRoutes({
          origin,
          destination,
          transport_mode: 'walk_only',
          priority: 'safety',
        }).then((d) => routePath((d.routes || [])[0]));

    fetch
      .then((coords) => { if (coords?.length) setRouteCoords(coords); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [origin, destination, savedRouteId]);

  const polylines = routeCoords.length
    ? [{ coords: routeCoords, color: '#0d9b87', weight: 5 }]
    : [];

  const markers = routeCoords.length
    ? [
        { position: routeCoords[0], emoji: '🟢', label: origin },
        { position: routeCoords[routeCoords.length - 1], emoji: '🏁', label: destination },
      ]
    : [];

  return (
    <>
      <div className={styles.header}>
        <BackButton onClick={onBack} />
        <h2 className={styles.heading}>Route Detail</h2>
      </div>

      <div className={styles.card}>
        <div className={styles.route}>
          <div className={styles.timeline}>
            <div className={styles.dotOrigin} />
            <div className={styles.connector} />
            <div className={styles.dotDest} />
          </div>
          <div className={styles.labels}>
            <span className={styles.place}>{origin}</span>
            <span className={styles.place}>{destination}</span>
          </div>
        </div>

        {stats.length > 0 && (
          <div className={styles.stats}>
            {stats.map((s, i) => (
              <div key={i} className={styles.stat}>
                <span className={styles.statVal}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? <Spinner /> : (
        <MapView height={340} polylines={polylines} markers={markers} />
      )}
    </>
  );
}
