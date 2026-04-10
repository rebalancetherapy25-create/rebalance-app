import Link from 'next/link';

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-background px-4 py-16 font-sans sm:px-6 sm:py-20">
            <div className="mx-auto block max-w-3xl space-y-12">
                <div className="mb-10 space-y-3 text-center sm:mb-14">
                    <h1 className="text-3xl font-heading font-bold text-foreground sm:text-4xl">Frequently Asked Questions</h1>
                    <p className="text-base text-muted-foreground sm:text-lg">Everything you need to know about navigating the platform.</p>
                </div>

                <div className="space-y-6">
                    {[
                        { q: "How are therapists verified?", a: "Every professional undergoes rigorous background checks, credential verification, and clinical interviews before joining the platform." },
                        { q: "Can I cancel a booking?", a: "Yes. Cancellations made 24 hours prior to the session are fully refunded. Your slot will be immediately released for others." },
                        { q: "Is the video call secure?", a: "Absolutely. We utilize industry-standard TLS encryption for all our telehealth sessions to ensure complete confidentiality." },
                    ].map((faq, i) => (
                        <div key={i} className="rounded-2xl border border-border/50 bg-background p-5 shadow-sm transition-shadow hover:shadow-card sm:p-6">
                            <h3 className="text-xl font-semibold font-heading text-foreground mb-2">{faq.q}</h3>
                            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{faq.a}</p>
                        </div>
                    ))}
                </div>

                <div className="text-center pt-12">
                    <Link href="/" className="text-primary font-semibold hover:underline">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
