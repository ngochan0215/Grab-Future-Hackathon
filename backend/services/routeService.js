import { getSegmentById, getActiveAlerts } from "../data/mockDB.js";

// ════════════════════════════════════════════════════════════
//  Route scoring (demo optimizer)
//  Cho điểm từng segment dựa trên mức độ tiếp cận (accessibility)
//  và an toàn (safety), có xét tới loại di chuyển của user và các
//  cảnh báo real-time (ngập / ổ gà / vật cản) đang active.
// ════════════════════════════════════════════════════════════

const SURFACE_SCORE = { smooth: 1, moderate: 0.6, damaged: 0.2 };

// Nhóm cần lối đi rộng + bề mặt phẳng (xe lăn, scooter)
const WHEELED = ["wheelchair_manual", "wheelchair_electric", "wheelchair", "scooter"];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Điểm accessibility của 1 segment cho 1 user (0..1).
 */
const segmentAccessibility = (seg, user) => {
  const needsWheel = WHEELED.includes(user?.mobility_type);
  const minWidth = needsWheel ? 1.5 : 0.8;

  const surface = SURFACE_SCORE[seg.surface_quality] ?? 0.5;
  const ramp = seg.has_sidewalk_ramp ? 1 : needsWheel ? 0 : 0.5;
  const width = clamp((seg.sidewalk_width ?? minWidth) / minWidth, 0, 1);

  // Người dùng xe lăn nhạy cảm với bề mặt & lối lên dốc hơn
  const weights = needsWheel
    ? { surface: 0.4, ramp: 0.35, width: 0.25 }
    : { surface: 0.5, ramp: 0.2, width: 0.3 };

  return surface * weights.surface + ramp * weights.ramp + width * weights.width;
};

/**
 * Tính điểm tổng hợp cho 1 tuyến (mảng các segment).
 * Trả về { accessibility_score, safety_score, priority_score, avoids, warnings }
 * tất cả thang 0..100.
 */
const scoreRoute = (segments, user, activeAlerts) => {
  if (!segments.length) {
    return {
      accessibility_score: 0,
      safety_score: 0,
      priority_score: 0,
      avoids: [],
      warnings: ["Tuyến không có dữ liệu segment."],
    };
  }

  const alertsBySegment = new Map();
  for (const a of activeAlerts) {
    if (!alertsBySegment.has(a.segment_id)) alertsBySegment.set(a.segment_id, []);
    alertsBySegment.get(a.segment_id).push(a);
  }

  let accSum = 0;
  let safetySum = 0;
  const warnings = [];

  for (const seg of segments) {
    const segAlerts = alertsBySegment.get(seg.segment_id) || [];
    const acc = segmentAccessibility(seg, user);

    // Safety từ segment (thang 5 → 0..1), trừ điểm nếu có cảnh báo active
    let safety = (seg.safety_score ?? 3) / 5;
    safety -= segAlerts.length * 0.3;
    safety = clamp(safety, 0, 1);

    for (const a of segAlerts) {
      // issue_type là mảng token (vd ["pothole","flooded"]); frontend dịch sang nhãn.
      warnings.push({ street_name: seg.street_name, issues: a.issue_type });
    }

    accSum += acc;
    safetySum += safety;
  }

  const accessibility_score = Math.round((accSum / segments.length) * 100);
  const safety_score = Math.round((safetySum / segments.length) * 100);
  // Ưu tiên: an toàn + tiếp cận quan trọng ngang nhau cho nhóm yếu thế
  const priority_score = Math.round(accessibility_score * 0.5 + safety_score * 0.5);

  return {
    accessibility_score,
    safety_score,
    priority_score,
    warnings,
    avoids: [],
  };
};

// Các tuyến ứng viên (chuỗi segment đã KẾT NỐI tại các node chung).
// Cả hai cùng đi KTX Khu A → NVH Sinh Vien nhưng khác đường:
//  - optimized: 201 → 203 → 204 (bằng phẳng, có dốc, tránh cảnh báo — dài hơn)
//  - normal:    202 → 205      (lối tắt sau KTX, hư hỏng + ngập — ngắn hơn)
// Trong sản phẩm thật, đây là nơi gọi graph/routing engine để sinh chuỗi này.
const CANDIDATES = [
  {
    route_type: "optimized",
    label: "Tuyến tối ưu (an toàn & dễ tiếp cận)",
    segment_ids: [201, 203, 204],
  },
  {
    route_type: "normal",
    label: "Tuyến thông thường (lối tắt, ngắn hơn)",
    segment_ids: [202, 205],
  },
];

