'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatSlotTime } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    CalendarDays, Clock, Lock, CheckCircle2,
    LayoutTemplate, Save, Copy, Sunrise, Sun, Sunset, X,
} from 'lucide-react';

// ── Time presets: 6:00 AM – 9:00 PM, every 30 min ────────────────────────
const ALL_PRESETS: string[] = [];
for (let h = 6; h <= 21; h++) {
    ALL_PRESETS.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 21) ALL_PRESETS.push(`${String(h).padStart(2, '0')}:30`);
}
const MORNING   = ALL_PRESETS.filter(s => Number(s.slice(0, 2)) < 12);
const AFTERNOON = ALL_PRESETS.filter(s => { const h = Number(s.slice(0, 2)); return h >= 12 && h < 17; });
const EVENING   = ALL_PRESETS.filter(s => Number(s.slice(0, 2)) >= 17);

// ── Week days ──────────────────────────────────────────────────────────────
const DAYS = [
    { label: 'Monday',    short: 'Mon', dayOfWeek: 1 },
    { label: 'Tuesday',   short: 'Tue', dayOfWeek: 2 },
    { label: 'Wednesday', short: 'Wed', dayOfWeek: 3 },
    { label: 'Thursday',  short: 'Thu', dayOfWeek: 4 },
    { label: 'Friday',    short: 'Fri', dayOfWeek: 5 },
    { label: 'Saturday',  short: 'Sat', dayOfWeek: 6 },
    { label: 'Sunday',    short: 'Sun', dayOfWeek: 0 },
];
const WEEKDAY_INDICES = [1, 2, 3, 4, 5];

// ── Types ──────────────────────────────────────────────────────────────────
type WeeklyDay = { dayOfWeek: number; slots: string[] };
type Slot      = { time: string; isBooked?: boolean; reservedUntil?: string };
type DayAvail  = { date: string; slots: Slot[]; source: 'record' | 'template' };

// ── Helpers ────────────────────────────────────────────────────────────────
const isoToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const addDays = (iso: string, n: number) => {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    dt.setDate(dt.getDate() + n);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};
const isHeld = (slot: Slot) => {
    if (!slot.reservedUntil) return false;
    const dt = new Date(slot.reservedUntil);
    return !Number.isNaN(dt.getTime()) && dt.getTime() > Date.now();
};
const friendlyDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

// ── Slot chip ──────────────────────────────────────────────────────────────
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
                    ? 'bg-primary/10 border-primary/20 text-primary cursor-not-allowed'
                    : selected
                    ? 'bg-primary border-primary text-white shadow-sm scale-[1.02]'
                    : 'bg-background border-border text-foreground hover:border-primary/40 hover:bg-primary/5',
            ].join(' ')}
        >
            {booked && <Lock className="w-2.5 h-2.5 shrink-0" />}
            {formatSlotTime(time)}
            {held && !booked && <span className="text-[9px] opacity-50 ml-0.5">held</span>}
        </button>
    );
}

