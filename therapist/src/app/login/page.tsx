'use client';

import { useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
import { emailPattern, getApiErrorMessage, getErrorMessages } from '@/lib/form-validation';
import { toastApiError, toastValidationErrors } from '@/lib/toast';
import { cn } from '@/lib/utils';

function TherapistLoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const reason = params.get('reason');
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const banner = useMemo(() => {
    if (reason === 'unauthorized') return 'Your session expired. Please sign in again.';
    return '';
  }, [reason]);

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();

    if (getErrorMessages(nextErrors).length) {
      setErrors(nextErrors);
      toastValidationErrors(toast, getErrorMessages(nextErrors), 'Please fix these login errors');
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      await api.post('/therapist-auth/login', { email: email.trim(), password });
      router.push('/availability');
      router.refresh();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Login failed. Please try again.');
      toastApiError(toast, message, 'Unable to sign in');
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
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-3xl font-heading font-extrabold">Therapist Portal</CardTitle>
          <CardDescription className="text-base">Sign in to manage your availability and bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          {banner && (
            <div className="mb-4 rounded-xl border px-3 py-2 text-sm">
              <div className="text-muted-foreground">{banner}</div>
            </div>
          )}
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Email</label>
              <Input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((current) => ({ ...current, email: undefined }));
                  }
                }}
                type="email"
                aria-invalid={Boolean(errors.email)}
                className={cn('h-11 rounded-xl bg-white', errors.email && 'border-red-300 focus-visible:ring-red-400')}
              />
              <FieldError message={errors.email} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Password</label>
              <Input
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors((current) => ({ ...current, password: undefined }));
                  }
                }}
                type="password"
                aria-invalid={Boolean(errors.password)}
                className={cn('h-11 rounded-xl bg-white', errors.password && 'border-red-300 focus-visible:ring-red-400')}
              />
              <FieldError message={errors.password} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl font-semibold">
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TherapistLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    }>
      <TherapistLoginContent />
    </Suspense>
  );
}
