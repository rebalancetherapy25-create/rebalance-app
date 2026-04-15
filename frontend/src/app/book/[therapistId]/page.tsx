"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookingFlowSkeleton } from '@/components/loading/skeletons';
import { getApiBaseUrl, unwrapApiData } from '@/lib/runtime';

const BookingFlow = dynamic(() => import('@/components/booking/BookingFlow'), {
    loading: () => <BookingFlowSkeleton />,
});

interface TherapistForBooking {
    id: string;
    name: string;
    title: string;
    price: number;
    sessionTypes: string[];
    availability: { day: string; slots: string[] }[];
}

export default function BookingFlowPage({ params }: { params: { therapistId: string } }) {
    const [therapist, setTherapist] = useState<TherapistForBooking | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchTherapist = async () => {
            try {
                const res = await fetch(
                    `${getApiBaseUrl()}/therapists/${params.therapistId}`
                );
                if (res.ok) {
                    const data = unwrapApiData(await res.json());
                    setTherapist({
                        id: data._id,
                        name: data.name,
                        title: data.specialties?.[0] || 'Therapist',
                        price: data.price,
                        sessionTypes: data.sessionTypes || ['Video'],
                        availability: data.availability || []
                    });
                }
            } catch (error) {
                console.error('Failed to fetch therapist', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTherapist();
    }, [params.therapistId]);

    if (loading) {
        return (
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 font-sans sm:px-6 sm:py-12">
                <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-accent/5 blur-[120px]" />
                <div className="relative z-10 w-full max-w-[850px]">
                    <BookingFlowSkeleton />
                </div>
            </div>
        );
    }

    if (!therapist) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-xl text-muted-foreground font-heading italic">Therapist not found</p>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 font-sans sm:px-6 sm:py-12">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full animate-pulse delay-700"></div>

            <div className="relative z-10 w-full max-w-[850px] animate-in fade-in zoom-in-95 duration-700">
                <BookingFlow
                    therapistId={therapist.id}
                    therapistName={therapist.name}
                    specialty={therapist.title}
                    price={therapist.price}
                    sessionTypes={therapist.sessionTypes}
                    availability={therapist.availability}
                    onComplete={() => router.push(`/therapists/${therapist.id}`)}
                />
            </div>
        </div>
    );
}
