"use client";

import { useEffect } from "react";
import { useUiStore } from "@/lib/stores/ui-store";
import { useToastStore } from "@/lib/stores/toast-store";

export function useKeyboardShortcuts() {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const push = useToastStore((s) => s.push);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b" && !typing) {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      } else if (e.key === "?" && !typing) {
        push(
          "Keyboard shortcuts",
          "info",
          "Ctrl+K · Search · Ctrl+B · Sidebar · F · Fullscreen chart · ? · This help"
        );
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [sidebarCollapsed, setSidebarCollapsed, push]);
}