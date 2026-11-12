import type { Candle } from "@/lib/types";
import { atr, ema, findSupportResistance, macd, rsi, sma } from "@/lib/indicators";

export interface AnalysisSnapshot {
  available: true;
  barCount: number;
  lastTime: number;
  lastClose: number;
  structure: { label: string; why: string } | { unavailable: string };
  trend: { label: "up" | "down" | "mixed"; why: string };
  momentum: { why: string };
  volatility: { atr: number; atrPct: number; why: string } | { unavailable: string };
  rsi: { value: number; why: string } | { unavailable: string };
  macd: { line: number; signal: number; histogram: number; why: string } | { unavailable: string };
  movingAverages: { why: string; sma20?: number; sma50?: number; ema20?: number };
  support: number[];
  resistance: number[];
  reads: { bullish: string; bearish: string; neutral: string; active: "bullish" | "bearish" | "neutral" };
  scenarios: {
    bullish: { text: string; invalidation: string };
    bearish: { text: string; invalidation: string };
  };
  method: string;
}

export type AnalysisResult = AnalysisSnapshot | { available: false; reason: string };

const PIVOT = 2;

function swings(candles: Candle[]) {
  const highs: Array<{ time: number; price: number }> = [];
  const lows: Array<{ time: number; price: number }> = [];
  for (let i = PIVOT; i < candles.length - PIVOT; i++) {
    const c = candles[i];
    let high = true;
    let low = true;
    for (let k = 1; k <= PIVOT; k++) {
      if (c.high < candles[i - k].high || c.high < candles[i + k].high) high = false;
      if (c.low > candles[i - k].low || c.low > candles[i + k].low) low = false;
    }
    if (high) highs.push({ time: c.time, price: c.high });
    if (low) lows.push({ time: c.time, price: c.low });
  }
  return { highs, lows };
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 5 });
}

