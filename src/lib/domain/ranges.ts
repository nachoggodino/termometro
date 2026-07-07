export const TIME_RANGES = ["today", "sevenDays", "month", "summer"] as const;

export type TimeRange = (typeof TIME_RANGES)[number];

export function isTimeRange(value: unknown): value is TimeRange {
  return typeof value === "string" && TIME_RANGES.includes(value as TimeRange);
}

export function getRangeStart(range: TimeRange, now = new Date()) {
  const start = new Date(now);
  if (range === "today") {
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (range === "sevenDays") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (range === "month") {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  const year = now.getMonth() < 4 || (now.getMonth() === 4 && now.getDate() < 15)
    ? now.getFullYear() - 1
    : now.getFullYear();
  return new Date(year, 4, 15, 0, 0, 0, 0);
}

export function getSummerEnd(now = new Date()) {
  const start = getRangeStart("summer", now);
  return new Date(start.getFullYear(), 9, 15, 23, 59, 59, 999);
}

export function getRangeEnd(range: TimeRange, now = new Date()) {
  if (range === "summer") {
    const summerEnd = getSummerEnd(now);
    return now < summerEnd ? now : summerEnd;
  }

  return now;
}

export function getRangeWindow(range: TimeRange, now = new Date()) {
  return {
    start: getRangeStart(range, now),
    end: getRangeEnd(range, now),
  };
}
