export const THEME_COLORS = {
  lightBackground: "oklch(1 0 0)",
  darkBackground: "oklch(0.105 0 0)",
} as const;

export const CHART_TOKENS = {
  animationDurationMs: 220,
  barRadius: [6, 6, 0, 0] as [number, number, number, number],
  moduleHeightClass: "h-56",
  compactMargin: { left: -24, right: 8, top: 8, bottom: 0 },
  tooltipPayloadLimit: 8,
} as const;

export const FEEDBACK_TOKENS = {
  undoToastDurationMs: 12_000,
} as const;
