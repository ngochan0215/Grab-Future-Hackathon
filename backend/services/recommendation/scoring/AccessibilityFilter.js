import { ACCESSIBILITY_THRESHOLDS, MOBILITY_THRESHOLDS } from '../config/thresholds.js';

/**
 * Enforces the accessibility constraint before any preference-based ranking.
 *
 * Two rejection criteria (either is sufficient to reject a route):
 *   1. Route contains a blocking segment (e.g. unramped stairs for wheelchair users)
 *   2. Route's overall accessibility score is below the mode/profile threshold
 *
 * This separation ensures accessibility is ALWAYS a mandatory gate — not a
 * factor that can be traded away by a ranking strategy.
 */
export class AccessibilityFilter {
  /**
   * @param {import('../types.js').ScoredRoute[]} scoredRoutes
   * @param {string} travelMode
   * @param {Object} user
   * @returns {{ passed: ScoredRoute[], rejected: string[], threshold: number }}
   */
  filter(scoredRoutes, travelMode, user) {
    const threshold = this._resolveThreshold(travelMode, user);

    const passed = [];
    const rejected = [];

    for (const scored of scoredRoutes) {
      const routeId = scored.route.route_id ?? scored.route.route_type ?? 'unknown';
      const { total, hasBlockingIssues } = scored.accessibilityScore;

      if (hasBlockingIssues || total < threshold) {
        rejected.push(routeId);
      } else {
        passed.push(scored);
      }
    }

    return { passed, rejected, threshold };
  }

  /**
   * User mobility type takes precedence over travel mode,
   * using the higher of the two applicable thresholds.
   * @private
   */
  _resolveThreshold(travelMode, user) {
    const byMode     = ACCESSIBILITY_THRESHOLDS[travelMode] ?? ACCESSIBILITY_THRESHOLDS.walk_only;
    const byMobility = MOBILITY_THRESHOLDS[user?.mobility_type];
    return byMobility != null ? Math.max(byMode, byMobility) : byMode;
  }
}
