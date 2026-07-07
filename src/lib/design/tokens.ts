export const THEME_COLORS = {
  lightBackground: "oklch(1 0 0)",
  darkBackground: "oklch(0.105 0 0)",
} as const;

export const CHART_TOKENS = {
  animationDurationMs: 220,
  heatScoreDomain: [0, 100] as [number, number],
  moduleHeightClass: "h-56",
  compactMargin: { left: -24, right: 8, top: 8, bottom: 0 },
} as const;
