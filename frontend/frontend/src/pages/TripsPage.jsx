import { useEffect, useState } from 'react';
import { listTrips, finishTrip } from '../services/trip.api';
import { Spinner, EmptyState, ErrorMsg } from '../components/ui';
import Header from '../components/layout/Header/Header';

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—');

export default function TripsPage() {
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listTrips().then(setTrips).catch((e) => { setError(e.message); setTrips([]); });
  }, []);

  async function finish(id) {
    try {
      const updated = await finishTrip(id);
      setTrips((ts) => ts.map((t) => (t.trip_id === id ? updated : t)));
    } catch (e) {
      setError(e.message);
    }
  }

  if (trips === null) return <main className="page"><Spinner /></main>;

  return (
    <main className="page">
      <Header title="Trips" />
      <ErrorMsg>{error}</ErrorMsg>
      {trips.length === 0 ? (
        <EmptyState icon="🧭">Bạn chưa có chuyến đi nào.</EmptyState>
      ) : (
        trips.map((t) => {
          const active = t.status === 'in_progress';
          return (
            <div className="card" key={t.trip_id}>
              <div className="row row--between">
                <span className="title">{t.origin} → {t.destination}</span>
                <span className={`badge ${active ? 'badge--accent' : 'badge--ok'}`}>
                  {active ? 'Đang đi' : 'Hoàn thành'}
                </span>
              </div>
              <p className="muted small" style={{ marginTop: 6 }}>
                Bắt đầu: {fmt(t.started_at)}
                {t.finished_at ? ` · Kết thúc: ${fmt(t.finished_at)}` : ''}
              </p>
              {t.actual_distance != null && (
                <p className="muted small">
                  Thực tế: {t.actual_distance}m · {t.actual_duration} phút
                </p>
              )}
              {active && (
                <button
                  className="btn btn--primary btn--block"
                  style={{ marginTop: 10 }}
                  onClick={() => finish(t.trip_id)}
                >⏹ End</button>
              )}
            </div>
          );
        })
      )}
    </main>
  );
}
