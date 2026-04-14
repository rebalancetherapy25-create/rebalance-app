"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/form-validation';
import { useToast } from '@/components/ui/toaster';

export default function VerifyEmailForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [otp, setOtp] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const [otpError, setOtpError] = useState<string | undefined>();
    const [cooldown, setCooldown] = useState(0);

    const email = searchParams.get('email');

    useEffect(() => {
        if (!email) {
            router.push('/login');
        }
    }, [email, router]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!otp.trim() || otp.trim().length !== 6) {
            setOtpError('Please enter a valid 6-digit code.');
            return;
        }

        setSubmitting(true);
        setOtpError(undefined);
        try {
            await api.post('/auth/verify-otp', { email, otp: otp.trim() });
            toast({
                variant: 'success',
                title: 'Email Verified',
                description: 'Your account is now secure and ready to use.',
            });
            router.push('/dashboard');
            router.refresh();
        } catch (err: unknown) {
            const message = getApiErrorMessage(err, 'Verification failed. Please try again.');
            toast({
                variant: 'error',
                title: 'Invalid Code',
                items: [message],
            });
            setOtpError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        
        setResending(true);
        try {
            await api.post('/auth/resend-otp', { email });
            toast({
                variant: 'success',
                title: 'New code sent!',
                description: 'Please check your email inbox.',
            });
            setCooldown(60);
        } catch (err: unknown) {
            const message = getApiErrorMessage(err, 'Failed to resend code.');
            toast({
                variant: 'error',
                title: 'Unable to resend',
                items: [message],
            });
        } finally {
            setResending(false);
        }
    };

    if (!email) return null;

    return (
        <form onSubmit={handleVerify} noValidate className="space-y-6">
            <div className="space-y-3">
                <div className="rounded-2xl border border-border/60 bg-accent/5 px-4 py-3 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Verification email</p>
                    <p className="mt-1 break-all text-sm font-medium text-foreground sm:text-base">{email}</p>
                </div>
                <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="••••••"
                    className="h-14 rounded-xl border-border bg-accent/5 px-4 text-center font-mono text-2xl tracking-[0.28em] outline-none focus-visible:ring-primary sm:h-16 sm:text-3xl sm:tracking-[0.42em]"
                    value={otp}
                    onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setOtp(val);
                        if (otpError) setOtpError(undefined);
                    }}
                    autoFocus
                    aria-invalid={Boolean(otpError)}
                />
                <FieldError message={otpError} />
            </div>

            <Button
                type="submit"
                disabled={submitting || otp.length !== 6}
                className="h-12 w-full rounded-xl bg-primary text-base font-medium text-text-inverse shadow-md transition-all hover:bg-primary/90"
            >
                {submitting ? 'Verifying...' : 'Verify Email'}
            </Button>
            
            <div className="text-center">
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || cooldown > 0}
                    className="text-sm font-semibold text-primary transition-colors hover:text-primary/80 disabled:opacity-50 disabled:hover:text-primary"
                >
                    {resending ? 'Sending...' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </button>
            </div>
        </form>
    );
}
