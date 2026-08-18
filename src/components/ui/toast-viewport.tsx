"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useToastStore, type ToastVariant } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils";

const config: Record<ToastVariant, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: "text-up" },
  error: { icon: XCircle, className: "text-down" },
  warning: { icon: AlertTriangle, className: "text-warn" },
  info: { icon: Info, className: "text-accent-bright" },
};

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((t) => {
        const c = config[t.variant];
        const Icon = c.icon;
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-overlay/95 p-3.5 shadow-xl shadow-black/50 backdrop-blur",
              "animate-slide-up"
            )}
          >
            <Icon className={cn("mt-0.5 size-4.5 shrink-0", c.className)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs text-secondary">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted transition-colors hover:text-primary"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}