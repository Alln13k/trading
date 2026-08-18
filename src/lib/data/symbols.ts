import type { Category, SymbolMeta } from "@/lib/types";

const raw: Array<
  [string, string, Category, string, number, number, number, number, string]
> = [
  // symbol, name, category, exchange, basePrice, decimals, volatility(per-candle ~), volume, color
  ["BTC", "Bitcoin", "crypto", "Binance", 98000, 2, 0.012, 21000, "#f7931a"],
  ["ETH", "Ethereum", "crypto", "Binance", 3450, 2, 0.015, 14500, "#627eea"],
  ["SOL", "Solana", "crypto", "Binance", 168, 2, 0.022, 7200, "#14f195"],
  ["XRP", "XRP", "crypto", "Binance", 2.35, 4, 0.02, 5600, "#00aae4"],
  ["BNB", "BNB", "crypto", "Binance", 610, 2, 0.016, 2400, "#f0b90b"],
  ["ADA", "Cardano", "crypto", "Binance", 0.92, 4, 0.021, 3100, "#0033ad"],
  ["DOGE", "Dogecoin", "crypto", "Binance", 0.28, 4, 0.028, 4800, "#c2a633"],
  ["AVAX", "Avalanche", "crypto", "Binance", 31.5, 2, 0.024, 1800, "#e84142"],
  ["LINK", "Chainlink", "crypto", "Binance", 16.8, 2, 0.022, 1600, "#2a5ada"],
  ["DOT", "Polkadot", "crypto", "Binance", 5.6, 2, 0.02, 1200, "#e6007a"],
  ["LTC", "Litecoin", "crypto", "Binance", 88, 2, 0.019, 1100, "#345d9d"],
  ["TON", "Toncoin", "crypto", "Binance", 5.2, 2, 0.02, 900, "#0098ea"],
  ["NEAR", "NEAR Protocol", "crypto", "Binance", 4.1, 2, 0.025, 800, "#00c08b"],
  ["APT", "Aptos", "crypto", "Binance", 6.4, 2, 0.024, 700, "#00c08b"],
  ["SUI", "Sui", "crypto", "Binance", 3.1, 2, 0.026, 950, "#4da2ff"],
  ["UNI", "Uniswap", "crypto", "Binance", 9.2, 2, 0.023, 600, "#ff007a"],
  ["AAVE", "Aave", "crypto", "Binance", 210, 2, 0.024, 350, "#b6509e"],
  ["XLM", "Stellar", "crypto", "Binance", 0.32, 4, 0.02, 1100, "#04b5e5"],
  ["TRX", "TRON", "crypto", "Binance", 0.24, 4, 0.018, 2100, "#ff060a"],
  ["SHIB", "Shiba Inu", "crypto", "Binance", 0.000014, 8, 0.026, 3200, "#f5a623"],
  ["PEPE", "Pepe", "crypto", "Binance", 0.0000098, 8, 0.032, 2400, "#4caf50"],
  ["WLD", "Worldcoin", "crypto", "Binance", 1.85, 2, 0.028, 500, "#000000"],
  ["POL", "Polygon", "crypto", "Binance", 0.42, 4, 0.021, 1300, "#8247e5"],

  ["EURUSD", "EUR / USD", "forex", "FX", 1.0845, 5, 0.004, 88000, "#7c3aed"],
  ["GBPUSD", "GBP / USD", "forex", "FX", 1.2715, 5, 0.005, 52000, "#2563eb"],
  ["USDJPY", "USD / JPY", "forex", "FX", 152.4, 3, 0.005, 61000, "#0891b2"],
  ["USDCHF", "USD / CHF", "forex", "FX", 0.902, 5, 0.005, 28000, "#0d9488"],
  ["AUDUSD", "AUD / USD", "forex", "FX", 0.6625, 5, 0.005, 42000, "#ea580c"],
  ["USDCAD", "USD / CAD", "forex", "FX", 1.374, 5, 0.004, 35000, "#dc2626"],
  ["NZDUSD", "NZD / USD", "forex", "FX", 0.6045, 5, 0.005, 18000, "#059669"],
  ["EURGBP", "EUR / GBP", "forex", "FX", 0.853, 5, 0.004, 15000, "#9333ea"],
  ["EURJPY", "EUR / JPY", "forex", "FX", 165.2, 3, 0.005, 14000, "#f59e0b"],
  ["GBPJPY", "GBP / JPY", "forex", "FX", 193.8, 3, 0.006, 11000, "#ef4444"],
  ["USDCNH", "USD / CNH", "forex", "FX", 7.24, 4, 0.003, 9000, "#b91c1c"],
  ["USDMXN", "USD / MXN", "forex", "FX", 18.05, 4, 0.007, 8000, "#16a34a"],

  ["SPX", "S&P 500", "indices", "NYSE", 6210, 2, 0.008, 3400000, "#22d3ee"],
  ["NDX", "Nasdaq 100", "indices", "NASDAQ", 22450, 2, 0.01, 1900000, "#60a5fa"],
  ["DJI", "Dow Jones", "indices", "NYSE", 44950, 2, 0.007, 980000, "#818cf8"],
  ["RUT", "Russell 2000", "indices", "NYSE", 2420, 2, 0.009, 520000, "#34d399"],
  ["CAC", "CAC 40", "indices", "Euronext", 8120, 2, 0.008, 310000, "#38bdf8"],
  ["DAX", "DAX 40", "indices", "XETRA", 23480, 2, 0.008, 420000, "#a78bfa"],
  ["FTSE", "FTSE 100", "indices", "LSE", 8900, 2, 0.006, 280000, "#f472b6"],
  ["NIKKEI", "Nikkei 225", "indices", "TSE", 41200, 2, 0.011, 260000, "#fb7185"],
  ["HSI", "Hang Seng", "indices", "HKEX", 24800, 2, 0.013, 330000, "#f87171"],
  ["SX5E", "Euro Stoxx 50", "indices", "Euronext", 5360, 2, 0.008, 210000, "#c084fc"],
  ["VIX", "VIX Volatility", "indices", "CBOE", 14.8, 2, 0.03, 80000, "#fbbf24"],

  ["GOLD", "Gold", "commodities", "COMEX", 3205, 2, 0.008, 89000, "#f59e0b"],
  ["SILVER", "Silver", "commodities", "COMEX", 33.6, 2, 0.012, 45000, "#94a3b8"],
  ["WTI", "Crude Oil WTI", "commodities", "NYMEX", 67.4, 2, 0.014, 380000, "#3b82f6"],
  ["BRENT", "Brent Oil", "commodities", "ICE", 71.2, 2, 0.013, 320000, "#6366f1"],
  ["NATGAS", "Natural Gas", "commodities", "NYMEX", 3.25, 3, 0.025, 120000, "#ef4444"],
  ["COPPER", "Copper", "commodities", "COMEX", 4.85, 3, 0.012, 68000, "#d97706"],
  ["PLAT", "Platinum", "commodities", "NYMEX", 1085, 2, 0.011, 14000, "#a8a29e"],
  ["PALL", "Palladium", "commodities", "NYMEX", 965, 2, 0.014, 9000, "#78716c"],
  ["WHEAT", "Wheat", "commodities", "CBOT", 5.65, 3, 0.012, 30000, "#eab308"],
  ["CORN", "Corn", "commodities", "CBOT", 4.35, 3, 0.011, 26000, "#facc15"],
  ["COFFEE", "Coffee", "commodities", "ICE", 2.85, 3, 0.02, 18000, "#92400e"],

  ["AAPL", "Apple Inc.", "stocks", "NASDAQ", 238.5, 2, 0.012, 62000000, "#a3a3a3"],
  ["MSFT", "Microsoft", "stocks", "NASDAQ", 465.2, 2, 0.011, 28000000, "#0078d4"],
  ["NVDA", "NVIDIA", "stocks", "NASDAQ", 174.8, 2, 0.022, 210000000, "#76b900"],
  ["GOOGL", "Alphabet", "stocks", "NASDAQ", 192.4, 2, 0.013, 32000000, "#4285f4"],
  ["AMZN", "Amazon", "stocks", "NASDAQ", 224.6, 2, 0.014, 41000000, "#ff9900"],
  ["META", "Meta Platforms", "stocks", "NASDAQ", 648.3, 2, 0.015, 19000000, "#0668e1"],
  ["TSLA", "Tesla", "stocks", "NASDAQ", 328.9, 2, 0.028, 98000000, "#e82127"],
  ["NFLX", "Netflix", "stocks", "NASDAQ", 1225, 2, 0.017, 4500000, "#e50914"],
  ["AMD", "Advanced Micro Devices", "stocks", "NASDAQ", 148.7, 2, 0.02, 42000000, "#ed1c24"],
  ["AVGO", "Broadcom", "stocks", "NASDAQ", 248.9, 2, 0.018, 25000000, "#cc092f"],
  ["JPM", "JPMorgan Chase", "stocks", "NYSE", 295.4, 2, 0.01, 9800000, "#003087"],
  ["V", "Visa", "stocks", "NYSE", 332.1, 2, 0.01, 6200000, "#1a1f71"],
  ["WMT", "Walmart", "stocks", "NYSE", 96.8, 2, 0.008, 15000000, "#0071ce"],
  ["XOM", "Exxon Mobil", "stocks", "NYSE", 119.5, 2, 0.011, 17000000, "#ea202d"],
  ["JNJ", "Johnson & Johnson", "stocks", "NYSE", 152.3, 2, 0.008, 7200000, "#d21034"],
  ["PG", "Procter & Gamble", "stocks", "NYSE", 172.4, 2, 0.007, 5800000, "#010203"],
  ["KO", "Coca-Cola", "stocks", "NYSE", 63.2, 2, 0.007, 13000000, "#f40009"],
  ["DIS", "Walt Disney", "stocks", "NYSE", 113.8, 2, 0.013, 9800000, "#113ccf"],
  ["ORCL", "Oracle", "stocks", "NYSE", 198.6, 2, 0.015, 7800000, "#c74634"],
  ["CRM", "Salesforce", "stocks", "NYSE", 302.5, 2, 0.016, 6200000, "#00a1e0"],
  ["INTC", "Intel", "stocks", "NASDAQ", 24.6, 2, 0.02, 38000000, "#0071c5"],
  ["QCOM", "Qualcomm", "stocks", "NASDAQ", 189.3, 2, 0.017, 8900000, "#32529f"],
  ["IBM", "IBM", "stocks", "NYSE", 248.7, 2, 0.011, 3400000, "#054ada"],
  ["CSCO", "Cisco Systems", "stocks", "NASDAQ", 62.4, 2, 0.01, 18000000, "#049fd9"],
  ["TSM", "TSMC", "stocks", "NYSE", 208.9, 2, 0.015, 14000000, "#fbbc05"],
  ["ASML", "ASML Holding", "stocks", "NASDAQ", 985.2, 2, 0.016, 1200000, "#e31e24"],
  ["SAP", "SAP SE", "stocks", "NYSE", 268.4, 2, 0.011, 1800000, "#0faaFF"],
  ["LVMH", "LVMH Moët", "stocks", "Euronext", 695.2, 2, 0.012, 420000, "#c9a063"],
  ["TTE", "TotalEnergies", "stocks", "NYSE", 61.8, 2, 0.011, 5600000, "#8f1f38"],
  ["SAN", "Banco Santander", "stocks", "NYSE", 6.85, 2, 0.012, 21000000, "#ec0000"],
];

