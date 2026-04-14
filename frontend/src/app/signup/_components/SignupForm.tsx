"use client";

import { useState } from 'react';
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

export default function SignupForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

    const validate = () => {
        const nextErrors: { name?: string; email?: string; password?: string } = {};

        if (!name.trim()) {
            nextErrors.name = 'Full name is required.';
        } else if (name.trim().length < 2) {
            nextErrors.name = 'Full name must be at least 2 characters.';
        }

        if (!email.trim()) {
            nextErrors.email = 'Email is required.';
        } else if (!emailPattern.test(email.trim())) {
            nextErrors.email = 'Enter a valid email address.';
        }

        if (!password.trim()) {
            nextErrors.password = 'Password is required.';
        } else if (password.length < 8) {
            nextErrors.password = 'Password must be at least 8 characters long.';
        }

        return nextErrors;
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        const nextErrors = validate();

        if (getErrorMessages(nextErrors).length) {
            setErrors(nextErrors);
            toast({
                variant: 'error',
                title: 'Please fix these signup errors',
                items: getErrorMessages(nextErrors),
            });
            return;
        }

        setSubmitting(true);
        setErrors({});
        try {
            await api.post('/auth/register', { name: name.trim(), email: email.trim(), password });
            router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
        } catch (err: unknown) {
            const message = getApiErrorMessage(err, 'Signup failed. Please try again.');
            toast({
                variant: 'error',
                title: 'Unable to create account',
                items: [message],
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSignup} noValidate className="space-y-4">
            <div className="space-y-1.5">
                <label htmlFor="signup-name" className="pl-1 text-sm font-medium text-foreground/90">Full name</label>
                <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
                    autoFocus
                    className={cn(
                        fieldClassName,
                        errors.name && 'border-destructive/30 focus-visible:border-destructive/40 focus-visible:ring-destructive/20'
                    )}
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) {
                            setErrors((current) => ({ ...current, name: undefined }));
                        }
                    }}
                    aria-invalid={Boolean(errors.name)}
                />
                <FieldError message={errors.name} />
            </div>
            <div className="space-y-1.5">
                <label htmlFor="signup-email" className="pl-1 text-sm font-medium text-foreground/90">Email</label>
                <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
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
                    <label htmlFor="signup-password" className="text-sm font-medium text-foreground/90">Password</label>
                    <span className="text-[12px] text-muted-foreground">8+ characters</span>
                </div>
                <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    autoComplete="new-password"
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
                loading={submitting}
                loadingText="Creating account..."
                className="h-11 w-full rounded-[1rem] bg-primary text-sm font-semibold text-primary-foreground shadow-[0_16px_26px_-20px_rgba(74,35,52,0.9)] transition-colors hover:bg-primary/95"
            >
                Create account
            </Button>
        </form>
    );
}
