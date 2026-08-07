'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Sunrise, Sun, Sunset, X, Save } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/toaster';
import { emailPattern, getApiErrorMessage, getErrorMessages } from '@/lib/form-validation';
import { formatSlotTime } from '@/lib/date';

// ── Weekly schedule presets ───────────────────────────────────────────────
const ALL_PRESETS: string[] = [];
for (let h = 6; h <= 21; h++) {
    ALL_PRESETS.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 21) ALL_PRESETS.push(`${String(h).padStart(2, '0')}:30`);
}
const MORNING   = ALL_PRESETS.filter(s => Number(s.slice(0, 2)) < 12);
const AFTERNOON = ALL_PRESETS.filter(s => { const h = Number(s.slice(0, 2)); return h >= 12 && h < 17; });
const EVENING   = ALL_PRESETS.filter(s => Number(s.slice(0, 2)) >= 17);

const WEEK_DAYS_ONLY = [
    { label: 'Monday',    dow: 1 },
    { label: 'Tuesday',   dow: 2 },
    { label: 'Wednesday', dow: 3 },
    { label: 'Thursday',  dow: 4 },
    { label: 'Friday',    dow: 5 },
];
const WEEKEND_DAYS_ONLY = [
    { label: 'Saturday',  dow: 6 },
    { label: 'Sunday',    dow: 0 },
];
const WEEK_DAYS = [...WEEK_DAYS_ONLY, ...WEEKEND_DAYS_ONLY];
const SESSION_TYPES = ['Video', 'Audio', 'Phone', 'In-person', 'Chat'];

type WeeklyDay = { dayOfWeek: number; slots: string[] };
type FAQ = { question: string; answer: string };

function SlotChip({ time, selected, onToggle }: { time: string; selected: boolean; onToggle: () => void }) {
    return (
        <button type="button" onClick={onToggle}
            className={['h-8 px-2.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap',
                selected ? 'bg-emerald-500 border-emerald-500 text-neutral-950' : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-emerald-500/40 hover:text-emerald-300',
            ].join(' ')}>
            {formatSlotTime(time)}
        </button>
    );
}

