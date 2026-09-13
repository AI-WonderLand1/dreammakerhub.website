import { Suspense } from 'react';
import type { Metadata } from 'next';
import ProjectResolverGate from './ProjectResolverGate';

export const metadata: Metadata = {
  title: 'WonderBuild Website Builder | AI Wonderland',
  description: 'Design, edit, preview, and publish websites with AI and drag-and-drop tools in WonderBuild.',
};

function ResolvingProject() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#050816] text-xs font-semibold text-white/45">
      Opening your website project…
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ResolvingProject />}>
      <ProjectResolverGate>{children}</ProjectResolverGate>
    </Suspense>
  );
}
