"use client";

import { ReactNode } from "react";

import { ToasterProvider } from "@/components/ui/toaster";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return <ToasterProvider>{children}</ToasterProvider>;
}
