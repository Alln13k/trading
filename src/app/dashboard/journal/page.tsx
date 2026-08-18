"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  MessageSquare,
  Send,
  CalendarDays,
  List,
  Trophy,
  Flame,
  Target,
} from "lucide-react";
import { marketData } from "@/lib/data/provider";
import { useJournalStore, type JournalComment } from "@/lib/stores/journal-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { useActivityStore } from "@/lib/stores/activity-store";
import { useCurrentUser } from "@/lib/stores/settings-store";
import type { Trade } from "@/lib/types";
import { cn, formatCurrency, formatPercent, formatPrice, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SymbolIcon, Avatar } from "@/components/ui/avatar";
import { Tabs } from "@/components/ui/segmented";
import { ConfirmDialog } from "@/components/ui/confirm";

const STRATEGIES = [
  "Breakout",
  "Trend Following",
  "Range Trading",
  "EMA Pullback",
  "RSI Reversal",
  "News Play",
  "Momentum",
  "Paper Trade",
];

const EMOTIONS = ["Confident", "Patient", "Focused", "Calm", "Neutral", "Eager", "Skeptical", "Disciplined", "Impulsive", "Overconfident", "FOMO", "Anxious", "Frustrated", "Humbled", "Regretful", "Excited", "Proud", "Satisfied", "Disappointed", "Resigned", "Content", "Happy"];

