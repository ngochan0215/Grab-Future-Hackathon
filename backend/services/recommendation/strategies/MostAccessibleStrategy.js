import { RankingStrategy } from './RankingStrategy.js';

/**
 * Ranks routes by maximum accessibility score.
 *
 * Useful when a user explicitly wants the most barrier-free route even if it
 * takes longer or costs more. The score IS the accessibility score, so the
 * route with the best segment-weighted accessibility always wins.
 */
export class MostAccessibleStrategy extends RankingStrategy {
  get id()   { return 'accessibility'; }
  get name() { return 'Most Accessible Route'; }

  score(scoredRoute, _context) {
    return scoredRoute.accessibilityScore.total;
  }
}
