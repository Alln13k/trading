import { NextResponse } from "next/server";
import type { NewsItem } from "@/lib/types";
import { toLocalSymbol } from "@/lib/data/yahooMap";
import { getSymbolMeta } from "@/lib/data/symbols";

export const dynamic = "force-dynamic";

const NEWS_TICKERS = [
  "BTC-USD",
  "ETH-USD",
  "SOL-USD",
  "NVDA",
  "AAPL",
  "TSLA",
  "META",
  "AMZN",
  "MSFT",
  "EURUSD=X",
  "GC=F",
  "^GSPC",
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

interface YahooNewsItem {
  uuid: string;
  title: string;
  publisher?: string;
  link?: string;
  providerPublishTime?: number;
  summary?: string;
  relatedTickers?: string[];
}

const CATEGORY_OF: Record<string, NewsItem["category"]> = {
  crypto: "Crypto",
  stocks: "Stocks",
  forex: "Forex",
  indices: "Macro",
  commodities: "Economy",
};

async function fetchNewsJson(): Promise<NewsItem[]> {
  const url = `https://query1.finance.yahoo.com/v1/finance/news?symbols=${NEWS_TICKERS.join(",")}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`news HTTP ${res.status}`);
  const json = (await res.json()) as { items?: Record<string, YahooNewsItem> };
  const items = Object.values(json.items ?? {});
  const out: NewsItem[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    if (!it.title || seen.has(it.title)) continue;
    seen.add(it.title);
    const related = (it.relatedTickers ?? []).map(toLocalSymbol).filter((s): s is string => Boolean(s));
    let category: NewsItem["category"] = "Economy";
    let image = "macro";
    for (const ticker of it.relatedTickers ?? []) {
      const local = toLocalSymbol(ticker);
      const meta = local ? getSymbolMeta(local) : undefined;
      if (meta) {
        category = CATEGORY_OF[meta.category] ?? category;
        image = meta.category;
        break;
      }
    }
    const fallbackSymbols =
      it.relatedTickers
        ?.map(toLocalSymbol)
        .filter((s): s is string => Boolean(s))
        .slice(0, 3) ?? [];
    out.push({
      id: it.uuid,
      title: it.title,
      source: it.publisher ?? "Yahoo Finance",
      category,
      summary: (it.summary ?? "").slice(0, 400) || "Read the full story on Yahoo Finance.",
      publishedAt: (it.providerPublishTime ?? Date.now() / 1000) * 1000,
      symbols: related.length ? related : fallbackSymbols,
      image,
    });
  }
  if (out.length === 0) throw new Error("empty news");
  return out.slice(0, 40);
}

/** RSS fallback when the JSON news endpoint is unavailable. */
async function fetchNewsRss(): Promise<NewsItem[]> {
  const res = await fetch(
    `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${NEWS_TICKERS.slice(0, 4).join(",")}&region=US&lang=en-US`,
    { headers: { "User-Agent": UA }, cache: "no-store", signal: AbortSignal.timeout(10_000) }
  );
  if (!res.ok) throw new Error(`rss HTTP ${res.status}`);
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 25);
  const out: NewsItem[] = [];
  for (const [, body] of items) {
    const title = body.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1]?.trim();
    const desc = body.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/)?.[1];
    const pub = body.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
    const link = body.match(/<link>(.*?)<\/link>/)?.[1];
    if (!title) continue;
    out.push({
      id: `rss-${out.length}`,
      title: title.replace(/&amp;/g, "&"),
      source: "Yahoo Finance",
      category: "Economy",
      summary: (desc ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").slice(0, 400),
      publishedAt: pub ? Date.parse(pub) : Date.now(),
      symbols: [],
      image: "macro",
    });
    void link;
  }
  if (out.length === 0) throw new Error("empty rss");
  return out;
}

const cache = new Map<string, { value: NewsItem[]; expires: number }>();
const inflight = new Map<string, Promise<NewsItem[]>>();

export async function GET() {
  const hit = cache.get("news");
  if (hit && hit.expires > Date.now()) return NextResponse.json({ news: hit.value });
  const pending = inflight.get("news");
  if (pending) {
    const news = await pending;
    return NextResponse.json({ news });
  }
  const p = (async () => {
    try {
      return await fetchNewsJson();
    } catch {
      try {
        return await fetchNewsRss();
      } catch {
        return [];
      }
    }
  })();
  inflight.set("news", p);
  try {
    const news = await p;
    if (news.length > 0) cache.set("news", { value: news, expires: Date.now() + 10 * 60_000 });
    return NextResponse.json({ news });
  } finally {
    inflight.delete("news");
  }
}