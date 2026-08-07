'use client';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useTransform, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Phone, Mail, ArrowRight, HeartHandshake } from 'lucide-react';
import { useScrollSection } from '@/hooks/useScrollSection';

export function BeginJourneySection() {
    const { ref, scrollYProgress, reducedMotion } = useScrollSection(['start 0.9', 'end 0.1']);

    const rawTextY = useTransform(scrollYProgress, [0, 0.4], [40, 0]);
    const rawTextOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
    const textY = useSpring(rawTextY, { stiffness: 90, damping: 20 });
    
    const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '-15%']);

    return (
        <section ref={ref as React.RefObject<HTMLElement>} className="py-24 md:py-32 px-6 relative overflow-hidden bg-white">
            {/* Soft background accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] opacity-70" />
                <div className="absolute bottom-1/4 -right-64 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] opacity-70" />
            </div>

            <div className="container mx-auto max-w-6xl relative z-10">
                <div className="bg-[#FAF8F8] rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 lg:p-20 shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-primary/5 flex flex-col lg:flex-row items-center gap-16 lg:gap-24 overflow-hidden relative">
                    
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-50 pointer-events-none" />

                    {/* Text Content */}
                    <motion.div
                        style={reducedMotion ? {} : { y: textY, opacity: rawTextOpacity }}
                        {...(reducedMotion ? { initial: { opacity: 0, y: 32 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.7 } } : {})}
                        className="flex-1 text-center lg:text-left w-full space-y-8 z-10"
                    >
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
                                <HeartHandshake className="w-4 h-4" />
                                <span>We're here for you</span>
                            </div>
                            <h3 className="text-3xl md:text-4xl lg:text-5xl font-display text-foreground leading-[1.15] tracking-tight">
                                Not sure where to start <br className="hidden lg:block"/> or what you need?
                            </h3>
                            <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                You don't have to navigate this journey alone. Our dedicated team is here to make the process of finding the right therapist simple, comfortable, and stress-free.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center lg:justify-start">
                            <a href="tel:+919341210280" className="group flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Phone className="w-4 h-4 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Call Us</p>
                                    <p className="text-sm font-bold text-foreground">+91 9341210280</p>
                                </div>
                            </a>
                            <a href="mailto:rebalancetherapy25@gmail.com" className="group flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Mail className="w-4 h-4 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Email Us</p>
                                    <p className="text-sm font-bold text-foreground">rebalancetherapy25@gmail.com</p>
                                </div>
                            </a>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
                            <Link href="/therapists" className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-xl h-14 px-8 font-semibold text-base shadow-lg shadow-primary/25 transition-all hover:translate-y-[-2px] duration-300 group flex items-center gap-2">
                                    Explore Therapists
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <p className="text-sm text-muted-foreground/80 font-medium italic max-w-[200px] text-center sm:text-left">
                                We'll help match you with the right support.
                            </p>
                        </div>
                    </motion.div>

                    {/* Images Section */}
                    <div className="flex-1 w-full hidden md:block z-10">
                        <div className="relative w-full aspect-[4/5] lg:aspect-square">
                            {/* Main Image */}
                            <div className="absolute top-0 right-0 w-[85%] h-[85%] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white z-10">
                                <motion.div
                                    style={reducedMotion ? {} : { y: imageY }}
                                    className="absolute inset-0 w-full h-[120%] -top-[10%]"
                                >
                                    <Image
                                        src="https://images.unsplash.com/photo-1544027993-37db48d17a10?q=80&w=1000&auto=format&fit=crop"
                                        alt="Peaceful and calming therapy environment"
                                        fill
                                        className="object-cover"
                                    />
                                </motion.div>
                            </div>
                            
                            {/* Secondary Image offset */}
                            <div className="absolute bottom-0 left-0 w-[55%] h-[55%] rounded-[2rem] overflow-hidden shadow-xl border-4 border-white z-20">
                                <Image
                                    src="https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=800&auto=format&fit=crop"
                                    alt="Calming nature view"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            
                            {/* Decorative dots */}
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[radial-gradient(#d1d5db_2px,transparent_2px)] [background-size:16px_16px] opacity-50 z-0" />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
