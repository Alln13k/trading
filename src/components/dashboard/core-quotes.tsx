"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CORE_OVERVIEW_SYMBOLS } from "@/lib/data/mockProvider";
import { marketData } from "@/lib/data/provider";
import { displaySymbol } from "@/lib/data/symbols";
import { useLiveQuotes, useMarketStatus, useMarketVersion } from "@/lib/hooks";
import { cn, formatPercent, formatPrice } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiDown } from "@/components/ui/api-down";
import { DataBadge } from "@/components/data/data-badge";
import { Sparkline } from "@/components/ui/sparkline";

const SYMBOLS = [...CORE_OVERVIEW_SYMBOLS];

export function CoreQuotes() {
  const router = useRouter();
  const quotes = useLiveQuotes(SYMBOLS);
  const status = useMarketStatus();
  const version = useMarketVersion();
  const sparks = useMemo(
    () => SYMBOLS.map((s) => marketData.getSparkline(s, 24)),
    [version]
  );

  useEffect(() => {
    for (const s of SYMBOLS) void marketData.getSparklineAsync?.(s, 24);
  }, []);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Market overview</CardTitle>
          <CardDescription>
            BTC/USD, ETH/USD, XAU/USD, EUR/USD and major indices. Delayed Yahoo prints when the
            provider answers; otherwise labeled unavailable.
          </CardDescription>
        </div>
        <DataBadge quality={status.quotes === false ? "unavailable" : "delayed"} />
      </CardHeader>
      {status.quotes === false && quotes.size === 0 ? (
        <CardContent>
          <ApiDown label="quotes unavailable from Yahoo Finance" />
        </CardContent>
      ) : (
        <CardContent className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {SYMBOLS.map((s, i) => {
            const meta = marketData.getSymbol(s);
            const q = quotes.get(s);
            if (!q) {
              return (
                <div key={s} className="rounded-lg border border-line p-3">
                  <p className="text-[12px] font-semibold">{displaySymbol(s)}</p>
                  {status.quotes === false ? (
                    <p className="mt-2 text-[11px] text-down">Unavailable</p>
                  ) : (
                    <Skeleton className="mt-2 h-8" />
                  )}
                </div>
              );
            }
            const up = q.changePercent >= 0;
            return (
              <button
                key={s}
                type="button"
                onClick={() => router.push(`/dashboard/charts?symbol=${s}`)}
                className="rounded-lg border border-line bg-raised/40 p-3 text-left hover:border-line-strong"
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-[12px] font-semibold">{displaySymbol(s)}</p>
                  <DataBadge quality={q.quality} />
                </div>
                <p className="truncate text-[10px] text-secondary">{meta?.name}</p>
                <p className="mt-1 text-[13px] font-semibold tabular">
                  {formatPrice(q.price, Math.min(meta?.decimals ?? 2, 4))}
                </p>
                <p className={cn("text-[11px] font-medium tabular", up ? "text-up" : "text-down")}>
                  {formatPercent(q.changePercent)}
                </p>
                <Sparkline data={sparks[i]} positive={up} width={72} height={22} />
              </button>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
