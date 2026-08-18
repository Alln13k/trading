"use client";

import { marketData } from "@/lib/data/provider";
import { formatPercent, formatPrice } from "@/lib/utils";
import { useLiveQuotes } from "@/lib/hooks";
import { useUiStore } from "@/lib/stores/ui-store";

export function PriceTicker({ symbols }: { symbols: string[] }) {
  const quotes = useLiveQuotes(symbols);
  const setSelectedSymbol = useUiStore((s) => s.setSelectedSymbol);

  return (
    <div className="relative flex h-9 items-center overflow-hidden border-b border-line bg-surface/60">
      <div className="ticker-track flex shrink-0 items-center">
        {[...symbols, ...symbols].map((s, i) => {
          const meta = marketData.getSymbol(s);
          const q = quotes.get(s);
          if (!meta || !q) return null;
          return (
            <button
              key={`${s}-${i}`}
              onClick={() => setSelectedSymbol(s)}
              className="group flex items-center gap-2 border-r border-line px-4 py-1.5 transition-colors hover:bg-raised"
            >
              <span className="text-[11px] font-semibold text-secondary group-hover:text-primary">
                {meta.symbol}
              </span>
              <span className="text-[11px] font-medium text-primary tabular">
                {formatPrice(q.price, Math.min(meta.decimals, 4))}
              </span>
              <span
                className={`text-[11px] font-medium tabular ${
                  q.changePercent >= 0 ? "text-up" : "text-down"
                }`}
              >
                {formatPercent(q.changePercent)}
              </span>
            </button>
          );
        })}
      </div>
      <style jsx>{`
        .ticker-track {
          animation: ticker 60s linear infinite;
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}