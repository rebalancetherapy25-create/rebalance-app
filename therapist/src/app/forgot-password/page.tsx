'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
import { emailPattern, getApiErrorMessage } from '@/lib/form-validation';
import { toastApiError } from '@/lib/toast';
import { cn } from '@/lib/utils';

export default function TherapistForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!emailPattern.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setError(undefined);
    try {
      await api.post('/therapist-auth/forgot-password', { email: email.trim() });
      setSuccess(true);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Failed to request password reset.');
      toastApiError(toast, message, 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-accent/10 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-primary/5 blur-3xl -z-10 pointer-events-none" />

      <Card className="w-full max-w-md border-none shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-3xl font-heading font-extrabold">Reset Password</CardTitle>
          <CardDescription className="text-base">Enter your email and we'll send you a secure link to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-6 text-center">
              <div className="p-4 rounded-xl bg-green-50 text-green-800 border border-green-200">
                If that email is registered, a password reset link has been sent. Please check your inbox.
              </div>
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href="/login">Back to Sign In</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Email</label>
                <Input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(undefined);
                  }}
                  type="email"
                  aria-invalid={Boolean(error)}
                  className={cn('h-11 rounded-xl bg-white', error && 'border-red-300 focus-visible:ring-red-400')}
                />
                <FieldError message={error} />
              </div>
              
              <div className="pt-2 space-y-3">
                <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl font-semibold">
                  {submitting ? 'Sending Link...' : 'Send Reset Link'}
                </Button>
                
                <Button asChild variant="ghost" className="w-full h-11 rounded-xl">
                  <Link href="/login" className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                  </Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
