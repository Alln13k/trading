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
  try {
    const quotes = await getQuotesFor(symbols);
    return NextResponse.json({ ok: true, quotes: [...quotes.values()] });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "quotes unavailable" },
      { status: 502 }
    );
  }
}