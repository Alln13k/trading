"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";
import { useLiveQuotes, useMarketStatus } from "@/lib/hooks";
import { marketData } from "@/lib/data/provider";
import { displaySymbol, searchSymbols } from "@/lib/data/symbols";
import { cn, formatPercent, formatPrice } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { DataBadge } from "@/components/data/data-badge";
import { useCurrentUser } from "@/lib/stores/settings-store";

export function WatchlistPanel() {
  const lists = useWatchlistStore((s) => s.watchlists);
  const addSymbol = useWatchlistStore((s) => s.addSymbol);
  const removeSymbol = useWatchlistStore((s) => s.removeSymbol);
  const addWatchlist = useWatchlistStore((s) => s.addWatchlist);
  const user = useCurrentUser();
  const [activeId, setActiveId] = useState(lists[0]?.id ?? "");
  const list = lists.find((w) => w.id === activeId) ?? lists[0];
  const symbols = list?.symbols ?? [];
  const quotes = useLiveQuotes(symbols, symbols.length > 0);
  const status = useMarketStatus();
  const [q, setQ] = useState("");
  const hits = useMemo(() => (q.trim() ? searchSymbols(q, 6) : []), [q]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watchlist</CardTitle>
        <CardDescription>
          Local lists for both users on this machine. Prices follow the same delayed provider as
          Overview — never invented.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {lists.length === 0 ? (
          <EmptyState
            title="No watchlist"
            description="Create Core to track the default book."
            action={
              <Button
                size="sm"
                onClick={() => addWatchlist("Core", "Default book", user.id, user.name)}
              >
                Create list
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {lists.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setActiveId(w.id)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium",
                    (list?.id === w.id ? "bg-accent-soft text-accent" : "bg-raised text-secondary")
                  )}
                >
                  {w.name}
                </button>
              ))}
            </div>
            {status.quotes === false && (
              <p className="text-[11px] text-down">Quote feed unavailable — rows show last cache if any.</p>
            )}
            <div className="divide-y divide-line rounded-lg border border-line">
              {symbols.length === 0 && (
                <p className="px-3 py-6 text-center text-[12px] text-secondary">
                  Empty list. Search below to add a symbol.
                </p>
              )}
              {symbols.map((s) => {
                const quote = quotes.get(s);
                const meta = marketData.getSymbol(s);
                return (
                  <div key={s} className="flex items-center gap-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold">{displaySymbol(s)}</p>
                      <p className="truncate text-[10px] text-secondary">{meta?.name}</p>
                    </div>
                    {quote ? (
                      <div className="text-right">
                        <p className="text-[12px] tabular">{formatPrice(quote.price, meta?.decimals)}</p>
                        <p
                          className={cn(
                            "text-[10px] tabular",
                            quote.changePercent >= 0 ? "text-up" : "text-down"
                          )}
                        >
                          {formatPercent(quote.changePercent)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[11px] text-secondary">—</span>
                    )}
                    {quote && <DataBadge quality={quote.quality} />}
                    <button
                      type="button"
                      aria-label={`Remove ${s}`}
                      className="text-muted hover:text-down"
                      onClick={() => list && removeSymbol(list.id, s)}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="relative">
              <Input
                placeholder="Add symbol…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {hits.length > 0 && list && (
                <ul className="absolute z-10 mt-1 w-full rounded-lg border border-line bg-surface p-1">
                  {hits.map((h) => (
                    <li key={h.symbol}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] hover:bg-raised"
                        onClick={() => {
                          addSymbol(list.id, h.symbol);
                          setQ("");
                        }}
                      >
                        <span>{displaySymbol(h.symbol)}</span>
                        <Plus className="size-3 text-secondary" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