// ── Slot period group ──────────────────────────────────────────────────────
function PeriodGroup({
    label, icon, slots, selected, booked, held, onToggle,
}: {
    label: string; icon: React.ReactNode; slots: string[];
    selected: Set<string>; booked: Set<string>; held: Set<string>;
    onToggle: (t: string) => void;
}) {
    if (slots.length === 0) return null;
    return (
        <div>
            <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {icon} {label}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {slots.map(t => (
                    <SlotChip
                        key={t} time={t}
                        selected={selected.has(t)}
                        booked={booked.has(t)}
                        held={held.has(t)}
                        onToggle={() => onToggle(t)}
                    />
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1: Weekly Template
// ─────────────────────────────────────────────────────────────────────────────
function WeeklyTemplateTab({ onSaved }: { onSaved: () => void }) {
    const [weekly, setWeekly] = useState<WeeklyDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [savedOk, setSavedOk] = useState(false);

    const slotsFor = (dow: number) => weekly.find(d => d.dayOfWeek === dow)?.slots ?? [];

    const toggleSlot = (dow: number, time: string) => {
        setSavedOk(false);
        setWeekly(prev => {
            const entry = prev.find(d => d.dayOfWeek === dow);
            if (entry) {
                const slots = entry.slots.includes(time)
                    ? entry.slots.filter(t => t !== time)
                    : [...entry.slots, time].sort();
                return prev.map(d => d.dayOfWeek === dow ? { ...d, slots } : d);
            }
            return [...prev, { dayOfWeek: dow, slots: [time] }];
        });
    };

    const clearDay = (dow: number) => {
        setSavedOk(false);
        setWeekly(prev => prev.map(d => d.dayOfWeek === dow ? { ...d, slots: [] } : d));
    };

    const applyMonToWeekdays = () => {
        const monSlots = slotsFor(1);
        setSavedOk(false);
        setWeekly(prev => prev.map(d =>
            WEEKDAY_INDICES.includes(d.dayOfWeek) ? { ...d, slots: [...monSlots] } : d
        ));
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await api.get('/therapist/weekly-schedule');
                const data: WeeklyDay[] = Array.isArray(res.data) ? res.data : [];
                const byDay = new Map(data.map(d => [d.dayOfWeek, d]));
                setWeekly(DAYS.map(({ dayOfWeek }) => byDay.get(dayOfWeek) ?? { dayOfWeek, slots: [] }));
            } catch {
                setError('Failed to load schedule.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const save = async () => {
        setSaving(true);
        setError('');
        setSavedOk(false);
        try {
            await api.put('/therapist/weekly-schedule', { weeklyAvailability: weekly });
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                Loading your weekly schedule…
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <p className="text-sm text-muted-foreground max-w-lg">
                    Set your recurring weekly hours. New calendar dates automatically inherit this schedule.
                </p>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline" size="sm"
                        onClick={applyMonToWeekdays}
                        className="rounded-xl text-xs h-9 gap-1.5"
                    >
                        <Copy className="w-3.5 h-3.5" /> Mon → Weekdays
                    </Button>
                    <Button
                        onClick={save} disabled={saving}
                        className={`rounded-xl h-9 gap-2 ${savedOk ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : savedOk ? 'Saved!' : 'Save Schedule'}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 text-destructive px-4 py-3 text-sm">{error}</div>
            )}

            {/* 7-day grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
                {DAYS.map(({ label, short, dayOfWeek }) => {
                    const slots = new Set(slotsFor(dayOfWeek));
                    const count = slots.size;
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    return (
                        <Card
                            key={dayOfWeek}
                            className={`rounded-2xl border shadow-sm ${isWeekend ? 'border-accent/40 bg-accent/5' : 'border-border bg-background'}`}
                        >
                            <CardHeader className="px-4 pt-4 pb-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="font-heading text-sm leading-tight">{label}</CardTitle>
                                        <div className={`mt-1 text-[11px] font-bold px-1.5 py-0.5 rounded-md inline-block ${count > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            {count === 0 ? 'Off' : `${count} slot${count !== 1 ? 's' : ''}`}
                                        </div>
                                    </div>
                                    {count > 0 && (
                                        <button
                                            onClick={() => clearDay(dayOfWeek)}
                                            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/5"
                                            title="Clear all slots"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 space-y-3">
                                <PeriodGroup
                                    label="Morning" icon={<Sunrise className="w-3 h-3" />}
                                    slots={MORNING} selected={slots}
                                    booked={new Set()} held={new Set()}
                                    onToggle={t => toggleSlot(dayOfWeek, t)}
                                />
                                <PeriodGroup
                                    label="Afternoon" icon={<Sun className="w-3 h-3" />}
                                    slots={AFTERNOON} selected={slots}
                                    booked={new Set()} held={new Set()}
                                    onToggle={t => toggleSlot(dayOfWeek, t)}
                                />
                                <PeriodGroup
                                    label="Evening" icon={<Sunset className="w-3 h-3" />}
                                    slots={EVENING} selected={slots}
                                    booked={new Set()} held={new Set()}
                                    onToggle={t => toggleSlot(dayOfWeek, t)}
                                />
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2: Calendar (next 30 days)
// ─────────────────────────────────────────────────────────────────────────────
function CalendarTab({ refreshKey }: { refreshKey: number }) {
    const router = useRouter();
    const from = useMemo(() => isoToday(), []);
    const to   = useMemo(() => addDays(from, 29), [from]);

    const [days, setDays] = useState<DayAvail[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(from);
    const [editingSlots, setEditingSlots] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const selected = useMemo(() => days.find(d => d.date === selectedDate) ?? null, [days, selectedDate]);
    const bookedTimes = useMemo(() => new Set((selected?.slots ?? []).filter(s => s.isBooked).map(s => s.time)), [selected]);
    const heldTimes   = useMemo(() => new Set((selected?.slots ?? []).filter(s => isHeld(s) && !s.isBooked).map(s => s.time)), [selected]);
    const selectedSet = useMemo(() => new Set(editingSlots), [editingSlots]);
    const customSlots = useMemo(() => editingSlots.filter(t => !ALL_PRESETS.includes(t)), [editingSlots]);

    const refresh = async () => {
        setLoading(true);
        setError('');
        try {
            await api.get('/therapist-auth/me');
            const res = await api.get(`/therapist/availability?from=${from}&to=${to}`);
            setDays(res.data || []);
        } catch (e: unknown) {
            const status = (e as { response?: { status?: number } })?.response?.status;
            if (status === 401 || status === 403) { router.push('/login?reason=unauthorized'); return; }
            setError('Failed to load calendar.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refresh(); }, [refreshKey]);  // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setEditingSlots((selected?.slots ?? []).map(s => s.time).sort());
    }, [selected?.date]);

    const toggleSlot = (time: string) => {
        if (bookedTimes.has(time)) return;
        setEditingSlots(prev =>
            prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time].sort()
        );
    };

    const save = async () => {
        setSaving(true);
        setError('');
        try {
            await api.put(`/therapist/availability/${selectedDate}`, { slots: editingSlots });
            await refresh();
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
            setError(msg || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Date list ── */}
            <Card className="lg:col-span-1 border-none shadow-card rounded-2xl">
                <CardHeader>
                    <CardTitle className="font-heading text-base">Next 30 Days</CardTitle>
                    <CardDescription>{friendlyDate(from)} – {friendlyDate(to)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1.5 max-h-[68vh] overflow-y-auto pr-1">
                    {loading ? (
                        <div className="text-sm text-muted-foreground py-4 text-center">Loading…</div>
                    ) : days.map(d => {
                        const active      = d.date === selectedDate;
                        const bookedCount = d.slots.filter(s => s.isBooked).length;
                        const totalCount  = d.slots.length;
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
                                    <span className="font-semibold text-sm">{friendlyDate(d.date)}</span>
                                    <div className="flex items-center gap-1.5">
                                        {d.source === 'template' && (
                                            <span className="text-[9px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Default</span>
                                        )}
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${totalCount > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            {totalCount}
                                        </span>
                                    </div>
                                </div>
                                {bookedCount > 0 && (
                                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-primary" /> {bookedCount} booked
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </CardContent>
            </Card>

            {/* ── Slot editor ── */}
            <Card className="lg:col-span-2 border-none shadow-card rounded-2xl">
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle className="font-heading text-base">
                                {selected ? friendlyDate(selectedDate) : 'Select a date'}
                            </CardTitle>
                            <CardDescription>
                                {selected
                                    ? selected.source === 'template'
                                        ? 'Showing weekly template — changes apply to this date only'
                                        : 'Custom slots for this date — click to toggle'
                                    : 'Pick a date from the left to edit its time slots'}
                            </CardDescription>
                        </div>
                        {selected && (
                            <Button onClick={save} disabled={saving} className="rounded-xl gap-2 shrink-0">
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving…' : 'Save'}
                            </Button>
                        )}
                    </div>
                </CardHeader>

                {error && (
                    <div className="mx-6 mb-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive px-4 py-3 text-sm">{error}</div>
                )}

                {selected && (
                    <CardContent className="space-y-5">
                        <PeriodGroup
                            label="Morning" icon={<Sunrise className="w-3 h-3" />}
                            slots={MORNING} selected={selectedSet}
                            booked={bookedTimes} held={heldTimes}
                            onToggle={toggleSlot}
                        />
                        <PeriodGroup
                            label="Afternoon" icon={<Sun className="w-3 h-3" />}
                            slots={AFTERNOON} selected={selectedSet}
                            booked={bookedTimes} held={heldTimes}
                            onToggle={toggleSlot}
                        />
                        <PeriodGroup
                            label="Evening" icon={<Sunset className="w-3 h-3" />}
                            slots={EVENING} selected={selectedSet}
                            booked={bookedTimes} held={heldTimes}
                            onToggle={toggleSlot}
                        />
                        {customSlots.length > 0 && (
                            <div>
                                <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    <Clock className="w-3 h-3" /> Custom
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {customSlots.map(t => (
                                        <SlotChip
                                            key={t} time={t} selected
                                            booked={bookedTimes.has(t)}
                                            held={heldTimes.has(t)}
                                            onToggle={() => toggleSlot(t)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {editingSlots.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No slots selected — tap any time above to add it.
                            </p>
                        )}

                        <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                {editingSlots.length} slot{editingSlots.length !== 1 ? 's' : ''} selected
                                {bookedTimes.size > 0 && ` · ${bookedTimes.size} booked (locked)`}
                            </span>
                            <button
                                onClick={() => setEditingSlots(prev => prev.filter(t => bookedTimes.has(t)))}
                                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                            >
                                Clear all
                            </button>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AvailabilityPage() {
    const [tab, setTab] = useState<'weekly' | 'calendar'>('weekly');
    const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-heading font-extrabold tracking-tight flex items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-primary" /> Availability
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Set your weekly schedule, then fine-tune individual dates on your calendar.
                </p>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit border border-border/40">
                <button
                    onClick={() => setTab('weekly')}
                    className={[
                        'px-5 py-2 rounded-[0.6rem] text-sm font-semibold flex items-center gap-2 transition-all',
                        tab === 'weekly'
                            ? 'bg-white shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                    ].join(' ')}
                >
                    <LayoutTemplate className="w-4 h-4" /> Weekly Template
                </button>
                <button
                    onClick={() => setTab('calendar')}
                    className={[
                        'px-5 py-2 rounded-[0.6rem] text-sm font-semibold flex items-center gap-2 transition-all',
                        tab === 'calendar'
                            ? 'bg-white shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                    ].join(' ')}
                >
                    <CalendarDays className="w-4 h-4" /> Calendar
                </button>
            </div>

            {tab === 'weekly' && (
                <WeeklyTemplateTab onSaved={() => setCalendarRefreshKey(k => k + 1)} />
            )}
            {tab === 'calendar' && (
                <CalendarTab refreshKey={calendarRefreshKey} />
            )}
        </div>
    );
}
