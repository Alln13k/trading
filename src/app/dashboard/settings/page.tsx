"use client";

import { useState } from "react";
import {
  User,
  Palette,
  Coins,
  Bell,
  BarChart3,
  Database,
  Users,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Activity,
} from "lucide-react";
import { useSettingsStore, useCurrentUser } from "@/lib/stores/settings-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { AppSettings, AppUser } from "@/lib/types";

const ACCENTS: Array<{ value: AppSettings["appearance"]["accent"]; label: string; color: string }> = [
  { value: "indigo", label: "Indigo", color: "#6366f1" },
  { value: "violet", label: "Violet", color: "#a855f7" },
  { value: "cyan", label: "Cyan", color: "#22d3ee" },
  { value: "emerald", label: "Emerald", color: "#34d399" },
];

export default function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const currentUserId = useSettingsStore((s) => s.currentUserId);
  const setCurrentUser = useSettingsStore((s) => s.setCurrentUser);
  const updateProfile = useSettingsStore((s) => s.updateProfile);
  const updateAppearance = useSettingsStore((s) => s.updateAppearance);
  const setCurrency = useSettingsStore((s) => s.setCurrency);
  const setTimezone = useSettingsStore((s) => s.setTimezone);
  const updateNotifications = useSettingsStore((s) => s.updateNotifications);
  const updateCharts = useSettingsStore((s) => s.updateCharts);
  const updateData = useSettingsStore((s) => s.updateData);
  const addUser = useSettingsStore((s) => s.addUser);
  const updateUser = useSettingsStore((s) => s.updateUser);
  const removeUser = useSettingsStore((s) => s.removeUser);
  const resetAll = useSettingsStore((s) => s.resetAll);
  const currentUser = useCurrentUser();
  const push = useToastStore((s) => s.push);

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppUser["role"]>("member");

  const saveProfile = () => {
    updateProfile({ name: name.trim() || settings.profile.name, email: email.trim() });
    updateUser(currentUserId, { name: name.trim() || currentUser.name, email: email.trim() });
    push("Profile saved", "success");
  };

  const addMember = () => {
    if (!newUserName.trim()) return;
    addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim() || "member@trading.local",
      role: newUserRole,
      color: "from-slate-400 to-slate-600",
    });
    setNewUserName("");
    setNewUserEmail("");
    push("Member added", "success");
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Settings"
        description="Your profile, workspace and data preferences."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>
              <User className="size-3.5" /> Profile
            </CardTitle>
            <CardDescription>How you appear across the workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={currentUser.name} color={currentUser.color} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary">{currentUser.name}</p>
                <p className="text-[11px] text-muted">{currentUser.email}</p>
              </div>
              <span className="ml-auto rounded-md bg-accent-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-bright">
                {currentUser.role}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-muted">Display name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-muted">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={saveProfile}>
                <Check className="size-3.5" /> Save profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Palette className="size-3.5" /> Appearance
            </CardTitle>
            <CardDescription>Theme and accent for this browser</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Theme</label>
              <Select
                value={settings.appearance.theme}
                onChange={(e) => updateAppearance({ theme: e.target.value as AppSettings["appearance"]["theme"] })}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Accent color</label>
              <div className="flex gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => updateAppearance({ accent: a.value })}
                    title={a.label}
                    className={cn(
                      "size-8 rounded-full ring-2 ring-offset-2 ring-offset-bg transition-transform hover:scale-110",
                      settings.appearance.accent === a.value ? "ring-line" : "ring-transparent"
                    )}
                    style={{ backgroundColor: a.color }}
                  />
                ))}
              </div>
            </div>
            <SwitchRow
              label="Compact mode"
              description="Denser tables and charts"
              checked={settings.appearance.compact}
              onChange={(v) => updateAppearance({ compact: v })}
            />
            <SwitchRow
              label="Reduce motion"
              description="Disable subtle animations"
              checked={settings.appearance.reduceMotion}
              onChange={(v) => updateAppearance({ reduceMotion: v })}
            />
          </CardContent>
        </Card>

        {/* Currency & locale */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Coins className="size-3.5" /> Currency & locale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Display currency</label>
              <Select value={settings.currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="USD">USD — $</option>
                <option value="EUR">EUR — €</option>
                <option value="GBP">GBP — £</option>
                <option value="JPY">JPY — ¥</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Timezone</label>
              <Select value={settings.timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="UTC">UTC</option>
                <option value="America/New_York">New York</option>
                <option value="Europe/London">London</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Singapore">Singapore</option>
                <option value="Asia/Dubai">Dubai</option>
              </Select>
            </div>
            <SwitchRow
              label="Auto-refresh quotes"
              description="Poll demo quotes every few seconds"
              checked={settings.data.autoRefresh}
              onChange={(v) => updateData({ autoRefresh: v })}
            />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Bell className="size-3.5" /> Notifications
            </CardTitle>
            <CardDescription>What reaches your notification center</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SwitchRow
              label="Alert triggers"
              description="Price, RSI and EMA cross alerts"
              checked={settings.notifications.alerts}
              onChange={(v) => updateNotifications({ alerts: v })}
            />
            <SwitchRow
              label="Price moves"
              description="Notable intraday moves"
              checked={settings.notifications.priceMoves}
              onChange={(v) => updateNotifications({ priceMoves: v })}
            />
            <SwitchRow
              label="News"
              description="Breaking market news"
              checked={settings.notifications.news}
              onChange={(v) => updateNotifications({ news: v })}
            />
            <SwitchRow
              label="Team activity"
              description="What Allan and Alex are doing"
              checked={settings.notifications.activity}
              onChange={(v) => updateNotifications({ activity: v })}
            />
          </CardContent>
        </Card>

        {/* Charts */}
        <Card>
          <CardHeader>
            <CardTitle>
              <BarChart3 className="size-3.5" /> Charts
            </CardTitle>
            <CardDescription>Defaults for new chart sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Default chart type</label>
              <Select
                value={settings.charts.defaultChartType}
                onChange={(e) => updateCharts({ defaultChartType: e.target.value as AppSettings["charts"]["defaultChartType"] })}
              >
                <option value="candles">Candles</option>
                <option value="line">Line</option>
                <option value="area">Area</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted">Default timeframe</label>
              <Select
                value={settings.charts.defaultTimeframe}
                onChange={(e) => updateCharts({ defaultTimeframe: e.target.value as AppSettings["charts"]["defaultTimeframe"] })}
              >
                {["1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W", "1M"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
            <SwitchRow
              label="Show volume"
              description="Display volume histogram by default"
              checked={settings.charts.showVolume}
              onChange={(v) => updateCharts({ showVolume: v })}
            />
            <SwitchRow
              label="Show grid"
              description="Grid lines across chart panes"
              checked={settings.charts.showGrid}
              onChange={(v) => updateCharts({ showGrid: v })}
            />
          </CardContent>
        </Card>

        {/* Data source */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Database className="size-3.5" /> Data source
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-line bg-raised/40 p-3.5">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-up opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-up" />
                </span>
                <p className="text-[13px] font-semibold text-primary">Demo Data Provider</p>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-secondary">
                All quotes, candles, news and calendar entries are simulated, deterministic and
                clearly marked. No real market data, no real money. Swap in a live API by
                implementing the <code className="rounded bg-line/60 px-1 py-0.5 text-[10px] text-accent-bright">MarketDataProvider</code>{" "}
                interface in <code className="rounded bg-line/60 px-1 py-0.5 text-[10px] text-accent-bright">src/lib/data/provider.ts</code>.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted">
              <Activity className="size-3.5" />
              Deterministic seed — refreshing the page reproduces the same market. Live ticks advance every 3 seconds.
            </div>
          </CardContent>
        </Card>

        {/* Workspace members */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Users className="size-3.5" /> Workspace members
            </CardTitle>
            <CardDescription>Switch who you&apos;re acting as — data stays shared</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {settings.users.map((u) => (
                <div
                  key={u.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3",
                    u.id === currentUserId ? "border-accent/40 bg-accent-soft/30" : "border-line bg-raised/40"
                  )}
                >
                  <Avatar name={u.name} color={u.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-primary">{u.name}</p>
                    <p className="text-[10px] capitalize text-muted">{u.role} · {u.email}</p>
                  </div>
                  {u.id === currentUserId ? (
                    <span className="rounded-md bg-accent-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-bright">
                      Active
                    </span>
                  ) : (
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentUser(u.id);
                          push(`Now acting as ${u.name}`, "success");
                        }}
                      >
                        Switch
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-down hover:bg-down/10 hover:text-down"
                        onClick={() => {
                          removeUser(u.id);
                          push("Member removed", "info");
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="grid gap-2 rounded-xl border border-line bg-raised/40 p-3 sm:grid-cols-3">
              <Input
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Name"
              />
              <Input
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Email (optional)"
              />
              <div className="flex gap-2">
                <Select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as AppUser["role"])}
                >
                  <option value="member">Member</option>
                  <option value="owner">Owner</option>
                </Select>
                <Button size="sm" onClick={addMember}>
                  <Plus className="size-3.5" /> Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-down/30">
          <CardHeader>
            <CardTitle className="text-down">
              <RotateCcw className="size-3.5" /> Reset
            </CardTitle>
            <CardDescription>Restore all demo data to its original state</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              className="border-down/40 text-down hover:bg-down/10 hover:text-down"
              onClick={() => {
                resetAll();
                localStorage.clear();
                window.location.reload();
              }}
            >
              <RotateCcw className="size-3.5" /> Reset workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[13px] font-medium text-primary">{label}</p>
        <p className="text-[11px] text-muted">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}