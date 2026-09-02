import { ContactHeroSection } from './_components/ContactHeroSection';
import { ContactInfoSection } from './_components/ContactInfoSection';
import ContactForm from './_components/ContactForm';

export const metadata = {
    title: 'Contact Us | ReBalance Therapy',
    description: "We're here to help. Send us your questions or feedback.",
};

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-[#FDFBFB] font-sans">
            <ContactHeroSection />
            
            <section className="relative px-6 pb-32 -mt-10 z-20">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                        <ContactInfoSection />
                        <div className="w-full flex justify-center">
                            <ContactForm />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