export function analyzeCandles(candles: Candle[]): AnalysisResult {
  if (candles.length < 30) {
    return {
      available: false,
      reason: `Unavailable — ${candles.length} bars loaded. Structure and moving averages need at least 30 real candles.`,
    };
  }
  const close = candles[candles.length - 1].close;
  const lastTime = candles[candles.length - 1].time;
  const sma20s = sma(candles, 20);
  const sma50s = candles.length >= 50 ? sma(candles, 50) : [];
  const ema20s = ema(candles, 20);
  const rsiSeries = rsi(candles, 14);
  const macdSeries = macd(candles, 12, 26, 9);
  const atrSeries = atr(candles, 14);
  const sma20 = sma20s.at(-1)?.value;
  const sma50 = sma50s.at(-1)?.value;
  const ema20 = ema20s.at(-1)?.value;
  const rsiNow = rsiSeries.at(-1)?.value;
  const macdNow = macdSeries.histogram.at(-1);
  const macdLine = macdSeries.macd.at(-1)?.value;
  const macdSignal = macdSeries.signal.at(-1)?.value;
  const atrNow = atrSeries.at(-1)?.value;

  if (sma20 === undefined || ema20 === undefined) {
    return { available: false, reason: "Unavailable — moving averages could not be computed from these bars." };
  }

  const { highs, lows } = swings(candles);
  let structure: AnalysisSnapshot["structure"];
  if (highs.length < 2 || lows.length < 2) {
    structure = { unavailable: "Unavailable — fewer than two confirmed swing highs and two swing lows in this window." };
  } else {
    const h1 = highs[highs.length - 2];
    const h2 = highs[highs.length - 1];
    const l1 = lows[lows.length - 2];
    const l2 = lows[lows.length - 1];
    const hh = h2.price > h1.price;
    const hl = l2.price > l1.price;
    const label = hh && hl ? "Higher highs and higher lows" : !hh && !hl ? "Lower highs and lower lows" : "Mixed swings";
    structure = {
      label,
      why: `Last two pivot highs (2 bars each side): ${fmt(h1.price)} then ${fmt(h2.price)}. Last two pivot lows: ${fmt(l1.price)} then ${fmt(l2.price)}.`,
    };
  }

  const above20 = close > sma20;
  const above50 = sma50 !== undefined ? close > sma50 : null;
  const stackedUp = sma50 !== undefined ? sma20 > sma50 : null;
  let trendLabel: "up" | "down" | "mixed" = "mixed";
  if (above20 && above50 === true && stackedUp === true) trendLabel = "up";
  else if (!above20 && above50 === false && stackedUp === false) trendLabel = "down";
  const trendWhy = [
    `Close ${fmt(close)} is ${above20 ? "above" : "below"} SMA 20 at ${fmt(sma20)}.`,
    sma50 === undefined
      ? "SMA 50 is unavailable — fewer than 50 bars."
      : `Close is ${above50 ? "above" : "below"} SMA 50 at ${fmt(sma50)}. SMA 20 is ${stackedUp ? "above" : "below"} SMA 50.`,
    `EMA 20 is ${fmt(ema20)}.`,
  ].join(" ");

  const levels = findSupportResistance(candles);
  const support = levels.support[0];
  const resistance = levels.resistance[0];

  const rsiBlock: AnalysisSnapshot["rsi"] =
    rsiNow === undefined
      ? { unavailable: "Unavailable — RSI 14 needs more closes than this window produced." }
      : {
          value: rsiNow,
          why: `Wilder RSI 14 is ${rsiNow.toFixed(1)}. ${rsiNow >= 70 ? "At or above 70." : rsiNow <= 30 ? "At or below 30." : "Between 30 and 70."}`,
        };

  const macdBlock: AnalysisSnapshot["macd"] =
    macdNow === undefined || macdLine === undefined || macdSignal === undefined
      ? { unavailable: "Unavailable — MACD 12/26/9 is not defined on this window yet." }
      : {
          line: macdLine,
          signal: macdSignal,
          histogram: macdNow.value,
          why: `MACD line ${fmt(macdLine)}, signal ${fmt(macdSignal)}, histogram ${fmt(macdNow.value)} (${macdNow.value >= 0 ? "line above signal" : "line below signal"}).`,
        };

  const volBlock: AnalysisSnapshot["volatility"] =
    atrNow === undefined || close === 0
      ? { unavailable: "Unavailable — ATR 14 is not defined yet." }
      : {
          atr: atrNow,
          atrPct: (atrNow / close) * 100,
          why: `ATR 14 is ${fmt(atrNow)}, which is ${((atrNow / close) * 100).toFixed(2)}% of the last close.`,
        };

  const histPos = "histogram" in macdBlock ? macdBlock.histogram > 0 : null;
  const rsiPos = "value" in rsiBlock ? rsiBlock.value > 50 : null;
  const bullFacts = above20 && above50 === true && stackedUp === true && histPos === true && rsiPos === true;
  const bearFacts = !above20 && above50 === false && stackedUp === false && histPos === false && rsiPos === false;
  const active: "bullish" | "bearish" | "neutral" = bullFacts ? "bullish" : bearFacts ? "bearish" : "neutral";

  const bullishWhy = [
    above20 ? "Close is above SMA 20." : "Close is not above SMA 20.",
    above50 === true ? "Close is above SMA 50 and SMA 20 is above SMA 50." : "The SMA 20/50 stack is not aligned up.",
    histPos === true ? "MACD histogram is positive." : "MACD histogram is not positive.",
    rsiPos === true ? "RSI is above 50." : "RSI is not above 50.",
  ].join(" ");
  const bearishWhy = [
    !above20 ? "Close is below SMA 20." : "Close is not below SMA 20.",
    above50 === false && stackedUp === false ? "Close is below SMA 50 and SMA 20 is below SMA 50." : "The SMA 20/50 stack is not aligned down.",
    histPos === false ? "MACD histogram is negative." : "MACD histogram is not negative.",
    rsiPos === false ? "RSI is below 50." : "RSI is not below 50.",
  ].join(" ");
  const neutralWhy =
    "The bullish checklist and the bearish checklist are not both fully true, so the read stays neutral. " +
    trendWhy;

  const bullInvalid = support !== undefined ? `A close below ${fmt(support)} (nearest pivot support).` : `A close below SMA 20 at ${fmt(sma20)}.`;
  const bearInvalid = resistance !== undefined ? `A close above ${fmt(resistance)} (nearest pivot resistance).` : `A close above SMA 20 at ${fmt(sma20)}.`;

  return {
    available: true,
    barCount: candles.length,
    lastTime,
    lastClose: close,
    structure,
    trend: { label: trendLabel, why: trendWhy },
    momentum: {
      why: `${"why" in rsiBlock ? rsiBlock.why : rsiBlock.unavailable} ${"why" in macdBlock ? macdBlock.why : macdBlock.unavailable}`,
    },
    volatility: volBlock,
    rsi: rsiBlock,
    macd: macdBlock,
    movingAverages: {
      sma20,
      sma50,
      ema20,
      why: trendWhy,
    },
    support: levels.support,
    resistance: levels.resistance,
    reads: { bullish: bullishWhy, bearish: bearishWhy, neutral: neutralWhy, active },
    scenarios: {
      bullish: {
        text: resistance
          ? `If price holds above ${support ? fmt(support) : fmt(sma20)}, the next pivot resistance already printed is ${fmt(resistance)}.`
          : `No pivot resistance sits above the last close in this window. The upside reference on the chart is not available from these pivots.`,
        invalidation: bullInvalid,
      },
      bearish: {
        text: support
          ? `If price loses ${fmt(support)}, that level is the nearest pivot support already printed under the close.`
          : `No pivot support sits under the last close in this window.`,
        invalidation: bearInvalid,
      },
    },
    method:
      "Computed only from the loaded OHLC. Swings: high/low greater than 2 bars on each side. Trend and reads: close versus SMA 20 and SMA 50, plus RSI 14 and MACD 12/26/9. Volatility: ATR 14 divided by last close. Support and resistance: clustered pivot highs and lows from findSupportResistance (0.5% spacing). No score is assigned.",
  };
}
