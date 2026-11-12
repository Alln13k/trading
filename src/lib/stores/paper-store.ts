"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/utils";
import { feeOn, netPnl, rMultiple, slippedFill, type Side } from "@/lib/paper/math";

export interface PaperSettings {
  startingBalance: number;
  feeBps: number;
  slippageBps: number;
}

export interface WorkingOrder {
  id: string;
  symbol: string;
  side: Side;
  orderType: "market" | "limit";
  qty: number;
  limitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  note?: string;
  strategyId?: string;
  strategyName?: string;
  createdAt: number;
  userId: string;
  userName: string;
}

export interface OpenPaperPosition {
  id: string;
  symbol: string;
  side: Side;
  qty: number;
  entryPrice: number;
  entryFee: number;
  stopLoss?: number;
  takeProfit?: number;
  note?: string;
  strategyId?: string;
  strategyName?: string;
  openedAt: number;
  lastMark: number;
  /** delayed/cached = a quote is on the mark. frozen = last quote kept. */
  markQuality: "delayed" | "cached" | "frozen";
  userId: string;
  userName: string;
}

export interface ClosedPaperTrade {
  id: string;
  symbol: string;
  side: Side;
  qty: number;
  entryPrice: number;
  exitPrice: number;
  entryFee: number;
  exitFee: number;
  stopLoss?: number;
  takeProfit?: number;
  note?: string;
  strategyId?: string;
  strategyName?: string;
  openedAt: number;
  closedAt: number;
  pnl: number;
  rMultiple: number | null;
  userId: string;
  userName: string;
}

interface QuoteLike {
  price: number;
  quality?: "live" | "delayed" | "cached" | "unavailable";
}

interface PaperState {
  settings: PaperSettings;
  cash: number;
  margin: number;
  orders: WorkingOrder[];
  positions: OpenPaperPosition[];
  closed: ClosedPaperTrade[];
  lastError: string | null;
  setFees: (feeBps: number, slippageBps: number) => string | null;
  setStartingBalance: (amount: number) => string | null;
  placeOrder: (input: {
    symbol: string;
    side: Side;
    orderType: "market" | "limit";
    qty: number;
    limitPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    note?: string;
    strategyId?: string;
    strategyName?: string;
    quote?: QuoteLike;
    userId: string;
    userName: string;
  }) => { ok: true; positionId?: string } | { ok: false; error: string };
  cancelOrder: (id: string) => void;
  closePosition: (id: string, quote?: QuoteLike, note?: string) => { ok: true; trade: ClosedPaperTrade } | { ok: false; error: string };
  mark: (quotes: Map<string, QuoteLike>) => void;
  resetBook: () => void;
}

const DEFAULTS: PaperSettings = { startingBalance: 100_000, feeBps: 0, slippageBps: 0 };

function stopsOk(side: Side, entry: number, stop?: number, take?: number): string | null {
  if (stop !== undefined && !(stop > 0)) return "Stop-loss must be a positive price.";
  if (take !== undefined && !(take > 0)) return "Take-profit must be a positive price.";
  if (stop !== undefined && stop === entry) return "Stop-loss must differ from the fill.";
  if (side === "long") {
    if (stop !== undefined && stop >= entry) return "Long stop-loss must be below the fill.";
    if (take !== undefined && take <= entry) return "Long take-profit must be above the fill.";
  } else {
    if (stop !== undefined && stop <= entry) return "Short stop-loss must be above the fill.";
    if (take !== undefined && take >= entry) return "Short take-profit must be below the fill.";
  }
  return null;
}

