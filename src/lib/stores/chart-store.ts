"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Timeframe } from "@/lib/types";
import { uid } from "@/lib/utils";

export type IndicatorKind =
  | "sma"
  | "ema"
  | "rsi"
  | "macd"
  | "bollinger"
  | "vwap"
  | "stochastic"
  | "atr";

export interface IndicatorConfig {
  id: string;
  kind: IndicatorKind;
  period: number;
  color: string;
  pane: "main" | "secondary";
}

export type DrawingKind =
  | "horizontal"
  | "vertical"
  | "trendline"
  | "rectangle"
  | "fibonacci"
  | "zone";

export interface Drawing {
  id: string;
  kind: DrawingKind;
  startTime: number;
  endTime: number;
  startPrice: number;
  endPrice: number;
  color: string;
  label?: string;
}

export interface SavedLayout {
  id: string;
  name: string;
  symbol: string;
  timeframe: Timeframe;
  chartType: "candles" | "line" | "area";
  indicators: IndicatorConfig[];
  drawings: Drawing[];
  showVolume: boolean;
  createdAt: number;
  userId: string;
  userName: string;
}

interface ChartState {
  savedLayouts: SavedLayout[];
  saveLayout: (l: Omit<SavedLayout, "id" | "createdAt">) => void;
  deleteLayout: (id: string) => void;
}

const SEED: SavedLayout[] = [
  {
    id: "lay1",
    name: "BTC 4H + EMA trend",
    symbol: "BTC",
    timeframe: "4h",
    chartType: "candles",
    indicators: [
      { id: "i1", kind: "ema", period: 20, color: "#22d3ee", pane: "main" },
      { id: "i2", kind: "ema", period: 50, color: "#a78bfa", pane: "main" },
      { id: "i3", kind: "rsi", period: 14, color: "#f59e0b", pane: "secondary" },
    ],
    drawings: [],
    showVolume: true,
    createdAt: Date.now() - 6 * 86400000,
    userId: "u1",
    userName: "Allan",
  },
  {
    id: "lay2",
    name: "NVDA breakout watch",
    symbol: "NVDA",
    timeframe: "1h",
    chartType: "candles",
    indicators: [
      { id: "i1", kind: "bollinger", period: 20, color: "#818cf8", pane: "main" },
      { id: "i2", kind: "macd", period: 12, color: "#34d399", pane: "secondary" },
    ],
    drawings: [],
    showVolume: true,
    createdAt: Date.now() - 3 * 86400000,
    userId: "u2",
    userName: "Alex",
  },
];

export const useChartStore = create<ChartState>()(
  persist(
    (set) => ({
      savedLayouts: SEED,
      saveLayout: (l) =>
        set((s) => ({
          savedLayouts: [{ ...l, id: uid("lay"), createdAt: Date.now() }, ...s.savedLayouts].slice(0, 30),
        })),
      deleteLayout: (id) =>
        set((s) => ({ savedLayouts: s.savedLayouts.filter((l) => l.id !== id) })),
    }),
    { name: "trading-chart-layouts" }
  )
);