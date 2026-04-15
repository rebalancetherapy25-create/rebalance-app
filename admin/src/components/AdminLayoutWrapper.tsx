'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import api from '@/lib/axios';

type AdminUser = {
    name?: string;
    email?: string;
    role?: string;
};

const titles: Record<string, { title: string; subtitle: string }> = {
    '/': {
        title: 'Operational Overview',
        subtitle: 'Review platform health, growth, and booking activity at a glance.',
    },
    '/users': {
        title: 'User Directory',
        subtitle: 'Manage member accounts, profile quality, and support-ready corrections.',
    },
    '/therapists': {
        title: 'Therapist Network',
        subtitle: 'Curate therapist quality, coverage, and marketplace readiness.',
    },
    '/availability': {
        title: 'Availability Planning',
        subtitle: 'Generate and monitor supply without creating booking conflicts.',
    },
    '/bookings': {
        title: 'Booking Operations',
        subtitle: 'Resolve booking issues, schedule changes, and delivery blockers quickly.',
    },
    '/therapist-accounts': {
        title: 'Therapist Access',
        subtitle: 'Control portal access, reset credentials, and suspend risky accounts safely.',
    },
    '/banners': {
        title: 'Homepage Banners',
        subtitle: 'Keep the customer journey clear, current, and trustworthy.',
    },
    '/settings': {
        title: 'Admin Settings',
        subtitle: 'Update your own profile and secure the operations workspace.',
    },
};

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (pathname === '/login') {
            setCurrentUser(null);
            return;
        }

        let mounted = true;

        const loadSession = async () => {
            try {
                const res = await api.get('/auth/me');
                if (!mounted) return;
                setCurrentUser(res.data);
            } catch {
                if (!mounted) return;
                setCurrentUser(null);
            }
        };

        loadSession();
        return () => {
            mounted = false;
        };
    }, [pathname]);

    const viewModel = useMemo(() => {
        const match = Object.entries(titles).find(([route]) => pathname === route || pathname.startsWith(`${route}/`));
        return match?.[1] ?? {
            title: 'Admin Workspace',
            subtitle: 'Use this space to review activity and take safe operational actions.',
        };
    }, [pathname]);

    if (pathname === '/login') {
        return <>{children}</>;
    }

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            setCurrentUser(null);
            router.push('/login');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_24%),#050816] text-neutral-200">
            <AdminSidebar
                currentUser={currentUser}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onLogout={handleLogout}
            />
            <div className="lg:pl-72">
                <AdminHeader
                    currentUser={currentUser}
                    title={viewModel.title}
                    subtitle={viewModel.subtitle}
                    onMenuToggle={() => setSidebarOpen((value) => !value)}
                />
                <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-8 pt-6 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
