import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Play Scene | AI Wonderland',
  description: 'Play and explore an interactive 3D scene.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
