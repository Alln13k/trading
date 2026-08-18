"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Position } from "@/lib/types";
import { marketData } from "@/lib/data/provider";
import { useJournalStore } from "@/lib/stores/journal-store";
import { usePortfolioStore } from "@/lib/stores/portfolio-store";
import { uid } from "@/lib/utils";

export interface PositionComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

interface PositionsState {
  positions: Position[];
  comments: Record<string, PositionComment[]>;
  openPosition: (input: {
    symbol: string;
    direction: "long" | "short";
    size: number;
    entryPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    note?: string;
    userId: string;
    userName: string;
  }) => Position;
  closePosition: (id: string, exitPrice?: number) => void;
  updatePosition: (id: string, patch: Partial<Position>) => void;
  removePosition: (id: string) => void;
  refreshPrices: (quotes: Map<string, { price: number }>) => void;
  addComment: (positionId: string, userId: string, userName: string, text: string) => void;
  resetPositions: () => void;
}

const daysAgo = (d: number) => Date.now() - d * 86400000;

const SEED: Position[] = [
  {
    id: "p1",
    symbol: "BTC",
    direction: "long",
    size: 0.04,
    entryPrice: 95400,
    currentPrice: 98050,
    stopLoss: 92000,
    takeProfit: 102000,
    openedAt: daysAgo(2.2),
    userId: "u1",
    userName: "Allan",
    note: "Breakout above 95k with volume. Watching daily close above 96k.",
  },
  {
    id: "p2",
    symbol: "ETH",
    direction: "long",
    size: 1.2,
    entryPrice: 3310,
    currentPrice: 3465,
    takeProfit: 3800,
    openedAt: daysAgo(1.4),
    userId: "u2",
    userName: "Alex",
    note: "Trend following after EMA20 hold.",
  },
  {
    id: "p3",
    symbol: "EURUSD",
    direction: "short",
    size: 15000,
    entryPrice: 1.0875,
    currentPrice: 1.0845,
    stopLoss: 1.095,
    takeProfit: 1.072,
    openedAt: daysAgo(0.9),
    userId: "u1",
    userName: "Allan",
  },
];

const SEED_COMMENTS: Record<string, PositionComment[]> = {
  p1: [
    { id: "c1", userId: "u2", userName: "Alex", text: "Nice setup — volume confirms. I'd trail the stop to 95,800.", timestamp: daysAgo(1.8) },
  ],
};

export const usePositionsStore = create<PositionsState>()(
  persist(
    (set, get) => ({
      positions: SEED,
      comments: SEED_COMMENTS,
      openPosition: (input) => {
        const meta = marketData.getSymbol(input.symbol);
        const quote = marketData.getQuote(input.symbol);
        const position: Position = {
          id: uid("pos"),
          symbol: input.symbol,
          direction: input.direction,
          size: input.size,
          entryPrice: input.entryPrice ?? quote.price,
          currentPrice: quote.price,
          stopLoss: input.stopLoss,
          takeProfit: input.takeProfit,
          openedAt: Date.now(),
          userId: input.userId,
          userName: input.userName,
          note: input.note,
        };
        set((s) => ({ positions: [position, ...s.positions] }));
        void meta;
        return position;
      },
      closePosition: (id, exitPrice) => {
        const pos = get().positions.find((p) => p.id === id);
        if (!pos) return;
        const price = exitPrice ?? pos.currentPrice;
        const directionMult = pos.direction === "long" ? 1 : -1;
        const pnl = (price - pos.entryPrice) * pos.size * directionMult;
        set((s) => ({ positions: s.positions.filter((p) => p.id !== id) }));
        useJournalStore.getState().addTrade({
          symbol: pos.symbol,
          direction: pos.direction,
          strategy: "Paper Trade",
          entryPrice: pos.entryPrice,
          exitPrice: price,
          stopLoss: pos.stopLoss,
          takeProfit: pos.takeProfit,
          size: pos.size,
          pnl,
          notes: pos.note ? `Closed from positions page. ${pos.note}` : "Closed from positions page.",
          emotionBefore: "neutral",
          emotionAfter: "neutral",
          userId: pos.userId,
          userName: pos.userName,
        });
        usePortfolioStore.getState().addRealizedPnl(pnl);
      },
      updatePosition: (id, patch) =>
        set((s) => ({
          positions: s.positions.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removePosition: (id) =>
        set((s) => ({ positions: s.positions.filter((p) => p.id !== id) })),
      refreshPrices: (quotes) =>
        set((s) => ({
          positions: s.positions.map((p) => {
            const q = quotes.get(p.symbol);
            return q ? { ...p, currentPrice: q.price } : p;
          }),
        })),
      addComment: (positionId, userId, userName, text) =>
        set((s) => ({
          comments: {
            ...s.comments,
            [positionId]: [
              ...(s.comments[positionId] ?? []),
              { id: uid("c"), userId, userName, text, timestamp: Date.now() },
            ],
          },
        })),
      resetPositions: () => set({ positions: SEED, comments: SEED_COMMENTS }),
    }),
    { name: "trading-positions" }
  )
);

export function positionPnl(pos: Position) {
  const mult = pos.direction === "long" ? 1 : -1;
  return (pos.currentPrice - pos.entryPrice) * pos.size * mult;
}

export function positionPnlPercent(pos: Position) {
  const mult = pos.direction === "long" ? 1 : -1;
  return ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100 * mult;
}