export default function JournalPage() {
  const trades = useJournalStore((s) => s.trades);
  const comments = useJournalStore((s) => s.comments);
  const addTrade = useJournalStore((s) => s.addTrade);
  const updateTrade = useJournalStore((s) => s.updateTrade);
  const deleteTrade = useJournalStore((s) => s.deleteTrade);
  const addComment = useJournalStore((s) => s.addComment);
  const push = useToastStore((s) => s.push);
  const addEvent = useActivityStore((s) => s.addEvent);
  const currentUser = useCurrentUser();

  const [view, setView] = useState<"list" | "calendar">("list");
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [commentTrade, setCommentTrade] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [filterStrategy, setFilterStrategy] = useState("all");
  const [filterResult, setFilterResult] = useState("all");
  const [query, setQuery] = useState("");

  // form state
  const [fSymbol, setFSymbol] = useState("");
  const [fDirection, setFDirection] = useState<"long" | "short">("long");
  const [fStrategy, setFStrategy] = useState(STRATEGIES[0]);
  const [fEntry, setFEntry] = useState("");
  const [fExit, setFExit] = useState("");
  const [fSl, setFSl] = useState("");
  const [fTp, setFTp] = useState("");
  const [fSize, setFSize] = useState("");
  const [fPnl, setFPnl] = useState("");
  const [fNotes, setFNotes] = useState("");
  const [fEmoBefore, setFEmoBefore] = useState("Neutral");
  const [fEmoAfter, setFEmoAfter] = useState("Neutral");
  const [fScreenshot, setFScreenshot] = useState<string | undefined>(undefined);

  const stats = useMemo(() => {
    const wins = trades.filter((t) => t.pnl > 0);
    const losses = trades.filter((t) => t.pnl < 0);
    const grossWin = wins.reduce((a, t) => a + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
    const winRate = trades.length ? (wins.length / trades.length) * 100 : 0;
    const avgWin = wins.length ? grossWin / wins.length : 0;
    const avgLoss = losses.length ? grossLoss / losses.length : 0;
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0;
    const rr = trades.length ? trades.reduce((a, t) => a + (t.pnl > 0 ? t.pnl : -t.pnl), 0) / trades.length : 0;
    const byStrategy = new Map<string, { trades: number; wins: number; pnl: number }>();
    for (const t of trades) {
      const s = byStrategy.get(t.strategy) ?? { trades: 0, wins: 0, pnl: 0 };
      s.trades++;
      if (t.pnl > 0) s.wins++;
      s.pnl += t.pnl;
      byStrategy.set(t.strategy, s);
    }
    const stratList = [...byStrategy.entries()].map(([strategy, v]) => ({
      strategy,
      trades: v.trades,
      winRate: (v.wins / v.trades) * 100,
      pnl: v.pnl,
    }));
    const sorted = [...stratList].sort((a, b) => b.pnl - a.pnl);
    const best = sorted[0];
    const worst = [...stratList].sort((a, b) => a.pnl - b.pnl)[0];
    const totalPnl = trades.reduce((a, t) => a + t.pnl, 0);
    return {
      wins: wins.length,
      losses: losses.length,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      avgRR: rr,
      totalPnl,
      best,
      worst,
      strategyStats: stratList,
    };
  }, [trades]);

  const filtered = useMemo(() => {
    return trades
      .filter((t) => (filterStrategy === "all" ? true : t.strategy === filterStrategy))
      .filter((t) => (filterResult === "all" ? true : t.result === filterResult))
      .filter((t) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return t.symbol.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q) || t.strategy.toLowerCase().includes(q);
      });
  }, [trades, filterStrategy, filterResult, query]);

  const editTrade = trades.find((t) => t.id === editId);

  const resetForm = () => {
    setFSymbol("");
    setFDirection("long");
    setFStrategy(STRATEGIES[0]);
    setFEntry("");
    setFExit("");
    setFSl("");
    setFTp("");
    setFSize("");
    setFPnl("");
    setFNotes("");
    setFEmoBefore("Neutral");
    setFEmoAfter("Neutral");
    setFScreenshot(undefined);
  };

  const submitAdd = () => {
    if (!fSymbol || !isFinite(parseFloat(fEntry))) {
      push("Symbol and entry price are required", "error");
      return;
    }
    const pnl = parseFloat(fPnl) || 0;
    addTrade({
      symbol: fSymbol,
      direction: fDirection,
      strategy: fStrategy,
      entryPrice: parseFloat(fEntry),
      exitPrice: parseFloat(fExit) || parseFloat(fEntry),
      stopLoss: parseFloat(fSl) || undefined,
      takeProfit: parseFloat(fTp) || undefined,
      size: parseFloat(fSize) || 1,
      pnl,
      notes: fNotes.trim() || undefined,
      screenshot: fScreenshot,
      emotionBefore: fEmoBefore,
      emotionAfter: fEmoAfter,
      userId: currentUser.id,
      userName: currentUser.name,
    });
    setAddOpen(false);
    resetForm();
    push("Trade added to journal", "success");
    addEvent({
      userName: currentUser.name,
      userId: currentUser.id,
      action: "logged a trade on",
      target: fSymbol,
      kind: "journal",
    });
  };

  const submitEdit = () => {
    if (!editId) return;
    updateTrade(editId, {
      symbol: fSymbol || editTrade?.symbol,
      direction: fDirection,
      strategy: fStrategy,
      entryPrice: parseFloat(fEntry) || 0,
      exitPrice: parseFloat(fExit) || 0,
      stopLoss: parseFloat(fSl) || undefined,
      takeProfit: parseFloat(fTp) || undefined,
      size: parseFloat(fSize) || 1,
      pnl: parseFloat(fPnl) || 0,
      notes: fNotes.trim() || undefined,
      screenshot: fScreenshot,
      emotionBefore: fEmoBefore,
      emotionAfter: fEmoAfter,
    });
    setEditId(null);
    push("Trade updated", "success");
  };

  const openEdit = (t: Trade) => {
    setEditId(t.id);
    setFSymbol(t.symbol);
    setFDirection(t.direction);
    setFStrategy(t.strategy);
    setFEntry(String(t.entryPrice));
    setFExit(String(t.exitPrice));
    setFSl(t.stopLoss ? String(t.stopLoss) : "");
    setFTp(t.takeProfit ? String(t.takeProfit) : "");
    setFSize(String(t.size));
    setFPnl(String(t.pnl));
    setFNotes(t.notes ?? "");
    setFEmoBefore(t.emotionBefore);
    setFEmoAfter(t.emotionAfter);
    setFScreenshot(t.screenshot);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      push("Screenshot too large (max 1.5MB)", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  const dailyPnl = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of trades) {
      map.set(t.date, (map.get(t.date) ?? 0) + t.pnl);
    }
    return map;
  }, [trades]);

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Trade Journal"
        description="Every trade, every emotion, every lesson — review your edge with hard numbers."
        actions={
          <div className="flex items-center gap-2">
            <Tabs
              value={view}
              onChange={setView}
              tabs={[
                { value: "list", label: "List", icon: <List className="size-3.5" /> },
                { value: "calendar", label: "Calendar", icon: <CalendarDays className="size-3.5" /> },
              ]}
            />
            <Button onClick={() => { resetForm(); setAddOpen(true); }}>
              <Plus className="size-3.5" /> Log trade
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Stat label="Trades" value={trades.length} />
        <Stat label="Win rate" value={formatPercent(stats.winRate, false)} icon={<Trophy />} />
        <Stat label="Avg win" value={`+${formatCurrency(stats.avgWin)}`} deltaPositive icon={<Target />} />
        <Stat label="Avg loss" value={`-${formatCurrency(stats.avgLoss)}`} deltaPositive={false} icon={<Flame />} />
        <Stat label="Profit factor" value={stats.profitFactor.toFixed(2)} delta={stats.profitFactor >= 1 ? "good" : "weak"} deltaPositive={stats.profitFactor >= 1} />
        <Stat label="Avg R:R" value={`1:${stats.avgLoss > 0 ? (stats.avgWin / stats.avgLoss).toFixed(1) : "—"}`} />
        <Stat
          label="Best strategy"
          value={stats.best?.strategy ?? "—"}
          delta={stats.best ? `+${formatCurrency(stats.best.pnl)}` : undefined}
          deltaPositive
        />
        <Stat
          label="Worst strategy"
          value={stats.worst?.strategy ?? "—"}
          delta={stats.worst ? formatCurrency(stats.worst.pnl) : undefined}
          deltaPositive={false}
        />
      </div>

      {/* Strategy breakdown */}
      {stats.strategyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Strategy performance</CardTitle>
            <CardDescription>Net P&L and win rate by strategy</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {stats.strategyStats
              .sort((a, b) => b.pnl - a.pnl)
              .map((s) => (
                <div key={s.strategy} className="rounded-lg border border-line bg-raised/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-primary">{s.strategy}</p>
                    <span className={cn("text-[12px] font-semibold tabular", s.pnl >= 0 ? "text-up" : "text-down")}>
                      {s.pnl >= 0 ? "+" : ""}
                      {formatCurrency(s.pnl)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                    <span>{s.trades} trades</span>
                    <span className={s.winRate >= 50 ? "text-up" : "text-down"}>
                      {s.winRate.toFixed(0)}% win
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-raised">
                    <div
                      className={cn("h-full rounded-full", s.winRate >= 50 ? "bg-up" : "bg-down")}
                      style={{ width: `${s.winRate}%` }}
                    />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {view === "list" ? (
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
              <Input
                className="w-52"
                placeholder="Search symbol, note…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Select
                className="w-40"
                value={filterStrategy}
                onChange={(e) => setFilterStrategy(e.target.value)}
              >
                <option value="all">All strategies</option>
                {STRATEGIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              <Select
                className="w-36"
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
              >
                <option value="all">All results</option>
                <option value="win">Wins</option>
                <option value="loss">Losses</option>
                <option value="breakeven">Breakeven</option>
              </Select>
            </div>
            {filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<Plus />}
                  title="No trades found"
                  description="Log your first trade or adjust the filters."
                  action={
                    <Button size="sm" onClick={() => { resetForm(); setAddOpen(true); }}>
                      <Plus className="size-3.5" /> Log trade
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="max-h-[62vh] divide-y divide-line overflow-y-auto">
                {filtered.map((t) => {
                  const meta = marketData.getSymbol(t.symbol);
                  const thread = comments[t.id] ?? [];
                  return (
                    <div key={t.id} className={cn("px-4 py-3 transition-colors hover:bg-raised/40", expanded === t.id && "bg-raised/30")}>
                      <div className="flex flex-wrap items-center gap-3">
                        <SymbolIcon symbol={t.symbol} color={meta?.color} size="sm" />
                        <div className="w-40 min-w-0">
                          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                            {t.symbol}
                            <Badge variant={t.direction === "long" ? "success" : "danger"}>{t.direction}</Badge>
                          </p>
                          <p className="text-[10px] text-muted">
                            {t.date} · {t.time} · {t.strategy}
                          </p>
                        </div>
                        <div className="hidden text-right tabular md:block">
                          <p className="text-[12px] text-secondary">In <b className="text-primary">{formatPrice(t.entryPrice)}</b></p>
                          <p className="text-[12px] text-secondary">Out <b className="text-primary">{formatPrice(t.exitPrice)}</b></p>
                        </div>
                        <div className="hidden text-[11px] text-muted lg:block">
                          <p>{t.emotionBefore} →</p>
                          <p>{t.emotionAfter}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-3">
                          <span className={cn("text-[13px] font-semibold tabular", t.pnl >= 0 ? "text-up" : "text-down")}>
                            {t.pnl >= 0 ? "+" : ""}
                            {formatCurrency(t.pnl)}
                          </span>
                          <Badge variant={t.result === "win" ? "success" : t.result === "loss" ? "danger" : "default"}>
                            {t.result}
                          </Badge>
                          <div className="flex gap-0.5">
                            <button
                              onClick={() => setCommentTrade(commentTrade === t.id ? null : t.id)}
                              className="relative rounded p-1.5 text-muted hover:bg-raised hover:text-primary"
                              title="Comments"
                            >
                              <MessageSquare className="size-3.5" />
                              {thread.length > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
                                  {thread.length}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => openEdit(t)}
                              className="rounded p-1.5 text-muted hover:bg-raised hover:text-primary"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(t.id)}
                              className="rounded p-1.5 text-muted hover:bg-down/15 hover:text-down"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                            <button
                              onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                              className="rounded p-1.5 text-xs text-accent-bright"
                            >
                              {expanded === t.id ? "Hide" : "Details"}
                            </button>
                          </div>
                        </div>
                      </div>
                      {commentTrade === t.id && (
                        <div className="mt-2.5 flex items-center gap-2 pl-10">
                          <Input
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={`Comment on ${t.symbol}…`}
                            className="h-8 text-[12px]"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && commentText.trim()) {
                                addComment(t.id, currentUser.id, currentUser.name, commentText.trim());
                                setCommentText("");
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              if (commentText.trim()) {
                                addComment(t.id, currentUser.id, currentUser.name, commentText.trim());
                                setCommentText("");
                              }
                            }}
                          >
                            <Send className="size-3" />
                          </Button>
                        </div>
                      )}
                      {expanded === t.id && (
                        <div className="mt-3 grid gap-3 pl-10 md:grid-cols-2">
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <Field label="Entry" value={formatPrice(t.entryPrice)} />
                              <Field label="Exit" value={formatPrice(t.exitPrice)} />
                              <Field label="Stop loss" value={t.stopLoss ? formatPrice(t.stopLoss) : "—"} />
                              <Field label="Take profit" value={t.takeProfit ? formatPrice(t.takeProfit) : "—"} />
                              <Field label="Size" value={String(t.size)} />
                              <Field label="P&L" value={`${t.pnl >= 0 ? "+" : ""}${formatCurrency(t.pnl)}`} tone={t.pnl >= 0 ? "up" : "down"} />
                              <Field label="Emotion before" value={t.emotionBefore} />
                              <Field label="Emotion after" value={t.emotionAfter} />
                            </div>
                            {t.notes && (
                              <p className="rounded-lg border border-line bg-raised/40 px-3 py-2 text-[12px] leading-relaxed text-secondary">
                                {t.notes}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            {t.screenshot ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={t.screenshot}
                                alt="Trade screenshot"
                                className="max-h-40 w-full rounded-lg border border-line object-cover"
                              />
                            ) : null}
                            {(comments[t.id] ?? []).map((c) => (
                              <CommentBubble key={c.id} c={c} />
                            ))}
                            <p className="text-[11px] text-muted">
                              Logged by <span className="font-medium text-secondary">{t.userName}</span> · {timeAgo(t.timestamp)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <TradeCalendar dailyPnl={dailyPnl} />
      )}

      {/* Add/Edit modal */}
      <Modal
        open={addOpen || !!editId}
        onClose={() => {
          setAddOpen(false);
          setEditId(null);
        }}
        title={editId ? `Edit trade · ${editTrade?.symbol ?? ""}` : "Log a trade"}
        description={editId ? undefined : "Capture the full picture — setup, emotions, result."}
        size="lg"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Symbol</label>
            <Input value={fSymbol} onChange={(e) => setFSymbol(e.target.value.toUpperCase())} placeholder="e.g. BTC, EURUSD, NVDA" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Direction</label>
              <Select value={fDirection} onChange={(e) => setFDirection(e.target.value as "long" | "short")}>
                <option value="long">Long</option>
                <option value="short">Short</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Strategy</label>
              <Select value={fStrategy} onChange={(e) => setFStrategy(e.target.value)}>
                {STRATEGIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Entry price</label>
            <Input type="number" step="any" value={fEntry} onChange={(e) => setFEntry(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Exit price</label>
            <Input type="number" step="any" value={fExit} onChange={(e) => setFExit(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Stop loss</label>
            <Input type="number" step="any" value={fSl} onChange={(e) => setFSl(e.target.value)} placeholder="—" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Take profit</label>
            <Input type="number" step="any" value={fTp} onChange={(e) => setFTp(e.target.value)} placeholder="—" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Size</label>
            <Input type="number" step="any" value={fSize} onChange={(e) => setFSize(e.target.value)} placeholder="1" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Result (P&L)</label>
            <Input type="number" step="any" value={fPnl} onChange={(e) => setFPnl(e.target.value)} placeholder="e.g. 124.50 or -85" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Emotion before trade</label>
            <Select value={fEmoBefore} onChange={(e) => setFEmoBefore(e.target.value)}>
              {EMOTIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Emotion after trade</label>
            <Select value={fEmoAfter} onChange={(e) => setFEmoAfter(e.target.value)}>
              {EMOTIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Notes</label>
            <Input value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="What did you see? What would you do differently?" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Screenshot</label>
            <div className="flex items-center gap-3">
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-line bg-raised/60 px-3 text-[12px] text-secondary transition-colors hover:border-accent/50">
                {fScreenshot ? "Replace screenshot" : "Upload screenshot"}
                <input type="file" accept="image/*" className="hidden" onChange={onFile} />
              </label>
              {fScreenshot && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fScreenshot} alt="Screenshot preview" className="h-10 rounded-md border border-line object-cover" />
                  <button onClick={() => setFScreenshot(undefined)} className="text-[11px] text-muted hover:text-down">
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAddOpen(false);
              setEditId(null);
            }}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={editId ? submitEdit : submitAdd}>
            {editId ? "Save changes" : "Log trade"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete trade?"
        description="This trade will be removed from the journal and all statistics."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deleteId) {
            deleteTrade(deleteId);
            push("Trade deleted", "info");
          }
        }}
      />
    </div>
  );
}

function Field({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-lg border border-line bg-raised/40 px-3 py-1.5">
      <p className="text-[9px] uppercase tracking-wider text-muted">{label}</p>
      <p className={cn("mt-0.5 font-medium text-primary tabular", tone === "up" && "text-up", tone === "down" && "text-down")}>
        {value}
      </p>
    </div>
  );
}

function CommentBubble({ c }: { c: JournalComment }) {
  return (
    <div className="flex items-start gap-2">
      <Avatar name={c.userName} size="xs" />
      <div className="rounded-lg border border-line bg-raised/40 px-2.5 py-1.5">
        <p className="text-[10px] font-semibold text-primary">
          {c.userName}
          <span className="ml-1.5 font-normal text-muted">{timeAgo(c.timestamp)}</span>
        </p>
        <p className="text-[12px] text-secondary">{c.text}</p>
      </div>
    </div>
  );
}

function TradeCalendar({ dailyPnl }: { dailyPnl: Map<string, number> }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells: Array<{ day: number; date: string; pnl?: number; trades: number }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: 0, date: "", trades: 0 });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, date, pnl: dailyPnl.get(date), trades: 0 });
  }
  const monthPnl = [...dailyPnl.entries()]
    .filter(([date]) => date.startsWith(`${year}-${String(m + 1).padStart(2, "0")}`))
    .reduce((a, [, v]) => a + v, 0);
  const days = [...dailyPnl.keys()];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>
            {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </CardTitle>
          <CardDescription>
            Day-by-day P&L · month total{" "}
            <span className={monthPnl >= 0 ? "text-up" : "text-down"}>
              {monthPnl >= 0 ? "+" : ""}
              {formatCurrency(monthPnl)}
            </span>
          </CardDescription>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMonth(new Date(year, m - 1, 1))}
          >
            ‹
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMonth(new Date(year, m + 1, 1))}
          >
            ›
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1.5">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <p key={d} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted">
              {d}
            </p>
          ))}
          {cells.map((c, i) =>
            c.day === 0 ? (
              <div key={i} />
            ) : (
              <div
                key={i}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-lg border text-[12px]",
                  c.pnl === undefined && "border-line bg-raised/30 text-muted",
                  c.pnl !== undefined && c.pnl >= 0 && "border-up/30 bg-up-soft text-up",
                  c.pnl !== undefined && c.pnl < 0 && "border-down/30 bg-down-soft text-down",
                  c.date === today && "ring-1 ring-accent/60"
                )}
                title={c.pnl !== undefined ? `${c.date}: ${c.pnl >= 0 ? "+" : ""}${formatCurrency(c.pnl)}` : c.date}
              >
                <span className="font-medium">{c.day}</span>
                {c.pnl !== undefined && (
                  <span className="text-[9px] font-semibold tabular">
                    {c.pnl >= 0 ? "+" : "−"}
                    {formatCurrency(Math.abs(c.pnl), "USD", true)}
                  </span>
                )}
              </div>
            )
          )}
        </div>
        <p className="mt-3 text-[11px] text-muted">
          {days.length} trading days with entries · click a day for details (hover for P&L)
        </p>
      </CardContent>
    </Card>
  );
}