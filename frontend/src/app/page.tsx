import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AnimateIn } from '@/components/ui/AnimateIn';
import { HeroSection } from '@/components/landing/HeroSection';
import { StatementSection } from '@/components/landing/StatementSection';
import { OfferBannerSection } from '@/components/landing/OfferBannerSection';
import { QualityPromiseSection } from '@/components/landing/QualityPromiseSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { FeaturedTherapistsHeader } from '@/components/landing/FeaturedTherapistsHeader';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { BottomCTASection } from '@/components/landing/BottomCTASection';
import { BeginJourneySection } from '@/components/landing/BeginJourneySection';
import { Bell } from 'lucide-react';
import { getApiBaseUrl, isLocalApiBaseUrl, unwrapApiData } from '@/lib/runtime';

export default async function LandingPage() {
    let bannerImage = 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=2000&auto=format&fit=crop';
    let activeOffer: {
        type?: 'text' | 'image';
        text?: string;
        code?: string;
        link?: string;
        mobileImageUrl?: string;
        desktopImageUrl?: string;
    } | null = null;

    try {
        const apiUrl = getApiBaseUrl();
        const shouldSkip = process.env.NODE_ENV === 'production' && isLocalApiBaseUrl(apiUrl);

        if (!shouldSkip) {
            const bannerRes = await fetch(`${apiUrl}/banners`, { next: { revalidate: 0 } });
            if (bannerRes.ok) {
                const banners = unwrapApiData(await bannerRes.json());
                if (Array.isArray(banners) && banners.length > 0) bannerImage = banners[0].imageUrl;
            }

            const offerRes = await fetch(`${apiUrl}/offer-banners`, { next: { revalidate: 0 } });
            if (offerRes.ok) {
                const offers = unwrapApiData(await offerRes.json());
                if (Array.isArray(offers) && offers.length > 0) activeOffer = offers[0];
            }
        }
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('Failed to fetch banners/offers', error);
    }

    return (
        <div className="flex flex-col font-sans bg-[#FDFBFB] min-h-screen">
            <main className="flex-1">

                {/* Hero — parallax image + staggered text on mount */}
                <HeroSection bannerImage={bannerImage} />

                {/* Offer banner — perspective tilt-in */}
                <OfferBannerSection activeOffer={activeOffer} />

                {/* Statement — word-by-word scroll reveal */}
                <StatementSection />

                {/* Quality Promise — columns converge from opposite sides */}
                <QualityPromiseSection />

                {/* How It Works — steps charge up per scroll position */}
                <HowItWorksSection />

                {/* Featured Therapists — clipPath wipe + dynamic cards */}
                <FeaturedTherapistsHeader />

                {/* Testimonials — divergent header reveal + CSS marquee */}
                <TestimonialsSection />

                {/* FAQ — alternating left/right slide per item */}
                <FAQSection />

                {/* Bottom CTA — stamp scale entrance */}
                <BottomCTASection />

                {/* Begin Journey — text reveal + image parallax */}
                <BeginJourneySection />

                {/* Crisis Alert — kept as simple AnimateIn (safety-critical) */}
                <section className="px-6 pb-12 md:pb-24 bg-[#FDFBFB]">
                    <div className="container mx-auto max-w-3xl">
                        <AnimateIn direction="up">
                            <div className="bg-accent/10 border border-accent/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                                <div className="flex items-start md:items-center gap-4 md:gap-6">
                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                                        <Bell className="w-5 h-5 md:w-7 md:h-7 text-accent" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground text-sm md:text-lg mb-1 md:mb-2">In crisis? Get immediate help.</h3>
                                        <p className="text-xs md:text-sm text-foreground/80 leading-relaxed max-w-sm">
                                            If you are in a crisis or having thoughts of harming yourself, please reach out for help right away.
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-14 md:ml-0 shrink-0">
                                    <Link href="/contact">
                                        <Button variant="outline" className="rounded-full border-accent/30 text-accent font-medium bg-transparent hover:bg-accent/10 hover:text-accent w-full md:w-auto px-6">
                                            View Resources
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </AnimateIn>
                    </div>
                </section>

            </main>
        </div>
    );
}
