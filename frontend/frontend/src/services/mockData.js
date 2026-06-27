export const mockRoutes = [
  {
    id: 'route-1',
    legs: [
      { mode: 'walk', durationMin: 5, distanceM: 400, accessible: true },
      { mode: 'bus', line: '36', durationMin: 20, distanceM: 8000, accessible: true },
      { mode: 'walk', durationMin: 3, distanceM: 250, accessible: true },
    ],
    totalDurationMin: 28,
    accessibilityScore: 95,
  },
];
