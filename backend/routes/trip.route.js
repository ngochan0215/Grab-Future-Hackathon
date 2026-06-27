import express from "express";
import { start, finish, history } from "../controllers/trip.controller.js";
import authenticate from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", history);
router.post("/start", start);
router.post("/:id/finish", finish);

export default router;
