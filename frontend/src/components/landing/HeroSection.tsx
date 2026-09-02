'use client';
import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

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

    return (
        <section
            ref={sectionRef}
            className="px-6 pt-24 md:pt-28 pb-12 lg:pt-28 lg:pb-16 max-w-7xl mx-auto overflow-hidden"
        >
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

                {/* Left: text staggered on mount */}
                <div
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
                </div>

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
                            loading="lazy"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                    </motion.div>

                    {/* Stats badge — floats in after image */}
                   
                </motion.div>

            </div>
        </section>
    );
}
