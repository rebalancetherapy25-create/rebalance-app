'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { StaggerContainer, StaggerItem } from '@/components/ui/Stagger';

const FAQS = [
    { q: 'What is REBalance Therapy?', a: 'REBalance Therapy is a modern therapy platform designed to make finding mental health support simple, approachable, and comfortable through carefully selected therapists and seamless online booking.' },
    { q: 'How does REBalance Therapy work?', a: 'You can browse our network of therapists, choose the professional that feels right for you, and book sessions directly through our platform.' },
    { q: 'Are all therapists verified?', a: 'Yes, every therapist on REBalance Therapy is carefully reviewed and verified before joining our platform.' },
    { q: 'Can I reschedule my therapy session?', a: 'Yes, sessions can be rescheduled if requested at least 24 hours before your scheduled appointment time.' },
    { q: 'Are my sessions confidential?', a: 'Yes, confidentiality and emotional safety are extremely important to us and our therapists.' },
];

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export function FAQSection() {
    return (
        <section className="py-16 md:py-24 px-6 bg-[#FDFBFB] border-t border-primary/5">
            <div className="container mx-auto max-w-4xl space-y-12">

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '0px' }}
                    style={{ WebkitBackfaceVisibility: 'hidden' }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="text-center space-y-4"
                >
                    <h2 className="text-3xl md:text-5xl font-display text-foreground leading-[1.1] text-balance">
                        Got <span className="text-accent italic">questions?</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
                        Find quick answers to common questions about navigating our platform.
                    </p>
                </motion.div>

                {/* Items */}
                <StaggerContainer className="space-y-4 max-w-3xl mx-auto" stagger={0.09} delay={80}>
                    {FAQS.map((faq, idx) => (
                        <StaggerItem key={idx}>
                            <details className="group bg-white border border-primary/10 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-primary/20 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex items-center justify-between cursor-pointer focus:outline-none select-none">
                                    <h4 className="text-xs sm:text-sm md:text-base font-extrabold text-foreground group-hover:text-primary transition-colors pr-6">{faq.q}</h4>
                                    <span className="w-7 h-7 rounded-full bg-[#FAF8F8] border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-accent group-hover:bg-accent/10 transition-all duration-300 shrink-0">
                                        <ChevronRight className="w-4 h-4 rotate-90 group-open:-rotate-90 transition-transform duration-300" />
                                    </span>
                                </summary>
                                <div className="mt-4 border-t border-primary/5 pt-3.5 text-xs sm:text-sm leading-relaxed text-muted-foreground/80 font-semibold animate-in slide-in-from-top-1 duration-200">
                                    {faq.a}
                                </div>
                            </details>
                        </StaggerItem>
                    ))}
                </StaggerContainer>

                {/* Footer button */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '0px' }}
                    style={{ WebkitBackfaceVisibility: 'hidden' }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="text-center pt-4"
                >
                    <Link href="/faq">
                        <Button variant="outline" className="rounded-full h-12 px-8 font-semibold text-sm border-primary/20 text-primary hover:bg-primary/5">
                            View All 39 FAQs <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

