import { fromMadridTime, getMadridDateParts, getMadridStartOfDay } from "./time";

export const TIME_RANGES = ["today", "sevenDays", "month", "summer"] as const;

export type TimeRange = (typeof TIME_RANGES)[number];
export type DashboardRange = TimeRange | "last24Hours";

export function isTimeRange(value: unknown): value is TimeRange {
  return typeof value === "string" && TIME_RANGES.includes(value as TimeRange);
}

export function getRangeStart(range: DashboardRange, now = new Date()) {
  if (range === "last24Hours") {
    return new Date(now.getTime() - 24 * 3_600_000);
  }
  if (range === "today") {
    return getMadridStartOfDay(now);
  }
  if (range === "sevenDays") {
    return getMadridStartOfDay(now, -6);
  }
  if (range === "month") {
    return getMadridStartOfDay(now, -29);
  }

  const { year: madridYear, month, day } = getMadridDateParts(now);
  const year = month < 5 || (month === 5 && day < 15) ? madridYear - 1 : madridYear;
  return fromMadridTime(year, 4, 15);
}

export function getSummerEnd(now = new Date()) {
  const start = getRangeStart("summer", now);
  const { year } = getMadridDateParts(start);
  return new Date(fromMadridTime(year, 9, 16).getTime() - 1);
}

export function getRangeEnd(range: DashboardRange, now = new Date()) {
  if (range === "summer") {
    const summerEnd = getSummerEnd(now);
    return now < summerEnd ? now : summerEnd;
  }

  return now;
}

export function getRangeWindow(range: DashboardRange, now = new Date()) {
  return {
    start: getRangeStart(range, now),
    end: getRangeEnd(range, now),
  };
}
