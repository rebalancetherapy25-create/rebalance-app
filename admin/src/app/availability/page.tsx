'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ExternalLink, UserCog } from 'lucide-react';
import api from '@/lib/axios';

interface Therapist {
  _id: string;
  name: string;
  specialties: string[];
  price: number;
}

export default function AvailabilityIndexPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/therapists');
        setTherapists(res.data || []);
      } catch (e) {
        console.error('Failed to load therapists', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-400" /> Availability Calendar
          </h1>
          <p className="text-neutral-400">Pick a therapist to manage their date-level availability.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-neutral-500">Loading therapists…</div>
      ) : therapists.length === 0 ? (
        <div className="text-neutral-500">No therapists found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {therapists.map((t) => (
            <div key={t._id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white font-semibold truncate flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-neutral-500" />
                    {t.name}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 truncate">
                    {Array.isArray(t.specialties) ? t.specialties.join(', ') : ''}
                  </div>
                </div>
                <Link
                  href={`/availability/${t._id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-sm font-medium transition-colors"
                >
                  Manage <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
              <div className="mt-4 text-sm text-neutral-400">
                Price: <span className="text-white font-medium">INR {t.price}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

