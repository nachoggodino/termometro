export const HEAT_STATES = ["fresco", "calor", "infierno"] as const;

export type HeatState = (typeof HEAT_STATES)[number];

export const HEAT_SCORE: Record<HeatState, number> = {
  fresco: 0,
  calor: 60,
  infierno: 100,
};

export const HEAT_INDEX_PARAMETERS = {
  reportHalfLifeDays: 3,
  reportsFor50Score: 12,
  fleetPercentFor50Score: 15,
  reportScoreWeight: 0.65,
  fleetScoreWeight: 0.35,
} as const;

export type HeatIndexReport = {
  heat?: number;
  state?: HeatState;
  timestamp?: Date;
  createdAt?: Date;
  carId?: string | null;
  car?: string | null;
};

export type HeatIndexDiagnostics = {
  heat_index: number;
  weighted_heat: number;
  effective_reports: number;
  report_score: number;
  weighted_fleet_percentage: number;
  fleet_score: number;
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

export class MetroHeatIndexCalculator {
  constructor(private readonly parameters = HEAT_INDEX_PARAMETERS) {}

  calculate(reports: HeatIndexReport[], totalActiveCars: number, asOf = new Date()): HeatIndexDiagnostics {
    if (reports.length === 0 || totalActiveCars <= 0) return emptyHeatIndexDiagnostics();

    let effectiveReports = 0;
    let weightedHeatTotal = 0;
    const carWeights = new Map<string, number>();

    for (const report of reports) {
      const heat = getReportHeatValue(report);
      const timestamp = report.timestamp ?? report.createdAt;
      if (heat === null || !timestamp) continue;

      const weight = getExponentialDecayWeight(timestamp, asOf, this.parameters.reportHalfLifeDays);
      effectiveReports += weight;
      weightedHeatTotal += weight * heat;

      const carId = report.carId ?? report.car;
      if (carId) {
        carWeights.set(carId, Math.max(carWeights.get(carId) ?? 0, weight));
      }
    }

    if (effectiveReports === 0) return emptyHeatIndexDiagnostics();

    const weightedHeat = weightedHeatTotal / effectiveReports;
    const reportScore = getSaturatedScore(effectiveReports, this.parameters.reportsFor50Score);
    const weightedFleetPercentage = 100 * sumValues(carWeights) / totalActiveCars;
    const fleetScore = getSaturatedScore(weightedFleetPercentage, this.parameters.fleetPercentFor50Score);
    const heatIndex = (weightedHeat / 100) * (
      this.parameters.reportScoreWeight * reportScore +
      this.parameters.fleetScoreWeight * fleetScore
    );

    return {
      heat_index: roundToTwo(clamp(heatIndex, 0, 100)),
      weighted_heat: roundToTwo(clamp(weightedHeat, 0, 100)),
      effective_reports: roundToTwo(effectiveReports),
      report_score: roundToTwo(clamp(reportScore, 0, 100)),
      weighted_fleet_percentage: roundToTwo(clamp(weightedFleetPercentage, 0, 100)),
      fleet_score: roundToTwo(clamp(fleetScore, 0, 100)),
    };
  }
}

export const metroHeatIndexCalculator = new MetroHeatIndexCalculator();

export function calculateMetroHeatIndex(reports: HeatIndexReport[], totalActiveCars: number, asOf = new Date()) {
  return metroHeatIndexCalculator.calculate(reports, totalActiveCars, asOf);
}

export function getExponentialDecayWeight(timestamp: Date, asOf = new Date(), halfLifeDays = HEAT_INDEX_PARAMETERS.reportHalfLifeDays) {
  const ageDays = Math.max(0, asOf.getTime() - timestamp.getTime()) / 86_400_000;
  return 2 ** (-ageDays / halfLifeDays);
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

function getReportHeatValue(report: HeatIndexReport) {
  if (typeof report.heat === "number" && Number.isFinite(report.heat)) {
    return clamp(report.heat, 0, 100);
  }
  if (report.state) return HEAT_SCORE[report.state];
  return null;
}

function getSaturatedScore(value: number, valueFor50Score: number) {
  if (value <= 0 || valueFor50Score <= 0) return 0;
  return 100 * (1 - 2 ** (-value / valueFor50Score));
}

function emptyHeatIndexDiagnostics(): HeatIndexDiagnostics {
  return {
    heat_index: 0,
    weighted_heat: 0,
    effective_reports: 0,
    report_score: 0,
    weighted_fleet_percentage: 0,
    fleet_score: 0,
  };
}

function sumValues(values: Map<string, number>) {
  let total = 0;
  for (const value of values.values()) total += value;
  return total;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}
