'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { NavButton } from '@/components/ui/nav-button';
import { FeaturedTherapistsSkeleton } from '@/components/loading/skeletons';
import { Star, User } from 'lucide-react';
import api from '@/lib/api';

interface Therapist {
    _id: string;
    name: string;
    specialties: string[];
    price: number;
    bio: string;
    profileImage?: string;
    ratingAverage: number;
}

export default function FeaturedTherapists() {
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchTherapists = async () => {
            try {
                setLoading(true);
                const response = await api.get('/therapists?limit=3');
                setTherapists(response.data.therapists || []);
                setError(false);
            } catch (err) {
                console.error('Failed to fetch featured therapists:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchTherapists();
    }, []);

    if (error) return null;
    if (loading) return <FeaturedTherapistsSkeleton />;

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {therapists.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground italic">
                    Our specialists are coming soon.
                </div>
            ) : (
                therapists.map((t) => (
                    <Card key={t._id} className="group flex flex-col overflow-hidden rounded-[2rem] border border-border/20 bg-[#FDFBFB] shadow-sm transition-all duration-300 hover:shadow-lg">
                        {/* Image Header */}
                        <div className="relative aspect-[1.35] overflow-hidden bg-muted w-full">
                            {t.profileImage ? (
                                <Image 
                                    src={t.profileImage} 
                                    alt={t.name} 
                                    fill 
                                    sizes="(max-width: 768px) 100vw, 33vw" 
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                    <User className="w-16 h-16 text-primary/20" />
                                </div>
                            )}
                            
                            {/* Subtle Image Vignette overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                            
                            {/* Badge: Top Rated */}
                            <div className="absolute top-4 left-4 z-10 flex items-center bg-primary text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                Top Rated
                            </div>
                            
                            {/* Badge: Star Rating */}
                            <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-md text-foreground px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 shadow-sm">
                                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500 pointer-events-none" /> 
                                <span>{t.ratingAverage?.toFixed(1) || '4.9'}</span>
                            </div>
                        </div>
                        
                        {/* Card Details */}
                        <CardContent className="flex flex-1 flex-col justify-between p-6 bg-[#FDFBFB]">
                            <div className="space-y-4">
                                {/* Name and Role */}
                                <div>
                                    <h3 className="text-xl font-display font-semibold text-foreground leading-tight tracking-tight">
                                        {t.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium">Therapist (Online)</p>
                                </div>

                                {/* Specialties Tags */}
                                <div className="flex flex-wrap gap-1.5">
                                    {t.specialties.slice(0, 3).map(tag => (
                                        <span key={tag} className="px-2.5 py-0.5 bg-accent/10 text-accent rounded-full text-[9px] font-bold uppercase tracking-wider">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Short Bio */}
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                    {t.bio || `I specialize in ${t.specialties.join(', ')} using evidence-based practices to support your mental health journey.`}
                                </p>
                            </div>
                            
                            {/* Bottom CTA & Price */}
                            <div className="mt-6 pt-5 border-t border-border/10 flex items-center justify-between gap-3">
                                <div className="shrink-0">
                                    <div className="flex items-baseline gap-0.5">
                                        <span className="text-sm font-bold text-[#581C2B]">₹</span>
                                        <span className="text-xl sm:text-[22px] font-bold font-display text-foreground leading-none">{t.price}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mt-0.5">/ session</span>
                                </div>
                                <NavButton href={`/therapists/${t._id}`} className="shrink-0 rounded-full bg-[#581C2B] hover:bg-[#461521] px-5 h-10 text-xs sm:text-sm font-bold text-white shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                                    Book Session
                                </NavButton>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}
