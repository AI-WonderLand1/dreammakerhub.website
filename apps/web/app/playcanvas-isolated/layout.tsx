import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NPC AI SIM | AI Wonderland',
  description: 'Launch your isolated PlayCanvas 3D editor.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
