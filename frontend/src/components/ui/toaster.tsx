"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "error" | "success";

type ToastInput = {
  title: string;
  description?: string;
  items?: string[];
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastRecord = ToastInput & {
  id: string;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastRecord[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
      {toasts.map((toast) => {
        const isError = toast.variant === "error";
        const Icon = isError ? AlertCircle : CheckCircle2;

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-2xl border p-4 shadow-xl backdrop-blur-sm animate-in slide-in-from-top-4 fade-in",
              isError
                ? "border-red-200 bg-background/95 text-red-950"
                : "border-emerald-200 bg-background/95 text-emerald-950"
            )}
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  isError ? "bg-red-100 text-destructive" : "bg-emerald-100 text-emerald-600"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-sm text-slate-600">{toast.description}</p>
                ) : null}
                {toast.items?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {toast.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    ({ variant = "success", durationMs, ...rest }: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nextToast: ToastRecord = {
        ...rest,
        durationMs,
        id,
        variant,
      };

      setToasts((current) => [...current.slice(-2), nextToast]);
    },
    []
  );

  useEffect(() => {
    if (!toasts.length) {
      return;
    }

    const timers = toasts.map((toastItem) =>
      window.setTimeout(
        () => dismiss(toastItem.id),
        toastItem.durationMs ?? (toastItem.variant === "error" ? 6500 : 3500)
      )
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [dismiss, toasts]);

  const value = useMemo(
    () => ({
      toast,
      dismiss,
    }),
    [dismiss, toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToasterProvider");
  }

  return context;
}
