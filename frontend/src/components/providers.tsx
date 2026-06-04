"use client";

import { ReactNode } from "react";

import { ToasterProvider } from "@/components/ui/toaster";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <SmoothScrollProvider>
      <ToasterProvider>{children}</ToasterProvider>
    </SmoothScrollProvider>
  );
}
