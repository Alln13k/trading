"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CandlestickChart,
  BarChart3,
  ScanSearch,
  BookOpen,
  Shapes,
  Notebook,
  Calculator,
  ArrowLeftRight,
  LineChart,
  BookMarked,
  GraduationCap,
  Users,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/stores/ui-store";
import { useMarketStatus } from "@/lib/hooks";
import type { LucideIcon } from "lucide-react";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/markets", label: "Markets", icon: BarChart3 },
  { href: "/dashboard/charts", label: "Charts", icon: CandlestickChart },
  { href: "/dashboard/analyzer", label: "Market Analyzer", icon: ScanSearch },
  { href: "/dashboard/scanner", label: "Pattern Scanner", icon: Shapes },
  { href: "/dashboard/encyclopedia", label: "Pattern Encyclopedia", icon: BookOpen },
  { href: "/dashboard/strategies", label: "Strategies", icon: Notebook },
  { href: "/dashboard/risk", label: "Risk Calculator", icon: Calculator },
  { href: "/dashboard/paper", label: "Paper Trading", icon: ArrowLeftRight },
  { href: "/dashboard/performance", label: "Performance", icon: LineChart },
  { href: "/dashboard/journal", label: "Trading Journal", icon: BookMarked },
  { href: "/dashboard/academy", label: "Academy", icon: GraduationCap },
  { href: "/dashboard/duo", label: "Duo Workspace", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent">
        <LineChart className="size-4 text-white" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[14px] font-bold tracking-tight text-primary">Trading Terminal</span>
          <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-secondary">
            Paper · delayed data
          </span>
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const setCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const quotesStatus = useMarketStatus().quotes;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface md:flex",
        collapsed ? "w-[64px]" : "w-60"
      )}
    >
      <Logo compact={collapsed} />
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium",
                collapsed && "justify-center px-0",
                active ? "bg-accent-soft text-accent" : "text-secondary hover:bg-raised hover:text-primary"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-2.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-secondary hover:bg-raised hover:text-primary",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <><ChevronsLeft className="size-4" /><span>Collapse</span></>}
        </button>
        {!collapsed && (
          <p className="mt-2 px-1 text-[10px] leading-snug text-secondary">
            Feed: {quotesStatus === false ? "unavailable" : quotesStatus === true ? "delayed Yahoo" : "loading"}
          </p>
        )}
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/dashboard/charts", label: "Charts", icon: CandlestickChart },
    { href: "/dashboard/paper", label: "Paper", icon: ArrowLeftRight },
    { href: "/dashboard/journal", label: "Journal", icon: BookMarked },
    { href: "/dashboard/settings", label: "More", icon: Settings },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface md:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
              active ? "text-accent" : "text-secondary"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
