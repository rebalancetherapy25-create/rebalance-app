import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Video, Star, ShieldCheck, ChevronRight, Sparkles, MessageCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookingModal from '@/components/booking/BookingModal';
import { getApiBaseUrl, unwrapApiData } from '@/lib/runtime';

interface FAQ {
    question: string;
    answer: string;
}

interface Availability {
    day: string;
    slots: string[];
}

interface TherapistDetail {
    id: string;
    name: string;
    title: string;
    rating: number;
    ratingCount: number;
    price: number;
    tags: string[];
    languages: string[];
    sessionTypes: string[];
    responseRate: number;
    totalSessions: number;
    exp: string;
    bio: string;
    profileImage?: string;
    credentials: string[];
    faq: FAQ[];
    availability: Availability[];
    joinedDate: string;
}

const fetchTherapist = async (id: string) => {
    try {
        const res = await fetch(`${getApiBaseUrl()}/therapists/${id}`, { next: { revalidate: 0 } });
        if (!res.ok) return null;
        return unwrapApiData(await res.json());
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Failed to fetch therapist details', error);
        }
        return null;
    }
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    try {
        const data = await fetchTherapist(params.id);
        if (!data) {
            return {
                title: 'Therapist Not Found | Rebalance',
                description: 'Browse verified therapists on Rebalance.',
            };
        }

        const title = `${data.name} | ${data.specialties?.[0] || 'Therapist'} | Rebalance`;
        const description = `${data.name} helps with ${(data.specialties || []).slice(0, 3).join(', ') || 'mental wellbeing'}. View credentials, availability, session formats, and book securely on Rebalance.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'profile',
                images: data.profileImage ? [{ url: data.profileImage }] : undefined,
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: data.profileImage ? [data.profileImage] : undefined,
            },
        };
    } catch {
        return {
            title: 'Therapist Profile | Rebalance',
            description: 'View therapist credentials, availability, and secure booking details on Rebalance.',
        };
    }
}

export default async function TherapistProfilePage({ params }: { params: { id: string } }) {
    let t: TherapistDetail | null = null;

    // Fetch main therapist
    try {
        const data = await fetchTherapist(params.id);
        if (data) {
            t = {
                id: data._id,
                name: data.name,
                title: data.specialties?.[0] || 'Therapist',
                rating: data.ratingAverage,
                ratingCount: data.ratingCount,
                price: data.price,
                tags: data.specialties || [],
                languages: data.languages || ['English'],
                sessionTypes: data.sessionTypes || ['Video'],
                responseRate: data.responseRate || 100,
                totalSessions: data.totalSessions || 0,
                exp: `${data.experienceYears} yrs`,
                bio: data.bio,
                profileImage: data.profileImage,
                credentials: data.credentials
                    ? data.credentials.split(',').map((c: string) => c.trim())
                    : [],
                faq: data.faq || [],
                availability: data.availability || [],
                joinedDate: new Intl.DateTimeFormat('en-US', {
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'UTC',
                }).format(new Date(data.createdAt)),
            };
        }
    } catch {
    }

    if (!t) {
        return <div className="min-h-[100dvh] bg-background flex items-center justify-center text-xl text-muted-foreground font-display">Therapist not found.</div>;
    }

    const initials = t.name
        .split(' ')
        .map((part: string) => part[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    const primaryAvailability = t.availability.slice(0, 4);
    const bookingProps = {
        therapistId: t.id,
        therapistName: t.name,
        specialty: t.title,
        price: t.price,
        sessionTypes: t.sessionTypes,
        availability: t.availability,
    };

    return (
        <div className="min-h-[100dvh] bg-background font-sans pb-32">
            {/* MINIMAL BREADCRUMB */}
            <div className="border-b border-border/40">
                <div className="mx-auto max-w-[1400px] px-6 lg:px-8 py-5 pt-20 sm:pt-28">
                    <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
                        <ChevronRight className="h-3 w-3" />
                        <Link href="/therapists" className="hover:text-foreground transition-colors">Network</Link>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-foreground">{t.name}</span>
                    </nav>
                </div>
            </div>

            <main className="mx-auto max-w-[1400px] px-6 lg:px-8 mt-12 sm:mt-20">
                <div className="grid xl:grid-cols-[1fr_400px] gap-16 lg:gap-24 items-start">
                    
                    {/* LEFT COLUMN: EDITORIAL SPREAD */}
                    <div className="space-y-24 sm:space-y-32">
                        
                        {/* HERO HEADER */}
                        <header className="space-y-12">
                            <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
                                {/* Editorial Portrait */}
                                <div className="relative shrink-0 w-full md:w-[280px] lg:w-[320px] aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-accent/5 border border-border/40 shadow-sm">
                                    {t.profileImage ? (
                                        <Image
                                            src={t.profileImage}
                                            alt={`Photo of ${t.name}`}
                                            fill
                                            priority
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10">
                                            <span className="text-6xl font-display font-bold text-primary/20">{initials}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Title & Meta */}
                                <div className="flex-1 space-y-8 pt-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-700">
                                            <ShieldCheck className="h-4 w-4" />
                                            Verified
                                        </span>
                                        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-accent/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            <MessageCircle className="h-4 w-4 text-accent" />
                                            Fast Responder
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <h1 className="text-5xl sm:text-6xl lg:text-[5rem] font-display leading-[0.9] tracking-tight text-foreground">
                                            {t.name}
                                        </h1>
                                        <p className="text-2xl text-muted-foreground font-medium">
                                            {t.title}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-6 pt-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Experience</p>
                                            <p className="text-xl font-display font-medium text-foreground">{t.exp}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rating</p>
                                            <div className="flex items-center gap-2">
                                                <Star className="h-5 w-5 fill-accent text-accent" />
                                                <span className="text-xl font-display font-medium text-foreground">{t.rating}</span>
                                                <span className="text-sm font-medium text-muted-foreground">({t.ratingCount})</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sessions</p>
                                            <p className="text-xl font-display font-medium text-foreground">{t.totalSessions}+</p>
                                        </div>
                                    </div>
                                    
                                    {t.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-4">
                                            {t.tags.map((tag: string) => (
                                                <span
                                                    key={tag}
                                                    className="rounded-full border border-border/50 bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </header>

                        {/* ABOUT SECTION */}
                        <section className="space-y-8 border-t-2 border-primary/20 pt-16">
                            <h2 className="text-4xl lg:text-5xl font-display text-foreground">The Approach.</h2>
                            <p className="max-w-3xl text-xl sm:text-2xl leading-[1.6] text-muted-foreground font-medium">
                                {t.bio}
                            </p>
                        </section>

                        {/* CAPABILITIES & DETAILS */}
                        <section className="grid sm:grid-cols-2 gap-12 sm:gap-16 border-t-2 border-primary/20 pt-16">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-display flex items-center gap-3">
                                    <Video className="h-6 w-6 text-accent" />
                                    Session Formats
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {t.sessionTypes.map((type) => (
                                        <span key={type} className="px-5 py-3 rounded-2xl bg-accent/5 border border-accent/10 font-bold text-foreground">
                                            {type}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-2xl font-display flex items-center gap-3">
                                    <Sparkles className="h-6 w-6 text-accent" />
                                    Languages
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {t.languages.map((lang) => (
                                        <span key={lang} className="px-5 py-3 rounded-2xl bg-primary/5 border border-primary/10 font-bold text-foreground">
                                            {lang}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* AVAILABILITY PREVIEW */}
                        <section className="space-y-10 border-t-2 border-primary/20 pt-16">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-4xl lg:text-5xl font-display text-foreground">Upcoming Availability.</h2>
                                    <p className="mt-4 text-lg text-muted-foreground font-medium">Clear, immediate slots for a frictionless process.</p>
                                </div>
                            </div>

                            {primaryAvailability.length > 0 ? (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    {primaryAvailability.map((day) => (
                                        <div key={day.day} className="space-y-4">
                                            <div className="flex justify-between items-center border-b border-border/60 pb-3">
                                                <h3 className="font-bold text-foreground">{day.day}</h3>
                                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{day.slots.length} slots</span>
                                            </div>
                                            {day.slots.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {day.slots.map((slot) => (
                                                        <span
                                                            key={slot}
                                                            className="h-12 flex items-center justify-center rounded-xl border border-border/60 bg-background text-sm font-bold text-foreground"
                                                        >
                                                            {slot}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-6 text-center text-sm font-medium italic text-muted-foreground bg-accent/5 rounded-xl border border-dashed border-border/60">
                                                    Fully booked
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-lg font-medium text-muted-foreground bg-accent/5 rounded-[2rem] border border-dashed border-border/60">
                                    Availability will appear here once new slots are opened.
                                </div>
                            )}
                        </section>

                        {/* CREDENTIALS */}
                        {t.credentials.length > 0 && (
                            <section className="space-y-8 border-t-2 border-primary/20 pt-16">
                                <h2 className="text-4xl lg:text-5xl font-display text-foreground">Credentials.</h2>
                                <div className="grid sm:grid-cols-2 gap-6">
                                    {t.credentials.map((cred: string, i: number) => (
                                        <div key={i} className="flex items-start gap-4">
                                            <ShieldCheck className="h-6 w-6 text-accent shrink-0 mt-0.5" />
                                            <span className="text-lg font-medium text-muted-foreground leading-relaxed">{cred}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        
                        {/* REVIEWS GRID */}
                        {t.ratingCount > 0 && (
                            <section className="space-y-10 border-t-2 border-primary/20 pt-16">
                                <div>
                                    <h2 className="text-4xl lg:text-5xl font-display text-foreground">Patient Stories.</h2>
                                    <p className="mt-4 text-lg text-muted-foreground font-medium">Reflections from verified sessions.</p>
                                </div>
                                <div className="py-12 text-center text-lg font-medium text-muted-foreground bg-accent/5 rounded-[2rem] border border-dashed border-border/60">
                                    Reviews are visible after your first session.
                                </div>
                            </section>
                        )}
                    </div>

                    {/* RIGHT COLUMN: STICKY BOOKING CONCIERGE */}
                    <aside className="relative hidden xl:block">
                        <div className="sticky top-28 space-y-6 w-full">
                            <div className="overflow-hidden rounded-[2.5rem] border border-border/40 bg-background shadow-xl">
                                <div className="bg-primary px-8 py-10 text-center text-background relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-2xl rounded-full -mr-16 -mt-16"></div>
                                    <p className="mb-3 text-sm font-bold uppercase tracking-widest text-background/80">Session Investment</p>
                                    <h3 className="text-6xl font-display font-medium relative z-10">
                                        ₹{t.price}
                                        <span className="text-xl font-sans font-bold text-background/60 ml-2">/ hr</span>
                                    </h3>
                                </div>
                                <div className="space-y-8 p-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-base">
                                            <span className="text-muted-foreground font-medium">Platform matching</span>
                                            <span className="font-bold text-emerald-600">Free</span>
                                        </div>
                                        <div className="flex justify-between items-center text-base">
                                            <span className="text-muted-foreground font-medium">Session type</span>
                                            <span className="font-bold text-foreground">{t.sessionTypes[0] || '1:1 Video'}</span>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-accent/10 px-5 py-4 flex items-start gap-4 border border-accent/20">
                                        <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                                            Your first 15-minute introductory session is completely free.
                                        </p>
                                    </div>

                                    <BookingModal
                                        {...bookingProps}
                                        trigger={
                                            <Button className="h-16 w-full rounded-2xl bg-foreground text-background hover:bg-foreground/90 text-lg font-bold shadow-2xl transition-transform hover:scale-[1.02] duration-300">
                                                Book Introductory Session
                                            </Button>
                                        }
                                    />

                                    <div className="flex items-start gap-3 justify-center text-center">
                                        <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <p className="text-xs font-semibold text-muted-foreground leading-relaxed max-w-[200px]">
                                            Secure, encrypted booking. No credit card required to match.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* MOBILE PERSISTENT BOOKING BAR */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-background/90 px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-2xl xl:hidden">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Fee</p>
                        <p className="text-2xl font-display font-medium text-foreground">
                            ₹{t.price}<span className="text-sm font-sans font-bold text-muted-foreground ml-1">/hr</span>
                        </p>
                    </div>
                    <BookingModal
                        {...bookingProps}
                        trigger={
                            <Button className="h-14 flex-1 rounded-2xl bg-foreground text-background text-base font-bold shadow-xl">
                                Book Intro Session
                            </Button>
                        }
                    />
                </div>
            </div>
        </div>
    );
}
