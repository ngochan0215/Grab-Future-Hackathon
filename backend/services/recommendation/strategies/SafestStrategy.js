import { RankingStrategy } from './RankingStrategy.js';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Ranks routes by overall safety and accessibility quality.
 *
 * Scoring formula:
 *   55% — route accessibility score (comprehensive measure)
 *   25% — sidewalk continuity (unbroken pedestrian path)
 *   20% — absence of construction / blocked-sidewalk reports
 *
 * All candidate routes here have already passed the accessibility threshold,
 * so this strategy differentiates among acceptable options.
 */
export class SafestStrategy extends RankingStrategy {
  get id()   { return 'safety'; }
  get name() { return 'Safest Route'; }

  score(scoredRoute, _context) {
    const accScore = scoredRoute.accessibilityScore.total;

    // Penalise active hazard reports that reduce safety
    const hazardCount = scoredRoute.warnings.filter(
      (w) => w.issue === 'construction' || w.issue === 'blocked_sidewalk' || w.issue === 'obstacle'
    ).length;
    const hazardPenalty = Math.min(hazardCount * 0.15, 0.45);

    const continuity = scoredRoute.sidewalkContinuityScore ?? 1.0;

    return clamp(
      accScore    * 0.55 +
      continuity  * 0.25 +
      (1 - hazardPenalty) * 0.20,
      0, 1
    );
  }
}
