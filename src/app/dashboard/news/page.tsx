"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Newspaper, Clock } from "lucide-react";
import { marketData } from "@/lib/data/provider";
import type { NewsItem } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { useMarketStatus } from "@/lib/hooks";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/segmented";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiDown } from "@/components/ui/api-down";
import { SymbolIcon } from "@/components/ui/avatar";

const CATEGORIES = ["All", "Crypto", "Stocks", "Forex", "Macro", "Economy", "Technology"] as const;

const IMAGE_STYLES: Record<string, { gradient: string; icon: string }> = {
  crypto: { gradient: "from-orange-500/30 via-amber-500/10 to-transparent", icon: "₿" },
  tech: { gradient: "from-cyan-500/30 via-blue-500/10 to-transparent", icon: "⌘" },
  macro: { gradient: "from-violet-500/30 via-indigo-500/10 to-transparent", icon: "🌍" },
  stocks: { gradient: "from-emerald-500/30 via-teal-500/10 to-transparent", icon: "📈" },
  forex: { gradient: "from-sky-500/30 via-blue-500/10 to-transparent", icon: "💱" },
};

export default function NewsPage() {
  const router = useRouter();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    let alive = true;
    marketData.getNewsAsync?.().then((items) => {
      if (!alive) return;
      setNews(items);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = category === "All" ? news : news.filter((n) => n.category === category);
  const newsDown = useMarketStatus().news === false;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="News"
        description="Curated financial headlines — live from Yahoo Finance. Follow the story behind the move."
      />

      {newsDown && <ApiDown label="news feed unavailable" className="mb-4" />}

      <Tabs
        className="mb-4"
        value={category}
        onChange={setCategory}
        tabs={CATEGORIES.map((c) => ({ value: c, label: c }))}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-32 rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </Card>
          ))}
        {!loading &&
          filtered.map((n) => {
            const style = IMAGE_STYLES[n.image] ?? IMAGE_STYLES.macro;
            return (
              <Card
                key={n.id}
                className="group flex flex-col overflow-hidden transition-all duration-200 hover:border-accent/40"
              >
                <div
                  className={`relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br ${style.gradient}`}
                >
                  <div className="grid-bg absolute inset-0 opacity-40" />
                  <span className="relative text-4xl opacity-60">{style.icon}</span>
                  <Badge variant="accent" className="absolute left-3 top-3">
                    {n.category}
                  </Badge>
                  <span className="absolute bottom-2 right-3 flex items-center gap-1 text-[10px] text-muted">
                    <Clock className="size-3" /> {timeAgo(n.publishedAt)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-2 text-[10px] text-muted">
                    <span className="font-semibold text-secondary">{n.source}</span>
                  </div>
                  <h3 className="mt-1.5 text-[13.5px] font-semibold leading-snug text-primary transition-colors group-hover:text-accent-bright">
                    {n.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-secondary">
                    {n.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {n.symbols.slice(0, 3).map((s) => {
                      const meta = marketData.getSymbol(s);
                      return (
                        <button
                          key={s}
                          onClick={() => router.push(`/dashboard/charts?symbol=${s}`)}
                          className="flex items-center gap-1.5 rounded-md border border-line bg-raised/50 px-1.5 py-0.5 text-[10px] text-secondary transition-colors hover:border-accent/40 hover:text-primary"
                        >
                          <SymbolIcon symbol={s} color={meta?.color} size="xs" />
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        {!loading && filtered.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3">
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Newspaper className="size-6 text-muted" />
              <p className="text-sm text-secondary">No articles in this category yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}