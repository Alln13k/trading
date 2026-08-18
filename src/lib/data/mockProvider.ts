import type {
  Candle,
  EconomicEvent,
  NewsItem,
  Quote,
  SymbolMeta,
  Timeframe,
} from "@/lib/types";
import { searchSymbols, getSymbolMeta, getSymbolsByCategory } from "@/lib/data/symbols";
import { generateCandles, getLiveQuote, getSparkline } from "@/lib/data/candleEngine";
import { hashString, mulberry32 } from "@/lib/utils";

export interface MarketDataProvider {
  readonly name: string;
  readonly isDemo: boolean;
  getQuote(symbol: string): Quote;
  getQuotes(symbols: string[]): Map<string, Quote>;
  getCandles(symbol: string, timeframe: Timeframe, count?: number): Candle[];
  getSparkline(symbol: string, points?: number): number[];
  search(query: string): SymbolMeta[];
  getSymbol(symbol: string): SymbolMeta | undefined;
  getByCategory(category: SymbolMeta["category"]): SymbolMeta[];
  getNews(): NewsItem[];
  getEconomicCalendar(): EconomicEvent[];
  // Optional async accessors — live providers implement these; mock defaults
  // to the sync implementations.
  getQuotesAsync?(symbols: string[]): Promise<Map<string, Quote>>;
  getCandlesAsync?(symbol: string, timeframe: Timeframe, count?: number): Promise<Candle[]>;
  getSparklineAsync?(symbol: string, points?: number): Promise<number[]>;
  getNewsAsync?(): Promise<NewsItem[]>;
  getEconomicCalendarAsync?(): Promise<EconomicEvent[]>;
  hasLiveCandles?(symbol: string, timeframe: Timeframe): boolean;
}

const HOUR = 3600_000;
const DAY = 24 * HOUR;

function relHours(h: number) {
  return Date.now() - h * HOUR + (hashString(`news-${h}`) % 20) * 60000;
}

