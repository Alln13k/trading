"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppUser } from "@/lib/types";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { uid } from "@/lib/utils";

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

const SEED: ActivityEvent[] = [];

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      events: SEED,
      addEvent: (event) =>
        set((s) => ({
          events: [{ ...event, id: uid("evt"), timestamp: Date.now() }, ...s.events].slice(0, 200),
        })),
    }),
    { name: "trading-activity-v2" }
  )
);

export function useUsers(): AppUser[] {
  return useSettingsStore((s) => s.settings.users);
}