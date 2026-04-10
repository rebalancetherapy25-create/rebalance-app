import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-accent/5 px-4 pb-16 pt-20 font-sans sm:px-6 sm:pt-28">
            <main className="container mx-auto max-w-4xl space-y-8 leading-relaxed text-muted-foreground">
                <h1 className="mb-2 text-3xl font-heading font-bold text-foreground sm:text-4xl">Privacy Policy</h1>
                <p className="text-sm sm:text-base">Last updated: {new Date().toLocaleDateString()}</p>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground sm:text-2xl">1. Data Collection</h2>
                    <p className="text-sm sm:text-base">We collect information that you directly provide to us, including your name, email address, payment details, and voluntary health-related notes during booking. This is strictly confidential.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground sm:text-2xl">2. How We Use Data</h2>
                    <p className="text-sm sm:text-base">Your data is exclusively used to facilitate online therapy sessions, process payments, and improve platform functionality. We do not sell your personal data to third parties.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground sm:text-2xl">3. Security</h2>
                    <p className="text-sm sm:text-base">We use industry-standard encryption to protect your data. All mental health notes are strictly accessible only by your elected therapist.</p>
                </section>

                <div className="pt-8">
                    <Link href="/" className="text-primary font-semibold hover:underline">
                        ← Back to Home
                    </Link>
                </div>
            </main>
        </div>
    );
}
