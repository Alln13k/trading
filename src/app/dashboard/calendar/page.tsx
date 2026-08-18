"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Info } from "lucide-react";
import { marketData } from "@/lib/data/provider";
import type { EventImportance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/segmented";
import { Badge } from "@/components/ui/badge";

const IMP_COLORS: Record<EventImportance, string> = {
  low: "bg-line-strong",
  medium: "bg-warn",
  high: "bg-down",
};

export default function CalendarPage() {
  const [importance, setImportance] = useState<"all" | EventImportance>("all");
  const events = useMemo(() => marketData.getEconomicCalendar(), []);

  const groups = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const e of events) {
      if (importance !== "all" && e.importance !== importance) continue;
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return [...map.entries()];
  }, [events, importance]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Economic Calendar"
        description="Key macro events with forecast and previous readings — demo data, refreshed weekly."
        actions={
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <Info className="size-3.5" /> Times in UTC
          </span>
        }
      />

      <Tabs
        className="mb-4"
        value={importance}
        onChange={setImportance}
        tabs={[
          { value: "all", label: "All events" },
          { value: "high", label: "High" },
          { value: "medium", label: "Medium" },
          { value: "low", label: "Low" },
        ]}
      />

      <div className="space-y-4">
        {groups.map(([date, dayEvents]) => (
          <Card key={date}>
            <CardContent className="p-0">
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                <CalendarClock className="size-3.5 text-accent-bright" />
                <p className="text-[12px] font-semibold text-primary">{date}</p>
                <span className="ml-auto text-[10px] text-muted">{dayEvents.length} events</span>
              </div>
              <div className="divide-y divide-line">
                {dayEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-[12px] transition-colors hover:bg-raised/40">
                    <span className="w-12 text-muted tabular">{e.time}</span>
                    <span className="text-base leading-none">{e.flag}</span>
                    <span className="hidden w-8 text-[10px] font-semibold uppercase text-muted sm:block">
                      {e.country}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-primary">{e.event}</p>
                      <p className="text-[10px] text-muted">
                        Unit: {e.unit || "—"} · Result: {e.result ?? "pending"}
                      </p>
                    </div>
                    <div className="hidden text-right tabular md:block">
                      <p className="text-[11px] text-muted">Forecast <b className="text-secondary">{e.forecast}</b></p>
                      <p className="text-[11px] text-muted">Previous <b className="text-secondary">{e.previous}</b></p>
                    </div>
                    <div className="w-16 text-right">
                      {e.result !== undefined ? (
                        <Badge
                          variant={
                            e.forecast !== "—" && parseFloat(e.result.replace("%", "")) > parseFloat(e.forecast.replace("%", ""))
                              ? "success"
                              : e.forecast !== "—" && parseFloat(e.result.replace("%", "")) < parseFloat(e.forecast.replace("%", ""))
                                ? "danger"
                                : "default"
                          }
                        >
                          {e.result}
                        </Badge>
                      ) : (
                        <Badge variant="muted">Pending</Badge>
                      )}
                    </div>
                    <div className="w-16">
                      <ImportanceDots importance={e.importance} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {groups.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-sm text-secondary">No events match this filter.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ImportanceDots({ importance }: { importance: EventImportance }) {
  const levels = importance === "high" ? 3 : importance === "medium" ? 2 : 1;
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn("size-1.5 rounded-full", i < levels ? IMP_COLORS[importance] : "bg-line-strong")}
        />
      ))}
      <span className="ml-1 text-[9px] uppercase tracking-wide text-muted">{importance}</span>
    </div>
  );
}