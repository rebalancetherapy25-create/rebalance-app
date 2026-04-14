import { Skeleton } from '@/components/ui/skeleton';

export function AppRouteLoader() {
    return (
        <div className="min-h-[100dvh] bg-background px-4 py-24 sm:px-6 sm:py-28">
            <div className="mx-auto max-w-6xl space-y-10">
                <div className="space-y-5">
                    <Skeleton className="h-5 w-28 rounded-full" />
                    <Skeleton className="h-14 w-full max-w-3xl" />
                    <Skeleton className="h-5 w-full max-w-2xl" />
                    <Skeleton className="h-5 w-3/4 max-w-xl" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="rounded-[2rem] border border-white/70 bg-background/80 p-5 shadow-[0_20px_45px_-36px_rgba(74,35,52,0.32)]">
                            <Skeleton className="h-52 w-full rounded-[1.6rem]" />
                            <div className="mt-5 space-y-3">
                                <Skeleton className="h-5 w-2/3" />
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function FeaturedTherapistsSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[1.75rem] border border-border/40 bg-background p-3 shadow-sm">
                    <Skeleton className="h-56 w-full rounded-[1.35rem] sm:h-64" />
                    <div className="space-y-4 p-3 sm:p-4">
                        <div className="flex gap-2">
                            <Skeleton className="h-7 w-20 rounded-full" />
                            <Skeleton className="h-7 w-24 rounded-full" />
                        </div>
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <div className="flex items-center justify-between border-t border-border/40 pt-5">
                            <Skeleton className="h-7 w-24" />
                            <Skeleton className="h-11 w-24 rounded-xl" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function TherapistFiltersSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="space-y-12 md:space-y-16">
            <div className="max-w-4xl space-y-6 px-2">
                <Skeleton className="h-8 w-32 rounded-full" />
                <Skeleton className="h-16 w-full max-w-3xl" />
                <Skeleton className="h-6 w-full max-w-2xl" />
                <Skeleton className="h-6 w-5/6 max-w-xl" />
            </div>

            <div className="sticky top-20 z-30 -mx-4 border-y border-border/40 bg-background/80 px-4 py-4 backdrop-blur-2xl shadow-sm md:-mx-8 md:px-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-3">
                        <Skeleton className="h-14 w-full max-w-md rounded-full" />
                        <Skeleton className="hidden h-14 w-40 rounded-full sm:block" />
                    </div>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Skeleton className="h-12 w-52 rounded-full" />
                        <Skeleton className="h-12 w-40 rounded-full" />
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-4 w-28" />
                </div>
                <div className="grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: count }).map((_, index) => (
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
        </div>
    );
}

export function DashboardContentSkeleton() {
    return (
        <div className="flex-1 w-full space-y-6">
            <Skeleton className="h-7 w-52" />
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="rounded-2xl border border-border/50 bg-background p-6 shadow-sm">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-16 w-16 rounded-full" />
                                <div className="space-y-3">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-4 w-56" />
                                </div>
                            </div>
                            <Skeleton className="h-10 w-28 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="pt-6">
                <Skeleton className="h-7 w-40" />
            </div>
            <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="rounded-2xl border border-border/50 bg-background p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-6">
                            <div className="space-y-3">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-44" />
                            </div>
                            <Skeleton className="h-7 w-20 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function SettingsFormSkeleton() {
    return (
        <div className="flex-1 w-full space-y-8">
            <Skeleton className="h-12 w-full rounded-xl" />
            {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-border/50 bg-background p-6 shadow-sm">
                    <div className="mb-6 space-y-3 border-b border-border/50 pb-5">
                        <Skeleton className="h-7 w-40" />
                    </div>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                        <Skeleton className="h-11 w-36 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function BookingFlowSkeleton() {
    return (
        <div className="relative z-10 flex h-full w-full min-w-0 flex-col overflow-hidden bg-background lg:min-h-[550px] lg:flex-row lg:rounded-[1.5rem] lg:border lg:border-border/10 lg:bg-background/80 lg:shadow-[0_32px_80px_rgba(0,0,0,0.1)]">
            <div className="w-full bg-primary p-4 text-background lg:w-[240px] lg:p-8">
                <div className="space-y-4">
                    <Skeleton className="h-6 w-24 bg-[linear-gradient(110deg,rgba(255,255,255,0.14),rgba(255,255,255,0.28),rgba(255,255,255,0.14))]" />
                    <Skeleton className="h-8 w-4/5 bg-[linear-gradient(110deg,rgba(255,255,255,0.14),rgba(255,255,255,0.28),rgba(255,255,255,0.14))]" />
                    <Skeleton className="h-4 w-2/3 bg-[linear-gradient(110deg,rgba(255,255,255,0.14),rgba(255,255,255,0.28),rgba(255,255,255,0.14))]" />
                </div>
                <div className="mt-8 flex gap-3 overflow-hidden lg:flex-col">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <Skeleton className="h-7 w-7 rounded-xl bg-[linear-gradient(110deg,rgba(255,255,255,0.14),rgba(255,255,255,0.28),rgba(255,255,255,0.14))]" />
                            <Skeleton className="hidden h-4 w-20 bg-[linear-gradient(110deg,rgba(255,255,255,0.14),rgba(255,255,255,0.28),rgba(255,255,255,0.14))] lg:block" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 bg-background/70 p-4 sm:p-6 lg:p-8">
                <div className="space-y-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <div className="mt-8 space-y-4">
                    <Skeleton className="h-12 w-full rounded-2xl" />
                    <div className="grid gap-3 sm:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} className="h-24 w-full rounded-2xl" />
                        ))}
                    </div>
                    <Skeleton className="h-40 w-full rounded-[1.5rem]" />
                </div>
            </div>
        </div>
    );
}
