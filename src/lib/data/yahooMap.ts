import type { Timeframe } from "@/lib/types";

/**
 * Maps NexTrade internal symbols to Yahoo Finance symbols.
 * Crypto: BASE-USD · Forex: XXXYYY=X · Indices: ^XXX · Commodities: FUT=F · Stocks: ticker.
 */
const YAHOO_MAP: Record<string, string> = {
  // crypto
  BTC: "BTC-USD",
  ETH: "ETH-USD",
  SOL: "SOL-USD",
  XRP: "XRP-USD",
  BNB: "BNB-USD",
  ADA: "ADA-USD",
  DOGE: "DOGE-USD",
  AVAX: "AVAX-USD",
  LINK: "LINK-USD",
  DOT: "DOT-USD",
  LTC: "LTC-USD",
  TON: "TON-USD",
  NEAR: "NEAR-USD",
  APT: "APT-USD",
  SUI: "SUI-USD",
  UNI: "UNI-USD",
  AAVE: "AAVE-USD",
  XLM: "XLM-USD",
  TRX: "TRX-USD",
  SHIB: "SHIB-USD",
  PEPE: "PEPE-USD",
  WLD: "WLD-USD",
  POL: "POL-USD",
  // forex
  EURUSD: "EURUSD=X",
  GBPUSD: "GBPUSD=X",
  USDJPY: "USDJPY=X",
  USDCHF: "USDCHF=X",
  AUDUSD: "AUDUSD=X",
  USDCAD: "USDCAD=X",
  NZDUSD: "NZDUSD=X",
  EURGBP: "EURGBP=X",
  EURJPY: "EURJPY=X",
  GBPJPY: "GBPJPY=X",
  USDCNH: "USDCNH=X",
  USDMXN: "USDMXN=X",
  // indices
  SPX: "^GSPC",
  NDX: "^NDX",
  DJI: "^DJI",
  RUT: "^RUT",
  CAC: "^FCHI",
  DAX: "^GDAXI",
  FTSE: "^FTSE",
  NIKKEI: "^N225",
  HSI: "^HSI",
  SX5E: "^STOXX50E",
  VIX: "^VIX",
  // commodities
  GOLD: "GC=F",
  SILVER: "SI=F",
  WTI: "CL=F",
  BRENT: "BZ=F",
  NATGAS: "NG=F",
  COPPER: "HG=F",
  PLAT: "PL=F",
  PALL: "PA=F",
  WHEAT: "ZW=F",
  CORN: "ZC=F",
  COFFEE: "KC=F",
  // stocks (tickers match Yahoo)
  AAPL: "AAPL",
  MSFT: "MSFT",
  NVDA: "NVDA",
  GOOGL: "GOOGL",
  AMZN: "AMZN",
  META: "META",
  TSLA: "TSLA",
  NFLX: "NFLX",
  AMD: "AMD",
  AVGO: "AVGO",
  JPM: "JPM",
  V: "V",
  WMT: "WMT",
  XOM: "XOM",
  JNJ: "JNJ",
  PG: "PG",
  KO: "KO",
  DIS: "DIS",
  ORCL: "ORCL",
  CRM: "CRM",
  INTC: "INTC",
  QCOM: "QCOM",
  IBM: "IBM",
  CSCO: "CSCO",
  TSM: "TSM",
  ASML: "ASML",
  SAP: "SAP",
  LVMH: "MC.PA",
  TTE: "TTE",
  SAN: "SAN",
};

export function toYahooSymbol(symbol: string): string | undefined {
  return YAHOO_MAP[symbol];
}

export function toLocalSymbol(yahoo: string): string | undefined {
  for (const [local, y] of Object.entries(YAHOO_MAP)) {
    if (y === yahoo) return local;
  }
  return undefined;
}

/** Yahoo v8 chart params per timeframe. 4h is aggregated from 1h bars. */
export const TF_PARAMS: Record<Timeframe, { range: string; interval: string }> = {
  "1m": { range: "5d", interval: "1m" },
  "5m": { range: "1mo", interval: "5m" },
  "15m": { range: "3mo", interval: "15m" },
  "30m": { range: "3mo", interval: "30m" },
  "1h": { range: "6mo", interval: "60m" },
  "4h": { range: "1y", interval: "60m" },
  "1D": { range: "2y", interval: "1d" },
  "1W": { range: "5y", interval: "1wk" },
  "1M": { range: "10y", interval: "1mo" },
};