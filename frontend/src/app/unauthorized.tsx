import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen border-t bg-background px-4 py-12 font-sans sm:px-6 sm:py-16">
            <div className="mx-auto mb-8 flex max-w-md items-center justify-center sm:justify-start">
                <Logo width={140} height={40} />
            </div>
            <div className="mx-auto flex w-full max-w-md flex-col items-center space-y-6 text-center">
                <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-100 bg-destructive-light text-destructive sm:h-24 sm:w-24">
                    <ShieldAlert className="h-10 w-10 sm:h-12 sm:w-12" />
                </div>
                <h1 className="text-3xl font-heading font-bold text-foreground sm:text-4xl">Access Denied</h1>
                <p className="text-base text-muted-foreground sm:text-lg">You don&apos;t have the necessary emotional clearance to access this area. Please return to a safe space.</p>
                <div className="pt-6">
                    <Link href="/">
                        <Button className="h-12 rounded-2xl bg-primary px-6 text-base text-text-inverse shadow-md transition-transform hover:-translate-y-1 sm:h-14 sm:text-lg">
                            Return Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
