"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Trade } from "@/lib/types";
import { uid } from "@/lib/utils";

export interface JournalComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

interface JournalState {
  trades: Trade[];
  comments: Record<string, JournalComment[]>;
  addTrade: (t: Omit<Trade, "id" | "date" | "time" | "timestamp" | "result">) => Trade;
  updateTrade: (id: string, patch: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  addComment: (tradeId: string, userId: string, userName: string, text: string) => void;
  resetJournal: () => void;
}

const d = (days: number, h = 0, m = 0) => {
  const t = new Date(Date.now() - days * 86400000);
  t.setHours(h, m, 0, 0);
  return t;
};

const iso = (t: Date) => t.toISOString().slice(0, 10);
const time = (t: Date) =>
  t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

function seedTrades(): Trade[] {
  const list: Array<Partial<Trade> & { days: number; h: number; m: number }> = [
    { days: 2, h: 14, m: 32, symbol: "NVDA", direction: "long", strategy: "Breakout", entryPrice: 168.4, exitPrice: 172.6, stopLoss: 164, takeProfit: 175, size: 15, pnl: 63, notes: "Clear breakout above consolidation with volume confirmation.", emotionBefore: "Confident", emotionAfter: "Satisfied", userId: "u1", userName: "Allan" },
    { days: 2, h: 9, m: 5, symbol: "BTC", direction: "long", strategy: "Trend Following", entryPrice: 95800, exitPrice: 96600, stopLoss: 94500, takeProfit: 98000, size: 0.05, pnl: 40, notes: "Pulled back to EMA20 and resumed. Small size due to weekend.", emotionBefore: "Patient", emotionAfter: "Calm", userId: "u2", userName: "Alex" },
    { days: 4, h: 15, m: 48, symbol: "EURUSD", direction: "short", strategy: "Range Trading", entryPrice: 1.0895, exitPrice: 1.0842, stopLoss: 1.093, takeProfit: 1.083, size: 20000, pnl: 106, notes: "Shorted at range top, exited before US data.", emotionBefore: "Focused", emotionAfter: "Content", userId: "u1", userName: "Allan" },
    { days: 5, h: 11, m: 20, symbol: "TSLA", direction: "long", strategy: "EMA Pullback", entryPrice: 315.2, exitPrice: 302.4, stopLoss: 322, takeProfit: 305, size: 10, pnl: -128, notes: "Broke below EMA20, cut loss quickly. Right decision but bad timing.", emotionBefore: "Eager", emotionAfter: "Disappointed", userId: "u1", userName: "Allan" },
    { days: 6, h: 10, m: 2, symbol: "SOL", direction: "long", strategy: "RSI Reversal", entryPrice: 162.5, exitPrice: 168.9, stopLoss: 158, takeProfit: 172, size: 20, pnl: 128, notes: "RSI oversold + support at 160 held. Textbook reversal.", emotionBefore: "Skeptical", emotionAfter: "Excited", userId: "u2", userName: "Alex" },
    { days: 8, h: 16, m: 30, symbol: "GOLD", direction: "long", strategy: "Trend Following", entryPrice: 3128, exitPrice: 3154, stopLoss: 3100, takeProfit: 3175, size: 1, pnl: 26, notes: "Trend continues, held through pullbacks.", emotionBefore: "Calm", emotionAfter: "Calm", userId: "u2", userName: "Alex" },
    { days: 9, h: 13, m: 44, symbol: "USDJPY", direction: "long", strategy: "News Play", entryPrice: 151.2, exitPrice: 150.35, stopLoss: 151.9, takeProfit: 150.4, size: 10000, pnl: -85, notes: "Traded against trend after a headline. Rookie mistake.", emotionBefore: "Impulsive", emotionAfter: "Frustrated", userId: "u1", userName: "Allan" },
    { days: 11, h: 9, m: 55, symbol: "AAPL", direction: "long", strategy: "Breakout", entryPrice: 231.8, exitPrice: 237.4, stopLoss: 228, takeProfit: 240, size: 10, pnl: 56, notes: "Earnings gap hold, bought the retest of breakout level.", emotionBefore: "Prepared", emotionAfter: "Happy", userId: "u1", userName: "Allan" },
    { days: 12, h: 17, m: 10, symbol: "ETH", direction: "short", strategy: "Range Trading", entryPrice: 3390, exitPrice: 3420, stopLoss: 3350, takeProfit: 3450, size: 0.9, pnl: -27, notes: "Counter-trend short against strong momentum.", emotionBefore: "Overconfident", emotionAfter: "Humbled", userId: "u2", userName: "Alex" },
    { days: 14, h: 15, m: 25, symbol: "SPX", direction: "long", strategy: "EMA Pullback", entryPrice: 6188, exitPrice: 6210, stopLoss: 6150, takeProfit: 6240, size: 5, pnl: 110, notes: "Index pullback to 20 EMA held, strong daily close.", emotionBefore: "Neutral", emotionAfter: "Satisfied", userId: "u1", userName: "Allan" },
    { days: 15, h: 8, m: 40, symbol: "DOGE", direction: "long", strategy: "Momentum", entryPrice: 0.241, exitPrice: 0.228, stopLoss: 0.248, takeProfit: 0.225, size: 5000, pnl: -65, notes: "FOMO entry on a spike. Need a defined setup before entering.", emotionBefore: "FOMO", emotionAfter: "Regretful", userId: "u2", userName: "Alex" },
    { days: 17, h: 12, m: 15, symbol: "NVDA", direction: "long", strategy: "Trend Following", entryPrice: 141.5, exitPrice: 155.2, stopLoss: 136, takeProfit: 160, size: 10, pnl: 137, notes: "Rode the trend for 3 days, exited near resistance.", emotionBefore: "Disciplined", emotionAfter: "Proud", userId: "u1", userName: "Allan" },
    { days: 19, h: 14, m: 50, symbol: "GBPUSD", direction: "long", strategy: "Breakout", entryPrice: 1.2642, exitPrice: 1.2688, stopLoss: 1.2605, takeProfit: 1.27, size: 15000, pnl: 69, notes: "Daily range breakout with lower time frame confirmation.", emotionBefore: "Alert", emotionAfter: "Satisfied", userId: "u2", userName: "Alex" },
    { days: 21, h: 10, m: 5, symbol: "XRP", direction: "short", strategy: "RSI Reversal", entryPrice: 2.41, exitPrice: 2.38, stopLoss: 2.46, takeProfit: 2.32, size: 1000, pnl: -30, notes: "RSI exit, but trend too strong — should wait for confirmation.", emotionBefore: "Impatient", emotionAfter: "Resigned", userId: "u1", userName: "Allan" },
  ];
  return list
    .map(({ days, h, m, ...t }) => {
      const ts = d(days, h, m);
      return {
        id: uid("tr"),
        ...(t as Omit<Trade, "id" | "date" | "time" | "timestamp">),
        date: iso(ts),
        time: time(ts),
        timestamp: ts.getTime(),
        result: (t.pnl ?? 0) > 0.5 ? "win" : (t.pnl ?? 0) < -0.5 ? "loss" : "breakeven",
      } as Trade;
    })
    .sort((a, b) => b.timestamp - a.timestamp);
}

const SEED_COMMENTS: Record<string, JournalComment[]> = {};

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      trades: seedTrades(),
      comments: SEED_COMMENTS,
      addTrade: (t) => {
        const now = new Date();
        const trade: Trade = {
          ...t,
          id: uid("tr"),
          date: iso(now),
          time: time(now),
          timestamp: now.getTime(),
          result: t.pnl > 0.5 ? "win" : t.pnl < -0.5 ? "loss" : "breakeven",
        };
        set((s) => ({ trades: [trade, ...s.trades] }));
        return trade;
      },
      updateTrade: (id, patch) =>
        set((s) => ({
          trades: s.trades.map((t) => {
            if (t.id !== id) return t;
            const next = { ...t, ...patch };
            next.result = next.pnl > 0.5 ? "win" : next.pnl < -0.5 ? "loss" : "breakeven";
            return next;
          }),
        })),
      deleteTrade: (id) =>
        set((s) => ({ trades: s.trades.filter((t) => t.id !== id) })),
      addComment: (tradeId, userId, userName, text) =>
        set((s) => ({
          comments: {
            ...s.comments,
            [tradeId]: [
              ...(s.comments[tradeId] ?? []),
              { id: uid("c"), userId, userName, text, timestamp: Date.now() },
            ],
          },
        })),
      resetJournal: () => set({ trades: seedTrades(), comments: {} }),
    }),
    { name: "trading-journal" }
  )
);