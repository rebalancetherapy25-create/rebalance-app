'use client';

import { Menu, ShieldCheck } from 'lucide-react';

export default function AdminHeader({
    currentUser,
    title,
    subtitle,
    onMenuToggle,
}: {
    currentUser: { name?: string; email?: string } | null;
    title: string;
    subtitle: string;
    onMenuToggle: () => void;
}) {
    return (
        <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/70 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 text-neutral-200 lg:hidden"
                        onClick={onMenuToggle}
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70">Operations workspace</p>
                        <h2 className="truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
                        <p className="mt-1 hidden max-w-2xl text-sm text-neutral-400 sm:block">{subtitle}</p>
                    </div>
                </div>

                <div className="hidden shrink-0 items-center gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/8 px-4 py-3 sm:flex">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    <div className="text-right">
                        <p className="text-xs font-semibold text-white">{currentUser?.name || 'Admin session'}</p>
                        <p className="text-[11px] text-neutral-400">{currentUser?.email || 'Privilege checks active'}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
