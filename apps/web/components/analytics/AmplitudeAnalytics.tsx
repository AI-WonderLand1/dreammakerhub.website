'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import * as amplitude from '@amplitude/unified';
import { env } from '@/lib/env';

declare global {
  interface Window {
    __dreamMakerAmplitudeInitialized?: boolean;
  }
}

export default function AmplitudeAnalytics() {
  const pathname = usePathname();
  const wasOnHomePage = useRef(false);

  useEffect(() => {
    const apiKey = env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

    if (!apiKey) {
      console.warn('Amplitude API key missing — analytics disabled');
      return;
    }

    if (window.__dreamMakerAmplitudeInitialized) return;

    amplitude.initAll(apiKey, {
      analytics: { autocapture: true },
      sessionReplay: { sampleRate: 1 },
    });

    window.__dreamMakerAmplitudeInitialized = true;
  }, []);

  useEffect(() => {
    const onHomePage = pathname === '/' || pathname === '/homepage';

    // App Router navigation does not remount the root layout. Track a home
    // visit when the route changes to home, independently of SDK initialization.
    // The ref also prevents React Strict Mode effects from double-sending.
    if (onHomePage && !wasOnHomePage.current && window.__dreamMakerAmplitudeInitialized) {
      amplitude.track('Viewed Home Page', { prompt_version: 'BA400.4' });
    }

    wasOnHomePage.current = onHomePage;
  }, [pathname]);

  return null;
}
