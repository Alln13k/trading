import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/ui/sparkline";

interface StatProps {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  deltaPositive?: boolean;
  icon?: ReactNode;
  spark?: number[];
  sparkPositive?: boolean;
  className?: string;
  hint?: string;
}

export function Stat({
  label,
  value,
  delta,
  deltaPositive,
  icon,
  spark,
  sparkPositive,
  className,
  hint,
}: StatProps) {
  const positive = deltaPositive ?? sparkPositive;
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-line bg-surface/80 p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
        {icon && <span className="text-muted [&>svg]:size-3.5">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-xl font-semibold tracking-tight text-primary tabular">{value}</span>
        {delta !== undefined && (
          <span
            className={cn(
              "text-xs font-medium tabular",
              positive === undefined
                ? "text-secondary"
                : positive
                  ? "text-up"
                  : "text-down"
            )}
          >
            {delta}
          </span>
        )}
      </div>
      {spark && (
        <div className="pointer-events-none absolute bottom-0 right-0 h-10 w-28 opacity-70">
          <Sparkline data={spark} positive={sparkPositive} />
        </div>
      )}
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}