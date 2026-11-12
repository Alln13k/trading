"use client";

import { useState } from "react";
import { LESSONS } from "@/lib/content/lessons";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AcademyPage() {
  const [id, setId] = useState(LESSONS[0].id);
  const lesson = LESSONS.find((l) => l.id === id) ?? LESSONS[0];

  return (
    <div>
      <PageHeader
        title="Academy"
        description="Short process lessons. No market calls and no promised returns."
      />
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card>
          <CardContent className="space-y-1 pt-4">
            {LESSONS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setId(l.id)}
                className={cn(
                  "block w-full rounded-md px-2 py-2 text-left text-[13px]",
                  l.id === lesson.id ? "bg-accent-soft text-accent" : "text-secondary hover:bg-raised"
                )}
              >
                <span className="block text-[10px] uppercase tracking-wide">{l.module}</span>
                {l.title}
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{lesson.module}</CardDescription>
            <CardTitle>{lesson.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-[14px] leading-relaxed text-secondary">{lesson.body}</CardContent>
        </Card>
      </div>
    </div>
  );
}
