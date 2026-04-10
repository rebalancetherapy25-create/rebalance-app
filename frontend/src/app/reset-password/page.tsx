import { Logo } from '@/components/ui/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResetPasswordForm from './_components/ResetPasswordForm';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata = {
    title: 'Reset Password | Rebalance',
    description: 'Securely update your password.',
};

export default function ResetPasswordPage() {
    return (
        <div className="min-h-[100ddvh] bg-background px-4 py-12 sm:px-6 sm:py-16 flex flex-col items-center">
            <div className="mb-6 flex w-full max-w-md items-center justify-center sm:justify-start">
                <Logo width={140} height={40} />
            </div>

            <Card className="w-full max-w-md shadow-card border-none rounded-2xl overflow-hidden p-2">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-2xl sm:text-3xl font-heading font-bold text-foreground">New Password</CardTitle>
                    <CardDescription className="text-muted-foreground text-base">
                        Set a strong password to keep your journey private and secure.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={
                        <div className="flex flex-col items-center py-12 gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground">Preparing reset form...</p>
                        </div>
                    }>
                        <ResetPasswordForm />
                    </Suspense>
                </CardContent>
            </Card>

            {/* Decorative calm background elements */}
            <div aria-hidden="true" className="fixed top-[-10%] right-[-5%] w-[min(40vw,90vw)] h-[min(40vw,90vw)] rounded-full bg-accent/10 blur-3xl -z-10 pointer-events-none"></div>
            <div aria-hidden="true" className="fixed bottom-[-10%] left-[-5%] w-[min(30vw,70vw)] h-[min(30vw,70vw)] rounded-full bg-primary/5 blur-3xl -z-10 pointer-events-none"></div>
        </div>
    );
}
