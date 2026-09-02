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
        <footer className="bg-primary px-6 py-20 sm:px-12 sm:py-32 text-primary-foreground relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[600px] h-[600px] bg-background/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="container mx-auto max-w-[1400px] relative z-10">
                {/* Middle Section - Links & Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pt-4">
                    <div className="lg:col-span-5 space-y-8">
                        <Logo textColorClass="text-primary-foreground" />
                        <div className="flex gap-4">
                            <a href="https://www.instagram.com/rebalancetherapy.co?igsi=MXJvNW5uZzZ5MnEweA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-primary-foreground/20 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-all duration-300">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="https://www.linkedin.com/company/rebalancetherapy/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-primary-foreground/20 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-all duration-300">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    <div className="lg:col-span-3 lg:col-start-7 space-y-6">
                        <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary-foreground/50">Platform</h4>
                        <ul className="space-y-4">
                            <li><Link href="/therapists" className="text-lg font-medium text-primary-foreground/80 hover:text-accent transition-colors">Find a Therapist</Link></li>
                            <li><Link href="/about" className="text-lg font-medium text-primary-foreground/80 hover:text-accent transition-colors">How it Works</Link></li>
                            <li><Link href="/login" className="text-lg font-medium text-primary-foreground/80 hover:text-accent transition-colors">Sign In</Link></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-3 space-y-6">
                        <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary-foreground/50">Legal</h4>
                        <ul className="space-y-4">
                            <li><Link href="/privacy" className="text-lg font-medium text-primary-foreground/80 hover:text-accent transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-lg font-medium text-primary-foreground/80 hover:text-accent transition-colors">Terms of Service</Link></li>
                            <li><Link href="/contact" className="text-lg font-medium text-primary-foreground/80 hover:text-accent transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section - Copyright */}
                <div className="mt-24 pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm font-medium text-primary-foreground/50">
                        © {new Date().getFullYear()} Rebalance Therapy. All rights reserved.
                    </p>
                    <p className="text-sm font-medium text-primary-foreground/50 flex items-center gap-2">
                        Designed with care.
                    </p>
                </div>
            </div>
        </footer>
    );
}
