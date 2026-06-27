import { startTrip, finishTrip, listTrips } from "../data/mockDB.js";

// POST /api/trips/start — bắt đầu điều hướng (nút "Start" như Google Maps)
const start = (req, res) => {
  const { origin, destination, route_id, segment_ids } = req.body;
  if (!origin || !destination) {
    return res.status(400).json({ success: false, message: "Cần origin và destination." });
  }
  const trip = startTrip(req.user.user_id, { origin, destination, route_id, segment_ids });
  return res.status(201).json({ success: true, message: "Bắt đầu chuyến đi.", data: { trip } });
};

// POST /api/trips/:id/finish — kết thúc chuyến đi
const finish = (req, res) => {
  const { actual_distance, actual_duration } = req.body;
  const trip = finishTrip(req.user.user_id, req.params.id, { actual_distance, actual_duration });
  if (!trip) {
    return res.status(404).json({ success: false, message: "Không tìm thấy chuyến đi." });
  }
  return res.status(200).json({ success: true, message: "Đã kết thúc chuyến đi.", data: { trip } });
};

// GET /api/trips — lịch sử chuyến đi
const history = (req, res) =>
  res.status(200).json({ success: true, data: { trips: listTrips(req.user.user_id) } });

export { start, finish, history };
