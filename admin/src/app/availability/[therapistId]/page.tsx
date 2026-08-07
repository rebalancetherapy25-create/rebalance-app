'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CalendarDays, ChevronLeft, Clock, Lock, RefreshCcw, Save,
  Wand2, Sunrise, Sun, Sunset, CheckCircle2, X, LayoutTemplate, Copy,
} from 'lucide-react';
import api from '@/lib/axios';
import { formatSlotTime } from '@/lib/date';
import { useToast } from '@/components/ui/toaster';

// ── Time presets: 6:00 AM – 9:00 PM, every 30 min ────────────────────────
const ALL_PRESETS: string[] = [];
for (let h = 6; h <= 21; h++) {
  ALL_PRESETS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 21) ALL_PRESETS.push(`${String(h).padStart(2, '0')}:30`);
}
const MORNING   = ALL_PRESETS.filter(s => Number(s.slice(0, 2)) < 12);
const AFTERNOON = ALL_PRESETS.filter(s => { const h = Number(s.slice(0, 2)); return h >= 12 && h < 17; });
const EVENING   = ALL_PRESETS.filter(s => Number(s.slice(0, 2)) >= 17);

const WEEKDAYS = [
  { label: 'Monday',    short: 'Mon', dayOfWeek: 1 },
  { label: 'Tuesday',   short: 'Tue', dayOfWeek: 2 },
  { label: 'Wednesday', short: 'Wed', dayOfWeek: 3 },
  { label: 'Thursday',  short: 'Thu', dayOfWeek: 4 },
  { label: 'Friday',    short: 'Fri', dayOfWeek: 5 },
];
const WEEKENDS = [
  { label: 'Saturday',  short: 'Sat', dayOfWeek: 6 },
  { label: 'Sunday',    short: 'Sun', dayOfWeek: 0 },
];
const DAYS = [...WEEKDAYS, ...WEEKENDS];
const WEEKDAY_INDICES = [1, 2, 3, 4, 5];
const WEEKEND_INDICES = [6, 0];

type WeeklyDay = { dayOfWeek: number; slots: string[] };
type Slot = { time: string; isBooked?: boolean; reservedUntil?: string };
type DayAvailability = { date: string; slots: Slot[]; source: 'record' | 'template' };

const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const addDaysIso = (iso: string, days: number) => {
  const [y, m, day] = iso.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, day || 1);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const isHeld = (slot: Slot) => {
  if (!slot.reservedUntil) return false;
  const dt = new Date(slot.reservedUntil);
  return !Number.isNaN(dt.getTime()) && dt.getTime() > Date.now();
};
const friendlyDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

// ── Shared slot chip ──────────────────────────────────────────────────────
function SlotChip({
  time, selected, booked, held, onToggle,
}: { time: string; selected: boolean; booked?: boolean; held?: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={booked ? undefined : onToggle}
      disabled={booked}
      className={[
        'h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all duration-100 border whitespace-nowrap',
        booked
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 cursor-not-allowed'
          : selected
          ? 'bg-emerald-500 border-emerald-500 text-neutral-950 shadow-sm'
          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-300',
      ].join(' ')}
    >
      {booked && <Lock className="w-2.5 h-2.5 shrink-0" />}
      {formatSlotTime(time)}
      {held && !booked && <span className="text-[9px] opacity-50 ml-0.5">held</span>}
    </button>
  );
}

