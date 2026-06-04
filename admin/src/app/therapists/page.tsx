'use client';

import { useState, useEffect, useMemo } from 'react';
import { Pencil, Trash2, Star, IndianRupee, Plus, ExternalLink, Search, X, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/toaster';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getApiErrorMessage } from '@/lib/form-validation';

interface Therapist {
    _id: string;
    name: string;
    email?: string;
    specialties: string[];
    price: number;
    ratingAverage: number;
    profileImage: string;
}

export default function TherapistsPage() {
    const { toast } = useToast();
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Search / filter / sort ─────────────────────────────────────────────
    const [search, setSearch]             = useState('');
    const [sortBy, setSortBy]             = useState<'name' | 'rating' | 'price-asc' | 'price-desc'>('name');
    const [filterSpecialty, setFilterSpecialty] = useState('');
    const [filterRating, setFilterRating] = useState(0);

    const allSpecialties = useMemo(() => {
        const s = new Set<string>();
        therapists.forEach(t => t.specialties.forEach(sp => s.add(sp)));
        return Array.from(s).sort();
    }, [therapists]);

    const filteredTherapists = useMemo(() => {
        let r = [...therapists];
        if (search.trim()) {
            const q = search.toLowerCase();
            r = r.filter(t =>
                t.name.toLowerCase().includes(q) ||
                t.specialties.some(s => s.toLowerCase().includes(q))
            );
        }
        if (filterSpecialty) r = r.filter(t => t.specialties.includes(filterSpecialty));
        if (filterRating > 0) r = r.filter(t => (t.ratingAverage || 0) >= filterRating);
        switch (sortBy) {
            case 'name':       r.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'rating':     r.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0)); break;
            case 'price-asc':  r.sort((a, b) => a.price - b.price); break;
            case 'price-desc': r.sort((a, b) => b.price - a.price); break;
        }
        return r;
    }, [therapists, search, sortBy, filterSpecialty, filterRating]);

    const hasActiveFilters = search.trim() !== '' || filterSpecialty !== '' || filterRating > 0;
    const clearFilters = () => { setSearch(''); setFilterSpecialty(''); setFilterRating(0); };

    // ── Delete ─────────────────────────────────────────────────────────────
    const [isDeleteOpen, setIsDeleteOpen]         = useState(false);
    const [therapistToDelete, setTherapistToDelete] = useState<Therapist | null>(null);
    const [deleteLoading, setDeleteLoading]       = useState(false);

    useEffect(() => { fetchTherapists(); }, []);

    const fetchTherapists = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/therapists');
            setTherapists(res.data);
        } catch (error) {
            toast({ variant: 'error', title: 'Unable to load therapists', items: [getApiErrorMessage(error, 'Failed to fetch therapists.')] });
        } finally {
            setLoading(false);
        }
    };

    const openDelete = (t: Therapist) => { setTherapistToDelete(t); setIsDeleteOpen(true); };

    const handleDeleteConfirm = async () => {
        if (!therapistToDelete) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/admin/therapists/${therapistToDelete._id}`);
            setIsDeleteOpen(false);
            toast({ title: 'Therapist deleted', description: 'Profile removed successfully.' });
            fetchTherapists();
        } catch (error) {
            toast({ variant: 'error', title: 'Unable to delete therapist', items: [getApiErrorMessage(error, 'Failed to delete.')] });
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="space-y-5">

            {/* ── Header ── */}
            <div className="flex justify-between items-center bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Manage Therapists</h1>
                    <p className="text-neutral-400 text-sm">View and update therapist profiles, pricing, and specialties.</p>
                </div>
                <Link href="/therapists/new"
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded-xl transition-colors text-sm">
                    <Plus className="w-4 h-4" /> Add Therapist
                </Link>
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
                    <option value="rating">Sort: Top Rated</option>
                    <option value="price-asc">Sort: Price Low–High</option>
                    <option value="price-desc">Sort: Price High–Low</option>
                </select>
            </div>

            {/* ── Specialty filter pills ── */}
            {allSpecialties.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-neutral-500 flex items-center gap-1.5 mr-1">
                        <SlidersHorizontal className="w-3.5 h-3.5" /> Specialty:
                    </span>
                    <button
                        onClick={() => setFilterSpecialty('')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${!filterSpecialty ? 'bg-emerald-500 border-emerald-500 text-neutral-950' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'}`}
                    >All</button>
                    {allSpecialties.map(sp => (
                        <button key={sp}
                            onClick={() => setFilterSpecialty(filterSpecialty === sp ? '' : sp)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filterSpecialty === sp ? 'bg-emerald-500 border-emerald-500 text-neutral-950' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'}`}
                        >{sp}</button>
                    ))}
                </div>
            )}

            {/* ── Stats + Rating filter ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-neutral-500">
                    Showing <span className="text-white font-medium">{filteredTherapists.length}</span> of {therapists.length} therapists
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="ml-2 text-emerald-400 hover:underline text-xs">Clear all filters</button>
                    )}
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500" /> Min rating:
                    </span>
                    {([0, 3, 4, 4.5] as const).map(r => (
                        <button key={r} onClick={() => setFilterRating(r)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${filterRating === r ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-white'}`}
                        >{r === 0 ? 'All' : `${r}+`}</button>
                    ))}
                </div>
            </div>

            {/* ── Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-56 animate-pulse" />
                    ))
                ) : filteredTherapists.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-neutral-500 bg-neutral-900/50 rounded-2xl border border-neutral-800 border-dashed">
                        {hasActiveFilters ? 'No therapists match your filters.' : 'No therapists found on the platform.'}
                    </div>
                ) : filteredTherapists.map(therapist => (
                    <div key={therapist._id}
                        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative group overflow-hidden transition-all hover:border-neutral-700">

                        {/* Action buttons */}
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Link href={`/therapists/${therapist._id}`}
                                className="p-2 bg-neutral-800/90 backdrop-blur text-emerald-400 hover:text-white hover:bg-emerald-500/20 rounded-lg transition-colors"
                                title="View profile">
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                            <Link href={`/therapists/${therapist._id}/edit`}
                                className="p-2 bg-neutral-800/90 backdrop-blur text-blue-400 hover:text-white hover:bg-blue-500/20 rounded-lg transition-colors"
                                title="Edit">
                                <Pencil className="w-4 h-4" />
                            </Link>
                            <button onClick={() => openDelete(therapist)}
                                className="p-2 bg-neutral-800/90 backdrop-blur text-red-500 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Delete">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <img
                                src={therapist.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(therapist.name)}&background=10b981&color=fff`}
                                alt={therapist.name}
                                className="w-16 h-16 rounded-2xl object-cover border border-neutral-800"
                            />
                            <div>
                                <h3 className="font-semibold text-white text-lg leading-tight">{therapist.name}</h3>
                                <div className="flex items-center mt-1 text-sm text-amber-500">
                                    <Star className="w-4 h-4 fill-amber-500 mr-1" />
                                    <span className="font-medium">{therapist.ratingAverage?.toFixed(1) || 'New'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1.5 font-medium">Specialties</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {therapist.specialties.slice(0, 3).map((spec, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded-md text-xs border border-neutral-700">{spec}</span>
                                    ))}
                                    {therapist.specialties.length > 3 && (
                                        <span className="px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded-md text-xs border border-neutral-700">
                                            +{therapist.specialties.length - 3}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center pt-2 border-t border-neutral-800">
                                <IndianRupee className="w-4 h-4 text-emerald-400 mr-0.5" />
                                <span className="text-emerald-400 font-medium">{therapist.price}</span>
                                <span className="text-neutral-500 text-xs ml-1">/ session</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Delete dialog ── */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-400">Delete Therapist</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-neutral-400 text-sm">
                            Are you sure you want to delete{' '}
                            <span className="text-white font-medium">{therapistToDelete?.name}</span>?
                            This cannot be undone.
                        </p>
                    </div>
                    <DialogFooter className="border-t border-neutral-800 pt-4">
                        <button type="button" onClick={() => setIsDeleteOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button type="button" onClick={handleDeleteConfirm} disabled={deleteLoading}
                            className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all disabled:opacity-50 ml-2">
                            {deleteLoading ? 'Deleting…' : 'Yes, delete'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
