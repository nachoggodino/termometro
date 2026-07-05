import { NextResponse } from "next/server";
import { undoReport } from "@/lib/server/reports-repository";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const undoToken = typeof body?.undoToken === "string" ? body.undoToken : "";
  const undone = await undoReport(id, undoToken);

  if (!undone) {
    return NextResponse.json({ ok: false, reason: "expired_or_invalid" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
