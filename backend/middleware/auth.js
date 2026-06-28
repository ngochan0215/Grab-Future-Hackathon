import jwt from "jsonwebtoken";
import jwt_config from "../config/jwt.js";
import { findById } from "../data/mockDB.js";

const { JWT_SECRET } = jwt_config;

const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Thiếu token xác thực. Vui lòng đăng nhập.",
    });
  }

  
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Kiểm tra user vẫn tồn tại trong DB
    const user = findById(decoded.user_id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại.",
      });
    }

    req.user = decoded; // { user_id, email, iat, exp }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn. Vui lòng đăng nhập lại.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ.",
    });
  }
};

export default authenticate;