import { Logo } from '@/components/ui/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ForgotPasswordForm from './_components/ForgotPasswordForm';
import Link from 'next/link';

export const metadata = {
    title: 'Forgot Password | Rebalance',
    description: 'Reset your password to access your account.',
};

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-[100ddvh] bg-background px-4 py-12 sm:px-6 sm:py-16 flex flex-col items-center">
            <div className="mb-6 flex w-full max-w-md items-center justify-center sm:justify-start">
                <Logo width={140} height={40} />
            </div>

            <Card className="w-full max-w-md shadow-card border-none rounded-2xl overflow-hidden p-2">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Reset Password</CardTitle>
                    <CardDescription className="text-muted-foreground text-base">
                        Enter your email and we&apos;ll send you a link to get back into your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ForgotPasswordForm />

                    <div className="mt-8 text-center text-sm text-muted-foreground">
                        Wait, I remember it!{' '}
                        <Link href="/login" className="text-primary font-medium hover:underline">
                            Log in
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Decorative calm background elements */}
            <div aria-hidden="true" className="fixed top-[-10%] right-[-5%] w-[min(40vw,90vw)] h-[min(40vw,90vw)] rounded-full bg-accent/10 blur-3xl -z-10 pointer-events-none"></div>
            <div aria-hidden="true" className="fixed bottom-[-10%] left-[-5%] w-[min(30vw,70vw)] h-[min(30vw,70vw)] rounded-full bg-primary/5 blur-3xl -z-10 pointer-events-none"></div>
        </div>
    );
}
