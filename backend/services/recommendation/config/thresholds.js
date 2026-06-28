// ════════════════════════════════════════════════════════════
//  Centralised configuration for the recommendation engine.
//  All tunable constants live here so calibration is a single-file edit.
// ════════════════════════════════════════════════════════════

/**
 * Minimum acceptable accessibility score (0–1) per travel mode.
 * Routes below this are rejected regardless of preference.
 *
 * @type {Record<string, number>}
 */
export const ACCESSIBILITY_THRESHOLDS = {
  walk_only:          0.40,
  walk_and_bus:       0.50,
  walk_and_motorbike: 0.45,
  wheelchair:         0.72,
  mixed:              0.55,
};

/**
 * Per-mobility-type threshold overrides (user profile takes precedence over travel mode).
 *
 * @type {Record<string, number>}
 */
export const MOBILITY_THRESHOLDS = {
  wheelchair_manual:   0.75,
  wheelchair_electric: 0.68,
  scooter:             0.60,
  walking:             0.40,
};

/**
 * Surface quality → accessibility multiplier.
 *
 * @type {Record<string, number>}
 */
export const SURFACE_SCORES = {
  smooth:   1.00,
  moderate: 0.60,
  damaged:  0.15,
};

/**
 * Alert issue type → penalty subtracted from the segment's raw accessibility score.
 * Penalties stack if a segment has multiple active alerts.
 *
 * @type {Record<string, number>}
 */
export const ALERT_SEVERITY = {
  pothole:          0.20,
  flooded:          0.35,
  obstacle:         0.45,
  construction:     0.30,
  blocked_sidewalk: 0.65,
  broken_elevator:  0.40,
};

/**
 * Issue types that make a segment a hard blocker for wheeled mobility types.
 * A route with any blocking segment is rejected regardless of its total score.
 *
 * @type {string[]}
 */
export const BLOCKING_ISSUE_TYPES_WHEELED = ['blocked_sidewalk'];

/**
 * Maximum tolerable slope (%) per mobility type or travel mode.
 * Above this the slope score becomes 0.
 *
 * @type {Record<string, number>}
 */
export const MAX_SLOPE_PERCENT = {
  walking:             15,
  walk_only:           15,
  walk_and_bus:        12,
  walk_and_motorbike:  15,
  wheelchair:           8,
  wheelchair_manual:    5,
  wheelchair_electric: 10,
  scooter:             10,
  mixed:               12,
};

/**
 * Minimum required sidewalk width (metres) per mobility type.
 *
 * @type {Record<string, number>}
 */
export const MIN_SIDEWALK_WIDTH = {
  wheelchair_manual:   1.5,
  wheelchair_electric: 1.5,
  wheelchair:          1.5,
  scooter:             1.2,
  walking:             0.8,
  default:             0.8,
};

/**
 * Factor weights used when computing a segment's composite score.
 * Keys map to mobility types; 'default' is the fallback.
 * Weights must sum to 1.0 for each entry.
 *
 * @type {Record<string, { surface: number, ramp: number, width: number, safety: number, slope: number }>}
 */
export const SEGMENT_SCORE_WEIGHTS = {
  wheelchair_manual:   { surface: 0.25, ramp: 0.35, width: 0.15, safety: 0.15, slope: 0.10 },
  wheelchair_electric: { surface: 0.30, ramp: 0.25, width: 0.15, safety: 0.15, slope: 0.15 },
  wheelchair:          { surface: 0.30, ramp: 0.30, width: 0.15, safety: 0.15, slope: 0.10 },
  scooter:             { surface: 0.25, ramp: 0.25, width: 0.20, safety: 0.20, slope: 0.10 },
  default:             { surface: 0.25, ramp: 0.15, width: 0.20, safety: 0.30, slope: 0.10 },
};

/** Mobility types that require wheeled-path treatment. */
export const WHEELED_MOBILITY_TYPES = new Set([
  'wheelchair_manual',
  'wheelchair_electric',
  'wheelchair',
  'scooter',
]);
