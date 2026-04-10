'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CalendarDays, ChevronLeft, Clock, Lock, Plus, RefreshCcw, Save, Wand2 } from 'lucide-react';
import api from '@/lib/axios';

type Slot = { time: string; isBooked?: boolean; reservedUntil?: string };
type DayAvailability = { date: string; slots: Slot[]; source: 'record' | 'template' };

// Use local dates (not UTC) so the admin's calendar window matches local day boundaries.
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

export default function AdminTherapistAvailabilityPage() {
  const params = useParams<{ therapistId: string }>();
  const therapistId = params?.therapistId;

  const from = useMemo(() => isoToday(), []);
  const to = useMemo(() => addDaysIso(from, 29), [from]);

  const [therapist, setTherapist] = useState<any>(null);
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(from);
  const [editingSlots, setEditingSlots] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selected = useMemo(() => days.find((d) => d.date === selectedDate) || null, [days, selectedDate]);

  const refresh = async () => {
    if (!therapistId) return;
    setLoading(true);
    setError('');
    try {
      const [tRes, aRes] = await Promise.all([
        api.get(`/admin/therapists/${therapistId}`),
        api.get(`/admin/availability/${therapistId}?from=${from}&to=${to}`),
      ]);
      setTherapist(tRes.data);
      setDays(aRes.data || []);
    } catch (e: unknown) {
      console.error('Failed to load availability', e);
      setError('Failed to load availability.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapistId]);

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
    if (!therapistId || !selectedDate) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/availability/${therapistId}/${selectedDate}`, { slots: editingSlots });
      await refresh();
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message || 'Failed to save availability.');
    } finally {
      setSaving(false);
    }
  };

  const generate = async (overwrite: boolean) => {
    if (!therapistId) return;
    setSaving(true);
    setError('');
    try {
      await api.post(`/admin/availability/${therapistId}/generate`, { from, to, overwrite });
      await refresh();
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message || 'Failed to generate availability.');
    } finally {
      setSaving(false);
    }
  };

  const releaseHolds = async (force: boolean) => {
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/availability/release-holds', { force });
      await refresh();
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message || 'Failed to release holds.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-800 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Link href="/availability" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-400" /> {therapist?.name || 'Therapist'} Availability
            </h1>
            <p className="text-neutral-500 text-sm">Edit date-level slots. Booked slots cannot be removed.</p>
          </div>
          <button
            onClick={refresh}
            className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => generate(false)}
            disabled={saving}
            className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/15 transition-colors inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Wand2 className="w-4 h-4" /> Generate (missing only)
          </button>
          <button
            onClick={() => generate(true)}
            disabled={saving}
            className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/15 transition-colors inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Wand2 className="w-4 h-4" /> Generate (overwrite)
          </button>
          <button
            onClick={() => releaseHolds(false)}
            disabled={saving}
            className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Lock className="w-4 h-4" /> Release expired holds
          </button>
          <button
            onClick={() => releaseHolds(true)}
            disabled={saving}
            className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/15 transition-colors inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Lock className="w-4 h-4" /> Force release all holds
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-neutral-800">
            <div className="text-white font-semibold">Dates</div>
            <div className="text-xs text-neutral-500 mt-1">{from} to {to}</div>
          </div>
          <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="text-neutral-500 text-sm">Loading…</div>
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
                      active ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-neutral-800 bg-neutral-950/40 hover:bg-neutral-950/70',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-white">{d.date}</div>
                      <div className="text-[10px] text-neutral-500 uppercase">{d.source}</div>
                    </div>
                    <div className="mt-1 text-xs text-neutral-500 flex items-center gap-3">
                      <span>{bookedCount} booked</span>
                      <span>{heldCount} held</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <div className="text-white font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-500" /> Edit {selectedDate}
              </div>
              <div className="text-xs text-neutral-500 mt-1">Add/remove slots. Booked slots are locked.</div>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-sm font-medium transition-colors inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs text-neutral-400 mb-1">Add slot (e.g. 10:00 AM or 14:30)</label>
                <input
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none placeholder:text-neutral-600"
                  placeholder="10:00 AM"
                />
              </div>
              <button
                onClick={addSlot}
                className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {editingSlots.length === 0 ? (
                <div className="text-neutral-500 text-sm col-span-full">No slots set for this date.</div>
              ) : (
                editingSlots.map((time) => {
                  const slot = selected?.slots.find((s) => s.time === time);
                  const booked = Boolean(slot?.isBooked);
                  const held = slot ? isHeld(slot) : false;
                  return (
                    <button
                      key={time}
                      onClick={() => !booked && toggleSlot(time)}
                      className={[
                        'px-3 py-2 rounded-xl border text-sm font-medium flex items-center justify-between gap-2 transition-colors',
                        booked ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 cursor-not-allowed' : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-950/70',
                      ].join(' ')}
                      title={booked ? 'Booked' : 'Toggle'}
                    >
                      <span>{time}</span>
                      <span className="text-[10px] text-neutral-500 uppercase">
                        {booked ? 'booked' : held ? 'held' : ''}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
