import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import PortalShell from "@/components/PortalShell";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Rebalance Therapist Portal",
  description: "Therapist portal for availability and booking operations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} font-sans text-foreground bg-background antialiased`}>
        <Providers>
          <PortalShell>{children}</PortalShell>
        </Providers>
      </body>
    </html>
  );
}
