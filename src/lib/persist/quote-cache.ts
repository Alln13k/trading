import type { Quote } from "@/lib/types";
import { readSqliteJson, writeSqliteJson } from "@/lib/persist/sqlite-storage";

const KEY = "trading-quote-cache-v1";

/** Last successful quotes. Reading them back always labels them cached. */
export async function saveQuoteCache(quotes: Quote[]): Promise<void> {
  if (typeof window === "undefined" || quotes.length === 0) return;
  const current = (await readSqliteJson<Record<string, Quote>>(KEY)) ?? {};
  for (const quote of quotes) {
    if (quote.symbol && quote.price > 0) current[quote.symbol] = { ...quote, quality: "cached" };
  }
  await writeSqliteJson(KEY, current);
}

export async function loadCachedQuotes(symbols: string[]): Promise<Quote[]> {
  if (typeof window === "undefined") return [];
  const current = (await readSqliteJson<Record<string, Quote>>(KEY)) ?? {};
  const out: Quote[] = [];
  for (const symbol of symbols) {
    const quote = current[symbol];
    if (!quote || !(quote.price > 0)) continue;
    out.push({ ...quote, quality: "cached" });
  }
  return out;
}
