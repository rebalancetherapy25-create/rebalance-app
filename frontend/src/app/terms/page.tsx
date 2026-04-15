import Link from 'next/link';

const LAST_UPDATED = 'April 15, 2026';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-accent/5 px-4 pb-16 pt-20 font-sans sm:px-6 sm:pt-28">
            <main className="container mx-auto max-w-4xl space-y-8 leading-relaxed text-muted-foreground">
                <h1 className="mb-2 text-3xl font-heading font-bold text-foreground sm:text-4xl">Terms & Conditions</h1>
                <p className="text-sm sm:text-base">Last updated: {LAST_UPDATED}</p>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground sm:text-2xl">1. Introduction</h2>
                    <p className="text-sm sm:text-base">Welcome to Rebalance Therapy. By using our website and booking services, you agree to be bound by these terms.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground sm:text-2xl">2. Booking and Cancellations</h2>
                    <p className="text-sm sm:text-base">Bookings are subject to the therapist&apos;s availability. You may reschedule or cancel your session up to 24 hours in advance. Late cancellations may incur a fee as determined by the therapist.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground sm:text-2xl">3. Medical Disclaimer</h2>
                    <p className="text-sm sm:text-base">Rebalance Therapy provides a platform connecting users with licensed mental health professionals. In case of immediate medical emergencies or severe crises, please contact your local emergency services.</p>
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
