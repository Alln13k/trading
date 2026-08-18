"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppUser } from "@/lib/types";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { uid } from "@/lib/utils";

const HOUR = 3600_000;

function hoursAgo(h: number) {
  return Date.now() - h * HOUR;
}

interface ActivityState {
  events: ActivityEvent[];
  addEvent: (event: Omit<ActivityEvent, "id" | "timestamp">) => void;
}

export interface ActivityEvent {
  id: string;
  userName: string;
  userId: string;
  action: string;
  target: string;
  timestamp: number;
  kind: "watchlist" | "position" | "journal" | "alert" | "portfolio" | "settings" | "chart";
}

const SEED: ActivityEvent[] = [
  { id: "a1", userName: "Allan", userId: "u1", action: "added", target: "BTC/USD to Crypto watchlist", timestamp: hoursAgo(2), kind: "watchlist" },
  { id: "a2", userName: "Alex", userId: "u2", action: "opened a paper trade on", target: "ETH/USD (Long)", timestamp: hoursAgo(5), kind: "position" },
  { id: "a3", userName: "Allan", userId: "u1", action: "closed", target: "NVDA trade · +$412", timestamp: hoursAgo(26), kind: "journal" },
  { id: "a4", userName: "Alex", userId: "u2", action: "created alert", target: "BTC > 120,000", timestamp: hoursAgo(30), kind: "alert" },
  { id: "a5", userName: "Alex", userId: "u2", action: "added", target: "Gold to Long Term watchlist", timestamp: hoursAgo(49), kind: "watchlist" },
  { id: "a6", userName: "Allan", userId: "u1", action: "updated", target: "portfolio allocation", timestamp: hoursAgo(72), kind: "portfolio" },
];

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      events: SEED,
      addEvent: (event) =>
        set((s) => ({
          events: [{ ...event, id: uid("evt"), timestamp: Date.now() }, ...s.events].slice(0, 200),
        })),
    }),
    { name: "trading-activity" }
  )
);

export function useUsers(): AppUser[] {
  return useSettingsStore((s) => s.settings.users);
}