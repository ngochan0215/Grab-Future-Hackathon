import express from "express";
const router = express.Router();

import { register, login, getMe } from "../controllers/auth.controller.js";
import authenticate from "../middleware/auth.js";

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", authenticate, getMe);
export default router;