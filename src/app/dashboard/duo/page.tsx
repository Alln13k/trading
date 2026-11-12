"use client";

import { useState } from "react";
import { useActivityStore } from "@/lib/stores/activity-store";
import { useAcademyStore } from "@/lib/stores/academy-store";
import { useDuoStore } from "@/lib/stores/duo-store";
import { useJournalStore } from "@/lib/stores/journal-store";
import { useSettingsStore, useCurrentUser } from "@/lib/stores/settings-store";
import { useStrategiesStore } from "@/lib/stores/strategies-store";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";
import { exportBundle, mergeBundle } from "@/lib/duo/bundle";
import { displaySymbol } from "@/lib/data/symbols";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";

export default function DuoPage() {
  const users = useSettingsStore((s) => s.settings.users);
  const setCurrent = useSettingsStore((s) => s.setCurrentUser);
  const me = useCurrentUser();
  const events = useActivityStore((s) => s.events);
  const addEvent = useActivityStore((s) => s.addEvent);
  const watchlists = useWatchlistStore((s) => s.watchlists);
  const addSymbol = useWatchlistStore((s) => s.addSymbol);
  const trades = useJournalStore((s) => s.trades);
  const journalComments = useJournalStore((s) => s.comments);
  const addJournalComment = useJournalStore((s) => s.addComment);
  const notes = useDuoStore((s) => s.notes);
  const noteComments = useDuoStore((s) => s.noteComments);
  const symbolComments = useDuoStore((s) => s.symbolComments);
  const addNote = useDuoStore((s) => s.addNote);
  const addNoteComment = useDuoStore((s) => s.addNoteComment);
  const addSymbolComment = useDuoStore((s) => s.addSymbolComment);

  const [note, setNote] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [symbol, setSymbol] = useState("BTC");
  const [symbolText, setSymbolText] = useState("");
  const [watchSymbol, setWatchSymbol] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const shared = watchlists[0];

  const saveNote = () => {
    const result = addNote({ text: note, userId: me.id, userName: me.name });
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setNote("");
    setError(null);
    addEvent({ userId: me.id, userName: me.name, action: "saved a shared note", target: "duo", kind: "journal" });
  };

  const saveSymbolComment = () => {
    const result = addSymbolComment({ symbol, text: symbolText, userId: me.id, userName: me.name });
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setSymbolText("");
    setError(null);
    addEvent({
      userId: me.id,
      userName: me.name,
      action: "commented on",
      target: result.symbol,
      kind: "chart",
    });
  };

  const download = () => {
    const bundle = exportBundle({
      watchlists: useWatchlistStore.getState().watchlists,
      journal: {
        trades: useJournalStore.getState().trades,
        comments: useJournalStore.getState().comments,
      },
      strategies: useStrategiesStore.getState().notes,
      academy: { byUser: useAcademyStore.getState().byUser },
      notes: useDuoStore.getState().notes,
      noteComments: useDuoStore.getState().noteComments,
      symbolComments: useDuoStore.getState().symbolComments,
    });
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "trading-duo.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Downloaded trading-duo.json. Hand that file to the other machine.");
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2_000_000) {
      setError("That file is too large to import.");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setError("That file is not JSON.");
      return;
    }
    const merged = mergeBundle(
      {
        watchlists: useWatchlistStore.getState().watchlists,
        journal: {
          trades: useJournalStore.getState().trades,
          comments: useJournalStore.getState().comments,
        },
        strategies: useStrategiesStore.getState().notes,
        academy: { byUser: useAcademyStore.getState().byUser },
        notes: useDuoStore.getState().notes,
        noteComments: useDuoStore.getState().noteComments,
        symbolComments: useDuoStore.getState().symbolComments,
      },
      parsed
    );
    if ("error" in merged) {
      setError(merged.error);
      return;
    }
    useWatchlistStore.setState({ watchlists: merged.watchlists });
    useJournalStore.setState({ trades: merged.journal.trades, comments: merged.journal.comments });
    useStrategiesStore.setState({ notes: merged.strategies });
    useAcademyStore.setState({ byUser: merged.academy.byUser });
    useDuoStore.setState({
      notes: merged.notes,
      noteComments: merged.noteComments,
      symbolComments: merged.symbolComments,
    });
    setError(null);
    setStatus("Imported into this browser. Nothing was uploaded.");
  };

  return (
    <div>
      <PageHeader
        title="Duo Workspace"
        description="Two named profiles on this browser. Both read the same watchlist, journal, and notes. This is not cloud sync."
      />
      <p className="mb-4 text-sm text-secondary" data-testid="duo-sync-copy">
        This is not cloud sync. A second machine still needs the JSON file you export, or a future sync service. Nothing on this page calls a server to share data. The paper book stays in this browser and is not in the file.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profiles</CardTitle>
            <CardDescription>Active: {me.name}. Switching changes who new notes are attributed to. Both still read the same lists.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                <div className="flex items-center gap-2">
                  <Avatar name={u.name} />
                  <div>
                    <p className="text-[13px] font-semibold">{u.name}</p>
                    <p className="text-[11px] text-secondary">{u.role}</p>
                  </div>
                </div>
                <Button size="sm" disabled={me.id === u.id} onClick={() => setCurrent(u.id)}>
                  {me.id === u.id ? "Active" : "Switch"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Shared notes</CardTitle>
            <CardDescription>Saved on this browser. Allan and Alex both read them.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input data-testid="duo-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note both profiles can read" />
            <Button data-testid="duo-note-save" onClick={saveNote}>Save note</Button>
            {notes.length === 0 ? (
              <p className="text-sm text-muted">No shared notes yet.</p>
            ) : (
              <ul className="space-y-3" data-testid="duo-notes">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-lg border border-line px-3 py-2 text-[13px]">
                    <p className="text-primary">{n.text}</p>
                    <p className="text-[11px] text-muted">{n.userName} · {timeAgo(n.createdAt)}</p>
                    <ul className="mt-2 space-y-1">
                      {noteComments.filter((c) => c.noteId === n.id).map((c) => (
                        <li key={c.id} className="text-secondary">{c.userName}: {c.text}</li>
                      ))}
                    </ul>
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={commentDrafts[n.id] ?? ""}
                        onChange={(e) => setCommentDrafts((d) => ({ ...d, [n.id]: e.target.value }))}
                        placeholder="Comment"
                      />
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const result = addNoteComment({
                            noteId: n.id,
                            text: commentDrafts[n.id] ?? "",
                            userId: me.id,
                            userName: me.name,
                          });
                          if ("error" in result) setError(result.error);
                          else setCommentDrafts((d) => ({ ...d, [n.id]: "" }));
                        }}
                      >
                        Comment
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Chart symbol comment</CardTitle>
            <CardDescription>A local comment on a symbol. It does not draw on the chart and it does not sync.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <Input data-testid="duo-symbol" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
              <Input data-testid="duo-symbol-comment" value={symbolText} onChange={(e) => setSymbolText(e.target.value)} placeholder="Comment" />
            </div>
            <Button data-testid="duo-symbol-save" variant="secondary" onClick={saveSymbolComment}>Save symbol comment</Button>
            <ul className="space-y-2 text-[13px]" data-testid="duo-symbol-comments">
              {symbolComments.map((c) => (
                <li key={c.id}>
                  <span className="text-accent">{c.symbol}</span> · {c.text}
                  <span className="ml-2 text-[11px] text-muted">{c.userName}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Shared watchlist</CardTitle>
            <CardDescription>{shared ? shared.name : "No list"}. Both profiles read this list.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {shared ? (
              <p className="text-[13px] text-secondary">{shared.symbols.map((s) => displaySymbol(s)).join(" · ")}</p>
            ) : (
              <EmptyState title="No watchlist" description="The core list is created with the terminal." />
            )}
            <div className="flex gap-2">
              <Input value={watchSymbol} onChange={(e) => setWatchSymbol(e.target.value.toUpperCase())} placeholder="Add symbol" />
              <Button
                variant="secondary"
                onClick={() => {
                  if (!shared) return;
                  const next = watchSymbol.trim().toUpperCase();
                  if (!next) {
                    setError("Type a symbol before adding it.");
                    return;
                  }
                  const ok = addSymbol(shared.id, next);
                  if (!ok) setError("That symbol is already on the list.");
                  else {
                    setWatchSymbol("");
                    setError(null);
                    addEvent({ userId: me.id, userName: me.name, action: "added to the shared watchlist", target: watchSymbol, kind: "watchlist" });
                  }
                }}
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Journal notes</CardTitle>
            <CardDescription>Notes already saved on journal trades. Both profiles read them.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {trades.length === 0 ? (
              <p className="text-sm text-muted">No journal trades on this browser yet.</p>
            ) : (
              trades.slice(0, 8).map((t) => (
                <div key={t.id} className="rounded-lg border border-line px-3 py-2 text-[13px]">
                  <p className="text-primary">{t.symbol} · {t.notes || "No note text"}</p>
                  <p className="text-[11px] text-muted">{t.userName}</p>
                  <ul className="mt-1 space-y-1 text-secondary">
                    {(journalComments[t.id] ?? []).map((c) => (
                      <li key={c.id}>{c.userName}: {c.text}</li>
                    ))}
                  </ul>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={commentDrafts[t.id] ?? ""}
                      onChange={(e) => setCommentDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                      placeholder="Comment on this journal note"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const text = (commentDrafts[t.id] ?? "").trim();
                        if (!text) {
                          setError("Write a comment before saving.");
                          return;
                        }
                        addJournalComment(t.id, me.id, me.name, text);
                        setCommentDrafts((d) => ({ ...d, [t.id]: "" }));
                        setError(null);
                      }}
                    >
                      Comment
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Export and import</CardTitle>
            <CardDescription>One JSON file: watchlist, journal, strategies, academy progress, and these notes. Not the paper book.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button data-testid="duo-export" onClick={download}>Export JSON</Button>
              <label className="inline-flex cursor-pointer items-center">
                <input
                  data-testid="duo-import"
                  type="file"
                  accept="application/json,.json"
                  className="text-[12px] text-secondary"
                  onChange={(e) => void onImport(e.target.files?.[0])}
                />
              </label>
            </div>
            {status && <p className="text-[13px] text-secondary">{status}</p>}
            {error && <p className="text-[13px] text-down">{error}</p>}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Local audit log. Empty until you change watchlists, notes, or the journal.</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <EmptyState title="No activity yet" description="Actions from either profile show up here." />
            ) : (
              <ul className="space-y-2">
                {events.slice(0, 20).map((e) => (
                  <li key={e.id} className="text-[13px] text-secondary">
                    <span className="font-semibold text-primary">{e.userName}</span> {e.action}{" "}
                    <span className="text-accent">{e.target}</span>
                    <span className="ml-2 text-[10px]">{timeAgo(e.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
