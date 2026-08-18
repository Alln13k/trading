"use client";

import { create } from "zustand";
import { isDemoMode } from "@/lib/data/provider";

interface UiState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (v: boolean) => void;
  selectedSymbol: string;
  setSelectedSymbol: (s: string) => void;
  lastUpdate: number;
  setLastUpdate: (t: number) => void;
  demoMode: boolean;
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
  notificationsOpen: false,
  setNotificationsOpen: (v) => set({ notificationsOpen: v }),
  selectedSymbol: "BTC",
  setSelectedSymbol: (s) => set({ selectedSymbol: s }),
  lastUpdate: Date.now(),
  setLastUpdate: (t) => set({ lastUpdate: t }),
  demoMode: isDemoMode(),
}));