// Human-readable Vietnamese labels for enum-ish backend values.

export const MOBILITY_TYPES = [
  { id: 'walking', label: 'Đi bộ', icon: '🚶' },
  { id: 'wheelchair', label: 'Xe lăn', icon: '♿' },
  { id: 'wheelchair_manual', label: 'Xe lăn tay', icon: '♿' },
  { id: 'wheelchair_electric', label: 'Xe lăn điện', icon: '♿' },
  { id: 'crutches', label: 'Nạng', icon: '🩼' },
  { id: 'scooter', label: 'Xe scooter', icon: '🛵' },
  { id: 'none', label: 'Không hạn chế', icon: '🙂' },
  { id: 'other', label: 'Khác', icon: '•' },
];

export const mobilityLabel = (id) =>
  MOBILITY_TYPES.find((m) => m.id === id)?.label || id || '—';

export const SURFACE_LABEL = {
  smooth: 'Bằng phẳng',
  moderate: 'Trung bình',
  damaged: 'Hư hỏng',
};

// Atomic issue tokens — an alert's issue_type is an array of these.
export const ISSUE_TYPES = [
  { id: 'pothole', label: 'Ổ gà' },
  { id: 'flooded', label: 'Ngập nước' },
  { id: 'obstacle', label: 'Vật cản' },
  { id: 'construction', label: 'Đang thi công' },
  { id: 'broken_ramp', label: 'Hỏng lối dốc' },
  { id: 'steep_slope', label: 'Dốc cao' },
  { id: 'narrow_path', label: 'Lối đi hẹp' },
  { id: 'no_sidewalk', label: 'Không có vỉa hè' },
  { id: 'crowded', label: 'Đông người' },
  { id: 'slippery', label: 'Trơn trượt' },
  { id: 'other', label: 'Khác' },
];

export const issueLabel = (id) =>
  ISSUE_TYPES.find((i) => i.id === id)?.label || id;

// Join an array of issue tokens into one readable string.
export const issueLabels = (arr) => {
  const list = Array.isArray(arr) ? arr : [arr].filter(Boolean);
  return list.map(issueLabel).join(', ');
};

// English issue labels (used by English-language screens, e.g. ComparePage).
export const ISSUE_LABELS_EN = {
  pothole: 'Pothole',
  flooded: 'Flooding',
  obstacle: 'Obstacle',
  construction: 'Construction',
  broken_ramp: 'Broken ramp',
  steep_slope: 'Steep slope',
  narrow_path: 'Narrow path',
  no_sidewalk: 'No sidewalk',
  crowded: 'Crowded',
  slippery: 'Slippery',
  other: 'Other',
};

export const issueLabelEn = (id) => ISSUE_LABELS_EN[id] || id;

export const issueLabelsEn = (arr) => {
  const list = Array.isArray(arr) ? arr : [arr].filter(Boolean);
  return list.map(issueLabelEn).join(', ');
};

// Format a route warning.
// Handles both the old shape { street_name, issues[] } and the engine shape { street_name, issue }.
export const formatWarning = (w) => {
  if (typeof w === 'string') return w;
  if (w.issues) return `${w.street_name}: ${issueLabels(w.issues)}`;
  if (w.issue)  return `${w.street_name}: ${issueLabel(w.issue)}`;
  return w.street_name ?? '—';
};

// English variant of formatWarning.
export const formatWarningEn = (w) => {
  if (typeof w === 'string') return w;
  if (w.issues) return `${w.street_name}: ${issueLabelsEn(w.issues)}`;
  if (w.issue)  return `${w.street_name}: ${issueLabelEn(w.issue)}`;
  return w.street_name ?? '—';
};

export const TRANSPORT_MODES = [
  { id: 'walk_only',         label: 'Đi bộ',                    icon: '🚶'  },
  { id: 'walk_and_bus',      label: 'Đi bộ + Xe buýt',          icon: '🚌'  },
  { id: 'walk_and_motorbike',label: 'Đi bộ + Xe máy (Grab/Be)', icon: '🏍️'  },
  { id: 'mixed',             label: 'Kết hợp (Xe máy + Xe buýt)',icon: '🔀'  },
];

export const GRAB_MODES = ['walk_and_motorbike', 'mixed'];

export const transportLabel = (id) =>
  TRANSPORT_MODES.find((m) => m.id === id)?.label || id;

export const PRIORITIES = [
  { id: 'safety',        label: 'An toàn nhất', icon: '🛡️', desc: 'Ưu tiên đường an toàn, ít chướng ngại' },
  { id: 'time',          label: 'Nhanh nhất',   icon: '⚡',  desc: 'Ưu tiên thời gian di chuyển ngắn' },
  { id: 'accessibility', label: 'Dễ tiếp cận',  icon: '♿',  desc: 'Ưu tiên lối dốc, vỉa hè rộng, phẳng' },
  { id: 'cost',          label: 'Tiết kiệm',    icon: '💰',  desc: 'Ưu tiên chi phí thấp nhất' },
  { id: 'avoid_hills',   label: 'Ít dốc nhất',  icon: '⛰️',  desc: 'Tránh đường dốc, phù hợp xe lăn tay' },
];

// ── Recommendation engine metadata ───────────────────────────────────────────

/** Human-readable label for each ranking strategy id. */
export const STRATEGY_LABELS = {
  safety:        '🛡️ Safest Route',
  time:          '⚡ Fastest Route',
  cost:          '💰 Cheapest Route',
  accessibility: '♿ Most Accessible',
  avoid_hills:   '⛰️ Flattest Route',
};

/** Accessibility breakdown factors returned by the engine. */
export const BREAKDOWN_FACTORS = [
  { key: 'surfaceScore',    label: 'Surface quality' },
  { key: 'rampScore',       label: 'Ramp / stair access' },
  { key: 'widthScore',      label: 'Sidewalk width' },
  { key: 'safetyBaseScore', label: 'Base safety' },
  { key: 'slopeScore',      label: 'Slope / incline' },
];
