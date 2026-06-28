import { getSegmentById, getActiveAlerts } from '../data/mockDB.js';
import { recommendRoute } from './recommendation/index.js';

// ════════════════════════════════════════════════════════════
//  Candidate route builder
//
//  In production this layer calls OSRM's /route?alternatives=true
//  and maps OSRM legs → our segment IDs.
//
//  For the demo we use two hardcoded candidates that share segment
//  endpoints (KTX Khu A → NVH Sinh Viên) but differ in path quality:
//    opt-1  optimized : long way round, good surface, has ramp
//    opt-2  normal    : shortcut, damaged surface, no ramp
// ════════════════════════════════════════════════════════════

// Two demo candidates representing a real D1 (Quận 1) street network.
//  safe  — Lê Lợi → Đồng Khởi → Nhà thờ Đức Bà: wide boulevard, smooth, ramps
//  risky — hẻm Phan Bội Châu → hẻm Thái Văn Lung: damaged alley, no ramps
const OSRM_CANDIDATES = [
  {
    route_id:    'opt-1',
    route_type:  'optimized',
    label:       'Safe route via Lê Lợi & Đồng Khởi',
    segment_ids: [201, 203, 204],
  },
  {
    route_id:    'opt-2',
    route_type:  'normal',
    label:       'Risky shortcut via back alleys',
    segment_ids: [202, 205],
  },
];

const BUS_FARE  = 7_000;   // VND
const GRAB_FARE = 15_000;  // VND (estimated ride-hail leg)

const GRAB_MODES    = new Set(['walk_and_motorbike', 'mixed']);
const TRANSFER_STOP = { label: 'Trạm NVH Sinh viên (điểm trung chuyển)', lat: 10.874, lng: 106.802 };

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));  // eslint-disable-line no-unused-vars

/** Merge segment paths, de-duplicating shared junction points. */
const concatPaths = (segments) => {
  const coords = [];
  for (const seg of segments) {
    for (const pt of seg.path ?? []) {
      const last = coords[coords.length - 1];
      if (last && last[0] === pt[0] && last[1] === pt[1]) continue;
      coords.push(pt);
    }
  }
  return coords;
};

/**
 * Build candidate routes with segment data attached.
 * Adds travel-cost and grab_legs based on transport mode.
 *
 * @param {string} origin
 * @param {string} destination
 * @param {string} mode
 * @returns {import('./recommendation/types.js').CandidateRoute[]}
 */
const buildCandidateRoutes = (origin, destination, mode) => {
  const needsGrab   = GRAB_MODES.has(mode);
  const grabDistance = 650; // metres — fixed demo leg

  return OSRM_CANDIDATES.map((c) => {
    const segments = c.segment_ids.map(getSegmentById).filter(Boolean);
    const path     = concatPaths(segments);

    const walkDistance = segments.reduce((s, seg) => s + (seg.distance ?? 0), 0);
    const totalDistance = walkDistance + (needsGrab ? grabDistance : 0);
    const totalDuration = Math.round(walkDistance / 75) + (needsGrab ? 5 : 0); // 75m/min walk + 5min grab

    const totalCost =
      mode === 'walk_and_bus'        ? BUS_FARE :
      mode === 'walk_and_motorbike'  ? GRAB_FARE :
      mode === 'mixed'               ? BUS_FARE + GRAB_FARE :
      0;

    const grab_legs = needsGrab ? [{
      pickup_label:  origin,
      dropoff_label: TRANSFER_STOP.label,
      pickup_lat:    path[0]?.[0]    ?? null,
      pickup_lng:    path[0]?.[1]    ?? null,
      dropoff_lat:   TRANSFER_STOP.lat,
      dropoff_lng:   TRANSFER_STOP.lng,
      distance:      grabDistance,
      duration:      5,
      vehicle_mode:  'motorbike',
    }] : [];

    return {
      route_id:          c.route_id,
      route_type:        c.route_type,
      label:             c.label,
      origin,
      destination,
      transport_mode:    mode,
      segments,
      segment_ids:       segments.map((s) => s.segment_id),
      path,
      origin_point:      path[0]               ?? null,
      destination_point: path[path.length - 1] ?? null,
      total_distance:    totalDistance,
      total_duration:    totalDuration,
      total_cost:        totalCost,
      grab_legs,
    };
  });
};

