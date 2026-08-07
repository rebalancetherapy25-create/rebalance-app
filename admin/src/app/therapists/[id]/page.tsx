'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Calendar as CalendarIcon, Clock, Link as LinkIcon,
    User as UserIcon, Star, IndianRupee, CalendarDays, Save,
    Copy, Sunrise, Sun, Sunset, X, Lock,
} from 'lucide-react';
import api from '@/lib/axios';
import { formatSlotTime } from '@/lib/date';

// ── Time presets ──────────────────────────────────────────────────────────
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

interface Therapist {
    _id: string;
    name: string;
    specialties: string[];
    price: number;
    about: string;
    ratingAverage: number;
    profileImage: string;
    weeklyAvailability?: WeeklyDay[];
}

interface Booking {
    _id: string;
    userId: { _id: string; name: string; email: string };
    therapistId: { _id: string; name: string };
    date: string;
    time: string;
    sessionType: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    meetingLink?: string;
    createdAt: string;
}

// ── Slot chip ─────────────────────────────────────────────────────────────
function SlotChip({ time, selected, onToggle }: { time: string; selected: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            className={[
                'h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all duration-100 border whitespace-nowrap',
                selected
                    ? 'bg-emerald-500 border-emerald-500 text-neutral-950 shadow-sm'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-300',
            ].join(' ')}
        >
            {formatSlotTime(time)}
        </button>
    );
}

// ── Period group ──────────────────────────────────────────────────────────
function PeriodGroup({
    label, icon, slots, selected, onToggle,
}: { label: string; icon: React.ReactNode; slots: string[]; selected: Set<string>; onToggle: (t: string) => void }) {
    return (
        <div>
            <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                {icon} {label}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {slots.map(t => (
                    <SlotChip key={t} time={t} selected={selected.has(t)} onToggle={() => onToggle(t)} />
                ))}
            </div>
        </div>
    );
}

