import { NextResponse } from "next/server";
import type { EconomicEvent, EventImportance } from "@/lib/types";
import { uid } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COUNTRY_FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  CNY: "🇨🇳",
  AUD: "🇦🇺",
  NZD: "🇳🇿",
  CAD: "🇨🇦",
  CHF: "🇨🇭",
};

interface FfItem {
  title: string;
  country: string;
  date: string;
  impact: number;
  forecast: string;
  previous: string;
  actual: string;
  unit: string;
}

async function fetchCalendar(): Promise<EconomicEvent[]> {
  const res = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`calendar HTTP ${res.status}`);
  const items = (await res.json()) as FfItem[];
  const out: EconomicEvent[] = [];
  for (const it of items) {
    if (!it.title || !it.date) continue;
    const [datePart, timePart] = it.date.split(" ");
    if (!datePart) continue;
    const time = timePart?.slice(0, 5) ?? "00:00";
    const importance: EventImportance = it.impact >= 3 ? "high" : it.impact === 2 ? "medium" : "low";
    const actual = it.actual !== undefined && it.actual !== "" ? it.actual : undefined;
    out.push({
      id: uid("ev"),
      date: datePart,
      time,
      country: it.country || "USD",
      flag: COUNTRY_FLAGS[it.country] ?? "🌐",
      event: it.title,
      importance,
      forecast: it.forecast || "—",
      previous: it.previous || "—",
      result: actual,
      unit: it.unit ?? "",
    });
  }
  if (out.length === 0) throw new Error("empty calendar");
  return out;
}

const cache = new Map<string, { value: EconomicEvent[]; expires: number }>();
const inflight = new Map<string, Promise<EconomicEvent[]>>();

export async function GET() {
  const hit = cache.get("cal");
  if (hit && hit.expires > Date.now()) return NextResponse.json({ ok: true, events: hit.value });
  const pending = inflight.get("cal");
  if (pending) {
    const events = await pending;
    return NextResponse.json({ ok: events.length > 0, events });
  }
  const p = fetchCalendar();
  inflight.set("cal", p);
  try {
    const events = await p;
    if (events.length > 0) cache.set("cal", { value: events, expires: Date.now() + 30 * 60_000 });
    return NextResponse.json({ ok: events.length > 0, events });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "calendar unavailable" },
      { status: 502 }
    );
  } finally {
    inflight.delete("cal");
  }
}