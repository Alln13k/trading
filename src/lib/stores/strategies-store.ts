"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/utils";

export interface StrategyNote {
  id: string;
  name: string;
  setup: string;
  invalidation: string;
  markets: string;
  userId: string;
  userName: string;
  createdAt: number;
}

interface StrategiesState {
  notes: StrategyNote[];
  add: (note: Omit<StrategyNote, "id" | "createdAt">) => void;
  update: (id: string, patch: Partial<Pick<StrategyNote, "name" | "setup" | "invalidation" | "markets">>) => void;
  remove: (id: string) => void;
}

export const useStrategiesStore = create<StrategiesState>()(
  persist(
    (set) => ({
      notes: [],
      add: (note) =>
        set((s) => ({
          notes: [{ ...note, id: uid("st"), createdAt: Date.now() }, ...s.notes],
        })),
      update: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        })),
      remove: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
    }),
    { name: "trading-strategies-v1" }
  )
);
