"use client";

import { useEffect, useState } from "react";
import { sessionStatus } from "@/lib/data/sessions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SessionBoard() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const { states, overlap, openFx } = sessionStatus(now);
  const utc = now.toISOString().slice(11, 16);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions</CardTitle>
        <CardDescription>
          Clock-based FX hours (UTC {utc}). Not derived from prices.
          {overlap ? ` Overlap: ${openFx.join(" / ")}.` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {states.map((s) => (
          <div
            key={s.id}
            className={cn(
              "rounded-lg border border-line px-2.5 py-2",
              s.open ? "bg-up-soft/40" : "bg-raised/50"
            )}
          >
            <p className="text-[11px] font-semibold text-primary">{s.name}</p>
            <p className={cn("text-[10px] font-medium", s.open ? "text-up" : "text-secondary")}>
              {s.open ? "Open" : "Closed"}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
