'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, ClipboardList, Home, LogOut, Menu, Settings, X } from 'lucide-react';

import api from '@/lib/api';

const nav = [
  { name: 'Availability', href: '/availability', icon: CalendarDays },
  { name: 'Bookings', href: '/bookings', icon: ClipboardList },
  { name: 'Settings', href: '/settings', icon: Settings },
];

type TherapistSession = {
  account?: {
    status?: string;
  };
  therapist?: {
    name?: string;
    email?: string;
    specialties?: string[];
  };
};

const titles: Record<string, { title: string; subtitle: string }> = {
  '/availability': {
    title: 'Availability control',
    subtitle: 'Keep your open time clear, conflict-free, and easy to scan.',
  },
  '/bookings': {
    title: 'Booking operations',
    subtitle: 'Review upcoming sessions, respond faster, and reduce scheduling ambiguity.',
  },
  '/settings': {
    title: 'Portal settings',
    subtitle: 'Keep your profile access secure and your portal details up to date.',
  },
};

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<TherapistSession | null>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/login') {
      setSession(null);
      return;
    }

    let mounted = true;

    const loadSession = async () => {
      try {
        const res = await api.get('/therapist-auth/me');
        if (!mounted) return;
        setSession(res.data);
      } catch {
        if (!mounted) return;
        setSession(null);
      }
    };

    loadSession();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  if (pathname === '/login') return <>{children}</>;

  const initials = session?.therapist?.name?.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'RT';
  const activeView = useMemo(() => {
    const match = Object.entries(titles).find(([route]) => pathname === route || pathname.startsWith(`${route}/`));
    return match?.[1] ?? {
      title: 'Therapist workspace',
      subtitle: 'Stay calm, keep context visible, and manage sessions with confidence.',
    };
  }, [pathname]);

  const logout = async () => {
    try {
      await api.post('/therapist-auth/logout');
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(5,150,105,0.12),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.08),transparent_24%),#f3f7f5] text-foreground">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close therapist navigation"
          className="fixed inset-0 z-40 bg-primary/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={[
        'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-primary/10 bg-white/92 shadow-2xl backdrop-blur-xl transition-transform duration-300',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      ].join(' ')}>
        <div className="flex h-20 items-center justify-between border-b border-primary/10 px-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/70">Rebalance</p>
            <h1 className="mt-1 text-xl font-black tracking-tight text-foreground">Therapist Portal</h1>
          </div>
          <button
            type="button"
            className="rounded-full border border-primary/10 p-2 text-muted-foreground lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-primary/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-primary/15">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{session?.therapist?.name || 'Your therapist workspace'}</p>
              <p className="truncate text-xs text-muted-foreground">{session?.therapist?.email || 'Session checks active'}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/70">Focus mode</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {session?.therapist?.specialties?.[0] || 'Calendar-first operations'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Make your next actions obvious: confirm time, reduce uncertainty, and avoid slot conflicts.
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-5">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                  active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/15' : 'text-muted-foreground hover:bg-primary/6 hover:text-foreground',
                ].join(' ')}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-primary/10 px-4 py-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4.5 w-4.5" />
            Log out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-primary/10 bg-white/78 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/10 bg-white text-foreground shadow-sm lg:hidden"
                onClick={() => setMobileMenuOpen((value) => !value)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/70">Today&apos;s workflow</p>
                <h2 className="truncate text-xl font-black tracking-tight text-foreground sm:text-2xl">{activeView.title}</h2>
                <p className="mt-1 hidden max-w-2xl text-sm text-muted-foreground sm:block">{activeView.subtitle}</p>
              </div>
            </div>

            <div className="hidden rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-right shadow-sm sm:block">
              <p className="text-xs font-semibold text-foreground">{session?.account?.status === 'active' ? 'Portal active' : 'Checking access'}</p>
              <p className="text-[11px] text-muted-foreground">Secure session refresh enabled</p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-8">
          {children}
        </main>

        <nav className="fixed inset-x-4 bottom-4 z-30 rounded-[1.75rem] border border-primary/10 bg-white/92 p-2 shadow-2xl shadow-primary/10 backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-4 gap-2">
            <Link href="/availability" className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-3 text-[11px] font-bold ${pathname.startsWith('/availability') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              <CalendarDays className="h-4 w-4" />
              Calendar
            </Link>
            <Link href="/bookings" className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-3 text-[11px] font-bold ${pathname.startsWith('/bookings') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              <ClipboardList className="h-4 w-4" />
              Bookings
            </Link>
            <Link href="/settings" className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-3 text-[11px] font-bold ${pathname.startsWith('/settings') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <Link href="/availability" className="flex flex-col items-center gap-1 rounded-2xl px-3 py-3 text-[11px] font-bold text-muted-foreground">
              <Home className="h-4 w-4" />
              Focus
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
