'use client';

import { useState } from 'react';
import {
    Video, Phone, Globe, Award, GraduationCap,
    ShieldCheck, Sparkles, Star, Check, ChevronRight,
    HelpCircle, Heart, Quote, Calendar, Lock, Info,
    Users, MessageSquare, User
} from 'lucide-react';
import BookingModal from '@/components/booking/BookingModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TherapyRoomIllustration from './TherapyRoomIllustration';

interface FAQ {
    question: string;
    answer: string;
}

interface Availability {
    day: string;
    slots: string[];
}

interface CalendarDay {
    dateLabel: string;
    dayLabel: string;
    slots: string[];
    totalSlots: number;
}

interface PatientStory {
    stars: number;
    quote: string;
    author: string;
    status: string;
    createdAt?: string;
}

interface BookingProps {
    therapistId: string;
    therapistName: string;
    specialty: string;
    price: number;
    sessionTypes: string[];
    availability: Availability[];
}

interface TherapistProfileTabsProps {
    bio: string;
    languages: string[];
    credentials: string[];
    calendarDays: CalendarDay[];
    patientStories: PatientStory[];
    bookingProps: BookingProps;
    faq: FAQ[];
}

const formatCredential = (cred: string) => {
    let title = cred;
    let subtitle = 'Verified Qualification';
    if (cred.includes(',')) {
        const parts = cred.split(',');
        title = parts[0].trim();
        subtitle = parts.slice(1).join(', ').trim();
    }
    return { title, subtitle };
};

const getCredentialIcon = (index: number) => {
    switch (index % 4) {
        case 0: return <GraduationCap className="w-5 h-5 text-primary" />;
        case 1: return <Award className="w-5 h-5 text-primary" />;
        case 2: return <ShieldCheck className="w-5 h-5 text-primary" />;
        default: return <Sparkles className="w-5 h-5 text-primary" />;
    }
};

const ALL_TABS = ['About', 'Schedule', 'Credentials', 'Reviews'] as const;
type Tab = (typeof ALL_TABS)[number];

const getTabIcon = (tab: Tab) => {
    switch (tab) {
        case 'About': return User;
        case 'Schedule': return Calendar;
        case 'Credentials': return Award;
        case 'Reviews': return Star;
    }
};

