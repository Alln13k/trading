import { NextRequest, NextResponse } from "next/server";
import { getCandlesFor } from "@/lib/server/yahoo";
import { TIMEFRAMES } from "@/lib/data/candleEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "").trim().toUpperCase();
  const tf = req.nextUrl.searchParams.get("timeframe") ?? "1D";
  const count = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("count") ?? "400", 10) || 400, 10), 2000);
  if (!symbol || !TIMEFRAMES.includes(tf as (typeof TIMEFRAMES)[number])) {
    return NextResponse.json({ error: "invalid params" }, { status: 400 });
  }
  const candles = await getCandlesFor(symbol, tf as (typeof TIMEFRAMES)[number], count);
  return NextResponse.json({ symbol, timeframe: tf, candles });
}