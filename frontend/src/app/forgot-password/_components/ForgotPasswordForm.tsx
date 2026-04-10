"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { emailPattern, getApiErrorMessage } from '@/lib/form-validation';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';

export default function ForgotPasswordForm() {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [emailError, setEmailError] = useState<string | undefined>();
    const [success, setSuccess] = useState(false);

    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email.trim()) {
            setEmailError('Email is required.');
            return;
        } else if (!emailPattern.test(email.trim())) {
            setEmailError('Enter a valid email address.');
            return;
        }

        setSubmitting(true);
        setEmailError(undefined);
        try {
            await api.post('/auth/forgot-password', { email: email.trim() });
            setSuccess(true);
            toast({
                variant: 'success',
                title: 'Reset link sent!',
                description: 'Check your email for instructions to reset your password.',
            });
        } catch (err: unknown) {
            const message = getApiErrorMessage(err, 'Failed to send reset email.');
            toast({
                variant: 'error',
                title: 'Unable to send link',
                items: [message],
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="text-center space-y-4">
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                    <p className="font-bold">Email Sent</p>
                    <p className="text-sm">We&apos;ve sent a reset link to <strong>{email}</strong>.</p>
                </div>
                <Button variant="outline" onClick={() => setSuccess(false)} className="rounded-xl">
                    Try another email
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleForgot} noValidate className="space-y-6">
            <div className="space-y-2">
                <label htmlFor="forgot-email" className="text-sm font-medium text-foreground">Email</label>
                <Input
                    id="forgot-email"
                    type="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    className={cn(
                        'rounded-xl bg-accent/5 border-border focus-visible:ring-primary h-12',
                        emailError && 'border-destructive/30 focus-visible:ring-destructive/40'
                    )}
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(undefined);
                    }}
                    aria-invalid={Boolean(emailError)}
                />
                <FieldError message={emailError} />
            </div>

            <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl text-md font-medium bg-primary text-text-inverse hover:bg-primary/90 shadow-md"
            >
                {submitting ? 'Sending link...' : 'Send Reset Link'}
            </Button>
        </form>
    );
}
