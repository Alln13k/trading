"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EquityPoint, Holding } from "@/lib/types";
import { uid } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

interface PortfolioState {
  initialCapital: number;
  cash: number;
  holdings: Holding[];
  realizedPnl: number;
  equityHistory: EquityPoint[];
  setInitialCapital: (v: number) => void;
  setCash: (v: number) => void;
  addHolding: (h: Omit<Holding, "id" | "addedAt"> & { id?: string; addedAt?: number }) => void;
  removeHolding: (symbol: string) => void;
  updateHolding: (symbol: string, patch: Partial<Holding>) => void;
  addRealizedPnl: (pnl: number) => void;
  updateEquity: (date: string, value: number, cash: number) => void;
  resetPortfolio: () => void;
}

const EMPTY_HISTORY: EquityPoint[] = [{ date: today(), value: 100000, cash: 100000 }];

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      initialCapital: 100000,
      cash: 100000,
      holdings: [],
      realizedPnl: 0,
      equityHistory: EMPTY_HISTORY,
      setInitialCapital: (v) => set({ initialCapital: v }),
      setCash: (v) => set({ cash: v }),
      addHolding: (h) =>
        set((s) => {
          const existing = s.holdings.find((x) => x.symbol === h.symbol);
          if (existing) {
            const totalQty = existing.quantity + h.quantity;
            const avgCost = (existing.quantity * existing.avgCost + h.quantity * h.avgCost) / totalQty;
            return {
              holdings: s.holdings.map((x) =>
                x.symbol === h.symbol
                  ? { ...x, quantity: totalQty, avgCost, stopLoss: h.stopLoss ?? x.stopLoss, takeProfit: h.takeProfit ?? x.takeProfit }
                  : x
              ),
            };
          }
          return {
            holdings: [
              ...s.holdings,
              { ...h, id: uid("h"), addedAt: Date.now() },
            ] as Holding[],
          };
        }),
      removeHolding: (symbol) =>
        set((s) => ({ holdings: s.holdings.filter((h) => h.symbol !== symbol) })),
      updateHolding: (symbol, patch) =>
        set((s) => ({
          holdings: s.holdings.map((h) => (h.symbol === symbol ? { ...h, ...patch } : h)),
        })),
      addRealizedPnl: (pnl) => set((s) => ({ realizedPnl: s.realizedPnl + pnl })),
      updateEquity: (date, value, cash) =>
        set((s) => {
          const exists = s.equityHistory.some((p) => p.date === date);
          const next = exists
            ? s.equityHistory.map((p) => (p.date === date ? { ...p, value, cash } : p))
            : [...s.equityHistory, { date, value, cash }];
          return { equityHistory: next.slice(-120) };
        }),
      resetPortfolio: () =>
        set({
          initialCapital: 100000,
          cash: 100000,
          holdings: [],
          realizedPnl: 0,
          equityHistory: EMPTY_HISTORY,
        }),
    }),
    { name: "trading-portfolio-v2" }
  )
);