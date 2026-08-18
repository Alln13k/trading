"use client";

import { useState } from "react";
import {
  Plus,
  X,
  MessageSquare,
  Send,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
} from "lucide-react";
import { marketData } from "@/lib/data/provider";
import { useLiveQuotes } from "@/lib/hooks";
import {
  usePositionsStore,
  positionPnl,
  positionPnlPercent,
} from "@/lib/stores/positions-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { useActivityStore } from "@/lib/stores/activity-store";
import { useCurrentUser } from "@/lib/stores/settings-store";
import { cn, formatCurrency, formatPrice, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SymbolIcon, Avatar } from "@/components/ui/avatar";
import { SymbolSearch } from "@/components/market/symbol-search";
import { ConfirmDialog } from "@/components/ui/confirm";

export default function PositionsPage() {
  const positions = usePositionsStore((s) => s.positions);
  const comments = usePositionsStore((s) => s.comments);
  const openPosition = usePositionsStore((s) => s.openPosition);
  const closePosition = usePositionsStore((s) => s.closePosition);
  const updatePosition = usePositionsStore((s) => s.updatePosition);
  const removePosition = usePositionsStore((s) => s.removePosition);
  const addComment = usePositionsStore((s) => s.addComment);
  const push = useToastStore((s) => s.push);
  const addEvent = useActivityStore((s) => s.addEvent);
  const currentUser = useCurrentUser();

  const quotes = useLiveQuotes(positions.map((p) => p.symbol));

  const [openModal, setOpenModal] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [size, setSize] = useState("");
  const [entry, setEntry] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [note, setNote] = useState("");

  const [closeId, setCloseId] = useState<string | null>(null);
  const [closePrice, setClosePrice] = useState("");
  const [commentsId, setCommentsId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editSl, setEditSl] = useState("");
  const [editTp, setEditTp] = useState("");
  const [editNote, setEditNote] = useState("");

  const totalPnl = positions.reduce((a, p) => a + positionPnl(p), 0);
  const longs = positions.filter((p) => p.direction === "long").length;
  const shorts = positions.filter((p) => p.direction === "short").length;
  const best = positions.reduce((a, p) => (positionPnl(p) > positionPnl(a) ? p : a), positions[0]);
  const editPos = positions.find((p) => p.id === editId);
  const closePos = positions.find((p) => p.id === closeId);

  const submitOpen = () => {
    if (!symbol || !isFinite(parseFloat(size)) || parseFloat(size) <= 0) {
      push("Select an asset and enter a valid size", "error");
      return;
    }
    const pos = openPosition({
      symbol,
      direction,
      size: parseFloat(size),
      entryPrice: parseFloat(entry) || undefined,
      stopLoss: parseFloat(sl) || undefined,
      takeProfit: parseFloat(tp) || undefined,
      note: note.trim() || undefined,
      userId: currentUser.id,
      userName: currentUser.name,
    });
    setOpenModal(false);
    setSymbol("");
    setSize("");
    setEntry("");
    setSl("");
    setTp("");
    setNote("");
    push("Paper trade opened", "success", `${pos.symbol} ${pos.direction} @ ${formatPrice(pos.entryPrice)}`);
    addEvent({
      userName: currentUser.name,
      userId: currentUser.id,
      action: "opened a paper trade on",
      target: `${pos.symbol} (${pos.direction === "long" ? "Long" : "Short"})`,
      kind: "position",
    });
  };

  const submitClose = () => {
    if (!closeId) return;
    const pos = positions.find((p) => p.id === closeId);
    if (!pos) return;
    const price = parseFloat(closePrice);
    const finalPrice = isFinite(price) && price > 0 ? price : pos.currentPrice;
    closePosition(closeId, finalPrice);
    const pnl = (finalPrice - pos.entryPrice) * pos.size * (pos.direction === "long" ? 1 : -1);
    setCloseId(null);
    setClosePrice("");
    push("Position closed", pnl >= 0 ? "success" : "warning", `${pos.symbol} · ${pnl >= 0 ? "+" : ""}${formatCurrency(pnl)}`);
    addEvent({
      userName: currentUser.name,
      userId: currentUser.id,
      action: "closed",
      target: `${pos.symbol} · ${pnl >= 0 ? "+" : ""}${formatCurrency(pnl)}`,
      kind: "journal",
    });
  };

  const submitEdit = () => {
    if (!editId) return;
    updatePosition(editId, {
      stopLoss: parseFloat(editSl) || undefined,
      takeProfit: parseFloat(editTp) || undefined,
      note: editNote.trim() || undefined,
    });
    setEditId(null);
    push("Position updated", "success");
  };

  const submitComment = () => {
    if (!commentsId || !commentText.trim()) return;
    addComment(commentsId, currentUser.id, currentUser.name, commentText.trim());
    setCommentText("");
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Positions"
        description="Open paper trades — every entry, stop and target is visible to both workspace members."
        actions={
          <Button onClick={() => setOpenModal(true)}>
            <Plus className="size-3.5" /> Open paper trade
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Open P&L" value={`${totalPnl >= 0 ? "+" : ""}${formatCurrency(totalPnl)}`} deltaPositive={totalPnl >= 0} />
        <Stat label="Longs" value={longs} />
        <Stat label="Shorts" value={shorts} />
        <Stat
          label="Best position"
          value={best ? `${best.symbol} ${best.direction}` : "—"}
          delta={best ? `${positionPnl(best) >= 0 ? "+" : ""}${formatCurrency(positionPnl(best))}` : undefined}
          deltaPositive={best ? positionPnl(best) >= 0 : undefined}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {positions.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<ArrowUpRight />}
                title="No open positions"
                description="Open a paper trade to start building your track record — no real money involved."
                action={
                  <Button size="sm" onClick={() => setOpenModal(true)}>
                    <Plus className="size-3.5" /> Open paper trade
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
                    <th className="px-3 py-2 font-medium">Side</th>
                    <th className="px-3 py-2 font-medium">Size</th>
                    <th className="px-3 py-2 font-medium">Entry</th>
                    <th className="px-3 py-2 font-medium">Current</th>
                    <th className="px-3 py-2 font-medium">Stop loss</th>
                    <th className="px-3 py-2 font-medium">Take profit</th>
                    <th className="px-3 py-2 font-medium">P&L</th>
                    <th className="px-3 py-2 font-medium">P&L %</th>
                    <th className="px-3 py-2 font-medium">Opened</th>
                    <th className="px-3 py-2 font-medium">By</th>
                    <th className="px-2 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {positions.map((p) => {
                    const meta = marketData.getSymbol(p.symbol);
                    const pnl = positionPnl(p);
                    const pct = positionPnlPercent(p);
                    const q = quotes.get(p.symbol);
                    const current = q?.price ?? p.currentPrice;
                    const win = pnl >= 0;
                    const thread = comments[p.id] ?? [];
                    return (
                      <tr
                        key={p.id}
                        className={cn(
                          "text-[12px] transition-colors hover:bg-raised/40",
                          win ? "bg-up-soft/20" : "bg-down-soft/10"
                        )}
                      >
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => setCommentsId(p.id)}
                            className="flex items-center gap-2.5 text-left"
                            title="View comments"
                          >
                            <SymbolIcon symbol={p.symbol} color={meta?.color} size="sm" />
                            <div>
                              <p className="font-semibold text-primary">{p.symbol}</p>
                              <p className="text-[10px] text-muted">{meta?.name}</p>
                            </div>
                            {thread.length > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] text-accent-bright">
                                <MessageSquare className="size-3" />
                                {thread.length}
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant={p.direction === "long" ? "success" : "danger"}>
                            {p.direction === "long" ? (
                              <ArrowUpRight className="size-3" />
                            ) : (
                              <ArrowDownRight className="size-3" />
                            )}
                            {p.direction}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 tabular">{p.size}</td>
                        <td className="px-3 py-2.5 tabular">{formatPrice(p.entryPrice)}</td>
                        <td className="px-3 py-2.5 font-medium tabular">
                          {formatPrice(current)}
                        </td>
                        <td className="px-3 py-2.5 tabular">
                          {p.stopLoss ? (
                            <span className="text-down">{formatPrice(p.stopLoss)}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 tabular">
                          {p.takeProfit ? (
                            <span className="text-up">{formatPrice(p.takeProfit)}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className={cn("px-3 py-2.5 font-semibold tabular", win ? "text-up" : "text-down")}>
                          {pnl >= 0 ? "+" : ""}
                          {formatCurrency(pnl)}
                        </td>
                        <td className={cn("px-3 py-2.5 tabular", win ? "text-up" : "text-down")}>
                          {pct >= 0 ? "+" : ""}
                          {pct.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-muted">
                          {new Date(p.openedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-1.5 text-[11px] text-muted">
                            <Avatar name={p.userName} size="xs" />
                            {p.userName}
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditId(p.id);
                                setEditSl(p.stopLoss ? String(p.stopLoss) : "");
                                setEditTp(p.takeProfit ? String(p.takeProfit) : "");
                                setEditNote(p.note ?? "");
                              }}
                              className="rounded p-1 text-muted hover:bg-raised hover:text-primary"
                              title="Edit risk levels"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setCloseId(p.id);
                                setClosePrice("");
                              }}
                              className="rounded px-2 py-1 text-[11px] font-medium text-accent-bright hover:bg-accent-soft"
                            >
                              Close
                            </button>
                            <button
                              onClick={() => setDeleteId(p.id)}
                              className="rounded p-1 text-muted hover:bg-down/15 hover:text-down"
                              title="Delete"
                            >
                              <X className="size-3.5" />
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

      {/* Open modal */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Open paper trade"
        description="Simulated position — nothing is executed on a real exchange."
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Asset</label>
            <SymbolSearch onSelect={setSymbol} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Direction</label>
              <Select value={direction} onChange={(e) => setDirection(e.target.value as "long" | "short")}>
                <option value="long">Long</option>
                <option value="short">Short</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Size</label>
              <Input type="number" step="any" value={size} onChange={(e) => setSize(e.target.value)} placeholder="Units or contracts" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Entry price (optional)</label>
              <Input type="number" step="any" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="Market price" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-muted">Stop loss</label>
                <Input type="number" step="any" value={sl} onChange={(e) => setSl(e.target.value)} placeholder="—" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-muted">Take profit</label>
                <Input type="number" step="any" value={tp} onChange={(e) => setTp(e.target.value)} placeholder="—" />
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Note (optional)</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Setup, thesis…" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitOpen} disabled={!symbol}>
              Open trade
            </Button>
          </div>
        </div>
      </Modal>

      {/* Close modal */}
      <Modal
        open={!!closeId}
        onClose={() => setCloseId(null)}
        title={`Close ${closePos?.symbol ?? ""} ${closePos?.direction ?? ""}`}
        size="sm"
        description="Closing records the trade in your journal and updates realized P&L."
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">
              Exit price (leave empty for current market price)
            </label>
            <Input
              type="number"
              step="any"
              value={closePrice}
              onChange={(e) => setClosePrice(e.target.value)}
              placeholder={closePos ? formatPrice(closePos.currentPrice) : ""}
            />
          </div>
          {closePos && (() => {
            const price = parseFloat(closePrice);
            const exit = isFinite(price) && price > 0 ? price : closePos.currentPrice;
            const pnl = (exit - closePos.entryPrice) * closePos.size * (closePos.direction === "long" ? 1 : -1);
            return (
              <div
                className={cn(
                  "rounded-lg border px-3 py-2 text-[12px]",
                  pnl >= 0 ? "border-up/25 bg-up-soft text-up" : "border-down/25 bg-down-soft text-down"
                )}
              >
                Estimated P&L at {formatPrice(exit)}:{" "}
                <b>{pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}</b>
                <span className="ml-2 text-muted">
                  ({((exit - closePos.entryPrice) / closePos.entryPrice * 100 * (closePos.direction === "long" ? 1 : -1)).toFixed(2)}%)
                </span>
              </div>
            );
          })()}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCloseId(null)}>
              Cancel
            </Button>
            <Button size="sm" variant={closePos && positionPnl(closePos) < 0 ? "danger" : "success"} onClick={submitClose}>
              Close position
            </Button>
          </div>
        </div>
      </Modal>

      {/* Comments */}
      <Modal
        open={!!commentsId}
        onClose={() => setCommentsId(null)}
        title={`${positions.find((p) => p.id === commentsId)?.symbol ?? ""} — discussion`}
        description="Share your analysis with your trading partner."
        size="lg"
      >
        <div className="space-y-3">
          {(() => {
            const p = positions.find((x) => x.id === commentsId);
            if (p?.note) {
              return (
                <div className="rounded-lg border border-line bg-raised/40 px-3 py-2.5 text-[12px] text-secondary">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Setup note · </span>
                  {p.note}
                </div>
              );
            }
            return null;
          })()}
          <div className="max-h-56 space-y-2.5 overflow-y-auto">
            {(comments[commentsId ?? ""] ?? []).map((c) => (
              <div key={c.id} className="flex items-start gap-2.5">
                <Avatar name={c.userName} size="sm" />
                <div className="rounded-lg border border-line bg-raised/40 px-3 py-2">
                  <p className="text-[11px] font-semibold text-primary">
                    {c.userName}
                    <span className="ml-2 font-normal text-muted">{timeAgo(c.timestamp)}</span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-secondary">{c.text}</p>
                </div>
              </div>
            ))}
            {(comments[commentsId ?? ""] ?? []).length === 0 && (
              <p className="py-6 text-center text-xs text-muted">No comments yet — start the discussion.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
            />
            <Button size="icon" onClick={submitComment} disabled={!commentText.trim()}>
              <Send className="size-3.5" />
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit */}
      <Modal
        open={!!editId}
        onClose={() => setEditId(null)}
        title={`Edit ${editPos?.symbol ?? ""} risk`}
        size="sm"
      >
        <div className="space-y-4">
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
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Note</label>
            <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="—" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditId(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitEdit}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete position?"
        description="The position will be removed without being recorded in the journal."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deleteId) {
            removePosition(deleteId);
            push("Position deleted", "info");
          }
        }}
      />
    </div>
  );
}