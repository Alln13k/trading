import type { Candle, Timeframe } from "@/lib/types";

export type ChartRuleId =
  | "head-shoulders"
  | "inverse-head-shoulders"
  | "double-top"
  | "double-bottom"
  | "triple-top"
  | "triple-bottom"
  | "ascending-triangle"
  | "descending-triangle"
  | "symmetrical-triangle"
  | "rising-wedge"
  | "falling-wedge"
  | "bull-flag"
  | "bear-flag"
  | "pennant";

export const CHART_RULE_ORDER: ChartRuleId[] = [
  "head-shoulders",
  "inverse-head-shoulders",
  "double-top",
  "double-bottom",
  "triple-top",
  "triple-bottom",
  "ascending-triangle",
  "descending-triangle",
  "symmetrical-triangle",
  "rising-wedge",
  "falling-wedge",
  "bull-flag",
  "bear-flag",
  "pennant",
];

export function isChartRule(id: string): id is ChartRuleId {
  return (CHART_RULE_ORDER as string[]).includes(id);
}

export interface ChartHit {
  symbol: string;
  timeframe: Timeframe;
  ruleId: ChartRuleId;
  name: string;
  timestamp: number;
  priceLevels: Array<{ label: string; price: number }>;
  explanation: string;
  confirmation: "confirmed" | "unconfirmed";
}

interface Pivot {
  i: number;
  price: number;
  time: number;
}

interface Bands {
  similar: number;
  depth: number;
  flat: number;
  maxSpan: number;
  pivotN: number;
}

const RULE_META: Record<ChartRuleId, { label: string; method: string }> = {
  "head-shoulders": {
    label: "Head and shoulders",
    method:
      "Three confirmed pivot highs: the middle is higher than both shoulders by a sensitivity-scaled ATR distance, and the shoulders sit within an ATR band of each other. Confirmed only if a later close breaks the neckline through the two troughs. Otherwise the hit stays unconfirmed. A candidate, not a prediction.",
  },
  "inverse-head-shoulders": {
    label: "Inverse head and shoulders",
    method:
      "Three confirmed pivot lows: the middle is lower than both shoulders by a sensitivity-scaled ATR distance, and the shoulders sit within an ATR band. Confirmed only on a later close above the neckline. Otherwise the hit stays unconfirmed. A candidate, not a prediction.",
  },
  "double-top": {
    label: "Double top",
    method:
      "Two confirmed pivot highs within a sensitivity-scaled ATR band, with a trough between them at least that same kind of ATR distance under the peaks. Confirmed only on a later close below the trough. Otherwise the hit stays unconfirmed. A candidate, not a prediction.",
  },
  "double-bottom": {
    label: "Double bottom",
    method:
      "Two confirmed pivot lows within a sensitivity-scaled ATR band, with a peak between them at least that distance above the lows. Confirmed only on a later close above the peak. Otherwise the hit stays unconfirmed. A candidate, not a prediction.",
  },
  "triple-top": {
    label: "Triple top",
    method:
      "Three confirmed pivot highs inside one ATR band, each separated by a trough. Confirmed only on a later close below the lower trough. Otherwise the hit stays unconfirmed. A candidate, not a prediction.",
  },
  "triple-bottom": {
    label: "Triple bottom",
    method:
      "Three confirmed pivot lows inside one ATR band, each separated by a peak. Confirmed only on a later close above the higher peak. Otherwise the hit stays unconfirmed. A candidate, not a prediction.",
  },
  "ascending-triangle": {
    label: "Ascending triangle",
    method:
      "Pivot highs stay inside a flat ATR band while later pivot lows are higher, and the high-low gap narrows. Confirmed only on a later close above the flat highs. Otherwise the hit stays unconfirmed. A candidate, not a prediction.",
  },
  "descending-triangle": {
    label: "Descending triangle",
    method:
      "Pivot lows stay inside a flat ATR band while later pivot highs are lower, and the gap narrows. Confirmed only on a later close below the flat lows. Otherwise the hit stays unconfirmed. A candidate, not a prediction.",
  },
  "symmetrical-triangle": {
    label: "Symmetrical triangle",
    method:
      "Later pivot highs are lower and later pivot lows are higher, so the two lines converge. Confirmed when a later close is outside the last high or last low. Until then the hit stays unconfirmed. A candidate, not a prediction.",
  },
  "rising-wedge": {
    label: "Rising wedge",
    method:
      "Both the pivot highs and the pivot lows rise, and the gap between them narrows. Confirmed only on a later close below the last pivot low. Otherwise the hit stays unconfirmed. A candidate, not a prediction.",
  },
  "falling-wedge": {
    label: "Falling wedge",
    method:
      "Both the pivot highs and the pivot lows fall, and the gap between them narrows. Confirmed only on a later close above the last pivot high. Otherwise the hit stays unconfirmed. A candidate, not a prediction.",
  },
  "bull-flag": {
    label: "Bull flag",
    method:
      "A short run of bars gains a sensitivity-scaled multiple of ATR, then a tighter cluster of bars drifts down without taking out the pole. Confirmed only on a later close above the flag high. Otherwise the hit stays unconfirmed. A candidate, not a prediction.",
  },
  "bear-flag": {
    label: "Bear flag",
    method:
      "A short run of bars loses a sensitivity-scaled multiple of ATR, then a tighter cluster drifts up. Confirmed only on a later close below the flag low. Otherwise the hit stays unconfirmed. A candidate, not a prediction.",
  },
  pennant: {
    label: "Pennant",
    method:
      "An ATR impulse is followed by a shorter cluster whose second half has a smaller range than its first half. Confirmed on a later close beyond the cluster in the impulse direction. Otherwise the hit stays unconfirmed. A candidate, not a prediction.",
  },
};

