import { NextResponse } from "next/server";
import { createReportForRequest } from "@/lib/server/reports-repository";
import { parseReportInput } from "@/lib/domain/reports";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseReportInput(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const result = await createReportForRequest(parsed.data, request).catch((error: unknown) => {
    console.error("Failed to create report", error);
    return { ok: false as const, reason: "server_error" as const };
  });
  if (!result.ok) {
    const status = result.reason === "duplicate" ? 409 : result.reason === "rate_limited" ? 429 : result.reason === "server_error" ? 500 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json({
    ok: true,
    undoToken: result.undoToken,
    report: {
      ...result.report,
      createdAt: result.report.createdAt.toISOString(),
    },
  });
}
