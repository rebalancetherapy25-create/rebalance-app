'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function AboutStorySection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start end', 'end start']
    });

    const yLeft = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
    
    return (
        <section ref={containerRef} className="py-24 md:py-40 px-6 bg-white border-y border-border/40 relative">
            <div className="container mx-auto max-w-7xl">
                <div className="grid md:grid-cols-12 gap-16 lg:gap-24 items-start">
                    
                    {/* Left Sticky Column */}
                    <div className="md:col-span-5 relative h-full">
                        <motion.div 
                            style={{ y: yLeft }}
                            className="md:sticky md:top-40 space-y-8"
                        >
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display text-foreground leading-[1.1] tracking-tight">
                                The catalyst for <span className="italic text-accent">change.</span>
                            </h2>
                            <p className="text-xl font-medium text-muted-foreground/80 leading-relaxed border-l-4 border-accent/40 pl-6">
                                People who were already vulnerable were expected to navigate a confusing system at one of the most difficult moments in their lives.
                            </p>
                        </motion.div>
                    </div>

                    {/* Right Scrolling Column */}
                    <div className="md:col-span-7 space-y-12 md:space-y-16 text-lg md:text-xl font-medium text-foreground/80 leading-relaxed">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                        >
                            <p className="first-letter:text-7xl first-letter:font-display first-letter:text-primary first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8] mb-8">
                          Rebalance Therapy was born from a simple but powerful realisation that seeking mental health support should never feel overwhelming, complicated, or intimidating.
                            </p>
                           
                        </motion.div>
                        
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className="pt-8 border-t border-border/40"
                        >
                            <p className="mb-8">
                                That observation became the foundation of ReBalance Therapy. We wanted to create a space where mental health support feels approachable, calming, and human from the very first interaction. 
                            </p>
                            <p>
                                Our vision was to design an experience that feels as seamless and elegant as booking any premium wellness service — simple navigation, clear communication, and an environment that immediately makes people feel safe and understood. We believe therapy should not feel clinical or transactional; it should feel welcoming, personal, and empowering. Every detail of our platform is intentionally built to reduce stress and make reaching out for support feel like a positive first step rather than a daunting task.
                            </p>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
