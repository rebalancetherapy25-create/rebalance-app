import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Zap, Users, MessageCircle } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="flex flex-col font-sans">
            {/* HERO SECTION */}
            <section className="relative min-h-[70svh] flex flex-col justify-center overflow-hidden bg-background px-4 py-24 sm:px-6 lg:px-8 lg:pt-40 lg:pb-32 z-0">
                <div aria-hidden="true" className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] -mr-[20vw] -mt-[20vw] pointer-events-none"></div>
                
                <div className="container relative z-10 mx-auto max-w-7xl">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-[10px] sm:text-xs tracking-widest uppercase mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 w-fit">
                            <span>Our Story</span>
                        </div>
                        
                        <h1 className="text-5xl leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl xl:text-[6rem] font-display mb-8">
                            Finding your balance <br className="hidden md:block" />
                            <span className="text-primary italic pr-2">should feel easy.</span>
                        </h1>
                        
                        <p className="max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground sm:text-2xl">
                            Rebalance Therapy was born from a simple belief: mental health support should be as safe, elegant, and accessible as any other premium service in your life.
                        </p>
                    </div>
                </div>
            </section>

            {/* MISSION & EDITORIAL STATS */}
            <section className="bg-primary px-4 py-32 sm:px-6 sm:py-48 text-background relative overflow-hidden">
                <div className="container mx-auto max-w-7xl relative z-10">
                    <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-start">
                        <div className="lg:col-span-6 space-y-8">
                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-display leading-[1.05]">
                                A modern sanctuary <br />for your <span className="text-accent italic">healing journey.</span>
                            </h2>
                            <div className="space-y-6 text-xl text-background/80 font-medium max-w-lg leading-relaxed">
                                <p>
                                    We&apos;ve moved away from sterile, intimidating clinical environments to create an emotionally safe digital sanctuary. Every detail—from our aesthetic to our frictionless booking—is designed to lower the barrier to starting therapy.
                                </p>
                                <p>
                                    At Rebalance, we don&apos;t just connect you with therapists; we empower you to find the exact right match for your specific story.
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
                            The values that <br/><span className="text-accent italic">balance us.</span>
                        </h2>
                        <p className="text-2xl text-muted-foreground font-medium mt-6">Foundation of trust and transparency.</p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-y-16 lg:gap-8">
                        {[
                            {
                                step: '01',
                                title: "Emotional Safety First",
                                desc: "No judgment, no complexity. Just a calm interface designed to reduce anxiety at every click."
                            },
                            {
                                step: '02',
                                title: "Radical Transparency",
                                desc: "Fixed pricing, verified reviews, and real credentials. You deserve to know exactly who you're speaking with."
                            },
                            {
                                step: '03',
                                title: "Frictionless Access",
                                desc: "The hardest step is the first one. We made sure it takes less than 3 clicks to find elite help."
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
            <section className="py-24 sm:py-40 md:py-48 px-6 bg-primary relative overflow-hidden">
                <div className="container mx-auto max-w-5xl relative z-10">
                    <div className="text-center text-background">
                        <div className="relative z-10 space-y-8 md:space-y-10 max-w-4xl mx-auto">
                            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] font-display leading-[1.05] tracking-tight">
                                Your journey <br className="hidden sm:block" /><span className="italic text-accent pr-2">starts here.</span>
                            </h2>
                            <p className="text-lg sm:text-xl md:text-2xl text-background/80 font-medium max-w-2xl mx-auto leading-relaxed">
                                Join thousands who have found their center. Explore our network of verified therapists and book your first session today.
                            </p>
                            <div className="pt-8 md:pt-10 flex justify-center">
                                <Link href="/therapists">
                                    <Button className="h-14 sm:h-16 px-10 sm:px-14 rounded-full bg-accent text-white hover:bg-accent/90 text-lg sm:text-xl font-bold font-sans shadow-xl transition-transform hover:scale-[1.02] duration-500 ease-out w-full sm:w-auto">
                                        Find My Therapist
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
