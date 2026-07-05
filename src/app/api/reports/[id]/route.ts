import { NextResponse } from "next/server";
import { undoReport } from "@/lib/server/reports-repository";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await undoReport(id);
  return NextResponse.json({ ok: true });
}
