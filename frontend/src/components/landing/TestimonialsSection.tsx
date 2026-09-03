'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Quote, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

const TESTIMONIALS = [
    {
        quote: "I've tried three different apps before this. Usually, the therapists feel like they're reading from a script, but the professional I found through ReBalance actually challenged my perspective. I'm finally stopping the 'doom scrolling' cycle and sleeping better.",
        name: "Kavita I.",
        location: "Mumbai, MH",
        topic: "Anxiety & Sleep Support",
        rating: 5,
        date: "2 weeks ago"
    },
    {
        quote: "Running a startup is lonely. I needed someone to talk to who wouldn't judge me for being stressed about payroll. The platform is straightforward, and easy to use and has really helped me to get better at handling my stress.",
        name: "Rahul Hegde",
        location: "Bangalore, KA",
        topic: "Executive Stress & Burnout",
        rating: 5,
        date: "3 weeks ago"
    },
    {
        quote: "I used to get physical shakes before and I did not know the reasons. My therapist walked me through some grounding techniques that actually works. It's not a 'cure,' but I feel way more in control of my body now.",
        name: "Sarah T.",
        location: "New Delhi, DL",
        topic: "Performance & Academic Anxiety",
        rating: 5,
        date: "1 month ago"
    },
    {
        quote: "My shift patterns are a nightmare. I appreciate that Rebalance has a clear 24 hour reschedule rule because it forces me to commit to my mental health rather than pushing it off for work and other reasons.",
        name: "Vikram M.",
        location: "Mumbai, MH",
        topic: "Healthcare Worker Support",
        rating: 5,
        date: "1 month ago"
    },
    {
        quote: "I was the guy who thought therapy was 'soft.' My wife pushed me to join. After four sessions, I've realized how much anger I was carrying from my old job. It's made me a better father, honestly.",
        name: "Amit D.",
        location: "Pune, MH",
        topic: "Cognitive Behavioral Therapy (CBT)",
        rating: 5,
        date: "2 months ago"
    },
    {
        quote: "ReBalance helped me realize it was anxiety, not just boredom. I love that the platform for it is purely for the sessions, no fluff and endless text just high quality professional help.",
        name: "Riya Sen",
        location: "Kolkata, WB",
        topic: "Career Transition & Identity",
        rating: 5,
        date: "2 months ago"
    },
    {
        quote: "I tried therapy for the first time and it was an amazing and smooth experience. Loved the care shown by my therapists khushi and will keep coming back",
        name: "Marcus D.",
        location: "Chennai, TN",
        topic: "Online Counseling Privacy",
        rating: 5,
        date: "3 months ago"
    },
    {
        quote: "Losing my mom last year was paralyzing. My therapist didn't try to fix me or tell me what is right or wrong, she just sat with me and helped me deal with grief my way. Having that weekly hour is the only reason I'm back at work full time now.",
        name: "Deepa G.",
        location: "Hyderabad, TS",
        topic: "Grief & Trauma Recovery",
        rating: 5,
        date: "3 months ago"
    },
    {
        quote: "The thought of walking into a physical clinic made me want to hide. Being able to do this from my room, knowing it's secure and private , made all the difference for me.",
        name: "Karthik Raja",
        location: "Kochi, KL",
        topic: "Social Anxiety & Teletherapy",
        rating: 5,
        date: "4 months ago"
    },
    {
        quote: "The therapist I was matched with was super professional and held me accountable. Rebalance makes the process very smooth",
        name: "Simran K.",
        location: "Gurgaon, HR",
        topic: "Structured Goal & Habit Tracking",
        rating: 5,
        date: "4 months ago"
    },
];

const MONOGRAM_GRADIENTS = [
    'from-emerald-500/15 via-teal-500/10 to-transparent text-emerald-800 border-emerald-500/20',
    'from-blue-500/15 via-indigo-500/10 to-transparent text-indigo-800 border-indigo-500/20',
    'from-purple-500/15 via-fuchsia-500/10 to-transparent text-purple-800 border-purple-500/20',
    'from-amber-500/15 via-orange-500/10 to-transparent text-amber-800 border-amber-500/20',
    'from-rose-500/15 via-pink-500/10 to-transparent text-rose-800 border-rose-500/20',
];

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('');
};

