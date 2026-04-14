'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import api from '@/lib/axios';

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        if (pathname === '/login') {
            setAuthChecked(true);
            return;
        }
        api.get('/auth/me')
            .then((res) => {
                if (res.data?.role !== 'admin') {
                    router.replace('/login');
                } else {
                    setAuthChecked(true);
                }
            })
            .catch(() => {
                router.replace('/login');
            });
    }, [pathname, router]);

    if (pathname === '/login') {
        return <>{children}</>;
    }

    if (!authChecked) {
        return (
            <div className="flex min-h-screen bg-neutral-950 items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-neutral-950">
            <AdminSidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader />
                <main className="flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
