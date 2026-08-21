import { NextResponse } from "next/server";
import { parseDashboardRange, parseSelectedLines } from "@/lib/domain/dashboard-query";
import { isLocale } from "@/lib/i18n/config";
import { getCachedPlatformDetail } from "@/lib/server/dashboard-cache";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lines = parseSelectedLines(params.get("linea"));
  const stationId = params.get("anden")?.trim() ?? "";
  const lang = params.get("lang") ?? "es";

  if (lines.length === 0 || !stationId) {
    return NextResponse.json({ selection: null, reason: "invalid" }, { status: 400 });
  }
  if (!isLocale(lang)) {
    return NextResponse.json({ selection: null, reason: "invalid_locale" }, { status: 400 });
  }

  try {
    const selection = await getCachedPlatformDetail(
      parseDashboardRange(params.get("rango")),
      lines.join(","),
      stationId,
      lang,
    );
    return NextResponse.json({ selection }, { status: selection ? 200 : 404 });
  } catch (error) {
    console.error("Failed to load platform dashboard detail", error);
    return NextResponse.json({ selection: null, reason: "server_error" }, { status: 500 });
  }
}
