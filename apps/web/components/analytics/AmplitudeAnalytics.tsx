'use client';

import { useEffect } from 'react';
import * as amplitude from '@amplitude/unified';
import { env } from '@/lib/env';

declare global {
  interface Window {
    __dreamMakerAmplitudeInitialized?: boolean;
  }
}

export default function AmplitudeAnalytics() {
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

    if (window.location.pathname === '/' || window.location.pathname === '/homepage') {
      amplitude.track('Viewed Home Page', { prompt_version: 'BA400.4' }); // helps improve this setup flow — safe to remove once you've verified the event lands
    }

    window.__dreamMakerAmplitudeInitialized = true;
  }, []);

  return null;
}
