import { NextRequest, NextResponse } from "next/server";
import { getQuotesFor } from "@/lib/server/yahoo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 120);
  if (symbols.length === 0) return NextResponse.json({ quotes: [] });
  const quotes = await getQuotesFor(symbols);
  return NextResponse.json({ quotes: [...quotes.values()] });
}