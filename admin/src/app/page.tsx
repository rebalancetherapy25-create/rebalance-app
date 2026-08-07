'use client';

import { useEffect, useState } from 'react';
import { Users, UserCog, Calendar, TrendingUp, ChevronRight, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { formatSlotTime } from '@/lib/date';

interface DashboardStats {
  users: number;
  therapists: number;
  bookings: number;
  revenue: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Booking {
  _id: string;
  userId?: { name: string; email: string };
  guestContact?: { name: string; email: string };
  therapistId: { name: string };
  date: string;
  time: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, usersRes, bookingsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/bookings')
        ]);
        setStats(statsRes.data);
        
        // Take latest 5 users
        const sortedUsers = [...(usersRes.data || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentUsers(sortedUsers.slice(0, 5));
        
        // Take latest 5 bookings
        const sortedBookings = [...(bookingsRes.data || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentBookings(sortedBookings.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    { name: 'Total Users', value: stats?.users || 0, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'Active Therapists', value: stats?.therapists || 0, icon: UserCog, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'Total Bookings', value: stats?.bookings || 0, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { name: 'Total Revenue', value: formatCurrency(stats?.revenue || 0), icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Dashboard Overview</h1>
        <p className="text-neutral-400">Welcome back, Super Admin. Here is what is happening today.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div
              key={stat.name}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 transition-transform hover:-translate-y-1 duration-300 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500 from-white to-transparent" />
              <div className="flex items-center justify-between relative z-10">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">+4% this week</div>
              </div>
              <div className="mt-4 relative z-10">
                <p className="text-sm font-medium text-neutral-400">{stat.name}</p>
                <p className="text-3xl font-semibold text-white mt-1">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Users */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-neutral-400" />
              New Signups
            </h2>
            <Link href="/users" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-800 flex-1">
            {loading ? (
              <div className="p-8 text-center text-neutral-500">Loading...</div>
            ) : recentUsers.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">No recent users.</div>
            ) : (
              recentUsers.map(user => (
                <div key={user._id} className="p-4 px-6 flex items-center justify-between hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 text-neutral-400 font-bold uppercase">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-neutral-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neutral-400" />
              Recent Bookings
            </h2>
            <Link href="/bookings" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-800 flex-1">
            {loading ? (
              <div className="p-8 text-center text-neutral-500">Loading...</div>
            ) : recentBookings.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">No recent bookings.</div>
            ) : (
              recentBookings.map(booking => {
                const clientName = booking.userId?.name || booking.guestContact?.name || 'Guest';
                const statusColor = 
                  booking.status === 'confirmed' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 
                  booking.status === 'pending' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 
                  booking.status === 'cancelled' ? 'text-red-400 bg-red-400/10 border-red-400/20' : 
                  'text-blue-400 bg-blue-400/10 border-blue-400/20';

                return (
                  <div key={booking._id} className="p-4 px-6 flex items-center justify-between hover:bg-neutral-800/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        {clientName} <ArrowRight className="w-3 h-3 text-neutral-500" /> Dr. {booking.therapistId?.name}
                      </p>
                      <div className="flex items-center mt-1 text-xs text-neutral-500 gap-2">
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {booking.date} at {formatSlotTime(booking.time)}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${statusColor}`}>
                      {booking.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
