export type Category = "crypto" | "forex" | "stocks" | "indices" | "commodities";

export interface SymbolMeta {
  symbol: string;
  name: string;
  category: Category;
  exchange: string;
  currency?: string;
  basePrice: number;
  decimals: number;
  volatility: number;
  color: string;
  volume: number;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  previousClose: number;
  timestamp: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1D" | "1W" | "1M";

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  category: "Crypto" | "Stocks" | "Forex" | "Macro" | "Economy" | "Technology";
  summary: string;
  publishedAt: number;
  symbols: string[];
  image: string;
}

export type EventImportance = "low" | "medium" | "high";

export interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  country: string;
  flag: string;
  event: string;
  importance: EventImportance;
  forecast: string;
  previous: string;
  result?: string;
  unit: string;
}

export type Direction = "long" | "short";

export interface Position {
  id: string;
  symbol: string;
  direction: Direction;
  size: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  openedAt: number;
  userId: string;
  userName: string;
  note?: string;
}

export interface Trade {
  id: string;
  symbol: string;
  date: string;
  time: string;
  timestamp: number;
  direction: Direction;
  strategy: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  size: number;
  result: "win" | "loss" | "breakeven";
  pnl: number;
  notes?: string;
  screenshot?: string;
  emotionBefore: string;
  emotionAfter: string;
  userId: string;
  userName: string;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avgCost: number;
  stopLoss?: number;
  takeProfit?: number;
  addedAt: number;
  userId: string;
  userName: string;
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  symbols: string[];
  createdAt: number;
  userId: string;
  userName: string;
}

export type AlertType = "price_above" | "price_below" | "rsi_above" | "rsi_below" | "cross_ema";

export interface Alert {
  id: string;
  symbol: string;
  type: AlertType;
  value: number;
  active: boolean;
  createdAt: number;
  userId: string;
  userName: string;
  lastTriggeredAt?: number;
}

export interface ActivityEvent {
  id: string;
  userName: string;
  userId: string;
  action: string;
  target: string;
  timestamp: number;
  kind: "watchlist" | "position" | "journal" | "alert" | "portfolio" | "settings" | "chart";
}

export interface EquityPoint {
  date: string;
  value: number;
  cash: number;
}

export interface StrategyStats {
  strategy: string;
  trades: number;
  wins: number;
  winRate: number;
  pnl: number;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";
  color: string;
}

export interface AppSettings {
  profile: {
    name: string;
    email: string;
    initials: string;
  };
  appearance: {
    theme: "dark" | "light" | "system";
    accent: "indigo" | "violet" | "cyan" | "emerald";
    compact: boolean;
    reduceMotion: boolean;
  };
  currency: string;
  timezone: string;
  notifications: {
    alerts: boolean;
    priceMoves: boolean;
    news: boolean;
    activity: boolean;
  };
  charts: {
    defaultTimeframe: Timeframe;
    defaultChartType: "candles" | "line" | "area";
    showVolume: boolean;
    showGrid: boolean;
  };
  data: {
    autoRefresh: boolean;
    refreshInterval: number;
    clearAll?: boolean;
  };
  users: AppUser[];
}