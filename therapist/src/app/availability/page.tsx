'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CalendarDays, Clock, Lock, CheckCircle2 } from 'lucide-react';

type Slot = { time: string; isBooked?: boolean; reservedUntil?: string };
type DayAvailability = { date: string; slots: Slot[]; source: 'record' | 'template' };

// Use local dates (not UTC) so the UI doesn't show "yesterday" for users ahead of UTC.
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

const isHeld = (slot: Slot) => {
  if (!slot.reservedUntil) return false;
  const dt = new Date(slot.reservedUntil);
  return !Number.isNaN(dt.getTime()) && dt.getTime() > Date.now();
};

export default function AvailabilityPage() {
  const router = useRouter();
  const from = useMemo(() => isoToday(), []);
  const to = useMemo(() => addDaysIso(from, 29), [from]);

  const [days, setDays] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(from);
  const [editingSlots, setEditingSlots] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errorDetail, setErrorDetail] = useState('');

  const selected = useMemo(() => days.find((d) => d.date === selectedDate) || null, [days, selectedDate]);

  const refresh = async () => {
    setLoading(true);
    setError('');
    setErrorDetail('');
    try {
      // Preflight session so we can show a clean redirect on auth problems.
      await api.get('/therapist-auth/me');
      const res = await api.get(`/therapist/availability?from=${from}&to=${to}`);
      setDays(res.data || []);
      if (!selectedDate) setSelectedDate(from);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number; data?: { error?: string } } })?.response?.status;
      const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (status === 401 || status === 403) {
        router.push('/login?reason=unauthorized');
        return;
      }
      setError('Failed to load availability.');
      setErrorDetail(message ? `Server: ${message}` : (status ? `HTTP ${status}` : 'Network/CORS error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const slots = (selected?.slots || []).map((s) => s.time).sort();
    setEditingSlots(slots);
    setNewSlot('');
  }, [selected?.date]);

  const toggleSlot = (time: string) => {
    setEditingSlots((prev) => prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time].sort());
  };

  const addSlot = () => {
    const t = newSlot.trim();
    if (!t) return;
    setEditingSlots((prev) => Array.from(new Set([...prev, t])).sort());
    setNewSlot('');
  };

  const save = async () => {
    if (!selectedDate) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/therapist/availability/${selectedDate}`, { slots: editingSlots });
      await refresh();
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message || 'Failed to save availability.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" /> Availability
          </h1>
          <p className="text-muted-foreground">Edit your calendar-first availability for the next 30 days.</p>
        </div>
        <Button onClick={refresh} variant="outline" className="rounded-xl">Refresh</Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 text-destructive px-4 py-3 text-sm">
          <div className="font-semibold">{error}</div>
          {errorDetail && <div className="mt-1 text-xs opacity-90">{errorDetail}</div>}
          <div className="mt-3 flex items-center gap-2">
            <Button onClick={refresh} variant="outline" className="rounded-xl">Try again</Button>
            <Button onClick={() => router.push('/login')} variant="ghost" className="rounded-xl">Go to login</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-none shadow-card rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="font-heading">Dates</CardTitle>
            <CardDescription>{from} to {to}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              days.map((d) => {
                const active = d.date === selectedDate;
                const bookedCount = d.slots.filter((s) => s.isBooked).length;
                const heldCount = d.slots.filter((s) => isHeld(s)).length;
                return (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDate(d.date)}
                    className={[
                      'w-full text-left rounded-xl border px-3 py-2.5 transition-colors',
                      active ? 'border-primary bg-primary/5' : 'border-border bg-white hover:bg-accent/10',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{d.date}</div>
                      <div className="text-xs text-muted-foreground">{d.source}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {bookedCount} booked</span>
                      <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> {heldCount} held</span>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-card rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="font-heading">Edit {selectedDate}</CardTitle>
            <CardDescription>Remove or add slots. Booked slots cannot be removed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selected && !loading && (
              <div className="text-sm text-muted-foreground">Select a date to edit.</div>
            )}

            {selected && (
              <>
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-semibold">Add slot (e.g. 10:00 AM or 14:30)</label>
                    <Input value={newSlot} onChange={(e) => setNewSlot(e.target.value)} className="h-11 rounded-xl bg-white" />
                  </div>
                  <Button onClick={addSlot} className="rounded-xl">Add</Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {editingSlots.length === 0 ? (
                    <div className="col-span-full text-sm text-muted-foreground">No slots set for this date.</div>
                  ) : (
                    editingSlots.map((time) => {
                      const slot = selected.slots.find((s) => s.time === time);
                      const booked = Boolean(slot?.isBooked);
                      const held = slot ? isHeld(slot) : false;
                      return (
                        <button
                          key={time}
                          onClick={() => !booked && toggleSlot(time)}
                          className={[
                            'rounded-xl border px-3 py-2 text-sm font-semibold flex items-center justify-between gap-2',
                            booked ? 'bg-primary/10 border-primary/30 text-primary cursor-not-allowed' : 'bg-white border-border hover:bg-accent/10',
                          ].join(' ')}
                          title={booked ? 'Booked' : 'Toggle'}
                        >
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {time}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {booked ? 'Booked' : held ? 'Held' : ''}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button onClick={save} disabled={saving} className="rounded-xl">
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
