export const THEME_COLORS = {
  lightBackground: "oklch(1 0 0)",
  darkBackground: "oklch(0.105 0 0)",
} as const;

export const CHART_TOKENS = {
  animationDurationMs: 220,
  heatScoreDomain: [0, 100] as [number, number],
  rankingHeightClass: "h-64",
  moduleHeightClass: "h-56",
  rankingMargin: { left: 0, right: 16, top: 4, bottom: 4 },
  compactMargin: { left: -24, right: 8, top: 8, bottom: 0 },
  yAxisLineWidth: 36,
  barRadius: [0, 6, 6, 0] as [number, number, number, number],
} as const;
