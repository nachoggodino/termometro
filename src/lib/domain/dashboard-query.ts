import { isMetroLine, type MetroLine } from "./lines";
import { isTimeRange, type TimeRange } from "./ranges";

const MAX_CAR_SERIES = 99_000;
const MAX_SELECTED_CAR_SERIES = 20;

export function parseDashboardRange(value: string | null | undefined, fallback: TimeRange = "month") {
  return isTimeRange(value) ? value : fallback;
}

export function parseSelectedLines(value: string | null | undefined) {
  if (!value) return [];
  return [...new Set(value.split(",").filter(isMetroLine))] as MetroLine[];
}

export function parseSelectedCarSeries(value: string | null | undefined) {
  if (!value) return [];
  return [...new Set(value.split(",").map(Number).filter(isCarSeries))].slice(0, MAX_SELECTED_CAR_SERIES);
}

function isCarSeries(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= MAX_CAR_SERIES && value % 1000 === 0;
}
