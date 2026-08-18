import { MockMarketDataProvider, type MarketDataProvider } from "@/lib/data/mockProvider";

/**
 * Data source abstraction.
 *
 * The whole app talks to `marketData` (a MarketDataProvider). To connect a real
 * financial API, implement MarketDataProvider against it and swap the instance
 * below (e.g. behind an env flag). No UI code needs to change.
 */
export const DATA_SOURCE: "demo" | "live" = "demo";

export const marketData: MarketDataProvider = new MockMarketDataProvider();

export function isDemoMode() {
  return DATA_SOURCE === "demo";
}