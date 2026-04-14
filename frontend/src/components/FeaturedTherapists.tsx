'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

    if (error) return null; // Gracefully hide if error
    if (loading) return <FeaturedTherapistsSkeleton />;

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {therapists.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground italic">
                    Our specialists are coming soon.
                </div>
            ) : (
                therapists.map((t) => (
                    <Card key={t._id} className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-border/40 bg-background shadow-sm transition-all duration-300 hover:shadow-2xl">
                        <div className="relative h-56 overflow-hidden bg-muted sm:h-64">
                            {t.profileImage ? (
                                <Image src={t.profileImage} alt={t.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                    <User className="w-16 h-16 text-primary/20" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80"></div>
                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                <div className="min-w-0">
                                    <h3 className="truncate text-xl font-bold font-heading text-text-inverse sm:text-2xl">{t.name}</h3>
                                    <p className="text-sm text-text-inverse/90 font-medium">Therapist (Online)</p>
                                </div>
                                <div className="flex items-center gap-1 bg-text-inverse/20 backdrop-blur-md text-text-inverse px-3 py-1.5 rounded-xl text-sm font-bold border border-text-inverse/30">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {t.ratingAverage?.toFixed(1) || 'N/A'}
                                </div>
                            </div>
                        </div>
                        <CardContent className="flex flex-1 flex-col justify-between p-4 sm:p-6">
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {t.specialties.slice(0, 3).map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-wider">{tag}</span>
                                    ))}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                    {t.bio || `Specializing in ${t.specialties.join(', ')}. Book your session today.`}
                                </p>
                            </div>
                            <div className="mt-6 flex items-end justify-between gap-3 border-t border-border/40 pt-6">
                                <p className="text-lg font-black text-foreground sm:text-xl">₹{t.price} <span className="text-sm font-medium text-muted-foreground">/ session</span></p>
                                <div className="flex items-center gap-2">
                                    <div className="hidden items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary sm:flex">
                                        Top Rated
                                    </div>
                                    <Link href={`/therapists/${t._id}`}>
                                        <Button className="rounded-xl bg-primary px-5 font-bold text-text-inverse hover:bg-primary/90 sm:px-6">Book</Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}
