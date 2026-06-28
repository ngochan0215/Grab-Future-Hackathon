/**
 * JSDoc type definitions for the Route Recommendation Engine.
 * These are documentation types only — no runtime code.
 *
 * TravelMode — how the user travels on this journey.
 * @typedef {'walk_only'|'walk_and_bus'|'walk_and_motorbike'|'wheelchair'|'mixed'} TravelMode
 *
 * RoutePreference — what the user optimises for after accessibility is satisfied.
 * @typedef {'safety'|'time'|'cost'|'accessibility'|'avoid_hills'|'least_transfers'} RoutePreference
 *
 * MobilityType — user's physical device type (from user profile).
 * @typedef {'walking'|'wheelchair_manual'|'wheelchair_electric'|'scooter'} MobilityType
 */

/**
 * A single road segment as stored in the database.
 * Fields marked optional are planned for future enrichment from field surveys.
 *
 * @typedef {Object} RouteSegment
 * @property {number}  segment_id
 * @property {string}  street_name
 * @property {'smooth'|'moderate'|'damaged'} surface_quality
 * @property {boolean} has_sidewalk_ramp
 * @property {number}  sidewalk_width            - metres
 * @property {number}  safety_score              - 0–5 (stored value)
 * @property {number}  distance                  - metres
 * @property {Array<[number,number]>} path       - [[lat,lng], ...]
 * @property {boolean} [has_stairs]              - future field
 * @property {boolean} [has_curb_ramp]           - future field
 * @property {number}  [slope_percent]           - future field, 0–100
 * @property {number}  [sidewalk_continuity]     - future field, 0–1
 */

/**
 * An active community report or sensor alert on a segment.
 *
 * @typedef {Object} RealtimeAlert
 * @property {number}   alert_id
 * @property {number}   segment_id
 * @property {string[]} issue_type  - e.g. ['pothole', 'flooded']
 * @property {'active'|'resolved'} status
 */

/**
 * A candidate route returned by OSRM (or assembled from mock segments).
 * Must have `segments` populated before entering the engine.
 *
 * @typedef {Object} CandidateRoute
 * @property {string}         route_id
 * @property {string}         route_type
 * @property {string}         label
 * @property {string}         origin
 * @property {string}         destination
 * @property {TravelMode}     transport_mode
 * @property {RouteSegment[]} segments
 * @property {number[]}       segment_ids
 * @property {number}         total_distance  - metres
 * @property {number}         total_duration  - minutes
 * @property {number}         total_cost      - VND
 * @property {Array<[number,number]>} path
 * @property {Object[]}       [grab_legs]
 */

/**
 * Per-segment accessibility calculation result.
 *
 * @typedef {Object} SegmentScore
 * @property {number}  segmentId
 * @property {number}  total            - 0–1 composite score
 * @property {boolean} hasBlockingIssue - true if route should be rejected for this segment
 * @property {number}  distance
 * @property {{ surfaceScore: number, rampScore: number, widthScore: number,
 *              safetyBaseScore: number, slopeScore: number,
 *              continuityScore: number, curbScore: number,
 *              alertPenalty: number }} breakdown
 * @property {{ segmentId: number, street_name: string, issue: string }[]} warnings
 */

/**
 * Route-level accessibility result (weighted aggregate of SegmentScores).
 *
 * @typedef {Object} RouteAccessibilityScore
 * @property {number}  total            - 0–1 weighted-by-distance average
 * @property {boolean} hasBlockingIssues
 * @property {Object}  breakdown        - per-factor weighted averages
 */

/**
 * A candidate route after accessibility scoring.
 * Strategies receive this type and add `rankingScore`.
 *
 * @typedef {Object} ScoredRoute
 * @property {CandidateRoute}         route
 * @property {RouteAccessibilityScore} accessibilityScore
 * @property {number}                  slopeScore             - 0–1
 * @property {number}                  sidewalkContinuityScore - 0–1
 * @property {SegmentScore[]}          segmentScores
 * @property {{ segmentId: number, street_name: string, issue: string }[]} warnings
 * @property {number}                  [rankingScore]  - set by strategy, 0–1
 */

/**
 * Context passed to every RankingStrategy.score() call.
 * Pre-computed from the set of routes that passed the accessibility filter.
 *
 * @typedef {Object} RankingContext
 * @property {number}          minDuration
 * @property {number}          maxDuration
 * @property {number}          minCost
 * @property {number}          maxCost
 * @property {TravelMode}      transportMode
 * @property {RoutePreference} preference
 * @property {number}          candidateCount
 */

/**
 * Input to RecommendationEngine.recommend().
 *
 * @typedef {Object} RecommendationRequest
 * @property {string}           origin
 * @property {string}           destination
 * @property {TravelMode}       transport_mode
 * @property {RoutePreference}  preference
 * @property {CandidateRoute[]} candidateRoutes
 * @property {RealtimeAlert[]}  activeAlerts
 * @property {{ mobility_type?: MobilityType, max_walking_distance?: number }} user
 */

/**
 * Output of RecommendationEngine.recommend().
 *
 * @typedef {Object} RecommendationResult
 * @property {ScoredRoute|null} recommended       - best route (null if all rejected)
 * @property {ScoredRoute[]}    allRoutes         - every route with accessibility score
 * @property {ScoredRoute[]}    rankedRoutes      - routes that passed filter, sorted by rankingScore
 * @property {string[]}         rejectedRouteIds  - route_ids of routes that failed the filter
 * @property {number}           threshold         - accessibility threshold that was applied
 * @property {{ id: string, name: string }|null} strategy
 * @property {string}           [noRouteReason]   - set when recommended is null
 */
