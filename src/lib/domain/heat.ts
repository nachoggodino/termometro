export const HEAT_STATES = ["fresco", "calor", "infierno"] as const;

export type HeatState = (typeof HEAT_STATES)[number];

export const HEAT_SCORE: Record<HeatState, number> = {
  fresco: 0,
  calor: 60,
  infierno: 100,
};

export function isHeatState(value: unknown): value is HeatState {
  return typeof value === "string" && HEAT_STATES.includes(value as HeatState);
}

export function getHeatTone(score: number): HeatState {
  if (score >= 76) return "infierno";
  if (score >= 30) return "calor";
  return "fresco";
}

export function getWeightedHeatScore(
  reports: Array<{ state: HeatState; createdAt: Date }>,
  now = new Date(),
) {
  if (reports.length === 0) return 0;

  let weightedTotal = 0;
  let totalWeight = 0;

  for (const report of reports) {
    const ageHours = Math.max(0, now.getTime() - report.createdAt.getTime()) / 3_600_000;
    const recencyWeight = 1 / (1 + ageHours / 12);
    weightedTotal += HEAT_SCORE[report.state] * recencyWeight;
    totalWeight += recencyWeight;
  }

  return Math.round(weightedTotal / totalWeight);
}

export function getAgreement(reports: Array<{ state: HeatState }>) {
  if (reports.length === 0) return 0;
  const counts = new Map<HeatState, number>();
  for (const report of reports) {
    counts.set(report.state, (counts.get(report.state) ?? 0) + 1);
  }
  return Math.max(...counts.values()) / reports.length;
}

export type Confidence = "low" | "medium" | "high";

export function getConfidence(reports: Array<{ state: HeatState; createdAt: Date }>): Confidence {
  if (reports.length < 3) return "low";
  const agreement = getAgreement(reports);
  if (reports.length >= 10 && agreement >= 0.7) return "high";
  if (reports.length >= 5 && agreement >= 0.55) return "medium";
  return "low";
}
