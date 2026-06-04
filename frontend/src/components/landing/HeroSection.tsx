'use client';
import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// Stagger timings for text elements
const TEXT_VARIANTS = {
    hidden: { opacity: 0, y: 48 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: EASE, delay: i * 0.12 },
    }),
};

interface HeroSectionProps {
    bannerImage: string;
}

export function HeroSection({ bannerImage }: HeroSectionProps) {
    const sectionRef = useRef<HTMLElement>(null);

    // Parallax: image moves up at 25% of scroll speed as you scroll past
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start start', 'end start'],
    });
    const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
    const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
    const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const textY = useTransform(scrollYProgress, [0, 0.5], [0, -40]);

    return (
        <section
            ref={sectionRef}
            className="px-6 pt-24 md:pt-28 pb-12 lg:pt-28 lg:pb-16 max-w-7xl mx-auto overflow-hidden"
        >
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

                {/* Left: text staggered on mount */}
                <motion.div
                    style={{ opacity: textOpacity, y: textY }}
                    className="flex flex-col items-center lg:items-start text-center lg:text-left"
                >
                    <motion.div
                        custom={0}
                        variants={TEXT_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-accent/10 text-accent font-medium text-xs tracking-wide mb-6"
                    >
                        The highest standard of mental healthcare.
                    </motion.div>

                    <motion.h1
                        custom={1}
                        variants={TEXT_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        className="text-4xl sm:text-5xl lg:text-6xl font-display text-foreground mb-6 lg:leading-[1.1] text-balance"
                    >
                        How are you <span className="italic text-primary">today?</span>
                    </motion.h1>

                    <motion.p
                        custom={2}
                        variants={TEXT_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        className="text-sm sm:text-base lg:text-lg text-foreground/80 mb-8 max-w-xl leading-relaxed text-balance"
                    >
                        Not the answer you give everyone else, but the honest one. Rebalance is here because that answer deserves more than a shrug. Behind every &ldquo;I&apos;m fine&rdquo; is something real, and we believe it deserves real support.
                    </motion.p>

                    <motion.div
                        custom={3}
                        variants={TEXT_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col sm:flex-row w-full sm:w-auto gap-4 mb-12 lg:mb-0"
                    >
                        <Link href="/therapists" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-14 lg:px-8 font-medium text-base shadow-sm">
                                Book a Consultation <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                        <Link href="/therapists" className="w-full sm:w-auto">
                            <Button size="lg" variant="outline" className="w-full rounded-full h-14 lg:px-8 font-medium text-base border-primary/20 text-primary hover:bg-primary/5">
                                View Our Therapists
                            </Button>
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Right: parallax image */}
                <motion.div
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
                    className="relative w-full max-w-md lg:max-w-xl mx-auto aspect-[4/3] lg:aspect-[4/3.5] rounded-3xl lg:rounded-[3rem] overflow-hidden shadow-2xl"
                >
                    <motion.div
                        style={{ y: imageY, scale: imageScale }}
                        className="absolute inset-0 w-full h-[120%] -top-[10%]"
                    >
                        <Image
                            src={bannerImage}
                            alt="Therapy session"
                            fill
                            className="object-cover"
                            priority
                        />
                    </motion.div>

                    {/* Stats badge — floats in after image */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: EASE, delay: 0.8 }}
                        className="absolute bottom-4 lg:bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl p-3 lg:p-4 shadow-xl flex flex-col items-center min-w-[240px] lg:min-w-[280px] w-11/12 lg:w-auto border border-border/50"
                    >
                        <div className="flex -space-x-2 mb-1 lg:mb-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                                    <Image
                                        src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=100&auto=format&fit=crop&crop=faces&sat=-50"
                                        alt="User"
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] lg:text-xs font-bold text-foreground">10,000+ people</p>
                        <p className="text-[9px] lg:text-[10px] text-muted-foreground mb-1">have started their healing journey with us</p>
                        <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 lg:w-4 lg:h-4 fill-yellow-500 text-yellow-500" />
                            <span className="text-[10px] lg:text-xs font-bold">
                                4.9/5 <span className="font-normal text-muted-foreground">from 1,200+ reviews</span>
                            </span>
                        </div>
                    </motion.div>
                </motion.div>

            </div>
        </section>
    );
}
