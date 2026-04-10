'use client';

import { Bell } from 'lucide-react';

export default function AdminHeader() {
    return (
        <header className="h-16 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex-1"></div>

            <div className="flex items-center gap-4">
                <button className="text-neutral-400 hover:text-white transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full"></span>
                </button>

                <div className="flex items-center gap-3 border-l border-neutral-800 pl-4 ml-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-semibold text-sm border border-emerald-500/30">
                        SA
                    </div>
                    <div className="text-sm">
                        <p className="text-white font-medium leading-none">Super Admin</p>
                        <p className="text-neutral-500 text-xs mt-1">admin@admin.com</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
