"use client";

import { Star } from "lucide-react";
import { marketData } from "@/lib/data/provider";
import { formatPercent, formatPrice, formatCompact, cn } from "@/lib/utils";
import { Sparkline } from "@/components/ui/sparkline";
import { SymbolIcon } from "@/components/ui/avatar";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { useActivityStore } from "@/lib/stores/activity-store";
import { useCurrentUser } from "@/lib/stores/settings-store";

export function QuoteRow({
  symbol,
  quote,
  spark,
  onSelect,
  compact,
}: {
  symbol: string;
  quote: { price: number; changePercent: number; change: number; volume: number };
  spark?: number[];
  onSelect?: (symbol: string) => void;
  compact?: boolean;
}) {
  const meta = marketData.getSymbol(symbol);
  const up = quote.changePercent >= 0;
  const color = up ? "text-up" : "text-down";

  return (
    <div
      onClick={() => onSelect?.(symbol)}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-raised/60",
        onSelect && "cursor-pointer"
      )}
    >
      <div className="flex w-44 min-w-0 items-center gap-2.5 sm:w-52">
        <SymbolIcon symbol={symbol} color={meta?.color} size="sm" />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-primary">{meta?.symbol ?? symbol}</p>
          {!compact && (
            <p className="truncate text-[11px] text-muted">{meta?.name}</p>
          )}
        </div>
      </div>
      {spark && (
        <div className="hidden w-24 md:block">
          <Sparkline data={spark} positive={up} width={88} height={28} />
        </div>
      )}
      <div className="flex flex-1 items-center justify-end gap-3 text-right tabular">
        <span className={cn("text-[13px] font-medium text-primary", !compact && "w-28")}>
          {formatPrice(quote.price, Math.min(meta?.decimals ?? 2, 4))}
        </span>
        <span className={cn("w-16 text-[12px] font-medium", color)}>
          {formatPercent(quote.changePercent)}
        </span>
        <span className={cn("hidden w-16 text-[12px] font-medium lg:block", color)}>
          {quote.change >= 0 ? "+" : ""}
          {formatPrice(quote.change, Math.min(meta?.decimals ?? 2, 4))}
        </span>
        {!compact && (
          <span className="hidden w-24 text-[11px] text-muted xl:block">
            {formatCompact(quote.volume)}
          </span>
        )}
        <WatchlistToggle symbol={symbol} />
      </div>
    </div>
  );
}

export function WatchlistToggle({
  symbol,
  size = "md",
}: {
  symbol: string;
  size?: "sm" | "md";
}) {
  const watchlists = useWatchlistStore((s) => s.watchlists);
  const toggle = useWatchlistStore((s) => s.toggleSymbolInAll);
  const push = useToastStore((s) => s.push);
  const currentUser = useCurrentUser();
  const addEvent = useActivityStore((s) => s.addEvent);

  const inAny = watchlists.some((w) => w.symbols.includes(symbol));
  const primary = watchlists.find((w) => w.symbols.includes(symbol));

  return (
    <button
      type="button"
      title={inAny ? `In ${primary?.name}` : "Add to watchlist"}
      onClick={(e) => {
        e.stopPropagation();
        toggle(symbol);
        const added = !inAny;
        push(
          added ? `Added ${symbol} to watchlist` : `Removed ${symbol} from watchlist`,
          "success",
          added ? primary?.name : undefined
        );
        if (added) {
          addEvent({
            userName: currentUser.name,
            userId: currentUser.id,
            action: "added",
            target: `${symbol} to a watchlist`,
            kind: "watchlist",
          });
        }
      }}
      className={cn(
        "flex items-center justify-center rounded-md text-muted transition-all hover:bg-raised hover:text-warn",
        size === "sm" ? "size-6" : "size-7"
      )}
    >
      <Star
        className={cn("size-3.5", inAny && "fill-warn text-warn")}
      />
    </button>
  );
}