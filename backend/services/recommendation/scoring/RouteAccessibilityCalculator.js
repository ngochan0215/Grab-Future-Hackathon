import { SegmentScorer } from './SegmentScorer.js';

/**
 * Computes a route's accessibility score by aggregating per-segment scores.
 * Segments are weighted by their length so short bad segments hurt less than
 * long bad segments.
 *
 * This class is responsible ONLY for accessibility measurement — it does not
 * know about user preferences or ranking.
 */
export class RouteAccessibilityCalculator {
  constructor() {
    this._segmentScorer = new SegmentScorer();
  }

  /**
   * @param {import('../types.js').CandidateRoute}  route
   * @param {import('../types.js').RealtimeAlert[]}  activeAlerts
   * @param {Object}  user
   * @param {string}  travelMode
   * @returns {import('../types.js').ScoredRoute}
   */
  score(route, activeAlerts, user, travelMode) {
    const segments = route.segments ?? [];

    if (segments.length === 0) {
      return this._emptyResult(route);
    }

    // Score every segment independently
    const segmentScores = segments.map((seg) =>
      this._segmentScorer.score(seg, activeAlerts, user, travelMode)
    );

    const totalDistance = segmentScores.reduce((s, ss) => s + ss.distance, 0) || 1;

    // Distance-weighted average — longer segments have proportionally more influence
    const weightedTotal =
      segmentScores.reduce((sum, ss) => sum + ss.total * ss.distance, 0) / totalDistance;

    const hasBlockingIssues = segmentScores.some((ss) => ss.hasBlockingIssue);

    // Deduplicate: one warning entry per (segment_id, issue) pair.
    const seen = new Set();
    const warnings = segmentScores.flatMap((ss) => ss.warnings).filter((w) => {
      const key = `${w.segmentId}:${w.issue}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const breakdown = this._aggregateBreakdown(segmentScores, totalDistance);

    // Auxiliary scores exposed to ranking strategies
    const slopeScore =
      segmentScores.reduce((s, ss) => s + ss.breakdown.slopeScore * ss.distance, 0) /
      totalDistance;

    const sidewalkContinuityScore =
      segmentScores.reduce(
        (s, ss) => s + (ss.breakdown.continuityScore ?? 1) * ss.distance, 0
      ) / totalDistance;

    return {
      route,
      accessibilityScore: {
        total: Math.round(weightedTotal * 1000) / 1000,
        hasBlockingIssues,
        breakdown,
      },
      warnings,
      slopeScore,
      sidewalkContinuityScore,
      segmentScores,
    };
  }

  /** @private */
  _aggregateBreakdown(segmentScores, totalDistance) {
    const fields = [
      'surfaceScore', 'rampScore', 'widthScore',
      'safetyBaseScore', 'slopeScore', 'alertPenalty',
    ];
    const result = {};
    for (const field of fields) {
      result[field] =
        segmentScores.reduce(
          (sum, ss) => sum + (ss.breakdown[field] ?? 0) * ss.distance, 0
        ) / totalDistance;
    }
    return result;
  }

  /** @private */
  _emptyResult(route) {
    return {
      route,
      accessibilityScore: {
        total: 0,
        hasBlockingIssues: true,
        breakdown: {},
      },
      warnings: [{ segmentId: null, street_name: '—', issue: 'no_segment_data' }],
      slopeScore: 0,
      sidewalkContinuityScore: 0,
      segmentScores: [],
    };
  }
}