// ════════════════════════════════════════════════════════════
//  Public API (used by route.controller.js)
// ════════════════════════════════════════════════════════════

/**
 * Score, filter, rank, and explain all candidate routes.
 * Returns routes in the same shape the existing API contract expects,
 * plus the new `recommendation_explanation` field.
 *
 * @param {{ origin: string, destination: string, transport_mode: string, priority: string }} params
 * @param {Object} user
 * @returns {Promise<Object[]>}
 */
export const buildRankedRoutes = async ({ origin, destination, transport_mode, priority }, user) => {
  const mode         = transport_mode ?? 'walk_only';
  const preference   = priority       ?? 'safety';
  const activeAlerts = getActiveAlerts();

  const candidateRoutes = buildCandidateRoutes(origin, destination, mode);

  const {
    recommended,
    allRoutes,
    rankedRoutes,
    rejectedRouteIds,
    threshold,
    strategy,
    explanation,
  } = await recommendRoute({
    origin,
    destination,
    transport_mode: mode,
    preference,
    candidateRoutes,
    activeAlerts,
    user,
    withExplanation: true,
  });

  // Build a lookup: route_id → ranked position + rankingScore
  const rankMap = new Map(
    rankedRoutes.map((r, i) => [r.route.route_id, { rank: i, rankingScore: r.rankingScore }])
  );

  // Format every route to match the existing API contract
  const routes = allRoutes.map((scored) => {
    const { route, accessibilityScore, warnings } = scored;
    const ranking = rankMap.get(route.route_id);
    const rejected = rejectedRouteIds.includes(route.route_id);

    // Compute which active-alert types this route AVOIDS
    const onRouteSegIds = new Set(route.segment_ids);
    const avoids = [
      ...new Set(
        activeAlerts
          .filter((a) => !onRouteSegIds.has(a.segment_id))
          .flatMap((a) => (Array.isArray(a.issue_type) ? a.issue_type : [a.issue_type]))
      ),
    ];

    return {
      // ── original route fields ──────────────────────────────────────────────
      ...route,

      // ── new accessibility scores (0–100 for API readability) ──────────────
      accessibility_score: Math.round(accessibilityScore.total * 100),
      safety_score:        Math.round((accessibilityScore.breakdown.safetyBaseScore ?? 0) * 100),
      priority_score:      ranking ? Math.round(ranking.rankingScore * 100) : 0,

      // ── status ────────────────────────────────────────────────────────────
      recommended: !rejected && ranking?.rank === 0,
      rejected,
      rejection_reason: rejected
        ? `Accessibility score (${Math.round(accessibilityScore.total * 100)}%) is below ` +
          `the required threshold of ${Math.round(threshold * 100)}%` +
          (accessibilityScore.hasBlockingIssues ? ' — route contains a blocking obstacle.' : '.')
        : null,

      // ── contextual details ────────────────────────────────────────────────
      warnings,
      avoids,

      // ── meta ──────────────────────────────────────────────────────────────
      accessibility_breakdown: accessibilityScore.breakdown,
    };
  });

  // Sort: recommended first, then by priority_score desc
  routes.sort((a, b) => {
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
    return b.priority_score - a.priority_score;
  });

  // Attach engine metadata to the first (recommended) route
  if (routes.length > 0 && recommended) {
    routes[0].recommendation_strategy  = strategy;
    routes[0].recommendation_explanation = explanation;
  }

  return routes;
};

// Legacy named exports kept for any direct callers
export { concatPaths };
