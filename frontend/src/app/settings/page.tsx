import { Button } from '@/components/ui/button';
import { Calendar, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SettingsForm from './_components/SettingsForm';

export const metadata = {
    title: 'Settings | Rebalance',
    description: 'Manage your account preferences.',
};

export default function SettingsPage() {
    return (
        <div className="min-h-[100dvh] font-sans bg-accent/5">
            <main className="container mx-auto max-w-5xl px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32">
                <div className="mb-8 flex flex-col gap-5 rounded-[2rem] border border-white/70 bg-background/85 p-6 shadow-[0_22px_50px_-42px_rgba(74,35,52,0.45)] backdrop-blur sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:p-8">
                    <div className="max-w-2xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Account Settings</p>
                        <h1 className="mt-3 text-3xl font-heading font-bold text-foreground sm:text-4xl">Profile and Security</h1>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                            Update your details, keep your email current, and change your password without leaving your account workspace.
                        </p>
                    </div>

                    <Button asChild variant="outline" className="h-11 rounded-full px-6 font-semibold">
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Sessions
                        </Link>
                    </Button>
                </div>

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
