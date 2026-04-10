import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { Calendar, Clock, Video } from 'lucide-react';

export default function BookingDetailsPage() {
    return (
        <div className="min-h-screen flex flex-col font-sans bg-accent/5">
            <header className="bg-background border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Logo />
                    <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
                        <Link href="/dashboard" className="hover:text-primary transition-colors">← Back to Dashboard</Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1 container mx-auto max-w-4xl px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-heading font-bold text-foreground">Booking Details</h1>
                    <span className="px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold tracking-wide border border-green-200">
                        Confirmed
                    </span>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border-none shadow-card rounded-2xl p-2 bg-background">
                            <CardHeader>
                                <CardTitle className="text-xl">Session Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-muted rounded-full overflow-hidden border border-border/50 bg-accent/20"></div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Dr. Sarah Kapoor</h3>
                                        <p className="text-sm text-primary">Clinical Psychologist</p>
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-accent/5 rounded-xl border border-border/50">
                                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</p>
                                        <p className="font-semibold text-foreground">Tomorrow, Oct 12</p>
                                    </div>
                                    <div className="p-4 bg-accent/5 rounded-xl border border-border/50">
                                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><Clock className="w-4 h-4" /> Time</p>
                                        <p className="font-semibold text-foreground">10:00 AM (50 mins)</p>
                                    </div>
                                    <div className="p-4 bg-accent/5 rounded-xl border border-border/50 sm:col-span-2">
                                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><Video className="w-4 h-4" /> Format</p>
                                        <p className="font-semibold text-foreground">Video Session (Zoom)</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-4">
                            <Button className="flex-1 h-14 text-md rounded-xl shadow-md cursor-not-allowed opacity-80" disabled>
                                Join Call (Link activates 5m before)
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-none shadow-sm rounded-2xl bg-background">
                            <CardHeader>
                                <CardTitle className="text-lg">Payment Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Session Fee</span>
                                    <span className="text-foreground">₹1500</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground pb-3 border-b">
                                    <span>Taxes</span>
                                    <span className="text-foreground">₹150</span>
                                </div>
                                <div className="flex justify-between font-bold text-base text-foreground">
                                    <span>Total Paid</span>
                                    <span className="text-primary">₹1650</span>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-3">
                            <Button variant="outline" className="w-full text-foreground border-border hover:bg-accent/10 rounded-xl h-12">
                                Reschedule Session
                            </Button>
                            <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive-light rounded-xl h-12">
                                Cancel Booking
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
