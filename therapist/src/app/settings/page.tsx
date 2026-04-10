'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toaster';
import { getApiErrorMessage, getErrorMessages } from '@/lib/form-validation';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [me, setMe] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<{ currentPassword?: string; newPassword?: string }>({});

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/therapist-auth/me');
      setMe(res.data);
    } catch {
      router.push('/login?reason=unauthorized');
      return;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { currentPassword?: string; newPassword?: string } = {};

    if (!currentPassword.trim()) {
      nextErrors.currentPassword = 'Current password is required.';
    }

    if (!newPassword.trim()) {
      nextErrors.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = 'New password must be at least 8 characters long.';
    } else if (newPassword === currentPassword) {
      nextErrors.newPassword = 'New password must be different from the current password.';
    }

    if (getErrorMessages(nextErrors).length) {
      setPasswordErrors(nextErrors);
      toast({
        variant: 'error',
        title: 'Please fix these password errors',
        items: getErrorMessages(nextErrors),
      });
      return;
    }

    setUpdatingPassword(true);
    setPasswordMessage('');
    setPasswordErrors({});
    setError('');
    try {
      const res = await api.put('/therapist-auth/password', { currentPassword, newPassword });
      setPasswordMessage(res.data?.message || 'Password updated. Please sign in again.');
      setCurrentPassword('');
      setNewPassword('');
      toast({
        title: 'Password updated',
        description: res.data?.message || 'Your password was updated successfully.',
      });
    } catch (e: unknown) {
      const message = getApiErrorMessage(e, 'Failed to update password.');
      setError(message || 'Failed to update password.');
      toast({
        variant: 'error',
        title: 'Unable to update password',
        items: [message],
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Account status and linked therapist profile.</p>
        </div>
        <Button onClick={refresh} variant="outline" className="rounded-xl">Refresh</Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <Card className="border-none shadow-card rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="font-heading">Account</CardTitle>
          <CardDescription>Managed by admin (email/status/password reset).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {loading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : (
            <>
              <div><span className="text-muted-foreground">Email:</span> <span className="font-semibold">{me?.account?.email || '—'}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span className="font-semibold">{me?.account?.status || '—'}</span></div>
              <div className="pt-2"><span className="text-muted-foreground">Therapist:</span> <span className="font-semibold">{me?.therapist?.name || '—'}</span></div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-card rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="font-heading">Change Password</CardTitle>
          <CardDescription>Update your therapist portal password. You’ll be signed out after changing it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordMessage && (
            <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm text-muted-foreground">
              {passwordMessage}
            </div>
          )}
          <form onSubmit={updatePassword} noValidate className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Current password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (passwordErrors.currentPassword) {
                    setPasswordErrors((current) => ({ ...current, currentPassword: undefined }));
                  }
                }}
                aria-invalid={Boolean(passwordErrors.currentPassword)}
                className={cn('h-11 rounded-xl bg-white', passwordErrors.currentPassword && 'border-red-300 focus-visible:ring-red-400')}
              />
              <FieldError message={passwordErrors.currentPassword} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">New password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordErrors.newPassword) {
                    setPasswordErrors((current) => ({ ...current, newPassword: undefined }));
                  }
                }}
                aria-invalid={Boolean(passwordErrors.newPassword)}
                className={cn('h-11 rounded-xl bg-white', passwordErrors.newPassword && 'border-red-300 focus-visible:ring-red-400')}
              />
              <FieldError message={passwordErrors.newPassword} />
            </div>
            <Button type="submit" disabled={updatingPassword} className="rounded-xl">
              {updatingPassword ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
