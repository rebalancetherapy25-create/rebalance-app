'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar as CalendarIcon, Clock, Link as LinkIcon, User as UserIcon, Star, IndianRupee } from 'lucide-react';
import api from '@/lib/axios';

interface Therapist {
    _id: string;
    name: string;
    specialties: string[];
    price: number;
    about: string;
    ratingAverage: number;
    profileImage: string;
}

interface Booking {
    _id: string;
    userId: { _id: string; name: string; email: string };
    therapistId: { _id: string; name: string };
    date: string;
    time: string;
    sessionType: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    meetingLink?: string;
    createdAt: string;
}

export default function TherapistDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params as { id: string };

    const [therapist, setTherapist] = useState<Therapist | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [therapistRes, bookingsRes] = await Promise.all([
                api.get(`/admin/therapists/${id}`),
                api.get(`/admin/bookings?therapistId=${id}`)
            ]);
            setTherapist(therapistRes.data);
            setBookings(bookingsRes.data);
        } catch (error) {
            console.error('Failed to fetch therapist details', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: Booking['status']) => {
        switch (status) {
            case 'confirmed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20'; // pending
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-40 bg-neutral-900 rounded-2xl border border-neutral-800" />
                <div className="h-64 bg-neutral-900 rounded-2xl border border-neutral-800" />
            </div>
        );
    }

    if (!therapist) {
        return (
            <div className="text-center py-12 text-neutral-500">
                Therapist not found.
                <button onClick={() => router.push('/therapists')} className="mt-4 block mx-auto text-emerald-400 hover:underline">
                    Back to Therapists
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <button
                onClick={() => router.push('/therapists')}
                className="flex items-center text-neutral-400 hover:text-white transition-colors text-sm font-medium"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Therapists
            </button>

            {/* Therapist Profile Header */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <img
                    src={therapist.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(therapist.name)}&background=10b981&color=fff`}
                    alt={therapist.name}
                    className="w-32 h-32 rounded-3xl object-cover border-2 border-neutral-800 relative z-10 shadow-xl"
                />

                <div className="flex-1 space-y-4 relative z-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{therapist.name}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                                <Star className="w-4 h-4 fill-amber-500 mr-1" />
                                <span className="font-medium">{therapist.ratingAverage?.toFixed(1) || 'New'} Rating</span>
                            </div>
                            <div className="flex items-center text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                <IndianRupee className="w-4 h-4 mr-0.5" />
                                <span>{therapist.price} / session</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Specialties</div>
                        <div className="flex flex-wrap gap-2">
                            {therapist.specialties.map((spec, i) => (
                                <span key={i} className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-lg text-sm border border-neutral-700 shadow-sm">
                                    {spec}
                                </span>
                            ))}
                        </div>
                    </div>

                    {therapist.about && (
                        <div className="pt-2">
                            <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-1">About</div>
                            <p className="text-neutral-400 text-sm leading-relaxed max-w-3xl">
                                {therapist.about}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-white">Assigned Bookings</h2>
                        <p className="text-neutral-400 text-sm mt-1">All sessions scheduled with {therapist.name}</p>
                    </div>
                    <div className="text-sm px-3 py-1.5 bg-neutral-800 rounded-lg text-neutral-300 border border-neutral-700 font-medium flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-neutral-400" />
                        Total Sessions: {bookings.length}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-950/50 text-neutral-400 font-medium border-b border-neutral-800 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Session Info</th>
                                <th className="px-6 py-4">Meeting</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 text-neutral-300">
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-500 bg-neutral-900/20">
                                        No bookings assigned to this therapist yet.
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0">
                                                    <UserIcon className="w-4 h-4 text-neutral-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{booking.userId?.name || 'Unknown User'}</div>
                                                    <div className="text-xs text-neutral-500">{booking.userId?.email || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center text-neutral-300 font-medium">
                                                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                                                    {booking.date}
                                                </div>
                                                <div className="flex items-center text-neutral-400 text-xs">
                                                    <Clock className="w-3.5 h-3.5 mr-1.5 text-neutral-500" />
                                                    {booking.time} ({booking.sessionType})
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {booking.meetingLink ? (
                                                <a
                                                    href={booking.meetingLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors text-xs font-medium bg-blue-500/10 px-2.5 py-1.5 rounded-lg"
                                                >
                                                    <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
                                                    Join Meeting
                                                </a>
                                            ) : (
                                                <span className="text-neutral-600 text-xs italic bg-neutral-800/50 px-2.5 py-1.5 rounded-lg inline-flex items-center">
                                                    Not generated yet
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(booking.status)}`}>
                                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
