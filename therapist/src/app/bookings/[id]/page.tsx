'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatSlotTime } from '@/lib/date';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, Clock, Link2, User, MessageCircle, FileText } from 'lucide-react';

type Booking = {
  _id: string;
  date: string;
  time: string;
  sessionType: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  userId?: { name?: string; email?: string };
  guestContact?: { name: string; email: string };
  bookingReason?: string;
  notes?: string;
};

// Use local dates (not UTC) so defaults match the therapist's calendar day.
const isoToday = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const client = useMemo(() => {
    const name = booking?.userId?.name || booking?.guestContact?.name || 'Client';
    const email = booking?.userId?.email || booking?.guestContact?.email || '';
    return { name, email };
  }, [booking]);

  const refresh = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      await api.get('/therapist-auth/me');
      const res = await api.get(`/therapist/bookings/${id}`);
      setBooking(res.data);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        router.push('/login?reason=unauthorized');
        return;
      }
      const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message || 'Failed to load booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  if (!booking) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-destructive">{error || 'Booking not found.'}</div>
        <Button onClick={() => router.push('/bookings')} variant="outline" className="rounded-xl">Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link href="/bookings" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to bookings
          </Link>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight">Booking</h1>
          <p className="text-muted-foreground">View details for this session.</p>
        </div>
        <Button onClick={refresh} variant="outline" className="rounded-xl">Refresh</Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-card rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="font-heading">Details</CardTitle>
            <CardDescription>ID: {booking._id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-white px-4 py-3">
              <div className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                {client.name} {client.email && <span className="text-xs text-muted-foreground">({client.email})</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(`${booking.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatSlotTime(booking.time)} · {booking.sessionType}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Status: <span className="font-semibold text-foreground">{booking.status}</span></div>
            </div>

            {booking.meetingLink && (
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-muted-foreground" /> Meeting link
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm bg-accent/5 px-3 py-2 rounded-xl flex-1 border border-border/50 text-muted-foreground truncate">{booking.meetingLink}</span>
                  <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline bg-primary/10 px-4 py-2 rounded-xl">
                    Join
                  </a>
                </div>
              </div>
            )}

            {(booking.bookingReason || booking.notes) && (
              <div className="space-y-4 border-t pt-4 mt-4">
                {booking.bookingReason && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-muted-foreground" /> Booking Reason
                    </label>
                    <p className="text-sm bg-accent/5 px-4 py-3 rounded-xl border border-border/50 text-foreground whitespace-pre-wrap">
                      {booking.bookingReason}
                    </p>
                  </div>
                )}
                {booking.notes && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" /> Notes
                    </label>
                    <p className="text-sm bg-accent/5 px-4 py-3 rounded-xl border border-border/50 text-foreground whitespace-pre-wrap">
                      {booking.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
