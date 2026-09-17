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

    window.__dreamMakerAmplitudeInitialized = true;
  }, []);

  return null;
}
