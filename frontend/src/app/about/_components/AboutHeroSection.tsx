'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

export function AboutHeroSection() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start start', 'end start']
    });

    const y = useTransform(scrollYProgress, [0, 1], ['0%', '60%']);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
    const logoY = useTransform(scrollYProgress, [0, 1], ['0%', '120%']);
    const logoRotate = useTransform(scrollYProgress, [0, 1], [0, -15]);

    return (
        <section ref={ref} className="relative min-h-[100dvh] min-h-screen flex flex-col justify-center overflow-hidden bg-[#FDFBFB] pt-32 pb-24 px-6">
            
            {/* Massive Abstract Background Logo */}
            <motion.div 
                style={{ y: logoY, rotate: logoRotate, WebkitBackfaceVisibility: 'hidden' }}
                className="absolute right-[-15%] top-[-5%] w-[100vw] h-[100vw] md:w-[70vw] md:h-[70vw] opacity-[0.02] pointer-events-none"
            >
                <Image
                    src="/images/logo.svg"
                    alt="ReBalance Therapy Background"
                    fill
                    className="object-contain"
                />
            </motion.div>

            <motion.div style={{ y, opacity, WebkitBackfaceVisibility: 'hidden' }} className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-accent/10 rounded-full blur-[100px] mix-blend-multiply" />
                <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] mix-blend-multiply" />
            </motion.div>

            <div className="container relative z-10 mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">
                    
                    {/* Creative 3D Logo Presentation */}
                    <div className="lg:col-span-6 order-2 lg:order-1 flex justify-center lg:justify-start">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="relative w-full max-w-[28rem] sm:max-w-xl lg:max-w-[40rem] group cursor-default"
                            style={{ WebkitBackfaceVisibility: 'hidden' }}
                        >
                            {/* Glass Plate */}
                            <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white shadow-2xl shadow-primary/10 transition-transform duration-700 ease-out group-hover:[transform:rotateY(10deg)_rotateX(5deg)_scale(1.02)] origin-center" />
                            
                            {/* The Logo itself */}
                            <div className="relative p-12 sm:p-24 flex items-center justify-center transition-transform duration-700 ease-out group-hover:[transform:translateZ(60px)_scale(1.1)] origin-center">
                                <Image
                                    src="/images/logo.svg"
                                    alt="ReBalance Therapy Logo"
                                    width={800}
                                    height={800}
                                    priority
                                    className="w-full h-auto object-contain drop-shadow-2xl"
                                />
                            </div>

                            {/* Decorative Ambient Orbs */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl transition-all duration-700 group-hover:bg-accent/40 group-hover:scale-150 -z-10" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl transition-all duration-700 group-hover:bg-primary/30 group-hover:scale-150 -z-10" />
                        </motion.div>
                    </div>

                    {/* Typography */}
                    <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-center lg:items-start text-center lg:text-left z-20">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent/5 border border-accent/10 text-accent font-normal text-xs tracking-[0.2em] uppercase mb-8"
                        >
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            The Vision
                        </motion.div>
                        
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.05] tracking-tight text-foreground font-display mb-8">
                            <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="block">Finding balance</motion.span>
                            <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="block text-primary italic font-serif pr-2">should feel easy.</motion.span>
                        </h1>

                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="w-full max-w-xl text-lg sm:text-xl text-muted-foreground font-medium leading-relaxed"
                        >
                            We believe mental health support should be approachable, calming, and human from the very first interaction. No clinical jargon, no endless directories—just a clear path forward.
                        </motion.p>
                    </div>

                </div>
            </div>
            
            {/* Scroll Indicator */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <span className="text-[10px] uppercase tracking-[0.3em] font-normal text-muted-foreground/50">Discover</span>
                <motion.div 
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="w-[1px] h-10 bg-gradient-to-b from-accent/50 to-transparent"
                />
            </motion.div>
        </section>
    );
}
