"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/utils";
import { persistStorage } from "@/lib/persist/sqlite-storage";

export interface SharedNote {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: number;
  journalTradeId?: string;
}

export interface NoteComment {
  id: string;
  noteId: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: number;
}

export interface SymbolComment {
  id: string;
  symbol: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: number;
}

interface DuoState {
  notes: SharedNote[];
  noteComments: NoteComment[];
  symbolComments: SymbolComment[];
  addNote: (input: { text: string; userId: string; userName: string; journalTradeId?: string }) => SharedNote | { error: string };
  addNoteComment: (input: { noteId: string; text: string; userId: string; userName: string }) => NoteComment | { error: string };
  addSymbolComment: (input: { symbol: string; text: string; userId: string; userName: string }) => SymbolComment | { error: string };
}

export const useDuoStore = create<DuoState>()(
  persist(
    (set, get) => ({
      notes: [],
      noteComments: [],
      symbolComments: [],
      addNote: (input) => {
        const text = input.text.trim();
        if (!text) return { error: "Write a note before saving." };
        const note: SharedNote = {
          id: uid("note"),
          text,
          userId: input.userId,
          userName: input.userName,
          createdAt: Date.now(),
          journalTradeId: input.journalTradeId,
        };
        set((s) => ({ notes: [note, ...s.notes] }));
        return note;
      },
      addNoteComment: (input) => {
        const text = input.text.trim();
        if (!text) return { error: "Write a comment before saving." };
        if (!get().notes.some((n) => n.id === input.noteId)) return { error: "That note is not on this browser." };
        const comment: NoteComment = {
          id: uid("nc"),
          noteId: input.noteId,
          text,
          userId: input.userId,
          userName: input.userName,
          createdAt: Date.now(),
        };
        set((s) => ({ noteComments: [...s.noteComments, comment] }));
        return comment;
      },
      addSymbolComment: (input) => {
        const text = input.text.trim();
        const symbol = input.symbol.trim().toUpperCase();
        if (!symbol) return { error: "Name a chart symbol." };
        if (!text) return { error: "Write a comment before saving." };
        const comment: SymbolComment = {
          id: uid("sc"),
          symbol,
          text,
          userId: input.userId,
          userName: input.userName,
          createdAt: Date.now(),
        };
        set((s) => ({ symbolComments: [comment, ...s.symbolComments] }));
        return comment;
      },
    }),
    { name: "trading-duo-v1", storage: persistStorage() }
  )
);
