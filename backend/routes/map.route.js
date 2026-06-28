import express from "express";
import {
  places,
  segments,
  alerts,
  reportAlert,
  busLines,
  busStops,
  placeReviews,
  reviewPlace,
} from "../controllers/map.controller.js";
import authenticate from "../middleware/auth.js";

const router = express.Router();

// Public map layers (đọc bản đồ không cần đăng nhập)
router.get("/places", places);
router.get("/places/:id/reviews", placeReviews);
router.get("/segments", segments);
router.get("/alerts", alerts);
router.get("/bus/lines", busLines);
router.get("/bus/stops", busStops);

// Cần đăng nhập (ghi dữ liệu)
router.post("/alerts", authenticate, reportAlert);
router.post("/places/:id/reviews", authenticate, reviewPlace);

export default router;
