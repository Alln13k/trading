"use client";

import { useActivityStore } from "@/lib/stores/activity-store";
import { useSettingsStore, useCurrentUser } from "@/lib/stores/settings-store";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";

export default function DuoPage() {
  const users = useSettingsStore((s) => s.settings.users);
  const setCurrent = useSettingsStore((s) => s.setCurrentUser);
  const me = useCurrentUser();
  const events = useActivityStore((s) => s.events);

  return (
    <div>
      <PageHeader
        title="Duo Workspace"
        description="Two local profiles on this browser. Shared watchlists, journal, and paper ledger. Not a cloud account yet."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profiles</CardTitle>
            <CardDescription>Active: {me.name}. Switching only changes who new actions are attributed to.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                <div className="flex items-center gap-2">
                  <Avatar name={u.name} />
                  <div>
                    <p className="text-[13px] font-semibold">{u.name}</p>
                    <p className="text-[11px] text-secondary">{u.role}</p>
                  </div>
                </div>
                <Button size="sm" disabled={me.id === u.id} onClick={() => setCurrent(u.id)}>
                  {me.id === u.id ? "Active" : "Switch"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Local audit log. Empty until you change watchlists, paper, or journal.</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <EmptyState title="No activity yet" description="Actions from either profile show up here." />
            ) : (
              <ul className="space-y-2">
                {events.slice(0, 20).map((e) => (
                  <li key={e.id} className="text-[13px] text-secondary">
                    <span className="font-semibold text-primary">{e.userName}</span> {e.action}{" "}
                    <span className="text-accent">{e.target}</span>
                    <span className="ml-2 text-[10px]">{timeAgo(e.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
