import { findById, createRouteReview, getRouteReviews } from '../data/mockDB.js';
import { buildRankedRoutes } from '../services/routeService.js';

// POST /api/routes/search
// Body: { origin, destination, transport_mode, priority }
const search = async (req, res) => {
  try {
    const { origin, destination, transport_mode, priority } = req.body;
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Cần điểm đi (origin) và điểm đến (destination).',
      });
    }

    const user   = findById(req.user.user_id);
    const routes = await buildRankedRoutes({ origin, destination, transport_mode, priority }, user);

    return res.status(200).json({
      success: true,
      data: {
        origin,
        destination,
        count: routes.length,
        routes,
      },
    });
  } catch (err) {
    console.error('[route.search]', err);
    return res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// POST /api/routes/compare
const compare = async (req, res) => {
  try {
    const { origin, destination, transport_mode, priority } = req.body;
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Cần điểm đi (origin) và điểm đến (destination).',
      });
    }

    const user   = findById(req.user.user_id);
    const routes = await buildRankedRoutes({ origin, destination, transport_mode, priority }, user);

    const optimized = routes.find((r) => r.route_type === 'optimized') ?? routes[0];
    const normal    = routes.find((r) => r.route_type === 'normal')    ?? routes[1] ?? routes[0];

    // routes[0] is always the engine's top pick (recommended)
    const recommended = routes[0];

    return res.status(200).json({
      success: true,
      data: {
        optimized,
        normal,
        difference: {
          safety_score:        (optimized.safety_score        ?? 0) - (normal.safety_score        ?? 0),
          accessibility_score: (optimized.accessibility_score ?? 0) - (normal.accessibility_score ?? 0),
          extra_distance:      (optimized.total_distance      ?? 0) - (normal.total_distance      ?? 0),
          extra_duration:      (optimized.total_duration      ?? 0) - (normal.total_duration      ?? 0),
          avoids:               optimized.avoids ?? [],
          recommendation_explanation: recommended?.recommendation_explanation ?? null,
          recommendation_strategy:    recommended?.recommendation_strategy    ?? null,
        },
      },
    });
  } catch (err) {
    console.error('[route.compare]', err);
    return res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

// POST /api/routes/:id/review
const review = (req, res) => {
  const { rating_score, comment } = req.body;
  if (!(rating_score >= 1 && rating_score <= 5)) {
    return res.status(400).json({ success: false, message: 'rating_score phải từ 1 đến 5.' });
  }
  const created = createRouteReview(req.user.user_id, req.params.id, { rating_score, comment });
  return res.status(201).json({ success: true, message: 'Đã đánh giá tuyến.', data: { review: created } });
};

// GET /api/routes/:id/reviews
const reviews = (req, res) =>
  res.status(200).json({ success: true, data: { reviews: getRouteReviews(req.params.id) } });

export { search, compare, review, reviews };
