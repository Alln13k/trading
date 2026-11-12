"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** localStorage only. `assertSqliteKey` rejects this store's name, so the key never enters SQLite. */
interface AiSettingsState {
  baseUrl: string;
  apiKey: string;
  model: string;
  setAi: (patch: { baseUrl?: string; apiKey?: string; model?: string }) => void;
  clearKey: () => void;
}

export const useAiSettingsStore = create<AiSettingsState>()(
  persist(
    (set) => ({
      baseUrl: "",
      apiKey: "",
      model: "",
      setAi: (patch) =>
        set((s) => ({
          baseUrl: patch.baseUrl !== undefined ? patch.baseUrl.trim() : s.baseUrl,
          apiKey: patch.apiKey !== undefined ? patch.apiKey.trim() : s.apiKey,
          model: patch.model !== undefined ? patch.model.trim() : s.model,
        })),
      clearKey: () => set({ apiKey: "" }),
    }),
    { name: "trading-ai-v1" }
  )
);
