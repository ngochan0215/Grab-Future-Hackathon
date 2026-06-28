// ════════════════════════════════════════════════════════════
//  Route Recommendation Engine — Public API
//
//  Wires all layers together (IoC composition root) and exposes:
//
//    recommendRoute(params)              — convenience one-call API
//    createRecommendationEngine(opts)    — factory for custom configuration
//
//  All scoring / filtering / ranking is deterministic.
//  LLM is used ONLY for natural-language explanation (post-decision).
// ════════════════════════════════════════════════════════════

import { RouteAccessibilityCalculator } from './scoring/RouteAccessibilityCalculator.js';
import { AccessibilityFilter }           from './scoring/AccessibilityFilter.js';
import { RecommendationEngine }          from './engine/RecommendationEngine.js';
import { ExplanationGenerator }          from './explanation/ExplanationGenerator.js';
import { StrategyRegistry }              from './strategies/StrategyRegistry.js';
import { SafestStrategy }                from './strategies/SafestStrategy.js';
import { FastestStrategy }               from './strategies/FastestStrategy.js';
import { CheapestStrategy }              from './strategies/CheapestStrategy.js';
import { MostAccessibleStrategy }        from './strategies/MostAccessibleStrategy.js';
import { AvoidHillsStrategy }            from './strategies/AvoidHillsStrategy.js';

// ── Default engine (built once, reused across requests) ──────────────────────

const _defaultRegistry = new StrategyRegistry()
  .register(new SafestStrategy())
  .register(new FastestStrategy())
  .register(new CheapestStrategy())
  .register(new MostAccessibleStrategy())
  .register(new AvoidHillsStrategy());

const _defaultEngine = new RecommendationEngine({
  calculator: new RouteAccessibilityCalculator(),
  filter:     new AccessibilityFilter(),
  registry:   _defaultRegistry,
});

const _defaultExplainer = new ExplanationGenerator(null); // no LLM → deterministic fallback

// ── Convenience function ──────────────────────────────────────────────────────

/**
 * Score, filter, rank, and explain candidate routes in one call.
 *
 * @param {Object}  params
 * @param {string}  params.origin
 * @param {string}  params.destination
 * @param {string}  [params.transport_mode='walk_only']
 * @param {string}  [params.preference='safety']
 * @param {import('./types.js').CandidateRoute[]} params.candidateRoutes
 * @param {import('./types.js').RealtimeAlert[]}  [params.activeAlerts=[]]
 * @param {Object}  [params.user={}]
 * @param {boolean} [params.withExplanation=true]
 * @returns {Promise<import('./types.js').RecommendationResult & { explanation: string|null }>}
 */
export async function recommendRoute({
  origin,
  destination,
  transport_mode  = 'walk_only',
  preference      = 'safety',
  candidateRoutes,
  activeAlerts    = [],
  user            = {},
  withExplanation = true,
}) {
  const result = _defaultEngine.recommend({
    origin,
    destination,
    transport_mode,
    preference,
    candidateRoutes,
    activeAlerts,
    user,
  });

  const explanation = withExplanation
    ? await _defaultExplainer.explain(result, { origin, destination, transport_mode, preference, user })
    : null;

  return { ...result, explanation };
}

// ── Factory for custom configuration ─────────────────────────────────────────

/**
 * Build a fully configured engine instance with optional LLM and extra strategies.
 *
 * @param {Object}  [opts]
 * @param {{ chat: (prompt: string) => Promise<string> } | null} [opts.llmClient]
 * @param {import('./strategies/RankingStrategy.js').RankingStrategy[]} [opts.extraStrategies=[]]
 * @returns {{ recommend, explain, recommendWithExplanation, listStrategies }}
 */
export function createRecommendationEngine({ llmClient = null, extraStrategies = [] } = {}) {
  const registry = new StrategyRegistry()
    .register(new SafestStrategy())
    .register(new FastestStrategy())
    .register(new CheapestStrategy())
    .register(new MostAccessibleStrategy())
    .register(new AvoidHillsStrategy());

  for (const s of extraStrategies) {
    registry.register(s);
  }

  const engine   = new RecommendationEngine({
    calculator: new RouteAccessibilityCalculator(),
    filter:     new AccessibilityFilter(),
    registry,
  });
  const explainer = new ExplanationGenerator(llmClient);

  return {
    /** @param {import('./types.js').RecommendationRequest} request */
    recommend: (request) => engine.recommend(request),

    /** @param {import('./types.js').RecommendationResult} result */
    explain: (result, request) => explainer.explain(result, request),

    /** Combined in one async call */
    recommendWithExplanation: async (request) => {
      const result      = engine.recommend(request);
      const explanation = await explainer.explain(result, request);
      return { ...result, explanation };
    },

    /** @returns {{ id: string, name: string }[]} */
    listStrategies: () => registry.list(),
  };
}

// ── Named exports for testing / extension ────────────────────────────────────

export { RecommendationEngine }       from './engine/RecommendationEngine.js';
export { RouteAccessibilityCalculator } from './scoring/RouteAccessibilityCalculator.js';
export { AccessibilityFilter }        from './scoring/AccessibilityFilter.js';
export { StrategyRegistry }           from './strategies/StrategyRegistry.js';
export { ExplanationGenerator }       from './explanation/ExplanationGenerator.js';
export { RankingStrategy }            from './strategies/RankingStrategy.js';
export { SafestStrategy }             from './strategies/SafestStrategy.js';
export { FastestStrategy }            from './strategies/FastestStrategy.js';
export { CheapestStrategy }           from './strategies/CheapestStrategy.js';
export { MostAccessibleStrategy }     from './strategies/MostAccessibleStrategy.js';
export { AvoidHillsStrategy }         from './strategies/AvoidHillsStrategy.js';
