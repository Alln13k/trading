import type { Candle, DataQuality, EconomicEvent, NewsItem, Quote, SymbolMeta, Timeframe } from "@/lib/types";

/**
 * Status of the live data feeds. `null` = not fetched yet (loading),
 * `true` = last fetch succeeded, `false` = API unreachable.
 */
export type MarketDataStatus = {
  quotes: boolean | null;
  candles: boolean | null;
  news: boolean | null;
  calendar: boolean | null;
};

export interface MarketDataProvider {
  readonly name: string;
  readonly isDemo: boolean;
  readonly status: MarketDataStatus;
  getQuote(symbol: string): Quote | undefined;
  getQuotes(symbols: string[]): Map<string, Quote>;
  getCandles(symbol: string, timeframe: Timeframe, count?: number): Candle[];
  getSparkline(symbol: string, points?: number): number[];
  search(query: string): SymbolMeta[];
  getSymbol(symbol: string): SymbolMeta | undefined;
  getByCategory(category: SymbolMeta["category"]): SymbolMeta[];
  getNews(): NewsItem[];
  getEconomicCalendar(): EconomicEvent[];
  // Async accessors — warm the caches and refresh `status`; they never return
  // fabricated data, they return whatever the live sources actually provided.
  getQuotesAsync?(symbols: string[]): Promise<Map<string, Quote>>;
  getCandlesAsync?(symbol: string, timeframe: Timeframe, count?: number): Promise<Candle[]>;
  getSparklineAsync?(symbol: string, points?: number): Promise<number[]>;
  getNewsAsync?(): Promise<NewsItem[]>;
  getEconomicCalendarAsync?(): Promise<EconomicEvent[]>;
  hasLiveCandles?(symbol: string, timeframe: Timeframe): boolean;
  /** delayed after a successful fetch, cached if a later fetch failed, null if never loaded. */
  getCandleQuality?(symbol: string, timeframe: Timeframe): DataQuality | null;
}

/** Overview core book — labels in UI: BTC/USD, ETH/USD, XAU/USD, EUR/USD + indices. */
export const CORE_OVERVIEW_SYMBOLS = [
  "BTC",
  "ETH",
  "GOLD",
  "EURUSD",
  "SPX",
  "NDX",
  "DJI",
  "DAX",
  "FTSE",
  "NIKKEI",
] as const;

export const DEFAULT_MARKET_SYMBOLS = [...CORE_OVERVIEW_SYMBOLS];