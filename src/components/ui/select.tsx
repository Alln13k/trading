"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className={cn("relative", className)}>
        <select
          ref={ref}
          className={cn(
            "h-9 w-full appearance-none rounded-lg border border-line bg-raised/60 pl-3 pr-8 text-sm text-primary",
            "focus:border-accent/60 focus:ring-glow transition-colors",
            props.disabled && "opacity-50 pointer-events-none"
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
    );
  }
);