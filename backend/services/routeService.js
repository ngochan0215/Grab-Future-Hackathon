import { getSegments, getActiveAlerts } from "../data/mockDB.js";

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
      warnings.push(`${seg.street_name}: ${a.issue_type}`);
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

/**
 * Demo: tạo các tuyến ứng viên từ segment hiện có rồi xếp hạng.
 * Trong sản phẩm thật, đây là nơi gọi graph/routing engine.
 */
const buildRankedRoutes = ({ origin, destination, transport_mode }, user) => {
  const segments = getSegments();
  const activeAlerts = getActiveAlerts();
  const alertedSegmentIds = new Set(activeAlerts.map((a) => a.segment_id));

  // Tuyến "tối ưu": ưu tiên segment KHÔNG có cảnh báo, bề mặt tốt
  const optimizedSegments = segments.filter((s) => !alertedSegmentIds.has(s.segment_id));
  // Tuyến "thông thường" (như bản đồ phổ thông): tất cả segment, kể cả có cảnh báo
  const normalSegments = segments;

  const candidates = [
    { route_type: "optimized", label: "Tuyến tối ưu (an toàn & dễ tiếp cận)", segments: optimizedSegments },
    { route_type: "normal", label: "Tuyến thông thường (ngắn nhất)", segments: normalSegments },
  ];

  const routes = candidates.map((c, i) => {
    const scored = scoreRoute(c.segments, user, activeAlerts);
    // Obstacle mà tuyến này tránh được = các cảnh báo không nằm trên tuyến
    const onRoute = new Set(c.segments.map((s) => s.segment_id));
    const avoids = activeAlerts
      .filter((a) => !onRoute.has(a.segment_id))
      .map((a) => a.issue_type);

    const totalDistance = c.segments.reduce((sum) => sum + 400, 0); // demo ước lượng
    return {
      route_id: `opt-${i + 1}`,
      route_type: c.route_type,
      label: c.label,
      origin,
      destination,
      transport_mode: transport_mode || "walk_only",
      segment_ids: c.segments.map((s) => s.segment_id),
      segments: c.segments,
      total_distance: totalDistance,
      total_duration: Math.round(totalDistance / 75), // ~75 m/phút đi bộ
      ...scored,
      avoids,
    };
  });

  // Xếp hạng theo độ ưu tiên giảm dần
  routes.sort((a, b) => b.priority_score - a.priority_score);
  return routes;
};

export { scoreRoute, buildRankedRoutes, segmentAccessibility };
