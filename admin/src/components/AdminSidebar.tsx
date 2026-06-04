'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, CalendarDays, Image as ImageIcon, KeyRound, LayoutDashboard, LogOut, Settings, ShieldCheck, Ticket, UserCog, Users, X, Tag } from 'lucide-react';

type AdminUser = {
    name?: string;
    email?: string;
    role?: string;
};

const sections = [
    {
        label: 'Overview',
        items: [
            { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        ],
    },
    {
        label: 'People',
        items: [
            { name: 'Users', href: '/users', icon: Users },
            { name: 'Therapists', href: '/therapists', icon: UserCog },
            { name: 'Therapist Accounts', href: '/therapist-accounts', icon: KeyRound },
        ],
    },
    {
        label: 'Operations',
        items: [
            { name: 'Availability', href: '/availability', icon: CalendarDays },
            { name: 'Bookings', href: '/bookings', icon: Calendar },
            { name: 'Banners', href: '/banners', icon: ImageIcon },
            { name: 'Offer Banners', href: '/offer-banners', icon: Tag },
            { name: 'Coupons', href: '/coupons', icon: Ticket },
            { name: 'Settings', href: '/settings', icon: Settings },
        ],
    },
];

export default function AdminSidebar({
    currentUser,
    onLogout,
    open,
    onClose,
}: {
    currentUser: AdminUser | null;
    onLogout: () => Promise<void> | void;
    open: boolean;
    onClose: () => void;
}) {
    const pathname = usePathname();
    const initials = currentUser?.name?.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'RA';

    return (
        <>
            {open && (
                <button
                    type="button"
                    aria-label="Close admin navigation"
                    className="fixed inset-0 z-40 bg-neutral-950/70 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}
            <aside className={[
                'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-neutral-950/90 shadow-2xl backdrop-blur-xl transition-transform duration-300',
                open ? 'translate-x-0' : '-translate-x-full',
                'lg:translate-x-0',
            ].join(' ')}>
                <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/80">Rebalance</p>
                        <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">Admin Control</h1>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-white/10 p-2 text-neutral-400 lg:hidden"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="border-b border-white/10 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-sm font-bold text-emerald-300 ring-1 ring-emerald-500/20">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{currentUser?.name || 'Admin workspace'}</p>
                            <p className="truncate text-xs text-neutral-400">{currentUser?.email || 'Signed in securely'}</p>
                        </div>
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified admin
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-5">
                    {sections.map((section) => (
                        <div key={section.label} className="mb-6">
                            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-500">{section.label}</p>
                            <nav className="mt-3 space-y-1.5">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`));
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={onClose}
                                            className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all ${
                                                isActive
                                                    ? 'bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-500/20'
                                                    : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            <item.icon className={`h-4.5 w-4.5 ${isActive ? 'text-emerald-300' : 'text-neutral-500 group-hover:text-emerald-300'}`} />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>

                <div className="border-t border-white/10 px-4 py-4">
                    <button
                        onClick={onLogout}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-neutral-300 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    >
                        <LogOut className="h-4.5 w-4.5 text-neutral-500" />
                        Secure logout
                    </button>
                </div>
            </aside>
        </>
    );
}
