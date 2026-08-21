import {
  MAX_EXISTING_CAR_SERIES,
  MIN_EXISTING_CAR_SERIES,
} from "./cars";
import { isMetroLine, type MetroLine } from "./lines";
import { isTimeRange, type TimeRange } from "./ranges";

export const DEFAULT_DASHBOARD_RANGE: TimeRange = "month";
const MAX_SELECTED_CAR_SERIES = 20;

export function parseDashboardRange(
  value: string | null | undefined,
  fallback: TimeRange = DEFAULT_DASHBOARD_RANGE,
) {
  return isTimeRange(value) ? value : fallback;
}

export function parseSelectedLines(value: string | null | undefined) {
  if (!value) return [];
  return [...new Set(value.split(",").filter(isMetroLine))] as MetroLine[];
}

export function parseSelectedCarSeries(value: string | null | undefined) {
  if (!value) return [];
  return [...new Set(value.split(",").map(Number).filter(isCarSeries))].slice(
    0,
    MAX_SELECTED_CAR_SERIES,
  );
}

function isCarSeries(value: number) {
  return (
    Number.isInteger(value) &&
    value >= MIN_EXISTING_CAR_SERIES &&
    value <= MAX_EXISTING_CAR_SERIES &&
    value % 1000 === 0
  );
}
