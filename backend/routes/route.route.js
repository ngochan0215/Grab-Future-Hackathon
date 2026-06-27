import express from "express";
import { search, compare, review, reviews } from "../controllers/route.controller.js";
import authenticate from "../middleware/auth.js";

const router = express.Router();

router.post("/search", authenticate, search);
router.post("/compare", authenticate, compare);
router.get("/:id/reviews", reviews);
router.post("/:id/review", authenticate, review);

export default router;
