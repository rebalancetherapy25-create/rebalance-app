'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export function BottomCTASection() {
    return (
        <section className="py-12 md:py-20 px-6 bg-primary text-center">
            <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px' }}
                style={{ WebkitBackfaceVisibility: 'hidden' }}
                transition={{ duration: 0.6, ease: EASE }}
                className="container mx-auto max-w-3xl"
            >
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-display text-white mb-6 md:mb-8 text-balance">
                    Your journey <span className="italic text-accent">starts here.</span>
                </h2>
                <p className="text-sm md:text-xl text-white/90 mb-10 md:mb-12 leading-relaxed px-4">
                    Be the next person to rediscover balance with one of our trusted therapists
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
                    <Link href="/therapists" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-white hover:bg-white/90 text-primary rounded-full h-14 md:h-16 px-10 md:px-12 font-bold text-base md:text-lg shadow-xl hover:scale-105 transition-transform duration-300">
                            Book a Consultation
                        </Button>
                    </Link>
                    <Link href="/therapists" className="text-white text-sm md:text-base font-medium hover:underline flex items-center mt-2 sm:mt-0">
                        View All Therapists <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" />
                    </Link>
                </div>
            </motion.div>
        </section>
    );
}

