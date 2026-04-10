import Link from 'next/link';
import { ReactNode } from 'react';
import { ArrowLeft, CalendarDays, ShieldCheck } from 'lucide-react';

import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

type AuthMode = 'login' | 'signup';

const pageCopy = {
    login: {
        badge: 'Secure sign in',
        title: 'Welcome back',
        description: 'Sign in to manage bookings, therapist updates, and upcoming sessions.',
        formTitle: 'Sign in to your account',
        formDescription: 'Use the email and password linked to your Rebalance account.',
        helperTitle: 'What you can do',
        helperItems: ['View upcoming sessions', 'Manage bookings in one place'],
        footerPrompt: "Don't have an account?",
        footerLinkLabel: 'Create account',
        footerLinkHref: '/signup',
        asideNote: 'Your account details and session information stay private and secure.',
    },
    signup: {
        badge: 'New account',
        title: 'Create your account',
        description: 'Set up your account once so booking and managing care feels simple.',
        formTitle: 'Create your account',
        formDescription: 'Enter a few details to save your profile and book faster.',
        helperTitle: 'Why create one',
        helperItems: ['Book faster next time', 'Track sessions and account details'],
        footerPrompt: 'Already have an account?',
        footerLinkLabel: 'Sign in',
        footerLinkHref: '/login',
        asideNote: 'A simple account gives you quicker checkout and one place to manage care.',
    },
} as const;

interface AuthPageShellProps {
    mode: AuthMode;
    children: ReactNode;
}

const switchLinkClassName =
    'inline-flex min-h-[2.75rem] flex-1 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors';

export function AuthPageShell({ mode, children }: AuthPageShellProps) {
    const copy = pageCopy[mode];

    return (
        <div className="min-h-[100dvh] bg-[linear-gradient(180deg,#fcf8f5_0%,#f8f1eb_100%)]">
            <div className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                <header className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/80 bg-background/80 px-4 py-3 shadow-[0_18px_38px_-30px_rgba(74,35,52,0.35)] backdrop-blur sm:px-5">
                    <div className="flex items-center gap-3">
                        <Logo showText={false} width={28} height={28} className="shrink-0" />
                        <span className="text-sm font-semibold tracking-[0.01em] text-primary sm:text-base">
                            Rebalance Therapy
                        </span>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Back to home</span>
                        <span className="sm:hidden">Home</span>
                    </Link>
                </header>

                <div className="grid flex-1 items-center gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10">
                    <section className="order-2 rounded-[2rem] border border-white/70 bg-background/55 p-6 shadow-[0_24px_60px_-42px_rgba(74,35,52,0.38)] backdrop-blur sm:p-8 lg:order-1 lg:p-10">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>{copy.badge}</span>
                        </div>

                        <h1 className="mt-5 font-display text-[2.4rem] leading-[0.98] tracking-tight text-foreground sm:text-[3.1rem] lg:text-[3.6rem]">
                            {copy.title}
                        </h1>
                        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                            {copy.description}
                        </p>

                        <div className="mt-8 max-w-xl rounded-[1.6rem] border border-border/70 bg-white/75 p-5 shadow-[0_18px_40px_-34px_rgba(74,35,52,0.28)] sm:p-6">
                            <p className="text-sm font-semibold text-foreground">{copy.helperTitle}</p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {copy.helperItems.map((item) => (
                                    <div
                                        key={item}
                                        className="flex items-start gap-3 rounded-[1.2rem] border border-border/60 bg-background/80 px-4 py-3"
                                    >
                                        <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                        </div>
                                        <p className="text-sm leading-6 text-foreground/80">{item}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-4 text-sm leading-6 text-muted-foreground">{copy.asideNote}</p>
                        </div>
                    </section>

                    <section className="order-1 rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,246,242,0.96))] p-5 shadow-[0_28px_70px_-44px_rgba(74,35,52,0.45)] sm:p-7 lg:order-2 lg:p-8">
                        <div className="inline-flex w-full rounded-full border border-border/70 bg-muted/50 p-1">
                            <Link
                                href="/login"
                                className={cn(
                                    switchLinkClassName,
                                    mode === 'login'
                                        ? 'bg-background text-foreground shadow-[0_10px_20px_-16px_rgba(74,35,52,0.45)]'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/signup"
                                className={cn(
                                    switchLinkClassName,
                                    mode === 'signup'
                                        ? 'bg-background text-foreground shadow-[0_10px_20px_-16px_rgba(74,35,52,0.45)]'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                Create account
                            </Link>
                        </div>

                        <div className="mt-6">
                            <h2 className="text-[1.75rem] font-display leading-none tracking-tight text-foreground sm:text-[2rem]">
                                {copy.formTitle}
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                {copy.formDescription}
                            </p>
                        </div>

                        <div className="mt-6 rounded-[1.5rem] border border-border/60 bg-background/85 p-4 sm:p-5">
                            {children}
                        </div>

                        <p className="mt-5 text-center text-sm text-muted-foreground">
                            {copy.footerPrompt}{' '}
                            <Link
                                href={copy.footerLinkHref}
                                className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline underline-offset-4"
                            >
                                {copy.footerLinkLabel}
                            </Link>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
