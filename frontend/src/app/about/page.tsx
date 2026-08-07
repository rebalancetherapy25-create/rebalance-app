import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Zap, Users, MessageCircle, Mail, Phone } from 'lucide-react';

export const metadata: Metadata = {
    title: 'About ReBalance Therapy | Our Mission & Philosophy',
    description: 'Learn about ReBalance Therapy, our experienced team, core philosophy, and our mission to make modern mental health support approachable, safe, and empowering.',
    openGraph: {
        title: 'About ReBalance Therapy | Our Mission & Philosophy',
        description: 'Discover our welcoming, empathetic, and human-centric approach to mental health support and online therapy.',
        type: 'website',
    },
};

export default function AboutPage() {
    // Structured data for SEO (Medical & Professional Service Organization Schema)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "MedicalOrganization",
        name: "ReBalance Therapy",
        url: "https://www.rebalancetherapy.in",
        logo: "https://www.rebalancetherapy.in/images/logo.svg",
        description: "Modern, approachable mental health support and online psychotherapy services designed to feel personal, calming, and empowering.",
        contactPoint: {
            "@type": "ContactPoint",
            telephone: "+91-9341210280",
            contactType: "customer support",
            email: "rebalancetherapy25@gmail.com"
        }
    };

    return (
        <div className="flex flex-col font-sans">
            {/* SEO Structured Data Injection */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* HERO SECTION */}
            <section aria-labelledby="about-hero-title" className="relative min-h-[70svh] flex flex-col justify-center overflow-hidden bg-background px-4 py-24 sm:px-6 lg:px-8 lg:pt-40 lg:pb-32 z-0">
                <div aria-hidden="true" className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] -mr-[20vw] -mt-[20vw] pointer-events-none"></div>
                
                <div className="container relative z-10 mx-auto max-w-7xl">
                    <div className="max-w-6xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-[10px] sm:text-xs tracking-widest uppercase mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 w-fit">
                            <span>Our Story</span>
                        </div>
                        
                        <h1 id="about-hero-title" className="text-5xl leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl xl:text-[6rem] font-display mb-12">
                            Finding your balance <br className="hidden md:block" />
                            <span className="text-primary italic pr-2">should feel easy.</span>
                        </h1>
                        
                        {/* Responsive Logo & First Paragraph Layout */}
                        {/* On mobile: flex-col stacks logo above text. On desktop: md:flex-row positions logo beside first paragraph */}
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10 lg:gap-14 xl:gap-16 mt-6">
                            {/* Increased Logo Container with modern aesthetic and zero distortion */}
                            <div className="w-64 sm:w-72 md:w-80 shrink-0 relative group my-2 md:my-0">
                                <div className="p-8 sm:p-10 rounded-[2.5rem] bg-card/90 backdrop-blur-md border border-border/60 shadow-xl shadow-primary/5 flex items-center justify-center transition-all duration-300 group-hover:border-accent/40 group-hover:shadow-2xl">
                                    <Image
                                        src="/images/logo.svg"
                                        alt="ReBalance Therapy Company Logo"
                                        width={320}
                                        height={320}
                                        priority
                                        className="w-full h-auto object-contain max-h-64 transition-transform duration-500 group-hover:scale-[1.03]"
                                        sizes="(max-width: 640px) 256px, (max-width: 768px) 288px, 320px"
                                    />
                                </div>
                                {/* Subtle aesthetic ambient glow */}
                                <div aria-hidden="true" className="absolute -inset-1 bg-gradient-to-r from-accent/25 to-primary/25 rounded-[2.5rem] blur-xl opacity-30 -z-10 transition-opacity duration-500 group-hover:opacity-60" />
                            </div>

                            {/* First Paragraph and Continued Content */}
                            <div className="flex-1 space-y-6 text-sm sm:text-base md:text-lg font-medium leading-relaxed text-muted-foreground/90 pt-1">
                                <p className="text-base sm:text-lg md:text-xl font-semibold text-foreground leading-relaxed border-l-4 border-accent/80 pl-4 sm:pl-6">
                                    ReBalance Therapy was born from a simple but powerful realisation that seeking mental health support should never feel overwhelming, complicated, or intimidating. Our founders, two therapists who spent years working closely with individuals from different walks of life, noticed a recurring pattern where many people delayed or completely avoided therapy, not because they didn’t need help, but because the process of finding the right support felt emotionally exhausting. Endless directories, clinical terminology, complicated booking systems, and websites overloaded with information often created more anxiety instead of comfort.
                                </p>
                                <p className="pt-2">
                                    People who were already vulnerable were expected to navigate a confusing system at one of the most difficult moments in their lives. That observation became the foundation of ReBalance Therapy. We wanted to create a space where mental health support feels approachable, calming, and human from the very first interaction. Our vision was to design an experience that feels as seamless and elegant as booking any premium wellness service — simple navigation, clear communication, and an environment that immediately makes people feel safe and understood. We believe therapy should not feel clinical or transactional; it should feel welcoming, personal, and empowering. Every detail of our platform, from the design to the booking journey, is intentionally built to reduce stress and make reaching out for support feel like a positive first step rather than a daunting task.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MISSION & EDITORIAL STATS */}
            <section className="bg-primary px-4 py-32 sm:px-6 sm:py-48 text-background relative overflow-hidden">
                <div className="container mx-auto max-w-7xl relative z-10">
                    <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-start">
                        <div className="lg:col-span-6 space-y-8">
                            <div className="space-y-4">
                                <div className="text-xs font-black uppercase tracking-widest text-accent/80">Our Purpose</div>
                                <h2 className="text-4xl sm:text-5xl md:text-6xl font-display leading-[1.05] text-background">
                                    The story behind the <span className="italic text-accent">NAME.</span>
                                </h2>
                                
                                {/* Elegant premium representation of the ReBalance logo */}
                                <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-background font-display font-medium text-lg my-4 shadow-sm select-none">
                                    <svg viewBox="0 0 36 36" className="w-6 h-6 fill-accent animate-pulse shrink-0">
                                        <path d="M18,0C8.06,0,0,8.06,0,18s8.06,18,18,18s18-8.06,18-18S27.94,0,18,0z M14.64,25.68c0,0-1.28,0-3.32,0c-2.48,0-4.88-0.96-6.64-2.72 c-1.76-1.76-2.72-4.16-2.72-6.64c0-2.48,0.96-4.88,2.72-6.64c1.76-1.76,4.16-2.72,6.64-2.72c2.48,0,4.88,0.96,6.64,2.72 c0.68,0.68,1.24,1.44,1.64,2.24c0.4-0.8,0.96-1.56,1.64-2.24c1.76-1.76,4.16-2.72,6.64-2.72c2.48,0,4.88,0.96,6.64,2.72 c1.76,1.76,2.72,4.16,2.72,6.64c0,2.48-0.96,4.88-2.72,6.64c-1.76,1.76-4.16,2.72-6.64,2.72c-2.04,0-3.32,0-3.32,0v-7.32h3.32v7.32 h-6.64v-7.32h-3.32V25.68z"/>
                                    </svg>
                                    <span className="tracking-tight text-white font-extrabold text-xl">Re<span className="text-accent italic font-serif">Balance</span> <span className="text-white/60 font-sans font-bold text-xs uppercase tracking-widest pl-2 border-l border-white/20">Therapy</span></span>
                                </div>
                            </div>
                            <div className="space-y-6 text-base sm:text-lg text-background/80 font-medium max-w-xl leading-relaxed">
                                <p>
                                    The name &ldquo;ReBalance Therapy&rdquo; was inspired by the idea that life naturally moves through periods of imbalance. Stress, anxiety, burnout, grief, and personal struggles can slowly pull people away from themselves, leaving them disconnected emotionally, mentally, and even physically.
                                </p>
                                <p>
                                    Rather than focusing on &ldquo;fixing&rdquo; people, the founders wanted the brand to reflect the belief that healing is about gently finding your way back to balance, reconnecting with clarity, stability, and peace. The &ldquo;RE&rdquo; symbolises renewal, restoration, and rediscovery, the idea that no matter where someone is in their journey, they can always begin again. Combined with &ldquo;Balance,&rdquo; which represents a compassionate approach to therapy that supports individuals in rebuilding harmony within themselves and their lives.
                                </p>
                            </div>
                        </div>

                        {/* Asymmetrical Brutalist Stats */}
                        <div className="lg:col-span-6 grid grid-cols-2 gap-12 sm:gap-16 pt-8 lg:pt-0">
                            <div className="flex flex-col items-start space-y-2">
                                <Users className="w-8 h-8 text-accent mb-4 opacity-80" />
                                <div className="text-6xl sm:text-[5rem] font-display text-background leading-none tracking-tight">100<span className="text-accent">+</span></div>
                                <div className="text-xs font-bold text-background/60 uppercase tracking-[0.2em] mt-2">Expert Therapists</div>
                            </div>
                            <div className="flex flex-col items-start space-y-2 pt-16">
                                <MessageCircle className="w-8 h-8 text-accent mb-4 opacity-80" />
                                <div className="text-6xl sm:text-[5rem] font-display text-background leading-none tracking-tight">10<span className="text-accent">k+</span></div>
                                <div className="text-xs font-bold text-background/60 uppercase tracking-[0.2em] mt-2">Sessions Completed</div>
                            </div>
                            <div className="flex flex-col items-start space-y-2">
                                <ShieldCheck className="w-8 h-8 text-accent mb-4 opacity-80" />
                                <div className="text-6xl sm:text-[5rem] font-display text-background leading-none tracking-tight">100<span className="text-accent">%</span></div>
                                <div className="text-xs font-bold text-background/60 uppercase tracking-[0.2em] mt-2">Secure & Private</div>
                            </div>
                            <div className="flex flex-col items-start space-y-2 pt-16">
                                <Zap className="w-8 h-8 text-accent mb-4 opacity-80" />
                                <div className="text-6xl sm:text-[5rem] font-display text-background leading-none tracking-tight">3<span className="text-accent">s</span></div>
                                <div className="text-xs font-bold text-background/60 uppercase tracking-[0.2em] mt-2">Booking Velocity</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TYPOGRAPHY-DRIVEN VALUES */}
            <section className="bg-background px-4 py-32 sm:px-6 sm:py-48 border-b border-border/40">
                <div className="container mx-auto max-w-7xl">
                    <div className="mb-24 md:mb-32">
                        <h2 className="text-5xl md:text-7xl font-display text-foreground leading-[0.9] tracking-tight">
                            Who we <span className="text-accent italic">are.</span>
                        </h2>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-y-16 lg:gap-8">
                        {[
                            {
                                step: '01',
                                title: "Our Mission",
                                desc: "Our mission is to make mental health support feel approachable, safe, and deeply human. We are committed to removing the fear, confusion, and stigma often associated with therapy by creating a calm, modern, and accessible experience for everyone seeking support."
                            },
                            {
                                step: '02',
                                title: "Our Philosophy",
                                desc: "We believe therapy is not only for moments of crisis it is a space for growth, self-awareness, healing, and balance. At ReBalance Therapy, we focus on creating meaningful therapeutic relationships where clients feel heard without judgment and supported at every step of their journey."
                            },
                            {
                                step: '03',
                                title: "Our Values",
                                desc: "At ReBalance Therapy, we value authenticity, meaningful human connection, and creating experiences that feel calm, intentional, and deeply personal. We are committed to building a modern approach to therapy that prioritises trust, simplicity, and a sense of comfort from the very first interaction."
                            }
                        ].map((value, i) => (
                            <div key={i} className="lg:col-span-4 group flex flex-col items-start border-t-2 border-primary/20 pt-8 hover:border-accent transition-colors duration-500">
                                <div className="text-4xl font-display text-accent/50 mb-8 font-bold">{value.step}</div>
                                <h3 className="text-3xl font-display text-foreground mb-4 pr-12">{value.title}</h3>
                                <p className="text-lg text-muted-foreground leading-relaxed font-medium">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* BOTTOM CTA */}
            <section className="py-20 sm:py-28 md:py-36 px-6 bg-primary relative overflow-hidden">
                <div aria-hidden="true" className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-accent/10 rounded-full blur-[120px] -ml-[20vw] -mt-[20vw] pointer-events-none"></div>
                <div className="container mx-auto max-w-4xl relative z-10">
                    <div className="text-center text-background space-y-12">
                        {/* Header & Subtitle */}
                        <div className="space-y-4 max-w-2xl mx-auto">
                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-display leading-[1.1] tracking-tight">
                                Your journey <span className="italic text-accent">starts here.</span>
                            </h2>
                            <p className="text-base sm:text-lg md:text-xl text-background/80 font-medium leading-relaxed">
                                Be the next person to rediscover balance with one of our trusted therapists
                            </p>
                        </div>

                        {/* Blur Card Wrapper containing the bubble contact console */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 border border-white/20 shadow-2xl text-left space-y-8 max-w-3xl mx-auto">
                            <div className="space-y-3">
                                <h3 className="text-xl sm:text-2xl font-display text-white leading-snug">
                                    Not sure what you’re feeling or which therapist is the right fit for you?
                                </h3>
                                <p className="text-sm sm:text-base text-white/80 font-medium leading-relaxed">
                                    You don’t have to navigate it alone, our team is here to make the process feel simpler, more comfortable, and less overwhelming.
                                </p>
                            </div>

                            {/* Pill Bubbles */}
                            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                                <a 
                                    href="tel:+919341210280" 
                                    className="flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3 border border-white/20 shadow-md font-bold text-primary hover:bg-white/95 transition-all duration-300 active:scale-95 text-sm sm:text-base shrink-0"
                                >
                                    <Phone className="w-4 h-4 text-accent shrink-0" />
                                    <span>+91 9341210280</span>
                                </a>
                                <a 
                                    href="mailto:rebalancetherapy25@gmail.com" 
                                    className="flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3 border border-white/20 shadow-md font-bold text-primary hover:bg-white/95 transition-all duration-300 active:scale-95 text-sm sm:text-base shrink-0"
                                >
                                    <Mail className="w-4 h-4 text-accent shrink-0" />
                                    <span>rebalancetherapy25@gmail.com</span>
                                </a>
                            </div>

                            <div className="space-y-6">
                                <p className="text-sm sm:text-base text-white/85 font-medium italic">
                                    And we’ll help guide you towards the support that best matches your needs.
                                </p>
                                
                                <div>
                                    <Link href="/therapists">
                                        <Button className="h-14 px-8 rounded-full bg-accent text-white hover:bg-accent/90 text-base font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-98 duration-300 w-full sm:w-auto">
                                            Explore Therapists
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
