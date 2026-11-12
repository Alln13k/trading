"use client";

import { useMemo } from "react";
import { useJournalStore } from "@/lib/stores/journal-store";
import { usePositionsStore, positionPnl } from "@/lib/stores/positions-store";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";

export default function PerformancePage() {
  const trades = useJournalStore((s) => s.trades);
  const positions = usePositionsStore((s) => s.positions);

  const stats = useMemo(() => {
    if (!trades.length) return null;
    const wins = trades.filter((t) => t.pnl > 0);
    const losses = trades.filter((t) => t.pnl < 0);
    const grossWin = wins.reduce((a, t) => a + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
    return {
      n: trades.length,
      winRate: (wins.length / trades.length) * 100,
      pnl: trades.reduce((a, t) => a + t.pnl, 0),
      pf: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
    };
  }, [trades]);

  const openPnl = positions.reduce((a, p) => a + positionPnl(p), 0);

  return (
    <div>
      <PageHeader
        title="Performance"
        description="Computed only from your journal and open paper positions. Empty until you log trades. Not a broker statement."
      />
      {!stats ? (
        <EmptyState
          title="No closed trades"
          description="Log fills in Trading Journal. Open paper P&L below uses delayed marks when quotes exist."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Trades</CardDescription>
              <CardTitle>{stats.n}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Win rate</CardDescription>
              <CardTitle>{stats.winRate.toFixed(1)}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Net P&L (journal)</CardDescription>
              <CardTitle className="tabular">{formatCurrency(stats.pnl)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Profit factor</CardDescription>
              <CardTitle>{Number.isFinite(stats.pf) ? stats.pf.toFixed(2) : "—"}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Open paper P&L</CardTitle>
          <CardDescription>
            {positions.length} position(s). Marks follow Yahoo when available; otherwise last cached
            price on the position.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-lg font-semibold tabular">{formatCurrency(openPnl)}</CardContent>
      </Card>
    </div>
  );
}
