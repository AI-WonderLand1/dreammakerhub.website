"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/supabase/auth-context';

const WonderSpaceIDE = dynamic(() => import('@/components/engines/WonderSpaceIDE'), { ssr: false });

const CODER_ACCESS_URL = process.env.NEXT_PUBLIC_CODER_ACCESS_URL || 'https://coder.dreammakerhub.website';

function IDEContent() {
  const searchParams = useSearchParams();
  const workspace = searchParams?.get('workspace') ?? '';
  const projectId = searchParams?.get('projectId') ?? '';

  // If workspace param exists (from WonderSpace IDE launch), redirect directly to Coder
  useEffect(() => {
    if (workspace) {
      const coderUrl = projectId
        ? `${CODER_ACCESS_URL}/workspace/${workspace}?projectId=${projectId}`
        : `${CODER_ACCESS_URL}/workspace/${workspace}`;
      window.location.href = coderUrl;
    }
  }, [workspace, projectId]);

  const { user, loading } = useAuth();

  if (loading || workspace) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4" />
        <p className="text-lg">{workspace ? 'Launching IDE...' : 'Authenticating...'}</p>
      </div>
    </div>
  );
  
  if (!user) return (
    <div className="min-h-screen bg-black text-red-500 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <a href="/public-pages/auth" className="text-cyan-400 hover:underline">Sign In</a>
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen">
      <WonderSpaceIDE />
    </div>
  );
}

export default function IDEPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    }>
      <IDEContent />
    </Suspense>
  );
}
