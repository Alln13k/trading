"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Alert, Quote } from "@/lib/types";
import { rsi, ema } from "@/lib/indicators";
import { marketData } from "@/lib/data/provider";
import { uid } from "@/lib/utils";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  kind: "alert" | "price" | "news" | "system";
}

interface AlertsState {
  alerts: Alert[];
  notifications: AppNotification[];
  addAlert: (a: Omit<Alert, "id" | "createdAt" | "active">) => Alert;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  updateAlertValue: (id: string, value: number) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  pushNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  evaluate: (quotes: Map<string, Quote>) => string[];
  resetAlerts: () => void;
}

const daysAgo = (d: number) => Date.now() - d * 86400000;

const SEED: Alert[] = [
  { id: "al1", symbol: "BTC", type: "price_above", value: 120000, active: true, createdAt: daysAgo(3), userId: "u1", userName: "Allan" },
  { id: "al2", symbol: "EURUSD", type: "price_below", value: 1.08, active: true, createdAt: daysAgo(2), userId: "u2", userName: "Alex" },
  { id: "al3", symbol: "BTC", type: "rsi_below", value: 30, active: true, createdAt: daysAgo(1), userId: "u1", userName: "Allan" },
  { id: "al4", symbol: "NVDA", type: "price_above", value: 185, active: false, createdAt: daysAgo(5), userId: "u2", userName: "Alex" },
  { id: "al5", symbol: "GOLD", type: "cross_ema", value: 50, active: true, createdAt: daysAgo(1.5), userId: "u1", userName: "Allan" },
];

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set, get) => ({
      alerts: SEED,
      notifications: [
        {
          id: "nt1",
          title: "Welcome to NexTrade",
          body: "Allan and Alex are now connected on the workspace.",
          timestamp: daysAgo(0.4),
          read: false,
          kind: "system",
        },
      ],
      addAlert: (a) => {
        const alert: Alert = { ...a, id: uid("al"), createdAt: Date.now(), active: true };
        set((s) => ({ alerts: [alert, ...s.alerts] }));
        return alert;
      },
      removeAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
      toggleAlert: (id) =>
        set((s) => ({
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, active: !a.active } : a)),
        })),
      updateAlertValue: (id, value) =>
        set((s) => ({
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, value } : a)),
        })),
      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      pushNotification: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: uid("nt"), timestamp: Date.now(), read: false },
            ...s.notifications,
          ].slice(0, 60),
        })),
      evaluate: (quotes) => {
        const triggered: string[] = [];
        const state = get();
        for (const alert of state.alerts) {
          if (!alert.active) continue;
          const quote = quotes.get(alert.symbol);
          if (!quote) continue;
          let hit = false;
          let body = "";
          const symbolName = alert.symbol;
          if (alert.type === "price_above" && quote.price >= alert.value) {
            hit = true;
            body = `${symbolName} crossed above ${alert.value.toLocaleString()}`;
          } else if (alert.type === "price_below" && quote.price <= alert.value) {
            hit = true;
            body = `${symbolName} crossed below ${alert.value.toLocaleString()}`;
          } else if (alert.type === "rsi_above" || alert.type === "rsi_below") {
            if (!marketData.hasLiveCandles?.(alert.symbol, "1h")) {
              void marketData.getCandlesAsync?.(alert.symbol, "1h", 80);
              continue;
            }
            const candles = marketData.getCandles(alert.symbol, "1h", 40);
            const r = rsi(candles, 14);
            const last = r[r.length - 1]?.value;
            if (last === undefined) continue;
            if (alert.type === "rsi_above" && last >= alert.value) {
              hit = true;
              body = `${symbolName} RSI(14) above ${alert.value} (${last.toFixed(1)})`;
            }
            if (alert.type === "rsi_below" && last <= alert.value) {
              hit = true;
              body = `${symbolName} RSI(14) below ${alert.value} (${last.toFixed(1)})`;
            }
          } else if (alert.type === "cross_ema") {
            if (!marketData.hasLiveCandles?.(alert.symbol, "1h")) {
              void marketData.getCandlesAsync?.(alert.symbol, "1h", 80);
              continue;
            }
            const candles = marketData.getCandles(alert.symbol, "1h", 80);
            const e = ema(candles, alert.value);
            const lastC = candles[candles.length - 1];
            const prevC = candles[candles.length - 2];
            const lastE = e[e.length - 1];
            const prevE = e[e.length - 2];
            if (lastC && prevC && lastE && prevE) {
              const crossedUp = prevC.close <= prevE.value && lastC.close > lastE.value;
              const crossedDown = prevC.close >= prevE.value && lastC.close < lastE.value;
              if (crossedUp || crossedDown) {
                hit = true;
                body = `${symbolName} crossed EMA(${alert.value}) ${crossedUp ? "upward" : "downward"}`;
              }
            }
          }
          if (hit) {
            const notif: AppNotification = {
              id: uid("nt"),
              title: `Alert triggered · ${symbolName}`,
              body,
              timestamp: Date.now(),
              read: false,
              kind: "alert",
            };
            set((s) => ({
              alerts: s.alerts.map((a) =>
                a.id === alert.id ? { ...a, lastTriggeredAt: Date.now() } : a
              ),
              notifications: [notif, ...s.notifications].slice(0, 60),
            }));
            triggered.push(body);
          }
        }
        return triggered;
      },
      resetAlerts: () => set({ alerts: SEED, notifications: [] }),
    }),
    { name: "trading-alerts" }
  )
);