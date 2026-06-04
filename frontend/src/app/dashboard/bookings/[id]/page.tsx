"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Video, ArrowLeft, Phone, MessageCircle } from 'lucide-react';
import api from '@/lib/api';
import { formatSlotTime } from '@/lib/date';

interface Booking {
    _id: string;
    therapistId: {
        _id: string;
        name: string;
        profileImage?: string;
        specialties?: string[];
    };
    date: string;
    time: string;
    sessionType: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    meetingLink?: string;
    amount?: number;
    createdAt: string;
}

const SESSION_ICON: Record<string, React.ReactNode> = {
    video: <Video className="w-4 h-4" />,
    phone: <Phone className="w-4 h-4" />,
    chat: <MessageCircle className="w-4 h-4" />,
    audio: <Phone className="w-4 h-4" />,
};

const STATUS_STYLES: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700 border border-green-200',
    completed: 'bg-blue-100 text-blue-700 border border-blue-200',
    pending: 'bg-amber-100 text-amber-700 border border-amber-200',
    cancelled: 'bg-red-100 text-red-700 border border-red-200',
};

export default function BookingDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const res = await api.get('/bookings/my-bookings');
                const found = (res.data as Booking[]).find((b) => b._id === params.id);
                if (!found) {
                    setError('Booking not found.');
                } else {
                    setBooking(found);
                }
            } catch (err: unknown) {
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 401) {
                    router.push('/login');
                    return;
                }
                setError('Failed to load booking details.');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="min-h-screen font-sans bg-accent/5">
                <main className="container mx-auto max-w-4xl px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 w-40 bg-muted rounded-full" />
                        <div className="h-10 w-64 bg-muted rounded-xl" />
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 h-64 bg-muted rounded-2xl" />
                            <div className="h-64 bg-muted rounded-2xl" />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen font-sans bg-accent/5">
                <main className="container mx-auto max-w-4xl px-4 pb-12 pt-28 sm:px-6">
                    <Button asChild variant="ghost" className="mb-6 rounded-full px-0 text-sm font-semibold text-muted-foreground hover:bg-transparent hover:text-primary">
                        <Link href="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Back to Dashboard</Link>
                    </Button>
                    <p className="text-destructive">{error || 'Booking not found.'}</p>
                </main>
            </div>
        );
    }

    const sessionIcon = SESSION_ICON[booking.sessionType?.toLowerCase()] ?? <Video className="w-4 h-4" />;
    const therapistName = booking.therapistId?.name || 'Therapist';
    const specialty = booking.therapistId?.specialties?.[0] || '';
    const isPast = new Date(`${booking.date}T${booking.time}:00`) < new Date();

    return (
        <div className="min-h-screen font-sans bg-accent/5">
            <main className="container mx-auto max-w-4xl px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32">
                <div className="mb-6">
                    <Button asChild variant="ghost" className="rounded-full px-0 text-sm font-semibold text-muted-foreground hover:bg-transparent hover:text-primary">
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-heading font-bold text-foreground">Booking Details</h1>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide capitalize ${STATUS_STYLES[booking.status] || STATUS_STYLES.pending}`}>
                        {booking.status}
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
                                    <div className="w-16 h-16 bg-accent/20 rounded-full overflow-hidden border border-border/50 flex items-center justify-center">
                                        {booking.therapistId?.profileImage ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={booking.therapistId.profileImage} alt={therapistName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl font-bold text-primary/40">
                                                {therapistName.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{therapistName}</h3>
                                        {specialty && <p className="text-sm text-primary">{specialty}</p>}
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-accent/5 rounded-xl border border-border/50">
                                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</p>
                                        <p className="font-semibold text-foreground">
                                            {new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-accent/5 rounded-xl border border-border/50">
                                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><Clock className="w-4 h-4" /> Time</p>
                                        <p className="font-semibold text-foreground">{formatSlotTime(booking.time)}</p>
                                    </div>
                                    <div className="p-4 bg-accent/5 rounded-xl border border-border/50 sm:col-span-2">
                                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                                            {sessionIcon} Format
                                        </p>
                                        <p className="font-semibold text-foreground capitalize">{booking.sessionType} Session</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-4">
                            {booking.meetingLink && !isPast && booking.status === 'confirmed' ? (
                                <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                                    <Button className="w-full h-14 text-md rounded-xl shadow-md">
                                        Join Call
                                    </Button>
                                </a>
                            ) : (
                                <Button className="flex-1 h-14 text-md rounded-xl shadow-md cursor-not-allowed opacity-70" disabled>
                                    {!booking.meetingLink ? 'Link not yet available' : isPast ? 'Session ended' : 'Join Call'}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-none shadow-sm rounded-2xl bg-background">
                            <CardHeader>
                                <CardTitle className="text-lg">Payment Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between text-muted-foreground pb-3 border-b">
                                    <span>Session Fee</span>
                                    <span className="text-foreground font-medium">
                                        {booking.amount != null ? `₹${booking.amount}` : '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between font-bold text-base text-foreground">
                                    <span>Total Paid</span>
                                    <span className="text-primary">
                                        {booking.amount != null ? `₹${booking.amount}` : '—'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
