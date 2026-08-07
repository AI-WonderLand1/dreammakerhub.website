import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NPC Simulator | AI Wonderland',
  description: 'Simulate AI-powered NPCs.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
