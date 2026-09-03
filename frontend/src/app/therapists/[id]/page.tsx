import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
    Star, ChevronRight,
    Zap, Lock, Check, Award, User, Calendar, Video
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
            <div className="mx-auto max-w-7xl px-6 sm:px-8 pt-24 sm:pt-28">
                <nav className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground/70">
                    <Link href="/" className="hover:text-[#581C2B] transition-colors">Home</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <Link href="/therapists" className="hover:text-[#581C2B] transition-colors">Therapists</Link>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <span className="text-foreground font-semibold truncate max-w-[240px]">{t.name}</span>
                </nav>
            </div>

            {/* Main Page Layout Container */}
            <main className="mx-auto max-w-7xl px-6 sm:px-8 mt-6 sm:mt-8">
                <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_390px] gap-8 xl:gap-12 items-start relative z-10">
                    
                    {/* LEFT COLUMN: Main Profile Content & Tabs */}
                    <div className="space-y-8 min-w-0 w-full">
                        
                        {/* Section 1: Main Profile Card */}
                        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 border border-border/50 shadow-[0_10px_35px_rgba(0,0,0,0.03)] relative overflow-hidden transition-all duration-300">
                            
                            <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-center md:items-start text-center md:text-left">
                                
                                {/* Elegant Profile Avatar with status indicator */}
                                <div className="relative shrink-0 w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-3xl overflow-hidden bg-secondary border-2 border-white shadow-md group">
                                    {t.profileImage ? (
                                        <Image
                                            src={t.profileImage}
                                            alt={`Portrait of ${t.name}`}
                                            fill
                                            priority
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#FAF0F2]">
                                            <span className="text-4xl font-display font-bold text-[#581C2B]/40">{initials}</span>
                                        </div>
                                    )}
                                    
                                    {/* Status dot */}
                                    <div className="absolute bottom-2.5 right-2.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm flex items-center justify-center" title="Available Today">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    </div>
                                </div>

                                {/* Profile Header Information */}
                                <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                                    
                                    {/* Top Badges */}
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F7ED] px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#166534] border border-[#C5E8D0]">
                                            <Check className="h-3 w-3 stroke-[3]" />
                                            Verified Expert
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF2F4] px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#A03048] border border-[#FAD6DD]">
                                            <Zap className="h-3 w-3 fill-[#A03048]" />
                                            Top Practitioner
                                        </span>
                                    </div>

                                    {/* Name & Quote */}
                                    <div className="space-y-1">
                                        <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-display font-bold leading-tight text-foreground">
                                            {t.name}
                                        </h1>
                                        {t.quote && (
                                            <p className="text-xs sm:text-sm text-[#B84A5C] font-medium italic leading-relaxed pt-0.5">
                                                &ldquo;{t.quote.replace(/"/g, '')}&rdquo;
                                            </p>
                                        )}
                                    </div>

                                    {/* Credentials Pills */}
                                    {t.credentials.length > 0 && (
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-0.5">
                                            {t.credentials.map((cred: string, idx: number) => (
                                                <span 
                                                    key={idx} 
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF0F2] text-[#581C2B] text-xs font-semibold border border-[#EED7DC] shadow-2xs"
                                                >
                                                    <Award className="h-3.5 w-3.5 text-[#581C2B] shrink-0" />
                                                    {cred}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats & Gender Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-b border-[#EBE6E7] my-6 text-center md:text-left">
                                {/* Rating */}
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center md:justify-start gap-1">
                                        <Star className="w-3 h-3 text-muted-foreground" /> Rating
                                    </p>
                                    {t.reviews.length === 0 ? (
                                        <p className="text-xs sm:text-sm font-bold text-foreground">No Reviews Yet</p>
                                    ) : (
                                        <div className="flex items-center justify-center md:justify-start gap-1">
                                            <span className="text-sm sm:text-base font-extrabold text-foreground">{t.rating.toFixed(1)}/5</span>
                                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                                        </div>
                                    )}
                                </div>

                                {/* Gender */}
                                <div className="space-y-1 border-l border-[#EBE6E7] pl-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center md:justify-start gap-1">
                                        <User className="w-3 h-3 text-muted-foreground" /> Gender
                                    </p>
                                    <p className="text-sm sm:text-base font-extrabold text-foreground capitalize">
                                        {t.gender}
                                    </p>
                                </div>

                                {/* Sessions */}
                                <div className="space-y-1 border-l border-[#EBE6E7] pl-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center md:justify-start gap-1">
                                        <Calendar className="w-3 h-3 text-muted-foreground" /> Sessions
                                    </p>
                                    <p className="text-sm sm:text-base font-extrabold text-foreground">
                                        {t.totalSessions || 90}+
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-semibold">Hours Led</p>
                                </div>

                                {/* Experience */}
                                <div className="space-y-1 border-l border-[#EBE6E7] pl-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center md:justify-start gap-1">
                                        <Calendar className="w-3 h-3 text-muted-foreground" /> Experience
                                    </p>
                                    <p className="text-sm sm:text-base font-extrabold text-foreground">
                                        {t.exp.replace(' yrs', '')}+ Yrs
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-semibold">In Practice</p>
                                </div>
                            </div>

                            {/* Specialties Tag pills */}
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                                {t.tags.map((tag: string) => (
                                    <span 
                                        key={tag} 
                                        className="px-4 py-1.5 rounded-full border border-[#EBE7E9] bg-[#F6F4F5] text-xs font-medium text-foreground/80 shadow-2xs hover:border-[#581C2B]/20 transition-colors"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Mobile Consultation Fee Card (Positioned directly under Profile card in mobile flow) */}
                        <div className="lg:hidden overflow-hidden rounded-[2rem] border border-border/60 bg-white shadow-lg space-y-0">
                            <div className="bg-[#581C2B] px-6 py-6 text-center text-white space-y-1">
                                <h3 className="text-3xl font-display font-medium text-white">
                                    ₹{t.price}
                                    <span className="text-sm font-sans font-normal text-white/70 ml-1.5">/ hour</span>
                                </h3>
                                <p className="text-xs text-white/80 font-medium">
                                    Formats: {t.sessionTypes.join(' & ')} Calls
                                </p>
                            </div>

                            <div className="p-6 space-y-5">
                                <BookingModal
                                    {...bookingProps}
                                    trigger={
                                        <Button className="h-12 w-full rounded-full bg-[#581C2B] hover:bg-[#461521] text-sm font-bold text-white shadow-md active:scale-[0.98] transition-transform">
                                            Schedule Session
                                        </Button>
                                    }
                                />

                                <div className="flex items-start gap-3 text-left pt-1">
                                    <div className="w-7 h-7 rounded-lg bg-secondary/80 border border-border/40 flex items-center justify-center shrink-0 text-muted-foreground mt-0.5">
                                        <Lock className="w-3.5 h-3.5 text-muted-foreground/80" />
                                    </div>
                                    <div className="space-y-0.5">
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

                        {/* Interactive Tabbed Content */}
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
