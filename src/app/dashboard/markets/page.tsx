"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Search } from "lucide-react";
import { marketData } from "@/lib/data/provider";
import type { Category, SymbolMeta } from "@/lib/types";
import { useLiveQuotes, useMarketVersion, useMarketStatus } from "@/lib/hooks";
import { useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/segmented";
import { QuoteRow } from "@/components/market/quote-row";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiDown } from "@/components/ui/api-down";

type SortKey = "price" | "change" | "volume" | "name";

export default function MarketsPage() {
  const router = useRouter();
  const [category, setCategory] = useState<"all" | Category>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("change");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const symbols: SymbolMeta[] = useMemo(() => {
    let list = category === "all" ? marketData.search(query) : marketData.getByCategory(category);
    if (category !== "all" && query) {
      list = list.filter((s) =>
        (s.symbol + s.name).toLowerCase().includes(query.toLowerCase())
      );
    }
    return list;
  }, [category, query]);

  const symbolList = symbols.map((s) => s.symbol);
  const symbolListKey = symbolList.join(",");
  const quotes = useLiveQuotes(symbolList);
  const marketVersion = useMarketVersion();
  const sparkCache = useMemo(() => {
    const m = new Map<string, number[]>();
    for (const s of symbolList) m.set(s, marketData.getSparkline(s, 24));
    return m;
  }, [symbolListKey, marketVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ids = symbolList.slice(0, 40);
    for (const s of ids) void marketData.getSparklineAsync?.(s, 24);
  }, [symbolListKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => {
    const arr = symbols
      .map((s) => ({ meta: s, quote: quotes.get(s.symbol) }))
      .filter((r) => r.quote)
      .sort((a, b) => {
        const qa = a.quote!;
        const qb = b.quote!;
        let v = 0;
        if (sortKey === "price") v = qa.price - qb.price;
        else if (sortKey === "change") v = qa.changePercent - qb.changePercent;
        else if (sortKey === "volume") v = qa.volume - qb.volume;
        else v = a.meta.symbol.localeCompare(b.meta.symbol);
        return v * sortDir;
      });
    return arr;
  }, [symbols, quotes, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(-1);
    }
  };

  const loading = quotes.size < symbols.length * 0.5;
  const marketStatus = useMarketStatus();
  const quotesDown = marketStatus.quotes === false;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Markets"
        description="Browse every asset available on the platform — crypto, forex, stocks, indices and commodities."
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter symbols…"
              className="h-9 w-full rounded-lg border border-line bg-raised/60 pl-9 pr-3 text-sm text-primary placeholder:text-muted focus:border-accent/60 focus:ring-glow"
            />
          </div>
        }
      />

      {quotesDown && <ApiDown label="quotes unavailable" className="mb-4" />}

      <Tabs
        className="mb-4"
        value={category}
        onChange={setCategory}
        tabs={[
          { value: "all", label: "All" },
          { value: "crypto", label: "Crypto" },
          { value: "forex", label: "Forex" },
          { value: "stocks", label: "Stocks" },
          { value: "indices", label: "Indices" },
          { value: "commodities", label: "Commodities" },
        ]}
      />

      <Card>
        <CardContent className="p-0">
          <div className="hidden items-center gap-3 border-b border-line px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted md:flex">
            <span className="w-44 sm:w-52">Asset</span>
            <span className="w-24">Last 24h</span>
            <span className="flex-1" />
            <button onClick={() => toggleSort("price")} className="flex w-28 items-center gap-1 hover:text-secondary">
              Price <ArrowUpDown className="size-3" />
            </button>
            <button onClick={() => toggleSort("change")} className="flex w-16 items-center gap-1 hover:text-secondary">
              Change <ArrowUpDown className="size-3" />
            </button>
            <button onClick={() => toggleSort("change")} className="flex hidden w-16 items-center gap-1 hover:text-secondary lg:flex">
              24h <ArrowUpDown className="size-3" />
            </button>
            <button onClick={() => toggleSort("volume")} className="flex hidden w-24 items-center gap-1 hover:text-secondary xl:flex">
              Volume <ArrowUpDown className="size-3" />
            </button>
            <span className="w-7" />
          </div>
          <div className="max-h-[62vh] divide-y divide-line overflow-y-auto">
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <Skeleton className="size-6 rounded-lg" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="ml-auto h-4 w-24" />
                </div>
              ))}
            {!loading &&
              rows.map(({ meta, quote }) => (
                <QuoteRow
                  key={meta.symbol}
                  symbol={meta.symbol}
                  quote={quote!}
                  spark={sparkCache.get(meta.symbol)}
                  onSelect={(s) => router.push(`/dashboard/charts?symbol=${s}`)}
                />
              ))}
            {!loading && rows.length === 0 && (
              <p className="px-4 py-12 text-center text-xs text-muted">
                No assets match your filters.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}