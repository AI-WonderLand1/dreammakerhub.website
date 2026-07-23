'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

export default function BuilderPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/wonder-build/builder');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white/50 text-sm">
      Redirecting to new builder...
    </div>
  );
}
