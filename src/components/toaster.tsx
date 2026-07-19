"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}
interface ToastPayload {
  type: ToastType;
  message: string;
}

const EVENT = "app-toast";

export const toast = (payload: ToastPayload) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: payload }));
};
toast.success = (message: string) => toast({ type: "success", message });
toast.error = (message: string) => toast({ type: "error", message });
toast.info = (message: string) => toast({ type: "info", message });

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const;

const STYLES = {
  success: "border-emerald-200 bg-white text-emerald-700",
  error: "border-rose-200 bg-white text-rose-700",
  info: "border-sky-200 bg-white text-sky-700",
} as const;

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<ToastPayload>).detail;
      if (!detail) return;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, ...detail }]);
      window.setTimeout(() => dismiss(id), 4200);
    }
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [dismiss]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "animate-pop-in pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-slate-900/5",
              STYLES[t.type],
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="flex-1 text-sm font-medium text-slate-700">
              {t.message}
            </p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-400 transition hover:text-slate-600"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
