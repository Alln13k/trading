"use client";

import { useMemo, useState } from "react";
import { usePaperStore } from "@/lib/stores/paper-store";
import { performanceStats } from "@/lib/paper/math";
import { displaySymbol } from "@/lib/data/symbols";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default function PerformancePage() {
  const closed = usePaperStore((s) => s.closed);
  const starting = usePaperStore((s) => s.settings.startingBalance);
  const [symbol, setSymbol] = useState("all");
  const [strategy, setStrategy] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const symbols = useMemo(() => Array.from(new Set(closed.map((t) => t.symbol))), [closed]);
  const strategies = useMemo(
    () => Array.from(new Set(closed.map((t) => t.strategyName).filter((n): n is string => !!n))),
    [closed]
  );

  const filtered = useMemo(() => {
    const fromMs = from ? new Date(from).getTime() : null;
    const toMs = to ? new Date(to).getTime() + 86_400_000 : null;
    return closed.filter((t) => {
      if (symbol !== "all" && t.symbol !== symbol) return false;
      if (strategy !== "all" && (t.strategyName ?? "") !== strategy) return false;
      if (fromMs !== null && t.closedAt < fromMs) return false;
      if (toMs !== null && t.closedAt >= toMs) return false;
      return true;
    });
  }, [closed, symbol, strategy, from, to]);

  const stats = useMemo(
    () =>
      performanceStats(
        starting,
        filtered.map((t) => ({
          symbol: t.symbol,
          strategyId: t.strategyId,
          strategyName: t.strategyName,
          closedAt: t.closedAt,
          pnl: t.pnl,
          rMultiple: t.rMultiple,
        }))
      ),
    [filtered, starting]
  );

  return (
    <div>
      <PageHeader
        title="Performance"
        description="Computed only from closed paper trades in this browser. Win rate is not profitability."
      />
      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <Select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
          <option value="all">All instruments</option>
          {symbols.map((s) => (
            <option key={s} value={s}>{displaySymbol(s)}</option>
          ))}
        </Select>
        <Select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
          <option value="all">All strategies</option>
          {strategies.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
      </div>
      <p className="mb-4 text-sm text-secondary" data-testid="win-rate-note">
        Win rate is not profitability. A high win rate can still lose money if the average loss is larger than the average win.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="performance-stats">
        <Metric label="Trades" value={String(stats.count)} />
        <Metric label="Wins" value={String(stats.wins)} />
        <Metric label="Losses" value={String(stats.losses)} />
        <Metric label="Win rate" value={stats.winRate === null ? "—" : formatPercent(stats.winRate * 100, false)} />
        <Metric label="Average R" value={stats.averageR === null ? "—" : stats.averageR.toFixed(2)} hint={`${stats.rSample} with a stop`} />
        <Metric label="Profit factor" value={stats.profitFactor === null ? "undefined" : stats.profitFactor.toFixed(2)} hint="Gross wins / gross losses" />
        <Metric label="Net P&L" value={formatCurrency(stats.netPnl)} />
        <Metric
          label="Max drawdown"
          value={formatCurrency(stats.maxDrawdown)}
          hint={stats.maxDrawdownPct === null ? "Peak was 0" : `${(stats.maxDrawdownPct * 100).toFixed(2)}% of peak`}
        />
        <Metric label="Average win" value={stats.averageWin === null ? "—" : formatCurrency(stats.averageWin)} />
        <Metric label="Average loss" value={stats.averageLoss === null ? "—" : formatCurrency(stats.averageLoss)} />
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Equity over time</CardTitle>
          <CardDescription>
            Starts at the paper starting balance, then adds each closed trade&apos;s net P&amp;L in time order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EquityChart points={stats.equity} />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="tabular">{value}</CardTitle>
        {hint && <p className="text-[11px] text-muted">{hint}</p>}
      </CardHeader>
    </Card>
  );
}

function EquityChart({ points }: { points: Array<{ at: number; equity: number }> }) {
  const width = 640;
  const height = 160;
  const pad = 8;
  const values = points.map((p) => p.equity);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const coords = points.map((p, i) => {
    const x = pad + (i / Math.max(1, points.length - 1)) * (width - pad * 2);
    const y = height - pad - ((p.equity - min) / span) * (height - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label="Equity curve">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" className="text-accent" points={coords.join(" ")} />
    </svg>
  );
}
