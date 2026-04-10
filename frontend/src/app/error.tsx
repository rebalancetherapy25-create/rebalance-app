'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6 font-sans">
            <div className="absolute top-8 left-8">
                <Logo />
            </div>
            <div className="max-w-md w-full space-y-8">
                <h1 className="text-6xl font-heading font-bold text-destructive/20">Oops.</h1>
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">Something went unexpectedly wrong.</h2>
                    <p className="text-muted-foreground text-md">We&apos;re experiencing a brief emotional block on our end. Take a deep breath and let&apos;s try that again.</p>
                </div>
                <div className="flex items-center justify-center gap-4 mt-8">
                    <Button onClick={() => reset()} variant="outline" className="h-12 border-primary text-primary rounded-xl">
                        Try Again
                    </Button>
                    <Link href="/">
                        <Button className="h-12 bg-primary text-text-inverse rounded-xl shadow-sm">
                            Return Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
