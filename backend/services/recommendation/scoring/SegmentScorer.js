import {
  SURFACE_SCORES,
  ALERT_SEVERITY,
  BLOCKING_ISSUE_TYPES_WHEELED,
  MAX_SLOPE_PERCENT,
  MIN_SIDEWALK_WIDTH,
  SEGMENT_SCORE_WEIGHTS,
  WHEELED_MOBILITY_TYPES,
} from '../config/thresholds.js';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Scores a single road segment's accessibility for a given user and travel mode.
 *
 * The score is a weighted composite of:
 *   surface quality · ramp/stair accessibility · sidewalk width ·
 *   base safety · slope · active alert penalties
 *
 * Scoring is INDEPENDENT per segment — the route-level calculator
 * then combines segment scores weighted by distance.
 */
export class SegmentScorer {
  /**
   * @param {import('../types.js').RouteSegment}   segment
   * @param {import('../types.js').RealtimeAlert[]} activeAlerts - all active alerts (engine pre-filters by status)
   * @param {Object}  user
   * @param {string}  travelMode
   * @returns {import('../types.js').SegmentScore}
   */
  score(segment, activeAlerts, user, travelMode) {
    const mobilityType = user?.mobility_type ?? 'walking';
    const isWheeled =
      WHEELED_MOBILITY_TYPES.has(mobilityType) || travelMode === 'wheelchair';

    const segAlerts = activeAlerts.filter(
      (a) => a.segment_id === segment.segment_id && a.status === 'active'
    );

    // ── 1. Surface quality ───────────────────────────────────────────────────
    const surfaceScore = SURFACE_SCORES[segment.surface_quality] ?? 0.50;

    // ── 2. Ramp / stair accessibility ────────────────────────────────────────
    const hasRamp   = segment.has_sidewalk_ramp ?? false;
    const hasStairs = segment.has_stairs ?? false;
    let rampScore;
    let hasBlockingIssue = false;

    if (hasStairs && !hasRamp) {
      // Stairs with no ramp: impassable for wheeled users
      rampScore = isWheeled ? 0.0 : 0.25;
      if (isWheeled) hasBlockingIssue = true;
    } else if (!hasRamp) {
      // No ramp at intersection: significant penalty for wheeled
      rampScore = isWheeled ? 0.30 : 0.80;
    } else {
      rampScore = 1.0;
    }

    // Curb-ramp bonus (optional future field)
    const hasCurbRamp = segment.has_curb_ramp;
    const curbScore = hasCurbRamp != null
      ? (hasCurbRamp ? 1.0 : (isWheeled ? 0.40 : 0.80))
      : 0.70; // conservative default when field is absent

    // ── 3. Sidewalk width ────────────────────────────────────────────────────
    const requiredWidth =
      MIN_SIDEWALK_WIDTH[mobilityType] ??
      (isWheeled ? MIN_SIDEWALK_WIDTH.wheelchair : MIN_SIDEWALK_WIDTH.default);
    const widthScore = segment.sidewalk_width != null
      ? clamp(segment.sidewalk_width / requiredWidth, 0, 1)
      : 0.70; // default when data absent

    // ── 4. Base safety score (DB stores 0–5) ─────────────────────────────────
    const safetyBaseScore = clamp((segment.safety_score ?? 3) / 5, 0, 1);

    // ── 5. Slope ─────────────────────────────────────────────────────────────
    const slopePercent = segment.slope_percent ?? 0;
    const maxSlope =
      MAX_SLOPE_PERCENT[mobilityType] ??
      MAX_SLOPE_PERCENT[travelMode] ??
      15;
    const slopeScore = slopePercent === 0
      ? 1.0
      : clamp(1 - slopePercent / maxSlope, 0, 1);

    // Sidewalk continuity (optional future field, 0–1)
    const continuityScore = segment.sidewalk_continuity ?? 1.0;

    // ── 6. Active alert penalties ─────────────────────────────────────────────
    let alertPenalty = 0;
    const warnings = [];

    for (const alert of segAlerts) {
      const issueTypes = Array.isArray(alert.issue_type)
        ? alert.issue_type
        : [alert.issue_type].filter(Boolean);

      for (const issue of issueTypes) {
        const severity = ALERT_SEVERITY[issue] ?? 0.20;
        alertPenalty += severity;
        warnings.push({
          segmentId: segment.segment_id,
          street_name: segment.street_name,
          issue,
        });

        if (isWheeled && BLOCKING_ISSUE_TYPES_WHEELED.includes(issue)) {
          hasBlockingIssue = true;
        }
      }
    }

    // ── 7. Weighted composite ─────────────────────────────────────────────────
    const weights = SEGMENT_SCORE_WEIGHTS[mobilityType] ?? SEGMENT_SCORE_WEIGHTS.default;

    const rawScore =
      surfaceScore     * weights.surface +
      rampScore        * weights.ramp    +
      widthScore       * weights.width   +
      safetyBaseScore  * weights.safety  +
      slopeScore       * weights.slope;

    // Alert penalty applied after weighting (each 0.20-unit alert reduces score by 0.04)
    const total = clamp(rawScore - alertPenalty * 0.20, 0, 1);

    return {
      segmentId: segment.segment_id,
      total,
      hasBlockingIssue,
      distance: segment.distance ?? 0,
      breakdown: {
        surfaceScore,
        rampScore,
        widthScore,
        safetyBaseScore,
        slopeScore,
        continuityScore,
        curbScore,
        alertPenalty,
      },
      warnings,
    };
  }
}
