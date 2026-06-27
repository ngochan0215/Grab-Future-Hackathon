import { v4 as uuidv4 } from "uuid";
import mockData from "./mockdata.json" with { type: "json" };

// ════════════════════════════════════════════════════════════
//  In-memory collections (seeded từ mockdata.json)
//  Đây là DB giả lập cho demo — dữ liệu reset mỗi lần restart.
// ════════════════════════════════════════════════════════════

let users = mockData.users.map((u) => ({
  ...u,
  user_id: String(u.user_id),
  created_at: new Date(u.created_at),
}));

let accessiblePlaces = [...mockData.accessible_places];
let userReviews = [...mockData.user_reviews];
let routeSegments = [...mockData.route_segments];
let realtimeAlerts = [...mockData.realtime_alerts];
let busLines = [...mockData.bus_lines];
let busStops = [...mockData.bus_stops];
let segmentBusMapping = [...mockData.segment_bus_mapping];
let savedRoutes = mockData.saved_routes.map((r) => ({
  ...r,
  user_id: String(r.user_id),
}));
let routeDetails = [...mockData.route_details];

// ---- Collections mới — seed từ JSON, chuẩn hoá user_id về string ----
let savedAddresses = (mockData.saved_addresses || []).map((a) => ({
  ...a,
  user_id: String(a.user_id),
}));
let trips = (mockData.trips || []).map((t) => ({
  ...t,
  user_id: String(t.user_id),
}));
let routeReviews = (mockData.route_reviews || []).map((r) => ({
  ...r,
  user_id: String(r.user_id),
}));

// ---- Tiện ích sinh ID tăng dần cho collection dùng số ----
const nextId = (collection, key) =>
  collection.reduce((max, item) => Math.max(max, item[key] || 0), 0) + 1;

// ════════════════════════════════════════════════════════════
//  USERS
// ════════════════════════════════════════════════════════════

const findByEmail = (email) =>
  users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;

const findById = (user_id) =>
  users.find((u) => u.user_id === String(user_id)) || null;

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

const updateUser = (user_id, patch) => {
  const user = findById(user_id);
  if (!user) return null;
  const allowed = ["name", "mobility_type", "max_walking_distance"];
  for (const key of allowed) {
    if (patch[key] !== undefined) user[key] = patch[key];
  }
  return user;
};

// Trả về user không kèm password
const sanitize = (user) => {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
};

// ════════════════════════════════════════════════════════════
//  SAVED ADDRESSES
// ════════════════════════════════════════════════════════════

const listAddresses = (user_id) =>
  savedAddresses.filter((a) => a.user_id === String(user_id));

const createAddress = (user_id, { label, address, latitude, longitude }) => {
  const item = {
    address_id: nextId(savedAddresses, "address_id"),
    user_id: String(user_id),
    label: label || null,
    address,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    created_at: new Date(),
  };
  savedAddresses.push(item);
  return item;
};

const deleteAddress = (user_id, address_id) => {
  const idx = savedAddresses.findIndex(
    (a) => a.address_id === Number(address_id) && a.user_id === String(user_id)
  );
  if (idx === -1) return false;
  savedAddresses.splice(idx, 1);
  return true;
};

// ════════════════════════════════════════════════════════════
//  MAP LAYERS: places / segments / alerts / bus / reviews
// ════════════════════════════════════════════════════════════

const getPlaces = () => accessiblePlaces;
const getPlaceById = (place_id) =>
  accessiblePlaces.find((p) => p.place_id === Number(place_id)) || null;

const getSegments = () => routeSegments;
const getSegmentById = (segment_id) =>
  routeSegments.find((s) => s.segment_id === Number(segment_id)) || null;

const getAlerts = () => realtimeAlerts;
const getActiveAlerts = () =>
  realtimeAlerts.filter((a) => a.status === "active");

const createAlert = (user_id, { segment_id, issue_type, description }) => {
  const alert = {
    alert_id: nextId(realtimeAlerts, "alert_id"),
    segment_id: Number(segment_id),
    user_id: String(user_id),
    issue_type,
    description: description || null,
    detected_by: "User_Report_App",
    status: "active",
    created_at: new Date(),
  };
  realtimeAlerts.push(alert);
  return alert;
};

const getBusLines = () => busLines;
const getBusStops = () => busStops;

const getPlaceReviews = (place_id) =>
  userReviews.filter((r) => r.place_id === Number(place_id));

const createPlaceReview = (user_id, place_id, { rating_score, comment }) => {
  const review = {
    review_id: nextId(userReviews, "review_id"),
    place_id: Number(place_id),
    user_id: String(user_id),
    rating_score,
    comment: comment || null,
    created_at: new Date(),
  };
  userReviews.push(review);
  return review;
};

