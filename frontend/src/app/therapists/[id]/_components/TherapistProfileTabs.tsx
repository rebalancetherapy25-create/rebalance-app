'use client';

import { useState } from 'react';
import {
    Video, Phone, Globe, Award, GraduationCap,
    ShieldCheck, Sparkles, Star, Check, ChevronRight,
    HelpCircle, Heart, Quote, Calendar, Lock, Info
} from 'lucide-react';
import BookingModal from '@/components/booking/BookingModal';
import { cn } from '@/lib/utils';

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
        subtitle = parts.slice(1).join(',').trim();
    } else if (cred.includes('(')) {
        const parts = cred.split('(');
        title = parts[0].trim();
        subtitle = parts[1].replace(')', '').trim();
    } else {
        if (cred.toLowerCase().includes('phd psychology')) { 
            title = 'PhD Psychology'; 
            subtitle = 'University of Mumbai'; 
        } else if (cred.toLowerCase().includes('iit bombay')) { 
            title = 'Certificate in Mental Health'; 
            subtitle = 'IIT Bombay'; 
        } else if (cred.toLowerCase().includes('iocdf')) { 
            title = 'IOCDF Certified OCD Specialist'; 
            subtitle = 'IOCDF'; 
        } else if (cred.toLowerCase().includes('erp practitioner')) { 
            title = 'ERP Practitioner'; 
            subtitle = 'Exposure & Response Prevention'; 
        }
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

    return (
        <div className="space-y-8 w-full">
            {/* Sticky tab bar — floats elegantly with a warm blur and thin borders */}
            <div className="sticky top-[64px] md:top-[80px] z-20 bg-[#FDFBFB]/95 backdrop-blur-md py-3.5 border-b border-primary/5 transition-all duration-300">
                <div className="flex gap-1.5 p-1 bg-[#FAF6F6] border border-primary/10 rounded-full max-w-full md:max-w-xl shadow-xs overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-nowrap w-full scroll-smooth">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as Tab)}
                            className={cn(
                                'shrink-0 sm:flex-1 py-3 px-5 sm:px-4 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 leading-none select-none tracking-wide outline-none text-center',
                                activeTab === tab
                                    ? 'bg-primary text-white shadow-md scale-100'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-primary/[0.04] active:bg-primary/[0.08]'
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content panel (Now full bleed directly on the warm background - no double nested card wrappers) */}
            <div className="w-full relative transition-all duration-300">

                {/* ── ABOUT TAB ──────────────────────────────────── */}
                {activeTab === 'About' && (
                    <div className="space-y-10 animate-in fade-in duration-300">
                        {/* Biography / Approach */}
                        <div className="space-y-4">
                            <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center shrink-0 text-accent">
                                    <Heart className="w-4 h-4 fill-current" />
                                </span>
                                Therapeutic Approach
                            </h3>
                            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed font-sans first-letter:text-5xl first-letter:font-display first-letter:font-bold first-letter:text-primary first-letter:float-left first-letter:mr-3 first-letter:leading-none">
                                {bio}
                            </p>
                        </div>

                        {/* Details grid: session formats + spoken languages */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-primary/5">
                            {/* Session Formats */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                                    <Video className="w-4 h-4 text-accent" /> Available Formats
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-5 bg-white rounded-3xl border border-primary/10 hover:border-primary/20 hover:shadow-md transition-all duration-300 group">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F8] flex items-center justify-center text-primary border border-primary/5 shadow-xs group-hover:scale-105 transition-transform">
                                                <Video className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm font-bold text-foreground">Video Consultation</p>
                                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">High-definition, secure video call</p>
                                            </div>
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-xs">
                                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-5 bg-white rounded-3xl border border-border/40 hover:border-primary/10 hover:shadow-md transition-all duration-300 group">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F8] flex items-center justify-center text-muted-foreground border border-border/40 shadow-xs group-hover:scale-105 transition-transform">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm font-bold text-foreground/85">Voice Call</p>
                                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Direct high-quality audio connection</p>
                                            </div>
                                        </div>
                                        <div className="w-6 h-6 rounded-full border border-border/30" />
                                    </div>
                                </div>
                            </div>

                            {/* Spoken Languages */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-accent" /> Spoken Languages
                                </h4>
                                <div className="flex flex-wrap gap-2.5 pt-1">
                                    {languages.map(lang => (
                                        <span key={lang} className="px-5 py-3.5 rounded-2xl bg-white text-xs font-bold text-primary border border-primary/10 shadow-xs hover:border-primary/20 hover:scale-105 transition-all duration-300">
                                            {lang}
                                        </span>
                                    ))}
                                </div>
                                <div className="rounded-3xl bg-white p-5 border border-primary/10 shadow-xs mt-6 flex gap-3.5">
                                    <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                                    <p className="text-[11px] sm:text-xs text-foreground/75 leading-relaxed font-semibold">
                                        All sessions are conducted securely within the Rebalance ecosystem. Translators or third parties are strictly restricted to protect your absolute confidentiality.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Frequently Asked Questions */}
                        {faq.length > 0 && (
                            <div className="pt-8 border-t border-primary/5 space-y-6">
                                <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center shrink-0 text-accent">
                                        <HelpCircle className="w-4 h-4" />
                                    </span>
                                    Common Questions
                                </h3>
                                <div className="space-y-3">
                                    {faq.map((item, idx) => (
                                        <details key={idx} className="group bg-white border border-primary/10 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-primary/20 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                                            <summary className="flex items-center justify-between cursor-pointer focus:outline-none py-1 select-none">
                                                <h4 className="text-xs sm:text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors pr-6">
                                                    {item.question}
                                                </h4>
                                                <span className="w-8 h-8 rounded-full bg-[#FAF8F8] border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-accent group-hover:bg-accent/10 group-hover:border-accent/20 transition-all duration-300 shrink-0">
                                                    <ChevronRight className="w-4 h-4 rotate-90 group-open:-rotate-90 transition-transform duration-300" />
                                                </span>
                                            </summary>
                                            <div className="mt-4 border-t border-primary/5 pt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground/80 font-semibold animate-in slide-in-from-top-1 duration-200">
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
                                    <span className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center shrink-0 text-accent">
                                        <Calendar className="w-4 h-4" />
                                    </span>
                                    Upcoming Consultations
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1 font-semibold">All slots are in your local timezone.</p>
                            </div>
                            <BookingModal
                                {...bookingProps}
                                trigger={
                                    <button className="text-xs font-bold text-accent flex items-center gap-1.5 hover:text-primary hover:underline transition-colors py-1.5 px-4 rounded-full bg-white border border-primary/10 hover:border-primary/20 shadow-xs duration-200">
                                        View Full Calendar <ChevronRight className="w-4 h-4" />
                                    </button>
                                }
                            />
                        </div>

                        {/* Calendar Day Cards (Renders as high-end ticket cards) */}
                        <div className="flex overflow-x-auto pb-4 pt-2 gap-4 lg:grid lg:grid-cols-5 lg:gap-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-nowrap lg:flex-wrap snap-x snap-mandatory scroll-smooth">
                            {calendarDays.map(day => (
                                <div 
                                    key={day.dateLabel} 
                                    className="w-[170px] sm:w-[190px] lg:w-auto shrink-0 snap-start bg-white rounded-3xl p-5 border border-primary/10 shadow-xs hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col justify-between min-h-[220px]"
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
                                                        <button className="w-full h-10 rounded-xl bg-[#FAF8F8] border border-border/40 text-xs font-bold text-foreground hover:bg-primary hover:border-primary hover:text-white hover:scale-[1.03] hover:shadow-xs active:scale-[0.98] transition-all duration-200">
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

                        <div className="flex items-center gap-2 justify-center text-center pt-4 border-t border-primary/5">
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
                                <span className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center shrink-0 text-accent">
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
                                        className="flex gap-4 items-start p-5 bg-white rounded-3xl border border-primary/10 hover:border-primary/20 hover:shadow-md transition-all duration-300 group"
                                    >
                                        <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center shrink-0 border border-primary/20 shadow-xs text-primary group-hover:scale-110 transition-transform duration-300">
                                            {getCredentialIcon(i)}
                                        </div>
                                        <div className="min-w-0 pt-0.5">
                                            <h4 className="text-xs sm:text-sm font-extrabold text-foreground leading-snug">{title}</h4>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold mt-1 leading-normal">{subtitle}</p>
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
                        {/* Tab header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center shrink-0 text-accent">
                                        <Quote className="w-4 h-4" />
                                    </span>
                                    Patient Reflections
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1 font-semibold">Anonymized reviews aggregated from verified consultations.</p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-full border border-primary/10 shadow-xs self-start sm:self-auto">
                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                <span className="text-xs font-black text-foreground">4.9<span className="font-semibold text-muted-foreground">/5 average</span></span>
                            </div>
                        </div>

                        {/* Stacks vertically on mobile and spans columns beautifully on desktop (No double nested borders) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
                            {patientStories.map((story, i) => (
                                <div 
                                    key={i} 
                                    className="bg-white border border-primary/10 rounded-3xl p-6 shadow-xs hover:shadow-md hover:border-accent/25 duration-300 flex flex-col justify-between gap-6 relative overflow-hidden group w-full"
                                >
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: story.stars }).map((_, si) => (
                                                    <Star key={si} className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                                                ))}
                                            </div>
                                            <Quote className="w-6 h-6 text-accent/20 group-hover:text-accent/35 transition-colors duration-300" />
                                        </div>
                                        <p className="text-xs sm:text-sm text-foreground/80 font-medium leading-relaxed italic pr-2 font-display">
                                            &ldquo;{story.quote.replace(/"/g, '')}&rdquo;
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-border/20 pt-4 mt-2">
                                        <span className="text-xs font-bold text-foreground">{story.author}</span>
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase">
                                            <Check className="w-2.5 h-2.5 stroke-[3]" /> {story.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
