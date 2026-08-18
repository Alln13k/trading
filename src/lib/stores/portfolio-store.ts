"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EquityPoint, Holding } from "@/lib/types";
import { hashString, mulberry32, uid } from "@/lib/utils";

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);

function seedEquityHistory(): EquityPoint[] {
  const rand = mulberry32(hashString("equity-v1"));
  const points: EquityPoint[] = [];
  let value = 25000;
  for (let i = 95; i >= 1; i--) {
    const ret = (rand() - 0.455) * 0.016 + 0.0021;
    value = value * (1 + ret);
    points.push({ date: daysAgo(i), value: Math.round(value * 100) / 100, cash: Math.round(value * 0.62) });
  }
  return points;
}

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

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      initialCapital: 25000,
      cash: 18640.55,
      holdings: [
        { symbol: "BTC", quantity: 0.05, avgCost: 91200, stopLoss: 86000, takeProfit: 105000, addedAt: Date.now() - 40 * 86400000, userId: "u1", userName: "Allan" },
        { symbol: "ETH", quantity: 0.75, avgCost: 3150, addedAt: Date.now() - 33 * 86400000, userId: "u1", userName: "Allan" },
        { symbol: "NVDA", quantity: 12, avgCost: 148.2, stopLoss: 132, takeProfit: 190, addedAt: Date.now() - 21 * 86400000, userId: "u2", userName: "Alex" },
        { symbol: "GOLD", quantity: 2, avgCost: 2980, addedAt: Date.now() - 15 * 86400000, userId: "u2", userName: "Alex" },
        { symbol: "AAPL", quantity: 8, avgCost: 205.5, stopLoss: 190, addedAt: Date.now() - 9 * 86400000, userId: "u1", userName: "Allan" },
      ],
      realizedPnl: 1487.32,
      equityHistory: seedEquityHistory(),
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
          initialCapital: 25000,
          cash: 18640.55,
          holdings: [],
          realizedPnl: 0,
          equityHistory: seedEquityHistory(),
        }),
    }),
    { name: "trading-portfolio" }
  )
);