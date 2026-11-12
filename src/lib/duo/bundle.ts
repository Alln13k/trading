import type { AcademyLevel } from "@/lib/content/lessons";
import type { QuizAttempt } from "@/lib/stores/academy-store";
import type { NoteComment, SharedNote, SymbolComment } from "@/lib/stores/duo-store";
import type { JournalComment } from "@/lib/stores/journal-store";
import type { StrategyNote } from "@/lib/stores/strategies-store";
import type { Trade, Watchlist } from "@/lib/types";

export const BUNDLE_KIND = "trading-terminal-duo";
export const BUNDLE_VERSION = 1;

export interface AcademySlice {
  byUser: Record<
    string,
    {
      read: string[];
      attempts: Partial<Record<AcademyLevel, QuizAttempt>>;
    }
  >;
}

export interface DuoBundle {
  kind: typeof BUNDLE_KIND;
  version: typeof BUNDLE_VERSION;
  exportedAt: number;
  watchlists: Watchlist[];
  journal: { trades: Trade[]; comments: Record<string, JournalComment[]> };
  strategies: StrategyNote[];
  academy: AcademySlice;
  notes: SharedNote[];
  noteComments: NoteComment[];
  symbolComments: SymbolComment[];
}

export interface BundleLocal {
  watchlists: Watchlist[];
  journal: { trades: Trade[]; comments: Record<string, JournalComment[]> };
  strategies: StrategyNote[];
  academy: AcademySlice;
  notes: SharedNote[];
  noteComments: NoteComment[];
  symbolComments: SymbolComment[];
}

function unionById<T extends { id: string }>(local: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of incoming) if (!map.has(item.id)) map.set(item.id, item);
  return [...map.values()];
}

export function exportBundle(local: BundleLocal, exportedAt = Date.now()): DuoBundle {
  return {
    kind: BUNDLE_KIND,
    version: BUNDLE_VERSION,
    exportedAt,
    watchlists: local.watchlists,
    journal: local.journal,
    strategies: local.strategies,
    academy: local.academy,
    notes: local.notes,
    noteComments: local.noteComments,
    symbolComments: local.symbolComments,
  };
}

export function mergeBundle(local: BundleLocal, raw: unknown): BundleLocal | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "That file is not a duo bundle." };
  const file = raw as Partial<DuoBundle>;
  if (file.kind !== BUNDLE_KIND || file.version !== BUNDLE_VERSION) {
    return { error: "That file is not a Trading Terminal duo bundle." };
  }
  if (!Array.isArray(file.watchlists) || !file.journal || !Array.isArray(file.journal.trades)) {
    return { error: "The bundle is missing watchlists or journal notes." };
  }

  const watchlists = local.watchlists.map((list) => ({ ...list, symbols: [...list.symbols] }));
  for (const incoming of file.watchlists) {
    if (!incoming || typeof incoming.id !== "string" || !Array.isArray(incoming.symbols)) continue;
    const existing = watchlists.find((list) => list.id === incoming.id);
    if (!existing) {
      watchlists.push({ ...incoming, symbols: [...new Set(incoming.symbols.map(String))] });
      continue;
    }
    existing.symbols = [...new Set([...existing.symbols, ...incoming.symbols.map(String)])];
  }

  const comments: Record<string, JournalComment[]> = { ...local.journal.comments };
  const incomingComments = file.journal.comments ?? {};
  for (const [tradeId, thread] of Object.entries(incomingComments)) {
    if (!Array.isArray(thread)) continue;
    comments[tradeId] = unionById(comments[tradeId] ?? [], thread.filter((c) => c && typeof c.id === "string"));
  }

  const academy: AcademySlice = { byUser: { ...local.academy.byUser } };
  const incomingAcademy = file.academy?.byUser ?? {};
  for (const [userId, progress] of Object.entries(incomingAcademy)) {
    const prev = academy.byUser[userId] ?? { read: [], attempts: {} };
    const attempts = { ...prev.attempts };
    for (const level of ["beginner", "intermediate", "advanced"] as AcademyLevel[]) {
      if (!attempts[level] && progress.attempts?.[level]?.submitted) {
        attempts[level] = progress.attempts[level];
      }
    }
    academy.byUser[userId] = {
      read: [...new Set([...(prev.read ?? []), ...(progress.read ?? [])])],
      attempts,
    };
  }

  return {
    watchlists,
    journal: {
      trades: unionById(local.journal.trades, file.journal.trades),
      comments,
    },
    strategies: unionById(local.strategies, file.strategies ?? []),
    academy,
    notes: unionById(local.notes, file.notes ?? []),
    noteComments: unionById(local.noteComments, file.noteComments ?? []),
    symbolComments: unionById(local.symbolComments, file.symbolComments ?? []),
  };
}
