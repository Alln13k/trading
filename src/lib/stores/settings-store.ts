"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, AppUser } from "@/lib/types";
import { uid } from "@/lib/utils";

const DEFAULT_SETTINGS: AppSettings = {
  profile: {
    name: "Allan",
    email: "allan@trading.local",
    initials: "AL",
  },
  appearance: {
    theme: "dark",
    accent: "indigo",
    compact: false,
    reduceMotion: false,
  },
  currency: "USD",
  timezone: "UTC",
  notifications: {
    alerts: true,
    priceMoves: true,
    news: true,
    activity: true,
  },
  charts: {
    defaultTimeframe: "1h",
    defaultChartType: "candles",
    showVolume: true,
    showGrid: true,
  },
  data: {
    autoRefresh: true,
    refreshInterval: 3,
  },
  users: [
    { id: "u1", name: "Allan", email: "allan@trading.local", role: "owner", color: "from-indigo-500 to-violet-500" },
    { id: "u2", name: "Alex", email: "alex@trading.local", role: "member", color: "from-cyan-500 to-blue-500" },
  ],
};

interface SettingsState {
  settings: AppSettings;
  currentUserId: string;
  setCurrentUser: (id: string) => void;
  updateProfile: (patch: Partial<AppSettings["profile"]>) => void;
  updateAppearance: (patch: Partial<AppSettings["appearance"]>) => void;
  setCurrency: (c: string) => void;
  setTimezone: (t: string) => void;
  updateNotifications: (patch: Partial<AppSettings["notifications"]>) => void;
  updateCharts: (patch: Partial<AppSettings["charts"]>) => void;
  updateData: (patch: Partial<AppSettings["data"]>) => void;
  addUser: (u: Omit<AppUser, "id">) => void;
  updateUser: (id: string, patch: Partial<AppUser>) => void;
  removeUser: (id: string) => void;
  resetAll: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      currentUserId: "u1",
      setCurrentUser: (id) => set({ currentUserId: id }),
      updateProfile: (patch) =>
        set((s) => ({ settings: { ...s.settings, profile: { ...s.settings.profile, ...patch } } })),
      updateAppearance: (patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            appearance: { ...s.settings.appearance, ...patch },
          },
        })),
      setCurrency: (c) => set((s) => ({ settings: { ...s.settings, currency: c } })),
      setTimezone: (t) => set((s) => ({ settings: { ...s.settings, timezone: t } })),
      updateNotifications: (patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            notifications: { ...s.settings.notifications, ...patch },
          },
        })),
      updateCharts: (patch) =>
        set((s) => ({
          settings: { ...s.settings, charts: { ...s.settings.charts, ...patch } },
        })),
      updateData: (patch) =>
        set((s) => ({
          settings: { ...s.settings, data: { ...s.settings.data, ...patch } },
        })),
      addUser: (u) =>
        set((s) => ({
          settings: {
            ...s.settings,
            users: [...s.settings.users, { ...u, id: uid("u") }],
          },
        })),
      updateUser: (id, patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            users: s.settings.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
          },
        })),
      removeUser: (id) =>
        set((s) => ({
          settings: {
            ...s.settings,
            users: s.settings.users.filter((u) => u.id !== id),
          },
        })),
      resetAll: () => set({ settings: DEFAULT_SETTINGS, currentUserId: "u1" }),
    }),
    { name: "trading-settings" }
  )
);

export function useCurrentUser(): AppUser {
  const settings = useSettingsStore((s) => s.settings);
  const currentUserId = useSettingsStore((s) => s.currentUserId);
  return settings.users.find((u) => u.id === currentUserId) ?? settings.users[0];
}