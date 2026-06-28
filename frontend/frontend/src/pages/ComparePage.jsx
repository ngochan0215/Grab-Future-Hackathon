import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import BuddyInviteSheet from '../components/BuddyInviteSheet';
import { compareRoutes } from '../services/route.api';
import { getAlerts } from '../services/map.api';
import MapView from '../components/map/MapView';
import { ScoreBar, Spinner, ErrorMsg } from '../components/ui';
import { issueLabel, issueLabels, formatWarning } from '../constants/labels';
import { routePath, segmentMidpoint } from '../utils/geo';
import { formatDuration, formatDistance } from '../utils/formatRoute';
import Header from '../components/layout/Header/Header';

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

  const transitBuddy    = useAppStore((s) => s.transitBuddy);
  const setTransitBuddy = useAppStore((s) => s.setTransitBuddy);

  const [grabSheet,   setGrabSheet]   = useState(false);
  const [buddySheet,  setBuddySheet]  = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null);

  function startNavigation() {
    const route = selectedRoute || diff?.optimized;
    setSelectedRoute(route);
    if (route?.grab_legs?.length) {
      setPendingRoute(route);
      setGrabSheet(true);
    } else {
      navigate('/navigate');
    }
  }

  function confirmGrab() {
    setGrabSheet(false);
    navigate('/grab-booking', { state: { leg: pendingRoute.grab_legs[0], fullRoute: { origin: pendingRoute.origin, destination: pendingRoute.destination } } });
  }

  function skipGrab() {
    setGrabSheet(false);
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
      <Header title="So sánh tuyến" back />

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

      <button
        className="btn btn--block"
        style={{ marginBottom: 8 }}
        onClick={() => {
          setSelectedRoute(optimized);
          navigate('/route-preview', { state: { alerts } });
        }}
      >
        🔍 Xem trước tuyến đường
      </button>

      {/* Transit Buddy row */}
      <button
        className="btn btn--block"
        style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        onClick={() => setBuddySheet(true)}
      >
        <span>👁️ Transit Buddy</span>
        {transitBuddy
          ? <span style={{ fontSize: 12, background: '#D1FAE5', color: '#065F46', borderRadius: 8, padding: '2px 8px', fontWeight: 700 }}>
              {transitBuddy.name} đang theo dõi
            </span>
          : <span style={{ fontSize: 12, color: '#9CA3AF' }}>Chưa thiết lập</span>}
      </button>

      <button className="btn btn--primary btn--block" onClick={startNavigation}>
        ▶ Đi tuyến {chosenIsNormal ? 'đã chọn' : 'tối ưu'}
      </button>

      {buddySheet && (
        <BuddyInviteSheet
          route={{ origin: optimized.origin, destination: optimized.destination, total_duration: optimized.total_duration }}
          current={transitBuddy}
          onSave={(b) => { setTransitBuddy(b); setBuddySheet(false); }}
          onClear={() => { setTransitBuddy(null); setBuddySheet(false); }}
          onClose={() => setBuddySheet(false)}
        />
      )}

      {/* Grab/Be bottom sheet */}
      {grabSheet && pendingRoute?.grab_legs?.[0] && (() => {
        const leg = pendingRoute.grab_legs[0];
        return (
          <>
            {/* overlay */}
            <div
              onClick={skipGrab}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50,
              }}
            />
            {/* sheet */}
            <div style={{
              position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '100%', maxWidth: 430, background: '#fff',
              borderRadius: '24px 24px 0 0',
              padding: '20px 20px 36px',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
              zIndex: 51,
            }}>
              {/* handle */}
              <div style={{ width: 40, height: 4, background: '#E5E7EB', borderRadius: 2, margin: '0 auto 18px' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: '#00b14f1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24,
                }}>🏍️</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1A2E' }}>
                    Tuyến này có đoạn đi xe máy
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                    Bạn có muốn đặt Grab/Be không?
                  </div>
                </div>
              </div>

              {/* leg detail */}
              <div style={{
                background: '#F9FAFB', borderRadius: 14, padding: '12px 14px', marginBottom: 18,
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 3 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00b14f' }} />
                    <div style={{ width: 2, height: 24, background: '#D1D5DB' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', marginBottom: 8 }}>
                      {leg.pickup_label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>
                      {leg.dropoff_label}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>📏 {leg.distance} m</span>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>⏱ ~{leg.duration} phút</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={skipGrab}
                  style={{
                    flex: 1, padding: '13px 0', borderRadius: 14,
                    border: '1.5px solid #E5E7EB', background: '#fff',
                    fontWeight: 700, fontSize: 14, color: '#6B7280', cursor: 'pointer',
                  }}
                >
                  Bỏ qua
                </button>
                <button
                  onClick={confirmGrab}
                  style={{
                    flex: 2, padding: '13px 0', borderRadius: 14,
                    border: 'none', background: '#00b14f',
                    fontWeight: 700, fontSize: 14, color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <span>🚗</span> Đặt Grab / Be
                </button>
              </div>
            </div>
          </>
        );
      })()}
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
