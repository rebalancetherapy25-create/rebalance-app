import { Logo } from '@/components/ui/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import VerifyEmailForm from './_components/VerifyEmailForm';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata = {
    title: 'Verify Email | Rebalance',
    description: 'Enter your verification code.',
};

export default function VerifyEmailPage() {
    return (
        <div className="min-h-[100dvh] bg-background px-4 py-8 sm:px-6 sm:py-12">
            <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-6 sm:gap-8">
                <div className="flex w-full items-center justify-center sm:justify-start">
                    <Logo width={140} height={40} />
                </div>

                <Card className="w-full max-w-lg shadow-card border-none rounded-2xl overflow-hidden p-2 sm:p-3">
                    <CardHeader className="space-y-2 px-4 pb-2 pt-5 text-center sm:px-6">
                        <CardTitle className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Verify your email</CardTitle>
                        <CardDescription className="mx-auto max-w-sm text-sm text-muted-foreground sm:text-base">
                            We sent a 6-digit code to your email. Enter it below to secure your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-5 sm:px-6">
                        <Suspense fallback={
                            <div className="flex flex-col items-center gap-4 py-12">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground">Preparing verification...</p>
                            </div>
                        }>
                            <VerifyEmailForm />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>

            {/* Decorative calm background elements */}
            <div aria-hidden="true" className="fixed top-[-10%] right-[-5%] w-[min(40vw,90vw)] h-[min(40vw,90vw)] rounded-full bg-accent/10 blur-3xl -z-10 pointer-events-none"></div>
            <div aria-hidden="true" className="fixed bottom-[-10%] left-[-5%] w-[min(30vw,70vw)] h-[min(30vw,70vw)] rounded-full bg-primary/5 blur-3xl -z-10 pointer-events-none"></div>
        </div>
    );
}
