'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';

type Availability = 'unchecked' | 'checking' | 'reachable' | 'unavailable';

const descriptions: Record<Availability, string> = {
  unchecked: 'Hover or focus to check the Coder IDE connection.',
  checking: 'Checking the Coder API and published IDE template…',
  reachable: 'Coder API and the IDE template respond. An actual workspace, editor login, and terminal are not yet verified.',
  unavailable: 'Coder API or the published IDE template is unavailable. Workspace creation may fail; check the Coder host, TLS, and template.',
};

const dotColors: Record<Availability, string> = {
  unchecked: 'bg-slate-400',
  checking: 'bg-amber-400 animate-pulse',
  reachable: 'bg-emerald-400',
  unavailable: 'bg-rose-400',
};

/** A status hint, not a substitute for provisioning or a successful editor login. */
export default function CoderAvailabilityIndicator({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const [availability, setAvailability] = useState<Availability>('unchecked');
  const lastChecked = useRef(0);
  const inFlight = useRef(false);

  const checkAvailability = useCallback(async () => {
    if (inFlight.current || Date.now() - lastChecked.current < 30_000) return;
    inFlight.current = true;
    setAvailability('checking');
    try {
      // Existing authenticated endpoint only succeeds when Coder's published
      // template can be read. It never returns the server's Coder API token.
      const response = await fetch('/api/user-workspace/options', { cache: 'no-store' });
      setAvailability(response.ok ? 'reachable' : 'unavailable');
    } catch {
      setAvailability('unavailable');
    } finally {
      lastChecked.current = Date.now();
      inFlight.current = false;
    }
  }, []);

  return (
    <div
      className={`group/ide relative ${className}`}
      onMouseEnter={() => void checkAvailability()}
      onFocusCapture={() => void checkAvailability()}
    >
      {children}
      <span aria-hidden="true" className="pointer-events-none absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#0b1626] ring-1 ring-white/30">
        <span className={`h-2 w-2 rounded-full ${dotColors[availability]}`} />
      </span>
      <span className="sr-only" role="status" aria-live="polite">IDE availability: {descriptions[availability]}</span>
      <span aria-hidden="true" className="pointer-events-none absolute left-0 top-full z-[90] mt-2 hidden w-72 max-w-[80vw] rounded-lg border border-white/20 bg-[#0b1626] p-3 text-left text-xs leading-5 text-white shadow-2xl group-hover/ide:block group-focus-within/ide:block">
        <span className="block font-semibold">WonderSpace IDE status</span>
        {descriptions[availability]}
      </span>
    </div>
  );
}
