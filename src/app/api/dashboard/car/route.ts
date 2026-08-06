import { NextResponse } from "next/server";
import { parseDashboardRange, parseSelectedCarSeries, parseSelectedLines } from "@/lib/domain/dashboard-query";
import { normalizeCarCode } from "@/lib/domain/reports";
import { getCachedCarDetail, normalizeDashboardCacheKey } from "@/lib/server/dashboard-cache";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const car = normalizeCarCode(params.get("coche") ?? "");
  if (!car) return NextResponse.json({ selection: null, reason: "invalid" }, { status: 400 });

  const key = normalizeDashboardCacheKey({
    range: parseDashboardRange(params.get("rango")),
    lines: parseSelectedLines(params.get("linea")),
    carSeries: parseSelectedCarSeries(params.get("serie")),
  });
  try {
    const selection = await getCachedCarDetail(key.rangeKey, key.linesKey, key.carSeriesKey, car);
    return NextResponse.json({ selection }, { status: selection ? 200 : 404 });
  } catch (error) {
    console.error("Failed to load car dashboard detail", error);
    return NextResponse.json({ selection: null, reason: "server_error" }, { status: 500 });
  }
}
