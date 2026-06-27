import {
  getPlaces,
  getPlaceById,
  getSegments,
  getAlerts,
  getActiveAlerts,
  createAlert,
  getBusLines,
  getBusStops,
  getPlaceReviews,
  createPlaceReview,
} from "../data/mockDB.js";

// GET /api/places  (?accessible_toilet=true&ramp=true)
const places = (req, res) => {
  let result = getPlaces();
  if (req.query.ramp === "true") result = result.filter((p) => p.has_ramp_entrance);
  if (req.query.accessible_toilet === "true")
    result = result.filter((p) => p.has_accessible_toilet);
  return res.status(200).json({ success: true, data: { places: result } });
};

// GET /api/segments — overlay chất lượng đường (AI Road Quality)
const segments = (req, res) =>
  res.status(200).json({ success: true, data: { segments: getSegments() } });

// GET /api/alerts  (?status=active&issue_type=flooded)
const alerts = (req, res) => {
  let result = req.query.status === "active" ? getActiveAlerts() : getAlerts();
  if (req.query.issue_type) {
    // issue_type là mảng token → lọc theo token chứa trong mảng
    result = result.filter((a) => (a.issue_type || []).includes(req.query.issue_type));
  }
  return res.status(200).json({ success: true, data: { alerts: result } });
};

// POST /api/alerts — user báo cáo vật cản / ngập
const reportAlert = (req, res) => {
  const { segment_id, issue_type, description } = req.body;
  // issue_type có thể là mảng ["pothole","flooded"] hoặc 1 chuỗi
  const issues = Array.isArray(issue_type) ? issue_type : issue_type ? [issue_type] : [];
  if (!segment_id || issues.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Cần segment_id và ít nhất một loại sự cố." });
  }
  const alert = createAlert(req.user.user_id, { segment_id, issue_type: issues, description });
  return res.status(201).json({ success: true, message: "Đã ghi nhận báo cáo.", data: { alert } });
};

// GET /api/bus/lines  &  /api/bus/stops
const busLines = (req, res) =>
  res.status(200).json({ success: true, data: { bus_lines: getBusLines() } });
const busStops = (req, res) =>
  res.status(200).json({ success: true, data: { bus_stops: getBusStops() } });

// GET /api/places/:id/reviews
const placeReviews = (req, res) => {
  if (!getPlaceById(req.params.id)) {
    return res.status(404).json({ success: false, message: "Không tìm thấy địa điểm." });
  }
  return res
    .status(200)
    .json({ success: true, data: { reviews: getPlaceReviews(req.params.id) } });
};

// POST /api/places/:id/reviews
const reviewPlace = (req, res) => {
  if (!getPlaceById(req.params.id)) {
    return res.status(404).json({ success: false, message: "Không tìm thấy địa điểm." });
  }
  const { rating_score, comment } = req.body;
  if (!(rating_score >= 1 && rating_score <= 5)) {
    return res.status(400).json({ success: false, message: "rating_score phải từ 1 đến 5." });
  }
  const review = createPlaceReview(req.user.user_id, req.params.id, { rating_score, comment });
  return res.status(201).json({ success: true, message: "Đã gửi đánh giá.", data: { review } });
};

export { places, segments, alerts, reportAlert, busLines, busStops, placeReviews, reviewPlace };
