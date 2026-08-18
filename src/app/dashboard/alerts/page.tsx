"use client";

import { useState } from "react";
import { Bell, Plus, Trash2, CheckCheck } from "lucide-react";
import { useAlertsStore } from "@/lib/stores/alerts-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { useActivityStore } from "@/lib/stores/activity-store";
import { useCurrentUser } from "@/lib/stores/settings-store";
import type { AlertType } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { SymbolSearch } from "@/components/market/symbol-search";

const TYPE_LABELS: Record<AlertType, string> = {
  price_above: "Price crosses above",
  price_below: "Price crosses below",
  rsi_above: "RSI(14) goes above",
  rsi_below: "RSI(14) goes below",
  cross_ema: "Price crosses EMA",
};

export default function AlertsPage() {
  const alerts = useAlertsStore((s) => s.alerts);
  const notifications = useAlertsStore((s) => s.notifications);
  const addAlert = useAlertsStore((s) => s.addAlert);
  const removeAlert = useAlertsStore((s) => s.removeAlert);
  const toggleAlert = useAlertsStore((s) => s.toggleAlert);
  const markAllRead = useAlertsStore((s) => s.markAllRead);
  const push = useToastStore((s) => s.push);
  const addEvent = useActivityStore((s) => s.addEvent);
  const currentUser = useCurrentUser();

  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState<AlertType>("price_above");
  const [value, setValue] = useState("");

  const submit = () => {
    if (!symbol || !isFinite(parseFloat(value))) {
      push("Select an asset and enter a value", "error");
      return;
    }
    const a = addAlert({
      symbol,
      type,
      value: parseFloat(value),
      userId: currentUser.id,
      userName: currentUser.name,
    });
    setOpen(false);
    setSymbol("");
    setValue("");
    push("Alert created", "success", `${symbol} ${TYPE_LABELS[type].toLowerCase()} ${parseFloat(value).toLocaleString()}`);
    addEvent({
      userName: currentUser.name,
      userId: currentUser.id,
      action: "created alert",
      target: `${symbol} ${TYPE_LABELS[type].toLowerCase()} ${parseFloat(value).toLocaleString()}`,
      kind: "alert",
    });
    void a;
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Alerts"
        description="Never miss a level again — price, RSI and EMA cross conditions, evaluated every few seconds."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> New alert
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Active alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <EmptyState
                  icon={<Bell />}
                  title="No alerts yet"
                  description='Create one — for example "BTC > 120000" or "RSI EUR/USD < 30".'
                  action={
                    <Button size="sm" onClick={() => setOpen(true)}>
                      <Plus className="size-3.5" /> New alert
                    </Button>
                  }
                />
              ) : (
                <div className="divide-y divide-line">
                  {alerts.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 py-3">
                      <span
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg",
                          a.active ? "bg-accent-soft text-accent-bright" : "bg-raised text-muted"
                        )}
                      >
                        <Bell className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-primary">
                          {a.symbol}{" "}
                          <span className="text-secondary">
                            {TYPE_LABELS[a.type].toLowerCase()}{" "}
                            <b className="text-accent-bright tabular">{a.value.toLocaleString()}</b>
                          </span>
                        </p>
                        <p className="text-[11px] text-muted">
                          by {a.userName} · {timeAgo(a.createdAt)}
                          {a.lastTriggeredAt && (
                            <span className="ml-2 text-warn">
                              · triggered {timeAgo(a.lastTriggeredAt)}
                            </span>
                          )}
                        </p>
                      </div>
                      <Switch checked={a.active} onChange={() => toggleAlert(a.id)} />
                      <button
                        onClick={() => {
                          removeAlert(a.id);
                          push("Alert deleted", "info");
                        }}
                        className="rounded p-1.5 text-muted transition-colors hover:bg-down/15 hover:text-down"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Notification center</CardTitle>
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-accent-bright hover:underline"
              >
                <CheckCheck className="size-3" /> Mark all read
              </button>
            </CardHeader>
            <CardContent className="max-h-[50vh] space-y-1 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="py-8 text-center text-xs text-muted">No notifications yet</p>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg border px-3 py-2",
                    n.read ? "border-line bg-raised/20" : "border-accent/30 bg-accent-soft/40"
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 size-1.5 shrink-0 rounded-full",
                      n.kind === "alert" ? "bg-warn" : "bg-accent-bright"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-primary">{n.title}</p>
                    <p className="text-[11px] leading-snug text-secondary">{n.body}</p>
                    <p className="mt-0.5 text-[10px] text-muted">{timeAgo(n.timestamp)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="mt-5">
            <CardHeader>
              <CardTitle>Alert examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {[
                "BTC > 120000",
                "EUR/USD < 1.15",
                "RSI BTC < 30",
                "NVDA crosses EMA 50",
              ].map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setOpen(true);
                    const m = e.match(/([A-Z]+)\s*(.*)/);
                    if (m) {
                      setSymbol(m[1]);
                      if (e.includes("RSI")) setType(e.includes("<") ? "rsi_below" : "rsi_above");
                      else if (e.includes("EMA")) setType("cross_ema");
                      else setType(e.includes(">") ? "price_above" : "price_below");
                      const num = e.match(/(\d+[.,]?\d*)/);
                      if (num) setValue(num[1]);
                    }
                  }}
                  className="w-full rounded-lg border border-line bg-raised/40 px-3 py-2 text-left text-[12px] font-mono text-secondary transition-colors hover:border-accent/40 hover:text-primary"
                >
                  “{e}”
                </button>
              ))}
              <p className="pt-1 text-[10px] text-muted">Click an example to prefill the form</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create alert"
        description='For example: "BTC > 120000" or "RSI ETH < 30".'
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Asset</label>
            <SymbolSearch onSelect={setSymbol} autoFocus />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Condition</label>
            <Select value={type} onChange={(e) => setType(e.target.value as AlertType)}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted">Value</label>
            <Input
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "cross_ema" ? "EMA period, e.g. 50" : "e.g. 120000"}
            />
          </div>
          <p className="rounded-lg border border-line bg-raised/40 px-3 py-2 text-[11px] text-secondary">
            Alerts are evaluated every few seconds while the app is open, and appear in the
            notification center.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={!symbol || !value}>
              Create alert
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}