import { Logo } from '@/components/ui/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ContactForm from './_components/ContactForm';

export const metadata = {
    title: 'Contact Us | Rebalance',
    description: 'We\'re here to help. Send us your questions or feedback.',
};

export default function ContactPage() {
    return (
        <div className="min-h-[100dvh] bg-accent/5 font-sans px-4 py-12 sm:px-6 sm:py-16">
            <div className="mx-auto mb-8 flex w-full max-w-lg items-center justify-center sm:justify-start">
                <Logo width={140} height={40} />
            </div>

            <div className="container mx-auto mt-4 max-w-lg">
                <Card className="overflow-hidden rounded-2xl border-none bg-background p-4 shadow-card sm:p-5">
                    <CardHeader className="space-y-2 text-center">
                        <CardTitle className="text-2xl font-heading font-bold text-foreground sm:text-3xl">Contact Us</CardTitle>
                        <CardDescription className="text-base text-muted-foreground">
                            We&apos;re here to help. Send us your questions or feedback.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ContactForm />

                        <div className="mt-8 border-t border-border/10 pt-6 text-center text-sm text-muted-foreground sm:pt-8">
                            <p>Or email us directly at <a href="mailto:support@rebalance.com" className="font-medium text-primary hover:underline">support@rebalance.com</a></p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
