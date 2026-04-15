'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { Mail, Lock, Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/toaster';
import { emailPattern, getApiErrorMessage, getErrorMessages } from '@/lib/form-validation';

function AdminLoginContent() {
    const router = useRouter();
    const params = useSearchParams();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const reason = params.get('reason');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string | undefined> = {};

        if (!email.trim()) {
            errors.email = 'Email is required.';
        } else if (!emailPattern.test(email.trim())) {
            errors.email = 'Enter a valid email address.';
        }

        if (!password.trim()) {
            errors.password = 'Password is required.';
        }

        const messages = getErrorMessages(errors);
        if (messages.length) {
            toast({
                variant: 'error',
                title: 'Please fix these login errors',
                items: messages,
            });
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email: email.trim(), password });

            if (response.data.role !== 'admin') {
                toast({
                    variant: 'error',
                    title: 'Unable to sign in',
                    items: ['Unauthorized access. Admin privileges required.'],
                });
                setLoading(false);
                return;
            }

            router.push('/');
            router.refresh();
        } catch (err: unknown) {
            const errorMessage = getApiErrorMessage(err, 'Failed to login. Please try again.');
            toast({
                variant: 'error',
                title: 'Unable to sign in',
                items: [errorMessage],
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-6 text-neutral-200">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 -z-10" />

            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-8 transform transition-all hover:border-neutral-700/50">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6">
                        <ShieldCheck className="w-8 h-8 text-neutral-950" />
                    </div>
                    <h1 className="text-3xl font-light tracking-tight text-white mb-2">Admin Portal</h1>
                    <p className="text-neutral-500 text-sm">Sign in to manage Rebalance</p>
                </div>

                {reason === 'unauthorized' && (
                    <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        Your admin session expired or no longer has access. Sign in again to continue securely.
                    </div>
                )}

                <form onSubmit={handleLogin} noValidate className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-400 pl-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-neutral-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                                placeholder="admin@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-400 pl-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-neutral-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Sign In to Dashboard'
                        )}
                    </button>
                </form>
            </div>

            <p className="mt-8 text-sm text-neutral-600">
                &copy; {new Date().getFullYear()} Rebalance. All rights reserved.
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
        }>
            <AdminLoginContent />
        </Suspense>
    );
}
