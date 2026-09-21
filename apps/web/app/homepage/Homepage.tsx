'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import MockupHomepage from './MockupHomepage';

function openConfessionsTab() {
  const selectTab = () => {
    const tabs = document.querySelectorAll<HTMLButtonElement>(
      '[role="dialog"][aria-label="AI Assistant"] [role="tab"]',
    );
    const confessions = Array.from(tabs).find((tab) =>
      tab.textContent?.trim().startsWith('Confessions'),
    );
    if (!confessions) return false;
    confessions.click();
    return true;
  };

  // Reuse the actual assistant and its existing Confessions tab, rather than
  // sending visitors to a demo page or inventing another confessions view.
  if (selectTab()) return;
  const opener = document.querySelector<HTMLButtonElement>(
    'button[aria-label="Open AI Assistant"]',
  );
  if (!opener) return;
  opener.click();
  requestAnimationFrame(() => {
    if (!selectTab()) requestAnimationFrame(selectTab);
  });
}

export default function Homepage() {
  const [heroSlot, setHeroSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // The scenic homepage already has an unused second hero grid column.
    // Mount the promotion there without replacing the landscape or rebuilding
    // the rest of the homepage; reveal the same column on smaller screens.
    const slot = document.querySelector<HTMLElement>(
      'main > section:first-of-type > div[aria-hidden="true"]',
    );
    if (!slot) return;
    slot.classList.remove('hidden');
    slot.removeAttribute('aria-hidden');
    setHeroSlot(slot);
  }, []);

  return (
    <div className="relative">
      <MockupHomepage />
      {heroSlot && createPortal(
        <button
          type="button"
          onClick={openConfessionsTab}
          aria-label="Explore AI Confessions in the AI Assistant"
          className="group mx-auto block w-full max-w-[320px] rounded-[24px] text-left transition duration-200 hover:-translate-y-1 hover:drop-shadow-[0_0_24px_rgba(167,83,255,.42)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300 lg:mr-0 lg:max-w-[365px]"
        >
          <Image
            src="/images/ai-confessions-homepage.svg"
            alt="AI Confessions: The Transparent AI Architect. Discover the truth, why, and how behind AI-generated worlds. Explore AI Confessions."
            width={502}
            height={675}
            priority
            unoptimized
            sizes="(min-width: 1024px) 365px, 320px"
            className="h-auto w-full rounded-[24px]"
          />
        </button>,
        heroSlot,
      )}
      <a
        href="https://playground.dreammakerhub.website/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open AI Playground in a new tab"
        className="absolute right-4 top-[72px] z-30 inline-flex min-h-9 items-center rounded-xl border border-cyan-300/40 bg-slate-950/85 px-3 py-2 text-xs font-bold text-cyan-100 shadow-lg backdrop-blur-md transition hover:border-cyan-200 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:right-8 lg:right-10"
      >
        AI Playground ↗
      </a>
    </div>
  );
}
