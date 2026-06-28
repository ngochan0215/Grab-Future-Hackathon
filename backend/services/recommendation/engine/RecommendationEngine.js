/**
 * Core orchestrator of the route recommendation pipeline.
 *
 * Pipeline (all steps deterministic — no AI involved here):
 *
 *   Step 1 — Score accessibility
 *     Each candidate route is scored independently by RouteAccessibilityCalculator.
 *     No route knows about other routes at this stage.
 *
 *   Step 2 — Filter
 *     AccessibilityFilter rejects routes that fall below the threshold for
 *     the user's travel mode and mobility profile.
 *     A route with a blocking issue (e.g. stairs-only for wheelchair) is
 *     always rejected regardless of its aggregate score.
 *
 *   Step 3 — Build ranking context
 *     Normalisation bounds (min/max duration, cost) are computed from the
 *     PASSING routes only.  This avoids a rejected outlier distorting scores.
 *
 *   Step 4 — Rank
 *     The selected RankingStrategy receives each passing ScoredRoute and the
 *     shared context and returns a [0,1] ranking score.
 *     Routes are sorted descending; the top route is `recommended`.
 */
export class RecommendationEngine {
  /**
   * @param {Object} deps
   * @param {import('../scoring/RouteAccessibilityCalculator.js').RouteAccessibilityCalculator} deps.calculator
   * @param {import('../scoring/AccessibilityFilter.js').AccessibilityFilter}                   deps.filter
   * @param {import('../strategies/StrategyRegistry.js').StrategyRegistry}                      deps.registry
   */
  constructor({ calculator, filter, registry }) {
    this._calculator = calculator;
    this._filter     = filter;
    this._registry   = registry;
  }

  /**
   * @param {import('../types.js').RecommendationRequest} request
   * @returns {import('../types.js').RecommendationResult}
   */
  recommend(request) {
    const {
      candidateRoutes,
      activeAlerts,
      transport_mode,
      preference,
      user,
    } = request;

    // ── Step 1: Accessibility scoring ────────────────────────────────────────
    const allScored = candidateRoutes.map((route) =>
      this._calculator.score(route, activeAlerts, user, transport_mode)
    );

    // ── Step 2: Accessibility filter ─────────────────────────────────────────
    const { passed, rejected, threshold } = this._filter.filter(
      allScored, transport_mode, user
    );

    if (passed.length === 0) {
      return {
        recommended:    null,
        allRoutes:      allScored,
        rankedRoutes:   [],
        rejectedRouteIds: rejected,
        threshold,
        strategy:       null,
        noRouteReason:  `All ${allScored.length} candidate route(s) failed the accessibility ` +
                        `threshold of ${(threshold * 100).toFixed(0)}%.`,
      };
    }

    // ── Step 3: Ranking context ───────────────────────────────────────────────
    const context = this._buildContext(passed, request);

    // ── Step 4: Strategy ranking ──────────────────────────────────────────────
    const strategy = this._registry.get(preference);

    const rankedRoutes = passed
      .map((r) => ({ ...r, rankingScore: strategy.score(r, context) }))
      .sort((a, b) => b.rankingScore - a.rankingScore);

    return {
      recommended:      rankedRoutes[0],
      allRoutes:        allScored,
      rankedRoutes,
      rejectedRouteIds: rejected,
      threshold,
      strategy: { id: strategy.id, name: strategy.name },
    };
  }

  /** @private */
  _buildContext(routes, request) {
    const durations = routes.map((r) => r.route.total_duration ?? 0);
    const costs     = routes.map((r) => r.route.total_cost     ?? 0);

    return {
      minDuration:    Math.min(...durations),
      maxDuration:    Math.max(...durations),
      minCost:        Math.min(...costs),
      maxCost:        Math.max(...costs),
      transportMode:  request.transport_mode,
      preference:     request.preference,
      candidateCount: routes.length,
    };
  }
}
