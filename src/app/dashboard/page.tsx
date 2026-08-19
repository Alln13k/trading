"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Briefcase,
  NotebookPen,
  Trophy,
  Flame,
  ArrowRight,
  Bell,
  Activity,
} from "lucide-react";
import { marketData } from "@/lib/data/provider";
import { useLiveQuotes } from "@/lib/hooks";
import { usePortfolioStore } from "@/lib/stores/portfolio-store";
import { usePositionsStore, positionPnl } from "@/lib/stores/positions-store";
import { useJournalStore } from "@/lib/stores/journal-store";
import { useAlertsStore } from "@/lib/stores/alerts-store";
import { useActivityStore } from "@/lib/stores/activity-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import {
  cn,
  formatCurrency,
  formatPercent,
  formatSignedNumber,
  formatPrice,
  timeAgo,
} from "@/lib/utils";
import { Stat } from "@/components/ui/stat";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, SymbolIcon } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { MarketOverview } from "@/components/dashboard/market-overview";
import { positionPnlPercent } from "@/lib/stores/positions-store";

function useJournalStats() {
  const trades = useJournalStore((s) => s.trades);
  return useMemo(() => {
    const wins = trades.filter((t) => t.result === "win").length;
    const losses = trades.filter((t) => t.result === "loss").length;
    const grossWin = trades.filter((t) => t.pnl > 0).reduce((a, t) => a + t.pnl, 0);
    const grossLoss = Math.abs(trades.filter((t) => t.pnl < 0).reduce((a, t) => a + t.pnl, 0));
    const winRate = trades.length ? (wins / trades.length) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0;
    const best = trades.reduce((a, t) => (t.pnl > a.pnl ? t : a), trades[0]);
    const worst = trades.reduce((a, t) => (t.pnl < a.pnl ? t : a), trades[0]);
    return { trades, wins, losses, winRate, profitFactor, best, worst };
  }, [trades]);
}

