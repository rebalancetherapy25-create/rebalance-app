"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Do not show on specific routes that have their own navigation
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/book') || pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password' || pathname === '/verify-email') {
        return null;
    }

    return (
        <header className={`fixed top-0 z-40 w-full transition-all duration-300 ${scrolled ? 'py-2 sm:py-4' : 'py-2 sm:py-5'}`}>
            <div className={`container mx-auto px-4 sm:px-6 transition-all duration-300 ${scrolled ? 'max-w-5xl' : 'max-w-6xl'}`}>
                <div className={`flex items-center justify-between rounded-[1.25rem] px-3 sm:rounded-full sm:px-8 transition-all duration-500 ${scrolled || mobileMenuOpen ? 'border border-border/60 bg-background/90 shadow-xl shadow-black/5 backdrop-blur-xl h-14 sm:h-16' : 'bg-background/75 backdrop-blur-md border border-border/40 h-14 sm:h-20'}`}>

                    <div className="flex items-center gap-2 hover:opacity-90 transition-opacity relative z-50">
                        <Logo className="" />
                    </div>

                    <nav className={`hidden md:flex gap-8 items-center px-8 py-2.5 rounded-full transition-all duration-500 ${scrolled ? 'bg-transparent' : 'bg-background/50 backdrop-blur-md border border-border/60 shadow-sm'}`}>
                        <Link href="/therapists" className="text-base font-bold text-muted-foreground hover:text-primary transition-colors tracking-wide">Therapists</Link>
                        <Link href="/about" className="text-base font-bold text-muted-foreground hover:text-primary transition-colors tracking-wide">About</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <Button asChild variant="ghost" className="text-foreground hover:bg-accent/10 hover:text-accent rounded-full px-6 font-bold transition-colors">
                            <Link href="/login">Log In</Link>
                        </Button>
                        <Button asChild className="rounded-full px-7 font-bold text-text-inverse bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
                            <Link href="/signup">Get Started</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="relative z-50 rounded-full p-2 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden animate-in fade-in duration-300">
                    <div className="mx-4 mt-20 rounded-[2rem] border border-border/50 bg-background p-5 shadow-2xl">
                        <div className="space-y-2">
                            <Link
                                href="/therapists"
                                className="flex items-center justify-between rounded-2xl bg-accent/5 px-4 py-4 text-lg font-bold text-foreground transition-colors hover:text-primary"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Find a Therapist
                            </Link>
                            <Link
                                href="/about"
                                className="flex items-center justify-between rounded-2xl bg-accent/5 px-4 py-4 text-lg font-bold text-foreground transition-colors hover:text-primary"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                How it Works
                            </Link>
                        </div>

                        <div className="my-5 h-px w-full bg-border/50" />

                        <div className="flex flex-col gap-3">
                            <Button asChild variant="outline" className="h-12 w-full rounded-2xl text-base font-bold">
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                    Log In
                                </Link>
                            </Button>
                            <Button asChild className="h-12 w-full rounded-2xl bg-primary text-base font-bold text-text-inverse shadow-lg shadow-primary/20">
                                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                                    Get Started
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
