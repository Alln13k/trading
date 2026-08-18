import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "accent" | "success" | "danger" | "warning" | "muted" | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  default: "bg-raised text-secondary border border-line",
  accent: "bg-accent-soft text-accent-bright border border-accent/25",
  success: "bg-up-soft text-up border border-up/25",
  danger: "bg-down-soft text-down border border-down/25",
  warning: "bg-warn-soft text-warn border border-warn/25",
  muted: "bg-transparent text-muted border border-line",
  outline: "bg-transparent text-secondary border border-line-strong",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}