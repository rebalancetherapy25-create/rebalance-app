"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Settings, LogOut, Video, Clock } from 'lucide-react';
import api from '@/lib/api';

interface Booking {
    _id: string;
    therapistId: {
        _id: string;
        name: string;
        profileImage?: string;
    };
    date: string;
    time: string;
    sessionType: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    meetingLink?: string;
}

const bookingDateTime = (booking: Booking) => new Date(`${booking.date}T${booking.time}:00`);

export default function DashboardPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await api.get('/bookings/my-bookings');
                setBookings(res.data || []);
            } catch (err: unknown) {
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 401) {
                    router.push('/login');
                    return;
                }
                setError('Failed to load bookings.');
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [router]);

    const { upcoming, past } = useMemo(() => {
        const now = new Date();
        const active = bookings.filter((booking) => booking.status !== 'cancelled');
        return {
            upcoming: active.filter((booking) => bookingDateTime(booking) >= now && booking.status !== 'completed'),
            past: active.filter((booking) => bookingDateTime(booking) < now || booking.status === 'completed'),
        };
    }, [bookings]);

    const logout = async () => {
        setLoggingOut(true);
        try {
            await api.post('/auth/logout');
        } finally {
            router.push('/login');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex flex-col font-sans bg-accent/5">
            <header className="bg-background border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Logo />
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <Link href="/therapists" className="text-muted-foreground hover:text-primary transition-colors">Find Therapist</Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto max-w-5xl px-6 py-12">
                <h1 className="text-3xl font-heading font-bold text-foreground mb-8">My Dashboard</h1>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <aside className="w-full md:w-64 space-y-2 shrink-0">
                        <div className="bg-background p-4 rounded-2xl shadow-sm border border-border/50 space-y-2">
                            <Button variant="ghost" className="w-full justify-start text-primary bg-accent/10 hover:bg-accent/20 font-semibold rounded-xl h-12">
                                <Calendar className="w-5 h-5 mr-3" /> My Bookings
                            </Button>
                            <Link href="/settings">
                                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/5 rounded-xl h-12">
                                    <Settings className="w-5 h-5 mr-3" /> Settings
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                onClick={logout}
                                disabled={loggingOut}
                                className="w-full justify-start text-destructive hover:text-destructive-dark hover:bg-destructive-light rounded-xl h-12"
                            >
                                <LogOut className="w-5 h-5 mr-3" /> {loggingOut ? 'Logging out...' : 'Log out'}
                            </Button>
                        </div>
                    </aside>

                    <div className="flex-1 w-full space-y-6">
                        <h2 className="text-xl font-heading font-semibold text-foreground">Upcoming Sessions</h2>
                        {loading && <p className="text-muted-foreground">Loading bookings...</p>}
                        {error && <p className="text-destructive text-sm">{error}</p>}
                        {!loading && !error && upcoming.length === 0 && (
                            <p className="text-muted-foreground">No upcoming sessions yet.</p>
                        )}

                        {upcoming.map((booking) => (
                            <Card key={booking._id} className="border-none shadow-card bg-background rounded-2xl p-1 overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-muted rounded-full relative overflow-hidden shrink-0 border border-border/50">
                                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/30"></div>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg text-foreground mb-1">{booking.therapistId?.name || 'Therapist'}</h3>
                                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <span className="flex items-center gap-1.5"><Video className="w-4 h-4 text-muted-foreground" /> {booking.sessionType}</span>
                                                    <span className="w-1 h-1 bg-border rounded-full hidden sm:block"></span>
                                                    <span className="text-primary font-medium">{booking.date} at {booking.time}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {booking.meetingLink ? (
                                            <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer">
                                                <Button className="h-10 rounded-full bg-primary text-text-inverse hover:bg-primary/90 px-6 shadow-md">
                                                    Join Call
                                                </Button>
                                            </a>
                                        ) : (
                                            <Button variant="outline" className="h-10 rounded-full border-border text-muted-foreground">
                                                Waiting for link
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        <h2 className="text-xl font-heading font-semibold text-foreground mt-12 mb-4">Past Sessions</h2>
                        {!loading && past.length === 0 && <p className="text-muted-foreground">No past sessions yet.</p>}
                        {past.map((booking) => (
                            <Card key={booking._id} className="border-none shadow-sm bg-background rounded-2xl p-1 opacity-80">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-foreground mb-0.5">{booking.therapistId?.name || 'Therapist'}</h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" /> {booking.date} • {booking.sessionType}
                                            </p>
                                        </div>
                                        <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-muted-foreground uppercase">{booking.status}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
