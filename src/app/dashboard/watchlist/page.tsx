"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Star, ListPlus, X, Pencil } from "lucide-react";
import { marketData } from "@/lib/data/provider";
import { useLiveQuotes, useMarketVersion } from "@/lib/hooks";
import { useEffect } from "react";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { useActivityStore } from "@/lib/stores/activity-store";
import { useCurrentUser } from "@/lib/stores/settings-store";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { QuoteRow } from "@/components/market/quote-row";
import { SymbolSearch } from "@/components/market/symbol-search";
import { SymbolIcon } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm";

export default function WatchlistPage() {
  const router = useRouter();
  const watchlists = useWatchlistStore((s) => s.watchlists);
  const addWatchlist = useWatchlistStore((s) => s.addWatchlist);
  const removeWatchlist = useWatchlistStore((s) => s.removeWatchlist);
  const renameWatchlist = useWatchlistStore((s) => s.renameWatchlist);
  const addSymbol = useWatchlistStore((s) => s.addSymbol);
  const removeSymbol = useWatchlistStore((s) => s.removeSymbol);
  const push = useToastStore((s) => s.push);
  const addEvent = useActivityStore((s) => s.addEvent);
  const currentUser = useCurrentUser();

  const [activeId, setActiveId] = useState(watchlists[0]?.id ?? "");
  const active = watchlists.find((w) => w.id === activeId) ?? watchlists[0];
  const [newListOpen, setNewListOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addSymbolOpen, setAddSymbolOpen] = useState(false);

  const symbols = active?.symbols ?? [];
  const symbolsKey = symbols.join(",");
  const quotes = useLiveQuotes(symbols);
  const marketVersion = useMarketVersion();
  const sparkCache = useMemo(() => {
    const m = new Map<string, number[]>();
    for (const s of symbols) m.set(s, marketData.getSparkline(s, 24));
    return m;
  }, [symbolsKey, marketVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    for (const s of symbols) void marketData.getSparklineAsync?.(s, 24);
  }, [symbolsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const createList = () => {
    if (!newListName.trim()) return;
    addWatchlist(newListName.trim(), undefined, currentUser.id, currentUser.name);
    const created = useWatchlistStore.getState().watchlists.find((w) => w.name === newListName.trim());
    if (created) setActiveId(created.id);
    setNewListOpen(false);
    setNewListName("");
    push("Watchlist created", "success");
    addEvent({
      userName: currentUser.name,
      userId: currentUser.id,
      action: "created watchlist",
      target: newListName.trim(),
      kind: "watchlist",
    });
  };

  const addSym = (sym: string) => {
    if (!active) return;
    const ok = addSymbol(active.id, sym);
    setAddSymbolOpen(false);
    if (ok) {
      push(`Added ${sym} to ${active.name}`, "success");
      addEvent({
        userName: currentUser.name,
        userId: currentUser.id,
        action: "added",
        target: `${sym} to ${active.name}`,
        kind: "watchlist",
      });
    } else {
      push(`${sym} is already in ${active.name}`, "info");
    }
  };

  const handleRename = () => {
    if (renameId && renameName.trim()) {
      renameWatchlist(renameId, renameName.trim());
      push("Watchlist renamed", "success");
    }
    setRenameId(null);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Watchlists"
        description="Organize the assets you follow into multiple lists — shared with your workspace partner."
        actions={
          <Button onClick={() => setNewListOpen(true)}>
            <Plus className="size-3.5" /> New list
          </Button>
        }
      />

      {watchlists.length === 0 ? (
        <EmptyState
          icon={<ListPlus />}
          title="No watchlists yet"
          description="Create your first list — Crypto, Forex, Long Term, À surveiller…"
          action={
            <Button onClick={() => setNewListOpen(true)}>
              <Plus className="size-3.5" /> Create watchlist
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {watchlists.map((w) => (
              <div
                key={w.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg border px-3 py-2 transition-all",
                  active?.id === w.id
                    ? "border-accent/50 bg-accent-soft"
                    : "border-line bg-raised/40 hover:border-line-strong"
                )}
              >
                <button
                  onClick={() => setActiveId(w.id)}
                  className="flex items-center gap-2 text-left"
                >
                  <Star
                    className={cn(
                      "size-3.5",
                      active?.id === w.id ? "fill-warn text-warn" : "text-muted"
                    )}
                  />
                  <span className="text-[13px] font-medium text-primary">{w.name}</span>
                  <span className="text-[10px] text-muted">{w.symbols.length}</span>
                </button>
                <button
                  onClick={() => {
                    setRenameId(w.id);
                    setRenameName(w.name);
                  }}
                  className="text-muted opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  onClick={() => setDeleteId(w.id)}
                  className="text-muted opacity-0 transition-opacity hover:text-down group-hover:opacity-100"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>

          {active && (
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-primary">{active.name}</p>
                    <p className="text-[11px] text-muted">
                      {active.symbols.length} assets · created by {active.userName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {active.symbols.length > 0 && (
                      <span className="hidden text-[10px] text-muted md:block">
                        Click a row to open the chart
                      </span>
                    )}
                    <Button size="sm" onClick={() => setAddSymbolOpen(true)}>
                      <Plus className="size-3.5" /> Add asset
                    </Button>
                  </div>
                </div>
                {active.symbols.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      icon={<Star />}
                      title="This list is empty"
                      description="Search any asset to add it to this watchlist."
                      action={
                        <div className="w-64">
                          <SymbolSearch onSelect={addSym} autoFocus />
                        </div>
                      }
                    />
                  </div>
                ) : (
                  <div className="max-h-[56vh] divide-y divide-line overflow-y-auto">
                    {active.symbols.map((s) => (
                      <QuoteRow
                        key={s}
                        symbol={s}
                        quote={
                          quotes.get(s) ?? {
                            price: 0,
                            changePercent: 0,
                            change: 0,
                            volume: 0,
                          }
                        }
                        spark={sparkCache.get(s)}
                        onSelect={(sym) => router.push(`/dashboard/charts?symbol=${sym}`)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* New list */}
      <Modal
        open={newListOpen}
        onClose={() => setNewListOpen(false)}
        title="Create watchlist"
        description="A new shared list will be visible to both workspace members."
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Name</label>
            <Input
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g. À surveiller"
              onKeyDown={(e) => e.key === "Enter" && createList()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setNewListOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={createList} disabled={!newListName.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rename */}
      <Modal
        open={!!renameId}
        onClose={() => setRenameId(null)}
        title="Rename watchlist"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            autoFocus
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRenameId(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleRename}>
              Rename
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add symbol */}
      <Modal
        open={addSymbolOpen}
        onClose={() => setAddSymbolOpen(false)}
        title={`Add asset to ${active?.name ?? ""}`}
        description="Type to search across crypto, forex, stocks, indices and commodities."
        size="sm"
      >
        <SymbolSearch onSelect={addSym} autoFocus />
        {active && active.symbols.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {active.symbols.map((s) => {
              const m = marketData.getSymbol(s);
              return (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-md border border-line bg-raised/60 px-2 py-1 text-[11px] text-secondary"
                >
                  <SymbolIcon symbol={s} color={m?.color} size="xs" />
                  {s}
                  <button
                    onClick={() => {
                      removeSymbol(active.id, s);
                      push(`Removed ${s} from ${active.name}`, "info");
                    }}
                    className="text-muted hover:text-down"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete watchlist"
        description={`This will permanently remove "${watchlists.find((w) => w.id === deleteId)?.name}" and its ${watchlists.find((w) => w.id === deleteId)?.symbols.length ?? 0} assets.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deleteId) {
            removeWatchlist(deleteId);
            push("Watchlist deleted", "info");
          }
        }}
      />
    </div>
  );
}