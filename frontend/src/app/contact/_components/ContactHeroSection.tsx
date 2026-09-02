'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles } from 'lucide-react';

export function ContactHeroSection() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start start', 'end start']
    });

    const y = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <section ref={ref} className="relative pt-32 pb-16 px-6 overflow-hidden bg-[#FDFBFB]">
            {/* Ambient background */}
            <motion.div style={{ y, opacity }} className="absolute inset-0 z-0 pointer-events-none opacity-50">
                <div className="absolute top-0 right-1/4 w-[40vw] h-[40vw] bg-accent/10 rounded-full blur-[100px] mix-blend-multiply" />
                <div className="absolute bottom-1/4 left-1/4 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] mix-blend-multiply" />
            </motion.div>

            <div className="container relative z-10 mx-auto max-w-5xl flex flex-col items-center text-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/5 border border-accent/10 text-accent font-light text-xs tracking-[0.2em] uppercase mb-8"
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    Get in Touch
                </motion.div>
                
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1] tracking-tight text-foreground font-display max-w-4xl">
                    <motion.span 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="block"
                    >
                        We&apos;re here
                    </motion.span>
                    <motion.span 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="block text-primary italic font-serif"
                    >
                        to listen.
                    </motion.span>
                </h1>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-8 w-full max-w-2xl text-lg sm:text-xl text-muted-foreground font-medium leading-relaxed"
                >
                    Whether you have a question about our services, need help finding the right therapist, or just want to say hello—we&apos;d love to hear from you.
                </motion.p>
            </div>
        </section>
    );
}
