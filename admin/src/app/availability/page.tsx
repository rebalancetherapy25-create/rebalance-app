'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays, ExternalLink, Search, X, Wand2,
  CheckCircle2, AlertCircle, SlidersHorizontal, IndianRupee,
  RefreshCcw, ChevronRight,
} from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/toaster';

interface WeeklyDay { dayOfWeek: number; slots: string[] }

interface Therapist {
  _id: string;
  name: string;
  specialties: string[];
  price: number;
  profileImage?: string;
  experienceYears?: number;
  weeklyAvailability?: WeeklyDay[];
}

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

const weeklySlotCount = (t: Therapist) =>
  (t.weeklyAvailability ?? []).reduce((sum, d) => sum + d.slots.length, 0);

const hasSchedule = (t: Therapist) => weeklySlotCount(t) > 0;

export default function AvailabilityIndexPage() {
  const { toast } = useToast();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState<string | 'all' | null>(null);

  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'needs-setup'>('all');
  const [sortBy, setSortBy]             = useState<'name' | 'slots-desc' | 'price'>('name');

  const from = useMemo(() => isoToday(), []);
  const to   = useMemo(() => addDays(from, 29), [from]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/therapists');
      setTherapists(res.data || []);
    } catch {
      toast({ variant: 'error', title: 'Failed to load therapists', items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Filtered + sorted list ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = [...therapists];
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(t => t.name.toLowerCase().includes(q) || t.specialties.some(s => s.toLowerCase().includes(q)));
    }
    if (filterStatus === 'active')      r = r.filter(t => hasSchedule(t));
    if (filterStatus === 'needs-setup') r = r.filter(t => !hasSchedule(t));
    switch (sortBy) {
      case 'name':       r.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'slots-desc': r.sort((a, b) => weeklySlotCount(b) - weeklySlotCount(a)); break;
      case 'price':      r.sort((a, b) => a.price - b.price); break;
    }
    return r;
  }, [therapists, search, filterStatus, sortBy]);

  const activeCount      = therapists.filter(t => hasSchedule(t)).length;
  const needsSetupCount  = therapists.length - activeCount;
  const hasActiveFilters = search.trim() !== '' || filterStatus !== 'all';

  // ── Generate availability for one or all therapists ────────────────────
  const generateFor = async (therapistId: string) => {
    setGenerating(therapistId);
    try {
      await api.post(`/admin/availability/${therapistId}/generate`, { from, to, overwrite: false });
      toast({ title: 'Generated', description: 'Missing slots filled from weekly schedule.' });
    } catch {
      toast({ variant: 'error', title: 'Failed to generate', items: [] });
    } finally {
      setGenerating(null);
    }
  };

  const generateAll = async () => {
    const eligible = therapists.filter(t => hasSchedule(t));
    if (!eligible.length) {
      toast({ variant: 'error', title: 'No therapists have a weekly schedule set', items: [] });
      return;
    }
    setGenerating('all');
    let ok = 0;
    for (const t of eligible) {
      try {
        await api.post(`/admin/availability/${t._id}/generate`, { from, to, overwrite: false });
        ok++;
      } catch { /* skip */ }
    }
    toast({ title: `Generated for ${ok} therapist${ok !== 1 ? 's' : ''}`, description: 'Missing calendar slots filled.' });
    setGenerating(null);
  };

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-400" /> Availability Planning
            </h1>
            <p className="text-neutral-400 text-sm mt-1">Manage weekly schedules and date-level slots for each therapist.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={load}
              className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors inline-flex items-center gap-2 text-sm">
              <RefreshCcw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={generateAll}
              disabled={generating !== null}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60 transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              {generating === 'all' ? 'Generating…' : 'Generate All (30 days)'}
            </button>
          </div>
        </div>

        {/* Stats row */}
        {!loading && (
          <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-neutral-400">
                <span className="text-white font-bold">{activeCount}</span> with schedule
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-sm text-neutral-400">
                <span className="text-white font-bold">{needsSetupCount}</span> need setup
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neutral-600" />
              <span className="text-sm text-neutral-400">
                <span className="text-white font-bold">{therapists.length}</span> total
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Search + Sort ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or specialty…"
            className="w-full pl-9 pr-9 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500/50 focus:outline-none placeholder:text-neutral-600"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-300 text-sm focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
        >
          <option value="name">Sort: Name A–Z</option>
          <option value="slots-desc">Sort: Most Slots</option>
          <option value="price">Sort: Price Low–High</option>
        </select>
      </div>

      {/* ── Status filter + count ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 flex items-center gap-1.5 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Status:
          </span>
          {(['all', 'active', 'needs-setup'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                filterStatus === s
                  ? s === 'needs-setup'
                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                    : s === 'active'
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-neutral-700 border-neutral-600 text-white'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300',
              ].join(' ')}
            >
              {s === 'all' ? `All (${therapists.length})` : s === 'active' ? `Active (${activeCount})` : `Needs Setup (${needsSetupCount})`}
            </button>
          ))}
        </div>
        <p className="text-sm text-neutral-500">
          Showing <span className="text-white font-medium">{filtered.length}</span> of {therapists.length}
          {hasActiveFilters && (
            <button onClick={() => { setSearch(''); setFilterStatus('all'); }} className="ml-2 text-emerald-400 hover:underline text-xs">Clear</button>
          )}
        </p>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-neutral-900 border border-neutral-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-neutral-500 bg-neutral-900/50 rounded-2xl border border-neutral-800 border-dashed">
          {hasActiveFilters ? 'No therapists match your filters.' : 'No therapists found.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(t => {
            const slotCount = weeklySlotCount(t);
            const active    = slotCount > 0;
            return (
              <div key={t._id} className={`bg-neutral-900 border rounded-2xl p-5 flex flex-col gap-4 transition-all hover:border-neutral-700 ${active ? 'border-neutral-800' : 'border-amber-500/20'}`}>

                {/* Top row: avatar + name + status */}
                <div className="flex items-start gap-3">
                  <img
                    src={t.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=10b981&color=fff&size=80`}
                    alt={t.name}
                    className="w-12 h-12 rounded-xl object-cover border border-neutral-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-sm leading-tight truncate">{t.name}</h3>
                      {active ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                          <AlertCircle className="w-2.5 h-2.5" /> Needs Setup
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                      {t.specialties.slice(0, 3).join(', ')}{t.specialties.length > 3 ? '…' : ''}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <CalendarDays className="w-3.5 h-3.5 text-neutral-500" />
                    <span><span className={`font-bold ${active ? 'text-emerald-400' : 'text-neutral-600'}`}>{slotCount}</span> weekly slots</span>
                  </div>
                  <div className="w-px h-3 bg-neutral-700" />
                  <div className="flex items-center gap-1 text-neutral-400">
                    <IndianRupee className="w-3 h-3 text-neutral-500" />
                    <span className="font-medium text-neutral-300">{t.price}</span>
                    <span className="text-neutral-600">/ session</span>
                  </div>
                </div>

                {/* Weekly schedule mini preview */}
                {active && (
                  <div className="flex gap-1">
                    {['M','T','W','T','F','S','S'].map((label, i) => {
                      const dow = i === 6 ? 0 : i + 1;
                      const daySlots = (t.weeklyAvailability ?? []).find(d => d.dayOfWeek === dow)?.slots.length ?? 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] text-neutral-600 font-bold">{label}</span>
                          <div className={`w-full h-1.5 rounded-full ${daySlots > 0 ? 'bg-emerald-500' : 'bg-neutral-800'}`} />
                          {daySlots > 0 && <span className="text-[9px] text-emerald-600 font-bold">{daySlots}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-1">
                  {!active && (
                    <button
                      onClick={() => generateFor(t._id)}
                      disabled={generating !== null}
                      className="flex-1 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/15 transition-colors inline-flex items-center justify-center gap-1.5 text-xs font-semibold disabled:opacity-60"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      {generating === t._id ? 'Generating…' : 'Generate Slots'}
                    </button>
                  )}
                  {active && (
                    <button
                      onClick={() => generateFor(t._id)}
                      disabled={generating !== null}
                      className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors inline-flex items-center gap-1.5 text-xs disabled:opacity-60"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      {generating === t._id ? 'Generating…' : 'Fill Missing'}
                    </button>
                  )}
                  <Link
                    href={`/availability/${t._id}`}
                    className="flex-1 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    Manage <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
