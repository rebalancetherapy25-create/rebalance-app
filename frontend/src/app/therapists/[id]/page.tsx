import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
    Star, ChevronRight, ChevronLeft,
    Zap, Lock, Check, User, Calendar, Video,
    Briefcase, Brain, Frown, Sparkles, Flower2, Sun, CloudRain, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookingModal from '@/components/booking/BookingModal';
import { getApiBaseUrl, unwrapApiData } from '@/lib/runtime';
import TherapistProfileTabs from './_components/TherapistProfileTabs';
import { TherapyHeadIllustration } from './_components/TherapyHeadIllustration';

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
                gender: data.gender || 'Not Specified',
                rating: Number(data.ratingAverage) || 0,
                ratingCount: Number(data.ratingCount) || mappedReviews.length,
                price: data.price,
                tags: data.specialties || [],
                languages: data.languages || ['English'],
                sessionTypes: data.sessionTypes && data.sessionTypes.length > 0 ? data.sessionTypes : ['Video'],
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
        <div className="min-h-screen bg-[#FDFBFB] font-sans pb-28 lg:pb-36 relative overflow-x-hidden">
            
            {/* Breadcrumb Navigation */}
            <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-24 sm:pt-28">
                <nav className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-muted-foreground">
                    <Link
                        href="/therapists"
                        className="w-8 h-8 rounded-full bg-[#FAF0F2] border border-[#EED7DC] flex items-center justify-center text-foreground hover:bg-[#F3E2E6] transition-colors shrink-0"
                        title="Back to Therapists"
                    >
                        <ChevronLeft className="w-4 h-4 text-[#581C2B]" />
                    </Link>
                    <Link href="/" className="hover:text-[#581C2B] transition-colors">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <Link href="/therapists" className="hover:text-[#581C2B] transition-colors">Therapists</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <span className="text-foreground font-semibold truncate max-w-[240px]">{t.name}</span>
                </nav>
            </div>

            {/* Main Page Layout Container */}
            <main className="mx-auto max-w-7xl px-4 sm:px-8 mt-6 sm:mt-8">
                <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_390px] gap-8 xl:gap-12 items-start relative z-10">
                    
                    {/* LEFT COLUMN: Main Profile Content & Cards matching design mockup */}
                    <div className="space-y-6 sm:space-y-8 min-w-0 w-full">
                        
                        {/* Section 1: Main Profile Card */}
                        <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 border border-[#F0ECEE] shadow-[0_10px_35px_rgba(0,0,0,0.03)] relative overflow-hidden transition-all duration-300">
                            {/* Decorative background blush circle */}
                            <div className="absolute -top-12 -left-12 w-52 h-52 bg-[#F9EAEF] rounded-full blur-2xl pointer-events-none opacity-80" />
                            
                            {/* Top-right sketched botanical branch */}
                            <svg className="absolute top-4 right-4 w-24 h-28 pointer-events-none opacity-80" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M75 10C70 30 80 60 92 90" stroke="#D9B8C2" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M72 30C62 25 56 34 66 42C76 42 77 35 72 30Z" fill="#E8C5CF" />
                                <path d="M78 55C88 50 94 58 87 66C80 66 78 60 78 55Z" fill="#E8C5CF" />
                                <path d="M82 80C72 75 66 84 76 92C86 92 86 85 82 80Z" fill="#E8C5CF" />
                            </svg>

                            {/* Sketched outline heart on right */}
                            <svg className="absolute top-32 right-10 w-14 h-12 pointer-events-none opacity-60" viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M45 15C42 5 32 5 28 12C24 5 14 5 11 15C7 26 28 42 28 42C28 42 49 26 45 15Z" stroke="#D9B8C2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M28 42C35 44 48 40 55 35" stroke="#D9B8C2" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1 3" />
                            </svg>

                            <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-center md:items-start text-center md:text-left relative z-10">
                                
                                {/* Circular Avatar with halo ring and online dot */}
                                <div className="relative shrink-0 w-36 h-36 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-md ring-8 ring-[#F8E7ED] flex items-center justify-center overflow-hidden bg-[#FAF0F2]">
                                    {t.profileImage ? (
                                        <Image
                                            src={t.profileImage}
                                            alt={`Portrait of ${t.name}`}
                                            fill
                                            priority
                                            className="object-cover transition-transform duration-500 hover:scale-105"
                                        />
                                    ) : (
                                        <span className="text-4xl sm:text-5xl font-display font-medium text-[#581C2B] tracking-tight">{initials}</span>
                                    )}
                                    
                                    {/* Status dot */}
                                    <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-[#10B981] border-2 border-white shadow-sm" title="Available Today" />
                                </div>

                                {/* Profile Header Information */}
                                <div className="flex-1 min-w-0 space-y-3 sm:space-y-3.5">
                                    
                                    {/* Top Badges */}
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F7ED] px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#166534] border border-[#C5E8D0]">
                                            <Check className="h-3 w-3 stroke-[3]" />
                                            VERIFIED EXPERT
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF2F4] px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#A03048] border border-[#FAD6DD]">
                                            <Zap className="h-3 w-3 fill-[#A03048]" />
                                            TOP PRACTITIONER
                                        </span>
                                    </div>

                                    {/* Name, Credential & Quote */}
                                    <div className="space-y-1">
                                        <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-display font-bold leading-tight text-[#1E1417]">
                                            {t.name}
                                        </h1>
                                        <p className="text-sm sm:text-base text-muted-foreground font-medium">
                                            {t.credentials.length > 0 ? t.credentials.join(' • ') : 'Ph.D. Clinical Psychology'}
                                        </p>
                                        {t.quote && (
                                            <p className="text-sm sm:text-base text-[#9A384D] font-serif italic leading-relaxed pt-1 max-w-xl">
                                                &ldquo;{t.quote.replace(/"/g, '')}&rdquo;
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats Card: 4-column dedicated rounded card */}
                            <div className="bg-[#FAF7F8] rounded-2xl p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x sm:divide-[#EFE9EB] text-center my-6 border border-[#F3EDEF]/60">
                                {/* Rating */}
                                <div className="space-y-1 sm:px-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1">
                                        <Star className="w-3 h-3 text-muted-foreground" /> RATING
                                    </p>
                                    {t.reviews.length === 0 ? (
                                        <p className="text-xs sm:text-sm font-bold text-foreground">No Reviews Yet</p>
                                    ) : (
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="text-sm sm:text-base font-extrabold text-foreground">{t.rating.toFixed(1)}/5</span>
                                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                                        </div>
                                    )}
                                </div>

                                {/* Gender */}
                                <div className="space-y-1 sm:px-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1">
                                        <User className="w-3 h-3 text-muted-foreground" /> GENDER
                                    </p>
                                    <p className="text-sm sm:text-base font-extrabold text-foreground capitalize">
                                        {t.gender}
                                    </p>
                                </div>

                                {/* Sessions */}
                                <div className="space-y-1 sm:px-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1">
                                        <Calendar className="w-3 h-3 text-muted-foreground" /> SESSIONS
                                    </p>
                                    <p className="text-sm sm:text-base font-extrabold text-foreground">
                                        {t.totalSessions || 1500}+
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-semibold">Hours Led</p>
                                </div>

                                {/* Experience */}
                                <div className="space-y-1 sm:px-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1">
                                        <Briefcase className="w-3 h-3 text-muted-foreground" /> EXPERIENCE
                                    </p>
                                    <p className="text-sm sm:text-base font-extrabold text-foreground">
                                        {t.exp.replace(' yrs', '')}+ Yrs
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-semibold">In Practice</p>
                                </div>
                            </div>

                            {/* Tags row with icons matching mockup */}
                            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                                {t.tags.map((tag: string) => {
                                    const isAnxiety = tag.toLowerCase().includes('anxiety') || tag.toLowerCase().includes('ocd');
                                    const isDepression = tag.toLowerCase().includes('depression');
                                    return (
                                        <span 
                                            key={tag} 
                                            className="px-5 py-2.5 rounded-2xl border border-[#F0E2E6] bg-[#FAF2F4] text-xs font-semibold text-foreground flex items-center gap-2 shadow-2xs"
                                        >
                                            {isAnxiety && <Brain className="w-4 h-4 text-[#8E3E50]" />}
                                            {isDepression && <Frown className="w-4 h-4 text-[#8E3E50]" />}
                                            {!isAnxiety && !isDepression && <Sparkles className="w-3.5 h-3.5 text-[#8E3E50]" />}
                                            <span>{tag}</span>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section 2: About The Therapist Card */}
                        <div className="bg-[#FAF5F6] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-[#F3EBEF] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
                            <div className="flex-1 border-l-4 border-[#581C2B] pl-4 sm:pl-5 space-y-3 text-left">
                                <h3 className="text-xs font-black tracking-widest text-[#2A181E] uppercase">
                                    ABOUT THE THERAPIST
                                </h3>
                                <p className="text-xs sm:text-sm text-foreground/80 font-normal leading-relaxed">
                                    {t.bio || `${t.name} is a compassionate and experienced clinical psychologist, dedicated to helping individuals navigate life's challenges with clarity, confidence and emotional resilience.`}
                                </p>
                            </div>
                            <TherapyHeadIllustration className="w-44 h-44 sm:w-52 sm:h-52 shrink-0" />
                        </div>

                        {/* Section 3: Areas of Expertise Card */}
                        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-[#F0ECEE] shadow-sm space-y-6 text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border-2 border-[#581C2B] flex items-center justify-center shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-[#581C2B]" />
                                </div>
                                <h3 className="text-xs font-black tracking-widest text-[#2A181E] uppercase shrink-0">
                                    AREAS OF EXPERTISE
                                </h3>
                                <div className="h-[1px] bg-[#EBE6E7] flex-1" />
                            </div>

                            {/* Expertise Pills */}
                            <div className="flex flex-wrap items-center gap-3">
                                {t.tags.map((tag: string) => {
                                    const lower = tag.toLowerCase();
                                    const IconComponent = lower.includes('anxiety') 
                                        ? Flower2 
                                        : lower.includes('ocd') 
                                        ? Sun 
                                        : lower.includes('depression') 
                                        ? CloudRain 
                                        : Sparkles;
                                    return (
                                        <div 
                                            key={tag}
                                            className="px-5 py-2.5 rounded-2xl border border-[#F0E2E6] bg-[#FAF2F4] text-xs font-semibold text-foreground flex items-center gap-2.5 shadow-2xs"
                                        >
                                            <IconComponent className="w-4 h-4 text-[#8E3E50]" />
                                            <span>{tag}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Book a Session CTA Button */}
                            <BookingModal
                                {...bookingProps}
                                trigger={
                                    <Button className="w-full h-14 rounded-full bg-[#581C2B] hover:bg-[#451622] text-sm sm:text-base font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.99]">
                                        <Calendar className="w-4 h-4" />
                                        <span>Book a Session</span>
                                        <ArrowRight className="w-4 h-4 ml-0.5" />
                                    </Button>
                                }
                            />
                        </div>

                        {/* Interactive Tabbed Content (Schedule, Credentials, Reviews, FAQs) */}
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

                    {/* RIGHT COLUMN: Sticky Consultation Fee Card (Desktop Only) */}
                    <aside className="sticky top-28 hidden lg:block w-full">
                        <div className="overflow-hidden rounded-[2.5rem] border border-border/60 bg-white shadow-xl transition-all duration-300">
                            
                            {/* Top Burgundy Banner */}
                            <div className="bg-[#581C2B] px-8 py-7 text-center text-white space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Consultation Fee</p>
                                <h3 className="text-4xl font-display font-medium text-white">
                                    ₹{t.price}
                                    <span className="text-base font-sans font-normal text-white/70 ml-1.5">/ hour</span>
                                </h3>
                                <p className="text-xs text-white/80 font-medium pt-0.5">
                                    Formats: {t.sessionTypes.join(' & ')} Calls
                                </p>
                            </div>
                            
                            {/* White Card Body */}
                            <div className="space-y-6 p-7">
                                <div className="space-y-3.5 border-b border-border/40 pb-5">
                                    <div className="flex justify-between items-center text-xs font-semibold">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                                            Platform Provider
                                        </span>
                                        <span className="font-bold text-foreground">Rebalance Verified</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-semibold">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <Video className="w-3.5 h-3.5 text-muted-foreground/70" />
                                            Formats
                                        </span>
                                        <span className="font-bold text-foreground">{t.sessionTypes.join(' & ')} Calls</span>
                                    </div>
                                </div>

                                {/* Schedule Session Button */}
                                <BookingModal
                                    {...bookingProps}
                                    trigger={
                                        <Button className="h-13 w-full rounded-full bg-[#581C2B] hover:bg-[#461521] text-sm font-bold text-white shadow-md transition-all active:scale-[0.98]">
                                            Schedule Session
                                        </Button>
                                    }
                                />

                                {/* Secure & Private Policy */}
                                <div className="flex items-start gap-3.5 pt-1 text-left">
                                    <div className="w-8 h-8 rounded-xl bg-secondary/80 border border-border/40 flex items-center justify-center shrink-0 text-muted-foreground">
                                        <Lock className="w-4 h-4 text-muted-foreground/80" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                            Secure & Private
                                        </p>
                                        <p className="text-[11px] text-muted-foreground/90 font-medium leading-tight">
                                            All sessions are encrypted & your details are confidential.
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/70 font-medium pt-0.5">
                                            Reschedule or cancel freely up to 24 hours prior.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
