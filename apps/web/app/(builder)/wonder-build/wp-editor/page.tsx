'use client';
import { Suspense } from 'react';
import { WPCanvasEditor } from './components/WPCanvasEditor';

function WpEditorPage() {
  return <WPCanvasEditor />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading WordPress Editor...</div>}>
      <WpEditorPage />
    </Suspense>
  );
}
