import dynamic from 'next/dynamic';
import { TherapistFiltersSkeleton } from '@/components/loading/skeletons';

const TherapistFilters = dynamic(() => import('./_components/TherapistFilters'), {
    loading: () => <TherapistFiltersSkeleton />,
});

export const metadata = {
    title: 'Find a Therapist | Rebalance',
    description: 'Discover the perfect professional for your needs.',
};

export default async function TherapistListingPage() {
    // Initial Server-Side Data Fetch
    let initialTherapists = [];
    let initialTotalPages = 1;
    let initialTotalItems = 0;

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/therapists?page=1&limit=10`, {
            next: { revalidate: 30 } // Cache base list for 30 seconds
        });
        
        if (response.ok) {
            const data = await response.json();
            initialTherapists = data.therapists || [];
            initialTotalPages = data.totalPages || 1;
            initialTotalItems = data.total || 0;
        }
    } catch (err) {
        console.error('Failed to prefetch therapists:', err);
    }

    return (
        <div className="min-h-[100dvh] flex flex-col font-sans bg-background">
            <main className="flex-1 w-full px-4 py-8 pt-24 sm:px-6 sm:py-16 sm:pt-32 lg:px-8 max-w-[1400px] mx-auto">
                <TherapistFilters 
                    initialTherapists={initialTherapists}
                    initialTotalPages={initialTotalPages}
                    initialTotalItems={initialTotalItems}
                />
            </main>
        </div>
    );
}
