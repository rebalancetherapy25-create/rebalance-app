"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/form-validation';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';

export default function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { toast } = useToast();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const nextErrors: { password?: string; confirmPassword?: string } = {};
        if (!password) {
            nextErrors.password = 'Password is required.';
        } else if (password.length < 8) {
            nextErrors.password = 'Password must be at least 8 characters.';
        }

        if (password !== confirmPassword) {
            nextErrors.confirmPassword = 'Passwords do not match.';
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        if (!token) {
            toast({
                variant: 'error',
                title: 'Invalid reset link',
                description: 'The reset link is missing its token. Please request a new one.',
            });
            return;
        }

        setSubmitting(true);
        setErrors({});
        try {
            await api.post('/auth/reset-password', { token, password });
            toast({
                variant: 'success',
                title: 'Password updated!',
                description: 'You can now log in with your new password.',
            });
            router.push('/login');
        } catch (err: unknown) {
            const message = getApiErrorMessage(err, 'Failed to reset password.');
            toast({
                variant: 'error',
                title: 'Update failed',
                items: [message],
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleReset} noValidate className="space-y-6">
            <div className="space-y-2">
                <label htmlFor="reset-password" className="text-sm font-medium text-foreground">New Password</label>
                <Input
                    id="reset-password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={cn(
                        'rounded-xl bg-accent/5 border-border focus-visible:ring-primary h-12',
                        errors.password && 'border-destructive/30 focus-visible:ring-destructive/40'
                    )}
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    aria-invalid={Boolean(errors.password)}
                />
                <FieldError message={errors.password} />
            </div>

            <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">Confirm New Password</label>
                <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={cn(
                        'rounded-xl bg-accent/5 border-border focus-visible:ring-primary h-12',
                        errors.confirmPassword && 'border-destructive/30 focus-visible:ring-destructive/40'
                    )}
                    value={confirmPassword}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    aria-invalid={Boolean(errors.confirmPassword)}
                />
                <FieldError message={errors.confirmPassword} />
            </div>

            <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl text-md font-medium bg-primary text-text-inverse hover:bg-primary/90 shadow-md"
            >
                {submitting ? 'Updating password...' : 'Update Password'}
            </Button>
        </form>
    );
}
