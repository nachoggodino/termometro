import { NextResponse } from "next/server";
import { getCarSuggestions } from "@/lib/server/reports-repository";
import { isMetroLine } from "@/lib/domain/lines";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedLine = url.searchParams.get("line");
  const line = isMetroLine(requestedLine) ? requestedLine : "L1";
  try {
    const suggestions = await getCarSuggestions(line);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Failed to load car suggestions", error);
    return NextResponse.json({ suggestions: [], error: "server_error" }, { status: 500 });
  }
}
