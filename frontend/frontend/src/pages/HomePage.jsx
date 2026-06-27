import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { getPlaces, getAlerts, getBusLines, getBusStops, getSegments } from '../services/map.api';
import { issueLabel } from '../constants/labels';
import { Spinner, EmptyState } from '../components/ui';
import MapView from '../components/map/MapView';
import { segmentMidpoint } from '../utils/geo';
import PlaceReviews from '../components/PlaceReviews';

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);

  const [filters, setFilters] = useState({ ramp: false, accessible_toilet: false });
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [openPlace, setOpenPlace] = useState(null);

  const [alerts, setAlerts] = useState([]);
  const [segments, setSegments] = useState([]);
  const [busLines, setBusLines] = useState([]);
  const [busStops, setBusStops] = useState([]);

  useEffect(() => {
    getAlerts({ status: 'active' }).then(setAlerts).catch(() => {});
    getSegments().then(setSegments).catch(() => {});
    getBusLines().then(setBusLines).catch(() => {});
    getBusStops().then(setBusStops).catch(() => {});
  }, []);

  useEffect(() => {
    setPlacesLoading(true);
    const params = {};
    if (filters.ramp) params.ramp = true;
    if (filters.accessible_toilet) params.accessible_toilet = true;
    getPlaces(params)
      .then(setPlaces)
      .catch(() => setPlaces([]))
      .finally(() => setPlacesLoading(false));
  }, [filters]);

  const toggleFilter = (key) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  const placeMarkers = places
    .filter((p) => p.latitude && p.longitude)
    .map((p) => ({
      position: [p.latitude, p.longitude],
      emoji: p.has_ramp_entrance ? '♿' : '📍',
      label: p.place_name,
    }));
  const segMap = new Map(segments.map((s) => [s.segment_id, s]));
  const hazardMarkers = alerts
    .map((a) => {
      const mid = segmentMidpoint(segMap.get(a.segment_id));
      return mid ? { position: mid, label: issueLabel(a.issue_type) } : null;
    })
    .filter(Boolean);

  return (
    <main className="page">
      <header className="pageHeader">
        <div className="col">
          <h1>Xin chào{user?.name ? `, ${user.name.split(' ').pop()}` : ''} 👋</h1>
          <span className="sub">Tìm tuyến đường an toàn & dễ tiếp cận</span>
        </div>
      </header>

      {/* Search launcher → multi-step funnel */}
      <button
        className="card card--tap row"
        style={{ width: '100%', gap: 12, textAlign: 'left' }}
        onClick={() => navigate('/search')}
      >
        <span style={{ fontSize: 22 }}>🔍</span>
        <span className="muted">Bạn muốn đi đâu?</span>
      </button>

      {/* Accessibility map */}
      <div className="sectionTitle">Bản đồ tiếp cận</div>
      <MapView height={240} markers={placeMarkers} hazards={hazardMarkers} />
      <div className="mapLegend">
        <span>♿ Địa điểm tiếp cận</span>
        <span><i className="legendLine" style={{ background: '#dc2626' }} /> Cảnh báo</span>
      </div>

      {/* Live alerts */}
      <div className="sectionTitle">Cảnh báo trực tiếp</div>
      {alerts.length === 0 ? (
        <div className="card card--flat muted">Không có cảnh báo nào đang hoạt động.</div>
      ) : (
        alerts.map((a) => (
          <div className="card" key={a.alert_id}>
            <div className="row row--between">
              <span className="badge badge--danger">⚠️ {issueLabel(a.issue_type)}</span>
              <span className="muted small">đoạn #{a.segment_id}</span>
            </div>
            {a.description && <p className="muted" style={{ marginTop: 8 }}>{a.description}</p>}
          </div>
        ))
      )}

      {/* Accessible places */}
      <div className="sectionTitle">Địa điểm dễ tiếp cận</div>
      <div className="chips" style={{ marginBottom: 12 }}>
        <button
          className={`chip ${filters.ramp ? 'chip--active' : ''}`}
          onClick={() => toggleFilter('ramp')}
        >
          ♿ Có lối dốc
        </button>
        <button
          className={`chip ${filters.accessible_toilet ? 'chip--active' : ''}`}
          onClick={() => toggleFilter('accessible_toilet')}
        >
          🚻 WC tiếp cận
        </button>
      </div>

      {placesLoading ? (
        <Spinner />
      ) : places.length === 0 ? (
        <EmptyState icon="📍">Không có địa điểm phù hợp bộ lọc.</EmptyState>
      ) : (
        places.map((p) => (
          <div className="card" key={p.place_id}>
            <div
              className="row row--between card--tap"
              onClick={() => setOpenPlace(openPlace === p.place_id ? null : p.place_id)}
            >
              <div className="col">
                <span className="title">{p.place_name}</span>
                <span className="muted small">{p.category}</span>
              </div>
              <div className="chips">
                {p.has_ramp_entrance && <span className="badge badge--ok">♿</span>}
                {p.has_accessible_toilet && <span className="badge badge--accent">🚻</span>}
              </div>
            </div>
            {openPlace === p.place_id && <PlaceReviews placeId={p.place_id} />}
          </div>
        ))
      )}

      {/* Transit */}
      <div className="sectionTitle">Giao thông công cộng</div>
      <div className="card">
        {busLines.map((l) => (
          <div className="row row--between" key={l.line_id} style={{ padding: '6px 0' }}>
            <div className="col">
              <span className="title">{l.line_number}</span>
              <span className="muted small">{l.route_name}</span>
            </div>
            {l.has_low_floor_bus ? (
              <span className="badge badge--ok">Sàn thấp</span>
            ) : (
              <span className="badge badge--muted">Sàn cao</span>
            )}
          </div>
        ))}
        <hr className="divider" />
        <div className="muted small" style={{ marginBottom: 6 }}>Trạm dừng</div>
        <div className="chips">
          {busStops.map((s) => (
            <span
              key={s.stop_id}
              className={`badge ${s.wheelchair_accessible ? 'badge--ok' : 'badge--muted'}`}
            >
              {s.wheelchair_accessible ? '♿ ' : ''}{s.stop_name}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
