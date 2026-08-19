"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Watchlist } from "@/lib/types";
import { uid } from "@/lib/utils";

interface WatchlistState {
  watchlists: Watchlist[];
  addWatchlist: (name: string, description?: string, userId?: string, userName?: string) => void;
  removeWatchlist: (id: string) => void;
  renameWatchlist: (id: string, name: string) => void;
  addSymbol: (listId: string, symbol: string) => boolean;
  removeSymbol: (listId: string, symbol: string) => void;
  removeSymbolFromAll: (symbol: string) => void;
  toggleSymbolInAll: (symbol: string) => void;
}

const SEED: Watchlist[] = [];

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchlists: SEED,
      addWatchlist: (name, description, userId = "u1", userName = "Allan") =>
        set((s) => ({
          watchlists: [
            ...s.watchlists,
            {
              id: uid("wl"),
              name,
              description,
              symbols: [],
              createdAt: Date.now(),
              userId,
              userName,
            },
          ],
        })),
      removeWatchlist: (id) =>
        set((s) => ({ watchlists: s.watchlists.filter((w) => w.id !== id) })),
      renameWatchlist: (id, name) =>
        set((s) => ({
          watchlists: s.watchlists.map((w) => (w.id === id ? { ...w, name } : w)),
        })),
      addSymbol: (listId, symbol) => {
        const wl = get().watchlists.find((w) => w.id === listId);
        if (!wl || wl.symbols.includes(symbol)) return false;
        set((s) => ({
          watchlists: s.watchlists.map((w) =>
            w.id === listId ? { ...w, symbols: [...w.symbols, symbol] } : w
          ),
        }));
        return true;
      },
      removeSymbol: (listId, symbol) =>
        set((s) => ({
          watchlists: s.watchlists.map((w) =>
            w.id === listId ? { ...w, symbols: w.symbols.filter((x) => x !== symbol) } : w
          ),
        })),
      removeSymbolFromAll: (symbol) =>
        set((s) => ({
          watchlists: s.watchlists.map((w) => ({
            ...w,
            symbols: w.symbols.filter((x) => x !== symbol),
          })),
        })),
      toggleSymbolInAll: (symbol) => {
        const inAny = get().watchlists.some((w) => w.symbols.includes(symbol));
        if (inAny) {
          set((s) => ({
            watchlists: s.watchlists.map((w) => ({
              ...w,
              symbols: w.symbols.filter((x) => x !== symbol),
            })),
          }));
        } else {
          const first = get().watchlists[0];
          if (first) get().addSymbol(first.id, symbol);
        }
      },
    }),
    { name: "trading-watchlists-v2" }
  )
);