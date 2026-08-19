'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
import { getApiErrorMessage } from '@/lib/form-validation';
import { toastApiError } from '@/lib/toast';
import { cn } from '@/lib/utils';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Reset token is missing from the URL. Please use the link from your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    setError(undefined);
    try {
      await api.post('/therapist-auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Failed to reset password. The link might be expired.');
      toastApiError(toast, message, 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token && !success) {
    return (
      <CardContent className="text-center pb-8 pt-4">
        <div className="p-4 rounded-xl bg-red-50 text-red-800 border border-red-200 mb-6">
          Reset token is missing. Please make sure you copied the full link from your email.
        </div>
        <Button asChild variant="outline" className="rounded-xl w-full">
          <Link href="/forgot-password">Request New Link</Link>
        </Button>
      </CardContent>
    );
  }

  return (
    <CardContent>
      {success ? (
        <div className="space-y-6 text-center pt-2 pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Password Reset</h3>
            <p className="text-muted-foreground">
              Your password has been changed successfully. You can now sign in with your new password.
            </p>
          </div>
          <Button asChild className="w-full h-11 rounded-xl font-semibold mt-4">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold">New Password</label>
            <Input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(undefined);
              }}
              type="password"
              aria-invalid={Boolean(error)}
              className={cn('h-11 rounded-xl bg-white', error && 'border-red-300 focus-visible:ring-red-400')}
              placeholder="At least 8 characters"
            />
            <FieldError message={error} />
          </div>
          
          <div className="pt-2">
            <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl font-semibold">
              {submitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      )}
    </CardContent>
  );
}

export default function TherapistResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-accent/10 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-primary/5 blur-3xl -z-10 pointer-events-none" />

      <Card className="w-full max-w-md border-none shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-3xl font-heading font-extrabold">Set New Password</CardTitle>
          <CardDescription className="text-base">Enter your new password below to secure your account.</CardDescription>
        </CardHeader>
        <Suspense fallback={
          <CardContent className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          </CardContent>
        }>
          <ResetPasswordContent />
        </Suspense>
      </Card>
    </div>
  );
}
