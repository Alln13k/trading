import type {
  Candle,
  EconomicEvent,
  NewsItem,
  Quote,
  SymbolMeta,
  Timeframe,
} from "@/lib/types";
import type { MarketDataProvider, MarketDataStatus } from "@/lib/data/mockProvider";
import { getSymbolMeta, getSymbolsByCategory, searchSymbols } from "@/lib/data/symbols";
import { marketEvents } from "@/lib/data/marketEvents";

/**
 * Live provider: quotes, candles, news and calendar come from the app's own
 * API routes (which proxy Yahoo Finance / Forex Factory with caching). When a
 * source is unreachable the corresponding `status` flag turns `false` and the
 * sync getters return only what was already fetched — never fabricated data.
 * Components surface the failure with a red "No data API" state.
 */

export class RealMarketDataProvider implements MarketDataProvider {
  readonly name = "Live — Yahoo Finance";
  readonly isDemo = false;

  private quotesCache = new Map<string, Quote>();
  private candlesCache = new Map<string, Candle[]>();
  private sparkCache = new Map<string, number[]>();
  private news: NewsItem[] = [];
  private calendar: EconomicEvent[] = [];
  private _status: MarketDataStatus = {
    quotes: null,
    candles: null,
    news: null,
    calendar: null,
  };

  get status(): MarketDataStatus {
    return this._status;
  }

  async getQuotesAsync(symbols: string[]): Promise<Map<string, Quote>> {
    try {
      const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(symbols.join(","))}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as { ok?: boolean; quotes?: Quote[] };
      if (!json.ok || !json.quotes) throw new Error("quotes unavailable");
      const map = new Map<string, Quote>();
      for (const q of json.quotes) {
        map.set(q.symbol, q);
        this.quotesCache.set(q.symbol, q);
      }
      this._status = { ...this._status, quotes: true };
      marketEvents.emit();
      return map;
    } catch {
      this._status = { ...this._status, quotes: false };
      marketEvents.emit();
      const map = new Map<string, Quote>();
      for (const s of symbols) {
        const cached = this.quotesCache.get(s);
        if (cached) map.set(s, cached);
      }
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
      const json = (await res.json()) as { ok?: boolean; candles?: Candle[] };
      if (!json.ok || !json.candles || json.candles.length === 0) throw new Error("candles unavailable");
      this.candlesCache.set(key, json.candles);
      this.sparkCache.delete(symbol);
      this._status = { ...this._status, candles: true };
      marketEvents.emit();
      return json.candles;
    } catch {
      this._status = { ...this._status, candles: false };
      marketEvents.emit();
      return [];
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
      const json = (await res.json()) as { ok?: boolean; news?: NewsItem[] };
      if (!json.ok || !json.news || json.news.length === 0) throw new Error("news unavailable");
      this.news = json.news;
      this._status = { ...this._status, news: true };
      marketEvents.emit();
      return this.news;
    } catch {
      this._status = { ...this._status, news: false };
      marketEvents.emit();
      return [];
    }
  }

  async getEconomicCalendarAsync(): Promise<EconomicEvent[]> {
    try {
      const res = await fetch("/api/market/calendar", { cache: "no-store" });
      const json = (await res.json()) as { ok?: boolean; events?: EconomicEvent[] };
      if (!json.ok || !json.events || json.events.length === 0) throw new Error("calendar unavailable");
      this.calendar = json.events;
      this._status = { ...this._status, calendar: true };
      marketEvents.emit();
      return this.calendar;
    } catch {
      this._status = { ...this._status, calendar: false };
      marketEvents.emit();
      return [];
    }
  }

  hasLiveCandles(symbol: string, timeframe: Timeframe): boolean {
    return this.candlesCache.has(`${symbol}:${timeframe}`);
  }

  // ---- sync interface (cache-first, empty when nothing was fetched) ----

  getQuote(symbol: string): Quote | undefined {
    return this.quotesCache.get(symbol);
  }

  getQuotes(symbols: string[]): Map<string, Quote> {
    const map = new Map<string, Quote>();
    for (const s of symbols) {
      const q = this.quotesCache.get(s);
      if (q) map.set(s, q);
    }
    return map;
  }

  getCandles(symbol: string, timeframe: Timeframe, count = 400): Candle[] {
    const cached = this.candlesCache.get(`${symbol}:${timeframe}`);
    return cached ? cached.slice(-count) : [];
  }

  getSparkline(symbol: string, points = 28): number[] {
    const cached = this.sparkCache.get(symbol);
    return cached ? cached.slice(-points) : [];
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
    return this.news;
  }

  getEconomicCalendar(): EconomicEvent[] {
    return this.calendar;
  }
}