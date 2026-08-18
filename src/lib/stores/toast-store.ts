"use client";

import { create } from "zustand";
import { uid } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  push: (title: string, variant?: ToastVariant, description?: string) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (title, variant = "info", description) => {
    const id = uid("toast");
    set((s) => ({ toasts: [...s.toasts, { id, title, variant, description }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(title: string, variant: ToastVariant = "info", description?: string) {
  useToastStore.getState().push(title, variant, description);
}