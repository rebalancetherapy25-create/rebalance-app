'use client';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useTransform, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Phone, Mail } from 'lucide-react';
import { useScrollSection } from '@/hooks/useScrollSection';

export function BeginJourneySection() {
    const { ref, scrollYProgress, reducedMotion } = useScrollSection(['start 0.85', 'end 0.15']);

    const rawTextY = useTransform(scrollYProgress, [0, 0.4], [56, 0]);
    const rawTextOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
    const textY = useSpring(rawTextY, { stiffness: 100, damping: 20 });
    // Parallax on image — no spring on % strings
    const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%']);

    return (
        <section ref={ref as React.RefObject<HTMLElement>} className="py-16 md:py-24 px-6 bg-[#FDFBFB]">
            <div className="container mx-auto max-w-5xl">
                <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 shadow-xl border border-border/30 flex flex-col md:flex-row items-center gap-12">

                    {/* Text */}
                    <motion.div
                        style={reducedMotion ? {} : { y: textY, opacity: rawTextOpacity }}
                        {...(reducedMotion ? { initial: { opacity: 0, y: 32 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.7 } } : {})}
                        className="flex-1 text-center md:text-left w-full space-y-6"
                    >
                        <h3 className="text-2xl md:text-3xl font-display text-foreground leading-snug">
                            Not sure what you&apos;re feeling or which therapist is the right fit?
                        </h3>
                        <p className="text-sm md:text-base text-muted-foreground/90 font-medium leading-relaxed">
                            You don&apos;t have to navigate it alone — our team is here to make the process feel simpler, more comfortable, and less overwhelming.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center md:justify-start">
                            <a href="tel:+919341210280" className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#FAF8F8] px-6 py-3 border border-primary/10 shadow-sm font-bold text-primary hover:bg-[#FAF8F8]/85 hover:border-primary/20 transition-all duration-300 text-sm sm:text-base">
                                <Phone className="w-4 h-4 text-accent shrink-0" />
                                <span>+91 9341210280</span>
                            </a>
                            <a href="mailto:rebalancetherapy25@gmail.com" className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#FAF8F8] px-6 py-3 border border-primary/10 shadow-sm font-bold text-primary hover:bg-[#FAF8F8]/85 hover:border-primary/20 transition-all duration-300 text-sm sm:text-base">
                                <Mail className="w-4 h-4 text-accent shrink-0" />
                                <span>rebalancetherapy25@gmail.com</span>
                            </a>
                        </div>
                        <p className="text-sm md:text-base text-muted-foreground/80 font-medium italic">
                            And we&apos;ll help guide you towards the support that best matches your needs.
                        </p>
                        <div className="pt-2">
                            <Link href="/therapists" className="inline-block w-full sm:w-auto">
                                <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-full h-14 px-8 font-semibold text-base shadow-sm transition-all hover:scale-[1.02] duration-300">
                                    Explore Therapists
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Image with parallax — mirrors HeroSection pattern */}
                    <div className="flex-1 w-full hidden md:block">
                        <div className="relative aspect-square md:aspect-[4/3] w-full rounded-3xl overflow-hidden shadow-2xl">
                            <motion.div
                                style={reducedMotion ? {} : { y: imageY }}
                                className="absolute inset-0 w-full h-[120%] -top-[10%]"
                            >
                                <Image
                                    src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=800&auto=format&fit=crop"
                                    alt="Begin journey"
                                    fill
                                    className="object-cover"
                                />
                            </motion.div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
