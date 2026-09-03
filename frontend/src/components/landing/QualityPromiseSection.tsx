'use client';
import { motion } from 'framer-motion';
import { UserCheck } from 'lucide-react';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export function QualityPromiseSection() {
    return (
        <section className="py-20 md:py-28 px-6 bg-[#FDFBFB]">
            <div className="container mx-auto max-w-5xl">
                <div className="grid md:grid-cols-12 gap-12 md:gap-16 items-center">

                    {/* Left — text */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '0px' }}
                        style={{ WebkitBackfaceVisibility: 'hidden' }}
                        transition={{ duration: 0.7, ease: EASE }}
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
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '0px' }}
                        style={{ WebkitBackfaceVisibility: 'hidden' }}
                        transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
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

