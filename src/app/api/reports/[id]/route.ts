import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { undoReport } from "@/lib/server/reports-repository";
import { readBoundedJson } from "@/lib/server/request-json";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await readBoundedJson(request);
  if (!body.ok) return NextResponse.json({ ok: false, reason: "invalid" }, { status: body.status });
  const payload = typeof body.value === "object" && body.value !== null ? body.value as Record<string, unknown> : {};
  const undoToken = typeof payload.undoToken === "string" ? payload.undoToken : "";
  const undone = await undoReport(id, undoToken).catch((error: unknown) => {
    console.error("Failed to undo report", error);
    return "server_error" as const;
  });

  if (undone === "server_error") {
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 500 });
  }

  if (!undone) {
    return NextResponse.json({ ok: false, reason: "expired_or_invalid" }, { status: 403 });
  }

  revalidateTag("reports", "max");
  return NextResponse.json({ ok: true });
}