export const SYMBOLS: SymbolMeta[] = raw.map(
  ([symbol, name, category, exchange, basePrice, decimals, volatility, volume, color]) => ({
    symbol,
    name,
    category,
    exchange,
    basePrice,
    decimals,
    volatility,
    volume,
    color,
  })
);

const bySymbol = new Map(SYMBOLS.map((s) => [s.symbol, s]));

export function getSymbolMeta(symbol: string): SymbolMeta | undefined {
  return bySymbol.get(symbol);
}

export function getSymbolsByCategory(category: Category) {
  return SYMBOLS.filter((s) => s.category === category);
}

export function searchSymbols(query: string, limit = 12) {
  const q = query.trim().toLowerCase();
  if (!q) return SYMBOLS.slice(0, limit);
  const scored = SYMBOLS.map((s) => {
    let score = 0;
    if (s.symbol.toLowerCase().startsWith(q)) score += 100;
    else if (s.symbol.toLowerCase().includes(q)) score += 60;
    if (s.name.toLowerCase().startsWith(q)) score += 50;
    else if (s.name.toLowerCase().includes(q)) score += 30;
    return { s, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.s);
}

export const CATEGORY_LABELS: Record<Category, string> = {
  crypto: "Crypto",
  forex: "Forex",
  stocks: "Stocks",
  indices: "Indices",
  commodities: "Commodities",
};

export const TRENDING_SYMBOLS = ["BTC", "ETH", "NVDA", "EURUSD", "GOLD", "SOL", "SPX", "TSLA"];