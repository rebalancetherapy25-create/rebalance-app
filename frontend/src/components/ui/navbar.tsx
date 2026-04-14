"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

type NavbarUser = {
    name?: string;
    email?: string;
};

const hiddenRoutes = new Set(['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']);

const navLinks = [
    { href: '/therapists', label: 'Therapists' },
    { href: '/about', label: 'About' },
] as const;

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [authStatus, setAuthStatus] = useState<'loading' | 'guest' | 'authenticated'>('loading');
    const [currentUser, setCurrentUser] = useState<NavbarUser | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);

    const shouldHideNavbar = pathname.startsWith('/book') || hiddenRoutes.has(pathname);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (shouldHideNavbar) {
            setAuthStatus('guest');
            setCurrentUser(null);
            return;
        }

        let isActive = true;

        const loadSession = async () => {
            setAuthStatus('loading');

            try {
                const response = await api.get('/auth/me');
                if (!isActive) return;

                setCurrentUser({
                    name: response.data?.name,
                    email: response.data?.email,
                });
                setAuthStatus('authenticated');
            } catch {
                if (!isActive) return;

                setCurrentUser(null);
                setAuthStatus('guest');
            }
        };

        loadSession();

        return () => {
            isActive = false;
        };
    }, [pathname, shouldHideNavbar]);

    if (shouldHideNavbar) {
        return null;
    }

    const firstName = currentUser?.name?.trim().split(/\s+/)[0] || 'Account';
    const initial = firstName.charAt(0).toUpperCase() || 'R';

    const logout = async () => {
        setLoggingOut(true);
        try {
            await api.post('/auth/logout');
        } catch {
            // Clearing client navigation state still improves UX if the cookie is already invalid.
        } finally {
            setCurrentUser(null);
            setAuthStatus('guest');
            setMobileMenuOpen(false);
            router.push('/');
            router.refresh();
            setLoggingOut(false);
        }
    };

    return (
        <header className={`fixed top-0 z-40 w-full transition-all duration-300 ${scrolled ? 'py-2 sm:py-4' : 'py-2 sm:py-5'}`}>
            <div className={`container mx-auto px-4 sm:px-6 transition-all duration-300 ${scrolled ? 'max-w-6xl' : 'max-w-7xl'}`}>
                <div
                    className={cn(
                        'flex items-center justify-between rounded-[1.25rem] px-3 transition-all duration-500 sm:rounded-full sm:px-6',
                        scrolled || mobileMenuOpen
                            ? 'h-14 border border-border/60 bg-background/92 shadow-xl shadow-black/5 backdrop-blur-xl sm:h-16'
                            : 'h-14 border border-border/40 bg-background/78 backdrop-blur-md sm:h-[4.5rem]',
                    )}
                >
                    <div className="relative z-50 flex items-center gap-2">
                        <Logo className="hover:opacity-90 transition-opacity" />
                    </div>

                    <nav
                        className={cn(
                            'hidden items-center gap-2 rounded-full px-3 py-2 md:flex',
                            scrolled ? 'bg-transparent' : 'border border-border/50 bg-background/55 shadow-sm backdrop-blur-md',
                        )}
                    >
                        {navLinks.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                                        isActive ? 'bg-accent/10 text-primary' : 'text-muted-foreground hover:text-primary',
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="hidden items-center gap-3 md:flex">
                        {authStatus === 'loading' ? (
                            <>
                                <div className="h-11 w-28 animate-pulse rounded-full bg-muted/80" />
                                <div className="h-11 w-40 animate-pulse rounded-full bg-muted/80" />
                            </>
                        ) : authStatus === 'authenticated' ? (
                            <>
                                <Button
                                    asChild
                                    variant="ghost"
                                    className={cn(
                                        'rounded-full px-5 font-semibold transition-colors',
                                        pathname.startsWith('/dashboard') ? 'bg-accent/10 text-primary' : 'text-foreground hover:bg-accent/10 hover:text-primary',
                                    )}
                                >
                                    <Link href="/dashboard">
                                        <LayoutDashboard className="h-4 w-4" />
                                        My Sessions
                                    </Link>
                                </Button>
                                <Link
                                    href="/settings"
                                    className={cn(
                                        'flex items-center gap-3 rounded-full border px-3 py-2 transition-all',
                                        pathname === '/settings'
                                            ? 'border-primary/20 bg-primary/5'
                                            : 'border-border/60 bg-background/80 hover:border-primary/20 hover:bg-primary/5',
                                    )}
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                        {initial}
                                    </span>
                                    <span className="hidden text-left lg:block">
                                        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                            Signed in
                                        </span>
                                        <span className="block text-sm font-semibold text-foreground">{firstName}</span>
                                    </span>
                                </Link>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={logout}
                                    disabled={loggingOut}
                                    className="rounded-full px-4 font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {loggingOut ? 'Logging out...' : 'Log out'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button asChild variant="ghost" className="rounded-full px-6 font-bold text-foreground hover:bg-accent/10 hover:text-accent">
                                    <Link href="/login">Log In</Link>
                                </Button>
                                <Button asChild className="rounded-full bg-primary px-7 font-bold text-text-inverse shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/30">
                                    <Link href="/signup">Get Started</Link>
                                </Button>
                            </>
                        )}
                    </div>

                    <button
                        type="button"
                        className="relative z-50 rounded-full p-2 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
                        onClick={() => setMobileMenuOpen((value) => !value)}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-30 bg-background/82 backdrop-blur-sm md:hidden animate-in fade-in duration-300">
                    <div className="mx-4 mt-20 rounded-[2rem] border border-border/50 bg-background p-5 shadow-2xl">
                        {authStatus === 'authenticated' && (
                            <div className="mb-5 rounded-[1.5rem] border border-primary/15 bg-primary/5 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Signed in as</p>
                                <p className="mt-2 text-lg font-semibold text-foreground">{currentUser?.name || 'Rebalance member'}</p>
                                {currentUser?.email && <p className="mt-1 break-all text-sm text-muted-foreground">{currentUser.email}</p>}
                            </div>
                        )}

                        <div className="space-y-2">
                            {navLinks.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center justify-between rounded-2xl px-4 py-4 text-lg font-bold transition-colors',
                                            isActive ? 'bg-primary/8 text-primary' : 'bg-accent/5 text-foreground hover:text-primary',
                                        )}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}

                            {authStatus === 'authenticated' && (
                                <>
                                    <Link
                                        href="/dashboard"
                                        className={cn(
                                            'flex items-center justify-between rounded-2xl px-4 py-4 text-lg font-bold transition-colors',
                                            pathname.startsWith('/dashboard')
                                                ? 'bg-primary/8 text-primary'
                                                : 'bg-accent/5 text-foreground hover:text-primary',
                                        )}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        My Sessions
                                    </Link>
                                    <Link
                                        href="/settings"
                                        className={cn(
                                            'flex items-center justify-between rounded-2xl px-4 py-4 text-lg font-bold transition-colors',
                                            pathname === '/settings'
                                                ? 'bg-primary/8 text-primary'
                                                : 'bg-accent/5 text-foreground hover:text-primary',
                                        )}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Settings
                                    </Link>
                                </>
                            )}
                        </div>

                        <div className="my-5 h-px w-full bg-border/50" />

                        {authStatus === 'authenticated' ? (
                            <div className="flex flex-col gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-12 w-full rounded-2xl border-border/70 text-base font-bold"
                                    onClick={logout}
                                    disabled={loggingOut}
                                >
                                    <LogOut className="h-4 w-4" />
                                    {loggingOut ? 'Logging out...' : 'Log out'}
                                </Button>
                            </div>
                        ) : authStatus === 'loading' ? (
                            <div className="space-y-3">
                                <div className="h-12 w-full animate-pulse rounded-2xl bg-muted/80" />
                                <div className="h-12 w-full animate-pulse rounded-2xl bg-muted/80" />
                            </div>
                        ) : (
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
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
