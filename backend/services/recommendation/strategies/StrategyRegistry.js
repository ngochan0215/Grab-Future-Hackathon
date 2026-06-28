/**
 * Registry of all available ranking strategies.
 *
 * Adding a new preference requires only:
 *   1. Create a class that extends RankingStrategy
 *   2. Call registry.register(new MyStrategy()) at startup
 *
 * No changes to the engine, filter, or scorer are needed.
 */
export class StrategyRegistry {
  constructor() {
    /** @type {Map<string, import('./RankingStrategy.js').RankingStrategy>} */
    this._strategies = new Map();
  }

  /**
   * Register a strategy. Fluent — returns `this` for chaining.
   * @param {import('./RankingStrategy.js').RankingStrategy} strategy
   */
  register(strategy) {
    if (this._strategies.has(strategy.id)) {
      console.warn(`[StrategyRegistry] Overwriting strategy "${strategy.id}".`);
    }
    this._strategies.set(strategy.id, strategy);
    return this;
  }

  /**
   * Retrieve a strategy by preference id.
   * Falls back to 'safety' if the preference is unknown (logs a warning).
   *
   * @param {string} preference
   * @returns {import('./RankingStrategy.js').RankingStrategy}
   */
  get(preference) {
    if (this._strategies.has(preference)) {
      return this._strategies.get(preference);
    }
    const fallback = this._strategies.get('safety');
    if (!fallback) {
      throw new Error(
        `[StrategyRegistry] No strategy for "${preference}" and no "safety" fallback registered.`
      );
    }
    console.warn(
      `[StrategyRegistry] Unknown preference "${preference}" — falling back to "safety".`
    );
    return fallback;
  }

  /** @param {string} preference */
  has(preference) {
    return this._strategies.has(preference);
  }

  /** @returns {{ id: string, name: string }[]} */
  list() {
    return [...this._strategies.values()].map((s) => ({ id: s.id, name: s.name }));
  }
}