const NEWS_ITEMS: NewsItem[] = [
  {
    id: "n1",
    title: "Bitcoin holds $98K as institutional inflows hit a record week",
    source: "CoinDesk",
    category: "Crypto",
    summary:
      "Spot ETF flows reached $2.4B in a single week, the strongest since launch, as asset managers expand crypto allocations. Analysts point to easing macro conditions.",
    publishedAt: relHours(2),
    symbols: ["BTC", "ETH"],
    image: "crypto",
  },
  {
    id: "n2",
    title: "NVIDIA earnings preview: AI capex cycle shows no signs of slowing",
    source: "Bloomberg",
    category: "Technology",
    summary:
      "Consensus expects another record quarter, with data-center revenue up 60% YoY. Options markets imply a ±9% move following the report.",
    publishedAt: relHours(4),
    symbols: ["NVDA", "AVGO", "AMD"],
    image: "tech",
  },
  {
    id: "n3",
    title: "Fed minutes signal patience, but two cuts still priced for 2026",
    source: "Reuters",
    category: "Economy",
    summary:
      "Officials emphasized data dependence amid sticky services inflation. The dollar softened while 2-year yields dipped below 3.9%.",
    publishedAt: relHours(6),
    symbols: ["EURUSD", "USDJPY"],
    image: "macro",
  },
  {
    id: "n4",
    title: "Gold sets fresh record above $3,200 as central banks keep buying",
    source: "FT",
    category: "Macro",
    summary:
      "Central bank purchases reached 1,100 tonnes over the last twelve months. Real yields remain supportive, with flows into gold ETFs accelerating.",
    publishedAt: relHours(8),
    symbols: ["GOLD", "SILVER"],
    image: "macro",
  },
  {
    id: "n5",
    title: "S&P 500 edges higher to close at an all-time high",
    source: "CNBC",
    category: "Stocks",
    summary:
      "Megacap technology led gains as breadth improved. The index is up 11% YTD, with earnings season beating expectations by 6% on average.",
    publishedAt: relHours(10),
    symbols: ["SPX", "NDX", "DJI"],
    image: "stocks",
  },
  {
    id: "n6",
    title: "EUR/USD rallies to 1.0850 as ECB officials lean dovish",
    source: "Reuters",
    category: "Forex",
    summary:
      "The euro strengthened despite dovish comments, as the dollar lost momentum. Traders now focus on next week's HICP inflation print.",
    publishedAt: relHours(12),
    symbols: ["EURUSD", "GBPUSD"],
    image: "forex",
  },
  {
    id: "n7",
    title: "Solana ecosystem surges as DeFi TVL tops $14B",
    source: "The Block",
    category: "Crypto",
    summary:
      "New staking products and a wave of memecoin activity drove volumes higher. SOL outperformed the broader market this week.",
    publishedAt: relHours(15),
    symbols: ["SOL", "SUI", "NEAR"],
    image: "crypto",
  },
  {
    id: "n8",
    title: "Oil steadies as OPEC+ holds output levels steady",
    source: "Reuters",
    category: "Economy",
    summary:
      "WTI stabilized near $67 after the group confirmed current quotas. Geopolitical risk premium has eased over the past month.",
    publishedAt: relHours(18),
    symbols: ["WTI", "BRENT"],
    image: "macro",
  },
  {
    id: "n9",
    title: "Apple supplier reports strong iPhone 17 cycle demand",
    source: "Barron's",
    category: "Stocks",
    summary:
      "Supply chain checks point to a stronger-than-expected upgrade cycle, driven by AI features. AAPL shares rose 1.4% in pre-market.",
    publishedAt: relHours(20),
    symbols: ["AAPL", "TSM"],
    image: "tech",
  },
  {
    id: "n10",
    title: "Yen intervention risk rises as USD/JPY approaches 153",
    source: "Nikkei",
    category: "Forex",
    summary:
      "Japanese officials repeated warnings about speculative moves. Markets price a higher probability of intervention near the 153 handle.",
    publishedAt: relHours(22),
    symbols: ["USDJPY"],
    image: "forex",
  },
  {
    id: "n11",
    title: "European markets: DAX and CAC hit fresh records on earnings",
    source: "FT",
    category: "Stocks",
    summary:
      "Luxury and autos led gains as strong earnings offset soft PMIs. The Euro Stoxx 50 is up 14% year to date.",
    publishedAt: relHours(26),
    symbols: ["DAX", "CAC", "SX5E", "LVMH"],
    image: "stocks",
  },
  {
    id: "n12",
    title: "Stablecoin market cap reaches $240B, fastest growth since 2021",
    source: "CoinDesk",
    category: "Crypto",
    summary:
      "On-chain payments adoption and yield products are driving demand. USDC overtook its closest competitor in weekly settlement volumes.",
    publishedAt: relHours(30),
    symbols: ["ETH", "XRP"],
    image: "crypto",
  },
  {
    id: "n13",
    title: "US retail sales beat estimates, adding to soft-landing narrative",
    source: "CNBC",
    category: "Economy",
    summary:
      "Core retail sales rose 0.6% MoM, above the 0.2% consensus. Economists see resilient consumption supporting a measured Fed path.",
    publishedAt: relHours(34),
    symbols: ["SPX", "DJI"],
    image: "macro",
  },
  {
    id: "n14",
    title: "Semiconductors: memory prices rally on AI server demand",
    source: "Bloomberg",
    category: "Technology",
    summary:
      "HBM contract prices are up 20% sequentially, tightening the supply picture. Memory makers raised guidance for the coming quarter.",
    publishedAt: relHours(38),
    symbols: ["NVDA", "TSM", "ASML"],
    image: "tech",
  },
  {
    id: "n15",
    title: "Copper jumps 2% as China announces infrastructure stimulus",
    source: "Reuters",
    category: "Economy",
    summary:
      "Beijing unveiled a $120B package targeting grid and transport upgrades. Base metals broadly rallied on the news.",
    publishedAt: relHours(42),
    symbols: ["COPPER", "WHEAT"],
    image: "macro",
  },
  {
    id: "n16",
    title: "Tesla's robotaxi fleet launches in three US cities",
    source: "WSJ",
    category: "Technology",
    summary:
      "The commercial rollout begins with 500 vehicles. Analysts debate the pace of expansion and insurance economics.",
    publishedAt: relHours(50),
    symbols: ["TSLA"],
    image: "tech",
  },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const COUNTRIES: Record<string, [string, string]> = {
  US: ["🇺🇸", "US"],
  EU: ["🇪🇺", "EU"],
  UK: ["🇬🇧", "UK"],
  JP: ["🇯🇵", "JP"],
  CN: ["🇨🇳", "CN"],
  CH: ["🇨🇭", "CH"],
  AU: ["🇦🇺", "AU"],
  CA: ["🇨🇦", "CA"],
};

function calendarEvents(): EconomicEvent[] {
  const rand = mulberry32(hashString("calendar-v2"));
  const template: Array<[string, string, keyof typeof COUNTRIES, "low" | "medium" | "high", string, string, string]> = [
    ["08:30", "CPI YoY", "US", "high", "2.7%", "2.8%", "%"],
    ["10:00", "Fed Chair Speech", "US", "high", "—", "—", ""],
    ["02:30", "GDP Growth QoQ", "JP", "medium", "0.4%", "0.5%", "%"],
    ["03:30", "RBA Rate Decision", "AU", "high", "4.10%", "4.10%", "%"],
    ["09:00", "ECB Rate Decision", "EU", "high", "1.85%", "1.85%", "%"],
    ["08:00", "Eurozone CPI Flash", "EU", "high", "2.0%", "2.1%", "%"],
    ["08:30", "Retail Sales MoM", "US", "medium", "0.4%", "0.1%", "%"],
    ["08:30", "Initial Jobless Claims", "US", "medium", "238K", "241K", "K"],
    ["14:30", "Crude Oil Inventories", "US", "medium", "-1.2M", "+0.4M", "M"],
    ["07:00", "UK Unemployment Rate", "UK", "high", "4.4%", "4.5%", "%"],
    ["09:30", "UK Services PMI", "UK", "medium", "53.1", "52.9", ""],
    ["13:00", "BoE Governor Speech", "UK", "medium", "—", "—", ""],
    ["01:30", "Chinese Industrial Output", "CN", "medium", "5.6%", "5.4%", "%"],
    ["11:00", "Eurozone Industrial Production", "EU", "low", "-0.3%", "-0.4%", "%"],
    ["08:30", "Producer Price Index MoM", "US", "medium", "0.3%", "0.2%", "%"],
    ["10:00", "University of Michigan Sentiment", "US", "medium", "68.5", "67.9", ""],
    ["08:45", "French CPI Final YoY", "EU", "low", "1.3%", "1.3%", "%"],
    ["03:00", "CNH Fixing Rate", "CN", "low", "—", "7.2410", ""],
    ["07:00", "German ZEW Sentiment", "EU", "medium", "28.0", "26.5", ""],
    ["12:00", "SNB Quarterly Bulletin", "CH", "low", "—", "—", ""],
    ["09:30", "Canadian CPI YoY", "CA", "high", "2.2%", "2.3%", "%"],
    ["13:30", "Fed Beige Book", "US", "medium", "—", "—", ""],
    ["16:00", "30-Year Bond Auction", "US", "low", "—", "4.55%", "%"],
    ["07:30", "UK Inflation Report Hearing", "UK", "medium", "—", "—", ""],
  ];
  const events: EconomicEvent[] = [];
  for (let day = 0; day < 10; day++) {
    const date = new Date(Date.now() + day * DAY);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dayEvents = [...template].sort(() => rand() - 0.5).slice(0, 5 + Math.floor(rand() * 4));
    for (const [time, name, country, importance, forecast, previous, unit] of dayEvents) {
      events.push({
        id: `ec-${day}-${name}`,
        date: `${DAYS[date.getDay()]} ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        time,
        country: COUNTRIES[country][1],
        flag: COUNTRIES[country][0],
        event: name,
        importance,
        forecast,
        previous,
        result: day === 0 && rand() > 0.5 ? (rand() > 0.5 ? forecast : previous) : undefined,
        unit,
      });
    }
  }
  return events.sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : 0));
}

export class MockMarketDataProvider implements MarketDataProvider {
  readonly name = "Demo Provider";
  readonly isDemo = true;

  getQuote(symbol: string): Quote {
    return getLiveQuote(symbol);
  }

  getQuotes(symbols: string[]): Map<string, Quote> {
    const map = new Map<string, Quote>();
    for (const s of symbols) map.set(s, getLiveQuote(s));
    return map;
  }

  getCandles(symbol: string, timeframe: Timeframe, count = 400): Candle[] {
    return generateCandles(symbol, timeframe, count);
  }

  getSparkline(symbol: string, points = 28): number[] {
    return getSparkline(symbol, points);
  }

  search(query: string) {
    return searchSymbols(query);
  }

  getSymbol(symbol: string) {
    return getSymbolMeta(symbol);
  }

  getByCategory(category: SymbolMeta["category"]) {
    return getSymbolsByCategory(category);
  }

  getNews() {
    return [...NEWS_ITEMS].sort((a, b) => b.publishedAt - a.publishedAt);
  }

  getEconomicCalendar() {
    return calendarEvents();
  }

  async getQuotesAsync(symbols: string[]): Promise<Map<string, Quote>> {
    return this.getQuotes(symbols);
  }

  async getCandlesAsync(symbol: string, timeframe: Timeframe, count = 400): Promise<Candle[]> {
    return this.getCandles(symbol, timeframe, count);
  }

  async getSparklineAsync(symbol: string, points = 28): Promise<number[]> {
    return this.getSparkline(symbol, points);
  }

  async getNewsAsync(): Promise<NewsItem[]> {
    return this.getNews();
  }

  async getEconomicCalendarAsync(): Promise<EconomicEvent[]> {
    return this.getEconomicCalendar();
  }
}

export const DEFAULT_MARKET_SYMBOLS = [
  "BTC", "ETH", "EURUSD", "GBPUSD", "USDJPY", "GOLD", "SILVER",
  "SPX", "NDX", "DJI", "CAC", "DAX",
];