// ── Shared period group ───────────────────────────────────────────────────
function PeriodGroup({
  label, icon, slots, selected, booked, held, onToggle,
}: {
  label: string; icon: React.ReactNode; slots: string[];
  selected: Set<string>; booked: Set<string>; held: Set<string>;
  onToggle: (t: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        {icon} {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {slots.map(t => (
          <SlotChip key={t} time={t} selected={selected.has(t)} booked={booked.has(t)} held={held.has(t)} onToggle={() => onToggle(t)} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1 — Weekly Template
// ─────────────────────────────────────────────────────────────────────────────
function WeeklyTemplateTab({ therapistId, onSaved }: { therapistId: string; onSaved: () => void }) {
  const [weekly, setWeekly] = useState<WeeklyDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError]     = useState('');

  const slotsFor = (dow: number) => weekly.find(d => d.dayOfWeek === dow)?.slots ?? [];

  const toggleSlot = (dow: number, time: string) => {
    setSavedOk(false);
    setWeekly(prev => {
      const entry = prev.find(d => d.dayOfWeek === dow);
      if (!entry) return [...prev, { dayOfWeek: dow, slots: [time] }];
      const slots = entry.slots.includes(time)
        ? entry.slots.filter(t => t !== time)
        : [...entry.slots, time].sort();
      return prev.map(d => d.dayOfWeek === dow ? { ...d, slots } : d);
    });
  };

  const clearDay = (dow: number) => {
    setSavedOk(false);
    setWeekly(prev => prev.map(d => d.dayOfWeek === dow ? { ...d, slots: [] } : d));
  };

  const applyMonToWeekdays = () => {
    const monSlots = slotsFor(1);
    setSavedOk(false);
    setWeekly(prev => prev.map(d => WEEKDAY_INDICES.includes(d.dayOfWeek) ? { ...d, slots: [...monSlots] } : d));
  };

  const copyWeekdayToWeekends = () => {
    const baseSlots = slotsFor(1).length > 0 ? slotsFor(1) : slotsFor(5);
    setSavedOk(false);
    setWeekly(prev => prev.map(d => WEEKEND_INDICES.includes(d.dayOfWeek) ? { ...d, slots: [...baseSlots] } : d));
  };

  const copySatToSun = () => {
    const satSlots = slotsFor(6);
    setSavedOk(false);
    setWeekly(prev => prev.map(d => d.dayOfWeek === 0 ? { ...d, slots: [...satSlots] } : d));
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/therapists/${therapistId}`);
        const raw: WeeklyDay[] = Array.isArray(res.data?.weeklyAvailability) ? res.data.weeklyAvailability : [];
        const byDay = new Map(raw.map(d => [d.dayOfWeek, d]));
        setWeekly(DAYS.map(({ dayOfWeek }) => byDay.get(dayOfWeek) ?? { dayOfWeek, slots: [] }));
      } catch {
        setError('Failed to load weekly schedule.');
      } finally {
        setLoading(false);
      }
    })();
  }, [therapistId]);

  const save = async () => {
    setSaving(true); setError(''); setSavedOk(false);
    try {
      await api.put(`/admin/therapists/${therapistId}`, { weeklyAvailability: weekly });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
      onSaved();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to save schedule.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-neutral-500 text-sm py-8 text-center">Loading schedule…</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h2 className="text-lg font-bold text-white">Weekly Availability & Weekend Settings</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Set recurring weekday and weekend hours independently. New calendar dates inherit these slots automatically.
          </p>
        </div>
        <button
          onClick={save} disabled={saving}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-60 shrink-0 ${savedOk ? 'bg-emerald-600 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-lg shadow-emerald-500/10'}`}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : savedOk ? 'Saved!' : 'Save Schedule'}
        </button>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

      {/* Weekdays Section (Mon - Fri) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/50 border border-neutral-800/80 p-4 rounded-2xl">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Weekday Schedule</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300">Monday – Friday</span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">Standard weekday hours for regular client appointments.</p>
          </div>
          <button
            type="button"
            onClick={applyMonToWeekdays}
            className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 transition-all inline-flex items-center gap-2 text-xs font-medium shrink-0"
          >
            <Copy className="w-3.5 h-3.5 text-emerald-400" /> Copy Monday → Weekdays (Tue–Fri)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {WEEKDAYS.map(({ label, dayOfWeek }) => {
            const slots = new Set(slotsFor(dayOfWeek));
            const count = slots.size;
            return (
              <div
                key={dayOfWeek}
                className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3.5 transition-colors hover:border-neutral-700/80"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">{label}</div>
                    <div className={`text-[11px] font-bold mt-0.5 ${count > 0 ? 'text-emerald-400' : 'text-neutral-600'}`}>
                      {count === 0 ? 'Off' : `${count} slot${count !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                  {count > 0 && (
                    <button onClick={() => clearDay(dayOfWeek)} className="text-neutral-600 hover:text-red-400 transition-colors p-1.5 rounded-lg bg-neutral-900/50 hover:bg-neutral-900" title="Clear">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-3 pt-1 border-t border-neutral-900/80">
                  <PeriodGroup label="Morning"   icon={<Sunrise className="w-3.5 h-3.5 text-amber-400/80" />} slots={MORNING}   selected={slots} booked={new Set()} held={new Set()} onToggle={t => toggleSlot(dayOfWeek, t)} />
                  <PeriodGroup label="Afternoon" icon={<Sun     className="w-3.5 h-3.5 text-amber-500" />}    slots={AFTERNOON} selected={slots} booked={new Set()} held={new Set()} onToggle={t => toggleSlot(dayOfWeek, t)} />
                  <PeriodGroup label="Evening"   icon={<Sunset  className="w-3.5 h-3.5 text-purple-400/80" />}  slots={EVENING}   selected={slots} booked={new Set()} held={new Set()} onToggle={t => toggleSlot(dayOfWeek, t)} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekend Section (Saturday & Sunday) */}
      <div className="space-y-4 pt-4 border-t border-neutral-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-2xl">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-indigo-200">Weekend Schedule</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Independent Customization</span>
            </div>
            <p className="text-xs text-indigo-300/70 mt-0.5">Customize Saturday and Sunday slots independently or clone from weekdays.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={copyWeekdayToWeekends}
              className="px-3.5 py-2 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 hover:text-white hover:bg-indigo-900/60 transition-all inline-flex items-center gap-2 text-xs font-medium"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-400" /> Copy Weekday → Weekends
            </button>
            <button
              type="button"
              onClick={copySatToSun}
              className="px-3.5 py-2 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 hover:text-white hover:bg-indigo-900/60 transition-all inline-flex items-center gap-2 text-xs font-medium"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-400" /> Copy Sat → Sun
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl gap-4">
          {WEEKENDS.map(({ label, dayOfWeek }) => {
            const slots = new Set(slotsFor(dayOfWeek));
            const count = slots.size;
            return (
              <div
                key={dayOfWeek}
                className="rounded-2xl border border-indigo-500/20 bg-neutral-900/60 p-5 space-y-4 transition-colors hover:border-indigo-500/40"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      {label}
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20">Weekend</span>
                    </div>
                    <div className={`text-xs font-bold mt-1 ${count > 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {count === 0 ? 'No slots set (Off)' : `${count} available slot${count !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                  {count > 0 && (
                    <button onClick={() => clearDay(dayOfWeek)} className="text-neutral-500 hover:text-red-400 transition-colors p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800" title="Clear Day">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-3 pt-2 border-t border-indigo-500/10">
                  <PeriodGroup label="Morning"   icon={<Sunrise className="w-3.5 h-3.5 text-amber-400" />} slots={MORNING}   selected={slots} booked={new Set()} held={new Set()} onToggle={t => toggleSlot(dayOfWeek, t)} />
                  <PeriodGroup label="Afternoon" icon={<Sun     className="w-3.5 h-3.5 text-amber-500" />} slots={AFTERNOON} selected={slots} booked={new Set()} held={new Set()} onToggle={t => toggleSlot(dayOfWeek, t)} />
                  <PeriodGroup label="Evening"   icon={<Sunset  className="w-3.5 h-3.5 text-purple-400" />} slots={EVENING}   selected={slots} booked={new Set()} held={new Set()} onToggle={t => toggleSlot(dayOfWeek, t)} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2 — Calendar
// ─────────────────────────────────────────────────────────────────────────────
function CalendarTab({ therapistId, refreshKey }: { therapistId: string; refreshKey: number }) {
  const { toast } = useToast();
  const from = useMemo(() => isoToday(), []);
  const to   = useMemo(() => addDaysIso(from, 29), [from]);

  const [therapist, setTherapist]       = useState<any>(null);
  const [days, setDays]                 = useState<DayAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(from);
  const [editingSlots, setEditingSlots] = useState<string[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  // tracks which specific action is in-flight so each button shows its own label
  const [activeAction, setActiveAction] = useState<'generate' | 'overwrite' | 'release' | 'force' | 'save' | null>(null);
  const [error, setError]               = useState('');

  const selected    = useMemo(() => days.find(d => d.date === selectedDate) ?? null, [days, selectedDate]);
  const bookedTimes = useMemo(() => new Set((selected?.slots ?? []).filter(s => s.isBooked).map(s => s.time)), [selected]);
  const heldTimes   = useMemo(() => new Set((selected?.slots ?? []).filter(s => isHeld(s) && !s.isBooked).map(s => s.time)), [selected]);
  const selectedSet = useMemo(() => new Set(editingSlots), [editingSlots]);
  const customSlots = useMemo(() => editingSlots.filter(t => !ALL_PRESETS.includes(t)), [editingSlots]);

  const refresh = async () => {
    if (!therapistId) return;
    setLoading(true); setError('');
    try {
      const [tRes, aRes] = await Promise.all([
        api.get(`/admin/therapists/${therapistId}`),
        api.get(`/admin/availability/${therapistId}?from=${from}&to=${to}`),
      ]);
      setTherapist(tRes.data);
      setDays(aRes.data || []);
    } catch {
      setError('Failed to load availability.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [therapistId, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setEditingSlots((selected?.slots ?? []).map(s => s.time).sort());
  }, [selected?.date]);

  const toggleSlot = (time: string) => {
    if (bookedTimes.has(time)) return;
    setEditingSlots(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time].sort());
  };

  const run = async (
    action: typeof activeAction,
    fn: () => Promise<any>,
    successMsg: string,
  ) => {
    setSaving(true); setActiveAction(action); setError('');
    try {
      const res = await fn();
      await refresh();
      // sendData wraps payload in { data: { ... } }
      const payload = res?.data?.data ?? res?.data ?? {};
      let detail: string | undefined;
      if (payload.created !== undefined) {
        detail = `Created ${payload.created}, updated ${payload.updated}, skipped ${payload.skipped}.`;
      } else if (payload.released !== undefined) {
        detail = payload.released === 0
          ? 'No active holds found.'
          : `${payload.released} document${payload.released !== 1 ? 's' : ''} updated.`;
      }
      toast({ title: successMsg, ...(detail ? { description: detail } : {}) });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      const errText = msg || 'Something went wrong.';
      setError(errText);
      toast({ variant: 'error', title: 'Action failed', items: [errText] });
    } finally {
      setSaving(false); setActiveAction(null);
    }
  };

  const save = () => run('save', async () => {
    if (!therapistId || !selectedDate) return;
    return api.put(`/admin/availability/${therapistId}/${selectedDate}`, { slots: editingSlots });
  }, `Saved ${editingSlots.length} slot${editingSlots.length !== 1 ? 's' : ''} for ${selectedDate}`);

  const generate = (overwrite: boolean) => run(
    overwrite ? 'overwrite' : 'generate',
    () => api.post(`/admin/availability/${therapistId}/generate`, { from, to, overwrite }),
    overwrite ? 'Calendar overwritten from weekly template' : 'Missing dates filled from weekly template',
  );

  const releaseHolds = (force: boolean) => run(
    force ? 'force' : 'release',
    () => api.post('/admin/availability/release-holds', { force }),
    force ? 'All holds force-released' : 'Expired holds released',
  );

  return (
    <div className="space-y-5">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => generate(false)} disabled={saving}
          className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/15 transition-colors inline-flex items-center gap-2 disabled:opacity-60 text-sm">
          <Wand2 className={`w-4 h-4 ${activeAction === 'generate' ? 'animate-spin' : ''}`} />
          {activeAction === 'generate' ? 'Generating…' : 'Generate (missing only)'}
        </button>
        <button onClick={() => generate(true)} disabled={saving}
          className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/15 transition-colors inline-flex items-center gap-2 disabled:opacity-60 text-sm">
          <Wand2 className={`w-4 h-4 ${activeAction === 'overwrite' ? 'animate-spin' : ''}`} />
          {activeAction === 'overwrite' ? 'Overwriting…' : 'Generate (overwrite)'}
        </button>
        <button onClick={() => releaseHolds(false)} disabled={saving}
          className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors inline-flex items-center gap-2 disabled:opacity-60 text-sm">
          <Lock className={`w-4 h-4 ${activeAction === 'release' ? 'animate-pulse' : ''}`} />
          {activeAction === 'release' ? 'Releasing…' : 'Release expired holds'}
        </button>
        <button onClick={() => releaseHolds(true)} disabled={saving}
          className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/15 transition-colors inline-flex items-center gap-2 disabled:opacity-60 text-sm">
          <Lock className={`w-4 h-4 ${activeAction === 'force' ? 'animate-pulse' : ''}`} />
          {activeAction === 'force' ? 'Releasing all…' : 'Force release all holds'}
        </button>
        <button onClick={refresh} disabled={saving}
          className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors inline-flex items-center gap-2 disabled:opacity-60 text-sm ml-auto">
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date list */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-neutral-800">
            <div className="text-white font-semibold">Dates</div>
            <div className="text-xs text-neutral-500 mt-0.5">{from} → {to}</div>
          </div>
          <div className="p-3 space-y-1.5 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="text-neutral-500 text-sm py-4 text-center">Loading…</div>
            ) : days.map(d => {
              const active      = d.date === selectedDate;
              const bookedCount = d.slots.filter(s => s.isBooked).length;
              const heldCount   = d.slots.filter(s => isHeld(s)).length;
              const total       = d.slots.length;
              return (
                <button key={d.date} onClick={() => setSelectedDate(d.date)}
                  className={['w-full text-left rounded-xl border px-3 py-2.5 transition-colors', active ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-neutral-800 bg-neutral-950/40 hover:bg-neutral-950/70'].join(' ')}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-white">{friendlyDate(d.date)}</div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {d.source === 'template' && <span className="text-[9px] font-bold text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded">Default</span>}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${total > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}>{total}</span>
                    </div>
                  </div>
                  {(bookedCount > 0 || heldCount > 0) && (
                    <div className="mt-1 text-xs text-neutral-500 flex items-center gap-3">
                      {bookedCount > 0 && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />{bookedCount} booked</span>}
                      {heldCount > 0  && <span>{heldCount} held</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slot editor */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-neutral-800 flex items-start justify-between gap-4">
            <div>
              <div className="text-white font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-500" />
                {selected ? friendlyDate(selectedDate) : 'Select a date'}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                {selected
                  ? selected.source === 'template' ? 'Using weekly template — changes apply to this date only' : 'Click chips to toggle. Booked slots are locked.'
                  : 'Pick a date on the left to edit its slots.'}
              </div>
            </div>
            {selected && (
              <button onClick={save} disabled={saving}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-sm font-semibold transition-colors inline-flex items-center gap-2 disabled:opacity-60 shrink-0">
                <Save className="w-4 h-4" /> {activeAction === 'save' ? 'Saving…' : 'Save'}
              </button>
            )}
          </div>

          {selected && (
            <div className="p-5 space-y-5">
              <PeriodGroup label="Morning"   icon={<Sunrise className="w-3 h-3" />} slots={MORNING}   selected={selectedSet} booked={bookedTimes} held={heldTimes} onToggle={toggleSlot} />
              <PeriodGroup label="Afternoon" icon={<Sun     className="w-3 h-3" />} slots={AFTERNOON} selected={selectedSet} booked={bookedTimes} held={heldTimes} onToggle={toggleSlot} />
              <PeriodGroup label="Evening"   icon={<Sunset  className="w-3 h-3" />} slots={EVENING}   selected={selectedSet} booked={bookedTimes} held={heldTimes} onToggle={toggleSlot} />

              {customSlots.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    <Clock className="w-3 h-3" /> Custom
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {customSlots.map(t => (
                      <SlotChip key={t} time={t} selected booked={bookedTimes.has(t)} held={heldTimes.has(t)} onToggle={() => toggleSlot(t)} />
                    ))}
                  </div>
                </div>
              )}

              {editingSlots.length === 0 && (
                <p className="text-sm text-neutral-500 text-center py-4">No slots selected — click any time above to add it.</p>
              )}

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  {editingSlots.length} slot{editingSlots.length !== 1 ? 's' : ''} selected
                  {bookedTimes.size > 0 && ` · ${bookedTimes.size} booked (locked)`}
                </span>
                <button
                  onClick={() => setEditingSlots(prev => prev.filter(t => bookedTimes.has(t)))}
                  className="text-xs text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminTherapistAvailabilityPage() {
  const params = useParams<{ therapistId: string }>();
  const therapistId = params?.therapistId ?? '';

  const [therapistName, setTherapistName] = useState('Therapist');
  const [tab, setTab] = useState<'weekly' | 'calendar'>('weekly');
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  useEffect(() => {
    if (!therapistId) return;
    api.get(`/admin/therapists/${therapistId}`)
      .then(r => setTherapistName(r.data?.name || 'Therapist'))
      .catch(() => {});
  }, [therapistId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Link href="/availability" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-400" />
              {therapistName} Availability
            </h1>
            <p className="text-neutral-500 text-sm">Manage weekly schedule and override specific dates.</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-neutral-950 rounded-xl w-fit border border-neutral-800">
          <button
            onClick={() => setTab('weekly')}
            className={['px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all', tab === 'weekly' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'].join(' ')}
          >
            <LayoutTemplate className="w-4 h-4" /> Weekly Template
          </button>
          <button
            onClick={() => setTab('calendar')}
            className={['px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all', tab === 'calendar' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'].join(' ')}
          >
            <CalendarDays className="w-4 h-4" /> Calendar
          </button>
        </div>
      </div>

      {tab === 'weekly' && (
        <WeeklyTemplateTab
          therapistId={therapistId}
          onSaved={() => setCalendarRefreshKey(k => k + 1)}
        />
      )}
      {tab === 'calendar' && (
        <CalendarTab
          therapistId={therapistId}
          refreshKey={calendarRefreshKey}
        />
      )}
    </div>
  );
}
