'use client';
import Link from 'next/link';
import { motion, useTransform, useSpring, type MotionValue } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useScrollSection } from '@/hooks/useScrollSection';
import { StaggerContainer, StaggerItem } from '@/components/ui/Stagger';

const FAQS = [
    { q: 'What is REBalance Therapy?', a: 'REBalance Therapy is a modern therapy platform designed to make finding mental health support simple, approachable, and comfortable through carefully selected therapists and seamless online booking.' },
    { q: 'How does REBalance Therapy work?', a: 'You can browse our network of therapists, choose the professional that feels right for you, and book sessions directly through our platform.' },
    { q: 'Are all therapists verified?', a: 'Yes, every therapist on REBalance Therapy is carefully reviewed and verified before joining our platform.' },
    { q: 'Can I reschedule my therapy session?', a: 'Yes, sessions can be rescheduled if requested at least 24 hours before your scheduled appointment time.' },
    { q: 'Are my sessions confidential?', a: 'Yes, confidentiality and emotional safety are extremely important to us and our therapists.' },
];

// Per-item component so each useTransform call is at component level (not in a loop)
function FAQItem({
    q, a, index, progress,
}: { q: string; a: string; index: number; progress: MotionValue<number> }) {
    const start = 0.05 + index * 0.12;
    const end = start + 0.18;
    const dir = index % 2 === 0 ? -32 : 32;

    const rawX = useTransform(progress, [start, end], [dir, 0]);
    const rawOpacity = useTransform(progress, [start, end], [0, 1]);
    const rawScale = useTransform(progress, [start, start + 0.08], [0.95, 1]);
    const x = useSpring(rawX, { stiffness: 130, damping: 22, mass: 0.9 });

    return (
        <motion.div style={{ x, opacity: rawOpacity, scale: rawScale }}>
            <details className="group bg-white border border-primary/10 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-primary/20 transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none select-none">
                    <h4 className="text-xs sm:text-sm md:text-base font-extrabold text-foreground group-hover:text-primary transition-colors pr-6">{q}</h4>
                    <span className="w-7 h-7 rounded-full bg-[#FAF8F8] border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-accent group-hover:bg-accent/10 group-hover:border-accent/20 transition-all duration-300 shrink-0">
                        <ChevronRight className="w-4 h-4 rotate-90 group-open:-rotate-90 transition-transform duration-300" />
                    </span>
                </summary>
                <div className="mt-4 border-t border-primary/5 pt-3.5 text-xs sm:text-sm leading-relaxed text-muted-foreground/80 font-semibold animate-in slide-in-from-top-1 duration-200">
                    {a}
                </div>
            </details>
        </motion.div>
    );
}

export function FAQSection() {
    const { ref, scrollYProgress, reducedMotion } = useScrollSection(['start 0.85', 'end 0.1']);

    const rawTitleOpacity = useTransform(scrollYProgress, [0, 0.12], [0, 1]);
    const rawTitleY = useTransform(scrollYProgress, [0, 0.12], [28, 0]);
    const titleY = useSpring(rawTitleY, { stiffness: 100, damping: 20 });

    return (
        <section ref={ref as React.RefObject<HTMLElement>} className="py-16 md:py-24 px-6 bg-[#FDFBFB] border-t border-primary/5">
            <div className="container mx-auto max-w-4xl space-y-12">

                {/* Title */}
                {reducedMotion ? (
                    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center space-y-4">
                        <h2 className="text-3xl md:text-5xl font-display text-foreground leading-[1.1] text-balance">
                            Got <span className="text-accent italic">questions?</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground font-semibold">Find quick answers to common questions about navigating our platform.</p>
                    </motion.div>
                ) : (
                    <motion.div style={{ opacity: rawTitleOpacity, y: titleY }} className="text-center space-y-4">
                        <h2 className="text-3xl md:text-5xl font-display text-foreground leading-[1.1] text-balance">
                            Got <span className="text-accent italic">questions?</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground font-semibold">Find quick answers to common questions about navigating our platform.</p>
                    </motion.div>
                )}

                {/* Items */}
                {reducedMotion ? (
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
                                    <div className="mt-4 border-t border-primary/5 pt-3.5 text-xs sm:text-sm leading-relaxed text-muted-foreground/80 font-semibold animate-in slide-in-from-top-1 duration-200">{faq.a}</div>
                                </details>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                ) : (
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {FAQS.map((faq, idx) => (
                            <FAQItem key={idx} q={faq.q} a={faq.a} index={idx} progress={scrollYProgress} />
                        ))}
                    </div>
                )}

                {/* Footer button */}
                <motion.div
                    style={reducedMotion ? {} : { opacity: rawTitleOpacity }}
                    {...(reducedMotion ? { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true } } : {})}
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
