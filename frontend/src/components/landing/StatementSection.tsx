'use client';
import { motion } from 'framer-motion';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export function StatementSection() {
    return (
        <section className="py-16 md:py-24 bg-white border-b border-border/30 text-center">
            <div className="container mx-auto px-6 max-w-4xl">
                <motion.h2
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '0px' }}
                    style={{ WebkitBackfaceVisibility: 'hidden' }}
                    transition={{ duration: 0.7, ease: EASE }}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display text-primary leading-tight tracking-tight text-balance"
                >
                    Your feelings matter, and <span className="italic text-accent">we&apos;re here to help.</span>
                </motion.h2>
            </div>
        </section>
    );
}

