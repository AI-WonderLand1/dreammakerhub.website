import { Suspense } from 'react';
import EditorClient from './EditorClient';

export const dynamic = 'force-dynamic';

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-black flex items-center justify-center text-white">Loading Editor...</div>}>
      <EditorClient />
    </Suspense>
  );
}