"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Gauge,
  Waves,
  ShieldAlert,
  Scale,
  ArrowUpRight,
} from "lucide-react";
import { marketData } from "@/lib/data/provider";
import { useLiveQuotes, useMarketVersion, useMarketStatus } from "@/lib/hooks";
import { ApiDown } from "@/components/ui/api-down";
import { useUiStore } from "@/lib/stores/ui-store";
import {
  rsi,
  macd,
  sma,
  ema,
  atr as atrFn,
  findSupportResistance,
} from "@/lib/indicators";
import { cn, formatPrice, formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SymbolSearch } from "@/components/market/symbol-search";
import { SymbolIcon } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type Signal = "bullish" | "bearish" | "neutral";

interface Metric {
  label: string;
  value: string;
  signal: Signal;
  detail?: string;
}

function SignalIcon({ signal }: { signal: Signal }) {
  if (signal === "bullish") return <TrendingUp className="size-3.5 text-up" />;
  if (signal === "bearish") return <TrendingDown className="size-3.5 text-down" />;
  return <Minus className="size-3.5 text-muted" />;
}

export default function AnalysisPage() {
  const router = useRouter();
  const selectedSymbol = useUiStore((s) => s.selectedSymbol);
  const [symbol, setSymbol] = useState(selectedSymbol);
  const meta = marketData.getSymbol(symbol);
  const quotes = useLiveQuotes([symbol]);
  const quote = quotes.get(symbol);
  const marketVersion = useMarketVersion();
  const marketStatus = useMarketStatus();

  useEffect(() => {
    void marketData.getCandlesAsync?.(symbol, "1D", 220);
  }, [symbol]);

  const candles = useMemo(
    () => marketData.getCandles(symbol, "1D", 220),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [symbol, marketVersion]
  );

  const analysis = useMemo(() => {
    if (candles.length < 60) return null;
    const last = candles[candles.length - 1];
    const price = last.close;
    const s50 = sma(candles, 50);
    const s200 = sma(candles, 200);
    const e20 = ema(candles, 20);
    const e50 = ema(candles, 50);
    const r = rsi(candles, 14);
    const m = macd(candles);
    const a = atrFn(candles, 14);
    const { support, resistance } = findSupportResistance(candles);

    const get = (arr: { value: number }[]) => arr[arr.length - 1]?.value;
    const v50 = get(s50);
    const v200 = get(s200);
    const vE20 = get(e20);
    const vE50 = get(e50);
    const vRsi = get(r);
    const vMacd = m.macd[m.macd.length - 1]?.value;
    const vSignal = m.signal[m.signal.length - 1]?.value;
    const prevMacd = m.macd[m.macd.length - 2]?.value;
    const prevSignal = m.signal[m.signal.length - 2]?.value;
    const vAtr = get(a);
    const atrPct = vAtr ? (vAtr / price) * 100 : 0;

    const volLast5 = candles.slice(-5).reduce((x, c) => x + c.volume, 0) / 5;
    const volPrev20 = candles.slice(-25, -5).reduce((x, c) => x + c.volume, 0) / 20;
    const volRatio = volPrev20 > 0 ? volLast5 / volPrev20 : 1;

    const metrics: Metric[] = [];
    let score = 0;
    let count = 0;

    const add = (label: string, value: string, signal: Signal, detail?: string) => {
      metrics.push({ label, value, signal, detail });
      score += signal === "bullish" ? 1 : signal === "bearish" ? -1 : 0;
      count++;
    };

    // Trend
    if (price > vE50 && vE20 > vE50) {
      add("Trend", "Uptrend", "bullish", `Price above EMA50 · EMA20 > EMA50`);
    } else if (price < vE50 && vE20 < vE50) {
      add("Trend", "Downtrend", "bearish", `Price below EMA50 · EMA20 < EMA50`);
    } else {
      add("Trend", "Sideways", "neutral", "MAs are mixed — no clear direction");
    }

    // Momentum
    if (vRsi > 70) add("Momentum (RSI 14)", `${vRsi.toFixed(1)} — overbought`, "bearish", "Overbought zone, risk of pullback");
    else if (vRsi < 30) add("Momentum (RSI 14)", `${vRsi.toFixed(1)} — oversold`, "bullish", "Oversold zone, potential reversal");
    else if (vRsi >= 55) add("Momentum (RSI 14)", `${vRsi.toFixed(1)} — strong`, "bullish", "Bullish momentum, not overbought");
    else if (vRsi <= 45) add("Momentum (RSI 14)", `${vRsi.toFixed(1)} — weak`, "bearish", "Bearish momentum, not oversold");
    else add("Momentum (RSI 14)", `${vRsi.toFixed(1)} — neutral`, "neutral", "Range-bound momentum");

    // MACD
    if (vMacd > vSignal) {
      add("MACD", "Bullish cross", "bullish", `MACD ${vMacd.toFixed(2)} above signal ${vSignal.toFixed(2)}`);
    } else if (vMacd < vSignal) {
      add("MACD", "Bearish cross", "bearish", `MACD ${vMacd.toFixed(2)} below signal ${vSignal.toFixed(2)}`);
    } else {
      add("MACD", "Flat", "neutral", "MACD and signal converged");
    }

    // Volatility
    if (atrPct > 4) add("Volatility (ATR %)", `${atrPct.toFixed(2)}% — high`, "bearish", "Wide ranges — size positions carefully");
    else if (atrPct < 1.2) add("Volatility (ATR %)", `${atrPct.toFixed(2)}% — low`, "neutral", "Tight ranges — expect a breakout");
    else add("Volatility (ATR %)", `${atrPct.toFixed(2)}% — moderate`, "neutral", "Normal volatility for this asset");

    // Volume
    if (volRatio > 1.25) add("Volume", `${volRatio.toFixed(2)}x average`, "bullish", "Volume expanding vs 20-day average");
    else if (volRatio < 0.75) add("Volume", `${volRatio.toFixed(2)}x average`, "bearish", "Volume contracting");
    else add("Volume", `${volRatio.toFixed(2)}x average`, "neutral", "In line with recent activity");

    // MAs
    if (price > v50 && v50 > v200) add("Moving averages", "Price > SMA50 > SMA200", "bullish", "Golden alignment — long-term uptrend");
    else if (price < v50 && v50 < v200) add("Moving averages", "Price < SMA50 < SMA200", "bearish", "Death alignment — long-term downtrend");
    else add("Moving averages", "Mixed alignment", "neutral", "Price around SMA50");

    // Support/Resistance distance
    const nearestSupport = support[0];
    const nearestResistance = resistance[0];
    const distS = nearestSupport ? ((price - nearestSupport) / price) * 100 : 0;
    const distR = nearestResistance ? ((nearestResistance - price) / price) * 100 : 0;
    if (distS && distS < 2.5) add("Support proximity", `${formatPrice(nearestSupport!)} · ${distS.toFixed(2)}% away`, "bullish", "Price near strong support");
    else if (distR && distR < 2.5) add("Resistance proximity", `${formatPrice(nearestResistance!)} · ${distR.toFixed(2)}% away`, "bearish", "Price near resistance");
    else add("Support / Resistance", "Room to run", "neutral", `S1 ${formatPrice(nearestSupport ?? price)}, R1 ${formatPrice(nearestResistance ?? price)}`);

    const pct = Math.round((score / count) * 50 + 50);
    const rating =
      pct >= 75 ? "Strong Buy" : pct >= 60 ? "Buy" : pct >= 45 ? "Neutral" : pct >= 30 ? "Sell" : "Strong Sell";
    const ratingTone = pct >= 60 ? "success" : pct >= 45 ? "default" : "danger";

    return { metrics, score: pct, rating, ratingTone, price, vRsi, vAtr, atrPct, volRatio, support, resistance, vMacd, vSignal, prevMacd, prevSignal };
  }, [candles]);

  if (!meta || !analysis) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Analysis" description="Automated technical snapshot for any asset." />
        {marketStatus.candles === false ? (
          <ApiDown label="market data unreachable" />
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted">Loading analysis…</CardContent>
          </Card>
        )}
      </div>
    );
  }

  const up = (quote?.changePercent ?? 0) >= 0;

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Analysis"
        description="Automated technical snapshot of the asset — an aid to your own decision-making, never a recommendation."
        actions={
          <div className="w-full sm:w-64">
            <SymbolSearch
              onSelect={(s) => {
                setSymbol(s);
                window.history.pushState(null, "", `/dashboard/analysis?symbol=${s}`);
              }}
              placeholder="Analyze any asset…"
            />
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Summary card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="items-center gap-2.5">
              <SymbolIcon symbol={meta.symbol} color={meta.color} size="sm" />
              {meta.symbol}
              <span className="text-xs font-normal text-muted">{meta.name}</span>
            </CardTitle>
            <CardDescription>
              Daily timeframe · 220 candles · last updated {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative">
              <svg viewBox="0 0 120 120" className="size-36 -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={analysis.score >= 60 ? "#34d399" : analysis.score >= 45 ? "#818cf8" : "#fb7185"}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(analysis.score / 100) * 327} 327`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular">{analysis.score}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted">/ 100</span>
              </div>
            </div>
            <Badge variant={analysis.ratingTone as "success" | "default" | "danger"} className="px-3 py-1 text-[12px]">
              <Gauge className="size-3.5" /> {analysis.rating}
            </Badge>
            <p className="text-center text-[12px] text-secondary">
              Price <b className="text-primary tabular">{formatPrice(analysis.price, meta.decimals)}</b>{" "}
              <span className={up ? "text-up" : "text-down"}>{formatPercent(quote?.changePercent ?? 0)}</span>
            </p>
            <Button
              size="sm"
              className="w-full"
              onClick={() => router.push(`/dashboard/charts?symbol=${meta.symbol}`)}
            >
              <ArrowUpRight className="size-3.5" /> Open full chart
            </Button>
          </CardContent>
        </Card>

        {/* Signals */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Technical signals</CardTitle>
            <CardDescription>Each metric is computed from historical candles only</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2.5 sm:grid-cols-2">
            {analysis.metrics.map((m) => (
              <div
                key={m.label}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3.5 transition-colors",
                  m.signal === "bullish"
                    ? "border-up/25 bg-up-soft/40"
                    : m.signal === "bearish"
                      ? "border-down/25 bg-down-soft/40"
                      : "border-line bg-raised/40"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    m.signal === "bullish"
                      ? "bg-up/15"
                      : m.signal === "bearish"
                        ? "bg-down/15"
                        : "bg-raised"
                  )}
                >
                  <SignalIcon signal={m.signal} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted">{m.label}</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-primary">{m.value}</p>
                  {m.detail && <p className="mt-0.5 text-[11px] leading-snug text-secondary">{m.detail}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Key levels */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-up">
              <TrendingUp className="size-3.5" /> Resistance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {analysis.resistance.length === 0 && <p className="text-xs text-muted">No clear levels</p>}
            {analysis.resistance.map((l, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <span className="text-muted">R{i + 1}</span>
                <span className="font-medium text-primary tabular">{formatPrice(l, meta.decimals)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-down">
              <TrendingDown className="size-3.5" /> Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {analysis.support.length === 0 && <p className="text-xs text-muted">No clear levels</p>}
            {analysis.support.map((l, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <span className="text-muted">S{i + 1}</span>
                <span className="font-medium text-primary tabular">{formatPrice(l, meta.decimals)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <Waves className="size-3.5" /> Volatility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Row label="ATR(14)" value={`${formatPrice(analysis.vAtr, meta.decimals)} (${analysis.atrPct.toFixed(2)}%)`} />
            <Row label="RSI(14)" value={analysis.vRsi.toFixed(1)} />
            <Row label="Volume vs 20d" value={`${analysis.volRatio.toFixed(2)}x`} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <Scale className="size-3.5" /> MACD
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Row label="MACD" value={analysis.vMacd.toFixed(4)} />
            <Row label="Signal" value={analysis.vSignal.toFixed(4)} />
            <Row
              label="Histogram"
              value={((analysis.vMacd ?? 0) - (analysis.vSignal ?? 0)).toFixed(4)}
              tone={
                (analysis.vMacd ?? 0) - (analysis.vSignal ?? 0) >= 0
                  ? "up"
                  : "down"
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-warn/25 bg-warn-soft/30">
        <CardContent className="flex items-start gap-3 py-3.5">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warn" />
          <p className="text-[12px] leading-relaxed text-secondary">
            <b className="text-warn">Not financial advice.</b> This analysis is generated
            automatically from historical prices as an educational aid. Markets can move
            against every indicator — always manage risk with stop losses and position
            sizing. Paper trading only: no real trades are placed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-muted">{label}</span>
      <span className={cn("font-medium text-primary tabular", tone === "up" && "text-up", tone === "down" && "text-down")}>
        {value}
      </span>
    </div>
  );
}