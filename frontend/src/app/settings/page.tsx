import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Calendar, Settings } from 'lucide-react';
import Link from 'next/link';
import SettingsForm from './_components/SettingsForm';

export const metadata = {
    title: 'Settings | Rebalance',
    description: 'Manage your account preferences.',
};

export default function SettingsPage() {
    return (
        <div className="min-h-[100dvh] flex flex-col font-sans bg-accent/5">
            <header className="bg-background border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto h-16 flex items-center justify-between px-4 sm:px-6">
                    <Logo />
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <Link href="/therapists" className="text-muted-foreground hover:text-primary transition-colors">Find Therapist</Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-6 sm:mb-8">Settings</h1>

                <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
                    <aside className="w-full md:w-64 space-y-2 shrink-0">
                        <div className="bg-background p-4 rounded-2xl shadow-sm border border-border/50 space-y-2">
                            <Link href="/dashboard">
                                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/5 rounded-xl h-12">
                                    <Calendar className="w-5 h-5 mr-3" /> My Bookings
                                </Button>
                            </Link>
                            <Button variant="ghost" className="w-full justify-start text-primary bg-accent/10 hover:bg-accent/20 font-semibold rounded-xl h-12">
                                <Settings className="w-5 h-5 mr-3" /> Settings
                            </Button>
                            {/* Logout is traditionally a form post or a client action, we'll keep it in the form/client side for simplicity or handle here if we had a server action */}
                        </div>
                    </aside>

                    <SettingsForm />
                </div>
            </main>
        </div>
    );
}
