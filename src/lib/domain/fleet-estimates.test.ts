import { describe, expect, it } from "vitest";
import { ESTIMATED_TOTAL_CARS, LINE_FLEET_ESTIMATES } from "./fleet-estimates";
import { METRO_LINES } from "./lines";

describe("fleet estimates", () => {
  it("keeps one editable estimate for every Metro line", () => {
    expect(Object.keys(LINE_FLEET_ESTIMATES).sort()).toEqual([...METRO_LINES].sort());
  });

  it("derives dashboard coverage counts from the editable estimates", () => {
    expect(ESTIMATED_TOTAL_CARS).toMatchObject({
      L1: 216,
      L5: 192,
      L10: 260,
      L11: 15,
    });
    expect(LINE_FLEET_ESTIMATES.L10.carsPeakHourApprox).toBe(260);
  });
});
