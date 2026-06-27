// Concatenate segment paths into one polyline, dropping duplicate join points.
export function pathFromSegments(segments = []) {
  const coords = [];
  for (const seg of segments) {
    for (const pt of seg.path || []) {
      const last = coords[coords.length - 1];
      if (last && last[0] === pt[0] && last[1] === pt[1]) continue;
      coords.push(pt);
    }
  }
  return coords;
}

// Best-effort polyline for a route from either its `path` or its `segments`.
export function routePath(route) {
  if (route?.path?.length) return route.path;
  return pathFromSegments(route?.segments);
}

// Midpoint of a segment's path (for placing a hazard marker on it).
export function segmentMidpoint(seg) {
  const p = seg?.path;
  if (!p?.length) return null;
  return p[Math.floor(p.length / 2)];
}

export const DHQG_CENTER = [10.8779, 106.7985];

// Planar distance between [lat,lng] points (good enough at city scale).
function dist(a, b) {
  const dy = a[0] - b[0];
  const dx = (a[1] - b[1]) * Math.cos((a[0] * Math.PI) / 180);
  return Math.hypot(dy, dx);
}

// Bearing (deg, 0=N) from a→b, for rotating the user arrow toward travel.
export function bearing(a, b) {
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Build an interpolator that returns position + heading at fraction f (0..1)
// of the total path length — used to animate the moving user marker.
export function buildInterpolator(path) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = dist(path[i - 1], path[i]);
    segs.push({ a: path[i - 1], b: path[i], d, acc: total });
    total += d;
  }
  return {
    total,
    at(f) {
      if (!segs.length) return { pos: path[0] || null, heading: 0 };
      const target = Math.max(0, Math.min(1, f)) * total;
      let s = segs[segs.length - 1];
      for (const seg of segs) {
        if (target <= seg.acc + seg.d) {
          s = seg;
          break;
        }
      }
      const local = s.d ? (target - s.acc) / s.d : 0;
      return {
        pos: [s.a[0] + (s.b[0] - s.a[0]) * local, s.a[1] + (s.b[1] - s.a[1]) * local],
        heading: bearing(s.a, s.b),
      };
    },
  };
}
