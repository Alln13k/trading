"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import { marketData } from "@/lib/data/provider";
import { CATEGORY_LABELS, TRENDING_SYMBOLS } from "@/lib/data/symbols";
import type { Quote, SymbolMeta } from "@/lib/types";
import { formatPercent, formatPrice, cn } from "@/lib/utils";
import { SymbolIcon } from "@/components/ui/avatar";
import { useLiveQuotes } from "@/lib/hooks";
import { useOnClickOutside } from "@/lib/hooks";

export function SymbolSearch({
  onSelect,
  placeholder = "Search markets…",
  autoFocus,
  large,
}: {
  onSelect: (symbol: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  large?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevQ, setPrevQ] = useState(query);
  if (query !== prevQ) {
    setPrevQ(query);
    setSelectedIndex(0);
  }
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const q = query.trim();
  const results = useMemo<SymbolMeta[]>(() => (q ? marketData.search(q) : []), [q]);
  const quoteSymbols = [...TRENDING_SYMBOLS, ...results.map((r) => r.symbol)];
  const quotes = useLiveQuotes(quoteSymbols);
  const trendingQuotes = useLiveQuotes(TRENDING_SYMBOLS);

  useOnClickOutside(ref, () => setOpen(false), open);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const pick = (symbol: string) => {
    onSelect(symbol);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const trending = TRENDING_SYMBOLS.slice(0, 5);

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelectedIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const s = results[selectedIndex] ?? trending[0];
              if (s) pick(s.symbol);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-lg border border-line bg-raised/60 text-primary placeholder:text-muted transition-colors focus:border-accent/60 focus:ring-glow",
            large ? "h-10 pl-9 pr-3 text-sm" : "h-8.5 pl-9 pr-3 text-xs"
          )}
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-raised px-1.5 py-0.5 text-[10px] text-muted sm:block">
          ⌘K
        </kbd>
      </div>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-line bg-overlay/98 shadow-2xl shadow-black/60 backdrop-blur animate-scale-in">
          {query.trim() ? (
            <div className="max-h-80 overflow-y-auto p-1">
              {results.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-muted">
                  No results for “{query}”
                </p>
              )}
              {results.map((r, i) => (
                <button
                  key={r.symbol}
                  onMouseEnter={() => setSelectedIndex(i)}
                  onClick={() => pick(r.symbol)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                    i === selectedIndex ? "bg-raised" : ""
                  )}
                >
                  <SymbolIcon symbol={r.symbol} color={r.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] font-semibold text-primary">{r.symbol}</span>
                      <span className="truncate text-[11px] text-muted">{r.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <QuoteCell quotes={quotes} symbol={r.symbol} decimals={r.decimals} />
                  </div>
                  <span className="rounded bg-raised px-1.5 py-0.5 text-[10px] text-muted">
                    {CATEGORY_LABELS[r.category]}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2">
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Trending
              </p>
              {trending.map((s) => {
                const meta = marketData.getSymbol(s);
                if (!meta) return null;
                return (
                  <button
                    key={s}
                    onClick={() => pick(s)}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-raised"
                  >
                    <SymbolIcon symbol={s} color={meta.color} size="sm" />
                    <div className="flex-1">
                      <span className="text-[13px] font-semibold text-primary">{meta.symbol}</span>
                      <span className="ml-2 text-[11px] text-muted">{meta.name}</span>
                    </div>
                    <QuoteCell quotes={trendingQuotes} symbol={s} decimals={meta.decimals} />
                    <TrendingUp className="size-3.5 text-up" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuoteCell({ quotes, symbol, decimals }: { quotes: Map<string, Quote>; symbol: string; decimals: number }) {
  const q = quotes.get(symbol);
  if (!q) return <span className="text-[11px] text-muted">—</span>;
  return (
    <div className="tabular">
      <p className="text-xs font-medium text-primary">
        {formatPrice(q.price, Math.min(decimals, 4))}
      </p>
      <p className={q.changePercent >= 0 ? "text-[11px] text-up" : "text-[11px] text-down"}>
        {formatPercent(q.changePercent)}
      </p>
    </div>
  );
}