export default function TherapistProfileTabs({
    bio,
    languages,
    credentials,
    calendarDays,
    patientStories,
    bookingProps,
    faq,
}: TherapistProfileTabsProps) {
    const [activeTab, setActiveTab] = useState<Tab>('About');
    const tabs = credentials.length > 0 ? ALL_TABS : ALL_TABS.filter(t => t !== 'Credentials');

    const avgRating = patientStories.length > 0 
        ? (patientStories.reduce((acc, curr) => acc + (curr.stars || 5), 0) / patientStories.length).toFixed(1)
        : '0';

    return (
        <div id="therapist-tabs-content" className="space-y-8 w-full">
            {/* Desktop Horizontal Tabs Bar */}
            <div className="border-b border-[#EBE6E7] flex items-center gap-8 sm:gap-10 pt-2">
                {tabs.map(tab => {
                    const Icon = getTabIcon(tab);
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as Tab)}
                            className={cn(
                                'flex items-center gap-2 pb-3.5 text-sm sm:text-base font-bold transition-all border-b-2 outline-none cursor-pointer select-none',
                                isActive
                                    ? 'border-[#581C2B] text-[#581C2B]'
                                    : 'border-transparent text-muted-foreground/70 hover:text-foreground'
                            )}
                        >
                            <Icon className={cn("w-4 h-4", isActive ? "text-[#581C2B]" : "text-muted-foreground/70")} />
                            <span>{tab}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab content panel */}
            <div className="w-full relative transition-all duration-300">

                {/* ── ABOUT TAB ──────────────────────────────────── */}
                {activeTab === 'About' && (
                    <div className="space-y-10 animate-in fade-in duration-300">
                        {/* Therapeutic Approach */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-rose-100/70 text-[#C05665] flex items-center justify-center shrink-0">
                                    <Heart className="w-5 h-5 fill-current" />
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                                    Therapeutic Approach
                                </h3>
                            </div>

                            {/* Split layout: Text with Drop cap on Left, Cozy Illustration on Right */}
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] gap-6 sm:gap-8 items-center">
                                <p className="text-sm sm:text-base text-foreground/85 leading-relaxed font-sans first-letter:text-5xl first-letter:font-display first-letter:font-bold first-letter:text-[#581C2B] first-letter:float-left first-letter:mr-3.5 first-letter:leading-none">
                                    {bio}
                                </p>
                                <div className="hidden md:flex justify-center items-center">
                                    <TherapyRoomIllustration className="w-full max-w-[320px]" />
                                </div>
                            </div>
                        </div>

                        {/* Details grid: Available Formats + Spoken Languages */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#EBE6E7]">
                            {/* Available Formats */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Video className="w-4 h-4 text-[#C05665]" /> Available Formats
                                </h4>
                                <div className="space-y-3">
                                    {bookingProps.sessionTypes?.some(s => s.toLowerCase() === 'video') && (
                                        <div className="flex items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-border/60 hover:border-[#581C2B]/20 hover:shadow-sm transition-all duration-200 group">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-xl bg-[#FAF0F2] flex items-center justify-center text-[#581C2B] border border-[#EED7DC]">
                                                    <Video className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs sm:text-sm font-bold text-foreground">Video Consultation</p>
                                                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">High-definition, secure video call</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-[#581C2B] group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    )}
                                    {bookingProps.sessionTypes?.some(s => s.toLowerCase() === 'audio' || s.toLowerCase() === 'phone') && (
                                        <div className="flex items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-border/60 hover:border-[#581C2B]/20 hover:shadow-sm transition-all duration-200 group">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-xl bg-[#FAF0F2] flex items-center justify-center text-[#581C2B] border border-[#EED7DC]">
                                                    <Phone className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs sm:text-sm font-bold text-foreground">
                                                        {bookingProps.sessionTypes?.some(s => s.toLowerCase() === 'phone') ? 'Phone Consultation' : 'Voice Call'}
                                                    </p>
                                                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Direct high-quality audio connection</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-[#581C2B] group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    )}
                                    {bookingProps.sessionTypes?.some(s => s.toLowerCase() === 'in-person') && (
                                        <div className="flex items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-border/60 hover:border-[#581C2B]/20 hover:shadow-sm transition-all duration-200 group">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-xl bg-[#FAF0F2] flex items-center justify-center text-[#581C2B] border border-[#EED7DC]">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs sm:text-sm font-bold text-foreground">In-Person Session</p>
                                                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Face-to-face clinic consultation</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-[#581C2B] group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    )}
                                    {bookingProps.sessionTypes?.some(s => s.toLowerCase() === 'chat') && (
                                        <div className="flex items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-border/60 hover:border-[#581C2B]/20 hover:shadow-sm transition-all duration-200 group">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-xl bg-[#FAF0F2] flex items-center justify-center text-[#581C2B] border border-[#EED7DC]">
                                                    <MessageSquare className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs sm:text-sm font-bold text-foreground">Chat Consultation</p>
                                                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Secure real-time messaging</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-[#581C2B] group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Spoken Languages */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-[#C05665]" /> Spoken Languages
                                </h4>
                                <div className="flex flex-wrap gap-2 pt-0.5">
                                    {languages.map(lang => (
                                        <span key={lang} className="px-4 py-1.5 rounded-full bg-white text-xs font-semibold text-foreground/85 border border-border/60 shadow-2xs">
                                            {lang}
                                        </span>
                                    ))}
                                </div>
                                <div className="rounded-2xl bg-white p-4 sm:p-5 border border-border/60 shadow-2xs mt-4 flex gap-3.5">
                                    <div className="w-5 h-5 rounded-full bg-rose-50 text-[#C05665] flex items-center justify-center shrink-0 mt-0.5">
                                        <Info className="w-3.5 h-3.5" />
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                        All sessions are conducted securely within the Rebalance ecosystem. Translators or third parties are strictly restricted to protect your absolute confidentiality.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Ready to take the first step banner */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FDF5F6] via-[#FAF0F2] to-[#FDF5F6] border border-[#F0DFE3] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs mt-8">
                            {/* Botanical leaf watermark on left */}
                            <div className="absolute -left-4 -bottom-6 w-36 h-36 opacity-15 pointer-events-none select-none">
                                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 85 Q 35 45, 75 15 Q 85 45, 55 75 Z" fill="#581C2B" />
                                    <path d="M25 70 Q 45 40, 80 40" stroke="#581C2B" strokeWidth="2" fill="none" />
                                    <path d="M15 80 Q 40 60, 50 30" stroke="#581C2B" strokeWidth="1.5" fill="none" />
                                    <circle cx="70" cy="20" r="4" fill="#581C2B" />
                                    <circle cx="45" cy="45" r="3" fill="#581C2B" />
                                    <circle cx="30" cy="65" r="3" fill="#581C2B" />
                                </svg>
                            </div>

                            <div className="space-y-1 text-center md:text-left relative z-10">
                                <h4 className="text-base sm:text-lg font-display font-bold text-foreground">
                                    Ready to take the first step?
                                </h4>
                                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                                    Book an introductory call and see if we&apos;re the right fit.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 relative z-10">
                                <div className="text-center sm:text-right">
                                    <span className="text-2xl font-display font-medium text-foreground">
                                        ₹{bookingProps.price}
                                    </span>
                                    <span className="text-xs font-sans text-muted-foreground ml-1">/ hour</span>
                                </div>
                                
                                <div className="flex flex-col items-center gap-1.5">
                                    <BookingModal
                                        {...bookingProps}
                                        trigger={
                                            <Button className="h-11 rounded-full bg-[#581C2B] hover:bg-[#461521] text-xs sm:text-sm font-bold text-white px-6 shadow-md transition-all active:scale-[0.98]">
                                                Book Intro Call
                                            </Button>
                                        }
                                    />
                                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Complimentary 15-min call
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Frequently Asked Questions */}
                        {faq.length > 0 && (
                            <div className="pt-8 border-t border-[#EBE6E7] space-y-6">
                                <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-rose-100/70 flex items-center justify-center shrink-0 text-[#C05665]">
                                        <HelpCircle className="w-4 h-4" />
                                    </span>
                                    Common Questions
                                </h3>
                                <div className="space-y-3">
                                    {faq.map((item, idx) => (
                                        <details key={idx} className="group bg-white border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-[#581C2B]/20 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                                            <summary className="flex items-center justify-between cursor-pointer focus:outline-none py-1 select-none">
                                                <h4 className="text-xs sm:text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors pr-6">
                                                    {item.question}
                                                </h4>
                                                <span className="w-7 h-7 rounded-full bg-[#FAF8F8] border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-accent group-hover:bg-accent/10 transition-all duration-300 shrink-0">
                                                    <ChevronRight className="w-3.5 h-3.5 rotate-90 group-open:-rotate-90 transition-transform duration-300" />
                                                </span>
                                            </summary>
                                            <div className="mt-4 border-t border-border/40 pt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground/80 font-semibold animate-in slide-in-from-top-1 duration-200">
                                                {item.answer}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── SCHEDULE TAB ───────────────────────────────── */}
                {activeTab === 'Schedule' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-rose-100/70 flex items-center justify-center shrink-0 text-[#C05665]">
                                        <Calendar className="w-4 h-4" />
                                    </span>
                                    Upcoming Consultations
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1 font-semibold">All slots are in your local timezone.</p>
                            </div>
                            <BookingModal
                                {...bookingProps}
                                trigger={
                                    <button className="text-xs font-bold text-accent flex items-center gap-1.5 hover:text-primary hover:underline transition-colors py-1.5 px-4 rounded-full bg-white border border-border/60 hover:border-primary/20 shadow-xs duration-200">
                                        View Full Calendar <ChevronRight className="w-4 h-4" />
                                    </button>
                                }
                            />
                        </div>

                        {/* Calendar Day Cards */}
                        <div className="flex overflow-x-auto pb-4 pt-2 gap-4 lg:grid lg:grid-cols-5 lg:gap-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-nowrap lg:flex-wrap snap-x snap-mandatory scroll-smooth">
                            {calendarDays.map(day => (
                                <div 
                                    key={day.dateLabel} 
                                    className="w-[170px] sm:w-[190px] lg:w-auto shrink-0 snap-start bg-white rounded-3xl p-5 border border-border/60 shadow-xs hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col justify-between min-h-[220px]"
                                >
                                    <div className="space-y-2">
                                        <p className="text-xs sm:text-sm font-bold text-foreground/90">{day.dayLabel}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold">{day.dateLabel}</span>
                                            {day.slots.length > 0 ? (
                                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    {day.totalSlots} left
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-bold text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full uppercase">Full</span>
                                            )}
                                        </div>
                                    </div>

                                    {day.slots.length > 0 ? (
                                        <div className="space-y-2 mt-4">
                                            {day.slots.map(slot => (
                                                <BookingModal
                                                    key={slot}
                                                    {...bookingProps}
                                                    trigger={
                                                        <button className="w-full h-10 rounded-xl bg-[#FAF8F8] border border-border/40 text-xs font-bold text-foreground hover:bg-[#581C2B] hover:border-[#581C2B] hover:text-white hover:scale-[1.02] hover:shadow-xs active:scale-[0.98] transition-all duration-200">
                                                            {slot}
                                                        </button>
                                                    }
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-4 flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 bg-[#FAF8F8] p-3 text-center min-h-[110px]">
                                            <span className="text-[10px] sm:text-xs font-bold italic text-muted-foreground/50">Fully booked</span>
                                            <p className="text-[8px] text-muted-foreground/40 mt-1 leading-normal font-semibold">Join waiting list via concierge</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 justify-center text-center pt-4 border-t border-[#EBE6E7]">
                            <Lock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none">
                                Instant automated booking. Reschedule or cancel freely up to 24 hours prior.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── CREDENTIALS TAB ────────────────────────────── */}
                {activeTab === 'Credentials' && credentials.length > 0 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="pb-3">
                            <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-rose-100/70 flex items-center justify-center shrink-0 text-[#C05665]">
                                    <Award className="w-4 h-4" />
                                </span>
                                Professional Journey & Certificates
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 font-semibold">Verified licensing and specialized clinical education credentials.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {credentials.map((cred, i) => {
                                const { title, subtitle } = formatCredential(cred);
                                return (
                                    <div 
                                        key={i} 
                                        className="flex gap-4 items-start p-5 bg-white rounded-3xl border border-border/60 hover:border-primary/20 hover:shadow-md transition-all duration-300 group"
                                    >
                                        <div className="w-11 h-11 rounded-full bg-[#FAF0F2] flex items-center justify-center shrink-0 border border-[#EED7DC] shadow-xs text-[#581C2B] group-hover:scale-110 transition-transform duration-300">
                                            {getCredentialIcon(i)}
                                        </div>
                                        <div className="min-w-0 pt-0.5">
                                            <h4 className="text-sm sm:text-base font-extrabold text-foreground leading-snug">{title}</h4>
                                            <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1 leading-normal">{subtitle}</p>
                                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-2.5 uppercase tracking-wide">
                                                <Check className="w-2.5 h-2.5 stroke-[3]" /> Verified
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── REVIEWS TAB ────────────────────────────────── */}
                {activeTab === 'Reviews' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-rose-100/70 flex items-center justify-center shrink-0 text-[#C05665]">
                                        <Quote className="w-4 h-4" />
                                    </span>
                                    Patient Reflections
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1 font-semibold">Anonymized reviews aggregated from verified consultations.</p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-full border border-border/60 shadow-xs self-start sm:self-auto">
                                {patientStories.length === 0 ? (
                                    <span className="text-xs font-black text-muted-foreground">No Reviews Yet</span>
                                ) : (
                                    <>
                                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                        <span className="text-xs font-black text-foreground">
                                            {avgRating}
                                            <span className="font-semibold text-muted-foreground">
                                                /5 average ({patientStories.length})
                                            </span>
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {patientStories.length === 0 ? (
                            <div className="bg-white rounded-[2rem] p-10 border border-border/60 shadow-sm text-center space-y-3 my-4">
                                <div className="w-14 h-14 rounded-full bg-[#FAF0F2] border border-[#EED7DC] flex items-center justify-center mx-auto text-[#581C2B]">
                                    <Quote className="w-6 h-6 text-muted-foreground/50" />
                                </div>
                                <h4 className="text-lg font-display font-bold text-foreground">No Reviews Yet</h4>
                                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto font-medium leading-relaxed">
                                    This therapist has not received verified written reviews on their profile yet. Sessions remain 100% covered by Rebalance care verification.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
                                {patientStories.map((story, i) => (
                                    <div 
                                        key={i} 
                                        className="bg-white p-6 sm:p-7 rounded-[2rem] border border-border/60 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-primary/20 transition-all space-y-6 relative"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-0.5">
                                                    {[...Array(5)].map((_, idx) => (
                                                        <Star 
                                                            key={idx} 
                                                            className={`w-3.5 h-3.5 ${idx < story.stars ? 'fill-yellow-500 text-yellow-500' : 'fill-muted/30 text-muted/30'}`} 
                                                        />
                                                    ))}
                                                </div>
                                                <Quote className="w-5 h-5 text-primary/10" />
                                            </div>
                                            <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed italic">
                                                &ldquo;{story.quote.replace(/"/g, '')}&rdquo;
                                            </p>
                                        </div>
                                        <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-[#FAF0F2] text-[#581C2B] flex items-center justify-center text-xs font-bold font-display">
                                                    {story.author.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-foreground font-display">
                                                        {story.author}
                                                    </p>
                                                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                                        <Check className="w-3 h-3 stroke-[3]" />
                                                        {story.status || 'Verified Patient'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Fixed Bottom Navigation Bar */}
            <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EBE6E7] py-2 px-6 flex justify-around items-center lg:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                {tabs.map(tab => {
                    const Icon = getTabIcon(tab);
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab as Tab);
                                const el = document.getElementById('therapist-tabs-content');
                                if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }}
                            className={cn(
                                'flex flex-col items-center gap-1 text-[11px] font-bold transition-all relative py-1 px-3',
                                isActive
                                    ? 'text-[#581C2B]'
                                    : 'text-muted-foreground/60 hover:text-foreground'
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? "text-[#581C2B]" : "text-muted-foreground/60")} />
                            <span>{tab}</span>
                            {isActive && (
                                <span className="w-5 h-0.5 bg-[#581C2B] rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
