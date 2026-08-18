"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong py-12 px-6 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-raised text-muted [&>svg]:size-5">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-secondary">{title}</p>
      {description && <p className="max-w-sm text-xs text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}