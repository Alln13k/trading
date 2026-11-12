"use client";

import { useEffect, useState } from "react";
import { CORE_OVERVIEW_SYMBOLS } from "@/lib/data/mockProvider";
import { CHART_TIMEFRAMES } from "@/lib/data/candleEngine";
import { displaySymbol } from "@/lib/data/symbols";
import { marketData } from "@/lib/data/provider";
import type { Timeframe } from "@/lib/types";
import { analyzeCandles, type AnalysisResult } from "@/lib/analysis/snapshot";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataBadge } from "@/components/data/data-badge";
import { formatPrice } from "@/lib/utils";

const SYMBOLS = [...CORE_OVERVIEW_SYMBOLS];

export default function AnalyzerPage() {
  const [symbol, setSymbol] = useState("BTC");
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [quality, setQuality] = useState<"delayed" | "cached" | "unavailable" | "loading">("loading");

  useEffect(() => {
    let cancel = false;
    setQuality("loading");
    setResult(null);
    void (async () => {
      const candles = (await marketData.getCandlesAsync?.(symbol, timeframe, 240)) ?? [];
      if (cancel) return;
      const q = marketData.getCandleQuality?.(symbol, timeframe);
      if (!candles.length) {
        setQuality("unavailable");
        setResult({ available: false, reason: "Unavailable — Yahoo did not return candles for this instrument and timeframe." });
        return;
      }
      setQuality(q === "cached" ? "cached" : "delayed");
      setResult(analyzeCandles(candles));
    })();
    return () => {
      cancel = true;
    };
  }, [symbol, timeframe]);

  const meta = marketData.getSymbol(symbol);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Market Analyzer"
        description="Scenarios from the loaded candles. Not a forecast and not a trade signal."
      />
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Instrument</CardTitle>
            <CardDescription>{meta?.name}. Same Yahoo candle route as Charts.</CardDescription>
          </div>
          {quality === "loading" ? (
            <span className="text-[10px] font-semibold uppercase text-secondary">Loading</span>
          ) : (
            <DataBadge quality={quality} />
          )}
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <select
            className="h-9 rounded-lg border border-line bg-raised px-3 text-sm"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {displaySymbol(s)}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-lg border border-line bg-raised px-3 text-sm"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
          >
            {CHART_TIMEFRAMES.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {result && !result.available && (
        <Card>
          <CardContent className="py-4 text-[13px] text-down">{result.reason}</CardContent>
        </Card>
      )}

      {result && result.available && (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <Fact title="Structure" body={"label" in result.structure ? `${result.structure.label}. ${result.structure.why}` : result.structure.unavailable} />
            <Fact title={`Trend · ${result.trend.label}`} body={result.trend.why} />
            <Fact title="Momentum" body={result.momentum.why} />
            <Fact
              title="Volatility"
              body={"why" in result.volatility ? result.volatility.why : result.volatility.unavailable}
            />
            <Fact title="RSI" body={"why" in result.rsi ? result.rsi.why : result.rsi.unavailable} />
            <Fact title="MACD" body={"why" in result.macd ? result.macd.why : result.macd.unavailable} />
            <Fact title="Moving averages" body={result.movingAverages.why} />
            <Fact
              title="Support / resistance"
              body={
                result.support.length + result.resistance.length === 0
                  ? "No clustered pivot levels on either side of the last close."
                  : `Support: ${result.support.map((n) => formatPrice(n, meta?.decimals)).join(", ") || "none"}. Resistance: ${result.resistance.map((n) => formatPrice(n, meta?.decimals)).join(", ") || "none"}.`
              }
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Reads</CardTitle>
              <CardDescription>
                Active read from the checklist: {result.reads.active}. Each side is spelled out so a missing condition stays visible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-[13px] leading-relaxed text-secondary">
              <p><span className="font-medium text-primary">Bullish why. </span>{result.reads.bullish}</p>
              <p><span className="font-medium text-primary">Bearish why. </span>{result.reads.bearish}</p>
              <p><span className="font-medium text-primary">Neutral why. </span>{result.reads.neutral}</p>
            </CardContent>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bullish scenario</CardTitle>
                <CardDescription>If/then from printed levels. Not a prediction.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-[13px] text-secondary">
                <p>{result.scenarios.bullish.text}</p>
                <p><span className="font-medium text-primary">Invalidation. </span>{result.scenarios.bullish.invalidation}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Bearish scenario</CardTitle>
                <CardDescription>If/then from printed levels. Not a prediction.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-[13px] text-secondary">
                <p>{result.scenarios.bearish.text}</p>
                <p><span className="font-medium text-primary">Invalidation. </span>{result.scenarios.bearish.invalidation}</p>
              </CardContent>
            </Card>
          </div>
          <p className="text-[12px] leading-relaxed text-secondary">{result.method} Last close {formatPrice(result.lastClose, meta?.decimals)} on {result.barCount} bars.</p>
        </>
      )}
    </div>
  );
}

function Fact({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-[13px] leading-relaxed text-secondary">{body}</CardContent>
    </Card>
  );
}
