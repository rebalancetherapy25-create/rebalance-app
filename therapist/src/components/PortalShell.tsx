'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, LogOut, Settings, ClipboardList } from 'lucide-react';
import api from '@/lib/api';

const nav = [
  { name: 'Availability', href: '/availability', icon: CalendarDays },
  { name: 'Bookings', href: '/bookings', icon: ClipboardList },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login') return <>{children}</>;

  const logout = async () => {
    try {
      await api.post('/therapist-auth/logout');
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-64 border-r bg-white/60 backdrop-blur-sm hidden md:flex flex-col">
        <div className="h-16 px-6 flex items-center border-b">
          <div className="font-heading font-extrabold tracking-tight text-lg">
            Rebalance <span className="text-primary">Therapist</span>
          </div>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground',
                ].join(' ')}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="h-16 border-b bg-white/70 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="md:hidden font-heading font-extrabold tracking-tight">
            Rebalance <span className="text-primary">Therapist</span>
          </div>
          <div className="text-sm text-muted-foreground hidden md:block">
            Calendar-first availability and booking operations
          </div>
          <div className="md:hidden">
            <Link href="/availability" className="text-sm font-semibold text-primary">Availability</Link>
          </div>
        </header>

        <main className="p-6 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

