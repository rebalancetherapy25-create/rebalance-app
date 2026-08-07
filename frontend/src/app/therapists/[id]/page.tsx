import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
    Star, ChevronRight,
    Zap, Lock, Check, Award, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookingModal from '@/components/booking/BookingModal';
import { getApiBaseUrl, unwrapApiData } from '@/lib/runtime';
import TherapistProfileTabs from './_components/TherapistProfileTabs';

interface FAQ {
    question: string;
    answer: string;
}

interface Availability {
    day: string;
    slots: string[];
}

interface WeeklyAvailability {
    dayOfWeek: number;
    slots: string[];
}

interface ReviewItem {
    stars: number;
    quote: string;
    author: string;
    status: string;
    createdAt?: string;
}

interface TherapistDetail {
    id: string;
    name: string;
    title: string;
    quote: string;
    gender: string;
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
    weeklyAvailability?: WeeklyAvailability[];
    joinedDate: string;
    reviews: ReviewItem[];
}

const fetchTherapist = async (id: string) => {
    try {
        const res = await fetch(`${getApiBaseUrl()}/therapists/${id}`, { cache: 'no-store', next: { revalidate: 0 } });
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

// Rolling 5-day calendar slot utility
const getNext5Days = (availability: Availability[] = [], weeklyAvailability: WeeklyAvailability[] = []) => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const result = [];
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
        const nextDate = new Date();
        nextDate.setDate(today.getDate() + i);
        
        const dayIndex = nextDate.getDay();
        const dayName = daysOfWeek[dayIndex];
        const shortDayName = shortDays[dayIndex];
        const dateNum = nextDate.getDate();
        const monthName = months[nextDate.getMonth()];
        
        // Match modern numerical weeklyAvailability first, fallback to legacy weekday string
        let match: WeeklyAvailability | Availability | undefined = weeklyAvailability?.find((a) => Number(a?.dayOfWeek) === dayIndex);
        if (!match || !match.slots) {
            match = availability?.find((a) => String(a?.day || '').toLowerCase() === String(dayName || '').toLowerCase());
        }
        const slots = Array.isArray(match?.slots) ? match.slots : [];
        
        let label = shortDayName;
        if (i === 0) label = 'Today';
        else if (i === 1) label = 'Tomorrow';
        
        result.push({
            dateLabel: `${monthName} ${dateNum}`,
            dayLabel: label,
            slots: slots.slice(0, 3), // Limit to 3 slots for tight display
            totalSlots: slots.length
        });
    }
    
    return result;
};