// Cho điểm ưu tiên (priority_score) tuỳ tiêu chí người dùng chọn.
const priorityScore = (priority, r) => {
  const s = r.safety_score, a = r.accessibility_score, t = r.time_score, c = r.cost_score;
  switch (priority) {
    case "time":
      return Math.round(0.7 * t + 0.2 * s + 0.1 * a);
    case "cost":
      return Math.round(0.6 * c + 0.2 * s + 0.2 * a);
    case "accessibility":
      return Math.round(0.6 * a + 0.3 * s + 0.1 * t);
    case "safety":
    default:
      return Math.round(0.55 * s + 0.3 * a + 0.15 * t);
  }
};

// Nối path của các segment thành 1 polyline, bỏ điểm trùng tại node nối.
const concatPaths = (segments) => {
  const coords = [];
  for (const seg of segments) {
    for (const pt of seg.path || []) {
      const last = coords[coords.length - 1];
      if (last && last[0] === pt[0] && last[1] === pt[1]) continue; // tránh lặp node nối
      coords.push(pt);
    }
  }
  return coords;
};

const BUS_FARE = 7000; // VND/chuyến (demo) khi có đi xe buýt

// Các mode cần đề xuất Grab/Be cho đoạn xe máy
const GRAB_MODES = ["walk_and_motorbike", "mixed"];

// Điểm trung chuyển cố định cho demo (trạm xe buýt NVH Sinh viên)
const TRANSFER_STOP = {
  label: "Trạm NVH Sinh viên (điểm trung chuyển)",
  lat: 10.874,
  lng: 106.802,
};

const buildRankedRoutes = ({ origin, destination, transport_mode, priority }, user) => {
  const activeAlerts = getActiveAlerts();
  const mode = transport_mode || "walk_only";
  const pri = priority || "safety";
  const needsGrab = GRAB_MODES.includes(mode);

  const routes = CANDIDATES.map((c, i) => {
    const segments = c.segment_ids.map(getSegmentById).filter(Boolean);
    const scored = scoreRoute(segments, user, activeAlerts);

    // Cảnh báo mà tuyến này TRÁNH được = cảnh báo không nằm trên tuyến
    const onRoute = new Set(segments.map((s) => s.segment_id));
    const avoids = [
      ...new Set(
        activeAlerts
          .filter((a) => !onRoute.has(a.segment_id))
          .flatMap((a) => a.issue_type) // mỗi alert có mảng token
      ),
    ];

    const path = concatPaths(segments);
    const totalDistance = segments.reduce((sum, s) => sum + (s.distance || 0), 0);
    const grabDistance = 650; // mét — đoạn xe máy từ điểm đi đến điểm trung chuyển

    // Đoạn Grab/Be: xe máy từ điểm đi → điểm trung chuyển (chỉ khi mode cần Grab)
    const grab_legs = needsGrab
      ? [
          {
            pickup_label: origin,
            dropoff_label: TRANSFER_STOP.label,
            pickup_lat: path[0]?.[0] ?? null,
            pickup_lng: path[0]?.[1] ?? null,
            dropoff_lat: TRANSFER_STOP.lat,
            dropoff_lng: TRANSFER_STOP.lng,
            distance: grabDistance,
            duration: 5, // phút ước tính
            vehicle_mode: "motorbike",
          },
        ]
      : [];

    return {
      route_id: `opt-${i + 1}`,
      route_type: c.route_type,
      label: c.label,
      origin,
      destination,
      transport_mode: mode,
      segment_ids: segments.map((s) => s.segment_id),
      segments,
      path, // [[lat,lng], ...] để vẽ trên bản đồ
      origin_point: path[0] || null,
      destination_point: path[path.length - 1] || null,
      total_distance: totalDistance + (needsGrab ? grabDistance : 0),
      total_duration: Math.round(totalDistance / 75) + (needsGrab ? 5 : 0),
      total_cost:
        mode === "walk_and_bus" ? BUS_FARE
        : mode === "walk_and_motorbike" ? 15000
        : mode === "mixed" ? BUS_FARE + 15000
        : 0,
      grab_legs,
      ...scored,
      avoids,
    };
  });

  // Điểm thời gian/chi phí tương đối (so với tuyến tốt nhất trong nhóm)
  const minDur = Math.min(...routes.map((r) => r.total_duration || 1));
  const minCost = Math.min(...routes.map((r) => r.total_cost || 0));
  routes.forEach((r) => {
    r.time_score = Math.round((100 * minDur) / (r.total_duration || 1));
    r.cost_score = (r.total_cost || 0) === 0 ? 100 : Math.round((100 * (minCost || 1)) / r.total_cost);
    r.priority_score = priorityScore(pri, r);
  });

  // Xếp hạng theo độ ưu tiên giảm dần; tuyến đầu là tuyến được đề xuất.
  routes.sort((a, b) => b.priority_score - a.priority_score);
  if (routes.length) routes[0].recommended = true;
  return routes;
};

export { scoreRoute, buildRankedRoutes, segmentAccessibility, concatPaths };
