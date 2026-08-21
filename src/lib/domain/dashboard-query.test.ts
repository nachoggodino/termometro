import { describe, expect, it } from "vitest";
import {
  DEFAULT_DASHBOARD_RANGE,
  parseDashboardRange,
  parseSelectedCarSeries,
  parseSelectedLines,
} from "./dashboard-query";

describe("dashboard query parsing", () => {
  it("normalizes and deduplicates supported filters", () => {
    expect(parseDashboardRange("month")).toBe("month");
    expect(parseSelectedLines("L5,L1,L5,invalid")).toEqual(["L5", "L1"]);
    expect(parseSelectedCarSeries("3000,1000,3000,3500,11000,12000,-1,nope")).toEqual([
      3000,
      11000,
    ]);
  });

  it("uses the shared default range for invalid public filters", () => {
    expect(DEFAULT_DASHBOARD_RANGE).toBe("month");
    expect(parseDashboardRange("last24Hours")).toBe(DEFAULT_DASHBOARD_RANGE);
  });

  it("accepts only the existing cacheable car-series range", () => {
    const series = Array.from({ length: 30 }, (_, index) => index * 1000).join(",");

    expect(parseSelectedCarSeries(series)).toEqual([
      2000,
      3000,
      4000,
      5000,
      6000,
      7000,
      8000,
      9000,
      10000,
      11000,
    ]);
  });
});
