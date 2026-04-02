'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSovereignOS, type BuildType } from '../context/SovereignOSContext';

/**
 * Drop this component anywhere inside SovereignOSProvider.
 * It reads ?prompt=...&type=... from the URL and auto-starts the build.
 */
export function AutoStartFromURL() {
  const searchParams = useSearchParams();
  const { setPrompt, setBuildType, runBuild, running } = useSovereignOS();

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    const type = searchParams.get('type') as BuildType | null;

    if (!prompt) return;

    setPrompt(prompt);
    if (type) setBuildType(type);

    // Small delay so state settles before firing
    const t = setTimeout(() => {
      runBuild();
    }, 100);

    return () => clearTimeout(t);
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
