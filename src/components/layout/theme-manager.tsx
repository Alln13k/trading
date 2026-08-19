"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/lib/stores/settings-store";

const ACCENT_VARS: Record<string, { accent: string; bright: string; soft: string }> = {
  indigo: { accent: "#6366f1", bright: "#818cf8", soft: "rgba(99,102,241,0.13)" },
  violet: { accent: "#a855f7", bright: "#c084fc", soft: "rgba(168,85,247,0.13)" },
  cyan: { accent: "#22d3ee", bright: "#67e8f9", soft: "rgba(34,211,238,0.13)" },
  emerald: { accent: "#34d399", bright: "#6ee7b7", soft: "rgba(52,211,153,0.13)" },
};

export function ThemeManager() {
  const theme = useSettingsStore((s) => s.settings.appearance.theme);
  const accent = useSettingsStore((s) => s.settings.appearance.accent);
  const compact = useSettingsStore((s) => s.settings.appearance.compact);
  const reduceMotion = useSettingsStore((s) => s.settings.appearance.reduceMotion);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("reduce-motion", reduceMotion);
    root.classList.toggle("compact", compact);
    const vars = ACCENT_VARS[accent] ?? ACCENT_VARS.indigo;
    root.style.setProperty("--accent", vars.accent);
    root.style.setProperty("--accent-bright", vars.bright);
    root.style.setProperty("--accent-soft", vars.soft);
  }, [theme, accent, compact, reduceMotion]);

  return null;
}