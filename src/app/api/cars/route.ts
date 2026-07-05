import { NextResponse } from "next/server";
import { getCarSuggestions } from "@/lib/server/reports-repository";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const line = url.searchParams.get("line") ?? "L1";
  const suggestions = await getCarSuggestions(line);
  return NextResponse.json({ suggestions });
}
