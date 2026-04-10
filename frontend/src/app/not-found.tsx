import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6 pb-24 font-sans">
            <div className="absolute top-8 left-8">
                <Logo />
            </div>
            <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-9xl font-heading font-extrabold text-accent/30 tracking-tighter">404</h1>
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-foreground">Page not found</h2>
                    <p className="text-muted-foreground text-lg">We couldn&apos;t locate the therapeutic space you were looking for. Let&apos;s guide you back to safety.</p>
                </div>
                <Link href="/">
                    <Button className="h-14 px-8 rounded-2xl bg-primary text-text-inverse text-lg shadow-md hover:-translate-y-1 transition-transform mt-8">
                        Return Home
                    </Button>
                </Link>
            </div>

            <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] -z-10"></div>
        </div>
    );
}
