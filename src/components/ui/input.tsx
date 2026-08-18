"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leftIcon, rightSlot, ...props },
  ref
) {
  return (
    <div className={cn("relative flex items-center", className)}>
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 text-muted [&>svg]:size-4">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          "h-9 w-full rounded-lg border border-line bg-raised/60 px-3 text-sm text-primary",
          "placeholder:text-muted transition-colors",
          "focus:border-accent/60 focus:ring-glow",
          leftIcon && "pl-9",
          rightSlot && "pr-9",
          props.disabled && "opacity-50 pointer-events-none"
        )}
        {...props}
      />
      {rightSlot && (
        <span className="absolute right-2 text-muted [&>svg]:size-4">{rightSlot}</span>
      )}
    </div>
  );
});