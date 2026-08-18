import type {
  Candle,
  EconomicEvent,
  NewsItem,
  Quote,
  SymbolMeta,
  Timeframe,
} from "@/lib/types";
import { MockMarketDataProvider, type MarketDataProvider } from "@/lib/data/mockProvider";
import { getSymbolMeta, getSymbolsByCategory, searchSymbols } from "@/lib/data/symbols";
import { marketEvents } from "@/lib/data/marketEvents";

/**
 * Live provider: quotes, candles, news and calendar are fetched from the app's
 * own API routes (which proxy Yahoo Finance / Forex Factory with caching and
 * deterministic demo fallback). Sync getters return the last known values
 * (demo fallback on first load) so the UI never blocks; async methods warm the
 * caches and emit marketEvents so components refresh.
 */

export class RealMarketDataProvider implements MarketDataProvider {
  readonly name = "Live — Yahoo Finance";
  readonly isDemo = false;

  private quotesCache = new Map<string, Quote>();
  private candlesCache = new Map<string, Candle[]>();
  private sparkCache = new Map<string, number[]>();
  private news: NewsItem[] = [];
  private calendar: EconomicEvent[] = [];
  private liveOk = true;
  private readonly fallback = new MockMarketDataProvider();

  async getQuotesAsync(symbols: string[]): Promise<Map<string, Quote>> {
    try {
      const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(symbols.join(","))}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as { quotes?: Quote[] };
      const map = new Map<string, Quote>();
      for (const q of json.quotes ?? []) {
        map.set(q.symbol, q);
        this.quotesCache.set(q.symbol, q);
      }
      this.liveOk = json.quotes ? json.quotes.length > 0 : false;
      return map;
    } catch {
      this.liveOk = false;
      const map = new Map<string, Quote>();
      for (const s of symbols) map.set(s, this.getQuote(s));
      return map;
    }
  }

  async getCandlesAsync(symbol: string, timeframe: Timeframe, count = 400): Promise<Candle[]> {
    const key = `${symbol}:${timeframe}`;
    try {
      const res = await fetch(
        `/api/market/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&count=${count}`,
        { cache: "no-store" }
      );
      const json = (await res.json()) as { candles?: Candle[] };
      if (json.candles && json.candles.length > 0) {
        this.candlesCache.set(key, json.candles);
        this.sparkCache.delete(symbol);
        marketEvents.emit();
        return json.candles;
      }
      throw new Error("empty candles");
    } catch {
      const c = this.fallback.getCandles(symbol, timeframe, count);
      this.candlesCache.set(key, c);
      return c;
    }
  }

  async getSparklineAsync(symbol: string, points = 24): Promise<number[]> {
    const candles = await this.getCandlesAsync(symbol, "15m", points + 2);
    const values = candles.slice(-points).map((c) => c.close);
    this.sparkCache.set(symbol, values);
    marketEvents.emit();
    return values;
  }

  async getNewsAsync(): Promise<NewsItem[]> {
    try {
      const res = await fetch("/api/market/news", { cache: "no-store" });
      const json = (await res.json()) as { news?: NewsItem[] };
      if (json.news && json.news.length > 0) {
        this.news = json.news;
        return this.news;
      }
      throw new Error("empty news");
    } catch {
      this.news = this.fallback.getNews();
      return this.news;
    }
  }

  async getEconomicCalendarAsync(): Promise<EconomicEvent[]> {
    try {
      const res = await fetch("/api/market/calendar", { cache: "no-store" });
      const json = (await res.json()) as { events?: EconomicEvent[] };
      if (json.events && json.events.length > 0) {
        this.calendar = json.events;
        return this.calendar;
      }
      throw new Error("empty calendar");
    } catch {
      this.calendar = this.fallback.getEconomicCalendar();
      return this.calendar;
    }
  }

  hasLiveCandles(symbol: string, timeframe: Timeframe): boolean {
    return this.candlesCache.has(`${symbol}:${timeframe}`);
  }

  get liveDataOk() {
    return this.liveOk;
  }

  // ---- sync interface (cache-first, demo fallback) ----

  getQuote(symbol: string): Quote {
    return this.quotesCache.get(symbol) ?? this.fallback.getQuote(symbol);
  }

  getQuotes(symbols: string[]): Map<string, Quote> {
    const map = new Map<string, Quote>();
    for (const s of symbols) map.set(s, this.getQuote(s));
    return map;
  }

  getCandles(symbol: string, timeframe: Timeframe, count = 400): Candle[] {
    const cached = this.candlesCache.get(`${symbol}:${timeframe}`);
    if (cached) return cached.slice(-count);
    return this.fallback.getCandles(symbol, timeframe, count);
  }

  getSparkline(symbol: string, points = 28): number[] {
    const cached = this.sparkCache.get(symbol);
    if (cached) return cached.slice(-points);
    return this.fallback.getSparkline(symbol, points);
  }

  search(query: string): SymbolMeta[] {
    return searchSymbols(query);
  }

  getSymbol(symbol: string): SymbolMeta | undefined {
    return getSymbolMeta(symbol);
  }

  getByCategory(category: SymbolMeta["category"]): SymbolMeta[] {
    return getSymbolsByCategory(category);
  }

  getNews(): NewsItem[] {
    return this.news.length > 0 ? this.news : this.fallback.getNews();
  }

  getEconomicCalendar(): EconomicEvent[] {
    return this.calendar.length > 0 ? this.calendar : this.fallback.getEconomicCalendar();
  }
}