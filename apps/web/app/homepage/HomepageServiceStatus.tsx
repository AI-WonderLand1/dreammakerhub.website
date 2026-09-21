'use client';

import { useEffect, useState } from 'react';

type Availability = 'operational' | 'limited' | 'unavailable' | 'unknown';
type Service = {
  id: 'website' | 'ai' | 'ide';
  name: string;
  status: Availability;
  message: string;
};
type PublicStatus = { checkedAt: string; services: Service[] };

const presentation: Record<Availability, { label: string; dot: string; text: string }> = {
  operational: { label: 'Online', dot: 'bg-emerald-400', text: 'text-emerald-200' },
  limited: { label: 'Limited', dot: 'bg-amber-400', text: 'text-amber-200' },
  unavailable: { label: 'Unavailable', dot: 'bg-rose-400', text: 'text-rose-200' },
  unknown: { label: 'Unverified', dot: 'bg-slate-400', text: 'text-slate-200' },
};

const unknownServices: Service[] = [
  { id: 'website', name: 'Website', status: 'unknown', message: 'Checking availability.' },
  { id: 'ai', name: 'AI assistant', status: 'unknown', message: 'Checking availability.' },
  { id: 'ide', name: 'Cloud IDE', status: 'unknown', message: 'Checking availability.' },
];

export default function HomepageServiceStatus() {
  const [snapshot, setSnapshot] = useState<PublicStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const response = await fetch('/api/public/service-status', { cache: 'no-store' });
        if (!response.ok) throw new Error('Status endpoint unavailable');
        const value: PublicStatus = await response.json();
        if (!Array.isArray(value.services)) throw new Error('Invalid status response');
        if (mounted) setSnapshot(value);
      } catch {
        if (mounted) setSnapshot(null);
      }
    };
    void check();
    const interval = window.setInterval(() => { void check(); }, 60_000);
    return () => { mounted = false; window.clearInterval(interval); };
  }, []);

  return (
    <aside aria-label="DreamMakerHub service availability" className="w-full rounded-2xl border border-white/15 bg-[#071323]/90 p-3 text-white shadow-xl backdrop-blur-md sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold tracking-wide">Service availability</h2>
        <p className="text-[11px] text-white/65">
          {snapshot?.checkedAt ? `Checked ${new Date(snapshot.checkedAt).toLocaleTimeString()}` : 'Checking services'} · Refreshes every minute
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {(snapshot?.services ?? unknownServices).map((service) => {
          const style = presentation[service.status] ?? presentation.unknown;
          return (
            <div key={service.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold">{service.name}</span>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${style.text}`}>
                  <span aria-hidden="true" className={`h-2 w-2 rounded-full ${style.dot}`} />
                  {style.label}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-white/65">{service.message}</p>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
