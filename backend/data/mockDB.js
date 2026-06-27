import { v4 as uuidv4 } from "uuid";
import mockData from "./mockdata.json" with { type: "json" };

// Seed từ mockdata.json: chuẩn hoá user_id về string (đồng bộ với UUID),
// và created_at về Date
let users = mockData.users.map((u) => ({
  ...u,
  user_id: String(u.user_id),
  created_at: new Date(u.created_at),
}));

// ---- Helpers giả lập các query DB ----

const findByEmail = (email) =>
  users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;

const findById = (user_id) =>
  users.find((u) => u.user_id === user_id) || null;

const emailExists = (email) => !!findByEmail(email);

const createUser = ({ name, email, password, mobility_type, max_walking_distance }) => {
  const newUser = {
    user_id: uuidv4(),
    name,
    email,
    password,
    mobility_type: mobility_type || "walking",
    max_walking_distance: max_walking_distance || 1000,
    created_at: new Date(),
  };
  users.push(newUser);
  return newUser;
};

// Trả về user không kèm password
const sanitize = (user) => {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
};
export { findByEmail, findById, emailExists, createUser, sanitize };