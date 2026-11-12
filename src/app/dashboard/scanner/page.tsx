"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CORE_OVERVIEW_SYMBOLS } from "@/lib/data/mockProvider";
import { CHART_TIMEFRAMES } from "@/lib/data/candleEngine";
import { marketData } from "@/lib/data/provider";
import { displaySymbol } from "@/lib/data/symbols";
import type { Timeframe } from "@/lib/types";
import { SCAN_RULES, scanCandles, type ScanHit, type ScanRuleId } from "@/lib/analysis/scan";
import { isChartRule } from "@/lib/analysis/chart-patterns";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

const SYMBOLS = [...CORE_OVERVIEW_SYMBOLS];

function formatPx(n: number): string {
  const abs = Math.abs(n);
  const digits = abs >= 100 ? 2 : abs >= 1 ? 4 : 5;
  return n.toFixed(digits);
}

export default function ScannerPage() {
  return (
    <Suspense fallback={<p className="text-sm text-secondary">Loading scanner…</p>}>
      <ScannerInner />
    </Suspense>
  );
}

function ScannerInner() {
  const ruleQuery = useSearchParams().get("rule");
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [sensitivity, setSensitivity] = useState(3);
  const [hits, setHits] = useState<ScanHit[] | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const found: ScanHit[] = [];
    const failed: string[] = [];
    const loaded = await Promise.all(
      SYMBOLS.map(async (symbol) => ({
        symbol,
        candles: (await marketData.getCandlesAsync?.(symbol, timeframe, 180)) ?? [],
      }))
    );
    for (const { symbol, candles } of loaded) {
      if (!candles.length) {
        failed.push(symbol);
        continue;
      }
      found.push(...scanCandles(symbol, timeframe, candles, sensitivity));
    }
    found.sort((a, b) => b.timestamp - a.timestamp);
    setHits(found);
    setMissing(failed);
    setLoading(false);
  }

  useEffect(() => {
    void run();
    // Initial load only. Sensitivity and timeframe changes wait for Scan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filter = ruleQuery && ruleQuery in SCAN_RULES ? (ruleQuery as ScanRuleId) : null;
  const shown = hits?.filter((h) => (filter ? h.ruleId === filter : true)) ?? null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pattern Scanner"
        description="Heuristic candidates on loaded OHLCV. Not predictions. Unconfirmed hits stay in the list."
      />
      <Card>
        <CardHeader>
          <CardTitle>Scan the core book</CardTitle>
          <CardDescription>
            Candle shapes, swing marks, and multi-bar structures on the bars that loaded. Sensitivity 1 is stricter. These are candidates, not predictions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <label className="text-[12px] text-secondary">
            Timeframe
            <select
              className="mt-1 block h-9 rounded-lg border border-line bg-raised px-3 text-sm text-primary"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            >
              {CHART_TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[12px] text-secondary">
            Sensitivity {sensitivity}
            <input
              type="range"
              min={1}
              max={5}
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="mt-2 block w-40"
            />
          </label>
          <Button onClick={run} loading={loading} disabled={loading}>
            Scan loaded bars
          </Button>
          {filter && (
            <p className="text-[12px] text-secondary">
              Showing rule <span className="text-primary">{SCAN_RULES[filter].label}</span> only.
            </p>
          )}
        </CardContent>
      </Card>

      {shown === null && (
        <EmptyState title="No scan yet" description="Run a scan. Empty after a run means no candidate matched these bars." />
      )}
      {shown && shown.length === 0 && (
        <EmptyState
          title="No candidates"
          description={missing.length ? `No hits. Bars unavailable for ${missing.map(displaySymbol).join(", ")}.` : "The loaded bars did not match the scanner rules at this sensitivity."}
        />
      )}
      {shown && shown.length > 0 && (
        <div className="space-y-2">
          {missing.length > 0 && (
            <p className="text-[12px] text-down">Bars unavailable: {missing.map(displaySymbol).join(", ")}. Those instruments were not scanned.</p>
          )}
          {[...shown.filter((h) => isChartRule(h.ruleId)), ...shown.filter((h) => !isChartRule(h.ruleId)).slice(0, 40)].map((h, i) => (
            <Card key={`${h.symbol}-${h.timestamp}-${h.name}-${i}`}>
              <CardHeader>
                <CardTitle>
                  {displaySymbol(h.symbol)} · {h.timeframe} · {h.name}
                </CardTitle>
                <CardDescription>
                  {new Date(h.timestamp * 1000).toISOString()} · {h.confirmation}
                  {h.confirmation === "unconfirmed" ? " — kept visible, not dropped as a false positive" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-[13px] text-secondary">
                <p>{h.explanation}</p>
                <p>
                  {h.priceLevels.map((p) => `${p.label} ${formatPx(p.price)}`).join(" · ")}
                </p>
                <p className="text-[12px]">{SCAN_RULES[h.ruleId].method}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
