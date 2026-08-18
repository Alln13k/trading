"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MarketDataStatus } from "@/lib/data/mockProvider";
import type { Quote } from "@/lib/types";
import { marketData } from "@/lib/data/provider";
import { marketEvents } from "@/lib/data/marketEvents";
import { useAlertsStore } from "@/lib/stores/alerts-store";
import { usePositionsStore } from "@/lib/stores/positions-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { useUiStore } from "@/lib/stores/ui-store";
import { useActivityStore } from "@/lib/stores/activity-store";
import { useCurrentUser } from "@/lib/stores/settings-store";

export function useMarketVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => marketEvents.subscribe(() => setVersion((v) => v + 1)), []);
  return version;
}

export function useMarketStatus(): MarketDataStatus {
  return useSyncExternalStore(
    (cb) => marketEvents.subscribe(cb),
    () => marketData.status,
    () => marketData.status
  );
}

export function useLiveQuotes(symbols: string[], enabled = true) {
  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map());
  const intervalSec = useSettingsStore((s) => s.settings.data.refreshInterval);
  const autoRefresh = useSettingsStore((s) => s.settings.data.autoRefresh);
  const settingsNotif = useSettingsStore((s) => s.settings.notifications);
  const evaluate = useAlertsStore((s) => s.evaluate);
  const refreshPrices = usePositionsStore((s) => s.refreshPrices);
  const setLastUpdate = useUiStore((s) => s.setLastUpdate);
  const pushToast = useToastStore((s) => s.push);
  const addEvent = useActivityStore((s) => s.addEvent);
  const currentUser = useCurrentUser();
  const lastSymbols = useRef("");

  useEffect(() => {
    const fetchQuotes = async () => {
      const map = (await marketData.getQuotesAsync?.(symbols)) ?? marketData.getQuotes(symbols);
      setQuotes(map);
      setLastUpdate(Date.now());
      refreshPrices(map);
      if (enabled && settingsNotif.alerts) {
        const triggered = evaluate(map);
        if (triggered.length && settingsNotif.alerts) {
          for (const t of triggered.slice(0, 2)) {
            pushToast(t, "warning");
          }
          const ts = triggered.slice(0, 6);
          if (ts.length) {
            for (const t of ts) {
              addEvent({
                userName: currentUser.name,
                userId: currentUser.id,
                action: "alert triggered",
                target: t,
                kind: "alert",
              });
            }
          }
        }
      }
    };
    if (symbols.join(",") !== lastSymbols.current) {
      lastSymbols.current = symbols.join(",");
      void fetchQuotes();
    }
    if (!autoRefresh) return;
    void fetchQuotes();
    const id = setInterval(fetchQuotes, Math.max(2, intervalSec) * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(","), intervalSec, autoRefresh, enabled]);

  return quotes;
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const handler = () => setMatches(m.matches);
    handler();
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

export function useOnClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  handler: () => void,
  active = true
) {
  useEffect(() => {
    if (!active) return;
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler, active]);
}

export function usePrevious<T>(value: T) {
  const [prev, setPrev] = useState<T | undefined>(undefined);
  const [current, setCurrent] = useState(value);
  if (current !== value) {
    setPrev(current);
    setCurrent(value);
  }
  return prev;
}