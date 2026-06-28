import { RankingStrategy } from './RankingStrategy.js';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Ranks routes by terrain flatness.
 *
 * Scoring formula:
 *   65% — slope score (0 = at-maximum-slope everywhere, 1 = completely flat)
 *   35% — accessibility score (ensure barrier-free guarantees are not lost)
 *
 * Especially relevant for manual wheelchair users and users with limited
 * cardiovascular capacity who can walk but find hills exhausting.
 *
 * The slopeScore is pre-computed by RouteAccessibilityCalculator as the
 * distance-weighted average of each segment's slope score.
 */
export class AvoidHillsStrategy extends RankingStrategy {
  get id()   { return 'avoid_hills'; }
  get name() { return 'Flattest Route'; }

  score(scoredRoute, _context) {
    const slopeScore = scoredRoute.slopeScore ?? 1.0;

    return clamp(
      slopeScore                            * 0.65 +
      scoredRoute.accessibilityScore.total  * 0.35,
      0, 1
    );
  }
}
