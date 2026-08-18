"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "success";
type Size = "xs" | "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-accent text-white shadow-[0_1px_12px_rgba(99,102,241,0.35)] hover:shadow-[0_1px_18px_rgba(99,102,241,0.5)] hover:brightness-110 active:brightness-95",
  secondary:
    "bg-raised text-primary border border-line hover:border-line-strong hover:bg-overlay",
  ghost: "text-secondary hover:bg-raised hover:text-primary",
  outline:
    "border border-line-strong text-primary hover:border-accent/60 hover:text-accent-bright",
  danger: "bg-down/15 text-down border border-down/25 hover:bg-down/25",
  success: "bg-up/15 text-up border border-up/25 hover:bg-up/25",
};

const sizes: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs rounded-md gap-1.5",
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-9 px-4 text-sm rounded-lg gap-2",
  lg: "h-11 px-6 text-sm rounded-xl gap-2",
  icon: "h-8 w-8 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", loading, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 select-none",
        "disabled:opacity-50 disabled:pointer-events-none",
        "focus-visible:ring-glow",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="size-3.5 animate-spin" />}
      {children}
    </button>
  );
});