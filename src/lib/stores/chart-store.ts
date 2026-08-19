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

const SEED: SavedLayout[] = [];

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
    { name: "trading-chart-layouts-v2" }
  )
);