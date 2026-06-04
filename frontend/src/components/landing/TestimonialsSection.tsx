'use client';
import Image from 'next/image';
import { motion, useTransform, useSpring, useMotionTemplate } from 'framer-motion';
import { Star } from 'lucide-react';
import { useScrollSection } from '@/hooks/useScrollSection';

const TESTIMONIALS = [
    { quote: "I've tried three different apps before this. The professional I found through REBalance actually challenged my perspective. I'm finally stopping the 'doom-scrolling' cycle and sleeping better.", name: "Kavita I.", location: "Mumbai", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" },
    { quote: "Running a startup is lonely. I needed someone to talk to who wouldn't judge me for being stressed about payroll. The platform is straightforward and makes professional boundaries easier to keep.", name: "Rahul Hegde", location: "Bangalore", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop" },
    { quote: "I used to get physical shakes before presenting my thesis. My therapist walked me through grounding techniques that actually work. I feel way more in control of my body now.", name: "Sarah T.", location: "Delhi", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop" },
    { quote: "My shift patterns are a nightmare. I appreciate that REBalance has a clear 24-hour reschedule rule because it forces me to commit to my mental health rather than pushing it off.", name: "Vikram M.", location: "Mumbai", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop" },
    { quote: "I was the guy who thought therapy was 'soft.' My wife pushed me to join. After four sessions, I've realized how much anger I was carrying. It's made me a better father, honestly.", name: "Amit D.", location: "Pune", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop" },
    { quote: "I felt stuck in a career I hated. REBalance helped me realize it was anxiety, not just boredom. The platform is purely for the sessions—no fluff, just high-quality professional help.", name: "Riya Sen", location: "Kolkata", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop" },
    { quote: "The video quality is great, which matters when you're trying to have an emotional conversation. I appreciate the crisis disclaimers — it shows they care about safety, not just profit.", name: "Marcus D.", location: "Chennai", img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop" },
    { quote: "Losing my mom last year was paralyzing. My therapist didn't try to 'fix' me; she just sat with me in the grief. Having that weekly hour is the only reason I'm back at work full-time.", name: "Deepa G.", location: "Hyderabad", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop" },
    { quote: "The thought of walking into a physical clinic made me want to hide. Being able to do this from my room, knowing it's a secure and private link, made all the difference for me.", name: "Karthik Raja", location: "Cochin", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop" },
    { quote: "I didn't want fluff. I wanted tools. The independent therapist I was matched with was super professional and held me accountable. REBalance makes the admin side of therapy so easy.", name: "Simran K.", location: "Gurgaon", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop" },
];

const DOUBLED = [...TESTIMONIALS, ...TESTIMONIALS];

export function TestimonialsSection() {
    const { ref, scrollYProgress, reducedMotion } = useScrollSection(['start 0.9', 'end 0.4']);

    const rawHeadingClip = useTransform(scrollYProgress, [0, 0.45], [100, 0]);
    const rawPillX = useTransform(scrollYProgress, [0.1, 0.55], [40, 0]);
    const rawPillOpacity = useTransform(scrollYProgress, [0.1, 0.4], [0, 1]);
    const headingClipPath = useMotionTemplate`inset(0 0 0 ${rawHeadingClip}%)`;
    const pillX = useSpring(rawPillX, { stiffness: 110, damping: 22 });

    return (
        <section ref={ref as React.RefObject<HTMLElement>} className="py-16 md:py-24 bg-[#FDFBFB] overflow-hidden relative">

            {/* Header */}
            <div className="max-w-7xl mx-auto px-6 mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    {reducedMotion ? (
                        <motion.h2
                            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="text-3xl md:text-5xl font-display text-foreground leading-[1.1] text-balance"
                        >
                            Real stories of <span className="text-accent italic">resilience.</span>
                        </motion.h2>
                    ) : (
                        <motion.h2
                            style={{ clipPath: headingClipPath }}
                            className="text-3xl md:text-5xl font-display text-foreground leading-[1.1] text-balance"
                        >
                            Real stories of <span className="text-accent italic">resilience.</span>
                        </motion.h2>
                    )}
                    <p className="text-xs sm:text-sm text-muted-foreground mt-3 font-semibold">
                        Anonymized reflections from verified online therapeutic sessions.
                    </p>
                </div>
                <motion.div
                    style={reducedMotion ? {} : { x: pillX, opacity: rawPillOpacity }}
                    {...(reducedMotion ? { initial: { opacity: 0, x: 24 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true } } : {})}
                    className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-full border border-primary/10 shadow-xs self-start md:self-auto"
                >
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-xs font-black text-foreground">4.9<span className="font-semibold text-muted-foreground">/5 average rating</span></span>
                </motion.div>
            </div>

            {/* Marquee */}
            <div className="relative w-full overflow-hidden py-4">
                <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-44 bg-gradient-to-r from-[#FDFBFB] to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-44 bg-gradient-to-l from-[#FDFBFB] to-transparent z-10 pointer-events-none" />
                <div className="flex gap-6 w-max animate-marquee hover:[animation-play-state:paused] py-4 select-none">
                    {DOUBLED.map((t, idx) => (
                        <div key={idx} className="w-[300px] sm:w-[360px] bg-white rounded-[2rem] p-6 sm:p-8 shadow-md border border-primary/5 shrink-0 flex flex-col justify-between hover:border-accent/30 hover:shadow-lg transition-all duration-300">
                            <div className="flex gap-1 mb-5">
                                {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />)}
                            </div>
                            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-medium mb-6 font-display italic">&ldquo;{t.quote}&rdquo;</p>
                            <div className="flex items-center gap-3 mt-auto border-t border-primary/5 pt-4">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-primary/10">
                                    <Image src={t.img} alt={t.name} width={40} height={40} className="object-cover w-full h-full" />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground text-xs sm:text-sm">{t.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-semibold">{t.location}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
