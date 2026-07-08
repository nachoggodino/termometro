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

export const SOCIAL_IMAGE_TOKENS = {
  width: 1200,
  height: 630,
  background: "#fbfaf7",
  surface: "#ffffff",
  ink: "#183027",
  muted: "#5e6a63",
  border: "#dcd8cf",
  primary: "#008b5f",
  metroRed: "#d6232a",
  metroBlue: "#2464b4",
  heatCalor: "#d99100",
  logoContainerPx: 84,
  logoMarkPx: 48,
  logoStemWidthPx: 12,
  logoGapPx: 20,
  headerTitlePx: 34,
  headerTextPx: 24,
  titlePx: 72,
  titleTrackingPx: -2.4,
  descriptionPx: 32,
  accentWidthPx: 92,
  accentHeightPx: 10,
  radiusPx: 16,
  markRadiusPx: 12,
  pillRadiusPx: 999,
  paddingPx: 64,
  sectionGapPx: 24,
  stackGapPx: 8,
  textMaxWidthPx: 940,
  logoBorderPx: 2,
  stemBorderPx: 4,
  markRotationDeg: -12,
  titleLineHeight: 1.02,
  descriptionLineHeight: 1.25,
} as const;
