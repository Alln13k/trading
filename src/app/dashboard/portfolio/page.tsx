"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { marketData } from "@/lib/data/provider";
import { useLiveQuotes } from "@/lib/hooks";
import { usePortfolioStore } from "@/lib/stores/portfolio-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { useActivityStore } from "@/lib/stores/activity-store";
import { useCurrentUser } from "@/lib/stores/settings-store";
import {
  cn,
  formatCurrency,
  formatPercent,
  formatSignedNumber,
  formatPrice,
} from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { SymbolIcon } from "@/components/ui/avatar";
import { SymbolSearch } from "@/components/market/symbol-search";
import { ConfirmDialog } from "@/components/ui/confirm";

interface HoldingRow {
  symbol: string;
  quantity: number;
  avgCost: number;
  stopLoss?: number;
  takeProfit?: number;
  price: number;
  value: number;
  pnl: number;
  pnlPct: number;
  dayPnl: number;
  weight: number;
  user: string;
}

export default function PortfolioPage() {
  const portfolio = usePortfolioStore();
  const push = useToastStore((s) => s.push);
  const addEvent = useActivityStore((s) => s.addEvent);
  const currentUser = useCurrentUser();

  const holdingSymbols = portfolio.holdings.map((h) => h.symbol);
  const quotes = useLiveQuotes(holdingSymbols);

  const [addOpen, setAddOpen] = useState(false);
  const [addSymbol, setAddSymbol] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [editSymbol, setEditSymbol] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editSl, setEditSl] = useState("");
  const [editTp, setEditTp] = useState("");
  const [deleteSymbol, setDeleteSymbol] = useState<string | null>(null);

  const rows: HoldingRow[] = useMemo(() => {
    const list: HoldingRow[] = [];
    for (const h of portfolio.holdings) {
      const q = quotes.get(h.symbol);
      if (!q) continue;
      const price = q.price;
      const value = price * h.quantity;
      const pnl = (price - h.avgCost) * h.quantity;
      const pnlPct = ((price - h.avgCost) / h.avgCost) * 100;
      list.push({
        symbol: h.symbol,
        quantity: h.quantity,
        avgCost: h.avgCost,
        stopLoss: h.stopLoss,
        takeProfit: h.takeProfit,
        price,
        value,
        pnl,
        pnlPct,
        dayPnl: q.change * h.quantity,
        weight: 0,
        user: h.userName,
      });
    }
    const total = list.reduce((a, r) => a + r.value, 0);
    for (const r of list) r.weight = total > 0 ? (r.value / total) * 100 : 0;
    return list.sort((a, b) => b.value - a.value);
  }, [portfolio.holdings, quotes]);

  const holdingsValue = rows.reduce((a, r) => a + r.value, 0);
  const totalValue = portfolio.cash + holdingsValue;
  const totalReturn = portfolio.initialCapital > 0 ? ((totalValue - portfolio.initialCapital) / portfolio.initialCapital) * 100 : 0;
  const totalPnl = totalValue - portfolio.initialCapital;
  const dayPnl = rows.reduce((a, r) => a + r.dayPnl, 0);
  const equity = portfolio.equityHistory;

  const allocation = rows.map((r) => ({
    symbol: r.symbol,
    value: r.value,
    pct: r.weight,
    color: marketData.getSymbol(r.symbol)?.color ?? "#818cf8",
  }));

  const submitAdd = () => {
    const sym = addSymbol;
    const q = parseFloat(qty);
    const p = parseFloat(price);
    if (!sym || !isFinite(q) || q <= 0) {
      push("Enter a valid quantity", "error");
      return;
    }
    const meta = marketData.getSymbol(sym);
    const finalPrice = isFinite(p) && p > 0 ? p : meta ? meta.basePrice : 0;
    portfolio.addHolding({
      symbol: sym,
      quantity: q,
      avgCost: finalPrice,
      stopLoss: parseFloat(sl) || undefined,
      takeProfit: parseFloat(tp) || undefined,
      userId: currentUser.id,
      userName: currentUser.name,
    });
    const cost = q * finalPrice;
    portfolio.setCash(Math.max(0, portfolio.cash - cost));
    setAddOpen(false);
    setAddSymbol("");
    setQty("");
    setPrice("");
    setSl("");
    setTp("");
    push(`Added ${sym} to portfolio`, "success", `${q} @ ${formatPrice(finalPrice)}`);
    addEvent({
      userName: currentUser.name,
      userId: currentUser.id,
      action: "added",
      target: `${sym} to the portfolio`,
      kind: "portfolio",
    });
  };

  const submitEdit = () => {
    if (!editSymbol) return;
    const q = parseFloat(editQty);
    if (!isFinite(q) || q <= 0) {
      push("Enter a valid quantity", "error");
      return;
    }
    portfolio.updateHolding(editSymbol, {
      quantity: q,
      stopLoss: parseFloat(editSl) || undefined,
      takeProfit: parseFloat(editTp) || undefined,
    });
    setEditSymbol(null);
    push("Holding updated", "success");
  };

  const openEdit = (symbol: string) => {
    const h = portfolio.holdings.find((x) => x.symbol === symbol);
    if (!h) return;
    setEditSymbol(symbol);
    setEditQty(String(h.quantity));
    setEditSl(h.stopLoss ? String(h.stopLoss) : "");
    setEditTp(h.takeProfit ? String(h.takeProfit) : "");
  };

  const confirmDelete = () => {
    if (!deleteSymbol) return;
    const h = portfolio.holdings.find((x) => x.symbol === deleteSymbol);
    if (h) {
      portfolio.setCash(portfolio.cash + (quotes.get(deleteSymbol)?.price ?? h.avgCost) * h.quantity);
    }
    portfolio.removeHolding(deleteSymbol);
    setDeleteSymbol(null);
    push(`${deleteSymbol} removed — cash credited`, "info");
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Portfolio"
        description="Paper account — $100,000 virtual balance, live market quotes, no real money."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-3.5" /> Add asset
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total value" value={formatCurrency(totalValue)} delta={`${formatSignedNumber(totalReturn)}%`} deltaPositive={totalReturn >= 0} />
        <Stat label="Cash" value={formatCurrency(portfolio.cash)} hint={`Initial ${formatCurrency(portfolio.initialCapital)}`} />
        <Stat label="Total P&L" value={`${totalPnl >= 0 ? "+" : ""}${formatCurrency(totalPnl)}`} delta={formatPercent(totalReturn)} deltaPositive={totalPnl >= 0} />
        <Stat label="Day P&L" value={`${dayPnl >= 0 ? "+" : ""}${formatCurrency(dayPnl)}`} deltaPositive={dayPnl >= 0} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
            <CardDescription>{rows.length} assets · exposure {formatCurrency(holdingsValue)}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<Plus />}
                  title="Portfolio is empty"
                  description="Add your first asset — search for any symbol and set quantity and entry price."
                  action={
                    <Button size="sm" onClick={() => setAddOpen(true)}>
                      <Plus className="size-3.5" /> Add asset
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
                      <th className="px-4 py-2 font-medium">Asset</th>
                      <th className="px-3 py-2 font-medium">Qty</th>
                      <th className="px-3 py-2 font-medium">Avg cost</th>
                      <th className="px-3 py-2 font-medium">Price</th>
                      <th className="px-3 py-2 font-medium">Value</th>
                      <th className="px-3 py-2 font-medium">P&L</th>
                      <th className="px-3 py-2 font-medium">P&L %</th>
                      <th className="px-3 py-2 font-medium">Weight</th>
                      <th className="px-3 py-2 font-medium">By</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {rows.map((r) => {
                      const meta = marketData.getSymbol(r.symbol);
                      const positive = r.pnl >= 0;
                      return (
                        <tr key={r.symbol} className="group text-[12px] transition-colors hover:bg-raised/40">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <SymbolIcon symbol={r.symbol} color={meta?.color} size="sm" />
                              <div>
                                <p className="font-semibold text-primary">{r.symbol}</p>
                                <p className="text-[10px] text-muted">{meta?.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 tabular">{r.quantity}</td>
                          <td className="px-3 py-2.5 tabular">{formatPrice(r.avgCost)}</td>
                          <td className="px-3 py-2.5 tabular">{formatPrice(r.price)}</td>
                          <td className="px-3 py-2.5 font-medium tabular">{formatCurrency(r.value)}</td>
                          <td className={cn("px-3 py-2.5 font-medium tabular", positive ? "text-up" : "text-down")}>
                            {positive ? "+" : ""}
                            {formatCurrency(r.pnl)}
                          </td>
                          <td className={cn("px-3 py-2.5 tabular", positive ? "text-up" : "text-down")}>
                            {formatSignedNumber(r.pnlPct)}%
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-raised">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${Math.min(100, r.weight)}%`, background: meta?.color ?? "#818cf8" }}
                                />
                              </div>
                              <span className="text-[10px] text-muted tabular">{r.weight.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-[10px] text-muted">{r.user}</td>
                          <td className="px-2 py-2.5">
                            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={() => openEdit(r.symbol)}
                                className="rounded p-1 text-muted hover:bg-raised hover:text-primary"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteSymbol(r.symbol)}
                                className="rounded p-1 text-muted hover:bg-down/15 hover:text-down"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Allocation</CardTitle>
              <CardDescription>Share of each asset in the portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">No assets yet</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex h-3 w-full overflow-hidden rounded-full">
                    {allocation.map((a) => (
                      <div
                        key={a.symbol}
                        style={{ width: `${a.pct}%`, background: a.color }}
                        title={`${a.symbol} ${a.pct.toFixed(1)}%`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {allocation.map((a) => (
                      <div key={a.symbol} className="flex items-center gap-2 text-[11px]">
                        <span className="size-2 rounded-full" style={{ background: a.color }} />
                        <span className="w-14 font-medium text-secondary">{a.symbol}</span>
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-raised">
                          <div className="h-full rounded-full" style={{ width: `${a.pct}%`, background: a.color }} />
                        </div>
                        <span className="w-12 text-right tabular text-muted">{a.pct.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk levels</CardTitle>
              <CardDescription>Stop loss & take profit set per asset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {rows.filter((r) => r.stopLoss || r.takeProfit).length === 0 && (
                <p className="py-4 text-center text-xs text-muted">
                  No risk levels set — edit a holding to add SL/TP.
                </p>
              )}
              {rows
                .filter((r) => r.stopLoss || r.takeProfit)
                .map((r) => (
                  <div key={r.symbol} className="flex items-center justify-between rounded-lg border border-line bg-raised/40 px-3 py-2 text-[12px]">
                    <span className="font-semibold text-primary">{r.symbol}</span>
                    {r.stopLoss && (
                      <span className="text-down">
                        SL <b className="tabular">{formatPrice(r.stopLoss)}</b>
                      </span>
                    )}
                    {r.takeProfit && (
                      <span className="text-up">
                        TP <b className="tabular">{formatPrice(r.takeProfit)}</b>
                      </span>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equity curve</CardTitle>
              <CardDescription>Daily snapshot · {equity.length} days</CardDescription>
            </CardHeader>
            <CardContent>
              <EquityCurve data={equity.slice(-60)} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add asset to portfolio"
        description="Paper transaction — cash is deducted from your virtual balance."
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Asset</label>
            <SymbolSearch onSelect={setAddSymbol} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Quantity</label>
              <Input type="number" step="any" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="e.g. 0.05" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Entry price (optional)</label>
              <Input type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Market price" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Stop loss (optional)</label>
              <Input type="number" step="any" value={sl} onChange={(e) => setSl(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Take profit (optional)</label>
              <Input type="number" step="any" value={tp} onChange={(e) => setTp(e.target.value)} />
            </div>
          </div>
          <p className="rounded-lg border border-warn/25 bg-warn-soft px-3 py-2 text-[11px] text-warn">
            Simulated transaction only — no real money is involved.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitAdd} disabled={!addSymbol}>
              Add to portfolio
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editSymbol}
        onClose={() => setEditSymbol(null)}
        title={`Edit ${editSymbol ?? ""}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Quantity</label>
            <Input type="number" step="any" value={editQty} onChange={(e) => setEditQty(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Stop loss</label>
              <Input type="number" step="any" value={editSl} onChange={(e) => setEditSl(e.target.value)} placeholder="None" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Take profit</label>
              <Input type="number" step="any" value={editTp} onChange={(e) => setEditTp(e.target.value)} placeholder="None" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditSymbol(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitEdit}>
              Save changes
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteSymbol}
        onClose={() => setDeleteSymbol(null)}
        title={`Remove ${deleteSymbol ?? ""}?`}
        description="The asset will be sold at the current live price and the proceeds added to your cash balance."
        confirmLabel="Sell & remove"
        danger
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function EquityCurve({ data }: { data: Array<{ date: string; value: number }> }) {
  if (data.length < 2) return null;
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const range = max - min || 1;
  const w = 340;
  const h = 130;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 6 - ((d.value - min) / range) * (h - 16);
    return [x, y] as const;
  });
  const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full">
      <defs>
        <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#eq)" />
      <path d={path} fill="none" stroke="#34d399" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}