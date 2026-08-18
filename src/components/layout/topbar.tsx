"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Activity,
  HelpCircle,
  LogOut,
  Command,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { marketData } from "@/lib/data/provider";
import { cn, formatPrice, formatPercent, timeAgo } from "@/lib/utils";
import { useUiStore } from "@/lib/stores/ui-store";
import { useAlertsStore } from "@/lib/stores/alerts-store";
import { useSettingsStore, useCurrentUser } from "@/lib/stores/settings-store";
import { useActivityStore } from "@/lib/stores/activity-store";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown, DropdownItem, DropdownHeader, DropdownDivider } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { useOnClickOutside, useMarketStatus } from "@/lib/hooks";

export function Topbar({
  onOpenSearch,
  symbol,
}: {
  onOpenSearch: () => void;
  symbol: string;
}) {
  const router = useRouter();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const setCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const notificationsOpen = useUiStore((s) => s.notificationsOpen);
  const setNotificationsOpen = useUiStore((s) => s.setNotificationsOpen);
  const notifications = useAlertsStore((s) => s.notifications);
  const markAllRead = useAlertsStore((s) => s.markAllRead);
  const activity = useActivityStore((s) => s.events);
  const currentUser = useCurrentUser();
  const users = useSettingsStore((s) => s.settings.users);
  const setCurrentUser = useSettingsStore((s) => s.setCurrentUser);
  const [activityOpen, setActivityOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(notifRef, () => setNotificationsOpen(false), notificationsOpen);
  useOnClickOutside(activityRef, () => setActivityOpen(false), activityOpen);

  const unread = notifications.filter((n) => !n.read).length;
  const meta = marketData.getSymbol(symbol);
  const quote = marketData.getQuote(symbol);
  const up = (quote?.changePercent ?? 0) >= 0;
  const marketStatus = useMarketStatus();
  const quotesDown = marketStatus.quotes === false;

  const goTo = (href: string) => {
    router.push(href);
    setNotificationsOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-bg/85 px-3 backdrop-blur-xl md:px-4">
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle sidebar"
      >
        {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
      </Button>

      <button
        onClick={onOpenSearch}
        className="hidden h-9 w-64 items-center gap-2 rounded-lg border border-line bg-raised/60 px-3 text-left text-[13px] text-muted transition-colors hover:border-line-strong sm:flex lg:w-72"
      >
        <Search className="size-3.5" />
        <span className="flex-1 truncate">Search markets…</span>
        <kbd className="flex items-center gap-0.5 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] text-muted">
          <Command className="size-2.5" />K
        </kbd>
      </button>

      <div className="flex min-w-0 items-center gap-2 rounded-lg border border-line bg-raised/60 px-3 py-1.5">
        <span
          className={cn("size-1.5 shrink-0 rounded-full", up ? "bg-up" : "bg-down")}
        />
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="hidden text-[12px] font-semibold text-primary sm:block">
            {meta?.symbol ?? symbol}
          </span>
          <span className="text-[12px] font-medium text-primary tabular">
            {quote ? formatPrice(quote.price, Math.min(meta?.decimals ?? 2, 4)) : "—"}
          </span>
          <span
            className={cn(
              "text-[11px] font-medium tabular",
              up ? "text-up" : "text-down"
            )}
          >
            {quote ? formatPercent(quote.changePercent) : "—"}
          </span>
        </div>
      </div>

      <div className="flex-1" />

      {quotesDown ? (
        <span className="hidden items-center gap-1.5 rounded-md border border-down/40 bg-down/10 px-2 py-1 text-[10px] font-semibold text-down lg:inline-flex">
          <AlertTriangle className="size-3" />
          No data API
        </span>
      ) : (
        <span className="hidden items-center gap-1.5 rounded-md border border-line bg-raised/40 px-2 py-1 text-[10px] font-medium text-muted lg:inline-flex">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-up" />
          </span>
          Live data
        </span>
      )}

      {/* Activity */}
      <div ref={activityRef} className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setActivityOpen(!activityOpen)}
          aria-label="Activity"
        >
          <Activity className="size-4" />
        </Button>
        {activityOpen && (
          <div className="absolute right-0 z-50 mt-1.5 w-80 rounded-xl border border-line bg-overlay/98 shadow-2xl shadow-black/60 backdrop-blur animate-scale-in">
            <DropdownHeader>Workspace activity</DropdownHeader>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {activity.slice(0, 15).map((e) => (
                <div key={e.id} className="flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-raised">
                  <Avatar name={e.userName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] leading-snug text-secondary">
                      <span className="font-semibold text-primary">{e.userName}</span>{" "}
                      {e.action}{" "}
                      <span className="text-accent-bright">{e.target}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted">{timeAgo(e.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div ref={notifRef} className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-gradient-accent text-[9px] font-bold text-white">
              {unread}
            </span>
          )}
        </Button>
        {notificationsOpen && (
          <div className="absolute right-0 z-50 mt-1.5 w-80 rounded-xl border border-line bg-overlay/98 shadow-2xl shadow-black/60 backdrop-blur animate-scale-in">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Notifications
              </span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-medium text-accent-bright hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {notifications.length === 0 && (
                <p className="px-3 py-8 text-center text-xs text-muted">No notifications</p>
              )}
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => goTo("/dashboard/alerts")}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-raised",
                    !n.read && "bg-accent-soft/40"
                  )}
                >
                  <CheckCircle2
                    className={cn(
                      "mt-0.5 size-3.5 shrink-0",
                      n.kind === "alert" ? "text-warn" : "text-accent-bright"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-primary">{n.title}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-secondary">{n.body}</p>
                    <p className="mt-1 text-[10px] text-muted">{timeAgo(n.timestamp)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User */}
      <Dropdown
        align="right"
        trigger={
          <button className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-raised">
            <Avatar name={currentUser.name} color={currentUser.color} size="sm" />
            <span className="hidden text-[12px] font-medium text-primary lg:block">
              {currentUser.name}
            </span>
            <ChevronDown className="hidden size-3 text-muted lg:block" />
          </button>
        }
      >
        <DropdownHeader>Switch workspace member</DropdownHeader>
        {users.map((u) => (
          <DropdownItem
            key={u.id}
            onClick={() => {
              setCurrentUser(u.id);
              router.refresh();
            }}
            className={cn(u.id === currentUser.id && "bg-accent-soft/50 text-accent-bright")}
          >
            <Avatar name={u.name} color={u.color} size="sm" />
            <span className="flex-1">
              {u.name}
              <span className="block text-[10px] font-normal text-muted">{u.role}</span>
            </span>
            {u.id === currentUser.id && <CheckCircle2 className="size-3.5 text-accent-bright" />}
          </DropdownItem>
        ))}
        <DropdownDivider />
        <DropdownItem onClick={() => goTo("/dashboard/settings")}>
          <User className="size-3.5" /> Profile settings
        </DropdownItem>
        <DropdownItem onClick={() => goTo("/dashboard/settings")}>
          <HelpCircle className="size-3.5" /> Help & shortcuts
        </DropdownItem>
        <DropdownItem onClick={() => router.push("/")} danger>
          <LogOut className="size-3.5" /> Back to landing
        </DropdownItem>
      </Dropdown>
    </header>
  );
}