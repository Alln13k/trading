"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Last analyzer result already computed on this browser. The assistant only reads this. */
export interface StoredAnalyzerRead {
  symbol: string;
  timeframe: string;
  quality: "delayed" | "cached" | "unavailable";
  available: boolean;
  reason?: string;
  active?: "bullish" | "bearish" | "neutral";
  activeWhy?: string;
  lastClose?: number;
  rsi?: number;
  atr?: number;
  macdHistogram?: number;
}

interface AnalyzerReadState {
  read: StoredAnalyzerRead | null;
  setRead: (read: StoredAnalyzerRead) => void;
}

export const useAnalyzerReadStore = create<AnalyzerReadState>()(
  persist(
    (set) => ({
      read: null,
      setRead: (read) => set({ read }),
    }),
    { name: "trading-analyzer-read-v1" }
  )
);
