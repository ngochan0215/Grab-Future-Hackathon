import { findById, updateUser, sanitize } from "../data/mockDB.js";

const VALID_MOBILITY = [
  "walking",
  "wheelchair",
  "wheelchair_manual",
  "wheelchair_electric",
  "crutches",
  "scooter",
  "none",
  "other",
];

// PATCH /api/users/me — cập nhật hồ sơ
const updateMe = (req, res) => {
  try {
    const { name, mobility_type, max_walking_distance } = req.body;
    const patch = {};

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ success: false, message: "Tên không được để trống." });
      }
      patch.name = String(name).trim();
    }

    if (mobility_type !== undefined) {
      if (!VALID_MOBILITY.includes(mobility_type)) {
        return res.status(400).json({
          success: false,
          message: `mobility_type không hợp lệ. Chấp nhận: ${VALID_MOBILITY.join(", ")}.`,
        });
      }
      patch.mobility_type = mobility_type;
    }

    if (max_walking_distance !== undefined) {
      const dist = parseInt(max_walking_distance);
      if (Number.isNaN(dist) || dist < 0) {
        return res.status(400).json({
          success: false,
          message: "max_walking_distance phải là số không âm.",
        });
      }
      patch.max_walking_distance = dist;
    }

    const user = updateUser(req.user.user_id, patch);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy user." });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật hồ sơ thành công.",
      data: { user: sanitize(user) },
    });
  } catch (err) {
    console.error("[updateMe]", err);
    return res.status(500).json({ success: false, message: "Lỗi server." });
  }
};

export { updateMe };
