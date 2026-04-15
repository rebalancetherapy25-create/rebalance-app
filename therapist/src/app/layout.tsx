import type { Metadata } from "next";
import "./globals.css";
import PortalShell from "@/components/PortalShell";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Rebalance Therapist Portal",
  description: "Therapist portal for availability and booking operations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans text-foreground bg-background antialiased">
        <Providers>
          <PortalShell>{children}</PortalShell>
        </Providers>
      </body>
    </html>
  );
}
