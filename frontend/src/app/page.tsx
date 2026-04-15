import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Leaf, ArrowRight, Star, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { FeaturedTherapistsSkeleton } from '@/components/loading/skeletons';
import { getApiBaseUrl, isLocalApiBaseUrl } from '@/lib/runtime';

const FeaturedTherapists = dynamic(() => import('@/components/FeaturedTherapists'), {
  loading: () => <FeaturedTherapistsSkeleton />,
  ssr: false,
});

export default async function LandingPage() {
  let bannerImage = "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=2000&auto=format&fit=crop";

  try {
    const apiUrl = getApiBaseUrl();
    const shouldSkipOptionalFetch = process.env.NODE_ENV === 'production' && isLocalApiBaseUrl(apiUrl);

    if (!shouldSkipOptionalFetch) {
      const res = await fetch(`${apiUrl}/banners`, { next: { revalidate: 0 } });
      if (res.ok) {
        const banners = await res.json();
        if (Array.isArray(banners) && banners.length > 0) {
          bannerImage = banners[0].imageUrl;
        }
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to fetch banners', error);
    }
  }

  return (
    <div className="flex flex-col font-sans">
      <main className="flex-1">

        {/* HERO SECTION */}
        <section className="relative min-h-[85svh] flex flex-col justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8 lg:pt-20 lg:pb-10 z-0">
          {/* Ambient Glows */}
          <div aria-hidden="true" className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] -mr-[20vw] -mt-[20vw] pointer-events-none"></div>
          <div aria-hidden="true" className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-accent/10 rounded-full blur-[100px] -ml-[20vw] -mb-[20vw] pointer-events-none"></div>

          <div className="container relative z-10 mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              
              {/* Massive Typography Left */}
              <div className="lg:col-span-7 flex flex-col justify-center z-20 space-y-5 lg:pr-6 mt-4 lg:mt-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-[10px] sm:text-xs tracking-widest uppercase mb-1 animate-in fade-in slide-in-from-bottom-4 duration-1000 w-fit">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Backed by leading healthcare investors</span>
                </div>
                
                <h1 className="text-4xl leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl xl:text-[5rem] font-display">
                  The highest standard of <br className="hidden lg:block" />
                  <span className="text-primary italic pr-2">mental healthcare.</span>
                </h1>
                
                <p className="max-w-xl text-base font-medium leading-relaxed text-muted-foreground sm:text-lg pt-1">
                  Connect with the top 1% of licensed therapists. A clinical-grade, beautifully designed space to prioritize your mental wellbeing and deliver measurable outcomes.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Link href="/therapists">
                    <Button size="lg" className="w-full sm:w-auto bg-foreground hover:bg-foreground/90 text-background rounded-full px-6 h-12 text-sm font-bold shadow-lg transition-all hover:scale-[1.02] duration-500 ease-out">
                      Find Your Therapist
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-6 h-12 text-sm font-bold border-2 border-border text-foreground hover:bg-accent/5 hover:border-accent/40 transition-colors duration-500 ease-out">
                      Learn How It Works
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Minimal Luxury Mockup Right */}
              <div className="lg:col-span-5 relative lg:-ml-12 xl:-ml-16 mt-12 lg:mt-0 z-10 hidden sm:block">
                <div className="relative flex aspect-square w-full max-w-md mx-auto items-center justify-center overflow-hidden rounded-[2.5rem] bg-primary/5 border border-primary/10 shadow-2xl">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-multiply transition-transform hover:scale-105 duration-1000"
                    style={{ backgroundImage: `url(${bannerImage})` }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent"></div>

                  {/* Luxury Floating Card */}
                  <div className="absolute z-20 bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[300px] rounded-3xl border border-white/10 bg-background/95 p-4 shadow-2xl backdrop-blur-3xl transition-transform hover:-translate-y-2 duration-700 ease-out">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-background shadow-sm">
                        <Image src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=200&auto=format&fit=crop" alt="Dr. Sarah" width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm">Dr. Sarah Jenkins</h4>
                        <p className="text-[10px] font-bold text-accent uppercase tracking-wider">Clinical Psychologist</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs font-medium bg-muted/50 rounded-2xl p-3">
                      <div className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500"/> 5.0</div>
                      <div className="text-primary font-bold text-[10px] uppercase tracking-widest">Next available: Today</div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </section>

        {/* LOGO MARQUEE / TRUST */}
        <section className="overflow-hidden bg-background border-y border-border/40 py-16 sm:py-24">
          <div className="container mx-auto px-4 text-center sm:px-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-12">Trusted by clinical teams at</p>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale transition-all duration-700 hover:grayscale-0 hover:opacity-100 md:gap-24">
              <span className="text-3xl font-display tracking-tight text-foreground">Google</span>
              <span className="text-3xl font-black tracking-tighter text-foreground">Microsoft</span>
              <span className="text-3xl font-display tracking-widest uppercase text-foreground">Deloitte</span>
              <span className="text-3xl font-bold italic text-foreground">McKinsey</span>
              <span className="text-3xl font-display text-foreground">Meta</span>
            </div>
          </div>
        </section>

        {/* IMPACT METRICS */}
        <section className="bg-background py-32 sm:py-48 border-b border-border/40">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
            <div className="grid grid-cols-2 gap-12 md:grid-cols-4 md:gap-16">
              <div className="flex flex-col items-start space-y-4">
                <div className="text-5xl sm:text-7xl font-display text-primary">10k<span className="text-accent">+</span></div>
                <div className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-[0.15em]">Sessions Delivered</div>
              </div>
              <div className="flex flex-col items-start space-y-4">
                <div className="text-5xl sm:text-7xl font-display text-primary">99<span className="text-accent">%</span></div>
                <div className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-[0.15em]">Match Success Rate</div>
              </div>
              <div className="flex flex-col items-start space-y-4">
                <div className="text-5xl sm:text-7xl font-display text-primary">1<span className="text-accent">%</span></div>
                <div className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-[0.15em]">Therapists Accepted</div>
              </div>
              <div className="flex flex-col items-start space-y-4">
                <div className="text-5xl sm:text-7xl font-display text-primary">4.9</div>
                <div className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-[0.15em] mt-3">Average Clinical Rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* CLINICAL OUTCOMES / QUALITY MOAT */}
        <section className="bg-background px-4 py-32 sm:px-6 sm:py-48 lg:py-64">
          <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-start">
              <div className="lg:col-span-5 space-y-8 sticky top-32">
                <h2 className="text-5xl sm:text-6xl md:text-7xl font-display text-foreground leading-[0.9]">
                  Our clinical <br /><span className="text-accent italic">quality moat</span>.
                </h2>
                <p className="text-lg text-muted-foreground sm:text-2xl font-medium max-w-md leading-relaxed">
                  Consistent, measurable results don&apos;t happen by accident. We&apos;ve built an infrastructure prioritizing care quality above all else.
                </p>
              </div>

              <div className="lg:col-span-7 grid gap-16 md:grid-cols-2">
                {[
                  { icon: <ShieldCheck className="w-8 h-8" />, title: 'Top 1% Talent', desc: 'Our rigorous 4-stage vetting process filters for profound experience.' },
                  { icon: <Heart className="w-8 h-8" />, title: 'Measurement-Based', desc: 'We don\'t just talk; we track. Regular clinically validated assessments.' },
                  { icon: <Sparkles className="w-8 h-8" />, title: 'Algorithm-Backed', desc: 'Proprietary matching connects you with specialists based on 50+ data points.' }
                ].map((benefit, i) => (
                  <div key={i} className="group flex flex-col items-start pt-6 border-t-2 border-primary/20 hover:border-accent transition-colors duration-500">
                    <div className="text-primary mb-8 group-hover:scale-110 transition-transform duration-500">
                      {benefit.icon}
                    </div>
                    <h3 className="mb-4 text-3xl font-display text-foreground">{benefit.title}</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-32 sm:py-48 px-4 sm:px-6 bg-primary text-background relative overflow-hidden">
          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-center">

              <div className="space-y-16 lg:col-span-6">
                <div className="space-y-6">
                  <h2 className="text-5xl sm:text-6xl md:text-[5.5rem] font-display leading-[0.9]">Three steps <br /><span className="text-accent italic">to peace.</span></h2>
                  <p className="text-2xl text-background/80 font-medium">Skip the waiting rooms. Get started in minutes.</p>
                </div>

                <div className="space-y-12">
                  {[
                    { step: '01', title: 'Find your match', desc: 'Browse our curated catalog or take a short assessment.' },
                    { step: '02', title: 'Book instantly', desc: 'View real-time availability and select a slot.' },
                    { step: '03', title: 'Begin your session', desc: 'Join securely from your browser via our encrypted video platform.' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-8 group items-start">
                      <div className="text-5xl font-display text-accent/50 group-hover:text-accent transition-colors duration-500 pt-1">
                        {item.step}
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-3xl font-display text-background">{item.title}</h3>
                        <p className="text-background/70 leading-relaxed text-lg max-w-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 flex justify-center lg:justify-end">
                <div className="relative bg-background text-foreground shadow-2xl rounded-[3rem] overflow-hidden aspect-[4/5] p-12 max-w-md w-full flex flex-col justify-center transition-transform hover:scale-[1.02] duration-1000 ease-out border border-white/10">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-10 mx-auto">
                    <Leaf className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-4xl text-center font-display mb-6 leading-[1.1]">Your healing journey starts here.</h3>
                  <p className="text-lg text-center text-muted-foreground leading-relaxed">It takes immense courage to seek help. We&apos;ve made the rest seamless.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* FEATURED THERAPISTS */}
        <section className="py-32 sm:py-48 px-6 bg-background">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row items-end justify-between gap-12 mb-24">
              <div className="space-y-6 max-w-2xl">
                <h2 className="text-5xl md:text-7xl font-display leading-[0.9] text-foreground">Meet our <br/><span className="italic text-accent">specialists.</span></h2>
                <p className="text-2xl text-muted-foreground font-medium">Experienced, empathetic professionals ready to support your unique journey.</p>
              </div>
              <Link href="/therapists">
                <Button size="lg" variant="outline" className="rounded-full border-2 border-foreground text-foreground hover:bg-foreground hover:text-background font-bold h-16 px-10 text-lg transition-colors duration-500 ease-out">
                  View All Therapists <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            <FeaturedTherapists />
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-32 sm:py-48 px-6 bg-background border-t border-border/40">
          <div className="container mx-auto max-w-7xl">
            <h2 className="text-6xl md:text-[6rem] font-display text-center mb-32 text-foreground leading-[0.9] tracking-tight">
              Real stories of <br/><span className="text-accent italic">resilience</span>.
            </h2>
            <div className="grid md:grid-cols-3 gap-12">
              {[
                { quote: "I was extremely hesitant to try therapy online. Rebalance made it so incredibly easy and safe. I found a therapist who understands my cultural background perfectly.", author: "A. Patel", role: "Software Engineer" },
                { quote: "The platform is beautiful, but the therapists are what make it special. My anxiety has reduced drastically since I started my sessions here.", author: "M. Sharma", role: "Designer" },
                { quote: "Knowing exactly how much I'll pay upfront and being able to book securely takes so much stress out of the process. Highly recommend.", author: "D. Kumar", role: "Small Business Owner" }
              ].map((t, i) => (
                <div key={i} className="flex flex-col justify-between group">
                  <div className="flex gap-1 mb-8 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                    <Star className="w-5 h-5 fill-accent text-accent" />
                    <Star className="w-5 h-5 fill-accent text-accent" />
                    <Star className="w-5 h-5 fill-accent text-accent" />
                    <Star className="w-5 h-5 fill-accent text-accent" />
                    <Star className="w-5 h-5 fill-accent text-accent" />
                  </div>
                  <p className="text-2xl text-foreground font-display leading-snug italic mb-12">&quot;{t.quote}&quot;</p>
                  <div>
                    <p className="font-bold text-foreground text-lg uppercase tracking-wider">{t.author}</p>
                    <p className="text-muted-foreground font-medium">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-32 sm:py-64 px-6 bg-primary relative overflow-hidden">
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center text-background">
              <div className="relative z-10 space-y-12 max-w-4xl mx-auto">
                <h2 className="text-5xl sm:text-7xl md:text-[7rem] font-display leading-[0.9] tracking-tight">
                  Ready to prioritize <br/><span className="italic text-accent">yourself?</span>
                </h2>
                <p className="text-xl md:text-3xl text-background/80 font-medium max-w-2xl mx-auto">
                  Join thousands of people who have found their center through Rebalance. Your perfect match is waiting.
                </p>
                <div className="pt-12 flex flex-col justify-center gap-6 items-center">
                  <Link href="/therapists">
                    <Button className="h-20 px-16 rounded-full bg-accent text-white hover:bg-accent/90 text-2xl font-display shadow-2xl transition-transform hover:scale-[1.03] duration-500 ease-out w-full sm:w-auto">
                      Get Started Today
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
