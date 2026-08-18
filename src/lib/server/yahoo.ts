import type { Candle, Quote, Timeframe } from "@/lib/types";
import { getSymbolMeta } from "@/lib/data/symbols";
import { toYahooSymbol, TF_PARAMS } from "@/lib/data/yahooMap";

/**
 * Server-side Yahoo Finance access: in-memory cache + single-flight per key.
 * Throws when the upstream API is unreachable — no simulated fallback.
 */

const HOUR = 3600_000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

interface CacheEntry<T> {
  value: T;
  expires: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value as T);
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;
  const p = fn()
    .then((value) => {
      cache.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
  return res.json();
}

interface YahooChartResult {
  meta: {
    regularMarketPrice?: number;
    regularMarketTime?: number;
    regularMarketDayHigh?: number;
    regularMarketDayLow?: number;
    regularMarketVolume?: number;
    chartPreviousClose?: number;
    previousClose?: number;
    currency?: string;
  };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
      close?: (number | null)[];
      volume?: (number | null)[];
    }>;
  };
}

async function fetchChartRaw(yahoo: string, range: string, interval: string): Promise<YahooChartResult | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahoo
  )}?range=${range}&interval=${interval}&includePrePost=false&events=div%2Csplit`;
  const json = (await fetchJson(url)) as { chart?: { result?: YahooChartResult[]; error?: unknown } };
  return json.chart?.result?.[0] ?? null;
}

function chartToCandles(chart: YahooChartResult): Candle[] {
  const ts = chart.timestamp ?? [];
  const q = chart.indicators?.quote?.[0];
  if (!q || ts.length === 0) return [];
  const open = q.open ?? [];
  const high = q.high ?? [];
  const low = q.low ?? [];
  const close = q.close ?? [];
  const volume = q.volume ?? [];
  const candles: Candle[] = [];
  let prevClose = chart.meta.chartPreviousClose ?? chart.meta.previousClose;
  for (let i = 0; i < ts.length; i++) {
    const c = close[i];
    if (c === null || c === undefined) continue;
    const o = open[i] ?? prevClose ?? c;
    candles.push({
      time: ts[i],
      open: o,
      high: high[i] ?? Math.max(o, c),
      low: low[i] ?? Math.min(o, c),
      close: c,
      volume: volume[i] ?? 0,
    });
    prevClose = c;
  }
  return candles;
}

function aggregate(candles: Candle[], bucketSec: number): Candle[] {
  if (bucketSec <= 0) return candles;
  const out: Candle[] = [];
  for (const c of candles) {
    const bucket = Math.floor(c.time / bucketSec) * bucketSec;
    const last = out[out.length - 1];
    if (last && last.time === bucket) {
      last.high = Math.max(last.high, c.high);
      last.low = Math.min(last.low, c.low);
      last.close = c.close;
      last.volume += c.volume;
    } else {
      out.push({ ...c, time: bucket });
    }
  }
  return out;
}

export function getCandlesFor(symbol: string, timeframe: Timeframe, count: number): Promise<Candle[]> {
  const yahoo = toYahooSymbol(symbol);
  const params = TF_PARAMS[timeframe];
  const key = `c:${symbol}:${timeframe}`;
  if (!yahoo || !params) {
    return Promise.reject(new Error(`unsupported symbol for live candles: ${symbol}`));
  }
  const ttl = timeframe === "1m" || timeframe === "5m" ? 30_000 : 60_000;
  return cached(key, ttl, async () => {
    const chart = await fetchChartRaw(yahoo, params.range, params.interval);
    if (!chart) throw new Error("no chart result");
    let candles = chartToCandles(chart);
    if (timeframe === "4h") candles = aggregate(candles, 4 * 3600);
    if (candles.length === 0) throw new Error("empty candles");
    return candles.slice(-Math.max(count, 10));
  });
}

export function getQuoteFor(symbol: string): Promise<Quote> {
  const yahoo = toYahooSymbol(symbol);
  const key = `q:${symbol}`;
  if (!yahoo) {
    return Promise.reject(new Error(`unsupported symbol for live quote: ${symbol}`));
  }
  const ttl = 8_000;
  return cached(key, ttl, async () => {
    const chart = await fetchChartRaw(yahoo, "1d", "5m");
    if (!chart) throw new Error("no chart result");
    const meta = chart.meta;
    const price = meta.regularMarketPrice;
    if (price === undefined || price === null) throw new Error("no price");
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const candles = chartToCandles(chart);
    const last = candles[candles.length - 1];
    return {
      symbol,
      price,
      change: price - prev,
      changePercent: prev > 0 ? ((price - prev) / prev) * 100 : 0,
      dayHigh: meta.regularMarketDayHigh ?? last?.high ?? price,
      dayLow: meta.regularMarketDayLow ?? last?.low ?? price,
      volume: meta.regularMarketVolume ?? last?.volume ?? 0,
      previousClose: prev,
      timestamp: (meta.regularMarketTime ?? Date.now() / 1000) * 1000,
    };
  });
}

export function getQuotesFor(symbols: string[]): Promise<Map<string, Quote>> {
  const unique = [...new Set(symbols)];
  const batch = unique.length > 15;
  if (!batch) {
    return Promise.all(unique.map((s) => getQuoteFor(s))).then((qs) => {
      const map = new Map<string, Quote>();
      for (const q of qs) map.set(q.symbol, q);
      return map;
    });
  }
  // Large batches: fetch through the shared cache but stagger long-list refreshes.
  const key = `qb:${unique.slice().sort().join(",")}`;
  return cached(key, 60_000, async () => {
    const entries = await Promise.all(unique.map(async (s) => [s, await getQuoteFor(s)] as const));
    const map = new Map<string, Quote>();
    for (const [s, q] of entries) map.set(s, q);
    return map;
  });
}

export function ttlMsForQuoteBatch(symbols: string[]): number {
  return symbols.length > 15 ? 60_000 : 8_000;
}

export function marketMetaFor(symbol: string) {
  return getSymbolMeta(symbol);
}

export { HOUR };

export const YahooError = Error;