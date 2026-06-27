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

export const ISSUE_TYPES = [
  { id: 'flooded', label: 'Ngập nước' },
  { id: 'pothole_and_flooded', label: 'Ổ gà & ngập' },
  { id: 'minor_pothole', label: 'Ổ gà nhỏ' },
  { id: 'obstacle', label: 'Vật cản' },
  { id: 'construction', label: 'Đang thi công' },
  { id: 'broken_ramp', label: 'Hỏng lối dốc' },
  { id: 'other', label: 'Khác' },
];

export const issueLabel = (id) =>
  ISSUE_TYPES.find((i) => i.id === id)?.label || id;

export const TRANSPORT_MODES = [
  { id: 'walk_only', label: 'Đi bộ', icon: '🚶' },
  { id: 'walk_and_bus', label: 'Đi bộ + Xe buýt', icon: '🚌' },
];

export const transportLabel = (id) =>
  TRANSPORT_MODES.find((m) => m.id === id)?.label || id;

export const PRIORITIES = [
  { id: 'safety', label: 'An toàn nhất', icon: '🛡️', desc: 'Ưu tiên đường an toàn, ít chướng ngại' },
  { id: 'time', label: 'Nhanh nhất', icon: '⚡', desc: 'Ưu tiên thời gian di chuyển ngắn' },
  { id: 'accessibility', label: 'Dễ tiếp cận', icon: '♿', desc: 'Ưu tiên lối dốc, vỉa hè rộng, phẳng' },
  { id: 'cost', label: 'Tiết kiệm', icon: '💰', desc: 'Ưu tiên chi phí thấp nhất' },
];
