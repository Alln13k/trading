import { RealMarketDataProvider } from "@/lib/data/realProvider";
import type { MarketDataProvider } from "@/lib/data/mockProvider";

/**
 * Data source abstraction.
 *
 * The whole app talks to `marketData` (a MarketDataProvider). Live mode proxies
 * Yahoo Finance / Forex Factory through the app's own API routes with caching,
 * and surfaces a "No data API" state (red) whenever a live source is unreachable.
 * No simulated data is ever shown as real market data.
 */
export const DATA_SOURCE: "demo" | "live" = "live";

export const PROVIDER_ATTRIBUTION =
  "Quotes via Yahoo Finance unofficial chart API. Not an exchange feed. Typically delayed. Never treated as live.";

export const marketData: MarketDataProvider = new RealMarketDataProvider();

export function isDemoMode() {
  return DATA_SOURCE === "demo";
}