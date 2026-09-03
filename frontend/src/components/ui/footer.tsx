"use client";

import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { usePathname } from 'next/navigation';
import { Instagram, Linkedin } from 'lucide-react';

export function Footer() {
    const pathname = usePathname();

    if (pathname.startsWith('/dashboard') || pathname.startsWith('/book') || pathname.startsWith('/settings') || pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password' || pathname === '/verify-email') {
        return null;
    }

    return (
        <footer className="bg-[#FDFBFB] px-6 py-8 sm:px-10 sm:py-9 text-foreground relative overflow-hidden border-t border-border/60">
            <div className="container mx-auto max-w-[1300px] relative z-10">
                {/* Main Minimal Row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border/40">
                    {/* Brand & Tagline */}
                    <div className="space-y-1.5">
                        <Logo textColorClass="text-[#581C2B]" />
                        <p className="text-[11px] sm:text-xs text-muted-foreground max-w-xs leading-relaxed">
                            A mindful therapy ecosystem dedicated to emotional balance.
                        </p>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex flex-wrap items-center gap-x-6 sm:gap-x-8 gap-y-2 text-xs sm:text-sm font-medium text-muted-foreground">
                        <Link href="/therapists" className="hover:text-[#581C2B] transition-colors">
                            Find a Therapist
                        </Link>
                        <Link href="/about" className="hover:text-[#581C2B] transition-colors">
                            How it Works
                        </Link>
                        <Link href="/privacy" className="hover:text-[#581C2B] transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-[#581C2B] transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="/contact" className="hover:text-[#581C2B] transition-colors">
                            Contact Us
                        </Link>
                    </div>

                    {/* Socials */}
                    <div className="flex items-center gap-2 shrink-0">
                        <a 
                            href="https://www.instagram.com/rebalancetherapy.co?igsi=MXJvNW5uZzZ5MnEweA%3D%3D&utm_source=qr" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            aria-label="Instagram"
                            className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-[#581C2B] hover:border-[#581C2B]/30 hover:bg-[#FAF0F2] transition-all duration-200"
                        >
                            <Instagram className="w-3.5 h-3.5" />
                        </a>
                        <a 
                            href="https://www.linkedin.com/company/rebalancetherapy/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            aria-label="LinkedIn"
                            className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-[#581C2B] hover:border-[#581C2B]/30 hover:bg-[#FAF0F2] transition-all duration-200"
                        >
                            <Linkedin className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>

                {/* Bottom Bar - Copyright */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground/70">
                    <p>© {new Date().getFullYear()} Rebalance Therapy. All rights reserved.</p>
                    <p className="flex items-center gap-1.5">Designed with care & empathy.</p>
                </div>
            </div>
        </footer>
    );
}
