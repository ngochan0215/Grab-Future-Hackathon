import express from "express";
import { list, getOne, create, remove } from "../controllers/savedRoute.controller.js";
import authenticate from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", list);
router.post("/", create);
router.get("/:id", getOne);
router.delete("/:id", remove);

export default router;
