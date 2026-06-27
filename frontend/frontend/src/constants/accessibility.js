export const DISABILITY_TYPES = [
  { id: 'wheelchair', label: 'Xe lăn', icon: '♿' },
  { id: 'visual', label: 'Khiếm thị', icon: '👁' },
  { id: 'hearing', label: 'Khiếm thính', icon: '👂' },
  { id: 'elderly', label: 'Người cao tuổi', icon: '🧓' },
];

export const FILTERS = {
  wheelchair: ['ramp', 'elevator', 'no_stairs'],
  visual: ['audio_signal', 'tactile_paving'],
  hearing: ['visual_signal'],
  elderly: ['bench', 'elevator', 'ramp'],
};
