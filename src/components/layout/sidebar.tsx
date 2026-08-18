"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CandlestickChart,
  BarChart3,
  Star,
  Briefcase,
  ArrowLeftRight,
  NotebookPen,
  Bell,
  Newspaper,
  CalendarClock,
  ScanSearch,
  Settings,
  LineChart,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/stores/ui-store";
import { useAlertsStore } from "@/lib/stores/alerts-store";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/markets", label: "Markets", icon: BarChart3 },
  { href: "/dashboard/charts", label: "Charts", icon: CandlestickChart },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: Star },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/dashboard/positions", label: "Positions", icon: ArrowLeftRight },
  { href: "/dashboard/journal", label: "Trade Journal", icon: NotebookPen },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/news", label: "News", icon: Newspaper },
  { href: "/dashboard/calendar", label: "Economic Calendar", icon: CalendarClock },
  { href: "/dashboard/analysis", label: "Analysis", icon: ScanSearch },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-accent shadow-[0_0_18px_rgba(99,102,241,0.5)]">
        <LineChart className="size-4 text-white" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-primary">
            Nex<span className="text-gradient">Trade</span>
          </span>
          <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-muted">
            Workspace
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
  const unread = useAlertsStore((s) =>
    s.notifications.filter((n) => !n.read).length
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface/70 backdrop-blur-xl transition-all duration-300 md:flex",
        collapsed ? "w-[64px]" : "w-56"
      )}
    >
      <Logo compact={collapsed} />

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150",
                collapsed && "justify-center px-0",
                active
                  ? "bg-accent-soft text-accent-bright"
                  : "text-secondary hover:bg-raised hover:text-primary"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-gradient-accent" />
              )}
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active ? "text-accent-bright" : "text-muted group-hover:text-secondary"
                )}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{label}</span>
                  {href === "/dashboard/alerts" && unread > 0 && (
                    <Badge variant="accent" className="px-1.5 py-0 text-[10px]">
                      {unread}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-2.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-muted transition-colors hover:bg-raised hover:text-primary",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <>
              <ChevronsLeft className="size-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
        <div
          className={cn(
            "mt-2 flex items-center gap-2 rounded-lg border border-line bg-raised/50 px-2.5 py-2",
            collapsed && "justify-center px-0 border-0 bg-transparent"
          )}
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-up" />
          </span>
          {!collapsed && (
            <span className="text-[11px] text-secondary">
              Live feed
              <span className="block text-[10px] text-muted">Demo data</span>
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const unread = useAlertsStore((s) => s.notifications.filter((n) => !n.read).length);
  const items = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/dashboard/charts", label: "Charts", icon: CandlestickChart },
    { href: "/dashboard/positions", label: "Positions", icon: ArrowLeftRight },
    { href: "/dashboard/journal", label: "Journal", icon: NotebookPen },
    { href: "/dashboard/settings", label: "More", icon: Settings },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface/90 backdrop-blur-xl md:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href === "/dashboard" && pathname === "/dashboard");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
              active ? "text-accent-bright" : "text-muted"
            )}
          >
            {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-gradient-accent" />}
            <Icon className="size-4.5" />
            {label}
            {href === "/dashboard/positions" && unread > 0 && (
              <span className="absolute right-1/4 top-1.5 size-1.5 rounded-full bg-down" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}