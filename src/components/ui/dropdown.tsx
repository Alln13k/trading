"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { useOnClickOutside } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface DropdownCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<DropdownCtx>({ open: false, setOpen: () => {} });

export function Dropdown({
  trigger,
  children,
  align = "right",
  className,
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false), open);

  return (
    <Ctx.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        <div onClick={() => setOpen(!open)}>{trigger}</div>
        {open && (
          <div
            className={cn(
              "absolute z-50 mt-1.5 min-w-44 overflow-hidden rounded-xl border border-line bg-overlay/98 shadow-2xl shadow-black/60 backdrop-blur animate-scale-in",
              align === "right" ? "right-0" : "left-0",
              className
            )}
          >
            {children}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export function DropdownItem({
  children,
  onClick,
  className,
  danger,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  danger?: boolean;
}) {
  const { setOpen } = useContext(Ctx);
  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors",
        danger
          ? "text-down hover:bg-down/10"
          : "text-secondary hover:bg-raised hover:text-primary",
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownHeader({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-line px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </div>
  );
}

export function DropdownDivider() {
  return <div className="my-1 h-px bg-line" />;
}