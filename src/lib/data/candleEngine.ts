import type { Candle, Quote, Timeframe } from "@/lib/types";
import { getSymbolMeta } from "@/lib/data/symbols";
import { hashString, mulberry32 } from "@/lib/utils";

export const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "4h": 14400,
  "1D": 86400,
  "1W": 604800,
  "1M": 2592000,
};

export const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W", "1M"];

function alignDown(ts: number, interval: number) {
  return Math.floor(ts / interval) * interval;
}

export function generateCandles(
  symbol: string,
  timeframe: Timeframe,
  count = 400
): Candle[] {
  const meta = getSymbolMeta(symbol);
  if (!meta) return [];
  const interval = TIMEFRAME_SECONDS[timeframe];
  const now = alignDown(Date.now() / 1000, interval);
  const rand = mulberry32(hashString(`${symbol}:${timeframe}:v2`));
  const tfMin = interval / 60;
  const perCandleVol = meta.volatility * Math.sqrt(tfMin / 5);
  const phase = rand() * Math.PI * 2;
  const driftBase = (rand() - 0.48) * 0.0006;

  let price = meta.basePrice * (0.86 + rand() * 0.28);
  const candles: Candle[] = [];
  const start = now - (count - 1) * interval;

  for (let i = 0; i < count; i++) {
    const t = start + i * interval;
    const dayIndex = t / 86400;
    const regime = Math.sin(dayIndex / 9 + phase) * 0.35 + Math.sin(dayIndex / 2.7 + phase * 2) * 0.2;
    const drift = driftBase + regime * perCandleVol * 0.55;
    const shock = rand() < 0.03 ? (rand() - 0.5) * perCandleVol * 3.4 : 0;
    const ret = (rand() - 0.5) * 2 * perCandleVol + drift + shock;
    const open = price;
    const close = price * Math.exp(ret);
    const wick = perCandleVol * (0.25 + rand() * 0.75);
    const high = Math.max(open, close) * (1 + wick * rand() * 0.9);
    const low = Math.min(open, close) * (1 - wick * rand() * 0.9);
    const volume = Math.round(
      meta.volume * (0.55 + rand() * 0.9) * (1 + Math.abs(ret) * 60) * (tfMin / 15)
    );
    candles.push({ time: t, open, high, low, close, volume });
    price = close;
  }
  return candles;
}

export function getSparkline(symbol: string, points = 28) {
  const candles = generateCandles(symbol, "15m", points + 2);
  return candles.slice(-points).map((c) => c.close);
}

const tickCache = new Map<string, { price: number; bucket: number; prevClose: number; dayHigh: number; dayLow: number; volume: number }>();

export function getLiveQuote(symbol: string): Quote {
  const meta = getSymbolMeta(symbol);
  if (!meta)
    return {
      symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
      previousClose: 0,
      timestamp: Date.now(),
    };
  const candles = generateCandles(symbol, "15m", 4);
  const last = candles[candles.length - 1];
  const prevClose = candles[candles.length - 2]?.close ?? last.open;
  const dayStart = candles[candles.length - 3]?.close ?? prevClose;
  const bucket = Math.floor(Date.now() / 3000);
  const cached = tickCache.get(symbol);
  if (cached && cached.bucket === bucket) {
    return {
      symbol,
      price: cached.price,
      change: cached.price - prevClose,
      changePercent: ((cached.price - prevClose) / prevClose) * 100,
      dayHigh: cached.dayHigh,
      dayLow: cached.dayLow,
      volume: cached.volume,
      previousClose: prevClose,
      timestamp: Date.now(),
    };
  }
  const rand = mulberry32(hashString(`${symbol}:tick:${bucket}`));
  const jitter = meta.volatility * 0.35;
  let price = last.close * (1 + (rand() - 0.5) * jitter);
  price = roundTo(price, meta.decimals);
  const dayHigh = Math.max(candles.map((c) => c.high).reduce((a, b) => Math.max(a, b), last.close), price, dayStart);
  const dayLow = Math.min(candles.map((c) => c.low).reduce((a, b) => Math.min(a, b), last.close), price, dayStart);
  tickCache.set(symbol, {
    price,
    bucket,
    prevClose,
    dayHigh,
    dayLow,
    volume: Math.round(candles.reduce((a, c) => a + c.volume, 0)),
  });
  return {
    symbol,
    price,
    change: price - prevClose,
    changePercent: ((price - prevClose) / prevClose) * 100,
    dayHigh,
    dayLow,
    volume: Math.round(candles.reduce((a, c) => a + c.volume, 0)),
    previousClose: prevClose,
    timestamp: Date.now(),
  };
}

function roundTo(value: number, decimals: number) {
  const f = Math.pow(10, decimals);
  return Math.round(value * f) / f;
}

export function candleSeriesForChart(candles: Candle[]) {
  return candles.map((c) => ({
    time: c.time as unknown as import("lightweight-charts").UTCTimestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));
}