function PeriodGroup({ label, icon, slots, selected, onToggle }: { label: string; icon: React.ReactNode; slots: string[]; selected: Set<string>; onToggle: (t: string) => void }) {
    return (
        <div>
            <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">{icon} {label}</div>
            <div className="flex flex-wrap gap-1.5">
                {slots.map(t => <SlotChip key={t} time={t} selected={selected.has(t)} onToggle={() => onToggle(t)} />)}
            </div>
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <label className="block text-sm font-medium text-neutral-300 mb-1.5">{children}</label>;
}
function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={`w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500/50 focus:outline-none placeholder:text-neutral-600 ${props.className ?? ''}`} />;
}
function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea {...props} className={`w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500/50 focus:outline-none placeholder:text-neutral-600 resize-none ${props.className ?? ''}`} />;
}
function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-800">
                <h2 className="font-bold text-white">{title}</h2>
                {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

export default function NewTherapistPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);

    // Form state
    const [name, setName]               = useState('');
    const [email, setEmail]             = useState('');
    const [credentials, setCredentials] = useState('');
    const [price, setPrice]             = useState('');
    const [expYears, setExpYears]       = useState('5');
    const [totalSessions, setTotalSessions] = useState('0');
    const [responseRate, setResponseRate]   = useState('100');
    const [about, setAbout]             = useState('');
    const [specialties, setSpecialties] = useState('');
    const [languages, setLanguages]     = useState('');
    const [sessionTypes, setSessionTypes] = useState<string[]>(['Video']);
    const [quote, setQuote]             = useState('');
    const [gender, setGender]           = useState('');
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [portalAccess, setPortalAccess] = useState(true);
    const [faq, setFaq]                 = useState<FAQ[]>([{ question: '', answer: '' }]);
    const [weekly, setWeekly]           = useState<WeeklyDay[]>(
        WEEK_DAYS.map(d => ({ dayOfWeek: d.dow, slots: [] }))
    );

    const parseList = (v: string) => v.split(',').map(s => s.trim()).filter(Boolean);

    const slotsFor = (dow: number) => weekly.find(d => d.dayOfWeek === dow)?.slots ?? [];
    const toggleSlot = (dow: number, time: string) => {
        setWeekly(prev => prev.map(d => {
            if (d.dayOfWeek !== dow) return d;
            const slots = d.slots.includes(time) ? d.slots.filter(t => t !== time) : [...d.slots, time].sort();
            return { ...d, slots };
        }));
    };
    const clearDay = (dow: number) => setWeekly(prev => prev.map(d => d.dayOfWeek === dow ? { ...d, slots: [] } : d));
    const applyMonToWeekdays = () => {
        const mon = slotsFor(1);
        setWeekly(prev => prev.map(d => [1,2,3,4,5].includes(d.dayOfWeek) ? { ...d, slots: [...mon] } : d));
    };
    const copyWeekdayToWeekends = () => {
        const base = slotsFor(1).length > 0 ? slotsFor(1) : slotsFor(5);
        setWeekly(prev => prev.map(d => [6,0].includes(d.dayOfWeek) ? { ...d, slots: [...base] } : d));
    };
    const copySatToSun = () => {
        const sat = slotsFor(6);
        setWeekly(prev => prev.map(d => d.dayOfWeek === 0 ? { ...d, slots: [...sat] } : d));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: string[] = [];
        if (!name.trim())        errors.push('Full name is required.');
        if (!credentials.trim()) errors.push('Credentials are required.');
        if (!about.trim())       errors.push('Bio / About is required.');
        if (Number(price) <= 0)  errors.push('Price must be greater than 0.');
        if (!parseList(specialties).length) errors.push('Add at least one specialty.');
        if (!parseList(languages).length)   errors.push('Add at least one language.');
        if (!sessionTypes.length)           errors.push('Select at least one session type.');
        if (portalAccess && !email.trim())  errors.push('Email is required for portal access.');
        if (email && !emailPattern.test(email)) errors.push('Enter a valid email address.');

        if (errors.length) {
            toast({ variant: 'error', title: 'Fix errors before saving', items: errors });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                email: email.trim().toLowerCase() || undefined,
                credentials: credentials.trim(),
                about: about.trim(),
                price: Number(price),
                experienceYears: Number(expYears),
                totalSessions: Number(totalSessions),
                responseRate: Number(responseRate),
                specialties: parseList(specialties),
                languages: parseList(languages),
                sessionTypes,
                quote: quote.trim(),
                gender: gender.trim(),
                faq: faq.filter(f => f.question.trim() || f.answer.trim()),
                weeklyAvailability: weekly,
                ...(portalAccess && email.trim() ? { portalAccess: { create: true } } : {}),
            };
            const res = await api.post('/admin/therapists', payload);
            
            if (profileImageFile) {
                const formData = new FormData();
                formData.append('image', profileImageFile);
                await api.post(`/admin/therapists/${res.data._id}/image`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            toast({ title: 'Therapist created', description: 'Profile created successfully.' });
            router.push('/therapists');
        } catch (err) {
            toast({ variant: 'error', title: 'Failed to create', items: [getApiErrorMessage(err, 'Something went wrong.')] });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/therapists" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Therapists
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Add New Therapist</h1>
                    <p className="text-neutral-400 text-sm mt-0.5">Fill in the profile details and weekly schedule.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/therapists" className="px-4 py-2.5 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">
                        Cancel
                    </Link>
                    <button onClick={handleSubmit} disabled={saving}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded-xl text-sm inline-flex items-center gap-2 disabled:opacity-60 transition-colors">
                        <Save className="w-4 h-4" /> {saving ? 'Creating…' : 'Create Therapist'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">

                {/* Basic Info */}
                <SectionCard title="Basic Information" description="Core profile details shown to users">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <FieldLabel>Full Name</FieldLabel>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Jane Smith" required />
                        </div>
                        <div>
                            <FieldLabel>Credentials <span className="text-neutral-500">(e.g. PhD, MSc)</span></FieldLabel>
                            <Input value={credentials} onChange={e => setCredentials(e.target.value)} placeholder="PhD, Licensed Therapist" required />
                        </div>
                        <div>
                            <FieldLabel>Price per Session (₹)</FieldLabel>
                            <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="2000" required />
                        </div>
                        <div>
                            <FieldLabel>Experience (Years)</FieldLabel>
                            <Input type="number" value={expYears} onChange={e => setExpYears(e.target.value)} />
                        </div>
                        <div>
                            <FieldLabel>Total Sessions</FieldLabel>
                            <Input type="number" value={totalSessions} onChange={e => setTotalSessions(e.target.value)} />
                        </div>
                        <div>
                            <FieldLabel>Response Rate (%)</FieldLabel>
                            <Input type="number" max="100" value={responseRate} onChange={e => setResponseRate(e.target.value)} />
                        </div>
                        <div>
                            <FieldLabel>Gender</FieldLabel>
                            <select value={gender} onChange={e => setGender(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500/50 focus:outline-none">
                                <option value="">Not Specified</option>
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Non-binary">Non-binary</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <FieldLabel>Therapist Quote / Mantra</FieldLabel>
                            <Input value={quote} onChange={e => setQuote(e.target.value)} placeholder="Guiding you towards emotional balance & mindful living." />
                        </div>
                        <div className="md:col-span-2">
                            <FieldLabel>Profile Image <span className="text-neutral-500">(Optional)</span></FieldLabel>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
                                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20 focus:outline-none"
                            />
                        </div>
                    </div>
                </SectionCard>

                {/* Portal access */}
                <SectionCard title="Portal Access" description="Allow this therapist to log in to the therapist portal">
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={portalAccess} onChange={e => setPortalAccess(e.target.checked)}
                                className="w-4 h-4 rounded border-neutral-700 text-emerald-500 bg-neutral-900 focus:ring-emerald-500/30" />
                            <span className="text-sm text-neutral-300">Send portal access invite email on create</span>
                        </label>
                        <div>
                            <FieldLabel>Email Address {portalAccess && <span className="text-red-400">*</span>}</FieldLabel>
                            <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="therapist@example.com" required={portalAccess} />
                        </div>
                    </div>
                </SectionCard>

                {/* Specialties & About */}
                <SectionCard title="Specialties & Bio">
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <FieldLabel>Specialties <span className="text-neutral-500">(comma-separated)</span></FieldLabel>
                                <Input value={specialties} onChange={e => setSpecialties(e.target.value)} placeholder="Anxiety, Depression, OCD" />
                            </div>
                            <div>
                                <FieldLabel>Languages <span className="text-neutral-500">(comma-separated)</span></FieldLabel>
                                <Input value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, Hindi" />
                            </div>
                        </div>
                        <div>
                            <FieldLabel>Session Types</FieldLabel>
                            <div className="flex flex-wrap gap-3">
                                {SESSION_TYPES.map(t => (
                                    <label key={t} className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                                        <input type="checkbox" checked={sessionTypes.includes(t)}
                                            onChange={e => setSessionTypes(prev => e.target.checked ? [...prev, t] : prev.filter(x => x !== t))}
                                            className="w-4 h-4 rounded border-neutral-700 text-emerald-500 bg-neutral-900 focus:ring-emerald-500/30" />
                                        {t}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <FieldLabel>Bio / About</FieldLabel>
                            <Textarea rows={4} value={about} onChange={e => setAbout(e.target.value)} placeholder="A warm and experienced therapist…" required />
                        </div>
                    </div>
                </SectionCard>

                {/* FAQ */}
                <SectionCard title="FAQ" description="Common questions shown on the therapist profile">
                    <div className="space-y-3">
                        {faq.map((item, i) => (
                            <div key={i} className="flex gap-3 items-start p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                                <div className="flex-1 space-y-2">
                                    <Input placeholder={`Question ${i + 1}`} value={item.question}
                                        onChange={e => setFaq(prev => prev.map((f, idx) => idx === i ? { ...f, question: e.target.value } : f))} />
                                    <Textarea rows={2} placeholder="Answer…" value={item.answer}
                                        onChange={e => setFaq(prev => prev.map((f, idx) => idx === i ? { ...f, answer: e.target.value } : f))} />
                                </div>
                                <button type="button" onClick={() => setFaq(prev => prev.filter((_, idx) => idx !== i))}
                                    className="text-neutral-600 hover:text-red-400 transition-colors mt-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setFaq(prev => [...prev, { question: '', answer: '' }])}
                            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Add FAQ
                        </button>
                    </div>
                </SectionCard>

                {/* Weekly & Weekend Schedule */}
                <SectionCard title="Weekly & Weekend Schedule" description="Configure weekday and weekend recurring availability independently — new calendar dates inherit these slots">
                    <div className="space-y-8 pt-2">
                        {/* Weekdays Section */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/50 border border-neutral-800/80 p-4 rounded-2xl">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-white">Weekday Schedule</h4>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300">Monday – Friday</span>
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-0.5">Standard recurring weekday appointment hours.</p>
                                </div>
                                <button type="button" onClick={applyMonToWeekdays}
                                    className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 transition-all text-xs font-medium shrink-0 inline-flex items-center gap-1.5">
                                    Copy Monday → Weekdays (Tue–Fri)
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                {WEEK_DAYS_ONLY.map(({ label, dow }) => {
                                    const slots = new Set(slotsFor(dow));
                                    const count = slots.size;
                                    return (
                                        <div key={dow} className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3.5 transition-colors hover:border-neutral-700/80">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-bold text-white">{label}</div>
                                                    <div className={`text-[11px] font-bold mt-0.5 ${count > 0 ? 'text-emerald-400' : 'text-neutral-600'}`}>
                                                        {count === 0 ? 'Off' : `${count} slot${count !== 1 ? 's' : ''}`}
                                                    </div>
                                                </div>
                                                {count > 0 && (
                                                    <button type="button" onClick={() => clearDay(dow)} className="text-neutral-600 hover:text-red-400 transition-colors p-1.5 rounded-lg bg-neutral-900/50 hover:bg-neutral-900" title="Clear day">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-3 pt-1 border-t border-neutral-900/80">
                                                <PeriodGroup label="Morning"   icon={<Sunrise className="w-3.5 h-3.5 text-amber-400/80" />} slots={MORNING}   selected={slots} onToggle={t => toggleSlot(dow, t)} />
                                                <PeriodGroup label="Afternoon" icon={<Sun     className="w-3.5 h-3.5 text-amber-500" />}    slots={AFTERNOON} selected={slots} onToggle={t => toggleSlot(dow, t)} />
                                                <PeriodGroup label="Evening"   icon={<Sunset  className="w-3.5 h-3.5 text-purple-400/80" />}  slots={EVENING}   selected={slots} onToggle={t => toggleSlot(dow, t)} />
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
                                        <h4 className="text-sm font-bold text-indigo-200">Weekend Schedule</h4>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Independent Customization</span>
                                    </div>
                                    <p className="text-xs text-indigo-300/70 mt-0.5">Customize Saturday and Sunday independently or inherit weekday hours.</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    <button type="button" onClick={copyWeekdayToWeekends}
                                        className="px-3.5 py-2 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 hover:text-white hover:bg-indigo-900/60 transition-all text-xs font-medium">
                                        Copy Weekday → Weekends
                                    </button>
                                    <button type="button" onClick={copySatToSun}
                                        className="px-3.5 py-2 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 hover:text-white hover:bg-indigo-900/60 transition-all text-xs font-medium">
                                        Copy Sat → Sun
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl gap-4">
                                {WEEKEND_DAYS_ONLY.map(({ label, dow }) => {
                                    const slots = new Set(slotsFor(dow));
                                    const count = slots.size;
                                    return (
                                        <div key={dow} className="rounded-2xl border border-indigo-500/20 bg-neutral-950/60 p-5 space-y-4 transition-colors hover:border-indigo-500/40">
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
                                                    <button type="button" onClick={() => clearDay(dow)} className="text-neutral-500 hover:text-red-400 transition-colors p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-900" title="Clear Day">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-3 pt-2 border-t border-indigo-500/10">
                                                <PeriodGroup label="Morning"   icon={<Sunrise className="w-3.5 h-3.5 text-amber-400" />} slots={MORNING}   selected={slots} onToggle={t => toggleSlot(dow, t)} />
                                                <PeriodGroup label="Afternoon" icon={<Sun     className="w-3.5 h-3.5 text-amber-500" />} slots={AFTERNOON} selected={slots} onToggle={t => toggleSlot(dow, t)} />
                                                <PeriodGroup label="Evening"   icon={<Sunset  className="w-3.5 h-3.5 text-purple-400" />} slots={EVENING}   selected={slots} onToggle={t => toggleSlot(dow, t)} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* Bottom save */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link href="/therapists" className="px-4 py-2.5 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">
                        Cancel
                    </Link>
                    <button type="submit" disabled={saving}
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded-xl text-sm inline-flex items-center gap-2 disabled:opacity-60 transition-colors">
                        <Save className="w-4 h-4" /> {saving ? 'Creating…' : 'Create Therapist'}
                    </button>
                </div>
            </form>
        </div>
    );
}
