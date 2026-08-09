import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createReportForRequest } from "@/lib/server/reports-repository";
import { readBoundedJson } from "@/lib/server/request-json";
import { parseReportInput, RETIRED_CAR_SERIES_REASON } from "@/lib/domain/reports";

export async function POST(request: Request) {
  const body = await readBoundedJson(request);
  if (!body.ok) return NextResponse.json({ ok: false, reason: "invalid" }, { status: body.status });
  const parsed = parseReportInput(body.value);
  if (!parsed.success) {
    const reason = parsed.error.issues.some((issue) => issue.message === RETIRED_CAR_SERIES_REASON)
      ? RETIRED_CAR_SERIES_REASON
      : "invalid";
    return NextResponse.json({ ok: false, reason }, { status: 400 });
  }

  const result = await createReportForRequest(parsed.data, request).catch((error: unknown) => {
    console.error("Failed to create report", error);
    return { ok: false as const, reason: "server_error" as const };
  });
  if (!result.ok) {
    const status = result.reason === "duplicate" ? 409 : result.reason === "rate_limited" ? 429 : result.reason === "server_error" ? 500 : 400;
    return NextResponse.json(result, { status });
  }

  revalidateTag("reports", "max");

  return NextResponse.json({
    ok: true,
    undoToken: result.undoToken,
    report: {
      ...result.report,
      createdAt: result.report.createdAt.toISOString(),
    },
  });
}
