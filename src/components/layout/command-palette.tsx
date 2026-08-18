"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CornerDownLeft,
  LayoutDashboard,
  CandlestickChart,
  BarChart3,
  Star,
  Briefcase,
  ArrowLeftRight,
  NotebookPen,
  Bell,
  Newspaper,
  CalendarClock,
  ScanSearch,
  Settings,
  Plus,
} from "lucide-react";
import { marketData } from "@/lib/data/provider";
import { useUiStore } from "@/lib/stores/ui-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";
import { useActivityStore } from "@/lib/stores/activity-store";
import { useCurrentUser } from "@/lib/stores/settings-store";
import { cn, formatPercent, formatPrice } from "@/lib/utils";
import { SymbolIcon } from "@/components/ui/avatar";
import { CATEGORY_LABELS } from "@/lib/data/symbols";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, keywords: "home overview" },
  { href: "/dashboard/markets", label: "Markets", icon: BarChart3, keywords: "prices market" },
  { href: "/dashboard/charts", label: "Charts", icon: CandlestickChart, keywords: "graph chart candles" },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: Star, keywords: "watch list" },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: Briefcase, keywords: "holdings assets" },
  { href: "/dashboard/positions", label: "Positions", icon: ArrowLeftRight, keywords: "paper trade open" },
  { href: "/dashboard/journal", label: "Trade Journal", icon: NotebookPen, keywords: "journal notes log" },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell, keywords: "notifications alert" },
  { href: "/dashboard/news", label: "News", icon: Newspaper, keywords: "news headlines" },
  { href: "/dashboard/calendar", label: "Economic Calendar", icon: CalendarClock, keywords: "calendar events eco" },
  { href: "/dashboard/analysis", label: "Analysis", icon: ScanSearch, keywords: "analysis technical" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, keywords: "settings preferences" },
];

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setIndex(0);
    }
  }
  const inputRef = useRef<HTMLInputElement>(null);
  const push = useToastStore((s) => s.push);
  const addToWatchlist = useWatchlistStore((s) => s.addSymbol);
  const watchlists = useWatchlistStore((s) => s.watchlists);
  const addEvent = useActivityStore((s) => s.addEvent);
  const currentUser = useCurrentUser();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const symbols = q ? marketData.search(q) : [];
  const navs = NAV_ITEMS.filter(
    (n) => !q || n.label.toLowerCase().includes(q) || n.keywords.includes(q)
  ).slice(0, 6);
  const addAction = !q
    ? []
    : [{ label: `Add ${query.trim().toUpperCase()} to watchlist`, keywords: "add" }];

  const items = [
    ...(q ? symbols.map((s) => ({ type: "symbol" as const, symbol: s.symbol })) : []),
    ...navs.map((n) => ({ type: "nav" as const, href: n.href, label: n.label, icon: n.icon })),
    ...addAction.map(() => ({ type: "add" as const })),
  ];

  const run = (item: (typeof items)[number]) => {
    if (item.type === "symbol") {
      const sym = item.symbol;
      router.push(`/dashboard/charts?symbol=${sym}`);
      setOpen(false);
    } else if (item.type === "nav") {
      router.push(item.href);
      setOpen(false);
    } else {
      const sym = query.trim().toUpperCase();
      const wl = watchlists[0];
      if (wl) {
        if (addToWatchlist(wl.id, sym)) {
          push(`Added ${sym} to ${wl.name}`, "success");
          addEvent({
            userName: currentUser.name,
            userId: currentUser.id,
            action: "added",
            target: `${sym} to ${wl.name}`,
            kind: "watchlist",
          });
        } else {
          push(`${sym} already in ${wl.name}`, "info");
        }
      }
      setOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center pt-[12vh]">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-10 w-[min(92vw,560px)] overflow-hidden rounded-2xl border border-line bg-overlay/98 shadow-2xl shadow-black/70 animate-scale-in">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(i + 1, items.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (items[index]) run(items[index]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder="Search symbols, pages…"
            className="h-12 flex-1 bg-transparent text-sm text-primary placeholder:text-muted focus:outline-none"
          />
          <kbd className="rounded border border-line bg-raised px-1.5 py-0.5 text-[10px] text-muted">ESC</kbd>
        </div>
        <div className="max-h-[46vh] overflow-y-auto p-2">
          {items.length === 0 && (
            <p className="px-3 py-8 text-center text-xs text-muted">
              No results for “{query}”
            </p>
          )}
          {items.map((item, i) => {
            if (item.type === "symbol") {
              const meta = marketData.getSymbol(item.symbol);
              const quote = marketData.getQuote(item.symbol);
              if (!meta) return null;
              return (
                <button
                  key={item.symbol}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => run(item)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left",
                    i === index && "bg-raised"
                  )}
                >
                  <SymbolIcon symbol={meta.symbol} color={meta.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[13px] font-semibold text-primary">{meta.symbol}</span>
                    <span className="ml-2 text-[11px] text-muted">{meta.name}</span>
                  </div>
                  <span className="rounded bg-raised px-1.5 py-0.5 text-[10px] text-muted">
                    {CATEGORY_LABELS[meta.category]}
                  </span>
                  <span className="text-right tabular">
                    <span className="block text-xs font-medium text-primary">
                      {formatPrice(quote.price, Math.min(meta.decimals, 4))}
                    </span>
                    <span className={quote.changePercent >= 0 ? "text-[11px] text-up" : "text-[11px] text-down"}>
                      {formatPercent(quote.changePercent)}
                    </span>
                  </span>
                </button>
              );
            }
            if (item.type === "nav") {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => run(item)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left",
                    i === index && "bg-raised"
                  )}
                >
                  <Icon className="size-4 text-muted" />
                  <span className="flex-1 text-[13px] font-medium text-primary">{item.label}</span>
                  <CornerDownLeft className="size-3 text-muted" />
                </button>
              );
            }
            return (
              <button
                key="add"
                onMouseEnter={() => setIndex(i)}
                onClick={() => run(item)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left",
                  i === index && "bg-raised"
                )}
              >
                <Plus className="size-4 text-up" />
                <span className="text-[13px] font-medium text-primary">
                  Add {query.trim().toUpperCase()} to watchlist
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 border-t border-line bg-raised/40 px-4 py-2 text-[10px] text-muted">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-line bg-surface px-1">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-line bg-surface px-1">↵</kbd> open
          </span>
          <span className="ml-auto">Ctrl+K anywhere</span>
        </div>
      </div>
    </div>
  );
}