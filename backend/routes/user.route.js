import express from "express";
import { updateMe } from "../controllers/user.controller.js";
import authenticate from "../middleware/auth.js";

const router = express.Router();

router.patch("/me", authenticate, updateMe);

export default router;
