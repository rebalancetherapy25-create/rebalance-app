'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User } from 'lucide-react';
import { formatSlotTime } from '@/lib/date';

type Booking = {
  _id: string;
  date: string;
  time: string;
  sessionType: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  userId?: { name?: string; email?: string };
  guestContact?: { name: string; email: string };
};

// Use local dates (not UTC) so the UI range matches the therapist's calendar day.
const isoToday = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
const addDaysIso = (iso: string, days: number) => {
  const [y, m, day] = iso.split('-').map((n) => Number(n));
  const d = new Date(y, (m || 1) - 1, day || 1);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function BookingsPage() {
  const router = useRouter();
  const from = useMemo(() => isoToday(), []);
  const to = useMemo(() => addDaysIso(from, 60), [from]);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorDetail, setErrorDetail] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    setErrorDetail('');
    try {
      await api.get('/therapist-auth/me');
      const res = await api.get(`/therapist/bookings?from=${from}&to=${to}`);
      setBookings(res.data || []);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (status === 401 || status === 403) {
        router.push('/login?reason=unauthorized');
        return;
      }
      setError('Failed to load bookings.');
      setErrorDetail(message ? `Server: ${message}` : (status ? `HTTP ${status}` : 'Network/CORS error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusPill = (status: Booking['status']) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
      confirmed: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
      completed: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      cancelled: 'bg-red-500/10 text-red-700 border-red-500/20',
    };
    return map[status] || 'bg-muted text-muted-foreground border-border';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Manage your upcoming sessions, meeting links, and reschedules.</p>
        </div>
        <Button onClick={refresh} variant="outline" className="rounded-xl">Refresh</Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 text-destructive px-4 py-3 text-sm">
          <div className="font-semibold">{error}</div>
          {errorDetail && <div className="mt-1 text-xs opacity-90">{errorDetail}</div>}
        </div>
      )}

      <Card className="border-none shadow-card rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="font-heading">Next 60 days</CardTitle>
          <CardDescription>{from} to {to}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : bookings.length === 0 ? (
            <div className="text-sm text-muted-foreground">No bookings in this range.</div>
          ) : (
            bookings.map((b) => {
              const name = b.userId?.name || b.guestContact?.name || 'Client';
              const email = b.userId?.email || b.guestContact?.email || '';
              return (
                <Link key={b._id} href={`/bookings/${b._id}`} className="block">
                  <div className="rounded-xl border bg-white hover:bg-accent/10 transition-colors px-4 py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{name}</span>
                        {email && <span className="text-xs text-muted-foreground truncate">({email})</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(`${b.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatSlotTime(b.time)} · {b.sessionType}</span>
                      </div>
                    </div>
                    <div className={`shrink-0 text-xs font-bold uppercase border px-2.5 py-1 rounded-full ${statusPill(b.status)}`}>
                      {b.status}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
