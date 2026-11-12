"use client";

import { useState } from "react";
import { CORE_OVERVIEW_SYMBOLS } from "@/lib/data/mockProvider";
import { marketData } from "@/lib/data/provider";
import { displaySymbol } from "@/lib/data/symbols";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

type Row = { symbol: string; bars: number; status: "ok" | "unavailable" };

export default function ScannerPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const out: Row[] = [];
    for (const s of CORE_OVERVIEW_SYMBOLS) {
      const candles = (await marketData.getCandlesAsync?.(s, "1D", 80)) ?? [];
      out.push({ symbol: s, bars: candles.length, status: candles.length ? "ok" : "unavailable" });
    }
    setRows(out);
    setLoading(false);
  }

  return (
    <div>
      <PageHeader
        title="Pattern Scanner"
        description="Phase 1 loads historical daily bars when Yahoo answers. Pattern matching is not enabled yet — no invented hits."
      />
      <Card>
        <CardHeader>
          <CardTitle>Core book scan</CardTitle>
          <CardDescription>Does not emit fake patterns. Empty means none detected because the engine is not shipped.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={run} loading={loading} disabled={loading}>
            Load bars for core symbols
          </Button>
          {rows === null && (
            <EmptyState
              title="No scan yet"
              description="Run a bar check. Pattern candidates appear in a later phase from those bars only."
            />
          )}
          {rows && (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {rows.map((r) => (
                <li key={r.symbol} className="flex items-center justify-between px-3 py-2 text-[13px]">
                  <span>{displaySymbol(r.symbol)}</span>
                  <span className={r.status === "ok" ? "text-secondary" : "text-down"}>
                    {r.status === "ok" ? `${r.bars} daily bars · 0 pattern hits (engine later)` : "Bars unavailable"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
