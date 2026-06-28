import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import BuddyInviteSheet from '../components/BuddyInviteSheet';
import { compareRoutes } from '../services/route.api';
import { getAlerts } from '../services/map.api';
import { fetchDirectRoute, fetchDetourRoute } from '../services/osrm.api';
import MapView from '../components/map/MapView';
import { ScoreBar, Spinner, ErrorMsg } from '../components/ui';
import { issueLabelEn, issueLabelsEn, formatWarningEn, STRATEGY_LABELS, BREAKDOWN_FACTORS } from '../constants/labels';
import { routePath, segmentMidpoint } from '../utils/geo';
import { formatDuration, formatDistance } from '../utils/formatRoute';
import Header from '../components/layout/Header/Header';
import styles from '../styles/ComparePage.module.css';

const SAFE_COLOR  = '#16a34a'; // green — safe route
const RISKY_COLOR = '#dc2626'; // red   — risky route

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
  const [roads, setRoads] = useState({ optimized: [], normal: [] });
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
      .then(([d, a]) => { setDiff(d); setAlerts(a); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [origin, destination, transportMode, priority, navigate]);

  // Draw two real-road lines via OSRM:
  //   risky (direct)  = shortest path origin → destination
  //   safe  (detour)  = path via a side-offset waypoint, simulating hazard avoidance
  useEffect(() => {
    if (!origin || !destination) return;
    const start = origin.lat  != null ? [origin.lat,      origin.lng]      : null;
    const end   = destination.lat != null ? [destination.lat, destination.lng] : null;
    if (!start || !end) return;

    const ctrl = new AbortController();
    Promise.all([
      fetchDirectRoute(start, end, ctrl.signal).catch(() => []),
      fetchDetourRoute(start, end, ctrl.signal).catch(() => []),
    ]).then(([direct, detour]) => setRoads({ normal: direct, optimized: detour }));
    return () => ctrl.abort();
  }, [origin, destination]);

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
    navigate('/grab-booking', {
      state: { leg: pendingRoute.grab_legs[0], fullRoute: { origin: pendingRoute.origin, destination: pendingRoute.destination } },
    });
  }

  function skipGrab() {
    setGrabSheet(false);
    navigate('/navigate');
  }

  if (loading) return <main className="page"><Spinner /></main>;
  if (error)   return <main className="page"><ErrorMsg>{error}</ErrorMsg></main>;
  if (!diff)   return null;

  const { optimized, normal, difference } = diff;

  const normalSegIds  = new Set(normal.segment_ids ?? []);
  const normalSegById = new Map((normal.segments ?? []).map((s) => [s.segment_id, s]));

  // Hazard dots — only alerts on the risky route (not the safe route)
  const hazards = alerts
    .filter((a) => normalSegIds.has(a.segment_id))
    .map((a) => {
      const mid = segmentMidpoint(normalSegById.get(a.segment_id));
      return mid ? { position: mid, label: issueLabelsEn(a.issue_type), color: '#dc2626' } : null;
    })
    .filter(Boolean);

  // Zone circles (khoanh vùng) — only on the risky route's low-safety segments
  const zones = (normal.segments ?? [])
    .filter((s) => s.safety_score != null && s.safety_score < 3.5)
    .map((s) => {
      const mid = segmentMidpoint(s);
      return mid ? { position: mid, color: s.safety_score < 2.5 ? '#dc2626' : '#f59e0b' } : null;
    })
    .filter(Boolean);

  // Road-snapped geometry from OSRM; fall back to raw segment paths.
  const normalCoords    = roads.normal.length    ? roads.normal    : routePath(normal);
  const optimizedCoords = roads.optimized.length ? roads.optimized : routePath(optimized);

  // Origin / destination pins from store coords (most reliable source).
  const originPt = origin?.lat  != null ? [origin.lat,      origin.lng]      : null;
  const destPt   = destination?.lat != null ? [destination.lat, destination.lng] : null;

  const polylines = [
    { coords: normalCoords,    color: RISKY_COLOR, dashArray: '6 8', weight: 4 },
    { coords: optimizedCoords, color: SAFE_COLOR,  dashArray: '6 8', weight: 5 },
  ];
  const markers = [
    originPt && { position: originPt, emoji: '🟢', label: origin?.label },
    destPt   && { position: destPt,   emoji: '🏁', label: destination?.label },
  ].filter(Boolean);

  const chosenIsNormal = selectedRoute?.route_type === 'normal';

  const explanation      = difference.recommendation_explanation;
  const strategyId       = difference.recommendation_strategy?.id;
  const strategyLabel    = strategyId ? (STRATEGY_LABELS[strategyId] ?? difference.recommendation_strategy?.name) : null;
  const breakdown        = optimized.accessibility_breakdown ?? {};

  return (
    <main className="page">
      <Header title="Compare Routes back" />

      {/* Map */}
      <MapView height={300} polylines={polylines} markers={markers} hazards={hazards} zones={zones} interactive />
      <div className="mapLegend">
        <span><i className="legendLine" style={{ background: SAFE_COLOR }} /> Safe route</span>
        <span><i className="legendLine" style={{ background: RISKY_COLOR }} /> Risky route</span>
        <span><i className="legendDot" style={{ background: '#dc2626' }} /> Hazard</span>
        <span><i className="legendZone" style={{ borderColor: '#f59e0b' }} /> Low-access zone</span>
      </div>

      {/* ── Engine explanation card ─────────────────────────────────────────── */}
      {explanation && (
        <div className={styles.explanationCard}>
          <div className={styles.explanationHeader}>
            <span className={styles.explanationTitle}>Recommendation</span>
            {strategyLabel && (
              <span className={styles.strategyBadge}>{strategyLabel}</span>
            )}
          </div>
          <p className={styles.explanationText}>{explanation}</p>
        </div>
      )}

      {/* ── Risky route — hazards + optional rejection ──────────────────────── */}
      <div className="card" style={{ borderColor: 'var(--danger-bg)' }}>
        <div className="row row--between" style={{ marginBottom: 8 }}>
          <span className="title">⚠️ Risky route</span>
          {normal.rejected ? (
            <span className="badge badge--danger">Rejected</span>
          ) : (
            <span className="badge badge--danger">Safety {normal.safety_score}</span>
          )}
        </div>

        {normal.warnings?.length > 0 ? (
          normal.warnings.map((w, i) => (
            <div key={i} className="row" style={{ gap: 8, padding: '4px 0' }}>
              <span className="badge badge--danger small">⚠</span>
              <span className="muted small">{formatWarningEn(w)}</span>
            </div>
          ))
        ) : (
          <p className="muted small">No significant hazards detected.</p>
        )}

        <p className="muted small" style={{ marginTop: 8 }}>
          {formatDistance(Math.abs(difference.extra_distance))} shorter, but passes through risky areas.
        </p>

        {normal.rejected && normal.rejection_reason && (
          <div className={styles.rejectionBanner}>
            <span className={styles.rejectionIcon}>⛔</span>
            <p className={styles.rejectionText}>{normal.rejection_reason}</p>
          </div>
        )}
      </div>

      {/* ── Safe route — scores + breakdown ─────────────────────────────────── */}
      <div className="card" style={{ borderColor: 'var(--accent-border)' }}>
        <div className="row row--between" style={{ marginBottom: 8 }}>
          <span className="title">✅ Safe route</span>
          <div className="row" style={{ gap: 6 }}>
            {optimized.priority_score > 0 && (
              <span className={styles.scorePill}>
                {optimized.priority_score}/100
              </span>
            )}
            <span className="badge badge--ok">Safety {optimized.safety_score}</span>
          </div>
        </div>

        {optimized.avoids?.length > 0 && (
          <div className="chips" style={{ marginBottom: 8 }}>
            {optimized.avoids.map((a, i) => (
              <span key={i} className="badge badge--ok small">✓ Avoids {issueLabelEn(a)}</span>
            ))}
          </div>
        )}

        <ScoreBar label="Safety" value={optimized.safety_score} />
        <div style={{ height: 8 }} />
        <ScoreBar label="Accessibility" value={optimized.accessibility_score} />

        {/* Per-factor breakdown */}
        {BREAKDOWN_FACTORS.some((f) => breakdown[f.key] != null) && (
          <div className={styles.breakdownSection}>
            <p className={styles.breakdownTitle}>Accessibility breakdown</p>
            {BREAKDOWN_FACTORS.map((f) => {
              const raw = breakdown[f.key];
              if (raw == null) return null;
              const pct = Math.round(raw * 100);
              return (
                <div key={f.key} className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>{f.label}</span>
                  <div className={styles.breakdownBarWrap}>
                    <div
                      className={
                        pct >= 70 ? styles.breakdownFill :
                        pct >= 40 ? `${styles.breakdownFill} ${styles['breakdownFill--warn']}` :
                        `${styles.breakdownFill} ${styles['breakdownFill--danger']}`
                      }
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={styles.breakdownVal}>{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Numeric difference summary ───────────────────────────────────────── */}
      <div className="card">
        <div className="sectionTitle" style={{ margin: '0 0 10px' }}>
          Safe vs. risky route
        </div>
        <Diff label="Safety"        value={difference.safety_score}        suffix=" pts" />
        <Diff label="Accessibility" value={difference.accessibility_score} suffix=" pts" />
        <Diff label="Distance"      value={difference.extra_distance} render={(v) => formatDistance(Math.abs(v))} invert />
        <Diff label="Time"          value={difference.extra_duration}  render={(v) => formatDuration(Math.abs(v))}  invert />
      </div>

      {chosenIsNormal && (
        <div className="alertMsg alertMsg--error">
          You're choosing the risky route — consider the safe route for a safer trip.
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
        ▶ Start {chosenIsNormal ? 'selected' : 'safe'} 
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

      {/* ── Grab/Be bottom sheet ─────────────────────────────────────────────── */}
      {grabSheet && pendingRoute?.grab_legs?.[0] && (() => {
        const leg = pendingRoute.grab_legs[0];
        return (
          <>
            <div onClick={skipGrab} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50 }} />
            <div style={{
              position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '100%', maxWidth: 430, background: '#fff',
              borderRadius: '24px 24px 0 0',
              padding: '20px 20px 36px',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
              zIndex: 51,
            }}>
              <div style={{ width: 40, height: 4, background: '#E5E7EB', borderRadius: 2, margin: '0 auto 18px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: '#00b14f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>🏍️</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1A2E' }}>This route includes a motorbike leg</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Would you like to book a Grab/Be ride?</div>
                </div>
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: 14, padding: '12px 14px', marginBottom: 18 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 3 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00b14f' }} />
                    <div style={{ width: 2, height: 24, background: '#D1D5DB' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', marginBottom: 8 }}>{leg.pickup_label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>{leg.dropoff_label}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>📏 {leg.distance} m</span>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>⏱ ~{leg.duration} min</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={skipGrab} style={{
                  flex: 1, padding: '13px 0', borderRadius: 14,
                  border: '1.5px solid #E5E7EB', background: '#fff',
                  fontWeight: 700, fontSize: 14, color: '#6B7280', cursor: 'pointer',
                }}>Skip</button>
                <button onClick={confirmGrab} style={{
                  flex: 2, padding: '13px 0', borderRadius: 14,
                  border: 'none', background: '#00b14f',
                  fontWeight: 700, fontSize: 14, color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}><span>🚗</span> Book Grab / Be</button>
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
  const sign   = value > 0 ? '+' : value < 0 ? '−' : '';
  const text   = render ? render(value) : `${Math.abs(value)}${suffix}`;
  return (
    <div className="row row--between" style={{ padding: '4px 0' }}>
      <span className="muted">{label}</span>
      <span className={`badge ${better ? 'badge--ok' : 'badge--warn'}`}>{sign}{text}</span>
    </div>
  );
}
