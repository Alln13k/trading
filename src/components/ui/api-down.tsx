import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ApiDown({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-[12px] font-semibold text-down",
        className
      )}
      role="alert"
    >
      <AlertTriangle className="size-4 shrink-0" />
      <span>No data API — {label}</span>
    </div>
  );
}