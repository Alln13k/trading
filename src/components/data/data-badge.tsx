import { cn } from "@/lib/utils";
import type { DataQuality } from "@/lib/types";

export function DataBadge({ quality, className }: { quality: DataQuality; className?: string }) {
  const label =
    quality === "live"
      ? "Live"
      : quality === "delayed"
        ? "Delayed"
        : quality === "cached"
          ? "Cached"
          : "Unavailable";
  return (
    <span
      className={cn(
        "inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        quality === "unavailable" && "bg-down-soft text-down",
        quality === "cached" && "bg-warn-soft text-warn",
        quality === "delayed" && "bg-accent-soft text-accent",
        quality === "live" && "bg-up-soft text-up",
        className
      )}
    >
      {label}
    </span>
  );
}
