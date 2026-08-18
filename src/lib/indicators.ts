import type { Candle } from "@/lib/types";

export interface SeriesPoint {
  time: number;
  value: number;
}

export function sma(candles: Candle[], period: number): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) out.push({ time: candles[i].time, value: sum / period });
  }
  return out;
}

export function ema(candles: Candle[], period: number): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  const k = 2 / (period + 1);
  let prev: number | undefined;
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i].close;
    prev = prev === undefined ? c : c * k + prev * (1 - k);
    if (i >= period - 1) out.push({ time: candles[i].time, value: prev });
  }
  return out;
}

export function rsi(candles: Candle[], period = 14): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = Math.max(diff, 0);
    const loss = Math.max(-diff, 0);
    if (i <= period) {
      avgGain += gain / period;
      avgLoss += loss / period;
      if (i === period) {
        out.push({
          time: candles[i].time,
          value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss),
        });
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      out.push({
        time: candles[i].time,
        value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss),
      });
    }
  }
  return out;
}

export interface MacdResult {
  macd: SeriesPoint[];
  signal: SeriesPoint[];
  histogram: SeriesPoint[];
}

export function macd(candles: Candle[], fast = 12, slow = 26, signalPeriod = 9): MacdResult {
  const fastEma = ema(candles, fast);
  const slowEma = ema(candles, slow);
  const mapSlow = new Map(slowEma.map((p) => [p.time, p.value]));
  const macdLine: SeriesPoint[] = [];
  for (const p of fastEma) {
    const s = mapSlow.get(p.time);
    if (s !== undefined) macdLine.push({ time: p.time, value: p.value - s });
  }
  const signal = emaPoints(macdLine, signalPeriod);
  const signalMap = new Map(signal.map((p) => [p.time, p.value]));
  const histogram = macdLine
    .filter((p) => signalMap.has(p.time))
    .map((p) => ({ time: p.time, value: p.value - signalMap.get(p.time)! }));
  return { macd: macdLine, signal, histogram };
}

function emaPoints(points: SeriesPoint[], period: number): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  const k = 2 / (period + 1);
  let prev: number | undefined;
  for (let i = 0; i < points.length; i++) {
    prev = prev === undefined ? points[i].value : points[i].value * k + prev * (1 - k);
    if (i >= period - 1) out.push({ time: points[i].time, value: prev });
  }
  return out;
}

export interface BollingerResult {
  upper: SeriesPoint[];
  middle: SeriesPoint[];
  lower: SeriesPoint[];
}

export function bollinger(candles: Candle[], period = 20, mult = 2): BollingerResult {
  const upper: SeriesPoint[] = [];
  const middle: SeriesPoint[] = [];
  const lower: SeriesPoint[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, c) => a + c.close, 0) / period;
    const variance = slice.reduce((a, c) => a + (c.close - mean) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    const t = candles[i].time;
    middle.push({ time: t, value: mean });
    upper.push({ time: t, value: mean + mult * std });
    lower.push({ time: t, value: mean - mult * std });
  }
  return { upper, middle, lower };
}

export function vwap(candles: Candle[]): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  let cumPV = 0;
  let cumV = 0;
  for (const c of candles) {
    const tp = (c.high + c.low + c.close) / 3;
    cumPV += tp * c.volume;
    cumV += c.volume;
    out.push({ time: c.time, value: cumV > 0 ? cumPV / cumV : tp });
  }
  return out;
}

export interface StochasticResult {
  k: SeriesPoint[];
  d: SeriesPoint[];
}

export function stochastic(candles: Candle[], period = 14, smooth = 3): StochasticResult {
  const kRaw: SeriesPoint[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const high = Math.max(...slice.map((c) => c.high));
    const low = Math.min(...slice.map((c) => c.low));
    const close = candles[i].close;
    kRaw.push({
      time: candles[i].time,
      value: high === low ? 50 : ((close - low) / (high - low)) * 100,
    });
  }
  const d = emaPoints(kRaw, smooth);
  return { k: kRaw, d };
}

export function atr(candles: Candle[], period = 14): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  const trs: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trs.push(candles[i].high - candles[i].low);
    } else {
      const prevClose = candles[i - 1].close;
      trs.push(
        Math.max(
          candles[i].high - candles[i].low,
          Math.abs(candles[i].high - prevClose),
          Math.abs(candles[i].low - prevClose)
        )
      );
    }
  }
  let prevAtr: number | undefined;
  for (let i = 0; i < trs.length; i++) {
    if (i === period - 1) {
      prevAtr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
      out.push({ time: candles[i].time, value: prevAtr });
    } else if (i > period - 1) {
      prevAtr = (prevAtr! * (period - 1) + trs[i]) / period;
      out.push({ time: candles[i].time, value: prevAtr });
    }
  }
  return out;
}

export function findSupportResistance(candles: Candle[]) {
  const recent = candles.slice(-120);
  const pivots: number[] = [];
  for (let i = 2; i < recent.length - 2; i++) {
    const c = recent[i];
    if (
      c.high >= recent[i - 1].high &&
      c.high >= recent[i - 2].high &&
      c.high >= recent[i + 1].high &&
      c.high >= recent[i + 2].high
    )
      pivots.push(c.high);
    if (
      c.low <= recent[i - 1].low &&
      c.low <= recent[i - 2].low &&
      c.low <= recent[i + 1].low &&
      c.low <= recent[i + 2].low
    )
      pivots.push(c.low);
  }
  pivots.sort((a, b) => a - b);
  const levels = new Set<number>();
  let last = -Infinity;
  for (const p of pivots) {
    if (p - last > recent[recent.length - 1].close * 0.005) {
      levels.add(p);
      last = p;
    }
  }
  const close = recent[recent.length - 1].close;
  const support = [...levels].filter((l) => l < close).sort((a, b) => b - a).slice(0, 3);
  const resistance = [...levels].filter((l) => l > close).sort((a, b) => a - b).slice(0, 3);
  return { support, resistance };
}

export function swingLevels(candles: Candle[]) {
  const levels: Array<{ price: number; time: number; type: "support" | "resistance" }> = [];
  const recent = candles.slice(-160);
  for (let i = 3; i < recent.length - 3; i++) {
    const c = recent[i];
    const left = recent.slice(i - 3, i);
    const right = recent.slice(i + 1, i + 4);
    if (c.high >= Math.max(...left.map((x) => x.high), ...right.map((x) => x.high)))
      levels.push({ price: c.high, time: c.time, type: "resistance" });
    if (c.low <= Math.min(...left.map((x) => x.low), ...right.map((x) => x.low)))
      levels.push({ price: c.low, time: c.time, type: "support" });
  }
  return levels;
}