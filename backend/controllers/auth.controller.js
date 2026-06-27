import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import jwt_config from "../config/jwt.js";
import { findByEmail, findById, emailExists, createUser, sanitize } from "../data/mockDB.js";

const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_SALT_ROUNDS } = jwt_config;

const register = async (req, res) => {
  try {
    const { name, email, password, mobility_type, max_walking_distance } = req.body;

    // 1. Validate bắt buộc
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ: name, email, password.",
      });
    }

    // 2. Validate định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Định dạng email không hợp lệ.",
      });
    }

    // 3. Validate độ dài password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự.",
      });
    }

    // 4. Kiểm tra email đã tồn tại chưa
    if (emailExists(email)) {
      return res.status(409).json({
        success: false,
        message: "Email đã được sử dụng.",
      });
    }

    // 5. Validate mobility_type nếu có
    const VALID_MOBILITY = ["walking", "wheelchair", "crutches", "scooter", "other"];
    if (mobility_type && !VALID_MOBILITY.includes(mobility_type)) {
      return res.status(400).json({
        success: false,
        message: `mobility_type không hợp lệ. Chấp nhận: ${VALID_MOBILITY.join(", ")}.`,
      });
    }

    // 6. Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // 7. Tạo user
    const newUser = createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      mobility_type: mobility_type || "walking",
      max_walking_distance: max_walking_distance ? parseInt(max_walking_distance) : 1000,
    });

    // 8. Tạo JWT
    const token = jwt.sign(
      { user_id: newUser.user_id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công.",
      data: {
        token,
        user: sanitize(newUser),
      },
    });
  } catch (err) {
    console.error("[register]", err);
    return res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền email và password.",
      });
    }

    // 2. Tìm user
    const user = findByEmail(email);
    if (!user) {
      // Không tiết lộ tài khoản có tồn tại hay không
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng.",
      });
    }

    // 3. So sánh password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng.",
      });
    }

    // 4. Tạo JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công.",
      data: {
        token,
        user: sanitize(user),
      },
    });
  } catch (err) {
    console.error("[login]", err);
    return res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

const getMe = (req, res) => {
  try {
    const user = findById(req.user.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy user." });
    }
    return res.status(200).json({
      success: true,
      data: { user: sanitize(user) },
    });
  } catch (err) {
    console.error("[getMe]", err);
    return res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

export { register, login, getMe };