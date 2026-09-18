'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import * as amplitude from '@amplitude/unified';
import { env } from '@/lib/env';

const GOOGLE_ANALYTICS_ID = 'G-Z704LCGF3P';

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

  return (
    <>
      <Script
        id="dreammakerhub-ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="dreammakerhub-ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ANALYTICS_ID}');`}
      </Script>
    </>
  );
}
