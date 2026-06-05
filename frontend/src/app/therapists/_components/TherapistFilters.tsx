"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { 
    User, Sparkles, Heart, Search, ChevronDown, 
    ShieldCheck, Lock, Calendar, Video, FileText, 
    Users, Clock, ChevronLeft, ChevronRight 
} from 'lucide-react';
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
    const [sortBy, setSortBy] = useState('Recommended');

    const [isInitialMount, setIsInitialMount] = useState(true);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Reset to page 1 when filters change
    useEffect(() => {
        if (!isInitialMount) setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availabilityFilter, sortBy]);

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
                const response = await api.get('/therapists', {
                    params: {
                        page: currentPage,
                        limit: 10,
                        ...(debouncedSearch && { search: debouncedSearch }),
                        ...(availabilityMap[availabilityFilter] && { availability: availabilityMap[availabilityFilter] }),
                        ...(sortMap[sortBy] && { sort: sortMap[sortBy] }),
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
    }, [currentPage, debouncedSearch, availabilityFilter, sortBy, isInitialMount]);

    const featuredTherapist = therapists.length > 0 ? therapists[0] : null;
    const gridTherapists = therapists.length > 0 ? therapists.slice(1) : [];

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
                        Browse licensed therapists specialized in anxiety, depression, relationships and more.
                    </p>
                    
                    <div className="flex flex-wrap gap-6 pt-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <span className="text-sm font-semibold text-foreground">Verified<br/>Therapists</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" />
                            <span className="text-sm font-semibold text-foreground">100%<br/>Confidential</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-primary" />
                            <span className="text-sm font-semibold text-foreground">Compassionate<br/>Care</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Featured Therapist */}
                <div className="relative flex flex-col h-full justify-end lg:items-end">
                    <div className="w-full flex justify-end mb-4">
                        <Link href="#all-therapists" className="text-sm font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all">
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
                                    <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow-sm">
                                        <span className="text-yellow-500">★</span> {featuredTherapist.ratingAverage.toFixed(1)}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col justify-center flex-1 space-y-4">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent font-bold text-[10px] tracking-widest uppercase w-fit">
                                    <Sparkles className="w-3 h-3" />
                                    Featured Therapist
                                </div>
                                
                                <div>
                                    <h3 className="text-2xl font-display font-medium text-foreground">{featuredTherapist.name}</h3>
                                    <p className="text-sm text-foreground/70">{featuredTherapist.specialties[0] || 'Clinical Psychologist'}</p>
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
                                        <span key={s} className="px-2.5 py-1 rounded-full bg-accent/5 text-accent text-xs font-semibold">
                                            {s}
                                        </span>
                                    ))}
                                    {featuredTherapist.specialties.length > 2 && (
                                        <span className="px-2.5 py-1 rounded-full bg-accent/5 text-accent text-xs font-semibold">
                                            +{featuredTherapist.specialties.length - 2} More
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 pt-2">
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        Available Today
                                    </div>
                                    <Button asChild className="rounded-full bg-primary hover:bg-primary/90">
                                        <Link href={`/therapists/${featuredTherapist._id}`}>
                                            <Calendar className="w-4 h-4 mr-2" /> Book Session
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* SEARCH AND FILTERS */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-border/60 mb-6 flex flex-col gap-4 mt-8">
                <div className="relative w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, specialty, or condition..."
                        className="h-14 rounded-full border-border/60 bg-secondary/50 pl-12 pr-6 text-base font-medium shadow-none focus-visible:ring-primary"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <div className="flex bg-secondary/50 p-1 rounded-full border border-border/40 shrink-0">
                        {['Any time', 'Today', 'This Week'].map(filter => {
                            const isSelected = availabilityFilter === filter;
                            return (
                                <button
                                    key={filter}
                                    onClick={() => setAvailabilityFilter(filter)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${isSelected
                                        ? 'bg-primary text-white'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {filter}
                                </button>
                            );
                        })}
                    </div>
                    
                    <select className="h-10 px-4 rounded-full border border-border/60 bg-white text-sm font-medium shadow-sm cursor-pointer outline-none hover:border-accent appearance-none">
                        <option>All Session Types</option>
                        <option>In-person</option>
                        <option>Online</option>
                    </select>
                    
                    <select className="h-10 px-4 rounded-full border border-border/60 bg-white text-sm font-medium shadow-sm cursor-pointer outline-none hover:border-accent appearance-none">
                        <option>All Genders</option>
                        <option>Female</option>
                        <option>Male</option>
                        <option>Non-binary</option>
                    </select>
                    
                    <select className="h-10 px-4 rounded-full border border-border/60 bg-white text-sm font-medium shadow-sm cursor-pointer outline-none hover:border-accent appearance-none">
                        <option>All Languages</option>
                        <option>English</option>
                        <option>Hindi</option>
                        <option>Spanish</option>
                    </select>
                    
                    <select className="h-10 px-4 rounded-full border border-border/60 bg-white text-sm font-medium shadow-sm cursor-pointer outline-none hover:border-accent appearance-none">
                        <option>Any Price Range</option>
                        <option>₹1000 - ₹2000</option>
                        <option>₹2000 - ₹3000</option>
                        <option>₹3000+</option>
                    </select>

                    <div className="relative shrink-0">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="appearance-none h-10 pl-4 pr-9 rounded-full border border-border/60 bg-white text-sm font-bold text-foreground outline-none transition-colors hover:border-accent shadow-sm cursor-pointer"
                        >
                            <option value="Recommended">Sort by: Recommended</option>
                            <option value="Price: Low to High">Price: Low to High</option>
                            <option value="Price: High to Low">Price: High to Low</option>
                            <option value="Rating: Highest">Rating: Highest</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                </div>
            </div>



            {/* TOP RATED THERAPISTS GRID */}
            <div id="all-therapists" className="min-h-[50vh]">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-foreground">Top Rated Therapists</h2>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="rounded-full w-8 h-8"
                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="rounded-full w-8 h-8"
                            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="space-y-4">
                                <Skeleton className="aspect-square w-full rounded-2xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-2/3" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-muted-foreground">{error}</div>
                ) : gridTherapists.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">No matches found.</div>
                ) : (
                    <>
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {gridTherapists.map((t) => (
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
                                            <h3 className="text-lg font-display font-bold text-foreground truncate flex items-center gap-2">
                                                {t.name}
                                                {t.ratingAverage > 0 && (
                                                    <span className="text-sm font-black text-foreground flex items-center bg-yellow-50 px-1.5 py-0.5 rounded-md border border-yellow-100/50"><span className="text-yellow-500 text-xs mr-0.5">★</span> {t.ratingAverage.toFixed(1)}</span>
                                                )}
                                            </h3>
                                            <p className="text-xs font-bold text-primary truncate">{t.specialties[0] || 'Clinical Psychologist'}</p>
                                        </div>
                                        
                                        <div className="space-y-1.5 mb-3">
                                            <div className="flex items-center gap-2 text-[11px] text-foreground/80 font-medium">
                                                <div className="w-3.5 h-3.5 rounded-full bg-emerald-100/50 flex items-center justify-center shrink-0">
                                                    <span className="text-emerald-600 text-[9px] font-black">✓</span>
                                                </div>
                                                5+ Years Experience
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-foreground/80 font-medium">
                                                <div className="w-3.5 h-3.5 rounded-full bg-emerald-100/50 flex items-center justify-center shrink-0">
                                                    <span className="text-emerald-600 text-[9px] font-black">✓</span>
                                                </div>
                                                1500+ Sessions
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-foreground/80 font-medium truncate">
                                                <div className="w-3.5 h-3.5 rounded-full bg-emerald-100/50 flex items-center justify-center shrink-0">
                                                    <span className="text-emerald-600 text-[9px] font-black">✓</span>
                                                </div>
                                                Speaks English, Hindi
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {t.specialties.slice(0, 2).map(s => (
                                                <span key={s} className="px-2 py-0.5 rounded-md bg-secondary text-primary text-[9px] font-bold border border-primary/10">
                                                    {s}
                                                </span>
                                            ))}
                                            {t.specialties.length > 2 && (
                                                <span className="px-2 py-0.5 rounded-md bg-secondary text-primary text-[9px] font-bold border border-primary/10">
                                                    +{t.specialties.length - 2} More
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-auto pt-3 border-t border-border/40">
                                            <div className="flex items-center gap-1.5 mb-2.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 w-fit px-2.5 py-1 rounded-md border border-emerald-100 shadow-[0_2px_8px_rgba(16,185,129,0.08)]">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                Available this week
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <span className="text-lg font-black text-foreground leading-none block">₹{t.price}</span>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block mt-0.5">/ session</span>
                                                </div>
                                                <Button asChild size="sm" className="rounded-full text-xs font-bold h-9 px-5 bg-primary text-white hover:bg-primary/90 shadow-sm shrink-0">
                                                    <Link href={`/therapists/${t._id}`}>Book Session</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {gridTherapists.length > 0 && (
                            <div className="pt-10 flex justify-center">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
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
                        <h4 className="text-sm font-bold text-foreground mb-1">Flexible Scheduling</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Book sessions at your convenience</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <Video className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground mb-1">Online Sessions</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Secure video sessions from the comfort of your home</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground mb-1">Personalized Care</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Therapy tailored to your unique needs</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground mb-1">Your Privacy Matters</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Your conversations are 100% confidential</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
