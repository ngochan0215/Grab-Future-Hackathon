import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { compareRoutes } from '../services/route.api';
import { getAlerts } from '../services/map.api';
import MapView from '../components/map/MapView';
import { ScoreBar, Spinner, ErrorMsg } from '../components/ui';
import { issueLabel, issueLabels, formatWarning } from '../constants/labels';
import { routePath, segmentMidpoint } from '../utils/geo';
import { formatDuration, formatDistance } from '../utils/formatRoute';

export default function ComparePage() {
  const navigate = useNavigate();
  const origin = useAppStore((s) => s.origin);
  const destination = useAppStore((s) => s.destination);
  const transportMode = useAppStore((s) => s.transportMode);
  const priority = useAppStore((s) => s.priority);
  const selectedRoute = useAppStore((s) => s.selectedRoute);
  const setSelectedRoute = useAppStore((s) => s.setSelectedRoute);

  const [diff, setDiff] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!origin || !destination) {
      navigate('/search', { replace: true });
      return;
    }
    Promise.all([
      compareRoutes({
        origin: origin.label,
        destination: destination.label,
        transport_mode: transportMode,
        priority,
      }),
      getAlerts({ status: 'active' }).catch(() => []),
    ])
      .then(([d, a]) => {
        setDiff(d);
        setAlerts(a);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [origin, destination, transportMode, priority, navigate]);

  function startNavigation() {
    // Default to the optimized route if the user hasn't explicitly chosen.
    const route = selectedRoute || diff?.optimized;
    setSelectedRoute(route);
    navigate('/navigate');
  }

  if (loading) return <main className="page"><Spinner /></main>;
  if (error) return <main className="page"><ErrorMsg>{error}</ErrorMsg></main>;
  if (!diff) return null;

  const { optimized, normal, difference } = diff;

  // Hazards sit on the NORMAL route's segments (the obstacles you'd hit).
  const normalSegIds = new Set(normal.segment_ids);
  const normalSegById = new Map((normal.segments || []).map((s) => [s.segment_id, s]));
  const hazards = alerts
    .filter((a) => normalSegIds.has(a.segment_id))
    .map((a) => {
      const mid = segmentMidpoint(normalSegById.get(a.segment_id));
      return mid ? { position: mid, label: issueLabels(a.issue_type) } : null;
    })
    .filter(Boolean);

  const polylines = [
    { coords: routePath(normal), color: '#9ca3af', dashArray: '6 8', weight: 4 },
    { coords: routePath(optimized), color: '#16a34a', weight: 6 },
  ];
  const op = routePath(optimized);
  const markers = op.length
    ? [
        { position: op[0], emoji: '🟢', label: origin?.label },
        { position: op[op.length - 1], emoji: '🏁', label: destination?.label },
      ]
    : [];

  const chosenIsNormal = selectedRoute?.route_type === 'normal';

  return (
    <main className="page">
      <header className="pageHeader">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/routes')}>←</button>
        <h1>So sánh tuyến</h1>
      </header>

      <MapView height={260} polylines={polylines} markers={markers} hazards={hazards} />
      <div className="mapLegend">
        <span><i className="legendLine" style={{ background: '#16a34a' }} /> Tối ưu</span>
        <span><i className="legendLine" style={{ background: '#9ca3af' }} /> Thông thường</span>
        <span><i className="legendLine" style={{ background: '#dc2626' }} /> Chướng ngại</span>
      </div>

      {/* Obstacles on the normal route — the whole point */}
      <div className="card" style={{ borderColor: 'var(--danger-bg)' }}>
        <div className="row row--between" style={{ marginBottom: 8 }}>
          <span className="title">⚠️ Tuyến thông thường</span>
          <span className="badge badge--danger">An toàn {normal.safety_score}</span>
        </div>
        {normal.warnings?.length > 0 ? (
          normal.warnings.map((w, i) => (
            <div key={i} className="row" style={{ gap: 8, padding: '4px 0' }}>
              <span className="badge badge--danger small">⚠</span>
              <span className="muted small">{formatWarning(w)}</span>
            </div>
          ))
        ) : (
          <p className="muted small">Không phát hiện chướng ngại đáng kể.</p>
        )}
        <p className="muted small" style={{ marginTop: 8 }}>
          Ngắn hơn {formatDistance(Math.abs(difference.extra_distance))} nhưng đi qua khu vực rủi ro.
        </p>
      </div>

      {/* Optimized route benefit */}
      <div className="card" style={{ borderColor: 'var(--accent-border)' }}>
        <div className="row row--between" style={{ marginBottom: 8 }}>
          <span className="title">✅ Tuyến tối ưu</span>
          <span className="badge badge--ok">An toàn {optimized.safety_score}</span>
        </div>
        {optimized.avoids?.length > 0 && (
          <div className="chips" style={{ marginBottom: 8 }}>
            {optimized.avoids.map((a, i) => (
              <span key={i} className="badge badge--ok small">✓ Tránh {issueLabel(a)}</span>
            ))}
          </div>
        )}
        <ScoreBar label="An toàn" value={optimized.safety_score} />
        <div style={{ height: 8 }} />
        <ScoreBar label="Dễ tiếp cận" value={optimized.accessibility_score} />
      </div>

      {/* Numeric difference */}
      <div className="card">
        <div className="sectionTitle" style={{ margin: '0 0 10px' }}>
          Tối ưu so với thông thường
        </div>
        <Diff label="An toàn" value={difference.safety_score} suffix=" điểm" />
        <Diff label="Dễ tiếp cận" value={difference.accessibility_score} suffix=" điểm" />
        <Diff label="Quãng đường" value={difference.extra_distance} render={(v) => formatDistance(Math.abs(v))} invert />
        <Diff label="Thời gian" value={difference.extra_duration} render={(v) => formatDuration(Math.abs(v))} invert />
      </div>

      {chosenIsNormal && (
        <div className="alertMsg alertMsg--error">
          Bạn đang chọn tuyến thông thường — cân nhắc tuyến tối ưu để an toàn hơn.
        </div>
      )}

      <button className="btn btn--primary btn--block" onClick={startNavigation}>
        ▶ Đi tuyến {chosenIsNormal ? 'đã chọn' : 'tối ưu'}
      </button>
    </main>
  );
}

function Diff({ label, value, suffix = '', render, invert }) {
  const better = invert ? value <= 0 : value >= 0;
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  const text = render ? render(value) : `${Math.abs(value)}${suffix}`;
  return (
    <div className="row row--between" style={{ padding: '4px 0' }}>
      <span className="muted">{label}</span>
      <span className={`badge ${better ? 'badge--ok' : 'badge--warn'}`}>{sign}{text}</span>
    </div>
  );
}
