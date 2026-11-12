"use client";

import { useState } from "react";
import { useStrategiesStore } from "@/lib/stores/strategies-store";
import { useCurrentUser } from "@/lib/stores/settings-store";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

export default function StrategiesPage() {
  const notes = useStrategiesStore((s) => s.notes);
  const add = useStrategiesStore((s) => s.add);
  const update = useStrategiesStore((s) => s.update);
  const remove = useStrategiesStore((s) => s.remove);
  const user = useCurrentUser();
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [setup, setSetup] = useState("");
  const [invalidation, setInvalidation] = useState("");
  const [markets, setMarkets] = useState("");

  return (
    <div>
      <PageHeader
        title="Strategies"
        description="Local playbooks for the duo. These are rules you write — not automated signals."
      />
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>New note</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Markets (e.g. EUR/USD)" value={markets} onChange={(e) => setMarkets(e.target.value)} />
          <Input placeholder="Setup" value={setup} onChange={(e) => setSetup(e.target.value)} />
          <Input placeholder="Invalidation" value={invalidation} onChange={(e) => setInvalidation(e.target.value)} />
          <Button
            className="md:col-span-2"
            disabled={!name.trim()}
            onClick={() => {
              if (editing) {
                update(editing, { name: name.trim(), setup, invalidation, markets });
                setEditing(null);
              } else {
                add({
                  name: name.trim(),
                  setup,
                  invalidation,
                  markets,
                  userId: user.id,
                  userName: user.name,
                });
              }
              setName("");
              setSetup("");
              setInvalidation("");
              setMarkets("");
            }}
          >
            {editing ? "Update strategy" : "Save strategy"}
          </Button>
        </CardContent>
      </Card>
      {notes.length === 0 ? (
        <EmptyState title="No strategies yet" description="Add a named setup and invalidation to start the book." />
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <Card key={n.id} id={`strategy-${n.id}`}>
              <CardHeader className="flex-row items-start justify-between">
                <div>
                  <CardTitle>{n.name}</CardTitle>
                  <p className="text-[11px] text-secondary">
                    {n.userName} · {n.markets || "no market tag"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setEditing(n.id);
                      setName(n.name);
                      setSetup(n.setup);
                      setInvalidation(n.invalidation);
                      setMarkets(n.markets);
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => remove(n.id)}>
                    Remove
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-[13px] text-secondary">
                <p>Setup: {n.setup || "—"}</p>
                <p>Invalidation: {n.invalidation || "—"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