export const CHART_SCAN_RULES = RULE_META;

function px(n: number): string {
  const abs = Math.abs(n);
  const digits = abs >= 100 ? 2 : abs >= 1 ? 4 : 5;
  return n.toFixed(digits);
}

function when(ts: number): string {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

function atr(candles: Candle[], end: number, n = 14): number {
  let sum = 0;
  let count = 0;
  const start = Math.max(1, end - n + 1);
  for (let i = start; i <= end; i++) {
    const prev = candles[i - 1].close;
    const tr = Math.max(candles[i].high - candles[i].low, Math.abs(candles[i].high - prev), Math.abs(candles[i].low - prev));
    sum += tr;
    count += 1;
  }
  return count ? sum / count : 0;
}

function bands(candles: Candle[], end: number, span: number, s: number): Bands | null {
  const a = atr(candles, end);
  if (!(a > 0)) return null;
  const pivotN = Math.max(2, 6 - s);
  const flat = a * (0.55 + s * 0.12) * Math.max(1, span / 18);
  return {
    similar: a * (0.55 + s * 0.22),
    depth: a * (1.7 - s * 0.16),
    flat,
    maxSpan: 18 + s * 16,
    pivotN,
  };
}

function pivots(candles: Candle[], n: number): { highs: Pivot[]; lows: Pivot[] } {
  const highs: Pivot[] = [];
  const lows: Pivot[] = [];
  for (let i = n; i < candles.length - n; i++) {
    let high = true;
    let low = true;
    for (let k = 1; k <= n; k++) {
      if (candles[i].high <= candles[i - k].high || candles[i].high <= candles[i + k].high) high = false;
      if (candles[i].low >= candles[i - k].low || candles[i].low >= candles[i + k].low) low = false;
    }
    if (high) highs.push({ i, price: candles[i].high, time: candles[i].time });
    if (low) lows.push({ i, price: candles[i].low, time: candles[i].time });
  }
  return { highs, lows };
}

function lowestBetween(candles: Candle[], lows: Pivot[], left: number, right: number): Pivot | null {
  const found = lows.filter((p) => p.i > left && p.i < right);
  if (found.length) return found.reduce((a, b) => (a.price < b.price ? a : b));
  if (right <= left + 1) return null;
  let best = left + 1;
  for (let i = left + 1; i < right; i++) if (candles[i].low < candles[best].low) best = i;
  return { i: best, price: candles[best].low, time: candles[best].time };
}

function highestBetween(candles: Candle[], highs: Pivot[], left: number, right: number): Pivot | null {
  const found = highs.filter((p) => p.i > left && p.i < right);
  if (found.length) return found.reduce((a, b) => (a.price > b.price ? a : b));
  if (right <= left + 1) return null;
  let best = left + 1;
  for (let i = left + 1; i < right; i++) if (candles[i].high > candles[best].high) best = i;
  return { i: best, price: candles[best].high, time: candles[best].time };
}

function neckline(i: number, a: Pivot, b: Pivot): number {
  if (a.i === b.i) return a.price;
  const t = (i - a.i) / (b.i - a.i);
  return a.price + t * (b.price - a.price);
}

type BreakState = { state: "confirmed" | "unconfirmed" | "invalid"; index: number };

function walk(
  candles: Candle[],
  from: number,
  confirm: (c: Candle, i: number) => boolean,
  kill: (c: Candle, i: number) => boolean
): BreakState {
  for (let i = from; i < candles.length; i++) {
    if (confirm(candles[i], i)) return { state: "confirmed", index: i };
    if (kill(candles[i], i)) return { state: "invalid", index: i };
  }
  const last = Math.max(0, Math.min(candles.length - 1, from - 1));
  return { state: "unconfirmed", index: last };
}

function closeEnough(values: number[], band: number): boolean {
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return values.every((v) => Math.abs(v - mean) <= band);
}

/**
 * Multi-bar shapes on the candles the caller already loaded.
 * Sensitivity 1 is stricter. Nothing here is a forecast.
 */
export function scanChartPatterns(symbol: string, timeframe: Timeframe, candles: Candle[], sensitivity: number): ChartHit[] {
  const s = Math.min(5, Math.max(1, Math.round(sensitivity)));
  if (candles.length < 30) return [];
  const pivotN = Math.max(2, 6 - s);
  const { highs, lows } = pivots(candles, pivotN);
  const found = new Map<ChartRuleId, ChartHit>();

  const put = (hit: ChartHit | null) => {
    if (!hit) return;
    if (!found.has(hit.ruleId)) found.set(hit.ruleId, hit);
  };

  for (let j = highs.length - 1; j >= 1; j--) {
    put(doubleTop(symbol, timeframe, candles, highs[j - 1], highs[j], lows, s));
    if (found.has("double-top")) break;
  }
  for (let j = lows.length - 1; j >= 1; j--) {
    put(doubleBottom(symbol, timeframe, candles, lows[j - 1], lows[j], highs, s));
    if (found.has("double-bottom")) break;
  }
  for (let j = highs.length - 1; j >= 2; j--) {
    put(tripleTop(symbol, timeframe, candles, [highs[j - 2], highs[j - 1], highs[j]], lows, s));
    if (found.has("triple-top")) break;
  }
  for (let j = lows.length - 1; j >= 2; j--) {
    put(tripleBottom(symbol, timeframe, candles, [lows[j - 2], lows[j - 1], lows[j]], highs, s));
    if (found.has("triple-bottom")) break;
  }
  for (let j = highs.length - 1; j >= 2; j--) {
    put(headShoulders(symbol, timeframe, candles, [highs[j - 2], highs[j - 1], highs[j]], lows, s));
    if (found.has("head-shoulders")) break;
  }
  for (let j = lows.length - 1; j >= 2; j--) {
    put(inverseHeadShoulders(symbol, timeframe, candles, [lows[j - 2], lows[j - 1], lows[j]], highs, s));
    if (found.has("inverse-head-shoulders")) break;
  }

  for (let j = highs.length - 1; j >= 2 && found.size < CHART_RULE_ORDER.length; j--) {
    const hs = [highs[j - 2], highs[j - 1], highs[j]];
    const ls = lows.filter((p) => p.i > hs[0].i - pivotN && p.i < hs[2].i + pivotN).slice(-3);
    put(triangleOrWedge(symbol, timeframe, candles, hs, ls, s));
  }
  for (let j = lows.length - 1; j >= 2; j--) {
    const ls = [lows[j - 2], lows[j - 1], lows[j]];
    const hs = highs.filter((p) => p.i > ls[0].i - pivotN && p.i < ls[2].i + pivotN).slice(-3);
    put(triangleOrWedge(symbol, timeframe, candles, hs, ls, s));
  }

  for (const hit of continuations(symbol, timeframe, candles, s)) put(hit);

  return CHART_RULE_ORDER.filter((id) => found.has(id)).map((id) => found.get(id)!);
}

function doubleTop(
  symbol: string,
  timeframe: Timeframe,
  candles: Candle[],
  left: Pivot,
  right: Pivot,
  lows: Pivot[],
  s: number
): ChartHit | null {
  const span = right.i - left.i;
  const b = bands(candles, right.i, span, s);
  if (!b || span < b.pivotN * 2 || span > b.maxSpan) return null;
  if (Math.abs(left.price - right.price) > b.similar) return null;
  const trough = lowestBetween(candles, lows, left.i, right.i);
  if (!trough) return null;
  const peak = Math.max(left.price, right.price);
  if (peak - trough.price < b.depth) return null;
  const after = walk(
    candles,
    right.i + 1,
    (c) => c.close < trough.price,
    (c) => c.close > peak
  );
  if (after.state === "invalid") return null;
  const bar = candles[after.state === "confirmed" ? after.index : right.i];
  return {
    symbol,
    timeframe,
    ruleId: "double-top",
    name: "Double top",
    timestamp: bar.time,
    confirmation: after.state,
    priceLevels: [
      { label: "Left high", price: left.price },
      { label: "Right high", price: right.price },
      { label: "Trough", price: trough.price },
    ],
    explanation: `Pivot highs on ${when(left.time)} (${px(left.price)}) and ${when(right.time)} (${px(right.price)}) sit within ${px(b.similar)} of each other, with the trough at ${px(trough.price)} on ${when(trough.time)}, and ${after.state === "confirmed" ? `a later close on ${when(bar.time)} is below that trough` : "no later close has gone below that trough, so this stays unconfirmed"}, which is a candidate and not a prediction.`,
  };
}

function doubleBottom(
  symbol: string,
  timeframe: Timeframe,
  candles: Candle[],
  left: Pivot,
  right: Pivot,
  highs: Pivot[],
  s: number
): ChartHit | null {
  const span = right.i - left.i;
  const b = bands(candles, right.i, span, s);
  if (!b || span < b.pivotN * 2 || span > b.maxSpan) return null;
  if (Math.abs(left.price - right.price) > b.similar) return null;
  const peak = highestBetween(candles, highs, left.i, right.i);
  if (!peak) return null;
  const floor = Math.min(left.price, right.price);
  if (peak.price - floor < b.depth) return null;
  const after = walk(
    candles,
    right.i + 1,
    (c) => c.close > peak.price,
    (c) => c.close < floor
  );
  if (after.state === "invalid") return null;
  const bar = candles[after.state === "confirmed" ? after.index : right.i];
  return {
    symbol,
    timeframe,
    ruleId: "double-bottom",
    name: "Double bottom",
    timestamp: bar.time,
    confirmation: after.state,
    priceLevels: [
      { label: "Left low", price: left.price },
      { label: "Right low", price: right.price },
      { label: "Peak", price: peak.price },
    ],
    explanation: `Pivot lows on ${when(left.time)} (${px(left.price)}) and ${when(right.time)} (${px(right.price)}) sit within ${px(b.similar)} of each other, with the peak at ${px(peak.price)} on ${when(peak.time)}, and ${after.state === "confirmed" ? `a later close on ${when(bar.time)} is above that peak` : "no later close has gone above that peak, so this stays unconfirmed"}, which is a candidate and not a prediction.`,
  };
}

function tripleTop(symbol: string, timeframe: Timeframe, candles: Candle[], peaks: Pivot[], lows: Pivot[], s: number): ChartHit | null {
  const span = peaks[2].i - peaks[0].i;
  const b = bands(candles, peaks[2].i, span, s);
  if (!b || span > b.maxSpan || span < b.pivotN * 4) return null;
  if (!closeEnough(peaks.map((p) => p.price), b.similar)) return null;
  const t1 = lowestBetween(candles, lows, peaks[0].i, peaks[1].i);
  const t2 = lowestBetween(candles, lows, peaks[1].i, peaks[2].i);
  if (!t1 || !t2) return null;
  const ceiling = Math.max(...peaks.map((p) => p.price));
  if (ceiling - t1.price < b.depth || ceiling - t2.price < b.depth) return null;
  const neck = Math.min(t1.price, t2.price);
  const after = walk(
    candles,
    peaks[2].i + 1,
    (c) => c.close < neck,
    (c) => c.close > ceiling
  );
  if (after.state === "invalid") return null;
  const bar = candles[after.state === "confirmed" ? after.index : peaks[2].i];
  return {
    symbol,
    timeframe,
    ruleId: "triple-top",
    name: "Triple top",
    timestamp: bar.time,
    confirmation: after.state,
    priceLevels: [
      ...peaks.map((p, i) => ({ label: `High ${i + 1}`, price: p.price })),
      { label: "Lower trough", price: neck },
    ],
    explanation: `Three pivot highs from ${when(peaks[0].time)} to ${when(peaks[2].time)} (${peaks.map((p) => px(p.price)).join(", ")}) stay inside a ${px(b.similar)} band, with troughs at ${px(t1.price)} and ${px(t2.price)}, and ${after.state === "confirmed" ? `a later close on ${when(bar.time)} is below ${px(neck)}` : `no later close has gone below ${px(neck)}, so this stays unconfirmed`}, which is a candidate and not a prediction.`,
  };
}

function tripleBottom(symbol: string, timeframe: Timeframe, candles: Candle[], troughs: Pivot[], highs: Pivot[], s: number): ChartHit | null {
  const span = troughs[2].i - troughs[0].i;
  const b = bands(candles, troughs[2].i, span, s);
  if (!b || span > b.maxSpan || span < b.pivotN * 4) return null;
  if (!closeEnough(troughs.map((p) => p.price), b.similar)) return null;
  const p1 = highestBetween(candles, highs, troughs[0].i, troughs[1].i);
  const p2 = highestBetween(candles, highs, troughs[1].i, troughs[2].i);
  if (!p1 || !p2) return null;
  const floor = Math.min(...troughs.map((p) => p.price));
  if (p1.price - floor < b.depth || p2.price - floor < b.depth) return null;
  const neck = Math.max(p1.price, p2.price);
  const after = walk(
    candles,
    troughs[2].i + 1,
    (c) => c.close > neck,
    (c) => c.close < floor
  );
  if (after.state === "invalid") return null;
  const bar = candles[after.state === "confirmed" ? after.index : troughs[2].i];
  return {
    symbol,
    timeframe,
    ruleId: "triple-bottom",
    name: "Triple bottom",
    timestamp: bar.time,
    confirmation: after.state,
    priceLevels: [
      ...troughs.map((p, i) => ({ label: `Low ${i + 1}`, price: p.price })),
      { label: "Higher peak", price: neck },
    ],
    explanation: `Three pivot lows from ${when(troughs[0].time)} to ${when(troughs[2].time)} (${troughs.map((p) => px(p.price)).join(", ")}) stay inside a ${px(b.similar)} band, with peaks at ${px(p1.price)} and ${px(p2.price)}, and ${after.state === "confirmed" ? `a later close on ${when(bar.time)} is above ${px(neck)}` : `no later close has gone above ${px(neck)}, so this stays unconfirmed`}, which is a candidate and not a prediction.`,
  };
}

function headShoulders(symbol: string, timeframe: Timeframe, candles: Candle[], peaks: Pivot[], lows: Pivot[], s: number): ChartHit | null {
  const [left, head, right] = peaks;
  const span = right.i - left.i;
  const b = bands(candles, right.i, span, s);
  if (!b || span > b.maxSpan || span < b.pivotN * 4) return null;
  if (!(head.price > left.price && head.price > right.price)) return null;
  if (head.price - Math.max(left.price, right.price) < b.depth) return null;
  if (Math.abs(left.price - right.price) > b.similar) return null;
  const t1 = lowestBetween(candles, lows, left.i, head.i);
  const t2 = lowestBetween(candles, lows, head.i, right.i);
  if (!t1 || !t2) return null;
  if (Math.min(left.price, right.price) - Math.max(t1.price, t2.price) < b.depth * 0.5) return null;
  const neckAtRight = neckline(right.i, t1, t2);
  if (!(right.price > neckAtRight)) return null;
  const after = walk(
    candles,
    right.i + 1,
    (c, i) => c.close < neckline(i, t1, t2),
    (c) => c.close > head.price
  );
  if (after.state === "invalid") return null;
  const bar = candles[after.state === "confirmed" ? after.index : right.i];
  const neck = neckline(after.state === "confirmed" ? after.index : right.i, t1, t2);
  return {
    symbol,
    timeframe,
    ruleId: "head-shoulders",
    name: "Head and shoulders",
    timestamp: bar.time,
    confirmation: after.state,
    priceLevels: [
      { label: "Left shoulder", price: left.price },
      { label: "Head", price: head.price },
      { label: "Right shoulder", price: right.price },
      { label: "Neckline", price: neck },
    ],
    explanation: `Pivot highs on ${when(left.time)}, ${when(head.time)}, and ${when(right.time)} are ${px(left.price)}, ${px(head.price)}, and ${px(right.price)}, so the middle bar is the high and the neckline through the troughs is ${px(neck)}, and ${after.state === "confirmed" ? `a later close on ${when(bar.time)} is below that line` : "no later close has crossed below that line, so this stays unconfirmed"}, which is a candidate and not a prediction.`,
  };
}

function inverseHeadShoulders(
  symbol: string,
  timeframe: Timeframe,
  candles: Candle[],
  troughs: Pivot[],
  highs: Pivot[],
  s: number
): ChartHit | null {
  const [left, head, right] = troughs;
  const span = right.i - left.i;
  const b = bands(candles, right.i, span, s);
  if (!b || span > b.maxSpan || span < b.pivotN * 4) return null;
  if (!(head.price < left.price && head.price < right.price)) return null;
  if (Math.min(left.price, right.price) - head.price < b.depth) return null;
  if (Math.abs(left.price - right.price) > b.similar) return null;
  const p1 = highestBetween(candles, highs, left.i, head.i);
  const p2 = highestBetween(candles, highs, head.i, right.i);
  if (!p1 || !p2) return null;
  if (Math.min(p1.price, p2.price) - Math.max(left.price, right.price) < b.depth * 0.5) return null;
  const neckAtRight = neckline(right.i, p1, p2);
  if (!(right.price < neckAtRight)) return null;
  const after = walk(
    candles,
    right.i + 1,
    (c, i) => c.close > neckline(i, p1, p2),
    (c) => c.close < head.price
  );
  if (after.state === "invalid") return null;
  const bar = candles[after.state === "confirmed" ? after.index : right.i];
  const neck = neckline(after.state === "confirmed" ? after.index : right.i, p1, p2);
  return {
    symbol,
    timeframe,
    ruleId: "inverse-head-shoulders",
    name: "Inverse head and shoulders",
    timestamp: bar.time,
    confirmation: after.state,
    priceLevels: [
      { label: "Left shoulder", price: left.price },
      { label: "Head", price: head.price },
      { label: "Right shoulder", price: right.price },
      { label: "Neckline", price: neck },
    ],
    explanation: `Pivot lows on ${when(left.time)}, ${when(head.time)}, and ${when(right.time)} are ${px(left.price)}, ${px(head.price)}, and ${px(right.price)}, so the middle bar is the low and the neckline through the peaks is ${px(neck)}, and ${after.state === "confirmed" ? `a later close on ${when(bar.time)} is above that line` : "no later close has crossed above that line, so this stays unconfirmed"}, which is a candidate and not a prediction.`,
  };
}

function triangleOrWedge(
  symbol: string,
  timeframe: Timeframe,
  candles: Candle[],
  highs: Pivot[],
  lows: Pivot[],
  s: number
): ChartHit | null {
  if (highs.length < 2 || lows.length < 2) return null;
  const h0 = highs[0];
  const h1 = highs[highs.length - 1];
  const l0 = lows[0];
  const l1 = lows[lows.length - 1];
  const start = Math.min(h0.i, l0.i);
  const end = Math.max(h1.i, l1.i);
  const span = end - start;
  const b = bands(candles, end, span, s);
  if (!b || span < b.pivotN * 3 || span > b.maxSpan) return null;
  const overlap = Math.min(h1.i, l1.i) - Math.max(h0.i, l0.i);
  if (overlap < b.pivotN) return null;
  const highDelta = h1.price - h0.price;
  const lowDelta = l1.price - l0.price;
  const startRange = h0.price - l0.price;
  const endRange = h1.price - l1.price;
  if (!(startRange > 0) || !(endRange > 0) || !(endRange < startRange * 0.92)) return null;
  const flatH = Math.abs(highDelta) <= b.flat;
  const flatL = Math.abs(lowDelta) <= b.flat;
  const upH = highDelta > b.flat;
  const downH = highDelta < -b.flat;
  const upL = lowDelta > b.flat;
  const downL = lowDelta < -b.flat;

  let rule: ChartRuleId | null = null;
  if (upH && upL) rule = "rising-wedge";
  else if (downH && downL) rule = "falling-wedge";
  else if (flatH && upL) rule = "ascending-triangle";
  else if (flatL && downH) rule = "descending-triangle";
  else if (downH && upL) rule = "symmetrical-triangle";
  if (!rule) return null;

  const last = end;
  let confirm: (c: Candle) => boolean;
  let kill: (c: Candle) => boolean;
  let level: number;
  let levelLabel: string;
  if (rule === "ascending-triangle") {
    level = Math.max(...highs.map((p) => p.price));
    levelLabel = "Flat highs";
    confirm = (c) => c.close > level;
    kill = (c) => c.close < l1.price;
  } else if (rule === "descending-triangle") {
    level = Math.min(...lows.map((p) => p.price));
    levelLabel = "Flat lows";
    confirm = (c) => c.close < level;
    kill = (c) => c.close > h1.price;
  } else if (rule === "rising-wedge") {
    level = l1.price;
    levelLabel = "Last rising low";
    confirm = (c) => c.close < level;
    kill = (c) => c.close > h1.price;
  } else if (rule === "falling-wedge") {
    level = h1.price;
    levelLabel = "Last falling high";
    confirm = (c) => c.close > level;
    kill = (c) => c.close < l1.price;
  } else {
    level = h1.price;
    levelLabel = "Last high";
    confirm = (c) => c.close > h1.price || c.close < l1.price;
    kill = () => false;
  }

  const after = walk(candles, last + 1, confirm, kill);
  if (after.state === "invalid") return null;
  const bar = candles[after.state === "confirmed" ? after.index : last];
  const brokeUp = after.state === "confirmed" && bar.close > h1.price;
  const side =
    rule === "symmetrical-triangle" && after.state === "confirmed"
      ? brokeUp
        ? ` and a later close on ${when(bar.time)} is above the last high ${px(h1.price)}`
        : ` and a later close on ${when(bar.time)} is below the last low ${px(l1.price)}`
      : after.state === "confirmed"
        ? ` and a later close on ${when(bar.time)} crossed ${px(level)}`
        : " and no later close has left the pattern, so this stays unconfirmed";
  return {
    symbol,
    timeframe,
    ruleId: rule,
    name: RULE_META[rule].label,
    timestamp: bar.time,
    confirmation: after.state,
    priceLevels: [
      { label: "First high", price: h0.price },
      { label: "Last high", price: h1.price },
      { label: "First low", price: l0.price },
      { label: "Last low", price: l1.price },
      { label: levelLabel, price: level },
    ],
    explanation: `From ${when(candles[start].time)} to ${when(candles[end].time)}, highs go from ${px(h0.price)} to ${px(h1.price)} and lows go from ${px(l0.price)} to ${px(l1.price)}, and the gap narrows from ${px(startRange)} to ${px(endRange)}${side}, which is a candidate and not a prediction.`,
  };
}

function continuations(symbol: string, timeframe: Timeframe, candles: Candle[], s: number): ChartHit[] {
  const poleLen = 6;
  const minFlag = 4;
  const maxFlag = 6 + s * 2;
  const hits: ChartHit[] = [];
  const seen = new Set<ChartRuleId>();

  for (let poleEnd = candles.length - minFlag - 1; poleEnd >= poleLen; poleEnd--) {
    if (seen.size === 3) break;
    const poleStart = poleEnd - poleLen;
    const a = atr(candles, poleEnd);
    if (!(a > 0)) continue;
    const startClose = candles[poleStart].close;
    const endClose = candles[poleEnd].close;
    const move = endClose - startClose;
    const poleMul = 3.1 - s * 0.28;
    if (Math.abs(move) < a * poleMul) continue;
    let poleHigh = -Infinity;
    let poleLow = Infinity;
    let adverse = 0;
    for (let k = poleStart; k <= poleEnd; k++) {
      poleHigh = Math.max(poleHigh, candles[k].high);
      poleLow = Math.min(poleLow, candles[k].low);
      if (move > 0) adverse = Math.max(adverse, startClose - candles[k].low);
      else adverse = Math.max(adverse, candles[k].high - startClose);
    }
    if (adverse > Math.abs(move) * 0.45) continue;
    if (Math.abs(move) < (poleHigh - poleLow) * 0.55) continue;

    const up = move > 0;
    const last = Math.min(candles.length - 1, poleEnd + maxFlag);
    const flag: Candle[] = [];
    let confirmAt = -1;
    let invalid = false;
    for (let k = poleEnd + 1; k <= last; k++) {
      const c = candles[k];
      if (flag.length >= minFlag) {
        const fh = Math.max(...flag.map((x) => x.high));
        const fl = Math.min(...flag.map((x) => x.low));
        if (up && c.close > fh) {
          confirmAt = k;
          break;
        }
        if (!up && c.close < fl) {
          confirmAt = k;
          break;
        }
        if (up && c.close < fl) {
          invalid = true;
          break;
        }
        if (!up && c.close > fh) {
          invalid = true;
          break;
        }
      }
      flag.push(c);
    }
    if (invalid || flag.length < minFlag) continue;
    const flagHigh = Math.max(...flag.map((c) => c.high));
    const flagLow = Math.min(...flag.map((c) => c.low));
    const flagRange = flagHigh - flagLow;
    const flagRatio = 0.5 + s * 0.05;
    if (!(flagRange > 0) || flagRange > Math.abs(move) * flagRatio) continue;
    if (up) {
      if (!(flagLow < endClose)) continue;
      if (flagHigh > poleHigh + a * 0.2) continue;
    } else {
      if (!(flagHigh > endClose)) continue;
      if (flagLow < poleLow - a * 0.2) continue;
    }
    const mid = Math.max(1, Math.floor(flag.length / 2));
    const first = flag.slice(0, mid);
    const second = flag.slice(mid);
    const r1 = Math.max(...first.map((c) => c.high)) - Math.min(...first.map((c) => c.low));
    const r2 = second.length
      ? Math.max(...second.map((c) => c.high)) - Math.min(...second.map((c) => c.low))
      : r1;
    const converging = second.length >= 2 && r2 < r1 * 0.75;
    const drift = flag[flag.length - 1].close - endClose;
    const retrace = up ? drift < 0 : drift > 0;
    let rule: ChartRuleId | null = null;
    if (converging) rule = "pennant";
    else if (retrace && up) rule = "bull-flag";
    else if (retrace && !up) rule = "bear-flag";
    if (!rule || seen.has(rule)) continue;
    seen.add(rule);
    const confirmed = confirmAt >= 0;
    const stamp = confirmed ? candles[confirmAt].time : flag[flag.length - 1].time;
    const name = rule === "bull-flag" ? "Bull flag" : rule === "bear-flag" ? "Bear flag" : "Pennant";
    const poleWord = up ? "rose" : "fell";
    hits.push({
      symbol,
      timeframe,
      ruleId: rule,
      name,
      timestamp: stamp,
      confirmation: confirmed ? "confirmed" : "unconfirmed",
      priceLevels: [
        { label: "Pole start", price: startClose },
        { label: "Pole end", price: endClose },
        { label: "Flag high", price: flagHigh },
        { label: "Flag low", price: flagLow },
      ],
      explanation: `From ${when(candles[poleStart].time)} to ${when(candles[poleEnd].time)} the close ${poleWord} from ${px(startClose)} to ${px(endClose)}, then ${flag.length} bars stayed between ${px(flagLow)} and ${px(flagHigh)}, and ${confirmed ? `a later close on ${when(stamp)} left that cluster in the pole's direction` : "no later close has left that cluster, so this stays unconfirmed"}, which is a candidate and not a prediction.`,
    });
  }
  return hits;
}