export default function DashboardPage() {
  const [ready, setReady] = useState(false);
  const currency = useSettingsStore((s) => s.settings.currency);
  const portfolio = usePortfolioStore();
  const positions = usePositionsStore((s) => s.positions);
  const alerts = useAlertsStore((s) => s.alerts);
  const activity = useActivityStore((s) => s.events);
  const stats = useJournalStats();

  const holdingSymbols = portfolio.holdings.map((h) => h.symbol);
  const quotes = useLiveQuotes([...holdingSymbols, ...positions.map((p) => p.symbol)]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 350);
    return () => clearTimeout(t);
  }, []);

  const holdingValue = useMemo(
    () =>
      portfolio.holdings.reduce((acc, h) => {
        const q = quotes.get(h.symbol);
        return acc + (q ? q.price * h.quantity : h.avgCost * h.quantity);
      }, 0),
    [portfolio.holdings, quotes]
  );

  const holdingsDayPnl = useMemo(
    () =>
      portfolio.holdings.reduce((acc, h) => {
        const q = quotes.get(h.symbol);
        if (!q) return acc;
        return acc + q.change * h.quantity;
      }, 0),
    [portfolio.holdings, quotes]
  );

  const openPnl = positions.reduce((a, p) => a + positionPnl(p), 0);
  const totalValue = portfolio.cash + holdingValue;
  const totalPnl = totalValue - portfolio.initialCapital;
  const totalReturn = (totalPnl / portfolio.initialCapital) * 100;
  const dayPnl = holdingsDayPnl + openPnl;
  const dayPnlPct = totalValue ? (dayPnl / (totalValue - dayPnl)) * 100 : 0;

  useEffect(() => {
    if (ready) {
      portfolio.updateEquity(
        new Date().toISOString().slice(0, 10),
        Math.round(totalValue * 100) / 100,
        Math.round(portfolio.cash * 100) / 100
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, totalValue, portfolio.cash]);

  const bestTrade = stats.best;
  const worstTrade = stats.worst;

  const equityData = portfolio.equityHistory.slice(-30);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {!ready ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Stat
              label="Portfolio value"
              value={formatCurrency(totalValue, currency)}
              delta={`${formatSignedNumber(totalReturn)}%`}
              deltaPositive={totalReturn >= 0}
              icon={<Wallet />}
              hint={`Initial capital ${formatCurrency(portfolio.initialCapital, currency)}`}
            />
            <Stat
              label="P&L today"
              value={`${dayPnl >= 0 ? "+" : ""}${formatCurrency(dayPnl, currency)}`}
              delta={formatPercent(dayPnlPct)}
              deltaPositive={dayPnl >= 0}
              icon={<TrendingUp />}
              hint="Holdings + open positions"
            />
            <Stat
              label="Total P&L"
              value={`${totalPnl >= 0 ? "+" : ""}${formatCurrency(totalPnl, currency)}`}
              delta={`${formatSignedNumber(totalReturn)}%`}
              deltaPositive={totalPnl >= 0}
              icon={<ArrowUpRight />}
            />
            <Stat
              label="Open positions"
              value={positions.length}
              delta={`${openPnl >= 0 ? "+" : ""}${formatCurrency(openPnl, currency)}`}
              deltaPositive={openPnl >= 0}
              icon={<Briefcase />}
              hint="Paper trading"
            />
            <Stat
              label="Trades"
              value={stats.trades.length}
              delta={`${formatSignedNumber(stats.winRate)}% win`}
              deltaPositive={stats.winRate >= 50}
              icon={<NotebookPen />}
            />
            <Stat
              label="Best trade"
              value={
                bestTrade
                  ? `+${formatCurrency(bestTrade.pnl, currency)}`
                  : "—"
              }
              delta={bestTrade ? bestTrade.symbol : undefined}
              deltaPositive
              icon={<Trophy />}
            />
            <Stat
              label="Worst trade"
              value={
                worstTrade
                  ? `-${formatCurrency(Math.abs(worstTrade.pnl), currency)}`
                  : "—"
              }
              delta={worstTrade ? worstTrade.symbol : undefined}
              deltaPositive={false}
              icon={<Flame />}
            />
            <Stat
              label="Profit factor"
              value={stats.profitFactor.toFixed(2)}
              delta={stats.profitFactor >= 1 ? "healthy" : "watch"}
              deltaPositive={stats.profitFactor >= 1}
              icon={<Activity />}
            />
          </>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Market overview */}
        <div className="xl:col-span-2">
          <MarketOverview ready={ready} />
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio equity</CardTitle>
              <CardDescription>Paper account · $100,000 virtual balance</CardDescription>
            </CardHeader>
            <CardContent>
              {!ready ? (
                <Skeleton className="h-36" />
              ) : (
                <svg viewBox="0 0 300 120" className="h-36 w-full">
                  <defs>
                    <linearGradient id="dashEq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <Path data={equityData} />
                </svg>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Recent activity</CardTitle>
              <Link
                href="/dashboard/settings"
                className="text-[11px] text-accent-bright hover:underline"
              >
                Manage
              </Link>
            </CardHeader>
            <CardContent className="space-y-1">
              {activity.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-raised">
                  <Avatar name={e.userName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] leading-snug text-secondary">
                      <span className="font-semibold text-primary">{e.userName}</span> {e.action}{" "}
                      <span className="text-accent-bright">{e.target}</span>
                    </p>
                    <p className="text-[10px] text-muted">{timeAgo(e.timestamp)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Alerts</CardTitle>
              <Link
                href="/dashboard/alerts"
                className="text-[11px] text-accent-bright hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center gap-2.5 rounded-lg border border-line bg-raised/40 px-3 py-2">
                  <Bell className={cn("size-3.5", a.active ? "text-accent-bright" : "text-muted")} />
                  <p className="flex-1 truncate text-[12px] text-secondary">
                    <span className="font-semibold text-primary">{a.symbol}</span>{" "}
                    {a.type.replace(/_/g, " ")} {a.value.toLocaleString()}
                  </p>
                  <Badge variant={a.active ? "success" : "muted"}>{a.active ? "Active" : "Off"}</Badge>
                </div>
              ))}
              {alerts.length === 0 && (
                <EmptyState title="No alerts" description="Create your first alert to never miss a move." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Holdings + open positions */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Holdings</CardTitle>
              <CardDescription>Virtual portfolio assets</CardDescription>
            </div>
            <Link href="/dashboard/portfolio">
              <Button variant="ghost" size="sm">
                Portfolio <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {portfolio.holdings.length === 0 ? (
              <EmptyState
                title="No holdings yet"
                description="Add your first asset to start tracking a virtual portfolio."
                action={
                  <Link href="/dashboard/portfolio">
                    <Button size="sm">Add asset</Button>
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-line">
                {portfolio.holdings.slice(0, 5).map((h) => {
                  const meta = marketData.getSymbol(h.symbol);
                  const q = quotes.get(h.symbol);
                  const pnl = q ? (q.price - h.avgCost) * h.quantity : 0;
                  const pnlPct = q ? ((q.price - h.avgCost) / h.avgCost) * 100 : 0;
                  return (
                    <div key={h.symbol} className="flex items-center gap-3 py-2.5">
                      <SymbolIcon symbol={h.symbol} color={meta?.color} size="sm" />
                      <div className="w-20 min-w-0">
                        <p className="text-[13px] font-semibold text-primary">{h.symbol}</p>
                        <p className="text-[10px] text-muted">{h.quantity} units</p>
                      </div>
                      <div className="flex-1 text-right tabular">
                        <p className="text-[12px] font-medium text-primary">
                          {q ? formatCurrency(q.price * h.quantity, currency) : "—"}
                        </p>
                        <p className={cn("text-[11px] font-medium", pnl >= 0 ? "text-up" : "text-down")}>
                          {formatSignedNumber(pnlPct)}%
                        </p>
                      </div>
                      <span
                        className={cn(
                          "w-20 text-right text-[12px] font-semibold tabular",
                          pnl >= 0 ? "text-up" : "text-down"
                        )}
                      >
                        {pnl >= 0 ? "+" : ""}
                        {formatCurrency(pnl, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Open positions</CardTitle>
              <CardDescription>Paper trades in progress</CardDescription>
            </div>
            <Link href="/dashboard/positions">
              <Button variant="ghost" size="sm">
                Positions <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {positions.length === 0 ? (
              <EmptyState
                title="No open positions"
                description="Open a paper trade on any market from the positions page."
                action={
                  <Link href="/dashboard/positions">
                    <Button size="sm">Open a trade</Button>
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-line">
                {positions.slice(0, 4).map((p) => {
                  const meta = marketData.getSymbol(p.symbol);
                  const pnl = positionPnl(p);
                  const pct = positionPnlPercent(p);
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-2.5">
                      <SymbolIcon symbol={p.symbol} color={meta?.color} size="sm" />
                      <div className="w-24 min-w-0">
                        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                          {p.symbol}
                          <Badge variant={p.direction === "long" ? "success" : "danger"}>
                            {p.direction}
                          </Badge>
                        </p>
                        <p className="text-[10px] text-muted">@ {formatPrice(p.entryPrice)}</p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-[11px] text-muted">
                          by <span className="font-medium text-secondary">{p.userName}</span>
                        </p>
                      </div>
                      <div className="text-right tabular">
                        <p className={cn("text-[12px] font-semibold", pnl >= 0 ? "text-up" : "text-down")}>
                          {pnl >= 0 ? "+" : ""}
                          {formatCurrency(pnl, currency)}
                        </p>
                        <p className={cn("text-[11px] font-medium", pnl >= 0 ? "text-up" : "text-down")}>
                          {formatSignedNumber(pct)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[11px] text-muted">
        NexTrade uses live market data for prices and charts — trading is paper-only and this is not financial advice.
      </p>
    </div>
  );
}

function Path({ data }: { data: Array<{ value: number }> }) {
  if (data.length < 2) return null;
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const range = max - min || 1;
  const w = 300;
  const h = 120;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 8 - ((d.value - min) / range) * (h - 20);
    return [x, y] as const;
  });
  const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <>
      <path d={area} fill="url(#dashEq)" />
      <path d={path} fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill="#818cf8" />
    </>
  );
}