import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import AdminLayoutWrapper from "@/components/AdminLayoutWrapper";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Rebalance Admin",
  description: "Super Admin portal for Rebalance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-neutral-950 text-neutral-200`}
      >
        <Providers>
          <AdminLayoutWrapper>
            {children}
          </AdminLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
