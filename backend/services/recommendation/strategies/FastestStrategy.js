import { RankingStrategy } from './RankingStrategy.js';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Ranks routes by travel time, with accessibility as a secondary factor.
 *
 * Scoring formula:
 *   75% — normalised duration (shortest = 1.0, longest = 0.0)
 *   25% — accessibility score (ensures we don't send users down a fast but poor route)
 *
 * Duration is normalised across the candidate set so the absolute travel time
 * doesn't matter — only the relative difference between options.
 *
 * If all candidates have the same duration (range === 0), the score collapses
 * to pure accessibility, which is the correct tiebreak.
 */
export class FastestStrategy extends RankingStrategy {
  get id()   { return 'time'; }
  get name() { return 'Fastest Route'; }

  score(scoredRoute, context) {
    const { minDuration, maxDuration } = context;
    const duration = scoredRoute.route.total_duration ?? 0;
    const range = maxDuration - minDuration;

    const durationScore = range > 0
      ? 1 - (duration - minDuration) / range
      : 1.0;

    return clamp(
      durationScore                          * 0.75 +
      scoredRoute.accessibilityScore.total   * 0.25,
      0, 1
    );
  }
}
