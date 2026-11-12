import type { Candle, Timeframe } from "@/lib/types";
import { CHART_SCAN_RULES, scanChartPatterns, type ChartRuleId } from "@/lib/analysis/chart-patterns";

export type ScanRuleId = "engulfing" | "doji" | "hammer" | "swing" | ChartRuleId;

export interface ScanHit {
  symbol: string;
  timeframe: Timeframe;
  ruleId: ScanRuleId;
  name: string;
  timestamp: number;
  priceLevels: Array<{ label: string; price: number }>;
  explanation: string;
  confirmation: "confirmed" | "unconfirmed";
}

/** 1 = stricter, 5 = more candidates. */
export function scanCandles(
  symbol: string,
  timeframe: Timeframe,
  candles: Candle[],
  sensitivity: number
): ScanHit[] {
  const s = Math.min(5, Math.max(1, Math.round(sensitivity)));
  const hits: ScanHit[] = [];
  const dojiBody = 0.04 + s * 0.04;
  const hammerWick = 3.4 - s * 0.4;
  const pivot = 6 - s;

  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    const next = candles[i + 1];
    const range = cur.high - cur.low;
    const body = Math.abs(cur.close - cur.open);
    const prevBodyTop = Math.max(prev.open, prev.close);
    const prevBodyBot = Math.min(prev.open, prev.close);
    const curBodyTop = Math.max(cur.open, cur.close);
    const curBodyBot = Math.min(cur.open, cur.close);

    const bullEngulf = cur.close > cur.open && prev.close < prev.open && curBodyTop >= prevBodyTop && curBodyBot <= prevBodyBot && body > 0;
    const bearEngulf = cur.close < cur.open && prev.close > prev.open && curBodyTop >= prevBodyTop && curBodyBot <= prevBodyBot && body > 0;
    if (bullEngulf || bearEngulf) {
      const confirmed = next ? (bullEngulf ? next.close > cur.high : next.close < cur.low) : false;
      hits.push({
        symbol,
        timeframe,
        ruleId: "engulfing",
        name: bullEngulf ? "Bullish engulfing" : "Bearish engulfing",
        timestamp: cur.time,
        priceLevels: [
          { label: "Open", price: cur.open },
          { label: "Close", price: cur.close },
          { label: "High", price: cur.high },
          { label: "Low", price: cur.low },
        ],
        explanation: bullEngulf
          ? "The candle body covers the prior down-body. This is a shape test, not a forecast."
          : "The candle body covers the prior up-body. This is a shape test, not a forecast.",
        confirmation: confirmed ? "confirmed" : "unconfirmed",
      });
    }

    if (range > 0 && body / range <= dojiBody) {
      const confirmed = next ? next.close > cur.high || next.close < cur.low : false;
      hits.push({
        symbol,
        timeframe,
        ruleId: "doji",
        name: "Doji",
        timestamp: cur.time,
        priceLevels: [
          { label: "Open", price: cur.open },
          { label: "Close", price: cur.close },
          { label: "High", price: cur.high },
          { label: "Low", price: cur.low },
        ],
        explanation: `Body is ${((body / range) * 100).toFixed(1)}% of the range. Threshold at this sensitivity is ${(dojiBody * 100).toFixed(0)}% or less.`,
        confirmation: confirmed ? "confirmed" : "unconfirmed",
      });
    }

    const lowerWick = Math.min(cur.open, cur.close) - cur.low;
    const upperWick = cur.high - Math.max(cur.open, cur.close);
    if (range > 0 && body > 0 && lowerWick >= body * hammerWick && upperWick <= body) {
      const confirmed = next ? next.close > cur.high : false;
      hits.push({
        symbol,
        timeframe,
        ruleId: "hammer",
        name: "Hammer",
        timestamp: cur.time,
        priceLevels: [
          { label: "Low", price: cur.low },
          { label: "Body low", price: Math.min(cur.open, cur.close) },
          { label: "High", price: cur.high },
        ],
        explanation: `Lower wick is ${(lowerWick / body).toFixed(2)}× the body. Hammer wick multiple at this sensitivity is ${hammerWick.toFixed(1)}.`,
        confirmation: confirmed ? "confirmed" : "unconfirmed",
      });
    }
  }

  const highs: Array<{ i: number; price: number; time: number; confirmed: boolean }> = [];
  const lows: Array<{ i: number; price: number; time: number; confirmed: boolean }> = [];
  for (let i = 1; i < candles.length - 1; i++) {
    const width = Math.min(pivot, i, candles.length - 1 - i);
    if (width < 1) continue;
    let high = true;
    let low = true;
    for (let k = 1; k <= width; k++) {
      if (candles[i].high < candles[i - k].high || candles[i].high < candles[i + k].high) high = false;
      if (candles[i].low > candles[i - k].low || candles[i].low > candles[i + k].low) low = false;
    }
    const confirmed = width >= pivot;
    if (high) highs.push({ i, price: candles[i].high, time: candles[i].time, confirmed });
    if (low) lows.push({ i, price: candles[i].low, time: candles[i].time, confirmed });
  }

  const pushSwing = (
    kind: "HH" | "HL" | "LH" | "LL",
    cur: { price: number; time: number; confirmed: boolean },
    prev: { price: number }
  ) => {
    hits.push({
      symbol,
      timeframe,
      ruleId: "swing",
      name: kind,
      timestamp: cur.time,
      priceLevels: [
        { label: "This swing", price: cur.price },
        { label: "Prior swing", price: prev.price },
      ],
      explanation:
        kind === "HH"
          ? `Pivot high ${cur.price} is above the prior pivot high ${prev.price}.`
          : kind === "LH"
            ? `Pivot high ${cur.price} is below the prior pivot high ${prev.price}.`
            : kind === "HL"
              ? `Pivot low ${cur.price} is above the prior pivot low ${prev.price}.`
              : `Pivot low ${cur.price} is below the prior pivot low ${prev.price}.`,
      confirmation: cur.confirmed ? "confirmed" : "unconfirmed",
    });
  };

  for (let i = 1; i < highs.length; i++) {
    const cur = highs[i];
    const prev = highs[i - 1];
    if (cur.price > prev.price) pushSwing("HH", cur, prev);
    else if (cur.price < prev.price) pushSwing("LH", cur, prev);
  }
  for (let i = 1; i < lows.length; i++) {
    const cur = lows[i];
    const prev = lows[i - 1];
    if (cur.price > prev.price) pushSwing("HL", cur, prev);
    else if (cur.price < prev.price) pushSwing("LL", cur, prev);
  }

  return [...scanChartPatterns(symbol, timeframe, candles, s), ...hits.slice(-40)];
}

export const SCAN_RULES: Record<ScanRuleId, { label: string; method: string }> = {
  engulfing: {
    label: "Engulfing",
    method: "Current real body fully covers the prior real body and the colors oppose. Confirmed only if the next bar closes beyond the engulfing high (bull) or low (bear). Otherwise the hit stays unconfirmed.",
  },
  doji: {
    label: "Doji",
    method: "Body divided by high-low is at or under a sensitivity threshold (8% at 1, 24% at 5). Confirmed only if a later bar closes outside the doji high or low.",
  },
  hammer: {
    label: "Hammer",
    method: "Lower wick is at least a sensitivity multiple of the body (3.0 at 1, 1.4 at 5) and the upper wick is no larger than the body. Confirmed only if the next close is above the hammer high.",
  },
  swing: {
    label: "Swing HH/HL/LH/LL",
    method: "A pivot uses N bars each side, where N is 5 at sensitivity 1 and 1 at sensitivity 5. HH/LH compare successive pivot highs. HL/LL compare successive pivot lows. A pivot with fewer right-side bars than N is listed as unconfirmed.",
  },
  ...CHART_SCAN_RULES,
};
