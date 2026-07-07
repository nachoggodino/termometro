import { type MetroLine } from "./lines";

export type FleetEstimate = {
  trainsPeakHour: number;
  carsPeakHourApprox: number;
  source: string;
};

const FLEET_ESTIMATE_SOURCE = "peak-hour train/car estimate provided July 2026";

export const LINE_FLEET_ESTIMATES = {
  L1: { trainsPeakHour: 36, carsPeakHourApprox: 216, source: FLEET_ESTIMATE_SOURCE },
  L2: { trainsPeakHour: 19, carsPeakHourApprox: 76, source: FLEET_ESTIMATE_SOURCE },
  L3: { trainsPeakHour: 28, carsPeakHourApprox: 168, source: FLEET_ESTIMATE_SOURCE },
  L4: { trainsPeakHour: 26, carsPeakHourApprox: 104, source: FLEET_ESTIMATE_SOURCE },
  L5: { trainsPeakHour: 32, carsPeakHourApprox: 192, source: FLEET_ESTIMATE_SOURCE },
  L6: { trainsPeakHour: 34, carsPeakHourApprox: 204, source: FLEET_ESTIMATE_SOURCE },
  L7: { trainsPeakHour: 22, carsPeakHourApprox: 126, source: FLEET_ESTIMATE_SOURCE },
  L8: { trainsPeakHour: 12, carsPeakHourApprox: 48, source: FLEET_ESTIMATE_SOURCE },
  L9: { trainsPeakHour: 30, carsPeakHourApprox: 159, source: FLEET_ESTIMATE_SOURCE },
  L10: { trainsPeakHour: 48, carsPeakHourApprox: 260, source: FLEET_ESTIMATE_SOURCE },
  L11: { trainsPeakHour: 5, carsPeakHourApprox: 15, source: FLEET_ESTIMATE_SOURCE },
  L12: { trainsPeakHour: 20, carsPeakHourApprox: 60, source: FLEET_ESTIMATE_SOURCE },
} as const satisfies Record<MetroLine, FleetEstimate>;

export const ESTIMATED_TOTAL_CARS = Object.fromEntries(
  Object.entries(LINE_FLEET_ESTIMATES).map(([line, estimate]) => [line, estimate.carsPeakHourApprox]),
) as Record<MetroLine, number>;
