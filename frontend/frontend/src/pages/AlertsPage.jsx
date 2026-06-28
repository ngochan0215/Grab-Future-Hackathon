import { useEffect, useState } from 'react';
import {
  AlertTriangle, Droplets, Construction, HardHat, ArrowUpDown, Users,
} from 'lucide-react';
import Header from '../components/layout/Header/Header';
import AlertCard from '../components/common/AlertCard/AlertCard';
import BackButton from '../components/common/BackButton/BackButton';
import MapView from '../components/map/MapView';
import { Spinner } from '../components/ui';
import { getAlerts, getSegments } from '../services/map.api';
import { issueLabels } from '../constants/labels';
import rdStyles from '../components/common/RouteDetailView/RouteDetailView.module.css';

// ── Alert token helpers (same as HomePage) ───────────────────────────────────
const ALERT_TOKEN = {
  flooded:      { severity: 'danger',  icon: Droplets },
  pothole:      { severity: 'caution', icon: AlertTriangle },
  obstacle:     { severity: 'warning', icon: Construction },
  construction: { severity: 'warning', icon: HardHat },
  broken_ramp:  { severity: 'warning', icon: ArrowUpDown },
  steep_slope:  { severity: 'warning', icon: ArrowUpDown },
  narrow_path:  { severity: 'caution', icon: AlertTriangle },
  no_sidewalk:  { severity: 'warning', icon: AlertTriangle },
  crowded:      { severity: 'caution', icon: Users },
  slippery:     { severity: 'danger',  icon: Droplets },
};
const SEVERITY_RANK  = { danger: 3, warning: 2, caution: 1 };
const SEVERITY_COLOR = { danger: '#EF4444', warning: '#F97316', caution: '#EAB308' };

function alertStyle(tokens = []) {
  const list   = Array.isArray(tokens) ? tokens : [tokens].filter(Boolean);
  const mapped = list.map((t) => ALERT_TOKEN[t]).filter(Boolean);
  if (!mapped.length) return { severity: 'warning', icon: AlertTriangle };
  const severity = mapped.reduce(
    (s, m) => (SEVERITY_RANK[m.severity] > SEVERITY_RANK[s] ? m.severity : s),
    'caution',
  );
  return { severity, icon: mapped[0].icon };
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all',      label: 'Tất cả'       },
  { id: 'active',   label: 'Đang xảy ra'  },
  { id: 'resolved', label: 'Đã xử lý'     },
];

