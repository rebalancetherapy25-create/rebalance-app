'use client';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useTransform, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HeartHandshake, ArrowRight, Tag } from 'lucide-react';
import { useScrollSection } from '@/hooks/useScrollSection';

type ActiveOffer = {
    type?: 'text' | 'image';
    text?: string;
    code?: string;
    link?: string;
    mobileImageUrl?: string;
    desktopImageUrl?: string;
} | null;

export function OfferBannerSection({ activeOffer }: { activeOffer: ActiveOffer }) {
    const { ref, scrollYProgress, reducedMotion } = useScrollSection(['start 0.95', 'end 0.5']);

    const rawY = useTransform(scrollYProgress, [0, 0.4], [60, 0]);
    const rawRotateX = useTransform(scrollYProgress, [0, 0.4], [12, 0]);
    const rawOpacity = useTransform(scrollYProgress, [0, 0.25], [0, 1]);
    const y = useSpring(rawY, { stiffness: 120, damping: 20 });
    const rotateX = useSpring(rawRotateX, { stiffness: 120, damping: 20 });

    const scrollStyle = reducedMotion ? {} : { y, rotateX, opacity: rawOpacity };
    const fallbackProps = reducedMotion
        ? { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } }
        : {};

    return (
        <section
            ref={ref as React.RefObject<HTMLElement>}
            className="py-8 md:py-12 border-t border-b border-primary/10 bg-[#FAF2F5]/45 relative overflow-hidden"
            style={{ perspective: '1200px' }}
        >
            {!activeOffer?.type || activeOffer.type !== 'image' ? (
                <div aria-hidden="true" className="absolute top-0 right-0 w-[30vw] h-[30vw] bg-accent/5 rounded-full blur-[80px] pointer-events-none" />
            ) : null}

            <div className="container mx-auto px-6 max-w-5xl relative z-10">
                {activeOffer?.type === 'image' ? (
                    <motion.div style={scrollStyle} {...fallbackProps}>
                        <Link href={activeOffer.link || '/therapists'} className="block group">
                            <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-primary/10 shadow-lg hover:border-primary/20 hover:shadow-2xl transition-all duration-500 hover:scale-[1.005] bg-neutral-950 aspect-[16/9] md:aspect-[21/6]">
                                <div className="block md:hidden relative w-full h-full">
                                    {activeOffer.mobileImageUrl
                                        ? <Image src={activeOffer.mobileImageUrl} alt="Special Offer" fill className="object-cover" />
                                        : <div className="flex items-center justify-center h-full text-white font-semibold">Special Offer Banner</div>}
                                </div>
                                <div className="hidden md:block relative w-full h-full">
                                    {activeOffer.desktopImageUrl
                                        ? <Image src={activeOffer.desktopImageUrl} alt="Special Offer" fill className="object-cover" />
                                        : <div className="flex items-center justify-center h-full text-white font-semibold">Special Offer Banner</div>}
                                </div>
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div style={scrollStyle} {...fallbackProps}>
                        <div className="bg-white rounded-3xl p-6 md:p-8 border border-primary/10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 hover:border-primary/20 transition-all duration-300 hover:shadow-xl">
                            <div className="flex items-start gap-4 text-left">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0 shadow-xs">
                                    <HeartHandshake className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-[10px] sm:text-xs tracking-wider uppercase mb-1">
                                        Special Wellness Offer
                                    </div>
                                    <p className="text-foreground text-sm sm:text-base md:text-lg font-display leading-relaxed">
                                        {activeOffer?.text ?? 'Get 20% off your introductory session with one of our trusted experts today.'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
                                <div className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FAF8F8] px-5 py-3 border border-primary/10 shadow-2xs font-extrabold text-primary text-sm sm:text-base font-sans select-all">
                                    <Tag className="w-4 h-4 text-accent shrink-0" />
                                    <span>Code: {activeOffer?.code ?? 'REBALANCE20'}</span>
                                </div>
                                <Link href={activeOffer?.link ?? '/therapists'} className="w-full sm:w-auto">
                                    <Button className="w-full sm:w-auto h-12 px-6 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md">
                                        Claim Offer <ArrowRight className="w-4 h-4 ml-1.5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
