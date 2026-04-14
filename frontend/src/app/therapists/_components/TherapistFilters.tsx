"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { User, Sparkles, Heart, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

export interface Therapist {
    _id: string;
    name: string;
    bio: string;
    specialties: string[];
    price: number;
    profileImage?: string;
    ratingAverage: number;
}

interface TherapistFiltersProps {
    initialTherapists: Therapist[];
    initialTotalPages: number;
    initialTotalItems: number;
}

export default function TherapistFilters({
    initialTherapists,
    initialTotalPages,
    initialTotalItems
}: TherapistFiltersProps) {
    const [therapists, setTherapists] = useState<Therapist[]>(initialTherapists);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination and Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(initialTotalPages);
    const [totalItems, setTotalItems] = useState(initialTotalItems);
    const [availabilityFilter, setAvailabilityFilter] = useState('Any time');

    const [isInitialMount, setIsInitialMount] = useState(true);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            if (!isInitialMount) {
                setCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, isInitialMount]);

    useEffect(() => {
        if (isInitialMount) {
            setIsInitialMount(false);
            return;
        }

        const fetchTherapists = async () => {
            try {
                setLoading(true);
                const response = await api.get('/therapists', {
                    params: {
                        page: currentPage,
                        limit: 10,
                        ...(debouncedSearch && { search: debouncedSearch })
                    }
                });
                setTherapists(response.data.therapists || []);
                setTotalPages(response.data.totalPages || 1);
                setTotalItems(response.data.total || 0);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch therapists:', err);
                setError("Failed to load therapists. Take your time - we'll be here when you're ready.");
            } finally {
                setLoading(false);
            }
        };

        fetchTherapists();
    }, [currentPage, debouncedSearch, isInitialMount]);

    return (
        <div className="space-y-12 md:space-y-16">
            {/* MASSIVE LUXURY HEADER */}
            <div className="max-w-4xl space-y-6 px-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-xs tracking-widest uppercase animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Our Network</span>
                </div>
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[7.5rem] font-display leading-[0.9] tracking-tight text-foreground">
                    Find your <span className="italic text-accent pr-2">match.</span>
                </h1>
                <p className="text-xl md:text-2xl font-medium text-muted-foreground max-w-2xl leading-relaxed">
                    A curated selection of world-class professionals, ready to guide your journey to balance.
                </p>
            </div>

            {/* SLEEK STICKY FILTER BAR */}
            <div className="sticky top-20 z-30 -mx-4 px-4 py-4 md:-mx-8 md:px-8 bg-background/80 backdrop-blur-2xl border-y border-border/40 shadow-sm transition-all duration-300">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full">
                    {/* Search & Main Filter */}
                    <div className="flex flex-1 items-center gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, specialty, or focus..."
                                className="h-14 rounded-full border-border/60 bg-accent/5 pl-12 pr-4 text-base shadow-sm focus-visible:ring-accent"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="h-14 rounded-full border-border/60 px-6 font-semibold shadow-sm hover:border-accent hover:bg-accent/5 hidden sm:flex shrink-0">
                            <SlidersHorizontal className="w-4 h-4 mr-2" />
                            More Filters
                        </Button>
                    </div>

                    {/* Quick Toggles & Sort */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
                        <div className="flex bg-accent/5 p-1 rounded-full border border-border/40 shrink-0">
                            {['Any time', 'Today', 'This Week'].map(filter => {
                                const isSelected = availabilityFilter === filter;
                                return (
                                    <button
                                        key={filter}
                                        onClick={() => setAvailabilityFilter(filter)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${isSelected
                                            ? 'bg-background text-foreground shadow-md'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {filter}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="relative shrink-0">
                            <select className="appearance-none h-12 pl-5 pr-10 rounded-full border border-border/40 bg-background text-sm font-bold text-foreground outline-none transition-colors hover:border-accent shadow-sm cursor-pointer">
                                <option>Sort by: Recommended</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                                <option>Rating: Highest</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* LIST AREA */}
            <div className="min-h-[50vh]">
                <div className="mb-6 px-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        Showing {totalItems > 0 ? ((currentPage - 1) * 10) + 1 : 0}-{Math.min(currentPage * 10, totalItems)} of {totalItems} professionals
                    </p>
                </div>

                {loading ? (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <Skeleton className="h-4 w-52" />
                            <Skeleton className="h-4 w-28" />
                        </div>
                        <div className="grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="space-y-5">
                                    <Skeleton className="aspect-[4/5] w-full rounded-[2.5rem]" />
                                    <div className="space-y-3 px-2">
                                        <Skeleton className="h-7 w-2/3" />
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-center py-32 space-y-4 max-w-md mx-auto">
                        <h3 className="text-3xl font-display font-medium text-foreground">
                            We&apos;re having a moment
                        </h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            We couldn&apos;t load our therapists right now. Take a breath - it&apos;s not you. Try refreshing the page.
                        </p>
                        <Button
                            onClick={() => window.location.reload()}
                            className="mt-6 h-14 rounded-full px-8 text-base font-bold"
                        >
                            Try again
                        </Button>
                    </div>
                ) : therapists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center max-w-lg mx-auto">
                        <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mb-8 border border-accent/20">
                            <Search className="w-10 h-10 text-accent/60" />
                        </div>
                        <h3 className="text-3xl font-display font-medium text-foreground mb-4">No exact matches found</h3>
                        <p className="text-lg text-muted-foreground">We couldn&apos;t find any professionals matching your specific filters. Try broadening your search criteria.</p>
                        <Button
                            variant="outline"
                            onClick={() => { setSearchQuery(''); setAvailabilityFilter('Any time'); }}
                            className="mt-8 h-12 rounded-full px-8 font-bold border-border/60"
                        >
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* EDITORIAL PORTRAIT GRID */}
                        <div className="grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {therapists.map((t) => (
                                <Link href={`/therapists/${t._id}`} key={t._id} className="group flex flex-col gap-5">
                                    {/* Image Wrapper */}
                                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2.5rem] bg-accent/5 border border-border/40 shadow-sm transition-transform duration-700 ease-out group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
                                        {t.profileImage ? (
                                            <Image 
                                                src={t.profileImage} 
                                                alt={`Photo of ${t.name}`} 
                                                fill 
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                                                className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 flex items-center justify-center">
                                                <User className="w-20 h-20 text-primary/20" />
                                            </div>
                                        )}

                                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-80"></div>
                                        
                                        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                                            <div className="flex gap-2">
                                                {t.ratingAverage > 0 && (
                                                    <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm border border-white/10">
                                                        ★ {t.ratingAverage.toFixed(1)}
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center bg-primary/90 text-primary-foreground backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-primary/20 hover:bg-primary transition-colors">
                                                    Accepting New
                                                </span>
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => { e.preventDefault(); }}
                                            aria-label="Save to favorites"
                                            className="absolute top-5 right-5 h-10 w-10 outline-none rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 shadow-sm hover:bg-black/40 hover:text-accent transition-all duration-300 z-10"
                                        >
                                            <Heart className="w-4 h-4 hover:fill-accent hover:text-accent transition-colors" />
                                        </Button>
                                    </div>
                                    
                                    {/* Typography Section */}
                                    <div className="space-y-3 px-2">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-2xl font-display font-medium text-foreground tracking-tight group-hover:text-primary transition-colors truncate">
                                                    {t.name}
                                                </h3>
                                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-1 truncate">
                                                    {t.specialties[0] || 'Therapist'} {t.specialties.length > 1 && `+ ${t.specialties.length - 1}`}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xl font-display font-medium text-foreground">₹{t.price}</p>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">/ hr</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium text-foreground/70 line-clamp-2 leading-relaxed">
                                            {t.bio || `Professional specializing in ${t.specialties.join(', ')}. Book your personal online sessions today.`}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="pt-16 pb-8">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
