// OSRM road-routing helpers.
//
// fetchDirectRoute  — shortest path origin → destination  (= risky / default)
// fetchDetourRoute  — path via a side-offset waypoint     (= safe / avoids hazard)

const OSRM_BASE =
  import.meta.env.VITE_OSRM_URL || 'https://router.project-osrm.org/route/v1/foot';

/** Call OSRM and return the road geometry as [[lat, lng], ...]. */
async function _osrmRoute(waypoints, signal) {
  const coordStr = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const res = await fetch(`${OSRM_BASE}/${coordStr}?overview=full&geometries=geojson`, { signal });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  const coords = data?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coords)) return [];
  return coords.map(([lng, lat]) => [lat, lng]);
}

/**
 * Fetch the default (shortest) OSRM route between two points.
 * This represents the RISKY / unsafe route.
 *
 * @param {[number, number]} start  [lat, lng]
 * @param {[number, number]} end    [lat, lng]
 * @param {AbortSignal}      [signal]
 * @returns {Promise<[number, number][]>}
 */
export async function fetchDirectRoute(start, end, signal) {
  if (!start || !end) return [];
  return _osrmRoute([start, end], signal);
}

/**
 * Compute a perpendicular offset of the route midpoint to create a visible
 * detour — simulating a path that swings around an obstacle.
 *
 * The offset direction alternates by flipping ±90° of the bearing so the
 * detour always swings to the RIGHT of the direction of travel, keeping it
 * on the same side of the road in a consistent, predictable way.
 *
 * @param {[number, number]} a      [lat, lng]
 * @param {[number, number]} b      [lat, lng]
 * @param {number}           meters approx offset distance
 * @returns {[number, number]}      [lat, lng]
 */
function _perpendicularMidpoint(a, b, meters = 250) {
  const midLat = (a[0] + b[0]) / 2;
  const midLng = (a[1] + b[1]) / 2;

  // Direction vector along the route (in degree space).
  const dLat = b[0] - a[0];
  const dLng = b[1] - a[1];

  // Perpendicular: rotate 90° right  → (dLng, -dLat)
  const len = Math.hypot(dLat, dLng) || 1;
  const pLat = dLng / len;
  const pLng = -dLat / len;

  // 1 degree lat ≈ 111 320 m; adjust lng by cos(lat)
  const degPerMeter = 1 / 111_320;
  const latOff = pLat * meters * degPerMeter;
  const lngOff = pLng * meters * degPerMeter / Math.cos((midLat * Math.PI) / 180);

  return [midLat + latOff, midLng + lngOff];
}

/**
 * Fetch a detour route that swings around a computed side-waypoint.
 * This represents the SAFE route (avoids the direct hazardous stretch).
 *
 * @param {[number, number]} start  [lat, lng]
 * @param {[number, number]} end    [lat, lng]
 * @param {AbortSignal}      [signal]
 * @returns {Promise<[number, number][]>}
 */
export async function fetchDetourRoute(start, end, signal) {
  if (!start || !end) return [];
  const via = _perpendicularMidpoint(start, end, 280);
  return _osrmRoute([start, via, end], signal);
}
