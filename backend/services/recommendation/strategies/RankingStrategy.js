/**
 * Abstract base class for route ranking strategies.
 *
 * Each concrete strategy receives a ScoredRoute (with accessibility already
 * computed and verified) plus a RankingContext (normalisation bounds for the
 * current candidate set) and returns a score in [0, 1].
 *
 * Strategies MUST NOT modify the route or override the accessibility score.
 * They ONLY decide how to weight the tradeoffs between routes that have
 * already passed the accessibility gate.
 *
 * To add a new preference, extend this class and register it with StrategyRegistry.
 */
export class RankingStrategy {
  /** @returns {string} unique identifier matching a RoutePreference value */
  get id() {
    throw new Error(`${this.constructor.name} must implement get id()`);
  }

  /** @returns {string} human-readable name for logging / API responses */
  get name() {
    throw new Error(`${this.constructor.name} must implement get name()`);
  }

  /**
   * @param {import('../types.js').ScoredRoute}     scoredRoute
   * @param {import('../types.js').RankingContext}   context
   * @returns {number} ranking score in [0, 1], higher is better
   */
  // eslint-disable-next-line no-unused-vars
  score(scoredRoute, context) {
    throw new Error(`${this.constructor.name} must implement score()`);
  }
}
