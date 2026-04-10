"use client";

import type { ReactNode } from "react";

import { ToasterProvider } from "@/components/ui/toaster";

export function Providers({ children }: { children: ReactNode }) {
    return <ToasterProvider>{children}</ToasterProvider>;
}