export const usePaperStore = create<PaperState>()(
  persist(
    (set, get) => ({
      settings: DEFAULTS,
      cash: DEFAULTS.startingBalance,
      margin: 0,
      orders: [],
      positions: [],
      closed: [],
      lastError: null,
      setFees: (feeBps, slippageBps) => {
        if (!(feeBps >= 0) || !(slippageBps >= 0) || feeBps > 500 || slippageBps > 500) {
          return "Fees and slippage must be between 0 and 500 bps.";
        }
        set((s) => ({ settings: { ...s.settings, feeBps, slippageBps }, lastError: null }));
        return null;
      },
      setStartingBalance: (amount) => {
        const s = get();
        if (!(amount > 0)) return "Starting balance must be positive.";
        if (s.positions.length || s.orders.length || s.closed.length) {
          return "Reset the paper book before changing the starting balance.";
        }
        set({ settings: { ...s.settings, startingBalance: amount }, cash: amount, lastError: null });
        return null;
      },
      placeOrder: (input) => {
        const state = get();
        if (!(input.qty > 0)) return fail(set, "Quantity must be positive.");
        if (input.orderType === "limit" && !(input.limitPrice && input.limitPrice > 0)) {
          return fail(set, "Limit price must be positive.");
        }
        if (input.orderType === "limit") {
          const order: WorkingOrder = {
            id: uid("ord"),
            symbol: input.symbol,
            side: input.side,
            orderType: "limit",
            qty: input.qty,
            limitPrice: input.limitPrice,
            stopLoss: input.stopLoss,
            takeProfit: input.takeProfit,
            note: input.note,
            strategyId: input.strategyId,
            strategyName: input.strategyName,
            createdAt: Date.now(),
            userId: input.userId,
            userName: input.userName,
          };
          set((s) => ({ orders: [order, ...s.orders], lastError: null }));
          if (input.quote && input.quote.price > 0) {
            get().mark(new Map([[input.symbol, input.quote]]));
          }
          return { ok: true };
        }
        if (!input.quote || !(input.quote.price > 0)) {
          return fail(set, "No quote — market order was not filled.");
        }
        const opened = fillAt(set, get, input, input.quote.price);
        return opened;
      },
      cancelOrder: (id) => set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),
      closePosition: (id, quote, note) => {
        const pos = get().positions.find((p) => p.id === id);
        if (!pos) return { ok: false, error: "Position is not open." };
        if (!quote || !(quote.price > 0)) return { ok: false, error: "No quote — position was not closed." };
        const trade = settle(set, get, pos, quote.price, note);
        return { ok: true, trade };
      },
      mark: (quotes) => {
        const state = get();
        const nextPositions = state.positions.map((p) => {
          const q = quotes.get(p.symbol);
          if (q && q.price > 0) {
            return {
              ...p,
              lastMark: q.price,
              markQuality: q.quality === "cached" ? ("cached" as const) : ("delayed" as const),
            };
          }
          return { ...p, markQuality: "frozen" as const };
        });
        set({ positions: nextPositions });
        const live = get();
        for (const order of live.orders) {
          const q = quotes.get(order.symbol);
          if (!q || !(q.price > 0) || order.limitPrice === undefined) continue;
          const crossed = order.side === "long" ? q.price <= order.limitPrice : q.price >= order.limitPrice;
          if (!crossed) continue;
          const filled = fillAt(set, get, order, order.limitPrice, true);
          if (filled.ok) set((s) => ({ orders: s.orders.filter((o) => o.id !== order.id) }));
        }
        const marked = get();
        for (const pos of marked.positions) {
          const q = quotes.get(pos.symbol);
          if (!q || !(q.price > 0)) continue;
          const hitStop =
            pos.stopLoss !== undefined &&
            (pos.side === "long" ? q.price <= pos.stopLoss : q.price >= pos.stopLoss);
          const hitTake =
            pos.takeProfit !== undefined &&
            (pos.side === "long" ? q.price >= pos.takeProfit : q.price <= pos.takeProfit);
          if (hitStop && pos.stopLoss) settle(set, get, pos, pos.stopLoss);
          else if (hitTake && pos.takeProfit) settle(set, get, pos, pos.takeProfit);
        }
      },
      resetBook: () =>
        set({
          cash: get().settings.startingBalance,
          margin: 0,
          orders: [],
          positions: [],
          closed: [],
          lastError: null,
        }),
    }),
    { name: "trading-paper-v1" }
  )
);

function fail(set: (p: Partial<PaperState>) => void, error: string): { ok: false; error: string } {
  set({ lastError: error });
  return { ok: false, error };
}

