import { RankingStrategy } from './RankingStrategy.js';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Ranks routes by estimated travel cost (bus fare, ride-hail, etc.).
 *
 * Scoring formula:
 *   70% — normalised cost (cheapest = 1.0, most expensive = 0.0)
 *   30% — accessibility score
 *
 * When all routes have the same cost (e.g. walk-only options — all free),
 * the cost dimension collapses and the score becomes pure accessibility.
 * This ensures walk-only routes are still differentiated meaningfully.
 */
export class CheapestStrategy extends RankingStrategy {
  get id()   { return 'cost'; }
  get name() { return 'Cheapest Route'; }

  score(scoredRoute, context) {
    const { minCost, maxCost } = context;
    const cost  = scoredRoute.route.total_cost ?? 0;
    const range = maxCost - minCost;

    const costScore = range > 0
      ? 1 - (cost - minCost) / range
      : 1.0;

    return clamp(
      costScore                              * 0.70 +
      scoredRoute.accessibilityScore.total   * 0.30,
      0, 1
    );
  }
}
