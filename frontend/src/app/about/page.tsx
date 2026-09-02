import type { Metadata } from 'next';
import { AboutHeroSection } from './_components/AboutHeroSection';
import { AboutStorySection } from './_components/AboutStorySection';
import { AboutValuesSection } from './_components/AboutValuesSection';
import { AboutCTASection } from './_components/AboutCTASection';

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
        <main className="flex flex-col font-sans bg-[#FDFBFB]">
            {/* SEO Structured Data Injection */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <AboutHeroSection />
            <AboutStorySection />
            <AboutValuesSection />
            <AboutCTASection />
        </main>
    );
}
