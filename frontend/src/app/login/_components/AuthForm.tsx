"use client";

import { useState } from 'react';
import { isAxiosError } from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { emailPattern, getApiErrorMessage, getErrorMessages } from '@/lib/form-validation';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';

const fieldClassName =
    'h-11 rounded-[1rem] border border-border/70 bg-background text-foreground shadow-none placeholder:text-muted-foreground/70 focus-visible:border-primary/35 focus-visible:ring-2 focus-visible:ring-primary/15 transition-all duration-200';

type LoginErrorResponse = {
    unverified?: boolean;
};

export default function AuthForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const nextErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            nextErrors.email = 'Email is required.';
        } else if (!emailPattern.test(email.trim())) {
            nextErrors.email = 'Enter a valid email address.';
        }

        if (!password.trim()) {
            nextErrors.password = 'Password is required.';
        }

        return nextErrors;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const nextErrors = validate();

        if (getErrorMessages(nextErrors).length) {
            setErrors(nextErrors);
            toast({
                variant: 'error',
                title: 'Please fix these login errors',
                items: getErrorMessages(nextErrors),
            });
            return;
        }

        setSubmitting(true);
        setErrors({});
        try {
            await api.post('/auth/login', { email: email.trim(), password });
            router.push('/dashboard');
            router.refresh();
        } catch (err: unknown) {
            if (isAxiosError<LoginErrorResponse>(err) && err.response?.status === 403 && err.response.data?.unverified) {
                router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
                return;
            }
            const message = getApiErrorMessage(err, 'Login failed. Please try again.');
            toast({
                variant: 'error',
                title: 'Unable to log in',
                items: [message],
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div className="space-y-1.5">
                <label htmlFor="login-email" className="pl-1 text-sm font-medium text-foreground/90">Email</label>
                <Input
                    id="login-email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    autoFocus
                    className={cn(
                        fieldClassName,
                        errors.email && 'border-destructive/30 focus-visible:border-destructive/40 focus-visible:ring-destructive/20'
                    )}
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) {
                            setErrors((current) => ({ ...current, email: undefined }));
                        }
                    }}
                    aria-invalid={Boolean(errors.email)}
                />
                <FieldError message={errors.email} />
            </div>
            <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-4 pl-1">
                    <label htmlFor="login-password" className="text-sm font-medium text-foreground/90">Password</label>
                    <Link href="/forgot-password" className="text-[13px] font-semibold text-primary/90 transition-colors hover:text-primary hover:underline underline-offset-4">
                        Forgot?
                    </Link>
                </div>
                <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={cn(
                        fieldClassName,
                        errors.password && 'border-destructive/30 focus-visible:border-destructive/40 focus-visible:ring-destructive/20'
                    )}
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) {
                            setErrors((current) => ({ ...current, password: undefined }));
                        }
                    }}
                    aria-invalid={Boolean(errors.password)}
                />
                <FieldError message={errors.password} />
            </div>

            <Button
                type="submit"
                disabled={submitting}
                className="h-11 w-full rounded-[1rem] bg-primary text-sm font-semibold text-primary-foreground shadow-[0_16px_26px_-20px_rgba(74,35,52,0.9)] transition-colors hover:bg-primary/95"
            >
                {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
        </form>
    );
}
