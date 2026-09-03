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
    <html lang="en" className="overflow-x-clip w-full selection:bg-primary/20 selection:text-primary">
      <body className="font-sans bg-background text-text-primary antialiased overflow-x-clip w-full relative">
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
