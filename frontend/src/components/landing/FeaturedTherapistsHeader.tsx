'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { FeaturedTherapistsSkeleton } from '@/components/loading/skeletons';

const FeaturedTherapists = dynamic(() => import('@/components/FeaturedTherapists'), {
    loading: () => <FeaturedTherapistsSkeleton />,
    ssr: false,
});

export function FeaturedTherapistsHeader() {
    return (
        <section className="py-12 md:py-16 px-6 bg-[#FDFBFB]">
            <div className="container mx-auto max-w-5xl">
                <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-display text-foreground leading-[1.1] text-balance">
                            Meet our <span className="italic text-accent">specialists</span>
                        </h2>
                        <p className="text-sm md:text-lg text-foreground/70 mt-3 md:mt-4 max-w-md mx-auto md:mx-0">
                            Experienced, empathetic professionals ready to support you.
                        </p>
                    </div>
                    <Link href="/therapists" className="hidden md:block">
                        <Button variant="outline" className="rounded-full h-12 px-8 font-medium text-sm border-primary/20 text-primary hover:bg-primary/5">
                            View All Therapists <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>

                <FeaturedTherapists />

                <div className="mt-8 md:hidden">
                    <Link href="/therapists">
                        <Button variant="outline" className="w-full rounded-full h-12 font-medium text-sm border-primary/20 text-primary hover:bg-primary/5">
                            View All Therapists
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}

