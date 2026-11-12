"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DataBadge } from "@/components/data/data-badge";
import { useLiveQuotes } from "@/lib/hooks";
import { useCurrentUser } from "@/lib/stores/settings-store";
import { useStrategiesStore } from "@/lib/stores/strategies-store";
import { openRisk, unrealized, usePaperStore, type OpenPaperPosition } from "@/lib/stores/paper-store";
import { TRENDING_SYMBOLS, displaySymbol } from "@/lib/data/symbols";
import { formatCurrency, formatPrice } from "@/lib/utils";

export default function PaperPage() {
  const user = useCurrentUser();
  const strategies = useStrategiesStore((s) => s.notes);
  const settings = usePaperStore((s) => s.settings);
  const cash = usePaperStore((s) => s.cash);
  const margin = usePaperStore((s) => s.margin);
  const orders = usePaperStore((s) => s.orders);
  const positions = usePaperStore((s) => s.positions);
  const closed = usePaperStore((s) => s.closed);
  const lastError = usePaperStore((s) => s.lastError);
  const setFees = usePaperStore((s) => s.setFees);
  const setStartingBalance = usePaperStore((s) => s.setStartingBalance);
  const placeOrder = usePaperStore((s) => s.placeOrder);
  const cancelOrder = usePaperStore((s) => s.cancelOrder);
  const closePosition = usePaperStore((s) => s.closePosition);
  const mark = usePaperStore((s) => s.mark);
  const resetBook = usePaperStore((s) => s.resetBook);

  const [symbol, setSymbol] = useState("BTC");
  const [side, setSide] = useState<"long" | "short">("long");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [qty, setQty] = useState("0.01");
  const [limitPrice, setLimitPrice] = useState("");
  const [stop, setStop] = useState("");
  const [take, setTake] = useState("");
  const [note, setNote] = useState("");
  const [strategyId, setStrategyId] = useState("");
  const [balance, setBalance] = useState(String(settings.startingBalance));
  const [feeBps, setFeeBps] = useState(String(settings.feeBps));
  const [slipBps, setSlipBps] = useState(String(settings.slippageBps));
  const [formError, setFormError] = useState<string | null>(null);

  const symbols = useMemo(
    () => Array.from(new Set([symbol, ...positions.map((p) => p.symbol), ...orders.map((o) => o.symbol), ...TRENDING_SYMBOLS])),
    [symbol, positions, orders]
  );
  const quotes = useLiveQuotes(symbols);
  const quote = quotes.get(symbol);

  useEffect(() => {
    if (quotes.size) mark(quotes);
  }, [quotes, mark]);

  const openPnl = positions.reduce((a, p) => a + unrealized(p), 0);
  const equity = cash + margin + openPnl;

  const submit = () => {
    const strategy = strategies.find((s) => s.id === strategyId);
    const result = placeOrder({
      symbol,
      side,
      orderType,
      qty: Number(qty),
      limitPrice: limitPrice ? Number(limitPrice) : undefined,
      stopLoss: stop ? Number(stop) : undefined,
      takeProfit: take ? Number(take) : undefined,
      note: note.trim() || undefined,
      strategyId: strategy?.id,
      strategyName: strategy?.name,
      quote: quote && quote.price > 0 ? quote : undefined,
      userId: user.id,
      userName: user.name,
    });
    setFormError(result.ok ? null : result.error);
  };

  return (
    <div>
      <PageHeader
        title="Paper trading"
        description="Local book only. Fills come from the delayed Yahoo quote, plus your fee and slippage settings. A missing quote rejects the order."
      />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Stat label="Cash" value={formatCurrency(cash)} />
        <Stat label="Equity" value={formatCurrency(equity)} />
        <Stat label="Open P&L" value={formatCurrency(openPnl)} />
        <Stat label="Starting balance" value={formatCurrency(settings.startingBalance)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{displaySymbol(symbol)}</span>
              {quote && quote.price > 0 ? (
                <span className="flex items-center gap-2">
                  {formatPrice(quote.price)}
                  <DataBadge quality={quote.quality} />
                </span>
              ) : (
                <DataBadge quality="unavailable" />
              )}
            </div>
            <Select value={symbol} onChange={(e) => setSymbol(e.target.value)} data-testid="paper-symbol">
              {TRENDING_SYMBOLS.map((s) => (
                <option key={s} value={s}>{displaySymbol(s)}</option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Select value={side} onChange={(e) => setSide(e.target.value as "long" | "short")} data-testid="paper-side">
                <option value="long">Long</option>
                <option value="short">Short</option>
              </Select>
              <Select value={orderType} onChange={(e) => setOrderType(e.target.value as "market" | "limit")} data-testid="paper-type">
                <option value="market">Market</option>
                <option value="limit">Limit</option>
              </Select>
            </div>
            <Input data-testid="paper-qty" type="number" step="any" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Quantity" />
            {orderType === "limit" && (
              <Input data-testid="paper-limit" type="number" step="any" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder="Limit price" />
            )}
            <Input data-testid="paper-stop" type="number" step="any" value={stop} onChange={(e) => setStop(e.target.value)} placeholder="Stop-loss (optional)" />
            <Input data-testid="paper-take" type="number" step="any" value={take} onChange={(e) => setTake(e.target.value)} placeholder="Take-profit (optional)" />
            <Select value={strategyId} onChange={(e) => setStrategyId(e.target.value)}>
              <option value="">No strategy</option>
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            <Input data-testid="paper-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" />
            <Button data-testid="paper-submit" className="w-full" onClick={submit}>
              {orderType === "market" ? "Submit market order" : "Place limit order"}
            </Button>
            {formError && <p className="text-xs text-down">{formError}</p>}
            {lastError && !formError && <p className="text-xs text-down">{lastError}</p>}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open positions</CardTitle>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <p className="text-sm text-muted">No open paper positions.</p>
              ) : (
                <ul className="space-y-3">
                  {positions.map((p) => (
                    <PositionRow
                      key={p.id}
                      position={p}
                      onClose={() => {
                        const q = quotes.get(p.symbol);
                        const result = closePosition(p.id, q && q.price > 0 ? q : undefined);
                        setFormError(result.ok ? null : result.error);
                      }}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Working orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-muted">No resting limit orders.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-2">
                      <span>
                        {o.side} {displaySymbol(o.symbol)} {o.qty} @ {o.limitPrice !== undefined ? formatPrice(o.limitPrice) : "—"}
                      </span>
                      <Button variant="ghost" onClick={() => cancelOrder(o.id)}>Cancel</Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Closed trades</CardTitle>
        </CardHeader>
        <CardContent>
          {closed.length === 0 ? (
            <p className="text-sm text-muted">No closed paper trades yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" data-testid="paper-history">
                <thead className="text-[11px] uppercase text-muted">
                  <tr>
                    <th className="py-2 pr-3">Instrument</th>
                    <th className="py-2 pr-3">Side</th>
                    <th className="py-2 pr-3">Qty</th>
                    <th className="py-2 pr-3">Entry</th>
                    <th className="py-2 pr-3">Exit</th>
                    <th className="py-2 pr-3">Fees</th>
                    <th className="py-2 pr-3">Net P&L</th>
                    <th className="py-2 pr-3">R</th>
                    <th className="py-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {closed.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="py-2 pr-3">{displaySymbol(t.symbol)}</td>
                      <td className="py-2 pr-3">{t.side}</td>
                      <td className="py-2 pr-3">{t.qty}</td>
                      <td className="py-2 pr-3">{formatPrice(t.entryPrice)}</td>
                      <td className="py-2 pr-3">{formatPrice(t.exitPrice)}</td>
                      <td className="py-2 pr-3">{formatCurrency(t.entryFee + t.exitFee)}</td>
                      <td className={`py-2 pr-3 ${t.pnl >= 0 ? "text-up" : "text-down"}`}>{formatCurrency(t.pnl)}</td>
                      <td className="py-2 pr-3">{t.rMultiple === null ? "—" : t.rMultiple.toFixed(2)}</td>
                      <td className="py-2 text-muted">{t.note ?? t.strategyName ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Account settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          <Input value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Starting balance" />
          <Input value={feeBps} onChange={(e) => setFeeBps(e.target.value)} placeholder="Fee bps / side" />
          <Input value={slipBps} onChange={(e) => setSlipBps(e.target.value)} placeholder="Slippage bps" />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                const feeError = setFees(Number(feeBps), Number(slipBps));
                const balError = setStartingBalance(Number(balance));
                setFormError(feeError ?? balError);
              }}
            >
              Save
            </Button>
            <Button variant="ghost" onClick={() => resetBook()}>Reset book</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-3">
        <div className="text-[11px] uppercase text-muted">{label}</div>
        <div className="mt-1 text-lg font-medium">{value}</div>
      </CardContent>
    </Card>
  );
}

function PositionRow({ position, onClose }: { position: OpenPaperPosition; onClose: () => void }) {
  const risk = openRisk(position);
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 text-sm last:border-0">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{displaySymbol(position.symbol)}</span>
          <span className="text-muted">{position.side} {position.qty}</span>
          <DataBadge quality={position.markQuality === "frozen" ? "cached" : position.markQuality} />
          {position.markQuality === "frozen" && <span className="text-[11px] text-muted">Last price frozen</span>}
        </div>
        <div className="mt-1 text-xs text-muted">
          Entry {formatPrice(position.entryPrice)} · Mark {formatPrice(position.lastMark)}
          {position.stopLoss !== undefined && ` · SL ${formatPrice(position.stopLoss)}`}
          {position.takeProfit !== undefined && ` · TP ${formatPrice(position.takeProfit)}`}
          {risk !== null && ` · Risk ${formatCurrency(risk)}`}
          {position.note ? ` · ${position.note}` : ""}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={unrealized(position) >= 0 ? "text-up" : "text-down"}>{formatCurrency(unrealized(position))}</span>
        <Button data-testid="paper-close" variant="secondary" onClick={onClose}>Close at market</Button>
      </div>
    </li>
  );
}
