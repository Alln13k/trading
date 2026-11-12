export type Side = "long" | "short";

/** Slippage always worsens the fill versus the quote. Zero bps leaves the quote unchanged. */
export function slippedFill(quote: number, side: Side, bps: number, exit: boolean): number {
  const worsenUp = (side === "long" && !exit) || (side === "short" && exit);
  const slip = Math.max(0, bps) / 10_000;
  return worsenUp ? quote * (1 + slip) : quote * (1 - slip);
}

export function feeOn(notional: number, feeBps: number): number {
  return Math.abs(notional) * (Math.max(0, feeBps) / 10_000);
}

export function netPnl(input: {
  side: Side;
  qty: number;
  entry: number;
  exit: number;
  entryFee: number;
  exitFee: number;
}): number {
  const gross =
    input.side === "long"
      ? (input.exit - input.entry) * input.qty
      : (input.entry - input.exit) * input.qty;
  return gross - input.entryFee - input.exitFee;
}

/** Realized P&L divided by initial price risk (abs(entry − stop) × qty). Null when no stop was stored. */
export function rMultiple(pnl: number, entry: number, stop: number | undefined, qty: number): number | null {
  if (stop === undefined || !(stop > 0) || !(qty > 0)) return null;
  const risk = Math.abs(entry - stop) * qty;
  if (!(risk > 0)) return null;
  return pnl / risk;
}

export interface ClosedForStats {
  symbol: string;
  strategyId?: string;
  strategyName?: string;
  closedAt: number;
  pnl: number;
  rMultiple: number | null;
}

export interface PerformanceStats {
  count: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number | null;
  averageR: number | null;
  rSample: number;
  profitFactor: number | null;
  netPnl: number;
  maxDrawdown: number;
  maxDrawdownPct: number | null;
  averageWin: number | null;
  averageLoss: number | null;
  equity: Array<{ at: number; equity: number }>;
}

/**
 * Profit factor = gross winning P&L / absolute gross losing P&L.
 * Breakeven trades (pnl === 0) are in the count but in neither sum.
 * Null when there are no losing trades (the ratio is undefined).
 *
 * Max drawdown = largest peak-to-trough drop on the equity curve.
 * Equity starts at `startingBalance` and adds each closed trade's net P&L in time order.
 * Percent = that drop / the peak equity at the trough. Null when the peak is 0.
 */
export function performanceStats(startingBalance: number, trades: ClosedForStats[]): PerformanceStats {
  const ordered = [...trades].sort((a, b) => a.closedAt - b.closedAt);
  const wins = ordered.filter((t) => t.pnl > 0);
  const losses = ordered.filter((t) => t.pnl < 0);
  const grossWin = wins.reduce((a, t) => a + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
  const rs = ordered.map((t) => t.rMultiple).filter((r): r is number => r !== null);
  let equity = startingBalance;
  let peak = startingBalance;
  let maxDrawdown = 0;
  let maxDrawdownPct: number | null = 0;
  const curve: Array<{ at: number; equity: number }> = [{ at: 0, equity: startingBalance }];
  for (const t of ordered) {
    equity += t.pnl;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
      maxDrawdownPct = peak > 0 ? dd / peak : null;
    }
    curve.push({ at: t.closedAt, equity });
  }
  return {
    count: ordered.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: ordered.length - wins.length - losses.length,
    winRate: ordered.length ? wins.length / ordered.length : null,
    averageR: rs.length ? rs.reduce((a, r) => a + r, 0) / rs.length : null,
    rSample: rs.length,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : null,
    netPnl: ordered.reduce((a, t) => a + t.pnl, 0),
    maxDrawdown,
    maxDrawdownPct,
    averageWin: wins.length ? grossWin / wins.length : null,
    averageLoss: losses.length ? grossLoss / losses.length : null,
    equity: curve,
  };
}
