import { describe, expect, it } from "vitest";
import {
  getStationById,
  getStationsForLine,
  isStationOnLine,
  searchStations,
  stationIdFromName,
} from "./stations";

describe("Metro station catalogue", () => {
  it("contains the current L3 extension to El Casar and the renamed Atocha station", () => {
    expect(getStationsForLine("L3")[0]?.name).toBe("El Casar");
    expect(getStationsForLine("L1").some((station) => station.name === "Atocha")).toBe(true);
  });

  it("searches case- and accent-insensitively inside the selected line", () => {
    const results = searchStations("L5", "nunez");
    expect(results[0]?.name).toBe("Núñez de Balboa");
    expect(searchStations("L1", "nunez")).toEqual([]);
  });

  it("reuses station identity across interchange lines while keeping platforms line-specific", () => {
    const sol = stationIdFromName("Sol");
    expect(isStationOnLine(sol, "L1")).toBe(true);
    expect(isStationOnLine(sol, "L2")).toBe(true);
    expect(isStationOnLine(sol, "L3")).toBe(true);
    expect(isStationOnLine(sol, "L4")).toBe(false);
    expect(getStationById("L2", sol)?.line).toBe("L2");
  });
});
