import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Rebalance Therapy | Online Booking Platform",
  description: "Find Balance. Begin Your Journey. Secure, affordable online counselling tailored for you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden w-full selection:bg-primary/20 selection:text-primary">
      <body className="font-sans bg-background text-text-primary antialiased overflow-x-hidden w-full relative">
        {/* Global Grain Overlay */}
        <div className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.03] mix-blend-difference">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 h-full w-full opacity-100">
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)"/>
          </svg>
        </div>
        
        <Providers>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
