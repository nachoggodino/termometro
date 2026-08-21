import { describe, expect, it } from "vitest";
import { parseDashboardRange, parseSelectedCarSeries, parseSelectedLines } from "./dashboard-query";

describe("dashboard query parsing", () => {
  it("normalizes and deduplicates supported filters", () => {
    expect(parseDashboardRange("month")).toBe("month");
    expect(parseSelectedLines("L5,L1,L5,invalid")).toEqual(["L5", "L1"]);
    expect(parseSelectedCarSeries("3000,1000,3000,3500,100000,-1,nope")).toEqual([3000, 1000]);
  });

  it("uses the month range for invalid public filters", () => {
    expect(parseDashboardRange("last24Hours")).toBe("month");
  });

  it("bounds the number of cacheable car-series filters", () => {
    const series = Array.from({ length: 30 }, (_, index) => index * 1000).join(",");

    expect(parseSelectedCarSeries(series)).toHaveLength(20);
  });
});
