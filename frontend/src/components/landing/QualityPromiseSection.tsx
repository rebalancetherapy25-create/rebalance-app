'use client';
import { motion, useTransform, useSpring } from 'framer-motion';
import { UserCheck } from 'lucide-react';
import { useScrollSection } from '@/hooks/useScrollSection';

const SPRING = { stiffness: 90, damping: 18, mass: 1.2 };

export function QualityPromiseSection() {
    const { ref, scrollYProgress, reducedMotion } = useScrollSection(['start 0.85', 'end 0.45']);

    const rawLeftX = useTransform(scrollYProgress, [0, 0.6], [-80, 0]);
    const rawRightX = useTransform(scrollYProgress, [0, 0.6], [80, 0]);
    const rawOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
    const leftX = useSpring(rawLeftX, SPRING);
    const rightX = useSpring(rawRightX, SPRING);

    return (
        <section ref={ref as React.RefObject<HTMLElement>} className="py-20 md:py-28 px-6 bg-[#FDFBFB]">
            <div className="container mx-auto max-w-5xl">
                <div className="grid md:grid-cols-12 gap-12 md:gap-16 items-center">

                    {/* Left — text */}
                    <motion.div
                        style={reducedMotion ? {} : { x: leftX, opacity: rawOpacity }}
                        {...(reducedMotion ? { initial: { opacity: 0, x: -40 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.7 } } : {})}
                        className="md:col-span-6 space-y-6"
                    >
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display text-foreground leading-[1.1] text-balance">
                            Because who you speak to <br />
                            <span className="text-accent italic">changes everything.</span>
                        </h2>
                        <p className="text-base sm:text-lg text-muted-foreground/90 font-medium leading-relaxed">
                            That&apos;s a responsibility we take seriously. Everyone we work with is trained, vetted, and held to a standard of care.
                        </p>
                    </motion.div>

                    {/* Right — card */}
                    <motion.div
                        style={reducedMotion ? {} : { x: rightX, opacity: rawOpacity }}
                        {...(reducedMotion ? { initial: { opacity: 0, x: 40 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.7, delay: 0.15 } } : {})}
                        className="md:col-span-6"
                    >
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-primary/10 shadow-xl space-y-6 hover:border-primary/20 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-xs">
                                <UserCheck className="w-7 h-7" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl sm:text-2xl font-display text-foreground font-semibold">Safe Hands, Every Time</h3>
                                <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                                    We carefully review every therapist before they join Rebalance because who you speak to matters as much as deciding to speak at all.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
