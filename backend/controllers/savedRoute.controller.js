import {
  listSavedRoutes,
  getSavedRoute,
  createSavedRoute,
  deleteSavedRoute,
} from "../data/mockDB.js";

// GET /api/saved-routes
const list = (req, res) =>
  res.status(200).json({ success: true, data: { routes: listSavedRoutes(req.user.user_id) } });

// GET /api/saved-routes/:id
const getOne = (req, res) => {
  const route = getSavedRoute(req.params.id);
  if (!route || route.user_id !== String(req.user.user_id)) {
    return res.status(404).json({ success: false, message: "Không tìm thấy tuyến đã lưu." });
  }
  return res.status(200).json({ success: true, data: { route } });
};

// POST /api/saved-routes
const create = (req, res) => {
  const { origin, destination } = req.body;
  if (!origin || !destination) {
    return res.status(400).json({ success: false, message: "Cần origin và destination." });
  }
  const route = createSavedRoute(req.user.user_id, req.body);
  return res.status(201).json({ success: true, message: "Đã lưu tuyến.", data: { route } });
};

// DELETE /api/saved-routes/:id
const remove = (req, res) => {
  const ok = deleteSavedRoute(req.user.user_id, req.params.id);
  if (!ok) {
    return res.status(404).json({ success: false, message: "Không tìm thấy tuyến đã lưu." });
  }
  return res.status(200).json({ success: true, message: "Đã xoá tuyến." });
};

export { list, getOne, create, remove };
