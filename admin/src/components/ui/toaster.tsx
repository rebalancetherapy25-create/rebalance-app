"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastVariant = "error" | "success";

type ToastInput = {
    title: string;
    description?: string;
    items?: string[];
    variant?: ToastVariant;
    durationMs?: number;
};

type ToastRecord = ToastInput & { id: string };

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
                        role="alert"
                        aria-live="assertive"
                        className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-2xl ${
                            isError
                                ? "border-red-500/30 bg-neutral-950 text-red-100"
                                : "border-emerald-500/30 bg-neutral-950 text-emerald-100"
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                    isError ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"
                                }`}
                            >
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-white">{toast.title}</p>
                                {toast.description ? (
                                    <p className="mt-1 text-sm text-neutral-300">{toast.description}</p>
                                ) : null}
                                {toast.items?.length ? (
                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-300">
                                        {toast.items.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                onClick={() => onDismiss(toast.id)}
                                className="rounded-full p-1 text-neutral-500 transition hover:bg-neutral-900 hover:text-neutral-300"
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

    const toast = useCallback(({ variant = "success", durationMs, ...rest }: ToastInput) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setToasts((current) => [...current.slice(-2), { id, variant, durationMs, ...rest }]);
    }, []);

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
