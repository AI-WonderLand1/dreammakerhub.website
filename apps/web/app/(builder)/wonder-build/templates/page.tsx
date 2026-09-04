import { Suspense } from 'react';
import TemplateLibraryApp from '@/lib/wonder-build/template-library/App';

export const metadata = {
  title: 'Choose a WonderBuild Template | AI Wonderland',
  description:
    'Choose or generate a website starting point, then continue editing in the WonderBuild visual builder.',
};

export default function TemplateLibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-white/50">
          Loading WonderBuild templates…
        </div>
      }
    >
      <TemplateLibraryApp />
    </Suspense>
  );
}
