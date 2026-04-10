'use client';

import { useEffect, useState } from 'react';
import { Users, UserCog, Calendar, TrendingUp } from 'lucide-react';
import api from '@/lib/axios';

interface DashboardStats {
  users: number;
  therapists: number;
  bookings: number;
  revenue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-96 flex flex-col items-center justify-center">
          <p className="text-neutral-500">Recent Users Chart (Coming Soon)</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-96 flex flex-col items-center justify-center">
          <p className="text-neutral-500">Recent Bookings List (Coming Soon)</p>
        </div>
      </div>
    </div>
  );
}
