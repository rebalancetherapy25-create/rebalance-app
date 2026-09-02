'use client';
import { motion } from 'framer-motion';
import { Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function AboutCTASection() {
    return (
        <section className="py-24 sm:py-32 md:py-40 px-6 bg-background relative overflow-hidden">
            {/* Elegant Background Image with Parallax or just fixed */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://images.unsplash.com/photo-1542385151-efd9000785a0?q=80&w=2500&auto=format&fit=crop"
                    alt="Calm background"
                    fill
                    className="object-cover opacity-20 sepia-[.3] hue-rotate-[-30deg]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </div>

            <div className="container mx-auto max-w-5xl relative z-10 flex flex-col items-center">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-6 mb-16"
                >
                    <h2 className="text-5xl sm:text-6xl md:text-7xl font-display leading-[1.05] tracking-tight text-foreground">
                        Your journey <br className="hidden md:block"/>
                        <span className="italic text-accent">starts here.</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
                        Be the next person to rediscover balance with one of our trusted therapists.
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-4xl"
                >
                    <div className="bg-white/60 backdrop-blur-2xl rounded-[3rem] p-10 md:p-16 border border-white shadow-2xl space-y-12">
                        <div className="text-center space-y-4 max-w-2xl mx-auto">
                            <h3 className="text-2xl md:text-3xl font-display text-foreground leading-snug">
                                Not sure what you’re feeling or which therapist is the right fit for you?
                            </h3>
                            <p className="text-lg text-muted-foreground font-medium">
                                You don’t have to navigate it alone, our team is here to make the process feel simpler, more comfortable, and less overwhelming.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
                            <a 
                                href="tel:+919341210280" 
                                className="group flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 border border-primary/10 shadow-lg font-normal text-primary hover:shadow-xl hover:border-primary/20 transition-all duration-500 hover:-translate-y-1 w-full sm:w-auto"
                            >
                                <Phone className="w-5 h-5 text-accent group-hover:scale-110 transition-transform duration-300" />
                                <span>+91 9341210280</span>
                            </a>
                            <a 
                                href="mailto:rebalancetherapy25@gmail.com" 
                                className="group flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 border border-primary/10 shadow-lg font-normal text-primary hover:shadow-xl hover:border-primary/20 transition-all duration-500 hover:-translate-y-1 w-full sm:w-auto"
                            >
                                <Mail className="w-5 h-5 text-accent group-hover:scale-110 transition-transform duration-300" />
                                <span>rebalancetherapy25@gmail.com</span>
                            </a>
                        </div>

                        <div className="pt-8 border-t border-primary/10 text-center space-y-8">
                            <p className="text-lg text-foreground/80 font-medium italic">
                                And we’ll help guide you towards the support that best matches your needs.
                            </p>
                            <Link href="/therapists" className="inline-block">
                                <Button className="h-16 px-12 rounded-full bg-accent text-white hover:bg-accent/90 text-lg font-normal shadow-xl transition-all hover:scale-[1.02] active:scale-95 duration-300">
                                    Explore Therapists
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
