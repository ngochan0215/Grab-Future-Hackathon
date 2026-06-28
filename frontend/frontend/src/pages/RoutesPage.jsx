import { useEffect, useState } from 'react';
import { Clock, Navigation, Timer, History } from 'lucide-react';
import { listTrips } from '../services/trip.api';
import { Spinner, EmptyState, ErrorMsg } from '../components/ui';
import { formatDuration, formatDistance } from '../utils/formatRoute';
import TripCard from '../components/common/TripCard/TripCard';
import RouteDetailView from '../components/common/RouteDetailView/RouteDetailView';
import Header from '../components/layout/Header/Header';

const relTime = (iso) => {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d}d ago`;
};

export default function RoutesPage() {
  const [selectedTrip, setSelectedTrip] = useState(null);

  if (selectedTrip) {
    const stats = [
      selectedTrip.started_at && {
        label: 'Date',
        value: new Date(selectedTrip.started_at).toLocaleString('en-GB', { dateStyle: 'medium' }),
      },
      selectedTrip.actual_distance != null && {
        label: 'Distance',
        value: formatDistance(selectedTrip.actual_distance),
      },
      selectedTrip.actual_duration != null && {
        label: 'Duration',
        value: formatDuration(selectedTrip.actual_duration),
      },
    ].filter(Boolean);

    return (
      <main className="page page--plain">
        <RouteDetailView
          origin={selectedTrip.origin}
          destination={selectedTrip.destination}
          stats={stats}
          onBack={() => setSelectedTrip(null)}
        />
      </main>
    );
  }

  return (
    <main className="page">
      <Header title="Routes" />
      <div className="sectionTitle" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <History size={15} />
        Route History
      </div>
      <TripHistory onSelect={setSelectedTrip} />
    </main>
  );
}

function TripHistory({ onSelect }) {
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listTrips()
      .then(setTrips)
      .catch((e) => { setError(e.message); setTrips([]); });
  }, []);

  if (trips === null) return <Spinner />;

  return (
    <>
      <ErrorMsg>{error}</ErrorMsg>
      {trips.length === 0 ? (
        <EmptyState icon="🧭">No trips yet.</EmptyState>
      ) : (
        trips.map((t) => {
          const stats = [
            t.started_at && { icon: Clock, label: relTime(t.started_at) },
            t.actual_distance != null && { icon: Navigation, label: formatDistance(t.actual_distance) },
            t.actual_duration != null && { icon: Timer, label: formatDuration(t.actual_duration) },
          ].filter(Boolean);

          return (
            <TripCard
              key={t.trip_id}
              origin={t.origin}
              destination={t.destination}
              stats={stats}
              onClick={() => onSelect(t)}
            />
          );
        })
      )}
    </>
  );
}
