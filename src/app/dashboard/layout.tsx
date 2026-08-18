"use client";

import { type ReactNode } from "react";
import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { ToastViewport } from "@/components/ui/toast-viewport";
import { PriceTicker } from "@/components/market/price-ticker";
import { useUiStore } from "@/lib/stores/ui-store";
import { useKeyboardShortcuts } from "@/lib/use-keyboard-shortcuts";
import { cn } from "@/lib/utils";
import { TRENDING_SYMBOLS } from "@/lib/data/symbols";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const selectedSymbol = useUiStore((s) => s.selectedSymbol);
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <MobileNav />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300 md:pl-56",
          collapsed && "md:pl-16"
        )}
      >
        <Topbar
          onOpenSearch={() => setCommandPaletteOpen(true)}
          symbol={selectedSymbol}
        />
        <PriceTicker symbols={TRENDING_SYMBOLS} />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">{children}</main>
      </div>
      <CommandPalette />
      <ToastViewport />
    </div>
  );
}