/**
 * Generates natural-language route explanations using an LLM.
 *
 * Architectural contract:
 *   - The LLM receives ONLY a narration prompt built from the engine's
 *     already-made decision.  It explains; it does NOT rank or score.
 *   - If the LLM is unavailable or throws, a deterministic fallback
 *     explanation is returned — the user always gets a response.
 *   - The engine result is never altered by this class.
 *
 * LLM client interface:
 *   { chat: (prompt: string) => Promise<string> }
 *
 * You can inject any client (Anthropic, OpenAI, Ollama, etc.) that satisfies
 * the interface above. Pass null to always use the fallback.
 */
export class ExplanationGenerator {
  /**
   * @param {{ chat: (prompt: string) => Promise<string> } | null} llmClient
   */
  constructor(llmClient = null) {
    this._llm = llmClient;
  }

  /**
   * @param {import('../types.js').RecommendationResult} result
   * @param {import('../types.js').RecommendationRequest} request
   * @returns {Promise<string>}
   */
  async explain(result, request) {
    const { recommended, rankedRoutes, rejectedRouteIds, threshold } = result;

    // No accessible route found
    if (!recommended) {
      return [
        `No accessible route was found between ${request.origin} and ${request.destination}.`,
        `All ${rejectedRouteIds.length} candidate route(s) scored below the required`,
        `accessibility threshold of ${Math.round(threshold * 100)}% for your travel mode.`,
        'Try a different travel mode, or check for temporary obstructions reported in the area.',
      ].join(' ');
    }

    const ctx = this._buildNarrationContext(recommended, rankedRoutes, request);

    if (this._llm) {
      try {
        return await this._llm.chat(this._buildPrompt(ctx));
      } catch (err) {
        console.warn('[ExplanationGenerator] LLM unavailable, using fallback.', err.message);
      }
    }

    return this._fallback(ctx);
  }

  /** @private */
  _buildNarrationContext(recommended, allRanked, request) {
    const bd = recommended.accessibilityScore.breakdown;
    const accPct = Math.round(recommended.accessibilityScore.total * 100);

    // Build a list of specific advantages to cite
    const advantages = [];
    if ((bd.rampScore    ?? 0) > 0.90) advantages.push('ramps available at all key crossings');
    if ((bd.surfaceScore ?? 0) > 0.85) advantages.push('smooth surface throughout');
    if ((recommended.sidewalkContinuityScore ?? 1) > 0.80) advantages.push('continuous sidewalks');
    if (recommended.warnings.length === 0)                  advantages.push('no active hazard reports');
    if ((recommended.slopeScore ?? 1) > 0.85)              advantages.push('minimal incline');

    const alternatives = allRanked.slice(1).map((alt, i) => ({
      index:        i + 2,
      accPct:       Math.round(alt.accessibilityScore.total * 100),
      durationDiff: (alt.route.total_duration ?? 0) - (recommended.route.total_duration ?? 0),
      costDiff:     (alt.route.total_cost     ?? 0) - (recommended.route.total_cost     ?? 0),
    }));

    return {
      origin:       request.origin,
      destination:  request.destination,
      preference:   request.preference,
      accPct,
      duration:     recommended.route.total_duration ?? 0,
      cost:         recommended.route.total_cost     ?? 0,
      advantages,
      warnings:     recommended.warnings.map((w) => `${w.street_name}: ${w.issue}`),
      alternatives,
      rankingScore: Math.round((recommended.rankingScore ?? 0) * 100),
    };
  }

  /** @private */
  _buildPrompt(ctx) {
    const altLines = ctx.alternatives.length > 0
      ? ctx.alternatives.map((a) => {
          const timeDiff = a.durationDiff > 0 ? `+${a.durationDiff}min slower` : `${Math.abs(a.durationDiff)}min faster`;
          return `  • Option ${a.index}: ${a.accPct}% accessibility, ${timeDiff}`;
        }).join('\n')
      : '  • No alternatives passed the accessibility threshold.';

    return `You are a friendly, concise accessibility navigation assistant.

A deterministic scoring engine has ALREADY selected the best route. Your job is ONLY to write a clear, warm explanation for the user. Do NOT re-evaluate or re-score routes.

Selected route:
• From: ${ctx.origin} → ${ctx.destination}
• User preference: "${ctx.preference}"
• Accessibility score: ${ctx.accPct}% (out of 100%)
• Estimated travel time: ${ctx.duration} minutes
• Estimated cost: ${ctx.cost > 0 ? ctx.cost.toLocaleString() + ' VND' : 'Free (walking)'}
• Why it was chosen: ${ctx.advantages.length > 0 ? ctx.advantages.join(', ') : 'best available option'}
• Active warnings on this route: ${ctx.warnings.length > 0 ? ctx.warnings.join('; ') : 'None'}

Compared to other options:
${altLines}

Write 2–3 sentences. Mention specific accessibility features. Address the user as "you". Be positive but honest about any warnings.`;
  }

  /** @private */
  _fallback(ctx) {
    const parts = [
      `This route scores ${ctx.accPct}% on accessibility`,
    ];

    if (ctx.advantages.length > 0) {
      parts.push(`with ${ctx.advantages.slice(0, 2).join(' and ')}`);
    }

    if (ctx.alternatives.length > 0) {
      const next = ctx.alternatives[0];
      const diff = next.durationDiff;
      const timePart = diff > 0
        ? `, saving you ${diff} minute${diff === 1 ? '' : 's'} compared to the next option`
        : '';
      parts.push(
        `and is the best match for your "${ctx.preference}" preference${timePart}`
      );
    }

    if (ctx.warnings.length > 0) {
      parts.push(
        `Note: there ${ctx.warnings.length === 1 ? 'is' : 'are'} ` +
        `${ctx.warnings.length} active report(s) — plan accordingly`
      );
    }

    return parts.join(', ') + '.';
  }
}
