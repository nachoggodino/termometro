import { NextResponse } from "next/server";
import { createReport } from "@/lib/server/reports-repository";
import { parseReportInput } from "@/lib/domain/reports";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseReportInput(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const result = await createReport(parsed.data);
  if (!result.ok) {
    return NextResponse.json(result, { status: result.reason === "duplicate" ? 409 : 400 });
  }

  return NextResponse.json({
    ok: true,
    report: {
      ...result.report,
      createdAt: result.report.createdAt.toISOString(),
    },
  });
}
