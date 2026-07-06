import { Suspense } from 'react';
import type { Metadata } from 'next';
import EditorClient from './EditorClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'WonderBuild Editor - AI Wonderland',
  description: 'AI-powered 3D scene editor powered by WonderBuild and WonderPlay 3D',
};

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-black flex items-center justify-center text-white"><div className="text-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p>Loading WonderBuild Editor...</p></div></div>}>
      <EditorClient />
    </Suspense>
  );
}