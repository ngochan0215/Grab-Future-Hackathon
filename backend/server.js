import express from "express";
import cors from "cors";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import addressRoute from "./routes/address.route.js";
import mapRoute from "./routes/map.route.js";
import routeRoute from "./routes/route.route.js";
import savedRouteRoute from "./routes/savedRoute.route.js";
import tripRoute from "./routes/trip.route.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/addresses", addressRoute);
app.use("/api", mapRoute); // /api/places, /api/segments, /api/alerts, /api/bus/*
app.use("/api/routes", routeRoute);
app.use("/api/saved-routes", savedRouteRoute);
app.use("/api/trips", tripRoute);


// Health check
app.get("/", (req, res) => {
  res.json({ message: "Auth API is running 🚀" });
});

// 404 handler
    
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Đã xảy ra lỗi server." });
});

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});