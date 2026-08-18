import { RealMarketDataProvider } from "@/lib/data/realProvider";
import type { MarketDataProvider } from "@/lib/data/mockProvider";

/**
 * Data source abstraction.
 *
 * The whole app talks to `marketData` (a MarketDataProvider). Live mode proxies
 * Yahoo Finance / Forex Factory through the app's own API routes with caching,
 * and falls back to deterministic demo data whenever the APIs are unreachable.
 */
export const DATA_SOURCE: "demo" | "live" = "live";

export const marketData: MarketDataProvider = new RealMarketDataProvider();

export function isDemoMode() {
  return DATA_SOURCE === "demo";
}