// ── Weekly schedule editor ────────────────────────────────────────────────
function WeeklyScheduleEditor({ therapistId, initial }: { therapistId: string; initial: WeeklyDay[] }) {
    const [weekly, setWeekly] = useState<WeeklyDay[]>(() => {
        const byDay = new Map(initial.map(d => [d.dayOfWeek, d]));
        return DAYS.map(({ dayOfWeek }) => byDay.get(dayOfWeek) ?? { dayOfWeek, slots: [] });
    });
    const [saving, setSaving] = useState(false);
    const [savedOk, setSavedOk] = useState(false);
    const [error, setError] = useState('');

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
        setWeekly(prev => prev.map(d =>
            WEEKDAY_INDICES.includes(d.dayOfWeek) ? { ...d, slots: [...monSlots] } : d
        ));
    };

    const copyWeekdayToWeekends = () => {
        const baseSlots = slotsFor(1).length > 0 ? slotsFor(1) : slotsFor(5);
        setSavedOk(false);
        setWeekly(prev => prev.map(d =>
            WEEKEND_INDICES.includes(d.dayOfWeek) ? { ...d, slots: [...baseSlots] } : d
        ));
    };

    const copySatToSun = () => {
        const satSlots = slotsFor(6);
        setSavedOk(false);
        setWeekly(prev => prev.map(d =>
            d.dayOfWeek === 0 ? { ...d, slots: [...satSlots] } : d
        ));
    };

    const save = async () => {
        setSaving(true);
        setError('');
        setSavedOk(false);
        try {
            await api.put(`/admin/therapists/${therapistId}`, { weeklyAvailability: weekly });
            setSavedOk(true);
            setTimeout(() => setSavedOk(false), 3000);
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
            setError(msg || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-emerald-400" /> Weekly & Weekend Schedule
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        Configure independent weekday and weekend hours — new calendar dates inherit these templates.
                    </p>
                </div>
                <button
                    onClick={save}
                    disabled={saving}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-60 shrink-0 ${
                        savedOk
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-lg shadow-emerald-500/10'
                    }`}
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : savedOk ? 'Saved!' : 'Save Schedule'}
                </button>
            </div>

            {error && (
                <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
            )}

            <div className="p-6 space-y-8">
                {/* Weekdays Section */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/50 border border-neutral-800/80 p-4 rounded-2xl">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-white">Weekday Schedule</h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300">Monday – Friday</span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5">Standard recurring slots for Monday through Friday.</p>
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
                                            <button
                                                onClick={() => clearDay(dayOfWeek)}
                                                className="text-neutral-600 hover:text-red-400 transition-colors p-1.5 rounded-lg bg-neutral-900/50 hover:bg-neutral-900"
                                                title="Clear day"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-3 pt-1 border-t border-neutral-900/80">
                                        <PeriodGroup label="Morning"   icon={<Sunrise className="w-3.5 h-3.5 text-amber-400/80" />} slots={MORNING}   selected={slots} onToggle={t => toggleSlot(dayOfWeek, t)} />
                                        <PeriodGroup label="Afternoon" icon={<Sun     className="w-3.5 h-3.5 text-amber-500" />}    slots={AFTERNOON} selected={slots} onToggle={t => toggleSlot(dayOfWeek, t)} />
                                        <PeriodGroup label="Evening"   icon={<Sunset  className="w-3.5 h-3.5 text-purple-400/80" />}  slots={EVENING}   selected={slots} onToggle={t => toggleSlot(dayOfWeek, t)} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Weekend Section */}
                <div className="space-y-4 pt-4 border-t border-neutral-800/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-2xl">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-indigo-200">Weekend Schedule</h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Independent Customization</span>
                            </div>
                            <p className="text-xs text-indigo-300/70 mt-0.5">Customize Saturday and Sunday independently or inherit weekday hours.</p>
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
                                    className="rounded-2xl border border-indigo-500/20 bg-neutral-950/60 p-5 space-y-4 transition-colors hover:border-indigo-500/40"
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
                                            <button
                                                onClick={() => clearDay(dayOfWeek)}
                                                className="text-neutral-500 hover:text-red-400 transition-colors p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-900"
                                                title="Clear Day"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-3 pt-2 border-t border-indigo-500/10">
                                        <PeriodGroup label="Morning"   icon={<Sunrise className="w-3.5 h-3.5 text-amber-400" />} slots={MORNING}   selected={slots} onToggle={t => toggleSlot(dayOfWeek, t)} />
                                        <PeriodGroup label="Afternoon" icon={<Sun     className="w-3.5 h-3.5 text-amber-500" />} slots={AFTERNOON} selected={slots} onToggle={t => toggleSlot(dayOfWeek, t)} />
                                        <PeriodGroup label="Evening"   icon={<Sunset  className="w-3.5 h-3.5 text-purple-400" />} slots={EVENING}   selected={slots} onToggle={t => toggleSlot(dayOfWeek, t)} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function TherapistDetailPage() {
    const params  = useParams();
    const router  = useRouter();
    const { id }  = params as { id: string };

    const [therapist, setTherapist] = useState<Therapist | null>(null);
    const [bookings, setBookings]   = useState<Booking[]>([]);
    const [loading, setLoading]     = useState(true);

    useEffect(() => { if (id) fetchData(); }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tRes, bRes] = await Promise.all([
                api.get(`/admin/therapists/${id}`),
                api.get(`/admin/bookings?therapistId=${id}`),
            ]);
            setTherapist(tRes.data);
            setBookings(bRes.data);
        } catch {
            // handled by empty state
        } finally {
            setLoading(false);
        }
    };

    const statusStyle = (s: Booking['status']) => ({
        confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
        pending:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    }[s] ?? 'bg-amber-500/10 text-amber-400 border-amber-500/20');

    if (loading) return (
        <div className="space-y-6 animate-pulse">
            <div className="h-40 bg-neutral-900 rounded-2xl border border-neutral-800" />
            <div className="h-64 bg-neutral-900 rounded-2xl border border-neutral-800" />
        </div>
    );

    if (!therapist) return (
        <div className="text-center py-12 text-neutral-500">
            Therapist not found.
            <button onClick={() => router.push('/therapists')} className="mt-4 block mx-auto text-emerald-400 hover:underline">
                Back to Therapists
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            <button
                onClick={() => router.push('/therapists')}
                className="flex items-center text-neutral-400 hover:text-white transition-colors text-sm font-medium"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Therapists
            </button>

            {/* ── Profile header ── */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <img
                    src={therapist.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(therapist.name)}&background=10b981&color=fff`}
                    alt={therapist.name}
                    className="w-32 h-32 rounded-3xl object-cover border-2 border-neutral-800 relative z-10 shadow-xl"
                />
                <div className="flex-1 space-y-4 relative z-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{therapist.name}</h1>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className="flex items-center text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                                <Star className="w-4 h-4 fill-amber-500 mr-1" />
                                <span className="font-medium">{therapist.ratingAverage?.toFixed(1) || 'New'} Rating</span>
                            </div>
                            <div className="flex items-center text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                <IndianRupee className="w-4 h-4 mr-0.5" />{therapist.price} / session
                            </div>
                            <Link
                                href={`/availability/${therapist._id}`}
                                className="flex items-center text-neutral-300 bg-neutral-800 px-2.5 py-1 rounded-full border border-neutral-700 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
                            >
                                <CalendarDays className="w-3.5 h-3.5 mr-1.5" /> Manage Calendar
                            </Link>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Specialties</div>
                        <div className="flex flex-wrap gap-2">
                            {therapist.specialties.map((s, i) => (
                                <span key={i} className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-lg text-sm border border-neutral-700">{s}</span>
                            ))}
                        </div>
                    </div>
                    {therapist.about && (
                        <div>
                            <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-1">About</div>
                            <p className="text-neutral-400 text-sm leading-relaxed max-w-3xl">{therapist.about}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Weekly schedule ── */}
            <WeeklyScheduleEditor
                therapistId={id}
                initial={therapist.weeklyAvailability ?? []}
            />

            {/* ── Bookings table ── */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">Assigned Bookings</h2>
                        <p className="text-neutral-400 text-sm mt-1">All sessions scheduled with {therapist.name}</p>
                    </div>
                    <div className="text-sm px-3 py-1.5 bg-neutral-800 rounded-lg text-neutral-300 border border-neutral-700 font-medium flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-neutral-400" />
                        {bookings.length} sessions
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-950/50 text-neutral-400 font-medium border-b border-neutral-800 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Session Info</th>
                                <th className="px-6 py-4">Meeting</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 text-neutral-300">
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                                        No bookings assigned yet.
                                    </td>
                                </tr>
                            ) : bookings.map(b => (
                                <tr key={b._id} className="hover:bg-neutral-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                                                <UserIcon className="w-4 h-4 text-neutral-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{b.userId?.name || 'Unknown'}</div>
                                                <div className="text-xs text-neutral-500">{b.userId?.email || ''}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center text-neutral-300 font-medium">
                                                <CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                                                {b.date}
                                            </div>
                                            <div className="flex items-center text-neutral-400 text-xs">
                                                <Clock className="w-3.5 h-3.5 mr-1.5 text-neutral-500" />
                                                {formatSlotTime(b.time)} · {b.sessionType}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {b.meetingLink ? (
                                            <a href={b.meetingLink} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center text-blue-400 hover:text-blue-300 text-xs font-medium bg-blue-500/10 px-2.5 py-1.5 rounded-lg">
                                                <LinkIcon className="w-3.5 h-3.5 mr-1.5" /> Join Meeting
                                            </a>
                                        ) : (
                                            <span className="text-neutral-600 text-xs italic bg-neutral-800/50 px-2.5 py-1.5 rounded-lg inline-flex items-center">
                                                Not generated
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle(b.status)}`}>
                                            {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
