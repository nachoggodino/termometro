import type { MetroLine } from "./lines";

export const MIN_EXISTING_CAR_SERIES = 2_000;
export const MAX_EXISTING_CAR_SERIES = 11_000;
export const L1_CAR_SERIES = 2_000;

const CAR_CODE_PATTERN = /^[mrs]-?\d{4,5}$/i;

export function normalizeCarCode(value: string) {
  const trimmed = value.trim().replace(/\s+/g, "");
  if (!trimmed) return null;
  const normalized = trimmed.toUpperCase().replace("-", "");
  if (!CAR_CODE_PATTERN.test(normalized)) return null;
  return normalized;
}

export function formatCarCode(value: string) {
  const normalized = normalizeCarCode(value);
  if (!normalized) return value;
  return `${normalized[0]}-${normalized.slice(1)}`;
}

export function getCarSeries(value: string) {
  const normalized = normalizeCarCode(value);
  if (!normalized) return null;
  const numericCode = Number.parseInt(normalized.slice(1), 10);
  return Math.floor(numericCode / 1_000) * 1_000;
}

export function isCarAllowedOnLine(value: string, line: MetroLine) {
  const series = getCarSeries(value);
  if (series === null || series < MIN_EXISTING_CAR_SERIES || series > MAX_EXISTING_CAR_SERIES) return false;
  return line !== "L1" || series === L1_CAR_SERIES;
}
