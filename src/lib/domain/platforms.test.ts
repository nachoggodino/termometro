import { describe, expect, it } from "vitest";
import {
  getPlatformHeatReports,
  hasPlatformWithoutAcSignal,
  PLATFORM_WITHOUT_AC_NET_HEAT_THRESHOLD,
} from "./platforms";

describe("platform heat signal", () => {
  it("counts calor and infierno as heat reports", () => {
    expect(getPlatformHeatReports({ calorReports: 3, infiernoReports: 2 })).toBe(5);
  });

  it("requires the configured net heat threshold", () => {
    expect(PLATFORM_WITHOUT_AC_NET_HEAT_THRESHOLD).toBe(5);
    expect(hasPlatformWithoutAcSignal({ frescoReports: 1, calorReports: 4, infiernoReports: 2 })).toBe(false);
    expect(hasPlatformWithoutAcSignal({ frescoReports: 1, calorReports: 5, infiernoReports: 2 })).toBe(true);
  });
});
