import { NextResponse } from "next/server";
import { parseDashboardRange } from "@/lib/domain/dashboard-query";
import { isMetroLine } from "@/lib/domain/lines";
import { isLocale } from "@/lib/i18n/config";
import { getCachedPlatformDetail } from "@/lib/server/dashboard-cache";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const line = params.get("linea");
  const stationId = params.get("anden")?.trim() ?? "";
  const lang = params.get("lang") ?? "es";

  if (!line || !isMetroLine(line) || !stationId) {
    return NextResponse.json({ selection: null, reason: "invalid" }, { status: 400 });
  }
  if (!isLocale(lang)) {
    return NextResponse.json({ selection: null, reason: "invalid_locale" }, { status: 400 });
  }

  try {
    const selection = await getCachedPlatformDetail(
      parseDashboardRange(params.get("rango")),
      line,
      stationId,
      lang,
    );
    return NextResponse.json({ selection }, { status: selection ? 200 : 404 });
  } catch (error) {
    console.error("Failed to load platform dashboard detail", error);
    return NextResponse.json({ selection: null, reason: "server_error" }, { status: 500 });
  }
}