// ════════════════════════════════════════════════════════════
//  SAVED ROUTES (+ route_details)
// ════════════════════════════════════════════════════════════

const listSavedRoutes = (user_id) =>
  savedRoutes.filter((r) => r.user_id === String(user_id));

// Gắn kèm các segment đã sắp xếp theo sequence_order
const getSavedRoute = (route_id) => {
  const route = savedRoutes.find((r) => r.route_id === Number(route_id));
  if (!route) return null;
  const segments = routeDetails
    .filter((d) => d.route_id === route.route_id)
    .sort((a, b) => a.sequence_order - b.sequence_order)
    .map((d) => getSegmentById(d.segment_id))
    .filter(Boolean);
  return { ...route, segments };
};

const createSavedRoute = (user_id, payload) => {
  const route = {
    route_id: nextId(savedRoutes, "route_id"),
    user_id: String(user_id),
    origin: payload.origin,
    destination: payload.destination,
    total_distance: payload.total_distance ?? null,
    total_duration: payload.total_duration ?? null,
    total_cost: payload.total_cost ?? 0,
    transport_mode: payload.transport_mode || "walk_only",
    created_at: new Date(),
  };
  savedRoutes.push(route);

  // Lưu thứ tự các segment nếu client gửi kèm segment_ids
  if (Array.isArray(payload.segment_ids)) {
    payload.segment_ids.forEach((segId, i) => {
      routeDetails.push({
        route_detail_id: nextId(routeDetails, "route_detail_id"),
        route_id: route.route_id,
        segment_id: Number(segId),
        sequence_order: i + 1,
      });
    });
  }
  return getSavedRoute(route.route_id);
};

const deleteSavedRoute = (user_id, route_id) => {
  const idx = savedRoutes.findIndex(
    (r) => r.route_id === Number(route_id) && r.user_id === String(user_id)
  );
  if (idx === -1) return false;
  savedRoutes.splice(idx, 1);
  routeDetails = routeDetails.filter((d) => d.route_id !== Number(route_id));
  return true;
};

// ════════════════════════════════════════════════════════════
//  TRIPS (navigation start/finish)
// ════════════════════════════════════════════════════════════

const startTrip = (user_id, { origin, destination, route_id, segment_ids }) => {
  const trip = {
    trip_id: uuidv4(),
    user_id: String(user_id),
    origin: origin || null,
    destination: destination || null,
    route_id: route_id ?? null,
    segment_ids: Array.isArray(segment_ids) ? segment_ids.map(Number) : [],
    status: "in_progress",
    started_at: new Date(),
    finished_at: null,
    actual_distance: null,
    actual_duration: null,
  };
  trips.push(trip);
  return trip;
};

const finishTrip = (user_id, trip_id, { actual_distance, actual_duration } = {}) => {
  const trip = trips.find(
    (t) => t.trip_id === trip_id && t.user_id === String(user_id)
  );
  if (!trip) return null;
  trip.status = "completed";
  trip.finished_at = new Date();
  if (actual_distance !== undefined) trip.actual_distance = actual_distance;
  if (actual_duration !== undefined) trip.actual_duration = actual_duration;
  return trip;
};

const listTrips = (user_id) =>
  trips.filter((t) => t.user_id === String(user_id));

// ════════════════════════════════════════════════════════════
//  ROUTE REVIEWS (rate a route after a trip)
// ════════════════════════════════════════════════════════════

const createRouteReview = (user_id, route_id, { rating_score, comment }) => {
  const review = {
    route_review_id: nextId(routeReviews, "route_review_id"),
    route_id: Number(route_id),
    user_id: String(user_id),
    rating_score,
    comment: comment || null,
    created_at: new Date(),
  };
  routeReviews.push(review);
  return review;
};

const getRouteReviews = (route_id) =>
  routeReviews.filter((r) => r.route_id === Number(route_id));

export {
  // users
  findByEmail,
  findById,
  emailExists,
  createUser,
  updateUser,
  sanitize,
  // addresses
  listAddresses,
  createAddress,
  deleteAddress,
  // map layers
  getPlaces,
  getPlaceById,
  getSegments,
  getSegmentById,
  getAlerts,
  getActiveAlerts,
  createAlert,
  getBusLines,
  getBusStops,
  getPlaceReviews,
  createPlaceReview,
  // saved routes
  listSavedRoutes,
  getSavedRoute,
  createSavedRoute,
  deleteSavedRoute,
  // trips
  startTrip,
  finishTrip,
  listTrips,
  // route reviews
  createRouteReview,
  getRouteReviews,
};
