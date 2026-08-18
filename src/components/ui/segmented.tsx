"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SegmentedProps<T extends string> {
  options: Array<{ value: T; label: ReactNode }>;
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: "sm" | "md";
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-line bg-raised/60 p-0.5",
        className
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md font-medium transition-all duration-150 whitespace-nowrap",
            size === "sm" ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs",
            value === o.value
              ? "bg-overlay text-primary shadow-sm border border-line-strong"
              : "text-muted hover:text-secondary border border-transparent"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface TabsProps<T extends string> {
  tabs: Array<{ value: T; label: string; icon?: ReactNode }>;
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: TabsProps<T>) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 overflow-x-auto rounded-lg border border-line bg-raised/40 p-1",
        className
      )}
    >
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
            value === t.value
              ? "bg-overlay text-primary shadow-sm [&>svg]:text-accent-bright"
              : "text-muted hover:text-secondary"
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}