export function TestimonialsSection() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft } = scrollContainerRef.current;
        const cardWidth = scrollContainerRef.current.firstElementChild?.clientWidth ?? 420;
        const gap = 24;
        const index = Math.round(scrollLeft / (cardWidth + gap));
        setActiveIndex(Math.min(Math.max(0, index), TESTIMONIALS.length - 1));
    };

    const scrollToSlide = (index: number) => {
        if (!scrollContainerRef.current) return;
        const cardWidth = scrollContainerRef.current.firstElementChild?.clientWidth ?? 420;
        const gap = 24;
        const scrollPos = index * (cardWidth + gap);
        scrollContainerRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
        setActiveIndex(index);
    };

    const handleNext = () => {
        const nextIdx = (activeIndex + 1) % TESTIMONIALS.length;
        scrollToSlide(nextIdx);
    };

    const handlePrev = () => {
        const prevIdx = (activeIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length;
        scrollToSlide(prevIdx);
    };

    // Auto-advance carousel smoothly every 6 seconds when not paused
    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(() => {
            handleNext();
        }, 6000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIndex, isPaused]);

    return (
        <section className="py-20 md:py-28 bg-gradient-to-b from-[#FDFBFB] via-neutral-50/70 to-[#FDFBFB] overflow-hidden relative border-y border-neutral-100/80">

            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header Section */}
            <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-normal uppercase tracking-wider bg-accent/10 text-accent mb-4 border border-accent/20">
                        <Sparkles className="w-3.5 h-3.5" />
                        Patient Reflections & Outcomes
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-foreground leading-[1.1] text-balance font-medium">
                        Real stories of clinical <span className="text-accent italic font-normal">resilience.</span>
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground mt-3 font-medium leading-relaxed">
                        Read unedited experiences and validated outcomes from verified individuals seeking supportive mental healthcare on REBalance.
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 self-start lg:self-end">
                    {/* Left/Right Navigation Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => { handlePrev(); setIsPaused(true); }}
                            aria-label="Previous review"
                            className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 text-neutral-700 hover:text-foreground hover:border-neutral-400 hover:shadow-md transition-all flex items-center justify-center active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent/40"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => { handleNext(); setIsPaused(true); }}
                            aria-label="Next review"
                            className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 text-neutral-700 hover:text-foreground hover:border-neutral-400 hover:shadow-md transition-all flex items-center justify-center active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent/40"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Interactive Carousel */}
            <div
                className="relative max-w-[1400px] mx-auto px-6"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 pt-2 touch-pan-y touch-pan-x select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {TESTIMONIALS.map((t, idx) => {
                        const gradient = MONOGRAM_GRADIENTS[idx % MONOGRAM_GRADIENTS.length];
                        const initials = getInitials(t.name);
                        const isCurrent = idx === activeIndex;

                        return (
                            <div
                                key={idx}
                                onClick={() => scrollToSlide(idx)}
                                className={`w-[86vw] sm:w-[420px] lg:w-[450px] shrink-0 snap-start rounded-[2.5rem] bg-white border p-7 sm:p-9 flex flex-col justify-between transition-all duration-500 relative group overflow-hidden cursor-pointer ${
                                    isCurrent
                                        ? 'border-neutral-300/90 shadow-xl ring-1 ring-neutral-900/5 translate-y-0'
                                        : 'border-neutral-200/70 shadow-sm hover:border-neutral-300 hover:shadow-md opacity-95 hover:opacity-100'
                                }`}
                            >
                                {/* Decorative quote mark accent */}
                                <div className="absolute -right-4 -bottom-6 text-neutral-100/50 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:-translate-x-2 group-hover:-translate-y-2">
                                    <Quote className="w-36 h-36 rotate-12 fill-neutral-100 text-transparent" />
                                </div>

                                <div>
                                    {/* Review text */}
                                    <blockquote className="text-sm sm:text-[15px] md:text-base text-neutral-900 leading-[1.7] font-serif italic mb-8 relative z-10 font-light">
                                        &ldquo;{t.quote}&rdquo;
                                    </blockquote>
                                </div>

                                {/* Footer (Reviewer details without photo) */}
                                <div className="flex items-center justify-between gap-4 mt-auto border-t border-neutral-100 pt-5 relative z-10">
                                    <div className="flex items-center gap-3.5">
                                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} border flex items-center justify-center font-medium text-xs shadow-xs tracking-wider shrink-0`}>
                                            {initials}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-foreground text-sm tracking-tight">{t.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination Dots */}
                <div className="flex items-center justify-center gap-2 mt-4">
                    {TESTIMONIALS.map((_, idx) => {
                        const active = idx === activeIndex;
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => { scrollToSlide(idx); setIsPaused(true); }}
                                aria-label={`Go to slide ${idx + 1}`}
                                className={`transition-all duration-300 rounded-full ${
                                    active
                                        ? 'w-8 h-2.5 bg-neutral-900 shadow-sm'
                                        : 'w-2.5 h-2.5 bg-neutral-300 hover:bg-neutral-400'
                                }`}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

