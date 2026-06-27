import { findById, createRouteReview, getRouteReviews } from "../data/mockDB.js";
import { buildRankedRoutes } from "../services/routeService.js";

// POST /api/routes/search
// Body: { origin, destination, transport_mode }
// Trả về danh sách tuyến đã xếp hạng theo độ ưu tiên (an toàn + tiếp cận).
const search = (req, res) => {
  try {
    const { origin, destination, transport_mode, priority } = req.body;
    if (!origin || !destination) {
      return res
        .status(400)
        .json({ success: false, message: "Cần điểm đi (origin) và điểm đến (destination)." });
    }
    const user = findById(req.user.user_id);
    const routes = buildRankedRoutes({ origin, destination, transport_mode, priority }, user);

    return res.status(200).json({
      success: true,
      data: {
        origin,
        destination,
        count: routes.length,
        routes, // đã sắp xếp: tuyến ưu tiên cao nhất đứng đầu
      },
    });
  } catch (err) {
    console.error("[route.search]", err);
    return res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

// POST /api/routes/compare
// Body: { origin, destination, transport_mode }
// Trả về so sánh tuyến tối ưu vs tuyến thông thường (màn hình "see the difference").
const compare = (req, res) => {
  try {
    const { origin, destination, transport_mode, priority } = req.body;
    if (!origin || !destination) {
      return res
        .status(400)
        .json({ success: false, message: "Cần điểm đi (origin) và điểm đến (destination)." });
    }
    const user = findById(req.user.user_id);
    const routes = buildRankedRoutes({ origin, destination, transport_mode, priority }, user);

    const optimized = routes.find((r) => r.route_type === "optimized") || routes[0];
    const normal = routes.find((r) => r.route_type === "normal") || routes[1] || routes[0];

    return res.status(200).json({
      success: true,
      data: {
        optimized,
        normal,
        difference: {
          safety_score: optimized.safety_score - normal.safety_score,
          accessibility_score: optimized.accessibility_score - normal.accessibility_score,
          extra_distance: optimized.total_distance - normal.total_distance,
          extra_duration: optimized.total_duration - normal.total_duration,
          avoids: optimized.avoids,
        },
      },
    });
  } catch (err) {
    console.error("[route.compare]", err);
    return res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

// POST /api/routes/:id/review — đánh giá tuyến sau khi đi xong
const review = (req, res) => {
  const { rating_score, comment } = req.body;
  if (!(rating_score >= 1 && rating_score <= 5)) {
    return res.status(400).json({ success: false, message: "rating_score phải từ 1 đến 5." });
  }
  const created = createRouteReview(req.user.user_id, req.params.id, { rating_score, comment });
  return res.status(201).json({ success: true, message: "Đã đánh giá tuyến.", data: { review: created } });
};

// GET /api/routes/:id/reviews
const reviews = (req, res) =>
  res.status(200).json({ success: true, data: { reviews: getRouteReviews(req.params.id) } });

export { search, compare, review, reviews };
