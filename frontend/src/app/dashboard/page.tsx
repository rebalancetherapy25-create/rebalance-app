"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Settings, Video, Clock, ArrowRight } from 'lucide-react';
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

    return (
        <div className="min-h-screen bg-accent/5 font-sans">
            <main className="container mx-auto max-w-5xl px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32">
                <div className="mb-8 flex flex-col gap-5 rounded-[2rem] border border-white/70 bg-background/85 p-6 shadow-[0_22px_50px_-42px_rgba(74,35,52,0.45)] backdrop-blur sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:p-8">
                    <div className="max-w-2xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Account Overview</p>
                        <h1 className="mt-3 text-3xl font-heading font-bold text-foreground sm:text-4xl">My Sessions</h1>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                            Keep upcoming appointments, session links, and account details in one calm place.
                        </p>
                    </div>

                    <Button asChild className="h-11 rounded-full px-6 font-semibold shadow-lg shadow-primary/20">
                        <Link href="/therapists">
                            Book a Session
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

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
