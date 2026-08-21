import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { METRO_LINES, type MetroLine } from "./lines";
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

  it("matches the SQL station catalogue entry for entry", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260820052100_seed_platform_stations.sql"),
      "utf8",
    );
    const sqlStations = Array.from(
      sql.matchAll(/\('(L(?:1[0-2]|[1-9]))', '([^']+)', '((?:''|[^'])*)', (\d+)\)/g),
    ).map((match) => ({
      line: match[1] as MetroLine,
      id: match[2],
      name: match[3].replaceAll("''", "'"),
      sortOrder: Number(match[4]),
    }));
    const appStations = METRO_LINES.flatMap((line) =>
      getStationsForLine(line).map((station) => ({
        line,
        id: station.id,
        name: station.name,
        sortOrder: station.sortOrder,
      })),
    );

    expect(sqlStations).toEqual(appStations);
  });
});
