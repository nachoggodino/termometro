import { describe, expect, it } from "vitest";
import {
  formatCarCode,
  getCarSeries,
  isCarAllowedOnLine,
  MAX_EXISTING_CAR_SERIES,
  MIN_EXISTING_CAR_SERIES,
  normalizeCarCode,
} from "./cars";

describe("car identifiers", () => {
  it("normalizes and formats supported identifiers", () => {
    expect(normalizeCarCode("m1234")).toBe("M1234");
    expect(normalizeCarCode(" R-2401 ")).toBe("R2401");
    expect(normalizeCarCode("s12345")).toBe("S12345");
    expect(normalizeCarCode("z12345")).toBeNull();
    expect(normalizeCarCode("nonsense")).toBeNull();
    expect(formatCarCode("s12345")).toBe("S-12345");
  });

  it("groups car numbers into thousand series", () => {
    expect(getCarSeries("M1999")).toBe(1_000);
    expect(getCarSeries("M2000")).toBe(MIN_EXISTING_CAR_SERIES);
    expect(getCarSeries("M11999")).toBe(MAX_EXISTING_CAR_SERIES);
    expect(getCarSeries("invalid")).toBeNull();
  });

  it("allows only series 2000 on L1", () => {
    expect(isCarAllowedOnLine("M2000", "L1")).toBe(true);
    expect(isCarAllowedOnLine("M2999", "L1")).toBe(true);
    expect(isCarAllowedOnLine("M3000", "L1")).toBe(false);
  });

  it("allows series 2000 through 11000 on other lines", () => {
    expect(isCarAllowedOnLine("M1999", "L2")).toBe(false);
    expect(isCarAllowedOnLine("M2000", "L2")).toBe(true);
    expect(isCarAllowedOnLine("M11999", "L12")).toBe(true);
    expect(isCarAllowedOnLine("M12000", "L12")).toBe(false);
  });
});
