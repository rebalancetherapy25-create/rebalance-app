'use client';
import React, { useRef, useState, useEffect } from 'react';
import { motion, useTransform, useSpring, useMotionTemplate } from 'framer-motion';
import { Star, Quote, ArrowLeft, ArrowRight, BadgeCheck, Sparkles } from 'lucide-react';
import { useScrollSection } from '@/hooks/useScrollSection';

const TESTIMONIALS = [
    {
        quote: "I've tried three different therapy platforms before this. The professional I found through REBalance actually challenged my perspective instead of just listening passively. I'm finally breaking the 'doom-scrolling' anxiety cycle and sleeping peacefully.",
        name: "Kavita Iyer",
        location: "Mumbai, MH",
        topic: "Anxiety & Sleep Support",
        rating: 5,
        date: "2 weeks ago"
    },
    {
        quote: "Running a startup is intensely lonely. I needed a confidential space to talk without judgment about founder stress and financial burnout. The platform is straightforward, secure, and makes professional boundaries effortless to maintain.",
        name: "Rahul Hegde",
        location: "Bangalore, KA",
        topic: "Executive Stress & Burnout",
        rating: 5,
        date: "3 weeks ago"
    },
    {
        quote: "I used to experience severe physical panic attacks before academic presentations. My therapist walked me through practical Somatic grounding techniques that genuinely work in high-stakes moments. I feel entirely in control of my body now.",
        name: "Sarah Thomas",
        location: "New Delhi, DL",
        topic: "Performance & Academic Anxiety",
        rating: 5,
        date: "1 month ago"
    },
    {
        quote: "My hospital shift patterns are unpredictable and exhausting. I deeply appreciate REBalance's transparent scheduling and easy re-booking features because it keeps me accountable to my self-care routines rather than canceling when work gets heavy.",
        name: "Dr. Vikram Mehta",
        location: "Mumbai, MH",
        topic: "Healthcare Worker Support",
        rating: 5,
        date: "1 month ago"
    },
    {
        quote: "I was someone who foolishly believed seeking counseling was a sign of weakness. After just four CBT sessions, I discovered how much unaddressed grief and defensive anger I was harboring. It has made me a vastly better father and spouse.",
        name: "Amit Deshpande",
        location: "Pune, MH",
        topic: "Cognitive Behavioral Therapy (CBT)",
        rating: 5,
        date: "2 months ago"
    },
    {
        quote: "I felt trapped in a corporate career I dreaded. REBalance helped me decouple my identity from my job title and process the underlying anxiety. No gimmicks or tedious questionnaires here—just world-class clinical professionals.",
        name: "Riya Sen",
        location: "Kolkata, WB",
        topic: "Career Transition & Identity",
        rating: 5,
        date: "2 months ago"
    },
    {
        quote: "The HD encrypted video quality is flawless, which is essential when you're having an emotionally delicate conversation. I also deeply respect their prominent crisis disclaimers—it proves they prioritize patient ethics and safety above all else.",
        name: "Marcus D'Souza",
        location: "Chennai, TN",
        topic: "Online Counseling Privacy",
        rating: 5,
        date: "3 months ago"
    },
    {
        quote: "Losing my mother last year was completely paralyzing. My therapist didn't attempt to force premature optimism; she created a safe sanctuary for acute grief recovery. That non-judgmental weekly hour is the reason I am functioning again.",
        name: "Deepa Gopalakrishnan",
        location: "Hyderabad, TS",
        topic: "Grief & Trauma Recovery",
        rating: 5,
        date: "3 months ago"
    },
    {
        quote: "The mere thought of sitting in a busy clinical waiting room triggered severe social withdrawal for me. Being able to connect with a licensed clinical psychologist directly from my home, via a fully confidential link, removed every barrier.",
        name: "Karthik Raja",
        location: "Kochi, KL",
        topic: "Social Anxiety & Teletherapy",
        rating: 5,
        date: "4 months ago"
    },
    {
        quote: "I wanted structured tools, measurable emotional goals, and professional accountability. The psychologist I matched with delivered exactly that from session one. REBalance handles the administrative scheduling so seamlessly that therapy feels effortless.",
        name: "Simran Kaur",
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
    const { ref, scrollYProgress, reducedMotion } = useScrollSection(['start 0.9', 'end 0.3']);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const rawHeadingClip = useTransform(scrollYProgress, [0, 0.45], [100, 0]);
    const rawPillX = useTransform(scrollYProgress, [0.1, 0.55], [40, 0]);
    const rawPillOpacity = useTransform(scrollYProgress, [0.1, 0.4], [0, 1]);
    const headingClipPath = useMotionTemplate`inset(0 0 0 ${rawHeadingClip}%)`;
    const pillX = useSpring(rawPillX, { stiffness: 110, damping: 22 });

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
    }, [activeIndex, isPaused]);

    return (
        <section ref={ref as React.RefObject<HTMLElement>} className="py-20 md:py-28 bg-gradient-to-b from-[#FDFBFB] via-neutral-50/70 to-[#FDFBFB] overflow-hidden relative border-y border-neutral-100/80">

            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header Section */}
            <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-accent/10 text-accent mb-4 border border-accent/20">
                        <Sparkles className="w-3.5 h-3.5" />
                        Patient Reflections & Outcomes
                    </div>

                    {reducedMotion ? (
                        <motion.h2
                            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="text-3xl sm:text-4xl md:text-5xl font-display text-foreground leading-[1.1] text-balance font-extrabold"
                        >
                            Real stories of clinical <span className="text-accent italic font-normal">resilience.</span>
                        </motion.h2>
                    ) : (
                        <motion.h2
                            style={{ clipPath: headingClipPath }}
                            className="text-3xl sm:text-4xl md:text-5xl font-display text-foreground leading-[1.1] text-balance font-extrabold"
                        >
                            Real stories of clinical <span className="text-accent italic font-normal">resilience.</span>
                        </motion.h2>
                    )}
                    <p className="text-sm md:text-base text-muted-foreground mt-3 font-medium leading-relaxed">
                        Read unedited experiences and validated outcomes from verified individuals seeking supportive mental healthcare on REBalance.
                    </p>
                </div>

                {/* Controls & Rating summary badge */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 self-start lg:self-end">
                    <motion.div
                        style={reducedMotion ? {} : { x: pillX, opacity: rawPillOpacity }}
                        {...(reducedMotion ? { initial: { opacity: 0, x: 24 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true } } : {})}
                        className="flex items-center gap-2.5 bg-white px-4.5 py-2.5 rounded-2xl border border-neutral-200/80 shadow-xs"
                    >
                        <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/50">
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                        </div>
                        <div className="text-left">
                            <div className="text-xs font-black text-foreground leading-none">4.9 / 5.0 Rating</div>
                            <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">Over 1,200+ confirmed therapy hours</div>
                        </div>
                    </motion.div>

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
                onTouchStart={() => setIsPaused(true)}
            >
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 pt-2 select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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
                                    {/* Star Rating & Verified tag header */}
                                    <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
                                        <div className="flex items-center gap-1 bg-amber-50/90 border border-amber-200/60 px-3 py-1.5 rounded-xl">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star key={star} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                            ))}
                                            <span className="text-xs font-black text-amber-950 ml-1.5">{t.rating}.0</span>
                                        </div>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs">
                                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 fill-emerald-100" />
                                            Verified Patient
                                        </span>
                                    </div>

                                    {/* Review text */}
                                    <blockquote className="text-sm sm:text-[15px] md:text-base text-foreground/85 leading-[1.7] font-serif italic mb-8 relative z-10 font-normal">
                                        &ldquo;{t.quote}&rdquo;
                                    </blockquote>
                                </div>

                                {/* Footer (Reviewer details without photo) */}
                                <div className="flex items-center justify-between gap-4 mt-auto border-t border-neutral-100 pt-5 relative z-10">
                                    <div className="flex items-center gap-3.5">
                                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} border flex items-center justify-center font-extrabold text-xs shadow-xs tracking-wider shrink-0`}>
                                            {initials}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-foreground text-sm tracking-tight">{t.name}</p>
                                                <span className="text-neutral-300">•</span>
                                                <p className="text-[11px] font-semibold text-neutral-500">{t.location}</p>
                                            </div>
                                            <p className="text-xs font-bold text-accent mt-0.5">{t.topic}</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-medium text-neutral-400 shrink-0 hidden sm:block">
                                        {t.date}
                                    </span>
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

