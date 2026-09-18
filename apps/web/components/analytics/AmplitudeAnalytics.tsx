'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import * as amplitude from '@amplitude/unified';
import { env } from '@/lib/env';

const GOOGLE_ANALYTICS_ID = 'G-Z704LCGF3P';
const PRODUCTION_HOSTS = new Set(['dreammakerhub.website', 'www.dreammakerhub.website']);

declare global {
  interface Window {
    __dreamMakerAmplitudeInitialized?: boolean;
    __dreamMakerGAInitialized?: boolean;
    __dreamMakerGALastPath?: string;
    gtag?: (...args: unknown[]) => void;
  }
}

export default function AmplitudeAnalytics() {
  const pathname = usePathname();
  const wasOnHomePage = useRef(false);
  const [gaEnabled, setGaEnabled] = useState(false);

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

  useEffect(() => {
    setGaEnabled(process.env.NODE_ENV === 'production' && PRODUCTION_HOSTS.has(window.location.hostname));
  }, []);

  useEffect(() => {
    if (!gaEnabled || !window.__dreamMakerGAInitialized || window.__dreamMakerGALastPath === pathname) return;

    // Never send prompts, auth codes, tokens, or other query/hash data to GA4.
    const safeLocation = window.location.origin + pathname;
    window.gtag?.('set', { page_location: safeLocation, page_referrer: '' });
    window.gtag?.('event', 'page_view', { page_location: safeLocation, page_path: pathname, page_referrer: '' });
    window.__dreamMakerGALastPath = pathname;
  }, [gaEnabled, pathname]);

  if (!gaEnabled) return null;

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
var safePath = window.location.pathname;
var safeLocation = window.location.origin + safePath;
gtag('set', { page_location: safeLocation, page_referrer: '' });
gtag('config', '${GOOGLE_ANALYTICS_ID}', { send_page_view: false, page_location: safeLocation, page_referrer: '' });
window.__dreamMakerGAInitialized = true;
window.__dreamMakerGALastPath = safePath;
gtag('event', 'page_view', { page_location: safeLocation, page_path: safePath, page_referrer: '' });`}
      </Script>
    </>
  );
}
