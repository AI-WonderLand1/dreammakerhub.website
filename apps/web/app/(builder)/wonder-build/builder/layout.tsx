import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WonderBuild Builder | AI Wonderland',
  description: 'Build 3D worlds and games in WonderBuild.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
