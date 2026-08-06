import { NextResponse } from "next/server";
import { parseDashboardRange, parseSelectedCarSeries } from "@/lib/domain/dashboard-query";
import { isMetroLine } from "@/lib/domain/lines";
import { getCachedLineDetail } from "@/lib/server/dashboard-cache";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const line = params.get("linea");
  if (!isMetroLine(line)) return NextResponse.json({ summary: null, reason: "invalid" }, { status: 400 });

  try {
    const range = parseDashboardRange(params.get("rango"));
    const series = parseSelectedCarSeries(params.get("serie")).toSorted((a, b) => a - b).join(",");
    const summary = await getCachedLineDetail(range, line, series);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Failed to load line dashboard detail", error);
    return NextResponse.json({ summary: null, reason: "server_error" }, { status: 500 });
  }
}
