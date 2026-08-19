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

const iso = (t: Date) => t.toISOString().slice(0, 10);
const time = (t: Date) =>
  t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

const SEED_COMMENTS: Record<string, JournalComment[]> = {};

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
trades: [],
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
      resetJournal: () => set({ trades: [], comments: {} }),
    }),
    { name: "trading-journal-v2" }
  )
);