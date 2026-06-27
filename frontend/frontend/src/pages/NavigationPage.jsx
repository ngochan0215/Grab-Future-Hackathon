import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import useAppStore from '../store/useAppStore';
import { MAP_STYLE } from '../components/map/MapView';
import { startTrip, finishTrip } from '../services/trip.api';
import { createSavedRoute } from '../services/savedRoute.api';
import { reviewRoute } from '../services/route.api';
import { RatingInput, ErrorMsg, OkMsg } from '../components/ui';
import { routePath, buildInterpolator } from '../utils/geo';
import { formatDistance } from '../utils/formatRoute';

const toLngLat = (c) => [c[1], c[0]];

export default function NavigationPage() {
  const navigate = useNavigate();
  const route = useAppStore((s) => s.selectedRoute);
  const resetTrip = useAppStore((s) => s.resetTrip);

  const coords = useMemo(() => (route ? routePath(route) : []), [route]);
  const interp = useMemo(() => buildInterpolator(coords), [coords]);
  // Stable GeoJSON so the route layer isn't re-pushed to the map every frame.
  const routeGeoJSON = useMemo(
    () => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords.map(toLngLat) } }),
    [coords]
  );
  // Compressed demo duration: scales with distance, clamped to a watchable range.
  const DEMO_MS = useMemo(
    () => Math.min(26000, Math.max(14000, (route?.total_distance || 1000) * 12)),
    [route]
  );

  const mapRef = useRef(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  const [phase, setPhase] = useState('starting'); // starting | overview | navigating | arrived
  const [trip, setTrip] = useState(null);
  const [progress, setProgress] = useState(0);
  const [user, setUser] = useState({ pos: coords[0] || null, heading: 0 });

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [savedId, setSavedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Guard + start a trip on mount.
  useEffect(() => {
    if (!route || coords.length < 2) {
      navigate('/home', { replace: true });
      return;
    }
    setUser({ pos: coords[0], heading: 0 });
    startTrip({
      origin: route.origin,
      destination: route.destination,
      route_id: route.route_id,
      segment_ids: route.segment_ids,
    })
      .then(setTrip)
      .catch((e) => setError(e.message));
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rawMap = () => mapRef.current?.getMap();

  function fitOverview() {
    const map = rawMap();
    if (!map || coords.length === 0) return;
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    for (const [lat, lng] of coords) {
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
    }
    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 800 });
  }

  // Map ready → show overview (start + route + you), then dive into follow mode.
  function handleLoad() {
    setPhase('overview');
    fitOverview();
    setTimeout(() => beginNavigation(), 1800);
  }

  function beginNavigation() {
    const map = rawMap();
    if (!map) return;
    setPhase('navigating');
    map.easeTo({ center: toLngLat(coords[0]), zoom: 16.5, duration: 1100 });
    map.once('moveend', () => {
      startRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    });
  }

  function tick(now) {
    const f = Math.min(1, (now - startRef.current) / DEMO_MS);
    const { pos, heading } = interp.at(f);
    setProgress(f);
    setUser({ pos, heading });
    const map = rawMap();
    if (map && pos) map.setCenter(toLngLat(pos)); // camera glued to the user
    if (f >= 1) {
      finish();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  async function finish() {
    cancelAnimationFrame(rafRef.current);
    setProgress(1);
    setUser({ pos: coords[coords.length - 1], heading: user.heading });
    setPhase('arrived');
    fitOverview();
    if (trip) {
      try {
        await finishTrip(trip.trip_id, {
          actual_distance: route.total_distance,
          actual_duration: route.total_duration,
        });
      } catch (e) {
        setError(e.message);
      }
    }
  }

  // Rating implicitly persists the route (search options have ephemeral ids).
  async function ensureSaved() {
    if (savedId) return savedId;
    const saved = await createSavedRoute({
      origin: route.origin,
      destination: route.destination,
      total_distance: route.total_distance,
      total_duration: route.total_duration,
      transport_mode: route.transport_mode,
      segment_ids: route.segment_ids,
    });
    setSavedId(saved.route_id);
    return saved.route_id;
  }

  async function submitRating() {
    if (!rating) return setError('Vui lòng chọn số sao.');
    setBusy(true);
    setError('');
    try {
      const id = await ensureSaved();
      await reviewRoute(id, { rating_score: rating, comment });
      setNotice('Cảm ơn đánh giá của bạn!');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveRoute() {
    setBusy(true);
    setError('');
    try {
      await ensureSaved();
      setNotice('Đã lưu tuyến vào danh sách.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!route) return null;

  const remainDist = Math.round(route.total_distance * (1 - progress));
  const remainTime = Math.max(0, Math.ceil(route.total_duration * (1 - progress)));
  const lineColor = route.route_type === 'normal' ? '#9ca3af' : '#16a34a';
  const end = coords[coords.length - 1];

  return (
    <div className="navScreen">
      <div className="navMap">
        <Map
          ref={mapRef}
          initialViewState={{ longitude: coords[0][1], latitude: coords[0][0], zoom: 15 }}
          mapStyle={MAP_STYLE}
          attributionControl={false}
          onLoad={handleLoad}
        >
          <Source id="nav-route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="nav-line"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': lineColor, 'line-width': 7, 'line-opacity': 0.95 }}
            />
          </Source>

          {/* destination flag */}
          <Marker longitude={end[1]} latitude={end[0]}>
            <div className="emojiPin">🏁</div>
          </Marker>

          {/* live user puck */}
          {user.pos && (
            <Marker longitude={user.pos[1]} latitude={user.pos[0]}>
              <div className="userPuck">
                <span className="pulse" />
                <span className="arrow" style={{ transform: `rotate(${user.heading}deg)` }}>➤</span>
              </div>
            </Marker>
          )}
        </Map>

        {phase !== 'arrived' && (
          <div className="navBanner">
            <div className="navBannerMain">
              <span className="navEta">{remainTime} phút</span>
              <span className="muted small">còn {formatDistance(remainDist)} · {route.destination}</span>
            </div>
            {phase === 'overview' && <span className="badge badge--accent">Đang khởi động…</span>}
          </div>
        )}
      </div>

      <div className="navSheet">
        {error && <ErrorMsg>{error}</ErrorMsg>}

        {phase !== 'arrived' ? (
          <>
            <div className="bar" style={{ marginBottom: 12 }}>
              <span style={{ width: `${Math.round(progress * 100)}%`, background: lineColor }} />
            </div>
            <button className="btn btn--danger btn--block" onClick={finish}>
              ⏹ Kết thúc chuyến đi
            </button>
          </>
        ) : (
          <>
            <div className="center" style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 40 }}>🎉</div>
              <div className="title" style={{ fontSize: 18 }}>Đã đến nơi!</div>
              <div className="muted small">{route.origin} → {route.destination}</div>
            </div>
            <OkMsg>{notice}</OkMsg>

            <div className="sectionTitle" style={{ margin: '6px 4px 8px' }}>Đánh giá tuyến</div>
            <RatingInput value={rating} onChange={setRating} />
            <textarea
              className="textarea"
              placeholder="Tuyến này thế nào?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ marginTop: 8 }}
            />
            <div className="row" style={{ gap: 10, marginTop: 10 }}>
              <button className="btn btn--block" onClick={saveRoute} disabled={busy}>🔖 Lưu tuyến</button>
              <button className="btn btn--primary btn--block" onClick={submitRating} disabled={busy}>
                Gửi đánh giá
              </button>
            </div>
            <div className="row" style={{ gap: 10, marginTop: 10 }}>
              <button className="btn btn--block" onClick={() => navigate('/trips')}>Chuyến đi</button>
              <button
                className="btn btn--block"
                onClick={() => { resetTrip(); navigate('/home'); }}
              >
                Về trang chủ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