// ── Alert detail (inline — same pattern as SavedPage → RouteDetailView) ───────
function AlertDetailView({ alert, segment, onBack }) {
  const m         = alertStyle(alert.issue_type);
  const Icon      = m.icon;
  const accentCol = SEVERITY_COLOR[m.severity] || '#F97316';

  // Build map primitives from the segment path (array of [lat, lng])
  const path = segment?.path || [];
  const polylines = path.length >= 2
    ? [{ coords: path, color: accentCol, weight: 5 }]
    : [];

  // Hazard pin at the alert's enriched midpoint coordinate
  const pinPos = (alert.latitude != null && alert.longitude != null)
    ? [alert.latitude, alert.longitude]
    : path[Math.floor(path.length / 2)] || null;

  const hazards = pinPos
    ? [{ position: pinPos, label: issueLabels(alert.issue_type), color: accentCol }]
    : [];

  return (
    <>
      {/* Header */}
      <div className={rdStyles.header} style={{ padding: '16px 16px 0' }}>
        <BackButton onClick={onBack} label="Quay lại danh sách" />
        <h2 className={rdStyles.heading}>Chi tiết cảnh báo</h2>
      </div>

      {/* Info card (gradient, same style as RouteDetailView) */}
      <div
        className={rdStyles.card}
        style={{
          margin: '16px 16px 14px',
          background: `linear-gradient(140deg, ${accentCol} 0%, ${accentCol}cc 60%, ${accentCol}44 100%)`,
          boxShadow: `0 6px 24px ${accentCol}44`,
        }}
      >
        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Icon size={22} color="#fff" />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
            {issueLabels(alert.issue_type) || 'Cảnh báo'}
          </span>
          <span style={{
            marginLeft: 'auto',
            fontSize: 11, fontWeight: 700,
            background: alert.status === 'resolved' ? 'rgba(255,255,255,0.25)' : '#fff',
            color: alert.status === 'resolved' ? '#fff' : accentCol,
            borderRadius: 8, padding: '2px 8px',
          }}>
            {alert.status === 'resolved' ? 'Đã xử lý' : 'Đang xảy ra'}
          </span>
        </div>

        {/* Street + description */}
        {alert.street_name && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: '0 0 4px', fontWeight: 600 }}>
            {alert.street_name}
          </p>
        )}
        {alert.description && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', margin: 0, lineHeight: 1.5 }}>
            {alert.description}
          </p>
        )}

        {/* Stats row */}
        <div className={rdStyles.stats}>
          {alert.latitude != null && (
            <div className={rdStyles.stat}>
              <span className={rdStyles.statVal} style={{ fontFamily: 'monospace', fontSize: 13 }}>
                {alert.latitude.toFixed(5)}
              </span>
              <span className={rdStyles.statLabel}>Vĩ độ</span>
            </div>
          )}
          {alert.longitude != null && (
            <div className={rdStyles.stat}>
              <span className={rdStyles.statVal} style={{ fontFamily: 'monospace', fontSize: 13 }}>
                {alert.longitude.toFixed(5)}
              </span>
              <span className={rdStyles.statLabel}>Kinh độ</span>
            </div>
          )}
          {segment?.distance != null && (
            <div className={rdStyles.stat}>
              <span className={rdStyles.statVal}>{segment.distance} m</span>
              <span className={rdStyles.statLabel}>Độ dài đoạn</span>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      {pinPos ? (
        <MapView
          height={360}
          center={pinPos}
          zoom={16}
          polylines={polylines}
          hazards={hazards}
          focusPosition={pinPos}
        />
      ) : (
        <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '24px 0' }}>
          Không có tọa độ cho cảnh báo này.
        </p>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AlertsPage() {
  const [alerts,     setAlerts]     = useState([]);
  const [segmentMap, setSegmentMap] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [selected,   setSelected]   = useState(null);

  useEffect(() => {
    Promise.all([
      getAlerts().catch(() => []),
      getSegments().catch(() => []),
    ]).then(([als, segs]) => {
      setAlerts(als);
      const map = {};
      for (const s of segs) map[s.segment_id] = s;
      setSegmentMap(map);
    }).finally(() => setLoading(false));
  }, []);

  // ── Detail view ──
  if (selected) {
    return (
      <main className="page page--plain">
        <AlertDetailView
          alert={selected}
          segment={segmentMap[selected.segment_id] || null}
          onBack={() => setSelected(null)}
        />
      </main>
    );
  }

  // ── List view ──
  const shown = filter === 'all' ? alerts : alerts.filter((a) => a.status === filter);
  const activeCount = alerts.filter((a) => a.status === 'active').length;

  return (
    <main className="page">
      <Header title={`Cảnh báo (${activeCount} đang xảy ra)`} back />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px 4px' }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '5px 14px', borderRadius: 20, border: '1px solid',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background:   filter === f.id ? '#0d9b87' : '#fff',
              color:        filter === f.id ? '#fff'    : '#6B7280',
              borderColor:  filter === f.id ? '#0d9b87' : '#E5E7EB',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <Spinner />
        ) : shown.length === 0 ? (
          <AlertCard
            severity="caution"
            icon={AlertTriangle}
            title="Không có cảnh báo"
            desc="Không có sự cố nào trong danh mục này."
          />
        ) : (
          shown.map((a) => {
            const style = alertStyle(a.issue_type);
            return (
              <div
                key={a.alert_id}
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => setSelected(a)}
              >
                <AlertCard
                  severity={style.severity}
                  icon={style.icon}
                  title={issueLabels(a.issue_type) || 'Cảnh báo'}
                  street={a.street_name}
                  desc={a.description || `Đoạn đường #${a.segment_id}`}
                  lat={a.latitude}
                  lng={a.longitude}
                />
                {a.status === 'resolved' && (
                  <span style={{
                    position: 'absolute', top: 10, right: 12,
                    fontSize: 10, fontWeight: 700,
                    background: '#D1FAE5', color: '#065F46',
                    borderRadius: 6, padding: '2px 6px',
                  }}>
                    Đã xử lý
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <div style={{ height: 'calc(72px + env(safe-area-inset-bottom, 0px))' }} />
    </main>
  );
}
