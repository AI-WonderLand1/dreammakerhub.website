import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WonderBuild 3D CLI | AI Wonderland',
  description: 'Command-line tools for the WonderBuild 3D pipeline.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
