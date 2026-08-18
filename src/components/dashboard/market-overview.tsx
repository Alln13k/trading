"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { DEFAULT_MARKET_SYMBOLS } from "@/lib/data/mockProvider";
import { marketData } from "@/lib/data/provider";
import { useLiveQuotes, useMarketVersion } from "@/lib/hooks";
import { cn, formatPercent, formatPrice } from "@/lib/utils";
import { Sparkline } from "@/components/ui/sparkline";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function MarketOverview({ ready }: { ready: boolean }) {
  const router = useRouter();
  const quotes = useLiveQuotes(DEFAULT_MARKET_SYMBOLS);
  const marketVersion = useMarketVersion();
  const sparks = useMemo(
    () => DEFAULT_MARKET_SYMBOLS.map((s) => marketData.getSparkline(s, 24)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [marketVersion]
  );

  useEffect(() => {
    for (const s of DEFAULT_MARKET_SYMBOLS) void marketData.getSparklineAsync?.(s, 24);
  }, []);

  if (!ready) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Market Overview</CardTitle>
        <button
          onClick={() => router.push("/dashboard/markets")}
          className="text-[11px] font-medium text-accent-bright transition-colors hover:text-accent"
        >
          View all markets →
        </button>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-4">
        {DEFAULT_MARKET_SYMBOLS.map((s, i) => {
          const meta = marketData.getSymbol(s);
          const q = quotes.get(s);
          const up = (q?.changePercent ?? 0) >= 0;
          if (!meta || !q) return <Skeleton key={s} className="h-20" />;
          return (
            <button
              key={s}
              onClick={() => router.push(`/dashboard/charts?symbol=${s}`)}
              className="group rounded-xl border border-line bg-raised/40 p-3 text-left transition-all hover:border-accent/40 hover:bg-raised"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-primary">{meta.symbol}</p>
                  <p className="truncate text-[10px] text-muted">{meta.name}</p>
                </div>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md",
                    up ? "bg-up-soft text-up" : "bg-down-soft text-down"
                  )}
                >
                  {up ? (
                    <ArrowUpRight className="size-3" />
                  ) : q.changePercent === 0 ? (
                    <Minus className="size-3" />
                  ) : (
                    <ArrowDownRight className="size-3" />
                  )}
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <div>
                  <p className="text-[13px] font-semibold text-primary tabular">
                    {formatPrice(q.price, Math.min(meta.decimals, 4))}
                  </p>
                  <p className={cn("mt-0.5 text-[10px] font-medium tabular", up ? "text-up" : "text-down")}>
                    {formatPercent(q.changePercent)}
                  </p>
                </div>
                <Sparkline data={sparks[i]} positive={up} width={64} height={26} />
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function TrendBadge({ changePercent }: { changePercent: number }) {
  const trend = changePercent > 0.5 ? "Bullish" : changePercent < -0.5 ? "Bearish" : "Neutral";
  const variant =
    changePercent > 0.5 ? "success" : changePercent < -0.5 ? "danger" : "default";
  return <Badge variant={variant}>{trend}</Badge>;
}