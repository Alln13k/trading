"use client";

import { useState } from "react";
import { CORE_OVERVIEW_SYMBOLS } from "@/lib/data/mockProvider";
import { displaySymbol } from "@/lib/data/symbols";
import { marketData } from "@/lib/data/provider";
import { useLiveQuotes, useMarketStatus } from "@/lib/hooks";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataBadge } from "@/components/data/data-badge";
import { formatPercent, formatPrice } from "@/lib/utils";
import { ApiDown } from "@/components/ui/api-down";

const SYMBOLS = [...CORE_OVERVIEW_SYMBOLS];

export default function AnalyzerPage() {
  const [symbol, setSymbol] = useState("BTC");
  const quotes = useLiveQuotes(SYMBOLS);
  const status = useMarketStatus();
  const q = quotes.get(symbol);
  const meta = marketData.getSymbol(symbol);

  return (
    <div>
      <PageHeader
        title="Market Analyzer"
        description="Observations only. Indicator scenarios ship in a later phase. Nothing here is a forecast or a guarantee."
      />
      <Card>
        <CardHeader>
          <CardTitle>Instrument</CardTitle>
          <CardDescription>Uses the same delayed Yahoo quotes as Overview.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          {status.quotes === false && !q && <ApiDown label="no quote for analyzer" />}
          {q ? (
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <p className="text-[11px] text-secondary">{meta?.name}</p>
                <p className="text-2xl font-semibold tabular">{formatPrice(q.price, meta?.decimals)}</p>
                <p className="text-sm tabular">{formatPercent(q.changePercent)}</p>
              </div>
              <DataBadge quality={q.quality} />
            </div>
          ) : status.quotes !== false ? (
            <p className="text-sm text-secondary">Loading quote…</p>
          ) : null}
          <p className="text-[13px] leading-relaxed text-secondary">
            Technical snapshot (trend, RSI, levels) is not computed in Phase 1. When it ships, each
            output will be labeled as a scenario built from historical bars — never as a prediction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
