import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WonderBuild | AI Wonderland',
  description: 'Pick a tool and start building with WonderBuild.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
