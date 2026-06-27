import express from "express";
import { list, create, remove } from "../controllers/address.controller.js";
import authenticate from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate); // tất cả route địa chỉ đều cần đăng nhập

router.get("/", list);
router.post("/", create);
router.delete("/:id", remove);

export default router;
