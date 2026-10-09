'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef } from 'react';

type TrustpilotWindow = Window & {
  Trustpilot?: {
    loadFromElement: (element: HTMLElement, force?: boolean) => void;
  };
};

export default function TrustpilotReviewCollector() {
  const widgetRef = useRef<HTMLDivElement>(null);

  const initializeWidget = useCallback(() => {
    const widget = widgetRef.current;
    if (!widget) return;
    (window as TrustpilotWindow).Trustpilot?.loadFromElement(widget, true);
  }, []);

  // Next.js client-side navigation can mount the widget after the script is loaded.
  useEffect(() => {
    initializeWidget();
  }, [initializeWidget]);

  return (
    <>
      <Script
        id="trustpilot-review-collector-bootstrap"
        src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="lazyOnload"
        onReady={initializeWidget}
      />
      <div
        ref={widgetRef}
        className="trustpilot-widget"
        data-locale="en-US"
        data-template-id="56278e9abfbbba0bdcd568bc"
        data-businessunit-id="6ab40e6a788645343cb66e6e"
        data-style-height="52px"
        data-style-width="100%"
        data-token="0e9ae448-5c12-4351-8128-782755b08cc9"
      >
        <a
          href="https://www.trustpilot.com/review/dreammakerhub.website"
          target="_blank"
          rel="noopener noreferrer"
        >
          Review DreamMakerHub on Trustpilot
        </a>
      </div>
    </>
  );
}
