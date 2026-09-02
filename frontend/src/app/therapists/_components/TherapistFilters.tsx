"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { NavButton } from '@/components/ui/nav-button';
import { 
    User, Sparkles, Heart, Search, ChevronDown, 
    ShieldCheck, Lock, Calendar, Video, FileText, 
    Users, Clock, X, Filter, ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

export interface Therapist {
    _id: string;
    name: string;
    bio: string;
    credentials?: string;
    specialties: string[];
    price: number;
    profileImage?: string;
    ratingAverage: number;
    gender?: string;
    languages?: string[];
    sessionTypes?: string[];
}

interface TherapistFiltersProps {
    initialTherapists: Therapist[];
    initialTotalPages: number;
    initialTotalItems: number;
    initialLanguages?: string[];
}

interface FilterState {
    search: string;
    availability: string;
    sessionType: string;
    gender: string;
    language: string;
    price: string;
    sortBy: string;
}

const priceOptions = [
    { label: 'Any Price Range', value: 'Any Price Range' },
    { label: 'Under ₹1500 / session', value: '0-1500' },
    { label: '₹1500 - ₹2500 / session', value: '1500-2500' },
    { label: '₹2500+ / session', value: '2500+' }
];

export default function TherapistFilters({
    initialTherapists,
    initialTotalPages,
    initialTotalItems,
    initialLanguages = []
}: TherapistFiltersProps) {
    const [therapists, setTherapists] = useState<Therapist[]>(initialTherapists);
    const [availableLanguages, setAvailableLanguages] = useState<string[]>(initialLanguages);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Unified Filter State
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        availability: 'Any time',
        sessionType: 'All Session Types',
        gender: 'All Genders',
        language: 'All Languages',
        price: 'Any Price Range',
        sortBy: 'Recommended'
    });

    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(initialTotalPages);
    const [totalItems, setTotalItems] = useState(initialTotalItems);
    const [isInitialMount, setIsInitialMount] = useState(true);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 350, behavior: 'smooth' });
    };

    const updateFilter = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        if (!isInitialMount) {
            setCurrentPage(1);
        }
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            availability: 'Any time',
            sessionType: 'All Session Types',
            gender: 'All Genders',
            language: 'All Languages',
            price: 'Any Price Range',
            sortBy: 'Recommended'
        });
        setDebouncedSearch('');
        setCurrentPage(1);
    };

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search);
            if (!isInitialMount) {
                setCurrentPage(1);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [filters.search, isInitialMount]);

    useEffect(() => {
        if (isInitialMount) {
            setIsInitialMount(false);
            return;
        }

        const sortMap: Record<string, string> = {
            'Price: Low to High': 'price_asc',
            'Price: High to Low': 'price_desc',
            'Rating: Highest': 'rating_desc',
        };
        const availabilityMap: Record<string, string> = {
            'Today': 'today',
            'This Week': 'this_week',
        };

        const fetchTherapists = async () => {
            try {
                setLoading(true);
                const params: Record<string, string | number> = {
                    page: currentPage,
                    limit: 100,
                    ...(debouncedSearch && { search: debouncedSearch }),
                    ...(availabilityMap[filters.availability] && { availability: availabilityMap[filters.availability] }),
                    ...(sortMap[filters.sortBy] && { sort: sortMap[filters.sortBy] }),
                };

                if (filters.sessionType && filters.sessionType !== 'All Session Types') {
                    params.sessionType = filters.sessionType;
                }
                if (filters.gender && filters.gender !== 'All Genders') {
                    params.gender = filters.gender;
                }
                if (filters.language && filters.language !== 'All Languages') {
                    params.language = filters.language;
                }
                if (filters.price && filters.price !== 'Any Price Range') {
                    params.price = filters.price;
                }

                const response = await api.get('/therapists', { params });
                setTherapists(response.data.therapists || []);
                setTotalPages(response.data.totalPages || 1);
                setTotalItems(response.data.total || 0);
                if (response.data.allLanguages) {
                    setAvailableLanguages(response.data.allLanguages);
                }
                setError(null);
            } catch (err) {
                console.error('Failed to fetch therapists:', err);
                setError("Failed to load therapists. Take your time - we'll be here when you're ready.");
            } finally {
                setLoading(false);
            }
        };

        fetchTherapists();
    }, [
        currentPage, 
        debouncedSearch, 
        filters.availability, 
        filters.sessionType, 
        filters.gender, 
        filters.language, 
        filters.price, 
        filters.sortBy, 
        isInitialMount
    ]);

    const hasActiveFilters = 
        filters.availability !== 'Any time' ||
        filters.sessionType !== 'All Session Types' ||
        filters.gender !== 'All Genders' ||
        filters.language !== 'All Languages' ||
        filters.price !== 'Any Price Range' ||
        debouncedSearch.trim() !== '';

    const featuredTherapist = therapists.length > 0 ? therapists[0] : null;
    const displayedTherapists = therapists;

    const baseLanguages = ['English', 'Spanish', 'Hindi', 'Tamil', 'Malayalam', 'Kannada', 'Marathi', 'Bengali', 'Punjabi'];
    const mergedLanguages = Array.from(new Set([...baseLanguages, ...availableLanguages]));

    return (
        <div className="space-y-16">
            {/* HERO SECTION - SPLIT LAYOUT */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 pt-8">
                {/* Left Side: Typography & Badges */}
                <div className="flex flex-col justify-center space-y-8 lg:pr-8">
                    <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-display text-foreground leading-[1.1] text-balance tracking-tight">
                        Find the right therapist for <span className="italic text-accent">your journey</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-foreground/70 max-w-lg leading-relaxed">
                        Browse licensed therapists specialized in anxiety, depression, relationships and more. Filter by session type, language, price, and gender to match your specific comfort needs.
                    </p>
                    
                    <div className="flex flex-wrap gap-6 pt-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <span className="text-sm font-light text-foreground">Verified<br/>Therapists</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" />
                            <span className="text-sm font-light text-foreground">100%<br/>Confidential</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-primary" />
                            <span className="text-sm font-light text-foreground">Compassionate<br/>Care</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Featured Therapist */}
                <div className="relative flex flex-col h-full justify-end lg:items-end">
                    <div className="w-full flex justify-end mb-4">
                        <Link href="#all-therapists" className="text-sm font-light text-primary flex items-center gap-1 hover:gap-2 transition-all">
                            See All {totalItems}+ Therapists <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {loading ? (
                        <Skeleton className="w-full h-[350px] rounded-[2rem]" />
                    ) : featuredTherapist ? (
                        <div className="bg-accent/5 rounded-[2rem] p-4 flex flex-col sm:flex-row gap-6 w-full max-w-2xl border border-accent/10">
                            <div className="relative w-full sm:w-[220px] aspect-[4/5] shrink-0 rounded-2xl overflow-hidden bg-white/50">
                                {featuredTherapist.profileImage ? (
                                    <Image 
                                        src={featuredTherapist.profileImage} 
                                        alt={featuredTherapist.name} 
                                        fill 
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <User className="w-16 h-16 text-primary/20" />
                                    </div>
                                )}
                                {featuredTherapist.ratingAverage > 0 && (
                                    <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-normal shadow-sm">
                                        <span className="text-yellow-500">★</span> {featuredTherapist.ratingAverage.toFixed(1)}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col justify-center flex-1 space-y-4">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent font-normal text-[10px] tracking-widest uppercase w-fit">
                                    <Sparkles className="w-3 h-3" />
                                    Featured Therapist
                                </div>
                                
                                <div>
                                    <h3 className="text-2xl font-display font-medium text-foreground">{featuredTherapist.name}</h3>
                                    <p className="text-sm text-foreground/70">{featuredTherapist.credentials || 'Clinical Psychologist'}</p>
                                </div>
                                
                                <div className="flex items-center gap-6 text-sm font-medium text-foreground">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <span>1500+<br/><span className="text-[10px] text-muted-foreground uppercase tracking-widest">Sessions</span></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span>8+<br/><span className="text-[10px] text-muted-foreground uppercase tracking-widest">Years Exp.</span></span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {featuredTherapist.specialties.slice(0, 2).map(s => (
                                        <span key={s} className="px-2.5 py-1 rounded-full bg-accent/5 text-accent text-xs font-light">
                                            {s}
                                        </span>
                                    ))}
                                    {featuredTherapist.specialties.length > 2 && (
                                        <span className="px-2.5 py-1 rounded-full bg-accent/5 text-accent text-xs font-light">
                                            +{featuredTherapist.specialties.length - 2} More
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 pt-2">
                                    <div className="flex items-center gap-1.5 text-sm font-light text-green-600">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        Available Today
                                    </div>
                                    <NavButton href={`/therapists/${featuredTherapist._id}`} className="rounded-full bg-primary hover:bg-primary/90">
                                        <Calendar className="w-4 h-4 mr-2" /> Book Session
                                    </NavButton>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* SEARCH AND FILTERS */}
            <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_12px_36px_rgba(0,0,0,0.04)] border border-border/60 mb-6 flex flex-col gap-5 mt-8">
                <div className="relative w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, specialty, condition, or background..."
                        className="h-14 rounded-full border-border/60 bg-secondary/40 pl-12 pr-6 text-base font-medium shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                    />
                    {filters.search && (
                        <button 
                            onClick={() => updateFilter('search', '')} 
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-secondary/60 p-1 rounded-full border border-border/40 shrink-0">
                        {['Any time', 'Today', 'This Week'].map(filter => {
                            const isSelected = filters.availability === filter;
                            return (
                                <button
                                    key={filter}
                                    onClick={() => updateFilter('availability', filter)}
                                    className={`px-4 py-2 rounded-full text-xs md:text-sm font-normal transition-all duration-300 whitespace-nowrap ${
                                        isSelected ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {filter}
                                </button>
                            );
                        })}
                    </div>
                    
                    {/* Session Type Filter */}
                    <div className="relative shrink-0">
                        <select 
                            value={filters.sessionType}
                            onChange={(e) => updateFilter('sessionType', e.target.value)}
                            className="appearance-none h-10 pl-4 pr-9 rounded-full border border-border/60 bg-white text-xs md:text-sm font-normal text-foreground shadow-xs cursor-pointer outline-none hover:border-primary/40 transition-colors focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="All Session Types">All Session Types</option>
                            <option value="Video">Video Session</option>
                            <option value="Audio">Audio / Phone Session</option>
                            <option value="In-person">In-person</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                    
                    {/* Gender Filter */}
                    <div className="relative shrink-0">
                        <select 
                            value={filters.gender}
                            onChange={(e) => updateFilter('gender', e.target.value)}
                            className="appearance-none h-10 pl-4 pr-9 rounded-full border border-border/60 bg-white text-xs md:text-sm font-normal text-foreground shadow-xs cursor-pointer outline-none hover:border-primary/40 transition-colors focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="All Genders">All Genders</option>
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Non-binary">Non-binary</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                    
                    {/* Language Filter */}
                    <div className="relative shrink-0">
                        <select 
                            value={filters.language}
                            onChange={(e) => updateFilter('language', e.target.value)}
                            className="appearance-none h-10 pl-4 pr-9 rounded-full border border-border/60 bg-white text-xs md:text-sm font-normal text-foreground shadow-xs cursor-pointer outline-none hover:border-primary/40 transition-colors focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="All Languages">All Languages</option>
                            {mergedLanguages.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                    
                    {/* Price Filter */}
                    <div className="relative shrink-0">
                        <select 
                            value={filters.price}
                            onChange={(e) => updateFilter('price', e.target.value)}
                            className="appearance-none h-10 pl-4 pr-9 rounded-full border border-border/60 bg-white text-xs md:text-sm font-normal text-foreground shadow-xs cursor-pointer outline-none hover:border-primary/40 transition-colors focus:ring-2 focus:ring-primary/20"
                        >
                            {priceOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative shrink-0 ml-auto">
                        <select
                            value={filters.sortBy}
                            onChange={(e) => updateFilter('sortBy', e.target.value)}
                            className="appearance-none h-10 pl-4 pr-9 rounded-full border border-border/60 bg-secondary text-xs md:text-sm font-normal text-foreground outline-none transition-colors hover:border-primary/40 shadow-xs cursor-pointer focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="Recommended">Sort: Recommended</option>
                            <option value="Price: Low to High">Price: Low to High</option>
                            <option value="Price: High to Low">Price: High to Low</option>
                            <option value="Rating: Highest">Rating: Highest</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                </div>

                {/* Active Filters Tray */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/40 animate-in fade-in duration-200">
                        <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider mr-1">Active Filters:</span>
                        {filters.availability !== 'Any time' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-normal">
                                {filters.availability}
                                <button onClick={() => updateFilter('availability', 'Any time')} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        {filters.sessionType !== 'All Session Types' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-normal">
                                {filters.sessionType}
                                <button onClick={() => updateFilter('sessionType', 'All Session Types')} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        {filters.gender !== 'All Genders' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-normal">
                                {filters.gender}
                                <button onClick={() => updateFilter('gender', 'All Genders')} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        {filters.language !== 'All Languages' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-normal">
                                {filters.language}
                                <button onClick={() => updateFilter('language', 'All Languages')} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        {filters.price !== 'Any Price Range' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-normal">
                                {priceOptions.find(p => p.value === filters.price)?.label || filters.price}
                                <button onClick={() => updateFilter('price', 'Any Price Range')} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        {debouncedSearch.trim() !== '' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-normal">
                                &ldquo;{debouncedSearch}&rdquo;
                                <button onClick={() => updateFilter('search', '')} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        <button
                            onClick={resetFilters}
                            className="text-xs font-normal text-accent hover:text-accent/80 transition-colors ml-2 underline underline-offset-2"
                        >
                            Clear All
                        </button>
                    </div>
                )}
            </div>

            {/* THERAPISTS GRID */}
            <div id="all-therapists" className="min-h-[50vh]">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-normal text-foreground">
                        {hasActiveFilters ? `Matching Therapists (${totalItems})` : 'Top Rated Therapists'}
                    </h2>
                </div>

                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="bg-white rounded-[2rem] p-5 border border-border/40 space-y-4 shadow-sm">
                                <div className="flex gap-4">
                                    <Skeleton className="w-[35%] aspect-[4/5] rounded-2xl" />
                                    <div className="flex-1 space-y-3 py-1">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-3 w-full mt-4" />
                                        <Skeleton className="h-3 w-4/5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-muted-foreground">{error}</div>
                ) : displayedTherapists.length === 0 ? (
                    /* EMPTY STATE WHEN NOTHING MATCHES */
                    <div className="bg-white rounded-[2.5rem] p-12 text-center border border-primary/10 shadow-sm max-w-2xl mx-auto my-8 space-y-6">
                        <div className="w-20 h-20 rounded-full bg-secondary border border-border/60 flex items-center justify-center mx-auto text-primary">
                            <Filter className="w-8 h-8 opacity-60" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-display font-normal text-foreground">No therapists found</h3>
                            <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
                                We couldn&apos;t find any therapists matching all of your selected criteria. Try broadening your preferences or clearing some filters to explore more professionals.
                            </p>
                        </div>
                        {hasActiveFilters && (
                            <Button onClick={resetFilters} className="rounded-full px-8 h-12 font-normal shadow-md hover:shadow-lg transition-all bg-primary text-white">
                                Clear All Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {displayedTherapists.map((t) => (
                                <div key={t._id} className="bg-white rounded-[2rem] p-5 border border-border/40 shadow-[0_12px_30px_rgba(0,0,0,0.06)] flex flex-row gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:border-primary/20 items-stretch group">
                                    {/* Image Container (35% width) */}
                                    <div className="relative w-[35%] max-w-[180px] shrink-0 rounded-2xl overflow-hidden bg-accent/5 aspect-[4/5] self-start">
                                        {t.profileImage ? (
                                            <Image 
                                                src={t.profileImage} 
                                                alt={t.name} 
                                                fill 
                                                className="object-cover object-[center_20%]" 
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <User className="w-12 h-12 text-primary/20" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Info Container (65% width) */}
                                    <div className="flex-1 flex flex-col min-w-0 py-0.5">
                                        <div className="mb-2">
                                            <h3 className="text-lg font-display font-normal text-foreground truncate flex items-center gap-2">
                                                {t.name}
                                                {t.ratingAverage > 0 && (
                                                    <span className="text-sm font-light text-foreground flex items-center bg-yellow-50 px-1.5 py-0.5 rounded-md border border-yellow-100/50"><span className="text-yellow-500 text-xs mr-0.5">★</span> {t.ratingAverage.toFixed(1)}</span>
                                                )}
                                            </h3>
                                            <p className="text-xs font-normal text-primary truncate">{t.credentials || 'Clinical Psychologist'}</p>
                                        </div>
                                        
                                        <div className="space-y-1.5 mb-3">
                                            {t.gender && (
                                                <div className="flex items-center gap-2 text-[11px] text-foreground/80 font-medium">
                                                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-100/50 flex items-center justify-center shrink-0">
                                                        <span className="text-emerald-600 text-[9px] font-light">✓</span>
                                                    </div>
                                                    Gender: {t.gender}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-[11px] text-foreground/80 font-medium">
                                                <div className="w-3.5 h-3.5 rounded-full bg-emerald-100/50 flex items-center justify-center shrink-0">
                                                    <span className="text-emerald-600 text-[9px] font-light">✓</span>
                                                </div>
                                                {t.sessionTypes && t.sessionTypes.length > 0 ? `${t.sessionTypes.join(' & ')} Sessions` : 'Online & Phone Sessions'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-foreground/80 font-medium truncate">
                                                <div className="w-3.5 h-3.5 rounded-full bg-emerald-100/50 flex items-center justify-center shrink-0">
                                                    <span className="text-emerald-600 text-[9px] font-light">✓</span>
                                                </div>
                                                Speaks: {t.languages && t.languages.length > 0 ? t.languages.join(', ') : 'English, Hindi'}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {t.specialties.slice(0, 2).map(s => (
                                                <span key={s} className="px-2 py-0.5 rounded-md bg-secondary text-primary text-[9px] font-normal border border-primary/10">
                                                    {s}
                                                </span>
                                            ))}
                                            {t.specialties.length > 2 && (
                                                <span className="px-2 py-0.5 rounded-md bg-secondary text-primary text-[9px] font-normal border border-primary/10">
                                                    +{t.specialties.length - 2} More
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-auto pt-3 border-t border-border/40">
                                            <div className="flex items-center gap-1.5 mb-2.5 text-[10px] font-normal text-emerald-700 bg-emerald-50 w-fit px-2.5 py-1 rounded-md border border-emerald-100 shadow-[0_2px_8px_rgba(16,185,129,0.08)]">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                Available this week
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <span className="text-lg font-light text-foreground leading-none block">₹{t.price}</span>
                                                    <span className="text-[9px] font-normal text-muted-foreground uppercase tracking-wide block mt-0.5">/ session</span>
                                                </div>
                                                <NavButton href={`/therapists/${t._id}`} size="sm" className="rounded-full text-xs font-normal h-9 px-5 bg-primary text-white hover:bg-primary/90 shadow-sm shrink-0">
                                                    Book Session
                                                </NavButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 pt-8 pb-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage <= 1}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className="rounded-full px-4 h-9 text-xs font-normal"
                                >
                                    Previous
                                </Button>
                                <span className="text-xs text-muted-foreground font-medium px-2">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className="rounded-full px-4 h-9 text-xs font-normal"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* VALUE PROPOSITIONS */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-12 border-t border-border/40 pb-8">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h4 className="text-sm font-normal text-foreground mb-1">Flexible Scheduling</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Book sessions at your convenience</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <Video className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h4 className="text-sm font-normal text-foreground mb-1">Online Sessions</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Secure video sessions from the comfort of your home</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h4 className="text-sm font-normal text-foreground mb-1">Personalized Care</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Therapy tailored to your unique needs</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h4 className="text-sm font-normal text-foreground mb-1">Your Privacy Matters</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Your conversations are 100% confidential</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
