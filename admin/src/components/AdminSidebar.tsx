'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserCog, Calendar, Settings, LogOut, Image as ImageIcon, CalendarDays, KeyRound } from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Therapists', href: '/therapists', icon: UserCog },
    { name: 'Availability', href: '/availability', icon: CalendarDays },
    { name: 'Bookings', href: '/bookings', icon: Calendar },
    { name: 'Therapist Accounts', href: '/therapist-accounts', icon: KeyRound },
    { name: 'Banners', href: '/banners', icon: ImageIcon },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col w-64 bg-neutral-950 border-r border-neutral-800 text-neutral-300 min-h-screen">
            <div className="h-16 flex items-center px-6 border-b border-neutral-800">
                <h1 className="text-xl font-semibold text-white tracking-tight">
                    Rebalance <span className="text-emerald-500">Admin</span>
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                                    }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-neutral-500 group-hover:text-emerald-400'
                                        }`}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-neutral-800">
                <button
                    onClick={async () => {
                        try {
                            const api = (await import('@/lib/axios')).default;
                            await api.post('/auth/logout');
                        } catch { }
                        window.location.href = '/login';
                    }}
                    className="flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-lg text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group"
                >
                    <LogOut className="mr-3 h-5 w-5 text-neutral-500 group-hover:text-red-400" />
                    Logout
                </button>
            </div>
        </div>
    );
}
