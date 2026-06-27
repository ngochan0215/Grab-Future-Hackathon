import { listAddresses, createAddress, deleteAddress } from "../data/mockDB.js";

// GET /api/addresses
const list = (req, res) => {
  const addresses = listAddresses(req.user.user_id);
  return res.status(200).json({ success: true, data: { addresses } });
};

// POST /api/addresses
const create = (req, res) => {
  const { label, address, latitude, longitude } = req.body;
  if (!address || !String(address).trim()) {
    return res.status(400).json({ success: false, message: "Thiếu địa chỉ (address)." });
  }
  const saved = createAddress(req.user.user_id, {
    label,
    address: String(address).trim(),
    latitude,
    longitude,
  });
  return res.status(201).json({ success: true, message: "Đã lưu địa chỉ.", data: { address: saved } });
};

// DELETE /api/addresses/:id
const remove = (req, res) => {
  const ok = deleteAddress(req.user.user_id, req.params.id);
  if (!ok) {
    return res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ." });
  }
  return res.status(200).json({ success: true, message: "Đã xoá địa chỉ." });
};

export { list, create, remove };
