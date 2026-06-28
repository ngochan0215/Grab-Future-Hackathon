import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Briefcase, GraduationCap, Building2, MapPin,
  Clock, Droplets, Construction, HardHat, ArrowUpDown, AlertTriangle, Users,
  User,
} from 'lucide-react';
import styles from '../styles/HomePage.module.css';
import AddressAutocomplete from '../components/AddressAutocomplete';
import AlertCard from '../components/common/AlertCard/AlertCard';
import RouteCard from '../components/common/RouteCard/RouteCard';
import useAppStore from '../store/useAppStore';
import { listAddresses } from '../services/address.api';
import { getAlerts, getPlaces } from '../services/map.api';
import { listTrips } from '../services/trip.api';
import { listSavedRoutes, getSavedRoute } from '../services/savedRoute.api';
import { issueLabels } from '../constants/labels';
import { pathFromSegments } from '../utils/geo';

// ── helpers ─────────────────────────────────────────────
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const relTime = (iso) => {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d}d ago`;
};

const placeIcon = (label = '') => {
  const l = label.toLowerCase();
  if (/(home|nhà|ktx)/.test(l)) return Home;
  if (/(work|cơ quan|văn phòng)/.test(l)) return Briefcase;
  if (/(school|trường|đại học|thư viện)/.test(l)) return GraduationCap;
  if (/(hospital|bệnh viện|y tế|clinic)/.test(l)) return Building2;
  return MapPin;
};

// Per-token severity + icon. An alert combines several tokens.
const ALERT_TOKEN = {
  flooded: { severity: 'danger', icon: Droplets },
  pothole: { severity: 'caution', icon: AlertTriangle },
  obstacle: { severity: 'warning', icon: Construction },
  construction: { severity: 'warning', icon: HardHat },
  broken_ramp: { severity: 'warning', icon: ArrowUpDown },
  steep_slope: { severity: 'warning', icon: ArrowUpDown },
  narrow_path: { severity: 'caution', icon: AlertTriangle },
  no_sidewalk: { severity: 'warning', icon: AlertTriangle },
  crowded: { severity: 'caution', icon: Users },
  slippery: { severity: 'danger', icon: Droplets },
};

const SEVERITY_RANK = { danger: 3, warning: 2, caution: 1 };

// Reduce an issue_type token array to a single AlertCard style.
function alertStyle(tokens = []) {
  const list = Array.isArray(tokens) ? tokens : [tokens].filter(Boolean);
  const mapped = list.map((t) => ALERT_TOKEN[t]).filter(Boolean);
  if (!mapped.length) return { severity: 'warning', icon: AlertTriangle };
  const severity = mapped.reduce(
    (s, m) => (SEVERITY_RANK[m.severity] > SEVERITY_RANK[s] ? m.severity : s),
    'caution'
  );
  return { severity, icon: mapped[0].icon };
}

const SURFACE = { smooth: 1, moderate: 0.6, damaged: 0.2 };
const routeScore = (segs = []) => {
  if (!segs.length) return 0;
  const v =
    segs.reduce(
      (s, x) =>
        s +
        ((x.has_sidewalk_ramp ? 1 : 0) * 0.4 +
          (SURFACE[x.surface_quality] ?? 0.5) * 0.4 +
          Math.min((x.sidewalk_width || 1) / 2, 1) * 0.2),
      0
    ) / segs.length;
  return Math.round(v * 100);
};
const routeHighlights = (segs = []) => {
  const out = [];
  if (segs.length && segs.every((s) => s.has_sidewalk_ramp)) out.push('Wheelchair ramp');
  if (segs.length && segs.every((s) => s.surface_quality === 'smooth')) out.push('Smooth path');
  const avgW = segs.length ? segs.reduce((a, s) => a + (s.sidewalk_width || 0), 0) / segs.length : 0;
  if (avgW >= 1.8) out.push('Wide sidewalk');
  return out.length ? out : ['Accessible route'];
};
const modeLabel = (m) => (m === 'walk_and_bus' ? 'Bus + Walk' : 'Walk');

// ── component ───────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const setOrigin = useAppStore((s) => s.setOrigin);
  const setDestination = useAppStore((s) => s.setDestination);
  const setSelectedRoute = useAppStore((s) => s.setSelectedRoute);

  const [places, setPlaces] = useState([]);
  const [recents, setRecents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recommended, setRecommended] = useState(null);
  const [searchDest, setSearchDest] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);

  useEffect(() => {
    listAddresses().then((a) => setPlaces(a.slice(0, 4))).catch(() => {});
    getAlerts({ status: 'active' }).then(setAlerts).catch(() => {});

    Promise.all([listAddresses().catch(() => []), getPlaces().catch(() => [])]).then(
      ([addresses, places]) => {
        const a = addresses.map((x) => ({
          key: `a-${x.address_id}`,
          label: x.label || x.address,
          address: x.address,
          lat: x.latitude,
          lng: x.longitude,
          icon: '⭐',
        }));
        const p = places.map((x) => ({
          key: `p-${x.place_id}`,
          label: x.place_name,
          address: x.category,
          lat: x.latitude,
          lng: x.longitude,
          icon: x.has_ramp_entrance ? '♿' : '📍',
        }));
        setSearchSuggestions([...a, ...p]);
      }
    );

    listTrips()
      .then((trips) => {
        if (trips.length) {
          const sorted = [...trips].sort(
            (a, b) => new Date(b.started_at) - new Date(a.started_at)
          );
          setRecents(
            sorted.slice(0, 3).map((t) => ({
              key: `t-${t.trip_id}`,
              name: t.destination,
              addr: `from ${t.origin}`,
              time: relTime(t.started_at),
              origin: t.origin,
              destination: t.destination,
            }))
          );
        }
      })
      .catch(() => {});

    listSavedRoutes()
      .then((routes) => {
        if (!routes.length) return;
        // Fall back to saved routes for "Recent" if there are no trips yet.
        setRecents((cur) =>
          cur.length
            ? cur
            : routes.slice(0, 3).map((r) => ({
                key: `r-${r.route_id}`,
                name: r.destination,
                addr: `from ${r.origin}`,
                time: '',
                origin: r.origin,
                destination: r.destination,
              }))
        );
        // Recommended route = latest saved route, with full geometry.
        return getSavedRoute(routes[0].route_id).then(setRecommended);
      })
      .catch(() => {});
  }, []);

  function pickDestination(addr) {
    setDestination({
      label: addr.label || addr.address,
      address: addr.address,
      lat: addr.latitude,
      lng: addr.longitude,
    });
    navigate('/search');
  }

  function rerun(r) {
    setOrigin({ label: r.origin });
    setDestination({ label: r.destination });
    navigate('/confirm');
  }

  function startRecommended() {
    if (!recommended) return;
    const segments = recommended.segments || [];
    setSelectedRoute({
      route_id: recommended.route_id,
      route_type: 'optimized',
      label: 'Tuyến đã lưu',
      origin: recommended.origin,
      destination: recommended.destination,
      total_distance: recommended.total_distance,
      total_duration: recommended.total_duration,
      transport_mode: recommended.transport_mode,
      segment_ids: segments.map((s) => s.segment_id),
      segments,
      path: pathFromSegments(segments),
      safety_score: routeScore(segments),
      accessibility_score: routeScore(segments),
      priority_score: routeScore(segments),
    });
    navigate('/navigate');
  }

  const firstName = user?.name ? user.name.split(' ').pop() : 'bạn';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.topRow}>
          <div>
            <p className={styles.hi}>{greeting()}</p>
            <h1 className={styles.name}>{firstName}</h1>
          </div>
          <button className={styles.avatarBtn} aria-label="Open profile" onClick={() => navigate('/profile')}>
            <User size={20} />
          </button>
        </div>
        <div className={styles.searchWrap}>
          <AddressAutocomplete
            value={searchDest}
            onChange={(val) => {
              setSearchDest(val);
              if (val.lat && val.lng) {
                setDestination(val);
                navigate('/search');
              }
            }}
            suggestions={searchSuggestions}
            placeholder="Where would you like to go?"
          />
        </div>
      </header>

      <main className={styles.main}>
        {places.length > 0 && (
          <section aria-labelledby="saved-title">
            <h2 id="saved-title" className={styles.sectionTitle}>Saved Places</h2>
            <div className={styles.quickRow}>
              {places.map((p) => {
                const Icon = placeIcon(p.label || p.address);
                return (
                  <button
                    key={p.address_id}
                    className={styles.placeChip}
                    aria-label={`Go to ${p.label || p.address}`}
                    onClick={() => pickDestination(p)}
                  >
                    <Icon size={24} className={styles.placeIcon} aria-hidden="true" />
                    <span className={styles.placeLabel}>{p.label || p.address}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {recents.length > 0 && (
          <section aria-labelledby="recent-title">
            <h2 id="recent-title" className={styles.sectionTitle}>Recent</h2>
            <div className={styles.recentCard}>
              {recents.map((r, i) => (
                <button
                  key={r.key}
                  className={`${styles.recentRow} ${i < recents.length - 1 ? styles.recentBorder : ''}`}
                  onClick={() => rerun(r)}
                >
                  <span className={styles.recentIconWrap}>
                    <Clock size={18} aria-hidden="true" />
                  </span>
                  <span className={styles.recentInfo}>
                    <span className={styles.recentName}>{r.name}</span>
                    <span className={styles.recentAddr}>{r.addr}</span>
                  </span>
                  <span className={styles.recentTime}>{r.time}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="alerts-title">
          <div className={styles.rowBetween}>
            <h2 id="alerts-title" className={styles.sectionTitle}>Accessibility Alerts</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {alerts.length > 0 && (
                <span className={styles.alertBadge} aria-label={`${alerts.length} active alerts`}>
                  {alerts.length}
                </span>
              )}
              <button
                onClick={() => navigate('/alerts')}
                style={{
                  fontSize: 12, fontWeight: 600, color: '#0d9b87',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                Xem tất cả →
              </button>
            </div>
          </div>
          <div className={styles.alertList}>
            {alerts.length === 0 ? (
              <AlertCard severity="caution" icon={AlertTriangle} title="No active alerts" desc="All monitored routes are clear right now." />
            ) : (
              alerts.slice(0, 2).map((a) => {
                const m = alertStyle(a.issue_type);
                return (
                  <AlertCard
                    key={a.alert_id}
                    severity={m.severity}
                    icon={m.icon}
                    title={issueLabels(a.issue_type) || 'Cảnh báo'}
                    street={a.street_name}
                    desc={a.description || `Đoạn đường #${a.segment_id}`}
                    lat={a.latitude}
                    lng={a.longitude}
                  />
                );
              })
            )}
            {alerts.length > 2 && (
              <button
                onClick={() => navigate('/alerts')}
                style={{
                  width: '100%', padding: '10px', textAlign: 'center',
                  background: '#fff', border: '1px solid #E5E7EB',
                  borderRadius: 14, cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, color: '#6B7280',
                }}
              >
                + {alerts.length - 2} cảnh báo khác
              </button>
            )}
          </div>
        </section>

        {recommended && (
          <section aria-labelledby="route-title">
            <h2 id="route-title" className={styles.sectionTitle}>Recommended Route</h2>
            <RouteCard
              duration={`${recommended.total_duration || 0} min`}
              mode={modeLabel(recommended.transport_mode)}
              score={routeScore(recommended.segments)}
              from={recommended.origin}
              to={recommended.destination}
              highlights={routeHighlights(recommended.segments)}
              onStart={startRecommended}
            />
          </section>
        )}

        <div className={styles.navSpacer} aria-hidden="true" />
      </main>
    </div>
  );
}