function fillAt(
  set: (partial: Partial<PaperState> | ((s: PaperState) => Partial<PaperState>)) => void,
  get: () => PaperState,
  input: {
    symbol: string;
    side: Side;
    qty: number;
    stopLoss?: number;
    takeProfit?: number;
    note?: string;
    strategyId?: string;
    strategyName?: string;
    userId: string;
    userName: string;
  },
  rawPrice: number,
  fromLimit = false
): { ok: true; positionId: string } | { ok: false; error: string } {
  const { settings, cash } = get();
  const entry = fromLimit ? rawPrice : slippedFill(rawPrice, input.side, settings.slippageBps, false);
  if (!(entry > 0)) return fail(set, "Fill price was not positive.");
  const stopError = stopsOk(input.side, entry, input.stopLoss, input.takeProfit);
  if (stopError) return fail(set, stopError);
  const entryFee = feeOn(entry * input.qty, settings.feeBps);
  const debit = input.side === "long" ? entry * input.qty + entryFee : entry * input.qty + entryFee;
  if (cash < debit) return fail(set, "Not enough paper cash for this order.");
  const position: OpenPaperPosition = {
    id: uid("ppos"),
    symbol: input.symbol,
    side: input.side,
    qty: input.qty,
    entryPrice: entry,
    entryFee,
    stopLoss: input.stopLoss,
    takeProfit: input.takeProfit,
    note: input.note,
    strategyId: input.strategyId,
    strategyName: input.strategyName,
    openedAt: Date.now(),
    lastMark: rawPrice,
    markQuality: "delayed",
    userId: input.userId,
    userName: input.userName,
  };
  set((s) => ({
    cash: s.cash - entry * input.qty - entryFee,
    margin: s.margin + (input.side === "short" ? entry * input.qty : 0),
    positions: [position, ...s.positions],
    lastError: null,
  }));
  return { ok: true, positionId: position.id };
}

function settle(
  set: (partial: Partial<PaperState> | ((s: PaperState) => Partial<PaperState>)) => void,
  get: () => PaperState,
  pos: OpenPaperPosition,
  rawExit: number,
  note?: string
): ClosedPaperTrade {
  const { settings } = get();
  const exit = slippedFill(rawExit, pos.side, settings.slippageBps, true);
  const exitFee = feeOn(exit * pos.qty, settings.feeBps);
  const pnl = netPnl({
    side: pos.side,
    qty: pos.qty,
    entry: pos.entryPrice,
    exit,
    entryFee: pos.entryFee,
    exitFee,
  });
  const trade: ClosedPaperTrade = {
    id: uid("pcls"),
    symbol: pos.symbol,
    side: pos.side,
    qty: pos.qty,
    entryPrice: pos.entryPrice,
    exitPrice: exit,
    entryFee: pos.entryFee,
    exitFee,
    stopLoss: pos.stopLoss,
    takeProfit: pos.takeProfit,
    note: note ?? pos.note,
    strategyId: pos.strategyId,
    strategyName: pos.strategyName,
    openedAt: pos.openedAt,
    closedAt: Date.now(),
    pnl,
    rMultiple: rMultiple(pnl, pos.entryPrice, pos.stopLoss, pos.qty),
    userId: pos.userId,
    userName: pos.userName,
  };
  set((s) => ({
    positions: s.positions.filter((p) => p.id !== pos.id),
    closed: [trade, ...s.closed],
    cash:
      s.cash +
      (pos.side === "long"
        ? exit * pos.qty - exitFee
        : pos.entryPrice * pos.qty + (pos.entryPrice - exit) * pos.qty - exitFee),
    margin: s.margin - (pos.side === "short" ? pos.entryPrice * pos.qty : 0),
    lastError: null,
  }));
  return trade;
}

export function unrealized(pos: OpenPaperPosition): number {
  const mark = pos.lastMark;
  return pos.side === "long" ? (mark - pos.entryPrice) * pos.qty : (pos.entryPrice - mark) * pos.qty;
}

export function openRisk(pos: OpenPaperPosition): number | null {
  if (pos.stopLoss === undefined) return null;
  return Math.abs(pos.entryPrice - pos.stopLoss) * pos.qty;
}