export default async function TherapistProfilePage({ params }: { params: { id: string } }) {
    let t: TherapistDetail | null = null;

    try {
        const data = await fetchTherapist(params.id);
        if (data) {
            const rawReviews = Array.isArray(data.reviews) ? data.reviews : [];
            const mappedReviews: ReviewItem[] = rawReviews.map((r: Record<string, unknown>) => ({
                stars: Number(r.rating) || 5,
                quote: String(r.comment || '').trim(),
                author: String(r.reviewerName || 'Verified Patient'),
                status: String(r.status || 'Verified Patient'),
                createdAt: r.createdAt
            }));

            t = {
                id: data._id,
                name: data.name,
                title: data.specialties?.[0] || 'Clinical Psychologist',
                quote: data.quote || 'Guiding you towards emotional balance & mindful living.',
                gender: data.gender || 'Female',
                rating: Number(data.ratingAverage) || 0,
                ratingCount: Number(data.ratingCount) || mappedReviews.length,
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
                    ? data.credentials.split(',').map((c: string) => c.trim()).filter(Boolean)
                    : [],
                faq: data.faq || [],
                availability: data.availability || [],
                weeklyAvailability: data.weeklyAvailability || [],
                joinedDate: new Intl.DateTimeFormat('en-US', {
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'UTC',
                }).format(new Date(data.createdAt)),
                reviews: mappedReviews,
            };
        }
    } catch (err) {
        console.error('Error binding therapist details:', err);
    }

    if (!t) {
        return (
            <div className="min-h-[100dvh] bg-background flex items-center justify-center text-xl text-muted-foreground font-display">
                Therapist profile could not be found.
            </div>
        );
    }

    const initials = t.name
        .split(' ')
        .map((part: string) => part[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
        
    const bookingProps = {
        therapistId: t.id,
        therapistName: t.name,
        specialty: t.title,
        price: t.price,
        sessionTypes: t.sessionTypes,
        availability: t.availability,
    };

    const calendarDays = getNext5Days(t.availability, t.weeklyAvailability);

    return (
        <div className="min-h-screen bg-background font-sans pb-32 sm:pb-36 relative overflow-x-hidden">
            
            {/* Premium Soft Background Mesh Glow */}
            <div className="absolute top-0 inset-x-0 h-[640px] bg-gradient-to-b from-secondary/90 via-background/50 to-transparent pointer-events-none -z-10" />

            {/* Breadcrumb Navigation - Pushed down to clear the fixed global navbar */}
            <div className="mx-auto max-w-7xl px-6 sm:px-8 pt-24 sm:pt-28">
                <nav className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-muted-foreground/60">
                    <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                    <Link href="/therapists" className="hover:text-primary transition-colors">Therapists</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                    <span className="text-foreground/85 font-medium truncate max-w-[200px]">{t.name}</span>
                </nav>
            </div>

            {/* Main Page Layout Container */}
            <main className="mx-auto max-w-7xl px-6 sm:px-8 mt-6 sm:mt-10">
                <div className="grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-10 xl:gap-16 items-start relative z-10">
                    
                    {/* LEFT COLUMN: Luxurious Editorial Display Content */}
                    <div className="space-y-8 min-w-0 w-full">
                        
                        {/* Section 1: Hero Modern Card UI Block */}
                        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 md:p-10 border border-primary/10 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
                            {/* Subtle decorative background gradient accent */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-accent/10 via-primary/5 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-left relative z-10">
                                
                                {/* Elegant Profile Avatar with status indicator */}
                                <div className="relative shrink-0 w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-3xl border-2 border-white shadow-xl bg-secondary p-1.5 overflow-hidden group">
                                    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-accent/5">
                                        {t.profileImage ? (
                                            <Image
                                                src={t.profileImage}
                                                alt={`Portrait of ${t.name}`}
                                                fill
                                                priority
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-primary/20">
                                                <span className="text-3xl sm:text-4xl font-display font-bold text-primary/40">{initials}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Status dot */}
                                    <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-md flex items-center justify-center" title="Available Today">
                                        <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                                        <span className="relative w-2 h-2 rounded-full bg-emerald-500"></span>
                                    </div>
                                </div>

                                {/* Detailed descriptive labels & hierarchy */}
                                <div className="flex-1 min-w-0 space-y-4">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-800 border border-emerald-500/20">
                                            <Check className="h-3 w-3 stroke-[3]" />
                                            Verified Expert
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-accent border border-accent/20">
                                            <Zap className="h-3 w-3 fill-accent" />
                                            Top Practitioner
                                        </span>
                                    </div>

                                    {/* Name & Quote below name */}
                                    <div className="space-y-1.5">
                                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold leading-tight text-foreground">
                                            {t.name}
                                        </h1>
                                        {t.quote && (
                                            <p className="text-xs sm:text-sm text-accent font-semibold italic leading-relaxed pt-0.5">
                                                &ldquo;{t.quote.replace(/"/g, '')}&rdquo;
                                            </p>
                                        )}
                                    </div>

                                    {/* Headline & Credentials moved below headline */}
                                    <div className="space-y-2.5 pt-1">
                                        <p className="text-sm sm:text-base text-muted-foreground font-extrabold tracking-wide">
                                            {t.title}
                                        </p>
                                        
                                        {t.credentials.length > 0 && (
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-0.5">
                                                {t.credentials.map((cred: string, idx: number) => (
                                                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/15 shadow-2xs hover:bg-primary/15 transition-colors">
                                                        <Award className="h-3.5 w-3.5 text-primary shrink-0" />
                                                        {cred}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats & Gender Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-t border-b border-primary/10 my-2 text-center md:text-left">
                                        {/* Rating & Review Count */}
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Rating</p>
                                            {t.reviews.length === 0 ? (
                                                <div className="text-xs font-bold text-muted-foreground/80 bg-secondary px-2.5 py-1 rounded-lg inline-block md:block border border-border/40 w-fit mx-auto md:mx-0">
                                                    No Reviews Yet
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="flex items-center justify-center md:justify-start gap-1">
                                                        <span className="text-sm sm:text-base font-extrabold text-foreground">{t.rating.toFixed(1)}/5</span>
                                                        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground font-bold">({t.ratingCount} {t.ratingCount === 1 ? 'Review' : 'Reviews'})</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Gender */}
                                        <div className="space-y-1 border-l border-primary/5 pl-3">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center md:justify-start gap-1">
                                                <User className="w-2.5 h-2.5 text-accent" /> Gender
                                            </p>
                                            <p className="text-sm sm:text-base font-extrabold text-foreground capitalize">{t.gender || 'Female'}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold">Verified Profile</p>
                                        </div>

                                        {/* Sessions */}
                                        <div className="space-y-1 border-l border-primary/5 pl-3">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Sessions</p>
                                            <p className="text-sm sm:text-base font-extrabold text-foreground">{t.totalSessions || '500'}+</p>
                                            <p className="text-[10px] text-muted-foreground font-bold">Hours Led</p>
                                        </div>

                                        {/* Practice */}
                                        <div className="space-y-1 border-l border-primary/5 pl-3">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Experience</p>
                                            <p className="text-sm sm:text-base font-extrabold text-foreground">{t.exp.replace(' yrs', '')}+ Yrs</p>
                                            <p className="text-[10px] text-muted-foreground font-bold">In Practice</p>
                                        </div>
                                    </div>

                                    {/* Specialties Tag pills */}
                                    <div className="flex flex-wrap justify-center md:justify-start gap-1.5 pt-1">
                                        {t.tags.map((tag: string) => (
                                            <span key={tag} className="px-3.5 py-1.5 rounded-full border border-primary/10 bg-secondary/60 text-xs font-bold text-foreground/85 shadow-2xs hover:border-primary/20 transition-all">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Booking card directly visible in mobile flow */}
                        <div className="lg:hidden bg-white rounded-[2rem] p-6 border border-primary/10 shadow-lg space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-display font-medium text-foreground leading-none">
                                    ₹{t.price}
                                    <span className="text-xs font-sans font-bold text-muted-foreground ml-1">/ hour</span>
                                </h3>
                                <div className="space-y-0.5 text-right">
                                    <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">Formats: <span className="font-bold text-foreground">Video & Audio</span></p>
                                </div>
                            </div>
                            
                            <BookingModal
                                {...bookingProps}
                                trigger={
                                    <Button className="h-12 w-full rounded-full bg-primary hover:bg-primary/95 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-[0.98]">
                                        Schedule Session
                                    </Button>
                                }
                            />
                            
                            <div className="flex items-center gap-2 justify-center text-center">
                                <Lock className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none">
                                    Secure, encrypted bookings. Reschedule or cancel anytime.
                                </p>
                            </div>
                        </div>

                        {/* Interactive Tabbed Content (Reduces vertical height significantly) */}
                        <TherapistProfileTabs
                            bio={t.bio}
                            languages={t.languages}
                            credentials={t.credentials}
                            calendarDays={calendarDays}
                            patientStories={t.reviews}
                            bookingProps={bookingProps}
                            faq={t.faq}
                        />
                    </div>

                    {/* RIGHT COLUMN: Sticky Session Booking Concierge Card (Desktop Only) */}
                    <aside className="sticky top-28 hidden lg:block w-full">
                        <div className="overflow-hidden rounded-[2.5rem] border border-primary/10 bg-white shadow-xl transition-all duration-300 hover:shadow-2xl">
                            
                            {/* Premium Session pricing banner */}
                            <div className="bg-primary px-8 py-8 text-center text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/25 blur-xl rounded-full -mr-10 -mt-10"></div>
                                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 blur-xl rounded-full"></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Hourly Investment</p>
                                <h3 className="text-4xl font-display font-medium text-white mt-1.5 relative z-10">
                                    ₹{t.price}
                                    <span className="text-base font-sans font-bold text-white/60 ml-1">/ hour</span>
                                </h3>
                            </div>
                            
                            {/* Details session scheduler body */}
                            <div className="space-y-5 p-7">
                                <div className="space-y-3.5 border-b border-primary/5 pb-4">
                                    <div className="flex justify-between items-center text-xs font-semibold">
                                        <span className="text-muted-foreground">Platform Provider</span>
                                        <span className="font-bold text-foreground">Rebalance Verified</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-semibold">
                                        <span className="text-muted-foreground">Formats</span>
                                        <span className="font-bold text-foreground">Video & Audio Calls</span>
                                    </div>
                                </div>

                                {/* Call to action booking trigger */}
                                <BookingModal
                                    {...bookingProps}
                                    trigger={
                                        <Button className="h-14 w-full rounded-full bg-primary hover:bg-primary/95 text-xs sm:text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-primary/20 duration-200">
                                            Schedule Session
                                        </Button>
                                    }
                                />

                                {/* Extra security policy elements */}
                                <div className="space-y-2 pt-3 border-t border-primary/5">
                                    <div className="flex items-center gap-2 justify-center text-center">
                                        <Lock className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 leading-none">
                                            Secure, 256-bit encrypted bookings
                                        </p>
                                    </div>
                                    <p className="text-[9px] text-center text-muted-foreground/60 font-semibold leading-normal">
                                        Reschedule or cancel freely up to 24 hours prior.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* PERSISTENT STICKY BOTTOM BAR FOR MOBILE */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-white/95 px-6 pb-[calc(1.2rem+env(safe-area-inset-bottom))] pt-3.5 backdrop-blur-md lg:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.06)] flex items-center justify-between">
                <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Verified Care</p>
                    <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-[10px] text-muted-foreground font-semibold truncate max-w-[150px] sm:max-w-xs">Complimentary 15-min call</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    <p className="text-base font-extrabold text-foreground">
                        ₹{t.price}<span className="text-xs text-muted-foreground font-semibold">/hr</span>
                    </p>
                    <BookingModal
                        {...bookingProps}
                        trigger={
                            <Button className="h-11 rounded-full bg-primary hover:bg-primary/95 text-xs font-bold text-white px-5 shadow-md active:scale-[0.98] transition-transform">
                                Book Intro Call
                            </Button>
                        }
                    />
                </div>
            </div>
        </div>
    );
}
